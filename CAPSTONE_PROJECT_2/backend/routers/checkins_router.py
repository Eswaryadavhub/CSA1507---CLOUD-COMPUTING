import io
import csv
import datetime
from fastapi import APIRouter, HTTPException, Query, UploadFile, File, status
from pydantic import BaseModel
from typing import Optional, List

from backend.database.connection import execute_query, execute_dml, get_oracle_connection, OracleNotConnectedException
from backend.database.manager import require_oracle, commit_validated_ingestion, get_attraction_by_name

router = APIRouter(prefix="/api/checkins", tags=["Check-in & Telemetry Ingestion"])

class CheckinInput(BaseModel):
    tourist_code: str
    attraction_id: int
    city: str
    latitude: float
    longitude: float
    visit_date: Optional[str] = None
    visit_time: Optional[str] = None
    source: Optional[str] = "travel_app"
    duration: Optional[int] = 60

@router.get("")
@router.get("/")
def list_checkins(
    city: Optional[str] = Query(None, description="Filter by city"),
    attraction_id: Optional[int] = Query(None, description="Filter by attraction ID"),
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0)
):
    """Queries check-in telemetry records directly from Oracle Database."""
    try:
        require_oracle()
        where_clauses = ["1=1"]
        params = {}
        if city and city.lower() != "all":
            where_clauses.append("LOWER(c.city) = LOWER(:city)")
            params["city"] = city
        if attraction_id:
            where_clauses.append("c.attraction_id = :attraction_id")
            params["attraction_id"] = attraction_id

        where_sql = " AND ".join(where_clauses)
        params["max_row"] = offset + limit
        params["min_row"] = offset

        paged_sql = f"""
            SELECT * FROM (
                SELECT a.*, ROWNUM rnum FROM (
                    SELECT c.checkin_id, c.tourist_id, NVL(t.tourist_code, 'ANONYMOUS') AS tourist_code, 
                           c.attraction_id, att.attraction_name, c.city, 
                           TO_CHAR(c.checkin_timestamp, 'YYYY-MM-DD HH24:MI:SS') AS checkin_timestamp,
                           c.latitude, c.longitude, c.source, c.visit_duration, c.crowd_level
                    FROM CHECKINS c
                    JOIN ATTRACTIONS att ON c.attraction_id = att.attraction_id
                    LEFT JOIN TOURISTS t ON c.tourist_id = t.tourist_id
                    WHERE {where_sql}
                    ORDER BY c.checkin_timestamp DESC
                ) a WHERE ROWNUM <= :max_row
            ) WHERE rnum > :min_row
        """

        rows = execute_query(paged_sql, params)
        return rows
    except OracleNotConnectedException as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database query error: {str(e)}")

