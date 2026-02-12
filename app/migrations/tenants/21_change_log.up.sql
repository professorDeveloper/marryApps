CREATE TABLE IF NOT EXISTS change_log (
  id BIGSERIAL PRIMARY KEY,
  brand_id TEXT,
  entity TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('create', 'update', 'delete')),
  entity_id TEXT NOT NULL,
  payload JSONB,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_change_log_entity_id ON change_log(entity, entity_id);
CREATE INDEX IF NOT EXISTS idx_change_log_changed_at ON change_log(changed_at);
CREATE INDEX IF NOT EXISTS idx_change_log_brand_id ON change_log(brand_id);

CREATE OR REPLACE FUNCTION log_change() RETURNS TRIGGER AS $$
DECLARE
  v_action TEXT;
  v_entity_id TEXT;
  v_payload JSONB;
  v_brand_id TEXT;
  v_pk_col TEXT;
BEGIN
  v_pk_col := TG_ARGV[0];
  v_brand_id := current_setting('app.brand_id', true);

  IF (TG_OP = 'INSERT') THEN
    v_action := 'create';
    v_payload := to_jsonb(NEW);
    v_entity_id := v_payload ->> v_pk_col;
  ELSIF (TG_OP = 'UPDATE') THEN
    v_action := 'update';
    v_payload := to_jsonb(NEW);
    v_entity_id := v_payload ->> v_pk_col;
  ELSIF (TG_OP = 'DELETE') THEN
    v_action := 'delete';
    v_payload := to_jsonb(OLD);
    v_entity_id := v_payload ->> v_pk_col;
  END IF;

  INSERT INTO change_log(brand_id, entity, action, entity_id, payload)
  VALUES (v_brand_id, TG_TABLE_NAME, v_action, v_entity_id, v_payload);

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_change_log_attendances ON attendances;
CREATE TRIGGER trg_change_log_attendances
AFTER INSERT OR UPDATE OR DELETE ON attendances
FOR EACH ROW EXECUTE FUNCTION log_change('id');

DROP TRIGGER IF EXISTS trg_change_log_bill_daily_counters ON bill_daily_counters;
CREATE TRIGGER trg_change_log_bill_daily_counters
AFTER INSERT OR UPDATE OR DELETE ON bill_daily_counters
FOR EACH ROW EXECUTE FUNCTION log_change('day');

DROP TRIGGER IF EXISTS trg_change_log_branches ON branches;
CREATE TRIGGER trg_change_log_branches
AFTER INSERT OR UPDATE OR DELETE ON branches
FOR EACH ROW EXECUTE FUNCTION log_change('id');

DROP TRIGGER IF EXISTS trg_change_log_cafe_tables ON cafe_tables;
CREATE TRIGGER trg_change_log_cafe_tables
AFTER INSERT OR UPDATE OR DELETE ON cafe_tables
FOR EACH ROW EXECUTE FUNCTION log_change('id');

DROP TRIGGER IF EXISTS trg_change_log_calculation ON calculation;
CREATE TRIGGER trg_change_log_calculation
AFTER INSERT OR UPDATE OR DELETE ON calculation
FOR EACH ROW EXECUTE FUNCTION log_change('id');

DROP TRIGGER IF EXISTS trg_change_log_categories ON categories;
CREATE TRIGGER trg_change_log_categories
AFTER INSERT OR UPDATE OR DELETE ON categories
FOR EACH ROW EXECUTE FUNCTION log_change('id');

DROP TRIGGER IF EXISTS trg_change_log_compounds ON compounds;
CREATE TRIGGER trg_change_log_compounds
AFTER INSERT OR UPDATE OR DELETE ON compounds
FOR EACH ROW EXECUTE FUNCTION log_change('id');

DROP TRIGGER IF EXISTS trg_change_log_compounds_details ON compounds_details;
CREATE TRIGGER trg_change_log_compounds_details
AFTER INSERT OR UPDATE OR DELETE ON compounds_details
FOR EACH ROW EXECUTE FUNCTION log_change('id');

DROP TRIGGER IF EXISTS trg_change_log_compound_stock ON compound_stock;
CREATE TRIGGER trg_change_log_compound_stock
AFTER INSERT OR UPDATE OR DELETE ON compound_stock
FOR EACH ROW EXECUTE FUNCTION log_change('id');

DROP TRIGGER IF EXISTS trg_change_log_deduction_act_groups ON deduction_act_groups;
CREATE TRIGGER trg_change_log_deduction_act_groups
AFTER INSERT OR UPDATE OR DELETE ON deduction_act_groups
FOR EACH ROW EXECUTE FUNCTION log_change('id');

DROP TRIGGER IF EXISTS trg_change_log_deduction_item_ingredients ON deduction_item_ingredients;
CREATE TRIGGER trg_change_log_deduction_item_ingredients
AFTER INSERT OR UPDATE OR DELETE ON deduction_item_ingredients
FOR EACH ROW EXECUTE FUNCTION log_change('id');

DROP TRIGGER IF EXISTS trg_change_log_deduction_items ON deduction_items;
CREATE TRIGGER trg_change_log_deduction_items
AFTER INSERT OR UPDATE OR DELETE ON deduction_items
FOR EACH ROW EXECUTE FUNCTION log_change('id');

DROP TRIGGER IF EXISTS trg_change_log_deductions ON deductions;
CREATE TRIGGER trg_change_log_deductions
AFTER INSERT OR UPDATE OR DELETE ON deductions
FOR EACH ROW EXECUTE FUNCTION log_change('id');

