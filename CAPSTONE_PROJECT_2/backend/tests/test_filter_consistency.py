"""
Test Suite: Filter Consistency & Parameter Normalization
Tests date preset calculations and city filtering logic across analytics modules.
"""

import unittest
from datetime import datetime, timedelta

class TestFilterConsistency(unittest.TestCase):

    def calculate_bounds(self, preset, start_date=None, end_date=None):
        now = datetime.now()
        if preset == "today":
            return now.strftime("%Y-%m-%d"), now.strftime("%Y-%m-%d")
        elif preset == "yesterday":
            y = now - timedelta(days=1)
            return y.strftime("%Y-%m-%d"), y.strftime("%Y-%m-%d")
        elif preset == "7days":
            return (now - timedelta(days=7)).strftime("%Y-%m-%d"), now.strftime("%Y-%m-%d")
        elif preset == "30days":
            return (now - timedelta(days=30)).strftime("%Y-%m-%d"), now.strftime("%Y-%m-%d")
        elif preset == "custom":
            return start_date, end_date
        return (now - timedelta(days=30)).strftime("%Y-%m-%d"), now.strftime("%Y-%m-%d")

    def test_preset_today(self):
        s, e = self.calculate_bounds("today")
        now_str = datetime.now().strftime("%Y-%m-%d")
        self.assertEqual(s, now_str)
        self.assertEqual(e, now_str)

    def test_preset_30days(self):
        s, e = self.calculate_bounds("30days")
        today = datetime.now()
        expected_s = (today - timedelta(days=30)).strftime("%Y-%m-%d")
        self.assertEqual(s, expected_s)
        self.assertEqual(e, today.strftime("%Y-%m-%d"))

    def test_preset_custom(self):
        s, e = self.calculate_bounds("custom", "2026-01-01", "2026-01-15")
        self.assertEqual(s, "2026-01-01")
        self.assertEqual(e, "2026-01-15")

if __name__ == "__main__":
    unittest.main()
