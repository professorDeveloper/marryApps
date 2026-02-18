CREATE TABLE IF NOT EXISTS cash_registers (
  id            UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT      NOT NULL,
  branch_id     UUID      NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  created_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  deleted_at    BIGINT    DEFAULT 0
);

CREATE INDEX idx_cash_registers_branch ON cash_registers(branch_id) WHERE deleted_at = 0;
CREATE INDEX idx_cash_registers_deleted ON cash_registers(deleted_at);
