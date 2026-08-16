CREATE TABLE IF NOT EXISTS cash_register_shifts (
  id                UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  cash_register_id  UUID          NOT NULL REFERENCES cash_registers(id) ON DELETE CASCADE,
  cashier_id        UUID          NOT NULL REFERENCES users(id)           ON DELETE SET NULL,
  branch_id         UUID          NOT NULL REFERENCES branches(id)        ON DELETE CASCADE,
  opened_at         TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  closed_at         TIMESTAMPTZ,
  opening_cash      DECIMAL(15,2) NOT NULL DEFAULT 0,
  opening_card      DECIMAL(15,2),
  closing_cash      DECIMAL(15,2),
  closing_card      DECIMAL(15,2),
  notes             TEXT,
  created_at        TIMESTAMPTZ   DEFAULT NOW(),
  updated_at        TIMESTAMPTZ   DEFAULT NOW(),
  deleted_at        BIGINT        DEFAULT 0
);

CREATE UNIQUE INDEX idx_cash_register_shifts_active
  ON cash_register_shifts(cash_register_id)
  WHERE deleted_at = 0 AND closed_at IS NULL;

CREATE INDEX idx_cash_register_shifts_branch ON cash_register_shifts(branch_id) WHERE deleted_at = 0;
