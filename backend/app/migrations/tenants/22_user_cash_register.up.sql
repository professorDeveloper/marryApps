ALTER TABLE users ADD COLUMN IF NOT EXISTS cash_register_id UUID REFERENCES cash_registers(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_users_cash_register ON users(cash_register_id) WHERE deleted_at = 0;
