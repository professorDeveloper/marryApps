DROP INDEX IF EXISTS idx_orders_cash_register;
ALTER TABLE orders DROP COLUMN IF EXISTS cash_register_id;
