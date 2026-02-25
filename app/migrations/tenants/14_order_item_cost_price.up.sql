ALTER TABLE order_items
    ADD COLUMN cost_price NUMERIC(15,2) NOT NULL DEFAULT 0;

-- Backfill from current goods cost_price (best effort for existing rows)
UPDATE order_items oi
SET cost_price = COALESCE(g.cost_price, 0)
FROM goods g
WHERE g.id = oi.good_id AND g.deleted_at = 0;
