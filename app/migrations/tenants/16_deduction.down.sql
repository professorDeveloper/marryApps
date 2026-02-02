DROP TRIGGER IF EXISTS update_deduction_items_updated_at ON deduction_items;
DROP TRIGGER IF EXISTS update_deductions_updated_at ON deductions;
DROP TRIGGER IF EXISTS update_deduction_act_groups_updated_at ON deduction_act_groups;

DROP INDEX IF EXISTS idx_deduction_items_compound_id;
DROP INDEX IF EXISTS idx_deduction_items_good_id;
DROP INDEX IF EXISTS idx_deduction_items_ingredient_id;
DROP INDEX IF EXISTS idx_deduction_items_deduction_id;

DROP INDEX IF EXISTS idx_deductions_act_group_id;
DROP INDEX IF EXISTS idx_deductions_number;
DROP INDEX IF EXISTS idx_deductions_date;
DROP INDEX IF EXISTS idx_deductions_storage_id;

DROP INDEX IF EXISTS uq_deduction_act_groups_name;

DROP TABLE IF EXISTS deduction_items;
DROP TABLE IF EXISTS deductions;
DROP TABLE IF EXISTS deduction_act_groups;
