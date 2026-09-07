import datetime
from sqlalchemy import (
    Column, Integer, String, Float, DateTime, ForeignKey, Text, Boolean, Date
)
from sqlalchemy.orm import relationship, declarative_base
Base = declarative_base()

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(50), default="analyst", nullable=False) # 'admin', 'analyst', 'tourist'
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    reports = relationship("Report", back_populates="creator")

class Tourist(Base):
    __tablename__ = "tourists"

    id = Column(Integer, primary_key=True, index=True)
    tourist_code = Column(String(100), unique=True, index=True, nullable=False)
    device_type = Column(String(50), default="Mobile GPS")
    home_city = Column(String(100), default="Unknown")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    checkins = relationship("Checkin", back_populates="tourist")

class Attraction(Base):
    __tablename__ = "attractions"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False, index=True)
    city = Column(String(100), nullable=False, index=True)
    category = Column(String(100), default="Historical")
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    capacity = Column(Integer, default=1000)
    base_popularity = Column(Integer, default=75)
    peak_start = Column(Integer, default=16) # 24hr format hour (e.g. 16 for 4 PM)
    peak_end = Column(Integer, default=19)
    description = Column(Text, default="")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    checkins = relationship("Checkin", back_populates="attraction", cascade="all, delete-orphan")
    predictions = relationship("Prediction", back_populates="attraction", cascade="all, delete-orphan")

class Checkin(Base):
    __tablename__ = "checkins"

    id = Column(Integer, primary_key=True, index=True)
    tourist_id = Column(Integer, ForeignKey("tourists.id"), nullable=True)
    tourist_code = Column(String(100), index=True, nullable=False)
    attraction_id = Column(Integer, ForeignKey("attractions.id"), nullable=False)
    attraction_name = Column(String(150), nullable=False, index=True)
    city = Column(String(100), nullable=False, index=True)
    timestamp = Column(DateTime, nullable=False, index=True)
    visit_date = Column(Date, nullable=False, index=True)
    visit_time = Column(String(10), nullable=False) # "18:30"
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    source = Column(String(50), default="Check-in") # "GPS", "Travel App", "Check-in"
    duration = Column(Integer, default=120) # minutes
    crowd_level = Column(String(50), default="Low") # "Low", "Moderate", "High"
    popularity_score = Column(Integer, default=60)

    tourist = relationship("Tourist", back_populates="checkins")
    attraction = relationship("Attraction", back_populates="checkins")

class Prediction(Base):
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, index=True)
    attraction_id = Column(Integer, ForeignKey("attractions.id"), nullable=False)
    prediction_date = Column(Date, nullable=False)
    prediction_time = Column(String(10), nullable=False)
    predicted_visitors = Column(Integer, nullable=False)
    crowd_level = Column(String(50), default="Moderate")
    confidence_score = Column(Float, default=88.5)
    model_used = Column(String(100), default="Local Scikit-learn Forecasting") # or "BigQuery ML ARIMA_PLUS"
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    attraction = relationship("Attraction", back_populates="predictions")

class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    generated_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    report_type = Column(String(50), default="PDF") # "PDF", "CSV", "Excel"
    city = Column(String(100), default="All")
    period = Column(String(100), default="Past 30 Days")
    file_path = Column(String(255), nullable=True)
    total_visits = Column(Integer, default=0)
    generated_at = Column(DateTime, default=datetime.datetime.utcnow)

    creator = relationship("User", back_populates="reports")

class PipelineRun(Base):
    """Tracks real batch processing pipeline execution stats for Module 2 and Viva."""
    __tablename__ = "pipeline_runs"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String(200), default="dataset.csv")
    total_records = Column(Integer, default=0)
    valid_records = Column(Integer, default=0)
    invalid_records = Column(Integer, default=0)
    duplicates_removed = Column(Integer, default=0)
    processed_records = Column(Integer, default=0)
    execution_time_ms = Column(Float, default=0.0)
    mode = Column(String(50), default="Local MapReduce Mode")
    status = Column(String(50), default="Completed")
    error_summary = Column(Text, default="")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
