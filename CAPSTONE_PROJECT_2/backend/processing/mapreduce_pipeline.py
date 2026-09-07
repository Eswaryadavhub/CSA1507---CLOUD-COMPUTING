"""
================================================================================
TourPulse: Module 2 - Data Processing & Cleaning Engine
Local MapReduce & Pipeline Implementation
================================================================================
Mirrors the Google Cloud Dataproc PySpark MapReduce architecture locally
using Python & Pandas for zero-dependency execution.
================================================================================
"""

import time
import io
import datetime
import pandas as pd
import numpy as np
from typing import Dict, List, Tuple, Any

# Geographic bounding boxes for spatial validation
CITY_BOUNDS = {
    "chennai": {"min_lat": 12.80, "max_lat": 13.30, "min_lng": 80.00, "max_lng": 80.40},
    "bengaluru": {"min_lat": 12.70, "max_lat": 13.20, "min_lng": 77.40, "max_lng": 77.80},
    "hyderabad": {"min_lat": 17.20, "max_lat": 17.60, "min_lng": 78.20, "max_lng": 78.70},
    "mumbai": {"min_lat": 18.80, "max_lat": 19.30, "min_lng": 72.70, "max_lng": 73.10},
    "delhi": {"min_lat": 28.40, "max_lat": 28.90, "min_lng": 76.80, "max_lng": 77.40},
    "pune": {"min_lat": 18.30, "max_lat": 18.70, "min_lng": 73.65, "max_lng": 74.05}
}

