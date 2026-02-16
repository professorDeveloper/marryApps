-- Minimal branch_id rollout:
-- Add branch_id only where branch cannot be derived reliably via stable joins.
-- Tables like goods/departments/categories/cafe_tables remain join-based.

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS branch_id UUID;
ALTER TABLE attendances
  ADD COLUMN IF NOT EXISTS branch_id UUID;
ALTER TABLE user_payments
  ADD COLUMN IF NOT EXISTS branch_id UUID;
ALTER TABLE ingredient_groups
  ADD COLUMN IF NOT EXISTS branch_id UUID;
ALTER TABLE ingredients
  ADD COLUMN IF NOT EXISTS branch_id UUID;
ALTER TABLE suppliers
  ADD COLUMN IF NOT EXISTS branch_id UUID;
ALTER TABLE invoices
  ADD COLUMN IF NOT EXISTS branch_id UUID;
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS branch_id UUID;
ALTER TABLE deduction_act_groups
  ADD COLUMN IF NOT EXISTS branch_id UUID;

-- Backfill: users/attendance/payments
UPDATE users u
SET branch_id = s.branch_id
FROM shifts s
WHERE u.shift_id = s.id
  AND u.branch_id IS NULL;

UPDATE attendances a
SET branch_id = u.branch_id
FROM users u
WHERE a.user_id = u.id
  AND a.branch_id IS NULL;

UPDATE user_payments up
SET branch_id = u.branch_id
FROM users u
WHERE up.user_id = u.id
  AND up.branch_id IS NULL;

-- Backfill: invoices and suppliers
UPDATE invoices i
SET branch_id = s.branch_id
FROM storages s
WHERE i.storage_id = s.id
  AND i.branch_id IS NULL;

UPDATE suppliers s
SET branch_id = x.branch_id
FROM (
  SELECT i.supplier_id, MIN(i.branch_id::text)::uuid AS branch_id
  FROM invoices i
  WHERE i.branch_id IS NOT NULL
  GROUP BY i.supplier_id
) x
WHERE s.id = x.supplier_id
  AND s.branch_id IS NULL;

-- Backfill: ingredients and groups
UPDATE ingredients i
SET branch_id = x.branch_id
FROM (
  SELECT st.ingredient_id, MIN(st.branch_id::text)::uuid AS branch_id
  FROM ingredient_stock st
  WHERE st.branch_id IS NOT NULL
  GROUP BY st.ingredient_id
) x
WHERE i.id = x.ingredient_id
  AND i.branch_id IS NULL;

UPDATE ingredient_groups ig
SET branch_id = x.branch_id
FROM (
  SELECT i.group_id, MIN(i.branch_id::text)::uuid AS branch_id
  FROM ingredients i
  WHERE i.group_id IS NOT NULL
    AND i.branch_id IS NOT NULL
  GROUP BY i.group_id
) x
WHERE ig.id = x.group_id
  AND ig.branch_id IS NULL;

-- Backfill: orders from table/hall or waiter/cashier shift
UPDATE orders o
SET branch_id = h.branch_id
FROM cafe_tables ct
JOIN halls h ON h.id = ct.hall_id
WHERE o.table_id = ct.id
  AND o.branch_id IS NULL;

UPDATE orders o
SET branch_id = s.branch_id
FROM users u
JOIN shifts s ON s.id = u.shift_id
WHERE o.waiter_id = u.id
  AND o.branch_id IS NULL;

UPDATE orders o
SET branch_id = s.branch_id
FROM users u
JOIN shifts s ON s.id = u.shift_id
WHERE o.cashier_id = u.id
  AND o.branch_id IS NULL;

-- Backfill: deduction act groups
UPDATE deduction_act_groups dag
SET branch_id = x.branch_id
FROM (
  SELECT d.act_group_id, MIN(s.branch_id::text)::uuid AS branch_id
  FROM deductions d
  JOIN storages s ON s.id = d.storage_id
  WHERE d.act_group_id IS NOT NULL
  GROUP BY d.act_group_id
) x
WHERE dag.id = x.act_group_id
  AND dag.branch_id IS NULL;

-- Foreign keys
DO $$
BEGIN
  ALTER TABLE users
    ADD CONSTRAINT fk_users_branch_id FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE attendances
    ADD CONSTRAINT fk_attendances_branch_id FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE user_payments
    ADD CONSTRAINT fk_user_payments_branch_id FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE ingredient_groups
    ADD CONSTRAINT fk_ingredient_groups_branch_id FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE ingredients
    ADD CONSTRAINT fk_ingredients_branch_id FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE suppliers
    ADD CONSTRAINT fk_suppliers_branch_id FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE invoices
    ADD CONSTRAINT fk_invoices_branch_id FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE orders
    ADD CONSTRAINT fk_orders_branch_id FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE deduction_act_groups
    ADD CONSTRAINT fk_deduction_act_groups_branch_id FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_users_branch_id ON users(branch_id) WHERE deleted_at = 0;
CREATE INDEX IF NOT EXISTS idx_attendances_branch_id ON attendances(branch_id) WHERE deleted_at = 0;
CREATE INDEX IF NOT EXISTS idx_user_payments_branch_id ON user_payments(branch_id);
CREATE INDEX IF NOT EXISTS idx_ingredient_groups_branch_id ON ingredient_groups(branch_id) WHERE deleted_at = 0;
CREATE INDEX IF NOT EXISTS idx_ingredients_branch_id ON ingredients(branch_id) WHERE deleted_at = 0;
CREATE INDEX IF NOT EXISTS idx_suppliers_branch_id ON suppliers(branch_id) WHERE deleted_at = 0;
CREATE INDEX IF NOT EXISTS idx_invoices_branch_id ON invoices(branch_id) WHERE deleted_at = 0;
CREATE INDEX IF NOT EXISTS idx_orders_branch_id ON orders(branch_id) WHERE deleted_at = 0;
CREATE INDEX IF NOT EXISTS idx_deduction_act_groups_branch_id ON deduction_act_groups(branch_id) WHERE deleted_at = 0;
