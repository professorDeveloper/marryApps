-- Remove the global UNIQUE constraint on username
ALTER TABLE users DROP CONSTRAINT users_username_key;

-- Create a partial unique index on (brand_id, username) for non-deleted users
-- Username should be unique per BRAND (restaurant), not per branch
CREATE UNIQUE INDEX idx_users_brand_username ON users(brand_id, username) WHERE deleted_at = 0;

-- Also remove the UNIQUE constraint on email and phone_number since they should also be per-brand
ALTER TABLE users DROP CONSTRAINT users_email_key;
ALTER TABLE users DROP CONSTRAINT users_phone_number_key;

-- Add partial unique indexes for email and phone_number per brand
CREATE UNIQUE INDEX idx_users_brand_email ON users(brand_id, email) WHERE deleted_at = 0 AND email IS NOT NULL;
CREATE UNIQUE INDEX idx_users_brand_phone ON users(brand_id, phone_number) WHERE deleted_at = 0 AND phone_number IS NOT NULL;

-- Also make pincode unique per brand
ALTER TABLE users DROP CONSTRAINT users_pincode_key;
CREATE UNIQUE INDEX idx_users_brand_pincode ON users(brand_id, pincode) WHERE deleted_at = 0 AND pincode IS NOT NULL;
