from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional, Dict, Any
from datetime import datetime, date

# ----------------- Auth & User Schemas -----------------
class UserBase(BaseModel):
    name: str
    email: str
    role: str = "analyst" # 'admin', 'analyst', 'tourist'

class UserCreate(UserBase):
    password: str = Field(min_length=6)

class UserLogin(BaseModel):
    email: str
    password: str

class UserResponse(UserBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

# ----------------- Attraction Schemas -----------------
class AttractionBase(BaseModel):
    name: str
    city: str
    category: str = "Historical"
    latitude: float
    longitude: float
    capacity: int = 1000
    base_popularity: int = 75
    peak_start: int = 16
    peak_end: int = 19
    description: Optional[str] = ""

class AttractionCreate(AttractionBase):
    pass

class AttractionResponse(AttractionBase):
    id: int
    created_at: datetime
    current_visits: Optional[int] = 0
    current_crowd: Optional[str] = "Low"
    popularity_index: Optional[int] = 75

    class Config:
        from_attributes = True

# ----------------- Checkin Schemas -----------------
class CheckinCreate(BaseModel):
    tourist_code: str
    attraction_id: int
    city: str
    visit_date: str # "YYYY-MM-DD"
    visit_time: str # "HH:MM"
    latitude: float
    longitude: float
    source: str = "Check-in"
    duration: int = 120

class CheckinResponse(BaseModel):
    id: int
    tourist_code: str
    attraction_name: str
    city: str
    timestamp: datetime
    visit_date: date
    visit_time: str
    latitude: float
    longitude: float
    source: str
    duration: int
    crowd_level: str
    popularity_score: int

    class Config:
        from_attributes = True

# ----------------- Prediction Schemas -----------------
class ForecastRequest(BaseModel):
    attraction_id: int
    target_date: str # "YYYY-MM-DD"
    target_time: str # "HH:MM"

class ForecastResponse(BaseModel):
    attraction_id: int
    attraction_name: str
    city: str
    target_date: str
    target_time: str
    predicted_visitors: int
    historical_baseline_visitors: int
    crowd_level: str # Low, Moderate, High
    confidence_score: float
    model_name: str # "Local Scikit-learn Forecasting" or "BigQuery ML ARIMA_PLUS"
    prediction_horizon_days: int
    recommended_time_window: str
    recommended_alternative_attraction: Optional[str] = None
    historical_vs_forecast_comparison: Dict[str, Any]

# ----------------- Recommendation Schemas -----------------
class RecommendationItem(BaseModel):
    attraction_id: int
    name: str
    city: str
    category: str
    current_crowd: str
    predicted_visitors: int
    optimal_time_slot: str
    recommendation_reason: str
    alternative_to: Optional[str] = None

# ----------------- Analytics Schemas -----------------
class KPISummary(BaseModel):
    total_visits: int
    active_attractions: int
    top_attraction: str
    avg_crowd_level_pct: int
    peak_visiting_hour: str
    daily_average_visitors: int
    busiest_city: str
    high_crowd_attractions_count: int

class FlowPoint(BaseModel):
    label: str
    visits: int

class HeatmapCell(BaseModel):
    day: str
    day_idx: int
    period: str
    count: int
    percent: int

class RouteFlow(BaseModel):
    origin: str
    destination: str
    weight: int

# ----------------- Upload & Pipeline Schemas -----------------
class PipelineRunResponse(BaseModel):
    id: int
    filename: str
    total_records: int
    valid_records: int
    invalid_records: int
    duplicates_removed: int
    processed_records: int
    execution_time_ms: float
    mode: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

class SystemInfoResponse(BaseModel):
    application_mode: str # "LOCAL DEMO MODE — GCP INTEGRATION READY" or "GCP ANALYTICS MODE"
    database_type: str
    processing_engine: str
    analytics_engine: str
    prediction_model: str
    total_records_in_db: int
    total_attractions_in_db: int
    gcp_connected: bool
    dataset_disclaimer: str
