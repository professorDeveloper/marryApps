CREATE TABLE IF NOT EXISTS orders (
  id           UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
  table_id     UUID      REFERENCES cafe_tables(id) ON DELETE SET NULL,
  waiter_id    UUID      REFERENCES users(id) ON DELETE SET NULL,
  cashier_id   UUID      REFERENCES users(id) ON DELETE SET NULL,
  status       VARCHAR(20) DEFAULT 'pending',
  guest_count  INTEGER   DEFAULT 1,
  total_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
  comment      TEXT,
  created_at   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  deleted_at   BIGINT    DEFAULT 0
);

CREATE TABLE IF NOT EXISTS order_items (
  id         UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
  good_id    UUID      NOT NULL REFERENCES goods(id) ON DELETE RESTRICT,
  order_id   UUID      NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  quantity   INTEGER   NOT NULL DEFAULT 1,
  price      DECIMAL(15,2) NOT NULL,
  status     VARCHAR(20) DEFAULT 'pending',
  comment    TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  deleted_at BIGINT    DEFAULT 0
);


CREATE INDEX idx_orders_table ON orders(table_id) WHERE deleted_at = 0;
CREATE INDEX idx_orders_waiter ON orders(waiter_id) WHERE deleted_at = 0;
CREATE INDEX idx_orders_cashier ON orders(cashier_id) WHERE deleted_at = 0;
CREATE INDEX idx_orders_status ON orders(status) WHERE deleted_at = 0;
CREATE INDEX idx_orders_created ON orders(created_at) WHERE deleted_at = 0;
CREATE INDEX idx_order_items_order ON order_items(order_id) WHERE deleted_at = 0;
CREATE INDEX idx_order_items_good ON order_items(good_id) WHERE deleted_at = 0;
CREATE INDEX idx_order_items_status ON order_items(status) WHERE deleted_at = 0;

-- Create triggers to automatically update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_order_items_updated_at BEFORE UPDATE ON order_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
