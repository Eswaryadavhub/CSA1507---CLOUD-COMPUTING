"""
TourPulse: Oracle SQL Query Catalog
Defines parameterized, injection-safe SQL queries for Oracle Database.
"""

# 1. KPI Queries
SQL_GET_KPI_METRICS = """
SELECT 
    COUNT(c.checkin_id) AS total_visits,
    COUNT(DISTINCT c.attraction_id) AS active_attractions,
    NVL(ROUND(AVG(c.visit_duration), 1), 0) AS avg_duration_mins
FROM CHECKINS c
WHERE (:city = 'All' OR c.city = :city)
  AND (:start_date IS NULL OR c.checkin_timestamp >= TO_TIMESTAMP(:start_date || ' 00:00:00', 'YYYY-MM-DD HH24:MI:SS'))
  AND (:end_date IS NULL OR c.checkin_timestamp <= TO_TIMESTAMP(:end_date || ' 23:59:59', 'YYYY-MM-DD HH24:MI:SS'))
"""

SQL_GET_TOP_ATTRACTION = """
SELECT * FROM (
    SELECT a.attraction_name, COUNT(c.checkin_id) AS visit_count
    FROM CHECKINS c
    JOIN ATTRACTIONS a ON c.attraction_id = a.attraction_id
    WHERE (:city = 'All' OR c.city = :city)
      AND (:start_date IS NULL OR c.checkin_timestamp >= TO_TIMESTAMP(:start_date || ' 00:00:00', 'YYYY-MM-DD HH24:MI:SS'))
      AND (:end_date IS NULL OR c.checkin_timestamp <= TO_TIMESTAMP(:end_date || ' 23:59:59', 'YYYY-MM-DD HH24:MI:SS'))
    GROUP BY a.attraction_name
    ORDER BY visit_count DESC
) WHERE ROWNUM = 1
"""

SQL_GET_PEAK_HOUR = """
SELECT * FROM (
    SELECT 
        EXTRACT(HOUR FROM c.checkin_timestamp) AS hour_num,
        COUNT(c.checkin_id) AS visit_count
    FROM CHECKINS c
    WHERE (:city = 'All' OR c.city = :city)
      AND (:start_date IS NULL OR c.checkin_timestamp >= TO_TIMESTAMP(:start_date || ' 00:00:00', 'YYYY-MM-DD HH24:MI:SS'))
      AND (:end_date IS NULL OR c.checkin_timestamp <= TO_TIMESTAMP(:end_date || ' 23:59:59', 'YYYY-MM-DD HH24:MI:SS'))
    GROUP BY EXTRACT(HOUR FROM c.checkin_timestamp)
    ORDER BY visit_count DESC
) WHERE ROWNUM = 1
"""

# 2. Tourist Flow Time Series
SQL_GET_DAILY_FLOW = """
SELECT 
    TO_CHAR(c.checkin_timestamp, 'YYYY-MM-DD') AS checkin_date,
    COUNT(c.checkin_id) AS visit_count
FROM CHECKINS c
WHERE (:city = 'All' OR c.city = :city)
  AND (:start_date IS NULL OR c.checkin_timestamp >= TO_TIMESTAMP(:start_date || ' 00:00:00', 'YYYY-MM-DD HH24:MI:SS'))
  AND (:end_date IS NULL OR c.checkin_timestamp <= TO_TIMESTAMP(:end_date || ' 23:59:59', 'YYYY-MM-DD HH24:MI:SS'))
GROUP BY TO_CHAR(c.checkin_timestamp, 'YYYY-MM-DD')
ORDER BY checkin_date ASC
"""

SQL_GET_HOURLY_FLOW = """
SELECT 
    EXTRACT(HOUR FROM c.checkin_timestamp) AS hour_num,
    COUNT(c.checkin_id) AS visit_count
FROM CHECKINS c
WHERE (:city = 'All' OR c.city = :city)
  AND (:start_date IS NULL OR c.checkin_timestamp >= TO_TIMESTAMP(:start_date || ' 00:00:00', 'YYYY-MM-DD HH24:MI:SS'))
  AND (:end_date IS NULL OR c.checkin_timestamp <= TO_TIMESTAMP(:end_date || ' 23:59:59', 'YYYY-MM-DD HH24:MI:SS'))
GROUP BY EXTRACT(HOUR FROM c.checkin_timestamp)
ORDER BY hour_num ASC
"""

