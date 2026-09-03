-- Run once if phase4-schema.sql was already applied before the admin pages were added.

ALTER TABLE reports
    DROP CONSTRAINT IF EXISTS chk_reports_status;

ALTER TABLE reports
    ADD CONSTRAINT chk_reports_status
    CHECK (status IN ('PENDING', 'REVIEWED', 'DISMISSED'));