class MapReducePipeline:
    def __init__(self):
        self.required_columns = [
            "tourist_id", "city", "attraction", "visit_date", "visit_time", "latitude", "longitude"
        ]

    def validate_row_geo(self, city: str, lat: float, lng: float) -> bool:
        """Validates if latitude and longitude lie within target urban zone boundaries."""
        if pd.isna(lat) or pd.isna(lng) or pd.isna(city):
            return False
        city_key = str(city).strip().lower()
        if city_key not in CITY_BOUNDS:
            return -90.0 <= lat <= 90.0 and -180.0 <= lng <= 180.0
        b = CITY_BOUNDS[city_key]
        return (b["min_lat"] <= lat <= b["max_lat"] and b["min_lng"] <= lng <= b["max_lng"])

    def parse_csv_stream(self, csv_content: str, existing_signatures: set = None) -> Dict[str, Any]:
        """
        Executes the 6-stage data cleaning, deduplication, and MapReduce aggregation pipeline.
        
        Stages:
          1. Raw Ingestion & Header Verification
          2. Schema Type Validation & Null Dropping
          3. Geo-Spatial Boundary Filtering
          4. Strict Deduplication (Duplicate Removal)
          5. MapReduce Aggregation Phase
          6. Analytics Staging
        """
        start_time = time.time()
        if existing_signatures is None:
            existing_signatures = set()

        errors = []
        
        # 1. Ingestion
        try:
            df = pd.read_csv(io.StringIO(csv_content), dtype=str)
        except Exception as e:
            return {
                "success": False,
                "error": f"Malformed CSV structure: {str(e)}",
                "total_records": 0
            }

        total_input_records = len(df)
        
        # Header verification
        normalized_cols = {c.lower().strip(): c for c in df.columns}
        missing_cols = [c for c in self.required_columns if c not in normalized_cols]
        if missing_cols:
            return {
                "success": False,
                "error": f"Missing required CSV columns: {', '.join(missing_cols)}",
                "total_records": total_input_records
            }

        # Rename to standard lowercase
        df = df.rename(columns={normalized_cols[c]: c for c in self.required_columns if c in normalized_cols})
        
        # Optional columns
        if "visit_duration" not in df.columns:
            df["visit_duration"] = "120"
        if "source" not in df.columns:
            df["source"] = "Check-in"

        # 2. Cleaning & Null Validation
        valid_rows = []
        invalid_records_count = 0
        duplicates_removed_count = 0
        seen_in_batch = set()

        for idx, row in df.iterrows():
            row_num = idx + 2 # Header is line 1
            tourist_id = str(row["tourist_id"]).strip() if pd.notna(row["tourist_id"]) else ""
            city = str(row["city"]).strip() if pd.notna(row["city"]) else ""
            attraction = str(row["attraction"]).strip() if pd.notna(row["attraction"]) else ""
            visit_date = str(row["visit_date"]).strip() if pd.notna(row["visit_date"]) else ""
            visit_time = str(row["visit_time"]).strip() if pd.notna(row["visit_time"]) else ""

            if not tourist_id or not city or not attraction or not visit_date or not visit_time:
                invalid_records_count += 1
                errors.append(f"Row {row_num}: Missing mandatory attribute (ID/City/Attraction/Date/Time)")
                continue

            # Parse numeric latitude/longitude
            try:
                lat = float(row["latitude"])
                lng = float(row["longitude"])
            except (ValueError, TypeError):
                invalid_records_count += 1
                errors.append(f"Row {row_num}: Invalid numeric coordinates ({row.get('latitude')}, {row.get('longitude')})")
                continue

            # Geo-spatial boundary validation
            if not self.validate_row_geo(city, lat, lng):
                invalid_records_count += 1
                errors.append(f"Row {row_num}: Coordinates ({lat}, {lng}) out of boundary for city {city}")
                continue

            # Date format validation (YYYY-MM-DD)
            try:
                dt_date = datetime.datetime.strptime(visit_date, "%Y-%m-%d").date()
            except ValueError:
                invalid_records_count += 1
                errors.append(f"Row {row_num}: Invalid date format '{visit_date}', expected YYYY-MM-DD")
                continue

            # Time format validation (HH:MM)
            try:
                time_parts = visit_time.split(":")
                hr = int(time_parts[0])
                mn = int(time_parts[1])
                if hr < 0 or hr > 23 or mn < 0 or mn > 59:
                    raise ValueError
                normalized_time = f"{hr:02d}:{mn:02d}"
            except Exception:
                invalid_records_count += 1
                errors.append(f"Row {row_num}: Invalid time format '{visit_time}', expected HH:MM")
                continue

            # Duration & Source sanitization
            try:
                duration = int(float(row["visit_duration"])) if pd.notna(row["visit_duration"]) else 120
                if duration <= 0:
                    duration = 60
            except Exception:
                duration = 120

            source = str(row["source"]).strip() if pd.notna(row["source"]) else "Check-in"
            if source not in ["GPS", "Travel App", "Check-in"]:
                source = "Check-in"

            # 4. Strict Deduplication Check
            # Key signature: (tourist_id, attraction, visit_date, visit_time)
            record_signature = (tourist_id, city.lower(), attraction.lower(), visit_date, normalized_time)
            if record_signature in seen_in_batch or record_signature in existing_signatures:
                duplicates_removed_count += 1
                continue
            
            seen_in_batch.add(record_signature)

            # Combined timestamp
            timestamp = datetime.datetime.combine(
                dt_date,
                datetime.time(int(normalized_time.split(":")[0]), int(normalized_time.split(":")[1]))
            )

            valid_rows.append({
                "tourist_code": tourist_id,
                "city": city.title(),
                "attraction_name": attraction,
                "visit_date": dt_date,
                "visit_time": normalized_time,
                "hour": int(normalized_time.split(":")[0]),
                "timestamp": timestamp,
                "latitude": round(lat, 6),
                "longitude": round(lng, 6),
                "duration": duration,
                "source": source
            })

        # 5. MapReduce Aggregation Step
        # Map: ((attraction, hour), (1, duration))
        # Reduce: aggregate visitor volume, average duration, calculate crowd level
        map_records = {}
        for r in valid_rows:
            map_key = (r["attraction_name"], r["city"], r["hour"])
            if map_key not in map_records:
                map_records[map_key] = {"count": 0, "total_duration": 0}
            map_records[map_key]["count"] += 1
            map_records[map_key]["total_duration"] += r["duration"]

        # Assign crowd levels to valid records using the aggregated hourly density
        for r in valid_rows:
            key = (r["attraction_name"], r["city"], r["hour"])
            density = map_records[key]["count"]
            if density >= 50:
                r["crowd_level"] = "High"
                r["popularity_score"] = 92
            elif density >= 20:
                r["crowd_level"] = "Moderate"
                r["popularity_score"] = 70
            else:
                r["crowd_level"] = "Low"
                r["popularity_score"] = 45

        elapsed_time_ms = round((time.time() - start_time) * 1000, 2)

        return {
            "success": True,
            "total_records": total_input_records,
            "valid_records": len(valid_rows),
            "invalid_records": invalid_records_count,
            "duplicates_removed": duplicates_removed_count,
            "processed_records": len(valid_rows),
            "execution_time_ms": elapsed_time_ms,
            "mode": "Local MapReduce Mode (PySpark Algorithm Equivalent)",
            "errors": errors[:50], # Cap error report at top 50
            "cleaned_data": valid_rows
        }

# Global singleton instance
mapreduce_engine = MapReducePipeline()
