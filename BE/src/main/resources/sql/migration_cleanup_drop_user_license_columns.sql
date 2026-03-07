-- Migration cleanup: remove legacy GPLX columns from users table.
-- Run this script manually on MySQL after confirming application has been deployed
-- with the customer_licenses table refactor.

ALTER TABLE users
    DROP COLUMN license_number,
    DROP COLUMN license_full_name,
    DROP COLUMN license_dob,
    DROP COLUMN license_image_url,
    DROP COLUMN license_verification_status,
    DROP COLUMN license_verification_note,
    DROP COLUMN license_verified_at;
