import os
import threading
import logging
import datetime
from contextlib import contextmanager
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger("tourpulse.oracle")

# Oracle connection parameters
ORACLE_USER = os.getenv("ORACLE_USER", "TOURPULSE")
ORACLE_PASSWORD = os.getenv("ORACLE_PASSWORD", "")
ORACLE_HOST = os.getenv("ORACLE_HOST", "localhost")
ORACLE_PORT = int(os.getenv("ORACLE_PORT", "1521"))
ORACLE_SERVICE_NAME = os.getenv("ORACLE_SERVICE_NAME", "XE")

# Multi-driver support: cx_Oracle and oracledb
oracle_driver = None
driver_name = None
_client_initialized = False

# Auto-detect Oracle Instant Client directory
ORACLE_CLIENT_LIB_DIR = os.getenv("ORACLE_CLIENT_LIB_DIR", r"C:\oracle\instantclient_19_26")

try:
    import cx_Oracle as cx
    oracle_driver = cx
    driver_name = "cx_Oracle"
except ImportError:
    pass

if oracle_driver is None:
    try:
        import oracledb as odb
        oracle_driver = odb
        driver_name = "oracledb"
        
        # Initialize thick mode if instant client is available
        if not _client_initialized:
            client_dir = None
            if os.path.exists(ORACLE_CLIENT_LIB_DIR):
                client_dir = ORACLE_CLIENT_LIB_DIR
            elif os.path.exists(r"C:\oracle\instantclient_21_13"):
                client_dir = r"C:\oracle\instantclient_21_13"
            elif os.path.exists(r"C:\oracle\instantclient_23_4"):
                client_dir = r"C:\oracle\instantclient_23_4"
            
            try:
                if client_dir:
                    odb.init_oracle_client(lib_dir=client_dir)
                    logger.info(f"Oracle Instant Client initialized from: {client_dir}")
                else:
                    odb.init_oracle_client()
                _client_initialized = True
            except Exception as init_err:
                logger.debug(f"Oracle client init notice: {init_err}")
    except ImportError:
        pass

_pool = None
_pool_lock = threading.Lock()

class OracleNotConnectedException(Exception):
    """Raised when an operation is attempted while Oracle Database is unreachable."""
    pass

def _get_dsn():
    return f"{ORACLE_HOST}:{ORACLE_PORT}/{ORACLE_SERVICE_NAME}"

def get_pool():
    """Initializes and returns the thread-safe Oracle connection pool."""
    global _pool
    if _pool is not None:
        return _pool

    with _pool_lock:
        if _pool is not None:
            return _pool

        if not ORACLE_PASSWORD:
            logger.info("Oracle password not provided in environment; skipping pool initialization.")
            return None

        if oracle_driver is None:
            logger.error("Neither cx_Oracle nor oracledb driver is installed.")
            return None

        try:
            dsn = _get_dsn()
            if driver_name == "cx_Oracle":
                _pool = oracle_driver.SessionPool(
                    user=ORACLE_USER,
                    password=ORACLE_PASSWORD,
                    dsn=dsn,
                    min=2,
                    max=10,
                    increment=1,
                    threaded=True
                )
            else:
                _pool = oracle_driver.create_pool(
                    user=ORACLE_USER,
                    password=ORACLE_PASSWORD,
                    dsn=dsn,
                    min=2,
                    max=10,
                    increment=1
                )
            logger.info(f"Oracle connection pool initialized successfully using {driver_name}.")
            return _pool
        except Exception as e:
            logger.warning(f"Could not initialize Oracle connection pool: {e}")
            _pool = None
            return None

