-- =============================================================================
-- TourPulse: Cloud-Based Tourist Flow and Attraction Analytics
-- BigQuery Analytics Query Suite
-- Dataset: tourist_analytics
-- =============================================================================

-- Query 1: Executive KPI Overview by City
SELECT
  city,
  COUNT(1) AS total_tourist_visits,
  COUNT(DISTINCT tourist_id) AS distinct_tourists,
  COUNT(DISTINCT attraction_name) AS active_monitored_attractions,
  ROUND(AVG(visit_duration_minutes), 1) AS avg_dwell_time_minutes,
  APPROX_TOP_COUNT(attraction_name, 1)[OFFSET(0)].value AS most_popular_attraction,
  APPROX_TOP_COUNT(hour, 1)[OFFSET(0)].value AS peak_visiting_hour
FROM
  `tourist_analytics.processed_checkins`
WHERE
  visit_date BETWEEN DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY) AND CURRENT_DATE()
GROUP BY
  city
ORDER BY
  total_tourist_visits DESC;

-- Query 2: Attraction Popularity Rankings & Activity Tiers
SELECT
  city,
  attraction_name,
  COUNT(1) AS visit_count,
  ROUND(AVG(popularity_score), 1) AS avg_popularity_score,
  COUNT(CASE WHEN crowd_level = 'High' THEN 1 END) AS high_crowd_instances,
  ROUND(COUNT(CASE WHEN crowd_level = 'High' THEN 1 END) * 100.0 / COUNT(1), 1) AS bottleneck_risk_percentage,
  DENSE_RANK() OVER(PARTITION BY city ORDER BY COUNT(1) DESC) AS city_rank
FROM
  `tourist_analytics.processed_checkins`
GROUP BY
  city, attraction_name
ORDER BY
  city, city_rank;

-- Query 3: Peak Visiting Hours Analysis (24-Hour Distribution)
SELECT
  hour,
  city,
  COUNT(1) AS hourly_checkin_count,
  ROUND(AVG(visit_duration_minutes), 1) AS avg_duration,
  CASE
    WHEN hour BETWEEN 6 AND 11 THEN 'Morning Window'
    WHEN hour BETWEEN 12 AND 16 THEN 'Afternoon Window'
    WHEN hour BETWEEN 17 AND 21 THEN 'Evening Peak Window'
    ELSE 'Night Window'
  END AS time_period
FROM
  `tourist_analytics.processed_checkins`
GROUP BY
  hour, city, time_period
ORDER BY
  city, hour ASC;

-- Query 4: Origin -> Destination Movement Pathways (Transfer Flows)
WITH OrderedVisits AS (
  SELECT
    tourist_id,
    attraction_name,
    city,
    visit_timestamp,
    LEAD(attraction_name) OVER (PARTITION BY tourist_id, city ORDER BY visit_timestamp) AS next_attraction,
    LEAD(visit_timestamp) OVER (PARTITION BY tourist_id, city ORDER BY visit_timestamp) AS next_visit_timestamp
  FROM
    `tourist_analytics.processed_checkins`
)
SELECT
  city,
  attraction_name AS origin_attraction,
  next_attraction AS destination_attraction,
  COUNT(1) AS transfer_volume,
  ROUND(AVG(TIMESTAMP_DIFF(next_visit_timestamp, visit_timestamp, MINUTE)), 1) AS avg_transit_interval_minutes
FROM
  OrderedVisits
WHERE
  next_attraction IS NOT NULL
  AND attraction_name != next_attraction
GROUP BY
  city, origin_attraction, destination_attraction
HAVING
  transfer_volume >= 5
ORDER BY
  transfer_volume DESC
LIMIT 20;

-- Query 5: Weekly vs Weekend Density Breakdown (Heatmap Matrix Data)
SELECT
  FORMAT_DATE('%A', visit_date) AS day_of_week,
  EXTRACT(DAYOFWEEK FROM visit_date) AS day_index,
  CASE
    WHEN hour BETWEEN 6 AND 11 THEN 'Morning'
    WHEN hour BETWEEN 12 AND 16 THEN 'Afternoon'
    WHEN hour BETWEEN 17 AND 21 THEN 'Evening'
    ELSE 'Night'
  END AS period_name,
  COUNT(1) AS visit_count,
  COUNT(DISTINCT tourist_id) AS unique_visitors
FROM
  `tourist_analytics.processed_checkins`
GROUP BY
  day_of_week, day_index, period_name
ORDER BY
  day_index ASC;

-- Query 6: Under-Visited Attractions for Tourism Diversion & Balancing
WITH CityStats AS (
  SELECT
    city,
    AVG(visit_count) AS avg_city_attraction_visits
  FROM (
    SELECT city, attraction_name, COUNT(1) AS visit_count
    FROM `tourist_analytics.processed_checkins`
    GROUP BY city, attraction_name
  )
  GROUP BY city
)
SELECT
  p.city,
  p.attraction_name,
  COUNT(1) AS total_visits,
  ROUND(c.avg_city_attraction_visits, 1) AS city_benchmark_avg,
  ROUND((c.avg_city_attraction_visits - COUNT(1)) * 100.0 / c.avg_city_attraction_visits, 1) AS under_capacity_percentage,
  'Recommended for Crowd Diversion Campaign' AS strategic_recommendation
FROM
  `tourist_analytics.processed_checkins` p
JOIN
  CityStats c ON p.city = c.city
GROUP BY
  p.city, p.attraction_name, c.avg_city_attraction_visits
HAVING
  COUNT(1) < c.avg_city_attraction_visits * 0.70
ORDER BY
  under_capacity_percentage DESC;
