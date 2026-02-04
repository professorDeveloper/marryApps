DO $$
BEGIN
    CREATE TYPE bill_status AS ENUM ('opened', 'closed', 'paid', 'debt', 'deleted');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    CREATE TYPE payment_type AS ENUM ('cash', 'card');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS bill_daily_counters (
    day DATE PRIMARY KEY,
    last_no INTEGER NOT NULL DEFAULT 0
);

ALTER TABLE branches
    ADD COLUMN IF NOT EXISTS default_service_percent NUMERIC(6,2) NOT NULL DEFAULT 20;

ALTER TABLE orders
    ADD COLUMN IF NOT EXISTS bill_no INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS bill_status bill_status NOT NULL DEFAULT 'opened',
    ADD COLUMN IF NOT EXISTS bill_opened_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS bill_closed_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS payment_type payment_type,
    ADD COLUMN IF NOT EXISTS food_cost NUMERIC(15,2) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS food_total NUMERIC(15,2) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS service_percent NUMERIC(6,2) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS service_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS discount_percent NUMERIC(6,2),
    ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(15,2),
    ADD COLUMN IF NOT EXISTS discount_comment TEXT,
    ADD COLUMN IF NOT EXISTS grand_total NUMERIC(15,2) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS stock_consumed_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_orders_bill_opened_at ON orders(bill_opened_at);
CREATE INDEX IF NOT EXISTS idx_orders_bill_status ON orders(bill_status) WHERE deleted_at = 0;
CREATE INDEX IF NOT EXISTS idx_orders_bill_no ON orders(bill_no) WHERE deleted_at = 0;
