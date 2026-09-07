import io
import csv
from datetime import datetime
from fastapi import APIRouter, Query, Response, HTTPException
from backend.database.manager import (
    get_kpis_data,
    get_popularity_list,
    get_smart_recommendations,
    get_tourist_flow_data,
    OracleNotConnectedException
)
from backend.services.pdf_generator import generate_tourpulse_pdf
from backend.services.excel_generator import generate_tourpulse_excel

router = APIRouter(prefix="/api/reports", tags=["Executive Reports & Exports"])

def build_report_data_context(city: str = "All", date_preset: str = "30days") -> dict:
    try:
        kpis = get_kpis_data(city=city, date_preset=date_preset)
        attractions = get_popularity_list(city=city)
        recs = get_smart_recommendations(city="Chennai" if city == "All" else city, crowd_pref="all")
        flow = get_tourist_flow_data(city=city, date_preset=date_preset)
        return {
            "city": city,
            "date_preset": date_preset,
            "kpis": kpis,
            "attractions": attractions,
            "recommendations": recs,
            "flow_data": flow
        }
    except OracleNotConnectedException as e:
        raise HTTPException(status_code=503, detail=str(e))

@router.get("/summary")
def get_report_summary(
    city: str = Query("All", description="Focus city"),
    date_preset: str = Query("30days", description="Date preset")
):
    """Returns JSON analytics summary for report previews."""
    data = build_report_data_context(city, date_preset)
    kpis = data["kpis"]
    return {
        "report_title": "TourPulse Executive Tourism Intelligence Report",
        "generated_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "city": city,
        "date_range": date_preset,
        "total_visits": kpis["total_visits"],
        "active_locations": kpis["active_attractions"],
        "most_popular_attraction": kpis["top_attraction"],
        "peak_visiting_hour": kpis["peak_visiting_hour"],
        "resource_planning_recommendations": [
            f"Increase shuttle frequencies to {kpis['top_attraction']} during peak window {kpis['peak_visiting_hour']}.",
            "Stagger tour group entry times to maintain capacity load under 80%.",
            "Promote off-peak visit slots for heritage monuments."
        ]
    }

@router.get("/pdf")
def download_pdf_report(
    city: str = Query("All", description="Focus city"),
    date_preset: str = Query("30days", description="Date preset")
):
    """
    Generates and downloads a real, non-empty binary PDF Executive Report via ReportLab.
    Contains all 11 required academic sections.
    """
    data = build_report_data_context(city, date_preset)
    pdf_bytes = generate_tourpulse_pdf(data)
    
    today_str = datetime.now().strftime("%Y-%m-%d")
    filename = f"TourPulse_Executive_Report_{city}_{today_str}.pdf"

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Content-Length": str(len(pdf_bytes))
        }
    )

@router.get("/excel")
def download_excel_report(
    city: str = Query("All", description="Focus city"),
    date_preset: str = Query("30days", description="Date preset")
):
    """Generates and downloads a multi-sheet Excel (.xlsx) report using openpyxl."""
    data = build_report_data_context(city, date_preset)
    excel_bytes = generate_tourpulse_excel(data)
    
    today_str = datetime.now().strftime("%Y-%m-%d")
    filename = f"TourPulse_Analytics_{city}_{today_str}.xlsx"

    return Response(
        content=excel_bytes,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Content-Length": str(len(excel_bytes))
        }
    )

@router.get("/csv")
def download_csv_report(
    city: str = Query("All", description="Focus city"),
    date_preset: str = Query("30days", description="Date preset")
):
    """Exports clean, filtered attraction analytics as a standard CSV file."""
    data = build_report_data_context(city, date_preset)
    attractions = data["attractions"]

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Attraction ID", "Attraction Name", "City", "Category", "Total Visits", "Capacity", "Crowd Density Level"])
    
    for a in attractions:
        writer.writerow([
            a.get("attraction_id", a.get("id", "")),
            a.get("name", ""),
            a.get("city", ""),
            a.get("category", ""),
            a.get("visits", 0),
            a.get("capacity", 0),
            a.get("crowd", "Low")
        ])

    today_str = datetime.now().strftime("%Y-%m-%d")
    filename = f"TourPulse_Export_{city}_{today_str}.csv"
    csv_bytes = output.getvalue().encode("utf-8")

    return Response(
        content=csv_bytes,
        media_type="text/csv",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"'
        }
    )
