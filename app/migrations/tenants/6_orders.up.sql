CREATE TYPE order_status       AS ENUM ('open', 'cooking', 'ready', 'served', 'paid', 'cancelled');
CREATE TYPE order_items_status AS ENUM ('pending', 'cooking', 'ready', 'cancelled');
CREATE TYPE bill_status        AS ENUM ('opened', 'closed', 'paid', 'debt', 'deleted');
CREATE TYPE payment_type       AS ENUM ('cash', 'card');

-- Daily bill number counter
CREATE TABLE IF NOT EXISTS bill_daily_counters (
  day     DATE    PRIMARY KEY,
  last_no INTEGER NOT NULL DEFAULT 0
);

-- ==================== ORDERS ====================
CREATE TABLE IF NOT EXISTS orders (
  id                UUID             PRIMARY KEY DEFAULT gen_random_uuid(),
  table_id          UUID             REFERENCES cafe_tables(id) ON DELETE SET NULL,
  waiter_id         UUID             REFERENCES users(id) ON DELETE SET NULL,
  cashier_id        UUID             REFERENCES users(id) ON DELETE SET NULL,
  branch_id         UUID             REFERENCES branches(id) ON DELETE SET NULL,
  status            order_status     DEFAULT 'open',
  guest_count       INTEGER          DEFAULT 1,
  total_amount      DECIMAL(15,2)    NOT NULL DEFAULT 0,
  comment           TEXT,
  -- Bill fields
  bill_no           INTEGER          NOT NULL DEFAULT 0,
  bill_status       bill_status      NOT NULL DEFAULT 'opened',
  bill_opened_at    TIMESTAMPTZ DEFAULT NOW(),
  bill_closed_at    TIMESTAMPTZ,
  paid_at           TIMESTAMPTZ,
  payment_type      payment_type,
  food_cost         NUMERIC(15,2)    NOT NULL DEFAULT 0,
  food_total        NUMERIC(15,2)    NOT NULL DEFAULT 0,
  service_percent   NUMERIC(6,2)     NOT NULL DEFAULT 0,
  service_amount    NUMERIC(15,2)    NOT NULL DEFAULT 0,
  discount_percent  NUMERIC(6,2),
  discount_amount   NUMERIC(15,2),
  discount_comment  TEXT,
  grand_total       NUMERIC(15,2)    NOT NULL DEFAULT 0,
  stock_consumed_at TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW(),
  deleted_at        BIGINT           DEFAULT 0
);

CREATE INDEX idx_orders_table     ON orders(table_id)  WHERE deleted_at = 0;
CREATE INDEX idx_orders_waiter    ON orders(waiter_id) WHERE deleted_at = 0;
CREATE INDEX idx_orders_cashier   ON orders(cashier_id) WHERE deleted_at = 0;
CREATE INDEX idx_orders_status    ON orders(status)    WHERE deleted_at = 0;
CREATE INDEX idx_orders_created   ON orders(created_at) WHERE deleted_at = 0;
CREATE INDEX idx_orders_branch_id ON orders(branch_id) WHERE deleted_at = 0;

CREATE TRIGGER update_orders_updated_at
BEFORE UPDATE ON orders
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==================== ORDER ITEMS ====================
CREATE TABLE IF NOT EXISTS order_items (
  id         UUID               PRIMARY KEY DEFAULT gen_random_uuid(),
  good_id    UUID               NOT NULL REFERENCES goods(id) ON DELETE RESTRICT,
  order_id   UUID               NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  quantity   INTEGER            NOT NULL DEFAULT 1,
  price      DECIMAL(15,2)      NOT NULL,
  status     order_items_status DEFAULT 'pending',
  comment    TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at BIGINT             DEFAULT 0
);

CREATE INDEX idx_order_items_order  ON order_items(order_id) WHERE deleted_at = 0;
CREATE INDEX idx_order_items_good   ON order_items(good_id)  WHERE deleted_at = 0;
CREATE INDEX idx_order_items_status ON order_items(status)   WHERE deleted_at = 0;

CREATE TRIGGER update_order_items_updated_at
BEFORE UPDATE ON order_items
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
