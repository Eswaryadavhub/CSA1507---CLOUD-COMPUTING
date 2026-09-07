"""
Automated unit tests for Module 2 MapReduce cleaning and deduplication pipeline.
"""
import sys
import os

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

from backend.processing.mapreduce_pipeline import MapReducePipeline

def test_mapreduce_pipeline():
    pipeline = MapReducePipeline()

    sample_csv = """tourist_id,city,attraction,visit_date,visit_time,latitude,longitude,visit_duration,source
T-TEST-001,Chennai,Marina Beach,2026-08-12,18:30,13.0475,80.2824,120,GPS
T-TEST-001,Chennai,Marina Beach,2026-08-12,18:30,13.0475,80.2824,120,GPS
T-TEST-002,Chennai,Marina Beach,2026-08-12,18:30,13.0475,80.2824,90,Travel App
T-TEST-003,InvalidCity,InvalidSite,2026-08-12,18:30,999.0,999.0,90,GPS
"""

    result = pipeline.parse_csv_stream(sample_csv)

    assert result["success"] == True
    assert result["total_records"] == 4
    # One is duplicate, one has invalid coords -> 2 valid records
    assert result["valid_records"] == 2
    assert result["duplicates_removed"] == 1
    assert result["invalid_records"] == 1
    assert result["execution_time_ms"] > 0
    print("[PASS] MapReduce Cleaning & Deduplication Test Passed!")

if __name__ == "__main__":
    test_mapreduce_pipeline()
