ALTER TABLE orders
    ADD COLUMN IF NOT EXISTS client_created_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_orders_client_created_at
    ON orders(client_created_at)
    WHERE deleted_at = 0 AND client_created_at IS NOT NULL;