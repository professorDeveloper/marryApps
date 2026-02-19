CREATE TYPE invoice_status AS ENUM ('pending', 'arrived', 'received', 'cancelled');

-- ==================== SUPPLIERS ====================
CREATE TABLE IF NOT EXISTS suppliers (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT        NOT NULL,
  phone_number VARCHAR(100),
  location     TEXT,
  branch_id    UUID        REFERENCES branches(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW(),
  deleted_at   BIGINT      DEFAULT 0
);

CREATE INDEX idx_suppliers_name      ON suppliers(name)      WHERE deleted_at = 0;
CREATE INDEX idx_suppliers_branch_id ON suppliers(branch_id) WHERE deleted_at = 0;

-- ==================== INVOICES ====================
CREATE TABLE IF NOT EXISTS invoices (
  id           UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id  UUID           NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
  storage_id   UUID           REFERENCES storages(id) ON DELETE SET NULL,
  branch_id    UUID           REFERENCES branches(id) ON DELETE SET NULL,
  total_amount DECIMAL(15,2)  NOT NULL DEFAULT 0,
  status       invoice_status DEFAULT 'pending',
  date         TIMESTAMP      NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW(),
  deleted_at   BIGINT         DEFAULT 0
);

CREATE INDEX idx_invoices_supplier_id ON invoices(supplier_id) WHERE deleted_at = 0;
CREATE INDEX idx_invoices_date        ON invoices(date)        WHERE deleted_at = 0;
CREATE INDEX idx_invoices_branch_id   ON invoices(branch_id)   WHERE deleted_at = 0;

-- ==================== INVOICE DETAILS ====================
CREATE TABLE IF NOT EXISTS invoice_detailed (
  id             UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id     UUID          NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  ingredient_id  UUID          NOT NULL REFERENCES ingredients(id) ON DELETE RESTRICT,
  quantity       NUMERIC(18,6) NOT NULL,
  price          DECIMAL(15,2) NOT NULL,
  price_per_unit DECIMAL(15,2) NOT NULL,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW(),
  deleted_at     BIGINT        DEFAULT 0
);

CREATE INDEX idx_invoice_detailed_invoice ON invoice_detailed(invoice_id) WHERE deleted_at = 0;
