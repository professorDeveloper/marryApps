DROP INDEX IF EXISTS idx_users_cash_register;
ALTER TABLE users DROP COLUMN IF EXISTS cash_register_id;
