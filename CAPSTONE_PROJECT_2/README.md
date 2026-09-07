# TourPulse: Cloud-Based Tourist Flow and Attraction Analytics
## Capstone Project 2 — Oracle Database Academic Production Edition

### 1. Executive Overview
TourPulse is an end-to-end Big Data & Cloud Computing analytics platform demonstrating high-throughput tourist telemetry ingestion, spatial aggregation, ML-driven demand forecasting, and operational persistence using **Oracle Database** as the primary single source of truth.

---

### 2. Architecture & Data Flow
```
[ Tourist Telemetry Sources ]
  - GPS Coordinate Streams (45%)
  - Travel Application APIs (35%)
  - Venue Check-in Logs (20%)
               │
               ▼
[ FastAPI Operational Backend ] (Python 3.10 / oracledb / cx_Oracle)
  - Connection Pool: 2 to 10 connections
  - ACID Transactions: Automatic Commit & Rollback
  - Deduplication: 15-minute sliding window per tourist
               │
               ▼
[ Local Oracle Database XE ] (User: TOURPULSE, Port: 1521)
  - Tables: USERS, TOURISTS, ATTRACTIONS, CHECKINS, PREDICTIONS, REPORTS, DATASET_UPLOADS
  - Integrity: Primary Keys, Foreign Keys, Sequences, BEFORE INSERT Triggers, Unique & Check Constraints
               │
               ▼
[ Interactive Dashboard & Intelligence Reports ]
  - Headline KPIs, Diurnal Heatmaps, Origin-Destination Corridors
  - Deterministic Congestion Diversion Recommendations
  - Executive Binary Reports: PDF (ReportLab), Excel (openpyxl), CSV
```

---

### 3. Oracle Database Schema
All SQL scripts reside in the `database/` folder:
- `database/oracle_schema.sql`: DDL creating sequences, tables, constraints, triggers, and performance indexes.
- `database/oracle_seed.sql`: Deterministic synthetic seed data containing 32 attractions across 6 metropolitan cities (Chennai, Bengaluru, Hyderabad, Mumbai, Delhi, Pune), 150 tourists, 1,235 check-ins, and bcrypt-hashed administrative users.
- `database/oracle_reset.sql`: Idempotent teardown script to safely drop all tables and sequences.

#### Tables Created:
1. `USERS`: System administrators, tourism analysts, and visitors (`password_hash`, `role`).
2. `TOURISTS`: Distinct tourist device telemetry identifiers (`tourist_code`, `device_type`, `source`).
3. `ATTRACTIONS`: Monitored cultural landmarks, beaches, and monuments with geo-coordinates and capacity limits.
4. `CHECKINS`: Time-series telemetry visits with duration and crowd density classifications.
5. `PREDICTIONS`: Forecasted visitor volume, capacity utilization, and risk indicators.
6. `REPORTS`: Metadata and audit trail for generated intelligence documents.
7. `DATASET_UPLOADS`: Audit trail tracking batch telemetry CSV files and deduplication statistics.

---

### 4. Running the Application Locally

#### Prerequisites
- Windows 10/11 with Oracle Database Express Edition (11g XE, 12c, 19c, or 21c).
- Oracle Instant Client (19.26 or 21c/23c) extracted to `C:\oracle\instantclient_19_26` (required for Oracle 11g XE thick mode connectivity with `python-oracledb`).
- Python 3.10+ with `oracledb`, `fastapi`, `uvicorn`, `reportlab`, `openpyxl`, and `matplotlib`.

#### Step 1: Configure Environment Variables
Copy `.env.example` to `.env` (this file is excluded from Git):
```env
ORACLE_USER=TOURPULSE
ORACLE_PASSWORD=tourpulse
ORACLE_HOST=localhost
ORACLE_PORT=1521
ORACLE_SERVICE_NAME=XE
ORACLE_CLIENT_LIB_DIR=C:\oracle\instantclient_19_26
```

#### Step 2: Install Dependencies
```bash
pip install -r requirements.txt
```

#### Step 3: Run Database Scripts (if setting up on a new instance)
```sql
sqlplus TOURPULSE/tourpulse@localhost:1521/XE @database/oracle_schema.sql
sqlplus TOURPULSE/tourpulse@localhost:1521/XE @database/oracle_seed.sql
```

#### Step 4: Launch FastAPI Server
```bash
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000
```
Open your browser at `http://localhost:8000`.

---

### 5. Verified API Endpoints

| Endpoint | Method | Description |
| :--- | :---: | :--- |
| `/api/system/database-status` | `GET` | Live Oracle connection probe, driver inspection, and table counts |
| `/api/system/info` | `GET` | Academic system architecture status and GCP integration state |
| `/api/dashboard` | `GET` | Headline analytics KPIs (total visits, top attraction, peak hour) |
| `/api/attractions` | `GET` | Catalog of 32 monitored metropolitan attractions |
| `/api/attractions` | `POST` | Create a new monitored attraction in Oracle `ATTRACTIONS` |
| `/api/attractions/{id}` | `GET` | Granular hourly breakdown and visitor telemetry |
| `/api/attractions/{id}` | `PUT` | Update attraction metadata and capacity in Oracle |
| `/api/attractions/{id}` | `DELETE` | Cascade-safe deletion of attraction from Oracle |
| `/api/checkins` | `GET` / `POST` | Check-in history query and new check-in with 15-min deduplication |
| `/api/upload/validate-preview` | `POST` | Multi-pass CSV validation and duplicate detection preview |
| `/api/upload/commit` | `POST` | Commit confirmed CSV batch into Oracle `CHECKINS` and `DATASET_UPLOADS` |
| `/api/upload/history` | `GET` | Dataset ingestion audit log retrieved from Oracle |
| `/api/analytics/tourist-flow` | `GET` | Daily and hourly diurnal tourist flow time-series |
| `/api/analytics/crowd` | `GET` | Attraction crowd distribution across calibrated capacity thresholds |
| `/api/analytics/popularity` | `GET` | Monitored attraction rankings by visit volume and utilization |
| `/api/recommendations` | `GET` | Congestion diversion suggestions routing traffic to low-density sites |
| `/api/predictions` | `GET` | ML crowd forecast against physical capacity |
| `/api/reports/pdf` | `GET` | Academic 11-section PDF report with embedded Matplotlib charts |
| `/api/reports/excel` | `GET` | Multi-sheet `.xlsx` intelligence workbook with native OpenPyXL charts |
| `/api/reports/csv` | `GET` | Filtered CSV export of attraction statistics |

---

### 6. Cloud Architecture Parity (GCP + BigQuery + Cloud Dataproc)
The project includes fully deployable Cloud Computing artifacts under `gcp/`:
- `gcp/dataproc/tourist_flow_job.py`: PySpark distributed MapReduce batch job for aggregate flow computations.
- `gcp/bigquery/schema.sql`: Cloud Data Warehouse schemas mirroring Oracle XE operational models.
- `gcp/bigquery/ml_models.sql`: BigQuery ML time-series forecasting model (`ARIMA_PLUS`) for crowd prediction.

---

### 7. Automated Verification Test Suite
Run the 26 automated unit and integration tests:
```bash
python -m unittest discover -s backend/tests -p "test_*.py" -v
```
All 26 tests validate schema definitions, query execution, deduplication logic, filter presets, Attraction CRUD, and binary report generation.

