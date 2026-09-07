-- ==============================================================================
-- TourPulse: Cloud-Based Tourist Flow and Attraction Analytics
-- ORACLE DATABASE DDL SCHEMA (Compatible with 11g XE, 12c, 18c, 19c, 21c, 23c)
-- Schema Owner: TOURPULSE
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. USERS TABLE & SEQUENCE
-- ------------------------------------------------------------------------------
BEGIN
    EXECUTE IMMEDIATE 'DROP TABLE USERS CASCADE CONSTRAINTS';
EXCEPTION WHEN OTHERS THEN IF SQLCODE != -942 THEN RAISE; END IF;
END;
/
BEGIN
    EXECUTE IMMEDIATE 'DROP SEQUENCE USERS_SEQ';
EXCEPTION WHEN OTHERS THEN IF SQLCODE != -2289 THEN RAISE; END IF;
END;
/

CREATE SEQUENCE USERS_SEQ START WITH 1 INCREMENT BY 1 NOCACHE;

CREATE TABLE USERS (
    user_id          NUMBER PRIMARY KEY,
    full_name        VARCHAR2(100) NOT NULL,
    email            VARCHAR2(150) NOT NULL UNIQUE,
    password_hash    VARCHAR2(255) NOT NULL,
    role             VARCHAR2(20) DEFAULT 'tourist' NOT NULL,
    created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT chk_user_role CHECK (role IN ('admin', 'analyst', 'tourist'))
);

CREATE OR REPLACE TRIGGER users_bir
BEFORE INSERT ON USERS
FOR EACH ROW
WHEN (new.user_id IS NULL)
BEGIN
    SELECT USERS_SEQ.NEXTVAL INTO :new.user_id FROM dual;
END;
/

-- ------------------------------------------------------------------------------
-- 2. TOURISTS TABLE & SEQUENCE
-- ------------------------------------------------------------------------------
BEGIN
    EXECUTE IMMEDIATE 'DROP TABLE TOURISTS CASCADE CONSTRAINTS';
EXCEPTION WHEN OTHERS THEN IF SQLCODE != -942 THEN RAISE; END IF;
END;
/
BEGIN
    EXECUTE IMMEDIATE 'DROP SEQUENCE TOURISTS_SEQ';
EXCEPTION WHEN OTHERS THEN IF SQLCODE != -2289 THEN RAISE; END IF;
END;
/

CREATE SEQUENCE TOURISTS_SEQ START WITH 1 INCREMENT BY 1 NOCACHE;

