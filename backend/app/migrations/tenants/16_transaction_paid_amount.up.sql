ALTER TABLE transactions
    ADD COLUMN customer_paid_amount NUMERIC(15,2),
    ADD COLUMN change_amount        NUMERIC(15,2);
