"""
Automated unit tests for Module 4 ML Demand Forecasting Engine.
"""
import sys
import os

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

from backend.database import SessionLocal
from backend.models import Attraction
from backend.ml.forecast import demand_forecaster

def test_demand_forecast():
    db = SessionLocal()
    try:
        attraction = db.query(Attraction).first()
        assert attraction is not None, "Attraction must exist in DB for testing"

        result = demand_forecaster.forecast_demand(
            db=db,
            attraction_id=attraction.id,
            target_date_str="2026-08-20",
            target_time_str="18:00"
        )

        assert "predicted_visitors" in result
        assert result["predicted_visitors"] > 0
        assert result["crowd_level"] in ["Low", "Moderate", "High"]
        assert result["confidence_score"] >= 50.0
        assert "Local Scikit-learn" in result["model_name"] or "BigQuery ML" in result["model_name"]
        assert result["recommended_time_window"] is not None
        print("[PASS] ML Demand Forecasting Test Passed!")
    finally:
        db.close()

if __name__ == "__main__":
    test_demand_forecast()
