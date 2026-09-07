import io
import csv
import re
from datetime import datetime, timedelta
from fastapi import APIRouter, UploadFile, File, HTTPException, Body
from pydantic import BaseModel
from typing import List, Optional

from backend.database.manager import (
    get_attraction_by_name,
    commit_validated_ingestion,
    get_ingestion_history_records,
    require_oracle,
    OracleNotConnectedException
)

router = APIRouter(prefix="/api/upload", tags=["Data Ingestion & Ingestion History"])

# In-memory session store for validated batches pending user confirmation
_pending_batches = {}

class CommitRequest(BaseModel):
    batch_id: str
    exclude_duplicates: bool = True
    exclude_potential_duplicates: bool = False

@router.post("/validate-preview")
async def validate_and_preview_csv(file: UploadFile = File(...)):
    """
    Validates uploaded CSV against schema rules, resolves attraction names,
    detects exact DUPLICATE and POTENTIAL DUPLICATE records, and returns
    a 4-state preview table without inserting into the database.
    """
    try:
        require_oracle()
    except OracleNotConnectedException as e:
        raise HTTPException(status_code=503, detail=str(e))

    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Invalid file format. Please upload a standard .csv file.")

    content = await file.read()
    try:
        text = content.decode("utf-8-sig")
    except UnicodeDecodeError:
        text = content.decode("latin-1")

    reader = csv.DictReader(io.StringIO(text))
    fieldnames = [f.strip().lower() for f in (reader.fieldnames or [])]

    # Flexible header aliases
    def find_col(aliases):
        for a in aliases:
            if a in fieldnames:
                return a
        return None

    col_tourist = find_col(["tourist_code", "tourist_id", "tourist", "user_id"])
    col_attr = find_col(["attraction_name", "attraction", "destination", "location"])
    col_city = find_col(["city", "region"])
    col_time = find_col(["timestamp", "datetime", "checkin_time", "checkin_timestamp"])
    col_lat = find_col(["latitude", "lat"])
    col_lng = find_col(["longitude", "lng", "lon"])
    col_source = find_col(["source", "device_type", "device"]) or "source"
    col_duration = find_col(["visit_duration", "duration", "duration_minutes", "dwell_time_minutes"]) or "visit_duration"

    if not all([col_tourist, col_attr, col_city, col_time, col_lat, col_lng]):
        raise HTTPException(
            status_code=422,
            detail=f"Missing required CSV columns. Required: tourist_code, attraction_name, city, timestamp, latitude, longitude. Found headers: {list(reader.fieldnames or [])}"
        )

    preview_rows = []
    valid_rows = []
    
    seen_exact_signatures = set()
    tourist_time_window = {} # (tourist, attraction) -> list of datetime

    total_count = 0
    valid_count = 0
    invalid_count = 0
    duplicate_count = 0
    potential_dup_count = 0

    # Cache attraction lookups to avoid redundant database calls
    attraction_cache = {}

    for row_idx, r in enumerate(reader, start=1):
        total_count += 1
        raw_tourist = (r.get(col_tourist) or "").strip()
        raw_attr = (r.get(col_attr) or "").strip()
        raw_city = (r.get(col_city) or "").strip()
        raw_time = (r.get(col_time) or "").strip()
        raw_lat = (r.get(col_lat) or "").strip()
        raw_lng = (r.get(col_lng) or "").strip()
        raw_src = (r.get(col_source) or "gps").strip()
        raw_dur = (r.get(col_duration) or "60").strip()

        status = "VALID"
        error_reason = ""
        attr_id = None
        parsed_dt = None

        # 1. Check required fields
        if not raw_tourist or not raw_attr or not raw_city or not raw_time or not raw_lat or not raw_lng:
            status = "INVALID"
            error_reason = "Missing one or more required fields"
        else:
            # 2. Coordinate validation (-90 to 90, -180 to 180)
            try:
                lat = float(raw_lat)
                lng = float(raw_lng)
                if not (-90.0 <= lat <= 90.0 and -180.0 <= lng <= 180.0):
                    status = "INVALID"
                    error_reason = f"Coordinates out of bounds: lat={lat}, lng={lng}"
            except ValueError:
                status = "INVALID"
                error_reason = f"Non-numeric coordinates: lat='{raw_lat}', lng='{raw_lng}'"

            # 3. Timestamp parsing
            if status == "VALID":
                for fmt in ("%Y-%m-%d %H:%M:%S", "%Y-%m-%dT%H:%M:%S", "%Y-%m-%d %H:%M", "%Y/%m/%d %H:%M:%S", "%d-%m-%Y %H:%M:%S"):
                    try:
                        parsed_dt = datetime.strptime(raw_time, fmt)
                        break
                    except ValueError:
                        pass
                if not parsed_dt:
                    status = "INVALID"
                    error_reason = f"Unrecognized date/time format: '{raw_time}'"

            # 4. Attraction resolution (map name to ID)
            if status == "VALID":
                attr_key = raw_attr.lower()
                if attr_key not in attraction_cache:
                    attraction_cache[attr_key] = get_attraction_by_name(raw_attr)
                
                matched = attraction_cache[attr_key]
                if not matched:
                    status = "INVALID"
                    error_reason = f"Unknown attraction: '{raw_attr}' is not registered in database"
                else:
                    attr_id = matched["attraction_id"]
                    # Override city if matched
                    raw_city = matched["city"]

            # 5. Exact Signature Duplicate Detection
            if status == "VALID":
                exact_sig = (raw_tourist, raw_attr.lower(), parsed_dt.strftime("%Y-%m-%d %H:%M:%S"), round(lat, 4), round(lng, 4))
                if exact_sig in seen_exact_signatures:
                    status = "DUPLICATE"
                    error_reason = "Exact duplicate record signature in batch"
                else:
                    seen_exact_signatures.add(exact_sig)

            # 6. Potential Duplicate Detection (same tourist & site within 15 mins)
            if status == "VALID":
                pair_key = (raw_tourist, raw_attr.lower())
                if pair_key in tourist_time_window:
                    for prev_t in tourist_time_window[pair_key]:
                        if abs((parsed_dt - prev_t).total_seconds()) <= 900: # 15 mins
                            status = "POTENTIAL DUPLICATE"
                            error_reason = f"Repeated visit by {raw_tourist} to {raw_attr} within 15 minutes"
                            break
                    tourist_time_window[pair_key].append(parsed_dt)
                else:
                    tourist_time_window[pair_key] = [parsed_dt]

        # Parse duration
        try:
            duration_val = int(raw_dur)
            if duration_val <= 0: duration_val = 60
        except ValueError:
            duration_val = 60

        row_data = {
            "row_number": row_idx,
            "tourist_code": raw_tourist,
            "attraction_name": raw_attr,
            "attraction_id": attr_id,
            "city": raw_city,
            "timestamp": parsed_dt.strftime("%Y-%m-%d %H:%M:%S") if parsed_dt else raw_time,
            "latitude": float(raw_lat) if status != "INVALID" and "lat" in locals() else raw_lat,
            "longitude": float(raw_lng) if status != "INVALID" and "lng" in locals() else raw_lng,
            "source": raw_src,
            "visit_duration": duration_val,
            "status": status,
            "error_reason": error_reason
        }

        if status == "VALID":
            valid_count += 1
            valid_rows.append(row_data)
        elif status == "INVALID":
            invalid_count += 1
        elif status == "DUPLICATE":
            duplicate_count += 1
        elif status == "POTENTIAL DUPLICATE":
            potential_dup_count += 1
            # Kept in valid_rows so user can optionally include/exclude
            valid_rows.append(row_data)

        if len(preview_rows) < 50:
            preview_rows.append(row_data)

    # Store batch in session store
    batch_id = f"batch_{datetime.now().strftime('%Y%m%d%H%M%S')}_{total_count}"
    _pending_batches[batch_id] = {
        "file_name": file.filename,
        "valid_rows": valid_rows,
        "stats": {
            "total_records": total_count,
            "valid_records": valid_count,
            "invalid_records": invalid_count,
            "duplicate_records": duplicate_count,
            "potential_duplicate_records": potential_dup_count,
            "ready_for_insert": valid_count + potential_dup_count
        }
    }

    return {
        "batch_id": batch_id,
        "file_name": file.filename,
        "total_records": total_count,
        "valid_records": valid_count,
        "invalid_records": invalid_count,
        "duplicate_records": duplicate_count,
        "potential_duplicate_records": potential_dup_count,
        "ready_for_insert": valid_count + potential_dup_count,
        "preview_rows": preview_rows
    }

