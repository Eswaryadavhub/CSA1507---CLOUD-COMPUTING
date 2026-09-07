import requests
import json

BASE = "http://localhost:8000"
results = {}

def test_ep(name, method, path, **kwargs):
    url = f"{BASE}{path}"
    try:
        if method == "GET":
            r = requests.get(url, **kwargs)
        elif method == "POST":
            r = requests.post(url, **kwargs)
        
        status = r.status_code
        ctype = r.headers.get("content-type", "")
        length = len(r.content)
        
        results[name] = {
            "status": status,
            "content_type": ctype,
            "length": length
        }
        
        if "application/json" in ctype:
            data = r.json()
            if isinstance(data, list):
                results[name]["count"] = len(data)
            elif isinstance(data, dict):
                results[name]["keys"] = list(data.keys())[:5]
                
        print(f"[PASS] {method} {path} -> HTTP {status} ({length} bytes)")
    except Exception as e:
        results[name] = {"error": str(e)}
        print(f"[FAIL] {method} {path} -> {e}")

if __name__ == "__main__":
    print("--- TESTING ALL ORACLE-CONNECTED ENDPOINTS ---")
    
    # 1. Database status
    test_ep("database_status", "GET", "/api/system/database-status")
    
    # 2. Dashboard
    test_ep("dashboard", "GET", "/api/dashboard?city=All")
    
    # 3. Attractions list
    test_ep("attractions", "GET", "/api/attractions?city=All")
    
    # 4. Single attraction detail
    test_ep("attraction_detail", "GET", "/api/attractions/1")
    
    # 5. Checkins query
    test_ep("checkins_query", "GET", "/api/checkins?limit=5")
    
    # 6. Checkin single insertion
    sample_checkin = {
        "tourist_code": "T_DEMO_999",
        "attraction_id": 1,
        "city": "Chennai",
        "latitude": 13.0475,
        "longitude": 80.2824,
        "visit_date": "2026-09-07",
        "visit_time": "14:15",
        "source": "travel_app",
        "duration": 45
    }
    test_ep("checkin_insert", "POST", "/api/checkins", json=sample_checkin)
    
    # 7. Checkins CSV upload
    csv_content = b"tourist_code,attraction_name,city,latitude,longitude,checkin_timestamp,visit_duration,source\nT9991,Marina Beach,Chennai,13.0475,80.2824,2026-09-07 08:30:00,60,travel_app\n"
    files = {"file": ("test_upload.csv", csv_content, "text/csv")}
    test_ep("checkins_upload", "POST", "/api/checkins/upload", files=files)
    
    # 8. Analytics tourist-flow
    test_ep("analytics_tourist_flow", "GET", "/api/analytics/tourist-flow?city=All")
    
    # 9. Analytics crowd
    test_ep("analytics_crowd", "GET", "/api/analytics/crowd?city=All")
    
    # 10. Analytics popularity
    test_ep("analytics_popularity", "GET", "/api/analytics/popularity?city=All")
    
    # 11. Recommendations
    test_ep("recommendations", "GET", "/api/recommendations?city=Chennai&crowd_preference=low")
    
    # 12. Predictions
    test_ep("predictions", "GET", "/api/predictions?city=Chennai")
    
    # 13. Reports PDF
    test_ep("reports_pdf", "GET", "/api/reports/pdf?city=All")
    
    # 14. Reports Excel
    test_ep("reports_excel", "GET", "/api/reports/excel?city=All")
    
    # 15. Reports CSV
    test_ep("reports_csv", "GET", "/api/reports/csv?city=All")
    
    print("\n--- SUMMARY OF TEST RESULTS ---")
    print(json.dumps(results, indent=2))
