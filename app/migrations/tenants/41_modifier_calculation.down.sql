DROP TRIGGER IF EXISTS trg_change_log_order_item_modifiers ON order_item_modifiers;
DROP TRIGGER IF EXISTS update_order_item_modifiers_updated_at ON order_item_modifiers;

DROP INDEX IF EXISTS idx_order_item_modifiers_deleted_at;
DROP INDEX IF EXISTS idx_order_item_modifiers_modifier_id;
DROP INDEX IF EXISTS idx_order_item_modifiers_order_item_id;
DROP INDEX IF EXISTS idx_order_item_modifiers_unique_active;

DROP TABLE IF EXISTS order_item_modifiers;

DROP TRIGGER IF EXISTS trg_change_log_modifier_calculation ON modifier_calculation;
DROP TRIGGER IF EXISTS update_modifier_calculation_updated_at ON modifier_calculation;

DROP INDEX IF EXISTS idx_modifier_calculation_deleted_at;
DROP INDEX IF EXISTS idx_modifier_calculation_ingredient_id;
DROP INDEX IF EXISTS idx_modifier_calculation_modifier_id;

DROP TABLE IF EXISTS modifier_calculation;
