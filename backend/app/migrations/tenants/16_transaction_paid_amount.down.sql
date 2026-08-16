ALTER TABLE transactions
    DROP COLUMN IF EXISTS customer_paid_amount,
    DROP COLUMN IF EXISTS change_amount;
