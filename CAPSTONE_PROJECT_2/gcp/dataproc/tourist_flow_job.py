#!/usr/bin/env python3
"""
================================================================================
TourPulse: Cloud-Based Tourist Flow and Attraction Analytics
Google Cloud Dataproc PySpark MapReduce Job
================================================================================
Purpose:
  Batch-processes large-scale tourist telemetry (GPS, travel apps, check-ins)
  from Google Cloud Storage, performs data cleaning, deduplication, geo-bounds
  validation, and executes MapReduce aggregations for BigQuery analytical loading.

Usage:
  gcloud dataproc jobs submit pyspark tourist_flow_job.py \
      --cluster=tourpulse-dataproc-cluster \
      --region=us-central1 \
      -- \
      --input_path=gs://tourpulse-raw-data/checkins/ \
      --output_path=gs://tourpulse-processed-data/analytics/
================================================================================
"""

import sys
import argparse
from datetime import datetime
from pyspark.sql import SparkSession
from pyspark.sql.functions import (
    col, udf, to_timestamp, hour, date_format, count, avg,
    row_number, when, round as spark_round
)
from pyspark.sql.types import (
    StringType, IntegerType, DoubleType, BooleanType, StructType, StructField
)
from pyspark.sql.window import Window

# City bounding boxes (latitude min/max, longitude min/max) for geo-filtering
CITY_BOUNDS = {
    "chennai": {"min_lat": 12.80, "max_lat": 13.30, "min_lng": 80.00, "max_lng": 80.40},
    "bengaluru": {"min_lat": 12.70, "max_lat": 13.20, "min_lng": 77.40, "max_lng": 77.80},
    "hyderabad": {"min_lat": 17.20, "max_lat": 17.60, "min_lng": 78.20, "max_lng": 78.70},
    "mumbai": {"min_lat": 18.80, "max_lat": 19.30, "min_lng": 72.70, "max_lng": 73.10},
    "delhi": {"min_lat": 28.40, "max_lat": 28.90, "min_lng": 76.80, "max_lng": 77.40},
    "pune": {"min_lat": 18.30, "max_lat": 18.70, "min_lng": 73.65, "max_lng": 74.05}
}

def is_valid_coordinate(city, lat, lng):
    """Validate latitude and longitude against geographic boundaries."""
    if lat is None or lng is None or city is None:
        return False
    city_key = str(city).strip().lower()
    if city_key not in CITY_BOUNDS:
        # Default global sanity check
        return -90.0 <= lat <= 90.0 and -180.0 <= lng <= 180.0
    bounds = CITY_BOUNDS[city_key]
    return (bounds["min_lat"] <= lat <= bounds["max_lat"] and
            bounds["min_lng"] <= lng <= bounds["max_lng"])

is_valid_geo_udf = udf(is_valid_coordinate, BooleanType())

def classify_crowd_level(visitor_count, capacity):
    """Calculate crowd load level based on attraction capacity."""
    if capacity is None or capacity <= 0:
        capacity = 1000
    ratio = visitor_count / float(capacity)
    if ratio > 0.80:
        return "High"
    elif ratio > 0.45:
        return "Moderate"
    return "Low"

classify_crowd_udf = udf(classify_crowd_level, StringType())

