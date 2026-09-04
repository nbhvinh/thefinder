-- The Finder - PostgreSQL database initialization
-- Run this file once on a newly created, empty database.

BEGIN;

CREATE TYPE post_type AS ENUM ('LOST', 'FOUND', 'STOLEN');
CREATE TYPE post_status AS ENUM ('OPEN', 'RESOLVED', 'CLOSED');

CREATE TABLE users (
    id            BIGSERIAL PRIMARY KEY,
    email         VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name     VARCHAR(255) NOT NULL,
    phone         VARCHAR(20),
    avatar_url    VARCHAR(500),
    role          VARCHAR(20) NOT NULL DEFAULT 'USER',
    blacklisted   BOOLEAN NOT NULL DEFAULT FALSE,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_users_role CHECK (role IN ('USER', 'ADMIN'))
);

CREATE TABLE categories (
    id   BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE
);

INSERT INTO categories (name) VALUES
    ('Balo/Túi xách'),
    ('Ví/Giấy tờ'),
    ('Điện thoại'),
    ('Laptop/Máy tính'),
    ('Bút/Văn phòng phẩm'),
    ('Trang sức'),
    ('Chìa khóa'),
    ('Thú cưng'),
    ('Khác');

CREATE TABLE posts (
    id           BIGSERIAL PRIMARY KEY,
    user_id      BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id  BIGINT REFERENCES categories(id) ON DELETE SET NULL,
    type         post_type NOT NULL,
    status       post_status NOT NULL DEFAULT 'OPEN',
    title        VARCHAR(255) NOT NULL,
    description  TEXT,
    location     VARCHAR(255),
    hidden       BOOLEAN NOT NULL DEFAULT FALSE,
    event_time   TIMESTAMPTZ,
    contact_info VARCHAR(255),
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_posts_type ON posts(type);
CREATE INDEX idx_posts_status ON posts(status);
CREATE INDEX idx_posts_category ON posts(category_id);
CREATE INDEX idx_posts_user ON posts(user_id);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);

CREATE TABLE post_images (
    id          BIGSERIAL PRIMARY KEY,
    post_id     BIGINT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    url         VARCHAR(255) NOT NULL,
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_post_images_post ON post_images(post_id);

CREATE TABLE claim_reports (
    id            BIGSERIAL PRIMARY KEY,
    post_id       BIGINT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    claimant_id   BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    description   TEXT,
    meet_time     TIMESTAMP,
    meet_location VARCHAR(255),
    status        VARCHAR(255) NOT NULL DEFAULT 'SUBMITTED',
    created_at    TIMESTAMP DEFAULT now(),
    CONSTRAINT chk_claim_reports_status CHECK (status IN (
        'SUBMITTED', 'PENDING', 'REVIEWING', 'CONFIRMED', 'REJECTED'
    ))
);

CREATE INDEX idx_claim_reports_post ON claim_reports(post_id);
CREATE INDEX idx_claim_reports_claimant ON claim_reports(claimant_id);

CREATE TABLE claim_images (
    id              BIGSERIAL PRIMARY KEY,
    claim_report_id BIGINT NOT NULL REFERENCES claim_reports(id) ON DELETE CASCADE,
    image_url       VARCHAR(255) NOT NULL
);

CREATE INDEX idx_claim_images_report ON claim_images(claim_report_id);

CREATE TABLE reports (
    id          BIGSERIAL PRIMARY KEY,
    reporter_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    post_id     BIGINT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    reason      VARCHAR(255) NOT NULL,
    detail      TEXT,
    status      VARCHAR(255) NOT NULL DEFAULT 'PENDING',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uk_reports_reporter_post UNIQUE (reporter_id, post_id),
    CONSTRAINT chk_reports_reason CHECK (reason IN ('SPAM', 'FAKE', 'INAPPROPRIATE', 'OTHER')),
    CONSTRAINT chk_reports_status CHECK (status IN ('PENDING', 'REVIEWED', 'DISMISSED'))
);

CREATE INDEX idx_reports_status_created_at ON reports(status, created_at);
CREATE INDEX idx_reports_post ON reports(post_id);

CREATE TABLE notifications (
    id         BIGSERIAL PRIMARY KEY,
    user_id    BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type       VARCHAR(255) NOT NULL,
    message    TEXT NOT NULL,
    post_id    BIGINT REFERENCES posts(id) ON DELETE SET NULL,
    is_read    BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_notifications_type CHECK (type IN (
        'REPORT_SUBMITTED', 'POST_HIDDEN', 'CLAIM_RECEIVED', 'CLAIM_REVIEWING',
        'CLAIM_REJECTED', 'CLAIM_CONFIRMED', 'CLAIM_CANCELLED'
    ))
);

CREATE INDEX idx_notifications_user_created_at ON notifications(user_id, created_at DESC);
CREATE INDEX idx_notifications_post ON notifications(post_id);

COMMIT;

-- To grant administrator privileges after registering an account:
-- UPDATE users SET role = 'ADMIN' WHERE email = 'admin@example.com';