DROP TRIGGER IF EXISTS trg_change_log_departments ON departments;
CREATE TRIGGER trg_change_log_departments
AFTER INSERT OR UPDATE OR DELETE ON departments
FOR EACH ROW EXECUTE FUNCTION log_change('id');

DROP TRIGGER IF EXISTS trg_change_log_goods ON goods;
CREATE TRIGGER trg_change_log_goods
AFTER INSERT OR UPDATE OR DELETE ON goods
FOR EACH ROW EXECUTE FUNCTION log_change('id');

DROP TRIGGER IF EXISTS trg_change_log_goods_details ON goods_details;
CREATE TRIGGER trg_change_log_goods_details
AFTER INSERT OR UPDATE OR DELETE ON goods_details
FOR EACH ROW EXECUTE FUNCTION log_change('id');

DROP TRIGGER IF EXISTS trg_change_log_halls ON halls;
CREATE TRIGGER trg_change_log_halls
AFTER INSERT OR UPDATE OR DELETE ON halls
FOR EACH ROW EXECUTE FUNCTION log_change('id');

DROP TRIGGER IF EXISTS trg_change_log_ingredient_groups ON ingredient_groups;
CREATE TRIGGER trg_change_log_ingredient_groups
AFTER INSERT OR UPDATE OR DELETE ON ingredient_groups
FOR EACH ROW EXECUTE FUNCTION log_change('id');

DROP TRIGGER IF EXISTS trg_change_log_ingredients ON ingredients;
CREATE TRIGGER trg_change_log_ingredients
AFTER INSERT OR UPDATE OR DELETE ON ingredients
FOR EACH ROW EXECUTE FUNCTION log_change('id');

DROP TRIGGER IF EXISTS trg_change_log_ingredient_stock ON ingredient_stock;
CREATE TRIGGER trg_change_log_ingredient_stock
AFTER INSERT OR UPDATE OR DELETE ON ingredient_stock
FOR EACH ROW EXECUTE FUNCTION log_change('id');

DROP TRIGGER IF EXISTS trg_change_log_ingredient_stock_movements ON ingredient_stock_movements;
CREATE TRIGGER trg_change_log_ingredient_stock_movements
AFTER INSERT OR UPDATE OR DELETE ON ingredient_stock_movements
FOR EACH ROW EXECUTE FUNCTION log_change('id');

DROP TRIGGER IF EXISTS trg_change_log_inventories ON inventories;
CREATE TRIGGER trg_change_log_inventories
AFTER INSERT OR UPDATE OR DELETE ON inventories
FOR EACH ROW EXECUTE FUNCTION log_change('id');

DROP TRIGGER IF EXISTS trg_change_log_inventory_items ON inventory_items;
CREATE TRIGGER trg_change_log_inventory_items
AFTER INSERT OR UPDATE OR DELETE ON inventory_items
FOR EACH ROW EXECUTE FUNCTION log_change('id');

DROP TRIGGER IF EXISTS trg_change_log_invoice_detailed ON invoice_detailed;
CREATE TRIGGER trg_change_log_invoice_detailed
AFTER INSERT OR UPDATE OR DELETE ON invoice_detailed
FOR EACH ROW EXECUTE FUNCTION log_change('id');

DROP TRIGGER IF EXISTS trg_change_log_invoices ON invoices;
CREATE TRIGGER trg_change_log_invoices
AFTER INSERT OR UPDATE OR DELETE ON invoices
FOR EACH ROW EXECUTE FUNCTION log_change('id');

DROP TRIGGER IF EXISTS trg_change_log_order_items ON order_items;
CREATE TRIGGER trg_change_log_order_items
AFTER INSERT OR UPDATE OR DELETE ON order_items
FOR EACH ROW EXECUTE FUNCTION log_change('id');

DROP TRIGGER IF EXISTS trg_change_log_orders ON orders;
CREATE TRIGGER trg_change_log_orders
AFTER INSERT OR UPDATE OR DELETE ON orders
FOR EACH ROW EXECUTE FUNCTION log_change('id');

DROP TRIGGER IF EXISTS trg_change_log_shifts ON shifts;
CREATE TRIGGER trg_change_log_shifts
AFTER INSERT OR UPDATE OR DELETE ON shifts
FOR EACH ROW EXECUTE FUNCTION log_change('id');

DROP TRIGGER IF EXISTS trg_change_log_storages ON storages;
CREATE TRIGGER trg_change_log_storages
AFTER INSERT OR UPDATE OR DELETE ON storages
FOR EACH ROW EXECUTE FUNCTION log_change('id');

DROP TRIGGER IF EXISTS trg_change_log_suppliers ON suppliers;
CREATE TRIGGER trg_change_log_suppliers
AFTER INSERT OR UPDATE OR DELETE ON suppliers
FOR EACH ROW EXECUTE FUNCTION log_change('id');

DROP TRIGGER IF EXISTS trg_change_log_translations ON translations;
CREATE TRIGGER trg_change_log_translations
AFTER INSERT OR UPDATE OR DELETE ON translations
FOR EACH ROW EXECUTE FUNCTION log_change('id');

DROP TRIGGER IF EXISTS trg_change_log_user_payments ON user_payments;
CREATE TRIGGER trg_change_log_user_payments
AFTER INSERT OR UPDATE OR DELETE ON user_payments
FOR EACH ROW EXECUTE FUNCTION log_change('id');

DROP TRIGGER IF EXISTS trg_change_log_users ON users;
CREATE TRIGGER trg_change_log_users
AFTER INSERT OR UPDATE OR DELETE ON users
FOR EACH ROW EXECUTE FUNCTION log_change('id');