def main(input_path, output_path):
    print(f"[*] Starting TourPulse Dataproc MapReduce Job...")
    print(f"[*] Reading raw datasets from: {input_path}")
    print(f"[*] Destination staging path: {output_path}")

    spark = SparkSession.builder \
        .appName("TourPulse-TouristFlowAnalytics-MapReduce") \
        .getOrCreate()

    spark.sparkContext.setLogLevel("WARN")

    # Define schema for raw tourist check-in stream
    raw_schema = StructType([
        StructField("tourist_id", StringType(), False),
        StructField("city", StringType(), False),
        StructField("attraction", StringType(), False),
        StructField("visit_date", StringType(), False),
        StructField("visit_time", StringType(), False),
        StructField("latitude", DoubleType(), True),
        StructField("longitude", DoubleType(), True),
        StructField("visit_duration", IntegerType(), True),
        StructField("source", StringType(), True)
    ])

    # 1. Ingestion: Load raw data from Google Cloud Storage
    raw_df = spark.read \
        .option("header", "true") \
        .schema(raw_schema) \
        .csv(input_path)

    total_raw_count = raw_df.count()
    print(f"[+] Total raw records ingested: {total_raw_count}")

    # 2. Data Cleaning & Validation
    # Drop rows with null essential attributes
    clean_df = raw_df.dropna(subset=["tourist_id", "city", "attraction", "visit_date", "visit_time"])

    # Geo-bounds validation
    geo_validated_df = clean_df.filter(
        is_valid_geo_udf(col("city"), col("latitude"), col("longitude"))
    )

    # 3. Deduplication
    # Window partition over tourist identity and exact timestamp
    dedup_window = Window.partitionBy("tourist_id", "attraction", "visit_date", "visit_time").orderBy("visit_date")
    deduplicated_df = geo_validated_df.withColumn("row_num", row_number().over(dedup_window)) \
        .filter(col("row_num") == 1) \
        .drop("row_num")

    clean_count = deduplicated_df.count()
    duplicates_removed = total_raw_count - clean_count
    print(f"[+] Deduplication complete: {duplicates_removed} duplicate/invalid records filtered.")
    print(f"[+] Clean records ready for MapReduce: {clean_count}")

    # Standardize timestamp
    processed_df = deduplicated_df.withColumn(
        "timestamp", to_timestamp(col("visit_date") + " " + col("visit_time"), "yyyy-MM-dd HH:mm")
    ).withColumn("hour", hour(col("timestamp")))

    # 4. MapReduce Phase 1: Hourly Flow Aggregation
    # Map: ((attraction, city, hour, visit_date), (1, visit_duration))
    # Reduce: aggregate visitor counts and average dwell time
    hourly_flow_df = processed_df.groupBy("city", "attraction", "visit_date", "hour").agg(
        count("tourist_id").alias("visitor_count"),
        spark_round(avg("visit_duration"), 1).alias("avg_duration_minutes")
    )

    # Compute crowd levels
    hourly_flow_df = hourly_flow_df.withColumn(
        "crowd_level",
        when(col("visitor_count") > 80, "High")
        .when(col("visitor_count") > 35, "Moderate")
        .otherwise("Low")
    )

    # 5. MapReduce Phase 2: Attraction Popularity Rankings
    popularity_df = processed_df.groupBy("city", "attraction").agg(
        count("tourist_id").alias("total_visits"),
        spark_round(avg("visit_duration"), 1).alias("overall_avg_duration")
    ).orderBy(col("total_visits").desc())

    # 6. Output to Google Cloud Storage (Parquet / ORC for BigQuery External Table ingestion)
    timestamp_str = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    
    print(f"[*] Writing aggregated hourly flow to: {output_path}/hourly_flow_{timestamp_str}")
    hourly_flow_df.write.mode("overwrite").parquet(f"{output_path}/hourly_flow_{timestamp_str}")

    print(f"[*] Writing attraction popularity summaries to: {output_path}/attraction_popularity_{timestamp_str}")
    popularity_df.write.mode("overwrite").parquet(f"{output_path}/attraction_popularity_{timestamp_str}")

    print(f"[✓] TourPulse Dataproc MapReduce Job completed successfully!")
    spark.stop()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="TourPulse GCP Dataproc Tourist Flow MapReduce")
    parser.add_argument("--input_path", required=True, help="GCS URI or local path for raw check-in data")
    parser.add_argument("--output_path", required=True, help="GCS URI or local path for aggregated outputs")
    args = parser.parse_args()
    main(args.input_path, args.output_path)
