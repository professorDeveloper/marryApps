DROP INDEX IF EXISTS idx_orders_client_created_at;

ALTER TABLE orders
    DROP COLUMN IF EXISTS client_created_at;