ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'reserved';
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'rescheduled';

ALTER TABLE orders
    ADD COLUMN IF NOT EXISTS order_type         TEXT NOT NULL DEFAULT 'dine_in'
                                                CHECK (order_type IN ('dine_in', 'takeaway')),
    ADD COLUMN IF NOT EXISTS scheduled_at       TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS reschedule_comment TEXT;

CREATE INDEX IF NOT EXISTS idx_orders_scheduled_at
    ON orders(scheduled_at)
    WHERE deleted_at = 0 AND scheduled_at IS NOT NULL;
