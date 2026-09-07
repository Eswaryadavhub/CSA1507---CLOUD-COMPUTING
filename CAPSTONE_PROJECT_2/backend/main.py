import os
import sys
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

# Ensure root workspace directory is in python path
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

from backend.database.connection import check_oracle_status, get_pool
from backend.routers import (
    auth_router,
    attractions_router,
    upload_router,
    checkins_router,
    analytics_router,
    prediction_router,
    reports_router,
    system_router,
    pipeline_router
)

# Lifespan event handler
@asynccontextmanager
async def lifespan(app: FastAPI):
    print("[*] TourPulse Oracle Analytics API initializing...")
    status = check_oracle_status()
    print(f"[*] Database Status: {status['database']} - {status['status']} ({status['message']})")
    print("[OK] TourPulse API ready on http://localhost:8000")
    yield

# Initialize FastAPI application
app = FastAPI(
    title="TourPulse - Cloud-Based Tourist Flow and Attraction Analytics API",
    description="Production REST API for Big Data Analytics, Oracle Database Ingestion, and Demand Forecasting.",
    version="3.0.0",
    lifespan=lifespan
)

# Enable CORS for full flexibility
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include all API Routers
app.include_router(auth_router.router)
app.include_router(attractions_router.router)
app.include_router(checkins_router.router)
app.include_router(upload_router.router)
app.include_router(analytics_router.router)
app.include_router(prediction_router.router)
app.include_router(reports_router.router)
app.include_router(system_router.router)
app.include_router(pipeline_router.router)

# Mount static frontend directories
app.mount("/js", StaticFiles(directory=os.path.join(ROOT_DIR, "js")), name="js")

@app.get("/style.css")
def get_style():
    return FileResponse(os.path.join(ROOT_DIR, "style.css"), media_type="text/css")

@app.get("/sample_checkins.csv")
@app.get("/data/sample_checkins.csv")
def get_sample_csv():
    csv_path = os.path.join(ROOT_DIR, "data", "sample_checkins.csv")
    if not os.path.exists(csv_path):
        csv_path = os.path.join(ROOT_DIR, "sample_checkins.csv")
    return FileResponse(csv_path, media_type="text/csv")

# Root route serves index.html
@app.get("/")
def serve_index():
    return FileResponse(os.path.join(ROOT_DIR, "index.html"), media_type="text/html")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=False)
