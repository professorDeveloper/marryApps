-- ==================== MODIFIER CALCULATION (tech card for modifiers) ====================
CREATE TABLE IF NOT EXISTS modifier_calculation (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  modifier_id           UUID        NOT NULL REFERENCES modifiers(id) ON DELETE CASCADE,
  ingredient_id         UUID        REFERENCES ingredients(id) ON DELETE RESTRICT,
  component_compound_id UUID        REFERENCES compounds(id) ON DELETE RESTRICT,
  quantity              NUMERIC     NOT NULL,
  measurement_unit      VARCHAR(50) NOT NULL,
  price_per_unit        NUMERIC     NOT NULL,
  total_cost            NUMERIC     NOT NULL,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW(),
  deleted_at            BIGINT      DEFAULT 0,
  CHECK (
    (ingredient_id IS NOT NULL AND component_compound_id IS NULL) OR
    (ingredient_id IS NULL AND component_compound_id IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_modifier_calculation_modifier_id
  ON modifier_calculation(modifier_id)
  WHERE deleted_at = 0;

CREATE INDEX IF NOT EXISTS idx_modifier_calculation_ingredient_id
  ON modifier_calculation(ingredient_id)
  WHERE deleted_at = 0;

CREATE INDEX IF NOT EXISTS idx_modifier_calculation_deleted_at
  ON modifier_calculation(deleted_at);

CREATE TRIGGER update_modifier_calculation_updated_at
  BEFORE UPDATE ON modifier_calculation
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_change_log_modifier_calculation ON modifier_calculation;
CREATE TRIGGER trg_change_log_modifier_calculation
  AFTER INSERT OR UPDATE OR DELETE ON modifier_calculation
  FOR EACH ROW EXECUTE FUNCTION log_change('id');

-- ==================== ORDER ITEM MODIFIERS (selected modifiers per line) ====================
CREATE TABLE IF NOT EXISTS order_item_modifiers (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_item_id  UUID NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
  modifier_id    UUID NOT NULL REFERENCES modifiers(id) ON DELETE RESTRICT,
  units          INTEGER NOT NULL DEFAULT 1 CHECK (units > 0),
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW(),
  deleted_at     BIGINT DEFAULT 0
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_order_item_modifiers_unique_active
  ON order_item_modifiers(order_item_id, modifier_id)
  WHERE deleted_at = 0;

CREATE INDEX IF NOT EXISTS idx_order_item_modifiers_order_item_id
  ON order_item_modifiers(order_item_id)
  WHERE deleted_at = 0;

CREATE INDEX IF NOT EXISTS idx_order_item_modifiers_modifier_id
  ON order_item_modifiers(modifier_id)
  WHERE deleted_at = 0;

CREATE INDEX IF NOT EXISTS idx_order_item_modifiers_deleted_at
  ON order_item_modifiers(deleted_at);

CREATE TRIGGER update_order_item_modifiers_updated_at
  BEFORE UPDATE ON order_item_modifiers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_change_log_order_item_modifiers ON order_item_modifiers;
CREATE TRIGGER trg_change_log_order_item_modifiers
  AFTER INSERT OR UPDATE OR DELETE ON order_item_modifiers
  FOR EACH ROW EXECUTE FUNCTION log_change('id');
