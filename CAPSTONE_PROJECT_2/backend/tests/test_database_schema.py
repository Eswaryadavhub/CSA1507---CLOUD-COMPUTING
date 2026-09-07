"""
Test Suite: Oracle Database Schema DDL & Integrity
Validates table declarations, Oracle data types, constraints, and indexes.
"""

import os
import re
import unittest

class TestDatabaseSchema(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        cls.schema_path = os.path.join(os.path.dirname(__file__), "..", "..", "database", "oracle_schema.sql")
        cls.seed_path = os.path.join(os.path.dirname(__file__), "..", "..", "database", "oracle_seed.sql")
        cls.reset_path = os.path.join(os.path.dirname(__file__), "..", "..", "database", "oracle_reset.sql")

    def test_schema_file_exists(self):
        self.assertTrue(os.path.exists(self.schema_path), "oracle_schema.sql must exist in database/ folder")

    def test_all_seven_tables_declared(self):
        with open(self.schema_path, "r", encoding="utf-8") as f:
            content = f.read().upper()

        required_tables = [
            "USERS",
            "TOURISTS",
            "ATTRACTIONS",
            "CHECKINS",
            "PREDICTIONS",
            "REPORTS",
            "DATASET_UPLOADS"
        ]

        for tbl in required_tables:
            pattern = rf"CREATE\s+TABLE\s+{tbl}"
            self.assertIsNotNone(
                re.search(pattern, content),
                f"Table {tbl} must be defined with CREATE TABLE statement"
            )

    def test_oracle_data_types_used(self):
        with open(self.schema_path, "r", encoding="utf-8") as f:
            content = f.read().upper()

        # Oracle types must be present
        self.assertIn("NUMBER", content, "Schema must use Oracle NUMBER type")
        self.assertIn("VARCHAR2", content, "Schema must use Oracle VARCHAR2 type")
        self.assertIn("TIMESTAMP", content, "Schema must use Oracle TIMESTAMP type")

    def test_primary_and_foreign_keys(self):
        with open(self.schema_path, "r", encoding="utf-8") as f:
            content = f.read().upper()

        self.assertIn("PRIMARY KEY", content, "Primary key constraints must be defined")
        self.assertIn("REFERENCES", content, "Foreign key constraints must be defined")
        self.assertIn("REFERENCES ATTRACTIONS", content, "CHECKINS must reference ATTRACTIONS")
        self.assertIn("REFERENCES TOURISTS", content, "CHECKINS must reference TOURISTS")

    def test_indexes_defined(self):
        with open(self.schema_path, "r", encoding="utf-8") as f:
            content = f.read().upper()

        self.assertIn("CREATE INDEX", content, "Explicit indexes must be defined for query performance")
        self.assertIn("IDX_CHECKINS_ATTR_TIME", content, "Composite index on ATTRACTION_ID, CHECKIN_TIMESTAMP must exist")

    def test_reset_script_exists(self):
        self.assertTrue(os.path.exists(self.reset_path), "oracle_reset.sql must exist")
        with open(self.reset_path, "r", encoding="utf-8") as f:
            content = f.read().upper()
        self.assertIn("DROP TABLE", content, "Reset script must drop tables safely")

    def test_seed_script_has_bcrypt_passwords(self):
        self.assertTrue(os.path.exists(self.seed_path), "oracle_seed.sql must exist")
        with open(self.seed_path, "r", encoding="utf-8") as f:
            content = f.read()

        # Must NOT contain plaintext password markers
        self.assertNotIn("admin123", content, "Seed SQL must never contain plaintext password 'admin123'")
        self.assertNotIn("analyst123", content, "Seed SQL must never contain plaintext password 'analyst123'")
        self.assertNotIn("tourist123", content, "Seed SQL must never contain plaintext password 'tourist123'")

        # Must contain bcrypt hash signatures ($2b$ or $2a$)
        self.assertIn("$2b$12$", content, "Seed SQL must contain bcrypt hashed password signatures ($2b$12$)")

if __name__ == "__main__":
    unittest.main()
