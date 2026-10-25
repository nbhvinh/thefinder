BEGIN;

UPDATE users
SET full_name = LEFT(full_name, 50)
WHERE CHAR_LENGTH(full_name) > 50;

ALTER TABLE users
    ALTER COLUMN full_name TYPE VARCHAR(50);

COMMIT;