CREATE TABLE TOURISTS (
    tourist_id       NUMBER PRIMARY KEY,
    tourist_code     VARCHAR2(50) NOT NULL UNIQUE,
    device_type      VARCHAR2(30) DEFAULT 'gps' NOT NULL,
    source           VARCHAR2(50) DEFAULT 'travel_app' NOT NULL,
    created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE OR REPLACE TRIGGER tourists_bir
BEFORE INSERT ON TOURISTS
FOR EACH ROW
WHEN (new.tourist_id IS NULL)
BEGIN
    SELECT TOURISTS_SEQ.NEXTVAL INTO :new.tourist_id FROM dual;
END;
/

-- ------------------------------------------------------------------------------
-- 3. ATTRACTIONS TABLE & SEQUENCE
-- ------------------------------------------------------------------------------
BEGIN
    EXECUTE IMMEDIATE 'DROP TABLE ATTRACTIONS CASCADE CONSTRAINTS';
EXCEPTION WHEN OTHERS THEN IF SQLCODE != -942 THEN RAISE; END IF;
END;
/
BEGIN
    EXECUTE IMMEDIATE 'DROP SEQUENCE ATTRACTIONS_SEQ';
EXCEPTION WHEN OTHERS THEN IF SQLCODE != -2289 THEN RAISE; END IF;
END;
/

CREATE SEQUENCE ATTRACTIONS_SEQ START WITH 1 INCREMENT BY 1 NOCACHE;

CREATE TABLE ATTRACTIONS (
    attraction_id    NUMBER PRIMARY KEY,
    attraction_name  VARCHAR2(150) NOT NULL UNIQUE,
    city             VARCHAR2(60) NOT NULL,
    category         VARCHAR2(50) NOT NULL,
    latitude         NUMBER(9, 6) NOT NULL,
    longitude        NUMBER(9, 6) NOT NULL,
    capacity         NUMBER(8) DEFAULT 1000 NOT NULL,
    description      CLOB,
    created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT chk_attr_lat CHECK (latitude BETWEEN -90.0 AND 90.0),
    CONSTRAINT chk_attr_lng CHECK (longitude BETWEEN -180.0 AND 180.0),
    CONSTRAINT chk_attr_cap CHECK (capacity > 0)
);

CREATE OR REPLACE TRIGGER attractions_bir
BEFORE INSERT ON ATTRACTIONS
FOR EACH ROW
WHEN (new.attraction_id IS NULL)
BEGIN
    SELECT ATTRACTIONS_SEQ.NEXTVAL INTO :new.attraction_id FROM dual;
END;
/

CREATE INDEX idx_attractions_city ON ATTRACTIONS(city);
CREATE INDEX idx_attractions_cat ON ATTRACTIONS(category);

-- ------------------------------------------------------------------------------
-- 4. CHECKINS TABLE & SEQUENCE
-- ------------------------------------------------------------------------------
BEGIN
    EXECUTE IMMEDIATE 'DROP TABLE CHECKINS CASCADE CONSTRAINTS';
EXCEPTION WHEN OTHERS THEN IF SQLCODE != -942 THEN RAISE; END IF;
END;
/
BEGIN
    EXECUTE IMMEDIATE 'DROP SEQUENCE CHECKINS_SEQ';
EXCEPTION WHEN OTHERS THEN IF SQLCODE != -2289 THEN RAISE; END IF;
END;
/

CREATE SEQUENCE CHECKINS_SEQ START WITH 1 INCREMENT BY 1 NOCACHE;

CREATE TABLE CHECKINS (
    checkin_id         NUMBER PRIMARY KEY,
    tourist_id         NUMBER,
    attraction_id      NUMBER NOT NULL,
    city               VARCHAR2(60) NOT NULL,
    checkin_timestamp  TIMESTAMP NOT NULL,
    latitude           NUMBER(9, 6),
    longitude          NUMBER(9, 6),
    source             VARCHAR2(30) DEFAULT 'gps' NOT NULL,
    visit_duration     NUMBER(5) DEFAULT 60 NOT NULL,
    crowd_level        VARCHAR2(20) DEFAULT 'Low' NOT NULL,
    created_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT fk_checkins_tourist FOREIGN KEY (tourist_id) REFERENCES TOURISTS(tourist_id) ON DELETE SET NULL,
    CONSTRAINT fk_checkins_attr FOREIGN KEY (attraction_id) REFERENCES ATTRACTIONS(attraction_id) ON DELETE CASCADE,
    CONSTRAINT chk_checkin_duration CHECK (visit_duration > 0),
    CONSTRAINT chk_checkin_crowd CHECK (crowd_level IN ('Low', 'Moderate', 'High'))
);

CREATE OR REPLACE TRIGGER checkins_bir
BEFORE INSERT ON CHECKINS
FOR EACH ROW
WHEN (new.checkin_id IS NULL)
BEGIN
    SELECT CHECKINS_SEQ.NEXTVAL INTO :new.checkin_id FROM dual;
END;
/

CREATE INDEX idx_checkins_attr_time ON CHECKINS(attraction_id, checkin_timestamp);
CREATE INDEX idx_checkins_city ON CHECKINS(city);
CREATE INDEX idx_checkins_timestamp ON CHECKINS(checkin_timestamp);

-- ------------------------------------------------------------------------------
-- 5. PREDICTIONS TABLE & SEQUENCE
-- ------------------------------------------------------------------------------
BEGIN
    EXECUTE IMMEDIATE 'DROP TABLE PREDICTIONS CASCADE CONSTRAINTS';
EXCEPTION WHEN OTHERS THEN IF SQLCODE != -942 THEN RAISE; END IF;
END;
/
BEGIN
    EXECUTE IMMEDIATE 'DROP SEQUENCE PREDICTIONS_SEQ';
EXCEPTION WHEN OTHERS THEN IF SQLCODE != -2289 THEN RAISE; END IF;
END;
/

CREATE SEQUENCE PREDICTIONS_SEQ START WITH 1 INCREMENT BY 1 NOCACHE;

CREATE TABLE PREDICTIONS (
    prediction_id       NUMBER PRIMARY KEY,
    attraction_id       NUMBER NOT NULL,
    prediction_date     VARCHAR2(10) NOT NULL,
    prediction_hour     VARCHAR2(10) NOT NULL,
    predicted_visitors  NUMBER(8) NOT NULL,
    crowd_level         VARCHAR2(20) NOT NULL,
    confidence_score    NUMBER(5, 2) NOT NULL,
    model_name          VARCHAR2(100) NOT NULL,
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT fk_pred_attr FOREIGN KEY (attraction_id) REFERENCES ATTRACTIONS(attraction_id) ON DELETE CASCADE,
    CONSTRAINT chk_pred_crowd CHECK (crowd_level IN ('Low', 'Moderate', 'High'))
);

CREATE OR REPLACE TRIGGER predictions_bir
BEFORE INSERT ON PREDICTIONS
FOR EACH ROW
WHEN (new.prediction_id IS NULL)
BEGIN
    SELECT PREDICTIONS_SEQ.NEXTVAL INTO :new.prediction_id FROM dual;
END;
/

CREATE INDEX idx_pred_attr_date ON PREDICTIONS(attraction_id, prediction_date);

-- ------------------------------------------------------------------------------
-- 6. REPORTS TABLE & SEQUENCE
-- ------------------------------------------------------------------------------
BEGIN
    EXECUTE IMMEDIATE 'DROP TABLE REPORTS CASCADE CONSTRAINTS';
EXCEPTION WHEN OTHERS THEN IF SQLCODE != -942 THEN RAISE; END IF;
END;
/
BEGIN
    EXECUTE IMMEDIATE 'DROP SEQUENCE REPORTS_SEQ';
EXCEPTION WHEN OTHERS THEN IF SQLCODE != -2289 THEN RAISE; END IF;
END;
/

CREATE SEQUENCE REPORTS_SEQ START WITH 1 INCREMENT BY 1 NOCACHE;

CREATE TABLE REPORTS (
    report_id          NUMBER PRIMARY KEY,
    generated_by       VARCHAR2(100) NOT NULL,
    report_type        VARCHAR2(50) NOT NULL,
    generated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    file_path          VARCHAR2(500),
    report_summary     CLOB
);

CREATE OR REPLACE TRIGGER reports_bir
BEFORE INSERT ON REPORTS
FOR EACH ROW
WHEN (new.report_id IS NULL)
BEGIN
    SELECT REPORTS_SEQ.NEXTVAL INTO :new.report_id FROM dual;
END;
/

-- ------------------------------------------------------------------------------
-- 7. DATASET_UPLOADS TABLE & SEQUENCE
-- ------------------------------------------------------------------------------
BEGIN
    EXECUTE IMMEDIATE 'DROP TABLE DATASET_UPLOADS CASCADE CONSTRAINTS';
EXCEPTION WHEN OTHERS THEN IF SQLCODE != -942 THEN RAISE; END IF;
END;
/
BEGIN
    EXECUTE IMMEDIATE 'DROP SEQUENCE DATASET_UPLOADS_SEQ';
EXCEPTION WHEN OTHERS THEN IF SQLCODE != -2289 THEN RAISE; END IF;
END;
/

CREATE SEQUENCE DATASET_UPLOADS_SEQ START WITH 1 INCREMENT BY 1 NOCACHE;

CREATE TABLE DATASET_UPLOADS (
    upload_id          NUMBER PRIMARY KEY,
    file_name          VARCHAR2(255) NOT NULL,
    total_records      NUMBER(8) NOT NULL,
    valid_records      NUMBER(8) NOT NULL,
    invalid_records    NUMBER(8) NOT NULL,
    duplicate_records  NUMBER(8) NOT NULL,
    inserted_records   NUMBER(8) NOT NULL,
    upload_status      VARCHAR2(30) NOT NULL,
    uploaded_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE OR REPLACE TRIGGER dataset_uploads_bir
BEFORE INSERT ON DATASET_UPLOADS
FOR EACH ROW
WHEN (new.upload_id IS NULL)
BEGIN
    SELECT DATASET_UPLOADS_SEQ.NEXTVAL INTO :new.upload_id FROM dual;
END;
/

COMMIT;
