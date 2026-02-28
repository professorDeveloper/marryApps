DROP INDEX IF EXISTS idx_orders_scheduled_at;

ALTER TABLE orders
    DROP COLUMN IF EXISTS reschedule_comment,
    DROP COLUMN IF EXISTS scheduled_at,
    DROP COLUMN IF EXISTS order_type;

-- Note: PostgreSQL does not support removing enum values.
-- 'reserved' and 'rescheduled' values remain in order_status enum.
