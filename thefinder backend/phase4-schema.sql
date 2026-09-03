-- Run this once against the existing PostgreSQL database before starting the updated backend.

ALTER TABLE users
    ADD COLUMN role VARCHAR(20) NOT NULL DEFAULT 'USER',
    ADD COLUMN blacklisted BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE posts
    ADD COLUMN hidden BOOLEAN NOT NULL DEFAULT FALSE;

CREATE TABLE reports (
    id          BIGSERIAL PRIMARY KEY,
    reporter_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    post_id     BIGINT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    reason      VARCHAR(30) NOT NULL,
    detail      TEXT,
    status      VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uk_reports_reporter_post UNIQUE (reporter_id, post_id),
    CONSTRAINT chk_reports_reason CHECK (reason IN ('SPAM', 'FAKE', 'INAPPROPRIATE', 'OTHER')),
    CONSTRAINT chk_reports_status CHECK (status IN ('PENDING', 'REVIEWED', 'DISMISSED'))
);

CREATE INDEX idx_reports_status_created_at ON reports(status, created_at);
CREATE INDEX idx_reports_post ON reports(post_id);

CREATE TABLE notifications (
    id          BIGSERIAL PRIMARY KEY,
    user_id     BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type        VARCHAR(30) NOT NULL,
    message     TEXT NOT NULL,
    post_id     BIGINT REFERENCES posts(id) ON DELETE SET NULL,
    is_read     BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_notifications_type CHECK (type IN (
        'REPORT_SUBMITTED', 'POST_HIDDEN', 'CLAIM_RECEIVED', 'CLAIM_REVIEWING',
        'CLAIM_REJECTED', 'CLAIM_CONFIRMED', 'CLAIM_CANCELLED'
    ))
);

CREATE INDEX idx_notifications_user_created_at ON notifications(user_id, created_at DESC);
CREATE INDEX idx_notifications_post ON notifications(post_id);

-- Promote an existing account manually when needed:
-- UPDATE users SET role = 'ADMIN' WHERE email = 'admin@example.com';
