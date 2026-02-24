CREATE TYPE shipment_status AS ENUM ('draft', 'active', 'cancelled');

-- ==================== SHIPMENTS ====================
CREATE TABLE IF NOT EXISTS shipments (
  id           UUID             PRIMARY KEY DEFAULT gen_random_uuid(),
  number       SERIAL           NOT NULL,
  date         TIMESTAMP        NOT NULL DEFAULT NOW(),
  storage_id   UUID             REFERENCES storages(id)  ON DELETE SET NULL,
  supplier_id  UUID             REFERENCES suppliers(id) ON DELETE SET NULL,
  branch_id    UUID             REFERENCES branches(id)  ON DELETE SET NULL,
  description  TEXT,
  status       shipment_status  NOT NULL DEFAULT 'active',
  total_amount DECIMAL(15,2)    NOT NULL DEFAULT 0,
  paid_amount  DECIMAL(15,2)    NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ      DEFAULT NOW(),
  updated_at   TIMESTAMPTZ      DEFAULT NOW(),
  deleted_at   BIGINT           DEFAULT 0
);

CREATE INDEX idx_shipments_branch_id   ON shipments(branch_id)   WHERE deleted_at = 0;
CREATE INDEX idx_shipments_storage_id  ON shipments(storage_id)  WHERE deleted_at = 0;
CREATE INDEX idx_shipments_supplier_id ON shipments(supplier_id) WHERE deleted_at = 0;
CREATE INDEX idx_shipments_date        ON shipments(date)        WHERE deleted_at = 0;
CREATE INDEX idx_shipments_status      ON shipments(status)      WHERE deleted_at = 0;

CREATE TRIGGER update_shipments_updated_at
BEFORE UPDATE ON shipments
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==================== SHIPMENT ITEMS ====================
CREATE TABLE IF NOT EXISTS shipment_items (
  id             UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id    UUID          NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
  ingredient_id  UUID          NOT NULL REFERENCES ingredients(id) ON DELETE RESTRICT,
  quantity       NUMERIC(18,6) NOT NULL,
  price_per_unit DECIMAL(15,2) NOT NULL DEFAULT 0,
  total_amount   DECIMAL(15,2) NOT NULL DEFAULT 0,
  stock_before   NUMERIC(18,6) NOT NULL DEFAULT 0,
  stock_after    NUMERIC(18,6) NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ   DEFAULT NOW(),
  updated_at     TIMESTAMPTZ   DEFAULT NOW(),
  deleted_at     BIGINT        DEFAULT 0
);

CREATE UNIQUE INDEX uq_shipment_items_shipment_ingredient
ON shipment_items(shipment_id, ingredient_id) WHERE deleted_at = 0;

CREATE INDEX idx_shipment_items_shipment_id    ON shipment_items(shipment_id)   WHERE deleted_at = 0;
CREATE INDEX idx_shipment_items_ingredient_id  ON shipment_items(ingredient_id) WHERE deleted_at = 0;

CREATE TRIGGER update_shipment_items_updated_at
BEFORE UPDATE ON shipment_items
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
