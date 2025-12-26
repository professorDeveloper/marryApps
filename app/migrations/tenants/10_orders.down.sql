DROP TRIGGER IF EXISTS update_order_items_updated_at ON order_items;
DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;

DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;

DROP INDEX IF EXISTS idx_order_items_status;
DROP INDEX IF EXISTS idx_order_items_good;
DROP INDEX IF EXISTS idx_order_items_order;
DROP INDEX IF EXISTS idx_orders_created;
DROP INDEX IF EXISTS idx_orders_status;
DROP INDEX IF EXISTS idx_orders_cashier;
DROP INDEX IF EXISTS idx_orders_waiter;
DROP INDEX IF EXISTS idx_orders_table;