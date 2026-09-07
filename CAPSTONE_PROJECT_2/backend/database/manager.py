"""
TourPulse: Unified Database Manager
Provides clean repository methods that execute directly against Oracle Database.
"""

import math
from datetime import datetime, timedelta
from backend.database.connection import (
    check_oracle_status,
    execute_query,
    execute_dml,
    execute_dml_many,
    OracleNotConnectedException
)
from backend.database.queries import (
    SQL_GET_KPI_METRICS,
    SQL_GET_TOP_ATTRACTION,
    SQL_GET_PEAK_HOUR,
    SQL_GET_DAILY_FLOW,
    SQL_GET_HOURLY_FLOW,
    SQL_GET_HEATMAP_GRID,
    SQL_GET_POPULARITY_RANKING,
    SQL_GET_ATTRACTIONS_LIST,
    SQL_GET_ATTRACTION_HOURLY_DIST,
    SQL_GET_ATTRACTION_SOURCE_BREAKDOWN,
    SQL_INSERT_DATASET_UPLOAD,
    SQL_GET_DATASET_UPLOADS,
    SQL_LOOKUP_ATTRACTION_BY_NAME,
    SQL_INSERT_CHECKIN
)

def require_oracle():
    """Asserts that Oracle Database is connected before executing queries."""
    status = check_oracle_status()
    if not status["connected"]:
        raise OracleNotConnectedException(
            f"Oracle Database is not connected: {status['message']}"
        )

# ----------------- Analytics & KPIs -----------------

def get_kpis_data(city="All", date_preset="30days", start_date=None, end_date=None):
    require_oracle()
    
    # Calculate date bounds based on preset
    s_date = start_date
    e_date = end_date
    now = datetime.now()
    if date_preset == "today":
        s_date = now.strftime("%Y-%m-%d")
        e_date = now.strftime("%Y-%m-%d")
    elif date_preset == "yesterday":
        y = now - timedelta(days=1)
        s_date = y.strftime("%Y-%m-%d")
        e_date = y.strftime("%Y-%m-%d")
    elif date_preset == "7days":
        s_date = (now - timedelta(days=7)).strftime("%Y-%m-%d")
        e_date = now.strftime("%Y-%m-%d")
    elif date_preset == "30days":
        s_date = (now - timedelta(days=30)).strftime("%Y-%m-%d")
        e_date = now.strftime("%Y-%m-%d")

    params = {"city": city, "start_date": s_date, "end_date": e_date}
    
    # 1. Total visits & Active attractions
    metrics = execute_query(SQL_GET_KPI_METRICS, params)
    total_visits = metrics[0]["total_visits"] if metrics else 0
    active_attractions = metrics[0]["active_attractions"] if metrics else 0
    
    # 2. Top Attraction
    top_res = execute_query(SQL_GET_TOP_ATTRACTION, params)
    top_attraction = top_res[0]["attraction_name"] if top_res else "None"
    
    # 3. Peak Hour
    peak_res = execute_query(SQL_GET_PEAK_HOUR, params)
    if peak_res and peak_res[0]["hour_num"] is not None:
        h = int(peak_res[0]["hour_num"])
        peak_visiting_hour = f"{h:02d}:00 – {h+1:02d}:00"
    else:
        peak_visiting_hour = "17:00 – 18:00"

    # 4. Average crowd level % across active attractions
    pop_list = execute_query(SQL_GET_POPULARITY_RANKING, {"city": city})
    if pop_list:
        loads = [(p["total_visits"] / max(p["capacity"], 1)) * 100 for p in pop_list]
        avg_crowd_pct = round(sum(loads) / len(loads), 1)
        avg_crowd_pct = min(avg_crowd_pct, 100.0)
        high_crowd_count = sum(1 for l in loads if l >= 70.0)
    else:
        avg_crowd_pct = 0.0
        high_crowd_count = 0

    daily_avg = round(total_visits / 30) if total_visits > 0 else 0

    return {
        "total_visits": total_visits,
        "active_attractions": active_attractions,
        "top_attraction": top_attraction,
        "avg_crowd_level_pct": avg_crowd_pct,
        "peak_visiting_hour": peak_visiting_hour,
        "daily_average_visitors": daily_avg,
        "high_crowd_attractions_count": high_crowd_count
    }

