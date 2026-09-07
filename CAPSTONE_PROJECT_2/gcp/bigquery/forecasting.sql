-- =============================================================================
-- TourPulse: Cloud-Based Tourist Flow and Attraction Analytics
-- BigQuery ML: Time-Series Demand Forecasting (ARIMA_PLUS)
-- Dataset: tourist_analytics
-- =============================================================================

-- Step 1: Create or Replace ARIMA_PLUS Time-Series Forecasting Model
-- Automatically evaluates seasonality (daily/weekly), holiday effects, and trend decomposition
CREATE OR REPLACE MODEL `tourist_analytics.tourist_flow_arima_model`
OPTIONS (
  model_type = 'ARIMA_PLUS',
  time_series_timestamp_col = 'visit_date',
  time_series_data_col = 'daily_visitor_count',
  time_series_id_col = 'attraction_name',
  holiday_region = 'IN',              -- Incorporates regional holiday effects (India)
  data_frequency = 'DAILY',
  auto_arima = TRUE,
  decompose_time_series = TRUE
) AS
SELECT
  visit_date,
  attraction_name,
  COUNT(1) AS daily_visitor_count
FROM
  `tourist_analytics.processed_checkins`
GROUP BY
  visit_date, attraction_name;

-- Step 2: Evaluate Model Performance (AIC, Variance, Log Likelihood)
SELECT
  *
FROM
  ML.ARIMA_EVALUATE(MODEL `tourist_analytics.tourist_flow_arima_model`);

-- Step 3: Generate Multi-Day Tourist Flow Forecast (Horizon: 7 Days)
SELECT
  attraction_name,
  forecast_timestamp,
  ROUND(forecast_value) AS predicted_visitors,
  ROUND(prediction_interval_lower_bound) AS lower_bound_visitors,
  ROUND(prediction_interval_upper_bound) AS upper_bound_visitors,
  confidence_level,
  CASE
    WHEN forecast_value >= 400 THEN 'High Crowd Predicted'
    WHEN forecast_value >= 200 THEN 'Moderate Crowd Predicted'
    ELSE 'Low Crowd Predicted'
  END AS anticipated_crowd_level
FROM
  ML.FORECAST(
    MODEL `tourist_analytics.tourist_flow_arima_model`,
    STRUCT(7 AS horizon, 0.95 AS confidence_level)
  )
ORDER BY
  attraction_name, forecast_timestamp ASC;

-- Step 4: Hourly Forecast with Regressor Covariates (Linear/Boosted Tree Fallback)
CREATE OR REPLACE MODEL `tourist_analytics.hourly_crowd_boosted_tree`
OPTIONS (
  model_type = 'BOOSTED_TREE_REGRESSOR',
  input_label_cols = ['hourly_visitors']
) AS
SELECT
  attraction_name,
  city,
  EXTRACT(DAYOFWEEK FROM visit_date) AS day_of_week,
  hour,
  visit_duration_minutes,
  COUNT(1) AS hourly_visitors
FROM
  `tourist_analytics.processed_checkins`
GROUP BY
  attraction_name, city, day_of_week, hour, visit_duration_minutes;
