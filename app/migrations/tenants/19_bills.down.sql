ALTER TABLE orders
    DROP COLUMN IF EXISTS stock_consumed_at,
    DROP COLUMN IF EXISTS grand_total,
    DROP COLUMN IF EXISTS discount_comment,
    DROP COLUMN IF EXISTS discount_amount,
    DROP COLUMN IF EXISTS discount_percent,
    DROP COLUMN IF EXISTS service_amount,
    DROP COLUMN IF EXISTS service_percent,
    DROP COLUMN IF EXISTS food_total,
    DROP COLUMN IF EXISTS food_cost,
    DROP COLUMN IF EXISTS payment_type,
    DROP COLUMN IF EXISTS paid_at,
    DROP COLUMN IF EXISTS bill_closed_at,
    DROP COLUMN IF EXISTS bill_opened_at,
    DROP COLUMN IF EXISTS bill_status,
    DROP COLUMN IF EXISTS bill_no;

DROP TABLE IF EXISTS bill_daily_counters;

DO $$
BEGIN
    DROP TYPE IF EXISTS payment_type;
EXCEPTION
    WHEN dependent_objects_still_exist THEN NULL;
END $$;

DO $$
BEGIN
    DROP TYPE IF EXISTS bill_status;
EXCEPTION
    WHEN dependent_objects_still_exist THEN NULL;
END $$;
