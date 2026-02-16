ALTER TABLE deduction_act_groups DROP CONSTRAINT IF EXISTS fk_deduction_act_groups_branch_id;
ALTER TABLE orders DROP CONSTRAINT IF EXISTS fk_orders_branch_id;
ALTER TABLE invoices DROP CONSTRAINT IF EXISTS fk_invoices_branch_id;
ALTER TABLE suppliers DROP CONSTRAINT IF EXISTS fk_suppliers_branch_id;
ALTER TABLE ingredients DROP CONSTRAINT IF EXISTS fk_ingredients_branch_id;
ALTER TABLE ingredient_groups DROP CONSTRAINT IF EXISTS fk_ingredient_groups_branch_id;
ALTER TABLE user_payments DROP CONSTRAINT IF EXISTS fk_user_payments_branch_id;
ALTER TABLE attendances DROP CONSTRAINT IF EXISTS fk_attendances_branch_id;
ALTER TABLE users DROP CONSTRAINT IF EXISTS fk_users_branch_id;

DROP INDEX IF EXISTS idx_deduction_act_groups_branch_id;
DROP INDEX IF EXISTS idx_orders_branch_id;
DROP INDEX IF EXISTS idx_invoices_branch_id;
DROP INDEX IF EXISTS idx_suppliers_branch_id;
DROP INDEX IF EXISTS idx_ingredients_branch_id;
DROP INDEX IF EXISTS idx_ingredient_groups_branch_id;
DROP INDEX IF EXISTS idx_user_payments_branch_id;
DROP INDEX IF EXISTS idx_attendances_branch_id;
DROP INDEX IF EXISTS idx_users_branch_id;

ALTER TABLE deduction_act_groups DROP COLUMN IF EXISTS branch_id;
ALTER TABLE orders DROP COLUMN IF EXISTS branch_id;
ALTER TABLE invoices DROP COLUMN IF EXISTS branch_id;
ALTER TABLE suppliers DROP COLUMN IF EXISTS branch_id;
ALTER TABLE ingredients DROP COLUMN IF EXISTS branch_id;
ALTER TABLE ingredient_groups DROP COLUMN IF EXISTS branch_id;
ALTER TABLE user_payments DROP COLUMN IF EXISTS branch_id;
ALTER TABLE attendances DROP COLUMN IF EXISTS branch_id;
ALTER TABLE users DROP COLUMN IF EXISTS branch_id;
