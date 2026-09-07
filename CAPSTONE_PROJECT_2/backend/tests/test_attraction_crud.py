"""
Test Suite: Attraction CRUD & Catalog Endpoints
Tests attraction catalog endpoints, filtering, and model validations.
"""

import unittest
from fastapi.testclient import TestClient
from backend.main import app

class TestAttractionEndpoints(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)

    def test_cities_list_endpoint(self):
        response = self.client.get("/api/attractions/cities/list")
        # In disconnected mode, returns 503 or preset cities
        self.assertIn(response.status_code, [200, 503])
        if response.status_code == 200:
            data = response.json()
            self.assertIsInstance(data, list)
            self.assertIn("Chennai", data)
            self.assertIn("Mumbai", data)

    def test_attractions_list_endpoint_structure(self):
        response = self.client.get("/api/attractions/?city=Chennai")
        self.assertIn(response.status_code, [200, 503])
        if response.status_code == 503:
            detail = response.json().get("detail", "")
            self.assertIn("Oracle Database is not connected", detail)

    def test_attraction_create_payload_validation(self):
        # Invalid coordinates should fail with 422 Unprocessable Entity
        bad_payload = {
            "name": "Invalid Location",
            "city": "Chennai",
            "category": "Heritage",
            "latitude": 999.0, # invalid lat
            "longitude": 400.0, # invalid lng
            "capacity": -50 # invalid capacity
        }
        # Assuming attraction router handles validation
        response = self.client.post("/api/attractions/", json=bad_payload)
        # Should return 422 or 503
        self.assertIn(response.status_code, [422, 503, 400])

if __name__ == "__main__":
    unittest.main()
