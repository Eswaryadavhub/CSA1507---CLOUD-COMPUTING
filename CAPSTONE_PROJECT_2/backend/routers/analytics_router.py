from fastapi import APIRouter, Query, HTTPException
from backend.database.manager import (
    get_kpis_data,
    get_tourist_flow_data,
    get_weekly_heatmap_matrix,
    get_popularity_list,
    execute_query,
    require_oracle,
    OracleNotConnectedException
)

router = APIRouter(prefix="/api", tags=["Tourist Flow & Attraction Analytics"])

@router.get("/dashboard")
@router.get("/analytics/kpis")
def get_dashboard_kpis(
    city: str = Query("All", description="Focus city"),
    date_preset: str = Query("30days", description="Date range preset"),
    start_date: str = Query(None, description="Custom start date YYYY-MM-DD"),
    end_date: str = Query(None, description="Custom end date YYYY-MM-DD")
):
    """Calculates all headline dashboard KPIs dynamically from Oracle Database."""
    try:
        return get_kpis_data(city=city, date_preset=date_preset, start_date=start_date, end_date=end_date)
    except OracleNotConnectedException as e:
        raise HTTPException(status_code=503, detail=str(e))

@router.get("/analytics/tourist-flow")
@router.get("/analytics/flow")
def get_flow_series(
    city: str = Query("All", description="Focus city"),
    date_preset: str = Query("30days", description="Date range preset"),
    start_date: str = Query(None, description="Custom start date YYYY-MM-DD"),
    end_date: str = Query(None, description="Custom end date YYYY-MM-DD")
):
    """Calculates hourly and daily tourist flow curves from Oracle Database."""
    try:
        return get_tourist_flow_data(city=city, date_preset=date_preset, start_date=start_date, end_date=end_date)
    except OracleNotConnectedException as e:
        raise HTTPException(status_code=503, detail=str(e))

@router.get("/analytics/heatmap")
def get_heatmap_grid(
    city: str = Query("All", description="Focus city")
):
    """Aggregates weekly 7-day x 4-period tourist density matrix from Oracle Database."""
    try:
        return get_weekly_heatmap_matrix(city=city)
    except OracleNotConnectedException as e:
        raise HTTPException(status_code=503, detail=str(e))

@router.get("/analytics/popularity")
def get_attraction_popularity(
    city: str = Query("All", description="Focus city")
):
    """Calculates attraction popularity rankings and crowd capacity ratios from Oracle Database."""
    try:
        return get_popularity_list(city=city)
    except OracleNotConnectedException as e:
        raise HTTPException(status_code=503, detail=str(e))

@router.get("/analytics/crowd")
def get_crowd_analytics(
    city: str = Query("All", description="Focus city")
):
    """Returns attraction crowd level and capacity distribution from Oracle Database."""
    try:
        require_oracle()
        popularity = get_popularity_list(city=city)
        high_crowd = [a for a in popularity if a.get("crowd") == "High"]
        mod_crowd = [a for a in popularity if a.get("crowd") == "Moderate"]
        low_crowd = [a for a in popularity if a.get("crowd") == "Low"]
        return {
            "city": city,
            "total_monitored": len(popularity),
            "high_congestion_count": len(high_crowd),
            "moderate_congestion_count": len(mod_crowd),
            "low_congestion_count": len(low_crowd),
            "crowd_distribution": {
                "High": len(high_crowd),
                "Moderate": len(mod_crowd),
                "Low": len(low_crowd)
            },
            "attractions": popularity
        }
    except OracleNotConnectedException as e:
        raise HTTPException(status_code=503, detail=str(e))

@router.get("/analytics/routes")
def get_movement_corridors(
    city: str = Query("All", description="Focus city")
):
    """
    Computes Origin-Destination (O-D) movement transfers between attractions
    based on consecutive visits by tourists in Oracle Database.
    """
    try:
        require_oracle()
        sql = """
            SELECT c.tourist_id, c.attraction_id, a.attraction_name, a.city, c.checkin_timestamp
            FROM CHECKINS c
            JOIN ATTRACTIONS a ON c.attraction_id = a.attraction_id
        """
        params = {}
        if city and city.lower() != "all":
            sql += " WHERE LOWER(a.city) = LOWER(:city)"
            params["city"] = city
        sql += " ORDER BY c.tourist_id, c.checkin_timestamp ASC"
        
        rows = execute_query(sql, params)
        transitions = {}
        prev_tourist = None
        prev_loc = None
        
        for r in rows:
            curr_tourist = r["tourist_id"]
            curr_loc = r["attraction_name"]
            if curr_tourist == prev_tourist and prev_loc and prev_loc != curr_loc:
                key = (prev_loc, curr_loc)
                transitions[key] = transitions.get(key, 0) + 1
            prev_tourist = curr_tourist
            prev_loc = curr_loc

        # Sort by flow volume
        sorted_pairs = sorted(transitions.items(), key=lambda x: x[1], reverse=True)[:10]
        return [
            {
                "origin": pair[0],
                "destination": pair[1],
                "weight": count,
                "from": pair[0],
                "to": pair[1],
                "flow_volume": count
            }
            for pair, count in sorted_pairs
        ]
    except OracleNotConnectedException as e:
        raise HTTPException(status_code=503, detail=str(e))
