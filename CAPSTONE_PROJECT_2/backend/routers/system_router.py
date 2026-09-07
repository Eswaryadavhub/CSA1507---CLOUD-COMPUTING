import os
from fastapi import APIRouter
from dotenv import load_dotenv

from backend.database.connection import check_oracle_status
from backend.database.manager import get_kpis_data

load_dotenv()

router = APIRouter(prefix="/api/system", tags=["System Information & Status"])

@router.get("/database-status")
def get_database_status():
    """
    Returns the live Oracle Database connection status safely.
    Never exposes passwords, connection strings, or sensitive credentials.
    """
    status = check_oracle_status()
    return status

@router.get("/info")
def get_system_info():
    """
    Returns transparent system configuration for academic evaluation and settings display.
    """
    gcp_project = os.getenv("GCP_PROJECT_ID")
    gcs_bucket = os.getenv("GCP_STORAGE_BUCKET")
    bq_dataset = os.getenv("GCP_BIGQUERY_DATASET")

    is_gcp_connected = bool(gcp_project and gcs_bucket and bq_dataset and os.getenv("GCP_CREDENTIALS_PATH"))

    status = check_oracle_status()
    total_records = 0
    total_attractions = 0
    
    if status["connected"]:
        try:
            kpi = get_kpis_data()
            total_records = kpi["total_visits"]
            total_attractions = kpi["active_attractions"]
        except Exception:
            pass

    return {
        "application_mode": "LOCAL DEMO MODE — GCP INTEGRATION READY",
        "database_type": "Oracle Database",
        "database_status": status["status"],
        "database_connected": status["connected"],
        "database_service": status["service"],
        "processing_engine": "Distributed MapReduce (PySpark / Cloud Dataproc Ready)",
        "analytics_engine": "Oracle Operational Warehouse / Google BigQuery Parity",
        "prediction_model": "Machine Learning Demand Forecasting (BigQuery ML ARIMA_PLUS Parity)",
        "total_records_in_db": total_records,
        "total_attractions_in_db": total_attractions,
        "gcp_connected": is_gcp_connected,
        "gcp_status": "GCP Connected" if is_gcp_connected else "GCP Integration Ready",
        "dataset_disclaimer": "Synthetic demonstration dataset created for academic evaluation."
    }

@router.get("/dataset-audit")
def get_dataset_audit():
    """Returns dataset transparency metadata required by academic standards."""
    return {
        "academic_title": "Cloud-Based Tourist Flow and Attraction Analytics",
        "dataset_classification": "Synthetic demonstration dataset created for academic evaluation.",
        "data_sources": [
            {"channel": "GPS Device Telemetry", "simulated_share": "45%", "description": "High-velocity latitude and longitude coordinate pings."},
            {"channel": "Travel Application APIs", "simulated_share": "35%", "description": "Mobile app check-in and landmark search activity logs."},
            {"channel": "User Check-in Logs", "simulated_share": "20%", "description": "Manual tourist venue check-in records."}
        ],
        "monitored_regions": ["Chennai", "Bengaluru", "Hyderabad", "Mumbai", "Delhi", "Pune"],
        "database_target": "Oracle Database"
    }
