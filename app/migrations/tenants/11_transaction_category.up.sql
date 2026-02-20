CREATE TYPE transaction_type AS ENUM ('income', 'expense', 'transfer', 'bill_payment');

CREATE TABLE IF NOT EXISTS transactions (
  id                    UUID             PRIMARY KEY DEFAULT gen_random_uuid(),
  type                  transaction_type NOT NULL,
  -- for income / expense
  cash_register_id      UUID             REFERENCES cash_registers(id) ON DELETE SET NULL,
  -- for transfer only
  from_cash_register_id UUID             REFERENCES cash_registers(id) ON DELETE SET NULL,
  to_cash_register_id   UUID             REFERENCES cash_registers(id) ON DELETE SET NULL,
  -- optional cross-branch transfer support
  from_branch_id        UUID             REFERENCES branches(id) ON DELETE SET NULL,
  to_branch_id          UUID             REFERENCES branches(id) ON DELETE SET NULL,
  group_transaction_id  UUID             REFERENCES group_transactions(id) ON DELETE SET NULL,
  amount                DECIMAL(15,2)    NOT NULL DEFAULT 0,
  description           TEXT,
  pay_type              payment_type,
  date                  TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
  user_id               UUID             REFERENCES users(id) ON DELETE SET NULL,
  branch_id             UUID             REFERENCES branches(id) ON DELETE SET NULL,
  created_at            TIMESTAMPTZ      DEFAULT NOW(),
  updated_at            TIMESTAMPTZ      DEFAULT NOW(),
  deleted_at            BIGINT           DEFAULT 0
);

CREATE INDEX idx_transactions_branch       ON transactions(branch_id)             WHERE deleted_at = 0;
CREATE INDEX idx_transactions_type         ON transactions(type)                   WHERE deleted_at = 0;
CREATE INDEX idx_transactions_cash_reg     ON transactions(cash_register_id)       WHERE deleted_at = 0;
CREATE INDEX idx_transactions_from_cr      ON transactions(from_cash_register_id)  WHERE deleted_at = 0;
CREATE INDEX idx_transactions_to_cr        ON transactions(to_cash_register_id)    WHERE deleted_at = 0;
CREATE INDEX idx_transactions_date         ON transactions(date)                   WHERE deleted_at = 0;
CREATE INDEX idx_transactions_group        ON transactions(group_transaction_id)   WHERE deleted_at = 0;
