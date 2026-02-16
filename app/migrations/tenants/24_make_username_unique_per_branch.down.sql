-- Rollback: Restore original constraints
DROP INDEX IF EXISTS idx_users_brand_username;
DROP INDEX IF EXISTS idx_users_brand_email;
DROP INDEX IF EXISTS idx_users_brand_phone;
DROP INDEX IF EXISTS idx_users_brand_pincode;

-- Restore original UNIQUE constraints
ALTER TABLE users ADD CONSTRAINT users_username_key UNIQUE (username);
ALTER TABLE users ADD CONSTRAINT users_email_key UNIQUE (email);
ALTER TABLE users ADD CONSTRAINT users_phone_number_key UNIQUE (phone_number);
ALTER TABLE users ADD CONSTRAINT users_pincode_key UNIQUE (pincode);
