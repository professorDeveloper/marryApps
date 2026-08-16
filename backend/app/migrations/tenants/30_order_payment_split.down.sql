ALTER TABLE orders
    DROP COLUMN IF EXISTS table_charge,
    DROP COLUMN IF EXISTS cash_amount,
    DROP COLUMN IF EXISTS card_amount;
