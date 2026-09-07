"""
Automated end-to-end test suite for TourPulse REST API.
"""
import sys
import os

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def test_full_api():
    print("[*] Starting TourPulse API Test Suite...")

    # 1. System Info / Viva endpoint
    res = client.get("/api/system/info")
    assert res.status_code == 200, f"System info failed: {res.text}"
    data = res.json()
    assert "application_mode" in data
    assert "database_type" in data
    print(f"[PASS] System Info: {data['application_mode']} | DB: {data['database_type']}")

    # 2. Auth Login Test
    res = client.post("/api/auth/login", json={
        "email": "admin@tourpulse.com",
        "password": "admin123"
    })
    assert res.status_code == 200, f"Admin login failed: {res.text}"
    token_data = res.json()
    assert "access_token" in token_data
    token = token_data["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("[PASS] Admin Authentication: Token successfully acquired.")

    # 3. Attractions list & detail
    res = client.get("/api/attractions")
    assert res.status_code == 200
    attractions = res.json()
    assert len(attractions) >= 30
    attr_id = attractions[0]["id"]
    print(f"[PASS] Attractions API: Loaded {len(attractions)} sites. First site: {attractions[0]['name']}")

    res = client.get(f"/api/attractions/{attr_id}")
    assert res.status_code == 200
    detail = res.json()
    assert "hourly_distribution" in detail
    print(f"[PASS] Attraction Detail API: Visits = {detail['total_visits']}")

    # 4. Analytics KPIs
    res = client.get("/api/analytics/kpis")
    assert res.status_code == 200
    kpis = res.json()
    assert kpis["total_visits"] > 0
    print(f"[PASS] Analytics KPIs: Total Visits = {kpis['total_visits']} | Peak = {kpis['peak_visiting_hour']}")

    # 5. Tourist Flow & Heatmap
    res = client.get("/api/analytics/flow")
    assert res.status_code == 200
    flow = res.json()
    assert len(flow["labels"]) > 0
    print(f"[PASS] Tourist Flow API: {flow['chart_type']} chart with {len(flow['labels'])} points.")

    res = client.get("/api/analytics/heatmap")
    assert res.status_code == 200
    cells = res.json()
    assert len(cells) == 28 # 4 periods x 7 days
    print(f"[PASS] Weekly Heatmap API: {len(cells)} cells returned.")

    # 6. Prediction & Forecast
    res = client.post("/api/prediction/forecast", json={
        "attraction_id": attr_id,
        "target_date": "2026-08-20",
        "target_time": "17:00"
    })
    assert res.status_code == 200
    forecast = res.json()
    assert forecast["predicted_visitors"] > 0
    print(f"[PASS] Forecast API: Predicted {forecast['predicted_visitors']} visitors ({forecast['crowd_level']}) via {forecast['model_name']}.")

    # 7. Recommendations
    res = client.get("/api/prediction/recommendations?city=Chennai")
    assert res.status_code == 200
    recs = res.json()
    assert len(recs) > 0
    print(f"[PASS] Recommendations API: Generated {len(recs)} suggestions.")

    # 8. Reports API
    res = client.get("/api/reports/summary")
    assert res.status_code == 200
    rep = res.json()
    assert "resource_planning_recommendations" in rep
    print(f"[PASS] Executive Reports Summary API: Successfully compiled.")

    # 9. Pipeline Status
    res = client.get("/api/pipeline/status")
    assert res.status_code == 200
    p_stat = res.json()
    assert "total_records_in_warehouse" in p_stat
    print(f"[PASS] Pipeline Status API: Warehouse holds {p_stat['total_records_in_warehouse']} records.")

    print("\n[SUCCESS] ALL BACKEND AUTOMATED TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    test_full_api()
