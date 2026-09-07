-- =============================================================================
-- TourPulse: Cloud-Based Tourist Flow and Attraction Analytics
-- BigQuery Schema Definition
-- Dataset: tourist_analytics
-- =============================================================================

CREATE SCHEMA IF NOT EXISTS `tourist_analytics`
OPTIONS (
  location = 'us-central1',
  description = 'Data warehouse for cloud-based tourist flow, attraction telemetry, and ML predictions'
);

-- 1. Processed Checkins Fact Table (Partitioned by visit_date, Clustered by city, attraction_name)
CREATE TABLE IF NOT EXISTS `tourist_analytics.processed_checkins` (
  checkin_id STRING NOT NULL,
  tourist_id STRING NOT NULL,
  city STRING NOT NULL,
  attraction_id STRING NOT NULL,
  attraction_name STRING NOT NULL,
  visit_timestamp TIMESTAMP NOT NULL,
  visit_date DATE NOT NULL,
  visit_time STRING NOT NULL,
  hour INT64 NOT NULL,
  latitude FLOAT64 NOT NULL,
  longitude FLOAT64 NOT NULL,
  source_channel STRING NOT NULL, -- GPS, Travel App, Check-in
  visit_duration_minutes INT64,
  crowd_level STRING,            -- Low, Moderate, High
  popularity_score INT64,
  ingestion_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP()
)
PARTITION BY visit_date
CLUSTER BY city, attraction_name
OPTIONS (
  description = 'Cleaned, deduplicated, and geo-validated tourist telemetry ingested via Dataproc'
);

-- 2. Hourly Tourist Flow Summary Table
CREATE TABLE IF NOT EXISTS `tourist_analytics.tourist_flow_hourly` (
  city STRING NOT NULL,
  attraction_name STRING NOT NULL,
  visit_date DATE NOT NULL,
  hour_of_day INT64 NOT NULL,
  visitor_count INT64 NOT NULL,
  avg_duration_minutes FLOAT64,
  crowd_status STRING,
  is_weekend BOOLEAN
)
PARTITION BY visit_date
CLUSTER BY city, attraction_name;

-- 3. Attraction Analytics Aggregation View
CREATE OR REPLACE VIEW `tourist_analytics.attraction_analytics` AS
SELECT
  city,
  attraction_name,
  COUNT(DISTINCT tourist_id) AS total_unique_visitors,
  COUNT(1) AS total_visits,
  ROUND(AVG(visit_duration_minutes), 1) AS avg_duration_minutes,
  APPROX_TOP_COUNT(hour, 1)[OFFSET(0)].value AS peak_visiting_hour,
  ROUND(COUNT(1) * 100.0 / SUM(COUNT(1)) OVER(PARTITION BY city), 2) AS city_traffic_share_percentage,
  CASE
    WHEN COUNT(1) >= 1000 THEN 'High Activity'
    WHEN COUNT(1) >= 400 THEN 'Moderate Activity'
    ELSE 'Low Activity'
  END AS activity_tier
FROM
  `tourist_analytics.processed_checkins`
GROUP BY
  city, attraction_name;

-- 4. Daily Tourist Flow Trends View
CREATE OR REPLACE VIEW `tourist_analytics.tourist_flow_daily` AS
SELECT
  city,
  visit_date,
  EXTRACT(DAYOFWEEK FROM visit_date) AS day_of_week,
  FORMAT_DATE('%A', visit_date) AS weekday_name,
  COUNT(1) AS total_daily_checkins,
  COUNT(DISTINCT attraction_name) AS active_attractions_count,
  ROUND(AVG(visit_duration_minutes), 1) AS avg_visit_duration
FROM
  `tourist_analytics.processed_checkins`
GROUP BY
  city, visit_date, day_of_week, weekday_name;

-- 5. Crowd Bottleneck & Overcrowding Analysis Table
CREATE TABLE IF NOT EXISTS `tourist_analytics.crowd_analysis` (
  analysis_id STRING NOT NULL,
  city STRING NOT NULL,
  attraction_name STRING NOT NULL,
  assessment_timestamp TIMESTAMP NOT NULL,
  current_crowd_level STRING NOT NULL, -- Low, Moderate, High
  density_percentage FLOAT64 NOT NULL,
  is_bottleneck_warning BOOLEAN NOT NULL,
  recommended_alternative_attraction STRING
);

-- 6. Model Prediction Outputs Table
CREATE TABLE IF NOT EXISTS `tourist_analytics.predictions` (
  prediction_id STRING NOT NULL,
  attraction_name STRING NOT NULL,
  city STRING NOT NULL,
  forecast_target_date DATE NOT NULL,
  forecast_target_hour INT64 NOT NULL,
  predicted_visitors INT64 NOT NULL,
  confidence_score FLOAT64,
  predicted_crowd_level STRING,
  model_name STRING,                  -- 'BigQuery_ML_ARIMA_PLUS' or 'Local_Scikit_Learn'
  generated_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP()
);