# 3. Weekly Heatmap Matrix (7 days x 4 diurnal periods)
# Diurnal periods: Morning (06-12), Afternoon (12-17), Evening (17-21), Night (21-06)
SQL_GET_HEATMAP_GRID = """
SELECT 
    TO_CHAR(c.checkin_timestamp, 'D') - 1 AS day_idx,
    CASE 
        WHEN EXTRACT(HOUR FROM c.checkin_timestamp) BETWEEN 6 AND 11 THEN 'Morning'
        WHEN EXTRACT(HOUR FROM c.checkin_timestamp) BETWEEN 12 AND 16 THEN 'Afternoon'
        WHEN EXTRACT(HOUR FROM c.checkin_timestamp) BETWEEN 17 AND 20 THEN 'Evening'
        ELSE 'Night'
    END AS period_name,
    COUNT(c.checkin_id) AS visit_count
FROM CHECKINS c
WHERE (:city = 'All' OR c.city = :city)
GROUP BY 
    TO_CHAR(c.checkin_timestamp, 'D') - 1,
    CASE 
        WHEN EXTRACT(HOUR FROM c.checkin_timestamp) BETWEEN 6 AND 11 THEN 'Morning'
        WHEN EXTRACT(HOUR FROM c.checkin_timestamp) BETWEEN 12 AND 16 THEN 'Afternoon'
        WHEN EXTRACT(HOUR FROM c.checkin_timestamp) BETWEEN 17 AND 20 THEN 'Evening'
        ELSE 'Night'
    END
"""

# 4. Attractions Catalog & Popularity Ranking
SQL_GET_POPULARITY_RANKING = """
SELECT 
    a.attraction_id,
    a.attraction_name,
    a.city,
    a.category,
    a.capacity,
    COUNT(c.checkin_id) AS total_visits
FROM ATTRACTIONS a
LEFT JOIN CHECKINS c ON a.attraction_id = c.attraction_id
WHERE (:city = 'All' OR a.city = :city)
GROUP BY a.attraction_id, a.attraction_name, a.city, a.category, a.capacity
ORDER BY total_visits DESC
"""

SQL_GET_ATTRACTIONS_LIST = """
SELECT 
    a.attraction_id,
    a.attraction_name,
    a.city,
    a.category,
    a.latitude,
    a.longitude,
    a.capacity,
    a.description,
    NVL(cv.total_visits, 0) AS total_visits
FROM ATTRACTIONS a
LEFT JOIN (
    SELECT attraction_id, COUNT(checkin_id) AS total_visits
    FROM CHECKINS
    GROUP BY attraction_id
) cv ON a.attraction_id = cv.attraction_id
WHERE (:city = 'All' OR a.city = :city)
  AND (:category = 'all' OR a.category = :category)
  AND (:search IS NULL OR LOWER(a.attraction_name) LIKE '%' || LOWER(:search) || '%')
"""

# 5. Attraction Detail Analytics
SQL_GET_ATTRACTION_HOURLY_DIST = """
SELECT 
    EXTRACT(HOUR FROM checkin_timestamp) AS hour_num,
    COUNT(checkin_id) AS visit_count
FROM CHECKINS
WHERE attraction_id = :attraction_id
GROUP BY EXTRACT(HOUR FROM checkin_timestamp)
ORDER BY hour_num ASC
"""

SQL_GET_ATTRACTION_SOURCE_BREAKDOWN = """
SELECT 
    source,
    COUNT(checkin_id) AS count
FROM CHECKINS
WHERE attraction_id = :attraction_id
GROUP BY source
"""

# 6. Ingestion History
SQL_INSERT_DATASET_UPLOAD = """
INSERT INTO DATASET_UPLOADS (file_name, total_records, valid_records, invalid_records, duplicate_records, inserted_records, upload_status)
VALUES (:file_name, :total_records, :valid_records, :invalid_records, :duplicate_records, :inserted_records, :upload_status)
"""

SQL_GET_DATASET_UPLOADS = """
SELECT upload_id, file_name, total_records, valid_records, invalid_records, duplicate_records, inserted_records, upload_status, TO_CHAR(uploaded_at, 'YYYY-MM-DD HH24:MI:SS') AS uploaded_at
FROM DATASET_UPLOADS
ORDER BY upload_id DESC
"""

# 7. Name to ID Lookup
SQL_LOOKUP_ATTRACTION_BY_NAME = """
SELECT attraction_id, attraction_name, city, category, capacity
FROM ATTRACTIONS
WHERE LOWER(TRIM(attraction_name)) = LOWER(TRIM(:attraction_name))
"""

# 8. Insert Checkin
SQL_INSERT_CHECKIN = """
INSERT INTO CHECKINS (tourist_id, attraction_id, city, checkin_timestamp, latitude, longitude, source, visit_duration, crowd_level)
VALUES (:tourist_id, :attraction_id, :city, TO_TIMESTAMP(:checkin_timestamp, 'YYYY-MM-DD HH24:MI:SS'), :latitude, :longitude, :source, :visit_duration, :crowd_level)
"""
