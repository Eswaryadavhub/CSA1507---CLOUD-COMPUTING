-- ==============================================================================
-- TourPulse: Oracle Database Reset Script
-- Drops all TourPulse tables, sequences, and constraints safely.
-- Idempotent: Does not fail if objects do not exist.
-- ==============================================================================

BEGIN
    FOR t IN (SELECT table_name FROM user_tables WHERE table_name IN (
        'DATASET_UPLOADS', 'REPORTS', 'PREDICTIONS', 'CHECKINS', 'ATTRACTIONS', 'TOURISTS', 'USERS'
    )) LOOP
        EXECUTE IMMEDIATE 'DROP TABLE ' || t.table_name || ' CASCADE CONSTRAINTS';
    END LOOP;
END;
/

BEGIN
    FOR s IN (SELECT sequence_name FROM user_sequences WHERE sequence_name IN (
        'USERS_SEQ', 'TOURISTS_SEQ', 'ATTRACTIONS_SEQ', 'CHECKINS_SEQ', 'PREDICTIONS_SEQ', 'REPORTS_SEQ', 'DATASET_UPLOADS_SEQ'
    )) LOOP
        EXECUTE IMMEDIATE 'DROP SEQUENCE ' || s.sequence_name;
    END LOOP;
END;
/

COMMIT;
