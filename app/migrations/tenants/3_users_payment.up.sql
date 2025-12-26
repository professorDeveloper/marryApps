CREATE TABLE IF NOT EXISTS price_for_plans (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    amount INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_payments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    price_for_plan_id uuid NOT NULL,
    is_paid BOOLEAN DEFAULT FALSE,
    click_trans_id INTEGER,
    click_pay_doc_id INTEGER,
    error INTEGER,
    error_note TEXT,
    status TEXT,
    merchant_prepare_id INTEGER,
    payme_id TEXT,
    provider TEXT NOT NULL CHECK (provider IN ('click', 'payme', 'cash')),
    order_number INTEGER NOT NULL,
    paid_at BIGINT,
    time_payme_trans_created BIGINT,
    reason BIGINT,
    amount INTEGER NOT NULL,
    cancel_time BIGINT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_user_payments_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE RESTRICT,
    CONSTRAINT fk_user_payments_plan
        FOREIGN KEY (price_for_plan_id)
        REFERENCES price_for_plans(id)
        ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_user_payments_user_id ON user_payments (user_id);
CREATE INDEX IF NOT EXISTS idx_user_payments_plan_id ON user_payments (price_for_plan_id);