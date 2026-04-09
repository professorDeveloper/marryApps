DROP TRIGGER IF EXISTS update_goods_modifiers_updated_at ON goods_modifiers;

DROP INDEX IF EXISTS idx_goods_modifiers_deleted_at;
DROP INDEX IF EXISTS idx_goods_modifiers_good_sort;
DROP INDEX IF EXISTS idx_goods_modifiers_modifier_id;
DROP INDEX IF EXISTS idx_goods_modifiers_good_id;
DROP INDEX IF EXISTS idx_goods_modifiers_unique_active;

DROP TABLE IF EXISTS goods_modifiers;

DROP TRIGGER IF EXISTS update_modifiers_updated_at ON modifiers;

DROP INDEX IF EXISTS idx_modifiers_deleted_at;
DROP INDEX IF EXISTS idx_modifiers_is_active;
DROP INDEX IF EXISTS idx_modifiers_name;
DROP INDEX IF EXISTS idx_modifiers_code_unique;

DROP TABLE IF EXISTS modifiers;