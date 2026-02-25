ALTER TABLE orders
    DROP COLUMN IF EXISTS customer_paid_amount,
    DROP COLUMN IF EXISTS change_amount;
