"""
Test Suite: Data Ingestion & CSV Pre-Commit Validation
Validates sample_checkins.csv structure and preview classification logic.
"""

import os
import csv
import unittest

class TestIngestionCSVStructure(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        cls.csv_path = os.path.join(os.path.dirname(__file__), "..", "..", "data", "sample_checkins.csv")

    def test_sample_csv_exists(self):
        self.assertTrue(os.path.exists(self.csv_path), "data/sample_checkins.csv must exist")

    def test_sample_csv_headers(self):
        with open(self.csv_path, "r", encoding="utf-8") as f:
            reader = csv.reader(f)
            headers = [h.strip().lower() for h in next(reader)]

        expected_headers = [
            "tourist_code",
            "attraction_name",
            "city",
            "timestamp",
            "latitude",
            "longitude",
            "source",
            "visit_duration"
        ]
        for eh in expected_headers:
            self.assertIn(eh, headers, f"Header {eh} must exist in sample_checkins.csv")

    def test_sample_csv_row_classification_cases(self):
        with open(self.csv_path, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            rows = list(reader)

        self.assertGreaterEqual(len(rows), 10, "sample_checkins.csv must have at least 10 rows for testing")
        
        # Check that intentional test cases exist in the sample file
        has_invalid_coord = any(float(r["latitude"]) > 90.0 for r in rows)
        has_unknown_site = any(r["attraction_name"] == "Nonexistent Landmark" for r in rows)
        has_duplicate = False
        seen = set()
        for r in rows:
            sig = (r["tourist_code"], r["attraction_name"], r["timestamp"])
            if sig in seen:
                has_duplicate = True
                break
            seen.add(sig)

        self.assertTrue(has_invalid_coord, "sample_checkins.csv must have intentional out-of-bounds latitude (999.0) for testing")
        self.assertTrue(has_unknown_site, "sample_checkins.csv must have unregistered attraction for testing")
        self.assertTrue(has_duplicate, "sample_checkins.csv must have duplicate row for testing")

if __name__ == "__main__":
    unittest.main()