def get_tourist_flow_data(city="All", date_preset="30days", start_date=None, end_date=None):
    require_oracle()
    now = datetime.now()
    s_date = start_date
    e_date = end_date
    if date_preset == "today" or date_preset == "yesterday":
        # Use hourly flow
        y = now - timedelta(days=1) if date_preset == "yesterday" else now
        params = {"city": city, "start_date": y.strftime("%Y-%m-%d"), "end_date": y.strftime("%Y-%m-%d")}
        rows = execute_query(SQL_GET_HOURLY_FLOW, params)
        labels = [f"{int(r['hour_num']):02d}:00" for r in rows if r['hour_num'] is not None]
        values = [int(r['visit_count']) for r in rows if r['hour_num'] is not None]
        chart_type = "hourly"
    else:
        # Use daily flow
        if date_preset == "7days":
            s_date = (now - timedelta(days=7)).strftime("%Y-%m-%d")
            e_date = now.strftime("%Y-%m-%d")
        elif date_preset == "30days":
            s_date = (now - timedelta(days=30)).strftime("%Y-%m-%d")
            e_date = now.strftime("%Y-%m-%d")
            
        params = {"city": city, "start_date": s_date, "end_date": e_date}
        rows = execute_query(SQL_GET_DAILY_FLOW, params)
        labels = [str(r['checkin_date']) for r in rows]
        values = [int(r['visit_count']) for r in rows]
        chart_type = "daily"

    return {
        "chart_type": chart_type,
        "labels": labels,
        "values": values
    }

def get_weekly_heatmap_matrix(city="All"):
    require_oracle()
    rows = execute_query(SQL_GET_HEATMAP_GRID, {"city": city})
    
    max_count = max([int(r["visit_count"]) for r in rows], default=1)
    counts = {(int(r["day_idx"]), str(r["period_name"])): int(r["visit_count"]) for r in rows}
    
    periods = ["Morning", "Afternoon", "Evening", "Night"]
    cells = []
    for d in range(7):
        for p in periods:
            cnt = counts.get((d, p), 0)
            cells.append({
                "day_idx": d,
                "period": p,
                "count": cnt,
                "percent": round((cnt / max_count) * 100) if max_count > 0 else 0
            })
    return cells

def get_popularity_list(city="All"):
    require_oracle()
    rows = execute_query(SQL_GET_POPULARITY_RANKING, {"city": city})
    max_visits = max([int(r["total_visits"]) for r in rows], default=1)
    
    result = []
    for r in rows:
        visits = int(r["total_visits"])
        cap = int(r["capacity"])
        pct = round((visits / max_visits) * 100) if max_visits > 0 else 0
        cap_load = (visits / max(cap, 1)) * 100
        crowd = "High" if cap_load >= 70.0 else ("Moderate" if cap_load >= 40.0 else "Low")
        result.append({
            "attraction_id": r["attraction_id"],
            "name": r["attraction_name"],
            "city": r["city"],
            "category": r["category"],
            "visits": visits,
            "percentage": pct,
            "crowd": crowd,
            "capacity": cap
        })
    return result

# ----------------- Attractions CRUD -----------------

def get_attractions_catalog(city="All", category="all", sort_by="popularity", search=None):
    require_oracle()
    params = {
        "city": city,
        "category": category,
        "search": search if search else None
    }
    rows = execute_query(SQL_GET_ATTRACTIONS_LIST, params)
    max_visits = max([int(r["total_visits"]) for r in rows], default=1)
    
    res = []
    for r in rows:
        v = int(r["total_visits"])
        cap = int(r["capacity"])
        pop_idx = round((v / max_visits) * 100) if max_visits > 0 else 50
        load = (v / max(cap, 1)) * 100
        crowd = "High" if load >= 70.0 else ("Moderate" if load >= 40.0 else "Low")
        res.append({
            "id": r["attraction_id"],
            "name": r["attraction_name"],
            "city": r["city"],
            "category": r["category"],
            "latitude": float(r["latitude"]),
            "longitude": float(r["longitude"]),
            "capacity": cap,
            "current_visits": v,
            "popularity_index": pop_idx,
            "current_crowd": crowd,
            "description": r.get("description", "")
        })

    if sort_by == "popularity":
        res.sort(key=lambda x: x["popularity_index"], reverse=True)
    elif sort_by == "visits":
        res.sort(key=lambda x: x["current_visits"], reverse=True)
    elif sort_by == "name":
        res.sort(key=lambda x: x["name"])

    return res

