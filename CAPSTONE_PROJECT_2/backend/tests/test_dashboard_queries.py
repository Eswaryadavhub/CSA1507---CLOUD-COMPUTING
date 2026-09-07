"""
Test Suite: Dashboard SQL Queries Catalog & Parameterization
Validates Oracle SQL query statements, bind variable conventions, and functions.
"""

import unittest
from backend.database.queries import (
    SQL_GET_KPI_METRICS,
    SQL_GET_TOP_ATTRACTION,
    SQL_GET_PEAK_HOUR,
    SQL_GET_DAILY_FLOW,
    SQL_GET_HOURLY_FLOW,
    SQL_GET_HEATMAP_GRID,
    SQL_GET_POPULARITY_RANKING,
    SQL_GET_ATTRACTIONS_LIST,
    SQL_GET_ATTRACTION_HOURLY_DIST,
    SQL_GET_ATTRACTION_SOURCE_BREAKDOWN,
    SQL_LOOKUP_ATTRACTION_BY_NAME,
    SQL_INSERT_CHECKIN,
    SQL_INSERT_DATASET_UPLOAD,
    SQL_GET_DATASET_UPLOADS
)

class TestDashboardQueries(unittest.TestCase):

    def test_kpi_query_oracle_compatibility(self):
        sql = SQL_GET_KPI_METRICS.upper()
        self.assertIn("COUNT(C.CHECKIN_ID)", sql, "KPI query must aggregate check-ins")
        self.assertIn("COUNT(DISTINCT C.ATTRACTION_ID)", sql, "KPI query must count distinct active sites")
        self.assertIn("NVL(", sql, "Query must use Oracle NVL function for null-safety")
        self.assertIn(":CITY", sql, "Query must support :city parameter")
        self.assertIn(":START_DATE", sql, "Query must support :start_date parameter")

    def test_top_attraction_query(self):
        sql = SQL_GET_TOP_ATTRACTION.upper()
        self.assertIn("GROUP BY", sql)
        self.assertIn("ORDER BY", sql)
        # In Oracle 12c+ FETCH FIRST or ROWNUM
        has_limit = "FETCH FIRST" in sql or "ROWNUM" in sql
        self.assertTrue(has_limit, "Top attraction query must limit to 1 row via Oracle syntax")

    def test_peak_hour_query(self):
        sql = SQL_GET_PEAK_HOUR.upper()
        self.assertTrue("EXTRACT(HOUR FROM" in sql or "TO_CHAR(" in sql, "Peak hour query must extract or format timestamp hour")
        self.assertIn("GROUP BY", sql)

    def test_flow_and_heatmap_queries(self):
        sql_flow = SQL_GET_DAILY_FLOW.upper()
        self.assertIn("TO_CHAR(C.CHECKIN_TIMESTAMP, 'YYYY-MM-DD')", sql_flow)
        
        sql_heat = SQL_GET_HEATMAP_GRID.upper()
        self.assertIn("TO_CHAR(C.CHECKIN_TIMESTAMP, 'D')", sql_heat)
        self.assertIn("PERIOD_NAME", sql_heat)

    def test_popularity_ranking_query(self):
        sql_pop = SQL_GET_POPULARITY_RANKING.upper()
        self.assertIn("A.ATTRACTION_NAME", sql_pop)
        self.assertIn("A.CAPACITY", sql_pop)
        self.assertIn("LEFT JOIN CHECKINS", sql_pop)

    def test_insert_checkin_bind_variables(self):
        sql = SQL_INSERT_CHECKIN.upper()
        expected_params = [
            ":TOURIST_ID",
            ":ATTRACTION_ID",
            ":CITY",
            ":CHECKIN_TIMESTAMP",
            ":LATITUDE",
            ":LONGITUDE",
            ":SOURCE",
            ":VISIT_DURATION",
            ":CROWD_LEVEL"
        ]
        for p in expected_params:
            self.assertIn(p, sql, f"SQL_INSERT_CHECKIN must include parameter {p}")

if __name__ == "__main__":
    unittest.main()
