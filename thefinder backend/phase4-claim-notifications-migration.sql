-- Run this once if phase4-schema.sql was already applied before claim notifications were added.

ALTER TABLE notifications
    DROP CONSTRAINT IF EXISTS chk_notifications_type;

ALTER TABLE notifications
    ADD CONSTRAINT chk_notifications_type CHECK (type IN (
        'REPORT_SUBMITTED', 'POST_HIDDEN', 'CLAIM_RECEIVED', 'CLAIM_REVIEWING',
        'CLAIM_REJECTED', 'CLAIM_CONFIRMED', 'CLAIM_CANCELLED'
    ));
