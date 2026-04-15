-- Rollback: Convert TIMESTAMPTZ back to TIMESTAMP
ALTER TABLE invoices ALTER COLUMN date TYPE TIMESTAMP USING date AT TIME ZONE 'UTC';

-- Rollback: Remove effective_at column and associated indexes
DROP INDEX IF EXISTS idx_ingredient_stock_movements_storage_ingredient_effective;
DROP INDEX IF EXISTS idx_ingredient_stock_movements_effective_at;

ALTER TABLE ingredient_stock_movements
DROP COLUMN effective_at;