def get_attraction_detail_data(attraction_id: int):
    require_oracle()
    attr = execute_query("SELECT * FROM ATTRACTIONS WHERE attraction_id = :id", {"id": attraction_id})
    if not attr:
        return None
    a = attr[0]
    
    # Total visits
    v_res = execute_query("SELECT COUNT(*) AS total FROM CHECKINS WHERE attraction_id = :id", {"id": attraction_id})
    total_visits = v_res[0]["total"] if v_res else 0
    
    # Hourly distribution (24 hours)
    hourly_rows = execute_query(SQL_GET_ATTRACTION_HOURLY_DIST, {"attraction_id": attraction_id})
    dist = [0] * 24
    peak_h = 16
    max_h_val = 0
    for hr in hourly_rows:
        h = int(hr["hour_num"])
        cnt = int(hr["visit_count"])
        if 0 <= h < 24:
            dist[h] = cnt
            if cnt > max_h_val:
                max_h_val = cnt
                peak_h = h

    # Sources
    sources_rows = execute_query(SQL_GET_ATTRACTION_SOURCE_BREAKDOWN, {"attraction_id": attraction_id})
    source_map = {"gps": 0, "travel_app": 0, "checkin": 0}
    tot_s = 0
    for s in sources_rows:
        src = s["source"].lower()
        c = int(s["count"])
        tot_s += c
        if "gps" in src: source_map["gps"] += c
        elif "app" in src: source_map["travel_app"] += c
        else: source_map["checkin"] += c

    if tot_s > 0:
        source_pct = {
            "gps": round((source_map["gps"] / tot_s) * 100),
            "app": round((source_map["travel_app"] / tot_s) * 100),
            "checkin": round((source_map["checkin"] / tot_s) * 100)
        }
    else:
        source_pct = {"gps": 50, "app": 30, "checkin": 20}

    return {
        "id": a["attraction_id"],
        "name": a["attraction_name"],
        "city": a["city"],
        "category": a["category"],
        "latitude": float(a["latitude"]),
        "longitude": float(a["longitude"]),
        "capacity": int(a["capacity"]),
        "description": a.get("description", ""),
        "total_visits": total_visits,
        "peak_hours": f"{peak_h:02d}:00 – {peak_h+1:02d}:00",
        "hourly_distribution": dist,
        "source_percentages": source_pct
    }

def add_attraction_record(data: dict):
    require_oracle()
    sql = """
    INSERT INTO ATTRACTIONS (attraction_name, city, category, latitude, longitude, capacity, description)
    VALUES (:name, :city, :category, :latitude, :longitude, :capacity, :description)
    """
    params = {
        "name": data["name"],
        "city": data["city"],
        "category": data["category"],
        "latitude": float(data["latitude"]),
        "longitude": float(data["longitude"]),
        "capacity": int(data.get("capacity", 1000)),
        "description": data.get("description", "")
    }
    execute_dml(sql, params)

def edit_attraction_record(attraction_id: int, data: dict):
    require_oracle()
    sql = """
    UPDATE ATTRACTIONS
    SET attraction_name = :name,
        city = :city,
        category = :category,
        latitude = :latitude,
        longitude = :longitude,
        capacity = :capacity,
        description = :description
    WHERE attraction_id = :id
    """
    params = {
        "id": attraction_id,
        "name": data["name"],
        "city": data["city"],
        "category": data["category"],
        "latitude": float(data["latitude"]),
        "longitude": float(data["longitude"]),
        "capacity": int(data.get("capacity", 1000)),
        "description": data.get("description", "")
    }
    execute_dml(sql, params)

def delete_attraction_record(attraction_id: int):
    require_oracle()
    execute_dml("DELETE FROM CHECKINS WHERE attraction_id = :id", {"id": attraction_id})
    execute_dml("DELETE FROM PREDICTIONS WHERE attraction_id = :id", {"id": attraction_id})
    execute_dml("DELETE FROM ATTRACTIONS WHERE attraction_id = :id", {"id": attraction_id})

# ----------------- Deterministic Recommendations -----------------

