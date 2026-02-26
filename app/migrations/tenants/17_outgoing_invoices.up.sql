CREATE TYPE outgoing_invoice_status AS ENUM ('draft', 'active', 'cancelled');

-- ==================== OUTGOING INVOICES ====================
CREATE TABLE IF NOT EXISTS outgoing_invoices (
  id           UUID                     PRIMARY KEY DEFAULT gen_random_uuid(),
  number       SERIAL                   NOT NULL,
  date         TIMESTAMP                NOT NULL DEFAULT NOW(),
  storage_id   UUID                     REFERENCES storages(id)              ON DELETE SET NULL,
  group_id     UUID                     REFERENCES deduction_act_groups(id)  ON DELETE SET NULL,
  branch_id    UUID                     REFERENCES branches(id)              ON DELETE SET NULL,
  description  TEXT,
  status       outgoing_invoice_status  NOT NULL DEFAULT 'active',
  total_amount DECIMAL(15,2)            NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ              DEFAULT NOW(),
  updated_at   TIMESTAMPTZ              DEFAULT NOW(),
  deleted_at   BIGINT                   DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_outgoing_invoices_branch_id   ON outgoing_invoices(branch_id)   WHERE deleted_at = 0;
CREATE INDEX IF NOT EXISTS idx_outgoing_invoices_storage_id  ON outgoing_invoices(storage_id)  WHERE deleted_at = 0;
CREATE INDEX IF NOT EXISTS idx_outgoing_invoices_group_id    ON outgoing_invoices(group_id)    WHERE deleted_at = 0;
CREATE INDEX IF NOT EXISTS idx_outgoing_invoices_date        ON outgoing_invoices(date)        WHERE deleted_at = 0;
CREATE INDEX IF NOT EXISTS idx_outgoing_invoices_status      ON outgoing_invoices(status)      WHERE deleted_at = 0;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'update_outgoing_invoices_updated_at'
    ) THEN
        CREATE TRIGGER update_outgoing_invoices_updated_at
        BEFORE UPDATE ON outgoing_invoices
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- ==================== OUTGOING INVOICE ITEMS ====================
CREATE TABLE IF NOT EXISTS outgoing_invoice_items (
  id                  UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  outgoing_invoice_id UUID          NOT NULL REFERENCES outgoing_invoices(id) ON DELETE CASCADE,
  ingredient_id       UUID          NOT NULL REFERENCES ingredients(id)       ON DELETE RESTRICT,
  quantity            NUMERIC(18,6) NOT NULL,
  price_per_unit      DECIMAL(15,2) NOT NULL DEFAULT 0,
  total_amount        DECIMAL(15,2) NOT NULL DEFAULT 0,
  stock_before        NUMERIC(18,6) NOT NULL DEFAULT 0,
  stock_after         NUMERIC(18,6) NOT NULL DEFAULT 0,
  created_at          TIMESTAMPTZ   DEFAULT NOW(),
  updated_at          TIMESTAMPTZ   DEFAULT NOW(),
  deleted_at          BIGINT        DEFAULT 0
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_outgoing_invoice_items_invoice_ingredient
ON outgoing_invoice_items(outgoing_invoice_id, ingredient_id) WHERE deleted_at = 0;

CREATE INDEX IF NOT EXISTS idx_outgoing_invoice_items_invoice_id     ON outgoing_invoice_items(outgoing_invoice_id) WHERE deleted_at = 0;
CREATE INDEX IF NOT EXISTS idx_outgoing_invoice_items_ingredient_id  ON outgoing_invoice_items(ingredient_id)       WHERE deleted_at = 0;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'update_outgoing_invoice_items_updated_at'
    ) THEN
        CREATE TRIGGER update_outgoing_invoice_items_updated_at
        BEFORE UPDATE ON outgoing_invoice_items
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;
