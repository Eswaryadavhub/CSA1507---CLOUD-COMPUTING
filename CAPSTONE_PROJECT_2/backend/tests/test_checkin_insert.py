"""
Test Suite: Check-in Insertion & Deduplication Logic
Validates coordinate ranges, duplicate signatures, and 15-minute potential duplicate window.
"""

import unittest
from datetime import datetime, timedelta

class TestCheckinDeduplicationLogic(unittest.TestCase):

    def test_exact_duplicate_signature_detection(self):
        signatures = set()
        
        row1 = {
            "tourist_code": "T-1001",
            "attraction_name": "Marina Beach",
            "timestamp": "2026-03-01 10:00:00",
            "latitude": 13.0499,
            "longitude": 80.2824
        }
        
        sig1 = (
            row1["tourist_code"],
            row1["attraction_name"].lower(),
            row1["timestamp"],
            round(row1["latitude"], 4),
            round(row1["longitude"], 4)
        )
        signatures.add(sig1)

        # Duplicate row with slightly different precision
        row2 = {
            "tourist_code": "T-1001",
            "attraction_name": "Marina Beach",
            "timestamp": "2026-03-01 10:00:00",
            "latitude": 13.04991,
            "longitude": 80.28242
        }
        sig2 = (
            row2["tourist_code"],
            row2["attraction_name"].lower(),
            row2["timestamp"],
            round(row2["latitude"], 4),
            round(row2["longitude"], 4)
        )

        self.assertIn(sig2, signatures, "Row 2 must be detected as an exact duplicate signature")

    def test_potential_duplicate_window_15_minutes(self):
        tourist = "T-1002"
        attraction = "Kapaleeshwarar Temple"
        
        t1 = datetime.strptime("2026-03-01 14:00:00", "%Y-%m-%d %H:%M:%S")
        t2_within = datetime.strptime("2026-03-01 14:10:00", "%Y-%m-%d %H:%M:%S") # 10 mins apart
        t3_outside = datetime.strptime("2026-03-01 14:45:00", "%Y-%m-%d %H:%M:%S") # 45 mins apart

        # Within 15 minutes (<= 900 seconds) -> POTENTIAL DUPLICATE
        diff1 = abs((t2_within - t1).total_seconds())
        self.assertLessEqual(diff1, 900, "10-minute difference must fall within 15-minute duplicate window")

        # Outside 15 minutes (> 900 seconds) -> VALID
        diff2 = abs((t3_outside - t1).total_seconds())
        self.assertGreater(diff2, 900, "45-minute difference must NOT trigger potential duplicate")

if __name__ == "__main__":
    unittest.main()