def get_smart_recommendations(city="Chennai", crowd_pref="low"):
    require_oracle()
    pop_list = get_popularity_list(city)
    if not pop_list or len(pop_list) < 2:
        return []

    # Sort attractions by capacity load
    load_items = []
    for item in pop_list:
        cap = max(item["capacity"], 1)
        load_pct = round((item["visits"] / cap) * 100, 1)
        load_items.append({
            "name": item["name"],
            "city": item["city"],
            "category": item["category"],
            "capacity": cap,
            "visits": item["visits"],
            "load_pct": load_pct,
            "crowd": "High" if load_pct >= 70.0 else ("Moderate" if load_pct >= 40.0 else "Low")
        })

    # Find candidate destinations that have High or Moderate crowd
    high_crowded = [x for x in load_items if x["crowd"] == "High"]
    moderate_crowded = [x for x in load_items if x["crowd"] == "Moderate"]
    low_crowded = [x for x in load_items if x["crowd"] == "Low"]

    recs = []

    # Case 1: High crowded attraction -> suggest lower crowd alternative in same city
    for target in high_crowded:
        # Find best alternative in same city with lowest load
        candidates = [c for c in load_items if c["name"] != target["name"] and c["load_pct"] < target["load_pct"]]
        if candidates:
            candidates.sort(key=lambda x: x["load_pct"])
            alt = candidates[0]
            recs.append({
                "target_attraction": target["name"],
                "target_crowd": target["crowd"],
                "target_load_pct": target["load_pct"],
                "name": alt["name"],
                "city": alt["city"],
                "category": alt["category"],
                "current_crowd": alt["crowd"],
                "expected_crowd": f"{alt['load_pct']}% capacity",
                "optimal_time_slot": "10:00 AM – 01:00 PM (Morning low-congestion window)",
                "recommendation_reason": (
                    f"{target['name']} is currently experiencing High crowd congestion ({target['load_pct']}% load). "
                    f"Consider visiting {alt['name']} instead, which currently has a {alt['crowd']} crowd density ({alt['load_pct']}% utilization) in {alt['city']}."
                )
            })

    # Case 2: If user specifically asked for Low preference, highlight top low density gems
    if crowd_pref == "low":
        for gem in low_crowded[:3]:
            if not any(r["name"] == gem["name"] for r in recs):
                recs.append({
                    "target_attraction": "City-wide Peak Traffic",
                    "target_crowd": "High",
                    "target_load_pct": 85.0,
                    "name": gem["name"],
                    "city": gem["city"],
                    "category": gem["category"],
                    "current_crowd": "Low",
                    "expected_crowd": f"{gem['load_pct']}% capacity",
                    "optimal_time_slot": "09:00 AM – 12:00 PM (Optimal tranquility slot)",
                    "recommendation_reason": (
                        f"{gem['name']} currently offers an ideal low-density experience ({gem['load_pct']}% capacity) "
                        f"with minimal visitor queuing and excellent visitor comfort."
                    )
                })

    return recs

# ----------------- Ingestion & Batch Commit -----------------

def get_attraction_by_name(name: str):
    require_oracle()
    res = execute_query(SQL_LOOKUP_ATTRACTION_BY_NAME, {"attraction_name": name})
    return res[0] if res else None

def commit_validated_ingestion(file_name: str, valid_rows: list, stats: dict):
    require_oracle()
    
    # Insert batch checkins
    insert_params = []
    for r in valid_rows:
        insert_params.append({
            "tourist_id": r.get("tourist_id", 1),
            "attraction_id": r["attraction_id"],
            "city": r["city"],
            "checkin_timestamp": r["timestamp"],
            "latitude": float(r["latitude"]),
            "longitude": float(r["longitude"]),
            "source": r.get("source", "gps"),
            "visit_duration": int(r.get("visit_duration", 60)),
            "crowd_level": r.get("crowd_level", "Low")
        })

    inserted_count = 0
    if insert_params:
        inserted_count = execute_dml_many(SQL_INSERT_CHECKIN, insert_params)

    # Insert audit record into DATASET_UPLOADS
    audit_params = {
        "file_name": file_name,
        "total_records": stats["total_records"],
        "valid_records": stats["valid_records"],
        "invalid_records": stats["invalid_records"],
        "duplicate_records": stats["duplicate_records"],
        "inserted_records": inserted_count,
        "upload_status": "SUCCESS" if inserted_count > 0 else "EMPTY"
    }
    execute_dml(SQL_INSERT_DATASET_UPLOAD, audit_params)
    return inserted_count

def get_ingestion_history_records():
    require_oracle()
    return execute_query(SQL_GET_DATASET_UPLOADS)