@router.post("/commit")
def commit_ingestion_batch(req: CommitRequest):
    """
    Commits confirmed rows from the previewed batch into Oracle Database.
    Logs upload execution into DATASET_UPLOADS.
    """
    try:
        require_oracle()
    except OracleNotConnectedException as e:
        raise HTTPException(status_code=503, detail=str(e))

    batch = _pending_batches.get(req.batch_id)
    if not batch:
        raise HTTPException(status_code=404, detail="Batch expired or not found. Please upload and preview the CSV again.")

    valid_rows = batch["valid_rows"]
    
    # Filter according to user confirmation preferences
    filtered_rows = []
    for r in valid_rows:
        if r["status"] == "DUPLICATE" and req.exclude_duplicates:
            continue
        if r["status"] == "POTENTIAL DUPLICATE" and req.exclude_potential_duplicates:
            continue
        filtered_rows.append(r)

    stats = batch["stats"]
    stats["valid_records"] = len(filtered_rows)

    try:
        inserted = commit_validated_ingestion(batch["file_name"], filtered_rows, stats)
        # Clear batch from memory
        _pending_batches.pop(req.batch_id, None)

        return {
            "status": "Upload Complete",
            "file_name": batch["file_name"],
            "total_records": stats["total_records"],
            "valid_records": stats["valid_records"],
            "invalid_records": stats["invalid_records"],
            "duplicate_records": stats["duplicate_records"],
            "inserted_records": inserted,
            "failed_records": 0,
            "database": "Oracle Database",
            "message": f"Successfully inserted {inserted} verified records into Oracle Database."
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database commit error: {str(e)}")

@router.get("/history")
def get_upload_history():
    """Returns the ingestion audit log from Oracle DATASET_UPLOADS."""
    try:
        require_oracle()
        records = get_ingestion_history_records()
        return records
    except OracleNotConnectedException as e:
        raise HTTPException(status_code=503, detail=str(e))
