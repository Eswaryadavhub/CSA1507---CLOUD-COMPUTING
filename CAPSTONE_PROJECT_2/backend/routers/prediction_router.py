from fastapi import APIRouter, Query, HTTPException, Body
from datetime import datetime, timedelta
from typing import Optional

from backend.database.manager import (
    get_smart_recommendations,
    get_attraction_detail_data,
    get_popularity_list,
    require_oracle,
    OracleNotConnectedException
)
from backend.ml.forecast import generate_attraction_forecast

router = APIRouter(prefix="/api", tags=["Prediction & Recommendations"])

@router.get("/predictions")
@router.get("/prediction/forecast")
def get_ml_forecast(
    attraction_id: Optional[int] = Query(None, description="Target Attraction ID"),
    target_date: Optional[str] = Query(None, description="Target Date YYYY-MM-DD"),
    target_hour: str = Query("17:00", description="Target Hour HH:MM"),
    city: str = Query("Chennai", description="Focus city")
):
    """
    Predicts tourist crowd volume using trained Machine Learning models.
    Compares against physical site capacity and historical baseline.
    """
    try:
        require_oracle()
        if not target_date:
            target_date = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")

        if not attraction_id:
            pop = get_popularity_list(city=city)
            if pop:
                attraction_id = pop[0].get("attraction_id", pop[0].get("id", 1))
            else:
                attraction_id = 1

        attr = get_attraction_detail_data(attraction_id)
        if not attr:
            raise HTTPException(status_code=404, detail="Attraction not found in Oracle Database.")

        # ML Forecast
        result = generate_attraction_forecast(
            attraction_name=attr["name"],
            city=attr["city"],
            category=attr["category"],
            capacity=attr["capacity"],
            base_popularity=round((attr["total_visits"] / max(attr["capacity"], 1)) * 50),
            target_date=target_date,
            target_hour=target_hour
        )
        return result
    except OracleNotConnectedException as e:
        raise HTTPException(status_code=503, detail=str(e))

@router.post("/prediction/forecast")
def post_ml_forecast(payload: dict = Body(...)):
    """Receives JSON body for prediction forecast."""
    attraction_id = payload.get("attraction_id")
    target_date = payload.get("target_date")
    target_hour = payload.get("target_time", payload.get("target_hour", "17:00"))
    city = payload.get("city", "Chennai")
    return get_ml_forecast(attraction_id=attraction_id, target_date=target_date, target_hour=target_hour, city=city)

@router.get("/recommendations")
@router.get("/prediction/recommendations")
def get_recommendations(
    city: str = Query("Chennai", description="Target City"),
    crowd_preference: str = Query("low", description="low, moderate, or all")
):
    """
    Generates explainable, deterministic congestion diversion recommendations from Oracle Database.
    Pairs crowded sites (> 75% capacity load) with lower-density cultural alternatives.
    """
    try:
        require_oracle()
        recs = get_smart_recommendations(city=city, crowd_pref=crowd_preference)
        if not recs:
            return {
                "status": "notice",
                "message": "Not enough historical data to generate a reliable recommendation.",
                "recommendations": []
            }
        return {
            "status": "success",
            "city": city,
            "preference": crowd_preference,
            "recommendations": recs
        }
    except OracleNotConnectedException as e:
        raise HTTPException(status_code=503, detail=str(e))
