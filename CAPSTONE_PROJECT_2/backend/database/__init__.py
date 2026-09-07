"""
TourPulse Oracle Database Package
Manages connection pooling, query catalogs, and data access.
"""
from backend.database.connection import get_oracle_connection, get_pool, check_oracle_status
from backend.database.manager import require_oracle, OracleNotConnectedException
