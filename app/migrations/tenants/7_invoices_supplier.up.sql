CREATE TYPE invoice_status AS ENUM ('pending', 'arrived', 'received', 'cancelled');

CREATE TABLE IF NOT EXISTS suppliers (
  id            UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT      NOT NULL,
  phone_number  VARCHAR(100),
  location      TEXT,
  created_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  deleted_at    BIGINT    DEFAULT 0
);

CREATE TABLE IF NOT EXISTS invoices (
  id            UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id   UUID      NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
  total_amount  DECIMAL(15,2) NOT NULL DEFAULT 0,
  status        invoice_status DEFAULT 'pending',
  date          TIMESTAMP NOT NULL,
  created_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  deleted_at    BIGINT    DEFAULT 0
);

CREATE TABLE IF NOT EXISTS invoice_detailed (
  id             UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id     UUID      NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  ingredient_id  UUID      NOT NULL REFERENCES ingredients(id) ON DELETE RESTRICT,
  quantity       BIGINT    NOT NULL,
  price          DECIMAL(15,2) NOT NULL,
  price_per_unit DECIMAL(15,2) NOT NULL,
  created_at     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  deleted_at     BIGINT    DEFAULT 0
);

CREATE INDEX idx_invoices_supplier_id ON invoices(supplier_id) WHERE deleted_at = 0;
CREATE INDEX idx_invoices_date ON invoices(date) WHERE deleted_at = 0;
CREATE INDEX idx_invoice_detailed_invoice ON invoice_detailed(invoice_id) WHERE deleted_at = 0;
CREATE INDEX idx_suppliers_name ON suppliers(name) WHERE deleted_at = 0;