@router.post("", status_code=status.HTTP_201_CREATED)
@router.post("/", status_code=status.HTTP_201_CREATED)
def record_checkin(data: CheckinInput):
    """Inserts an operational tourist check-in into Oracle Database with deduplication."""
    try:
        require_oracle()
        
        # 1. Validate attraction exists
        attrs = execute_query("SELECT attraction_id, attraction_name, city, capacity FROM ATTRACTIONS WHERE attraction_id = :aid", {"aid": data.attraction_id})
        if not attrs:
            raise HTTPException(status_code=404, detail=f"Attraction with ID {data.attraction_id} does not exist in Oracle Database.")
        attr = attrs[0]

        # 2. Get or create tourist record
        tourists = execute_query("SELECT tourist_id FROM TOURISTS WHERE tourist_code = :tcode", {"tcode": data.tourist_code})
        if tourists:
            tourist_id = tourists[0]["tourist_id"]
        else:
            execute_dml(
                "INSERT INTO TOURISTS (tourist_code, device_type, source) VALUES (:tcode, :dev, :src)",
                {"tcode": data.tourist_code, "dev": data.source or "travel_app", "src": data.source or "travel_app"}
            )
            tourists = execute_query("SELECT tourist_id FROM TOURISTS WHERE tourist_code = :tcode", {"tcode": data.tourist_code})
            tourist_id = tourists[0]["tourist_id"]

        # 3. Timestamp calculation
        if data.visit_date and data.visit_time:
            try:
                time_val = data.visit_time.strip()
                if len(time_val) == 5:
                    time_val += ":00"
                dt_str = f"{data.visit_date} {time_val}"
                dt = datetime.datetime.strptime(dt_str, "%Y-%m-%d %H:%M:%S")
            except Exception:
                dt = datetime.datetime.now()
        else:
            dt = datetime.datetime.now()

        # 4. Check for duplicate within 15 minutes window
        window_start = dt - datetime.timedelta(minutes=15)
        window_end = dt + datetime.timedelta(minutes=15)
        
        dups = execute_query("""
            SELECT checkin_id FROM CHECKINS 
            WHERE tourist_id = :tid 
              AND attraction_id = :aid 
              AND checkin_timestamp BETWEEN :w_start AND :w_end
        """, {
            "tid": tourist_id,
            "aid": data.attraction_id,
            "w_start": window_start,
            "w_end": window_end
        })
        if dups:
            raise HTTPException(
                status_code=409, 
                detail=f"Duplicate check-in detected: Tourist {data.tourist_code} already checked into {attr['attraction_name']} within the 15-minute window."
            )

        # 5. Crowd level
        hour = dt.hour
        is_peak = (10 <= hour <= 12) or (16 <= hour <= 19)
        crowd_val = "High" if is_peak else ("Moderate" if 13 <= hour <= 15 else "Low")

        # 6. Insert into CHECKINS
        execute_dml("""
            INSERT INTO CHECKINS (
                tourist_id, attraction_id, city, checkin_timestamp,
                latitude, longitude, source, visit_duration, crowd_level
            ) VALUES (
                :tid, :aid, :city, :ts,
                :lat, :lon, :src, :dur, :crowd
            )
        """, {
            "tid": tourist_id,
            "aid": data.attraction_id,
            "city": data.city or attr["city"],
            "ts": dt,
            "lat": data.latitude,
            "lon": data.longitude,
            "src": data.source or "travel_app",
            "dur": data.duration or 60,
            "crowd": crowd_val
        })

        return {
            "status": "success",
            "message": f"Successfully checked into {attr['attraction_name']} in Oracle Database.",
            "attraction": attr["attraction_name"],
            "city": attr["city"],
            "tourist_code": data.tourist_code,
            "timestamp": dt.strftime("%Y-%m-%d %H:%M:%S"),
            "crowd_level": crowd_val
        }
    except OracleNotConnectedException as e:
        raise HTTPException(status_code=503, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/upload")
async def upload_checkins_csv(file: UploadFile = File(...)):
    """Uploads and ingests a check-in telemetry CSV directly into Oracle Database."""
    try:
        require_oracle()
        if not file.filename.lower().endswith(".csv"):
            raise HTTPException(status_code=400, detail="Only standard CSV files are accepted.")

        content = await file.read()
        try:
            text = content.decode("utf-8-sig")
        except UnicodeDecodeError:
            text = content.decode("latin-1")

        reader = csv.DictReader(io.StringIO(text))
        raw_rows = list(reader)
        if not raw_rows:
            raise HTTPException(status_code=400, detail="Uploaded CSV file is empty.")

        valid_rows = []
        invalid_count = 0
        duplicate_count = 0

        # Cache existing attractions for fast name resolution
        attr_rows = execute_query("SELECT attraction_id, attraction_name, city, category, capacity FROM ATTRACTIONS")
        attr_map = {a["attraction_name"].strip().lower(): a for a in attr_rows}

        for r in raw_rows:
            t_code = r.get("tourist_code") or r.get("tourist_id") or "T_UPLOAD"
            attr_name = (r.get("attraction_name") or r.get("attraction") or "").strip()
            city = r.get("city", "Chennai")
            ts_str = r.get("checkin_timestamp") or r.get("timestamp") or datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            lat = float(r.get("latitude", 13.0475))
            lon = float(r.get("longitude", 80.2824))
            src = r.get("source", "travel_app")
            dur = int(r.get("visit_duration") or r.get("duration") or 60)

            matched = attr_map.get(attr_name.lower())
            if not matched:
                # Try fallback matching by first attraction in city
                matched = next((a for a in attr_rows if a["city"].lower() == city.lower()), attr_rows[0] if attr_rows else None)

            if matched:
                valid_rows.append({
                    "tourist_id": 1,
                    "attraction_id": matched["attraction_id"],
                    "city": matched["city"],
                    "timestamp": ts_str,
                    "latitude": lat,
                    "longitude": lon,
                    "source": src,
                    "visit_duration": dur,
                    "crowd_level": "Moderate"
                })
            else:
                invalid_count += 1

        stats = {
            "total_records": len(raw_rows),
            "valid_records": len(valid_rows),
            "invalid_records": invalid_count,
            "duplicate_records": duplicate_count
        }

        inserted = commit_validated_ingestion(file.filename, valid_rows, stats)
        return {
            "status": "success",
            "filename": file.filename,
            "total_records": len(raw_rows),
            "inserted_count": inserted,
            "message": f"Successfully ingested telemetry into Oracle Database: {inserted} records committed."
        }
    except OracleNotConnectedException as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
