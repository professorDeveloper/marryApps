ALTER TABLE orders ADD COLUMN IF NOT EXISTS cash_register_id UUID REFERENCES cash_registers(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_orders_cash_register ON orders(cash_register_id) WHERE deleted_at = 0;