def check_oracle_status() -> dict:
    """
    Safely probes Oracle Database connectivity without leaking credentials.
    Returns a structured status dictionary.
    """
    if not ORACLE_PASSWORD:
        return {
            "database": "Oracle Database",
            "status": "Not Connected",
            "connected": False,
            "service": ORACLE_SERVICE_NAME,
            "host": ORACLE_HOST,
            "port": ORACLE_PORT,
            "driver": driver_name or "None",
            "message": "Oracle Database credentials not configured. Please set ORACLE_USER and ORACLE_PASSWORD in .env."
        }

    if oracle_driver is None:
        return {
            "database": "Oracle Database",
            "status": "Not Connected",
            "connected": False,
            "service": ORACLE_SERVICE_NAME,
            "host": ORACLE_HOST,
            "port": ORACLE_PORT,
            "driver": "None",
            "message": "Neither cx_Oracle nor oracledb driver is available."
        }

    pool = get_pool()
    if pool is None:
        # Attempt direct single test connection
        try:
            dsn = _get_dsn()
            conn = oracle_driver.connect(
                user=ORACLE_USER,
                password=ORACLE_PASSWORD,
                dsn=dsn
            )
            with conn.cursor() as cursor:
                cursor.execute("SELECT banner FROM v$version WHERE ROWNUM = 1")
                row = cursor.fetchone()
                db_version = row[0] if row else "Oracle Database"
            conn.close()
            return {
                "database": "Oracle Database",
                "status": "Connected",
                "connected": True,
                "version": db_version,
                "driver": driver_name,
                "service": ORACLE_SERVICE_NAME,
                "host": ORACLE_HOST,
                "port": ORACLE_PORT,
                "message": "Oracle Database is connected and operational."
            }
        except Exception as e:
            err_msg = str(e).split("\n")[0]
            return {
                "database": "Oracle Database",
                "status": "Not Connected",
                "connected": False,
                "service": ORACLE_SERVICE_NAME,
                "host": ORACLE_HOST,
                "port": ORACLE_PORT,
                "driver": driver_name,
                "message": f"Oracle Database connection failed: {err_msg}"
            }

    try:
        conn = pool.acquire()
        with conn.cursor() as cursor:
            cursor.execute("SELECT banner FROM v$version WHERE ROWNUM = 1")
            row = cursor.fetchone()
            db_version = row[0] if row else "Oracle Database"
        pool.release(conn)
        return {
            "database": "Oracle Database",
            "status": "Connected",
            "connected": True,
            "version": db_version,
            "driver": driver_name,
            "service": ORACLE_SERVICE_NAME,
            "host": ORACLE_HOST,
            "port": ORACLE_PORT,
            "message": "Oracle Database connection pool is active."
        }
    except Exception as e:
        err_msg = str(e).split("\n")[0]
        return {
            "database": "Oracle Database",
            "status": "Not Connected",
            "connected": False,
            "service": ORACLE_SERVICE_NAME,
            "host": ORACLE_HOST,
            "port": ORACLE_PORT,
            "driver": driver_name,
            "message": f"Oracle Database query check failed: {err_msg}"
        }

@contextmanager
def get_oracle_connection():
    """
    Context manager yielding an Oracle connection from the pool.
    Handles commit on success and rollback on exception.
    """
    status = check_oracle_status()
    if not status["connected"]:
        raise OracleNotConnectedException(
            f"Oracle Database is not connected ({status['message']}). Please check connection settings in .env."
        )

    pool = get_pool()
    if pool:
        conn = pool.acquire()
        try:
            yield conn
            conn.commit()
        except Exception:
            conn.rollback()
            raise
        finally:
            pool.release(conn)
    else:
        # Fallback to direct single connection
        dsn = _get_dsn()
        conn = oracle_driver.connect(
            user=ORACLE_USER,
            password=ORACLE_PASSWORD,
            dsn=dsn
        )
        try:
            yield conn
            conn.commit()
        except Exception:
            conn.rollback()
            raise
        finally:
            conn.close()

def _clean_val(val):
    """Converts Oracle LOB or specific types into JSON serializable format."""
    if hasattr(val, "read"):
        return val.read()
    if isinstance(val, (datetime.datetime, datetime.date)):
        return val.isoformat()
    return val

def execute_query(sql: str, params: dict = None) -> list:
    """Executes a SELECT query and returns rows as dictionaries."""
    with get_oracle_connection() as conn:
        with conn.cursor() as cursor:
            cursor.execute(sql, params or {})
            if cursor.description is None:
                return []
            cols = [col[0].lower() for col in cursor.description]
            rows = []
            for row in cursor.fetchall():
                rows.append({col: _clean_val(val) for col, val in zip(cols, row)})
            return rows

def execute_dml(sql: str, params: dict = None) -> int:
    """Executes an INSERT, UPDATE, or DELETE query and returns rowcount."""
    with get_oracle_connection() as conn:
        with conn.cursor() as cursor:
            cursor.execute(sql, params or {})
            return cursor.rowcount

def execute_dml_many(sql: str, params_list: list) -> int:
    """Executes an executemany operation."""
    with get_oracle_connection() as conn:
        with conn.cursor() as cursor:
            cursor.executemany(sql, params_list)
            return cursor.rowcount
