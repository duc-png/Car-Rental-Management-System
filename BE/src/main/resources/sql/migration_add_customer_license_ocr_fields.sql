-- Migration: extend customer_licenses with additional OCR fields.
-- Run on MySQL before/alongside deploying the updated backend.

ALTER TABLE customer_licenses
    ADD COLUMN nation VARCHAR(100) NULL,
    ADD COLUMN address VARCHAR(255) NULL,
    ADD COLUMN address_raw VARCHAR(255) NULL,
    ADD COLUMN issue_location VARCHAR(150) NULL,
    ADD COLUMN issue_date VARCHAR(20) NULL,
    ADD COLUMN license_class VARCHAR(30) NULL,
    ADD COLUMN expiry_date VARCHAR(20) NULL;
