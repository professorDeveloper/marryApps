ALTER TABLE invoices
DROP CONSTRAINT IF EXISTS fk_invoices_storage;

ALTER TABLE invoices
DROP COLUMN IF EXISTS storage_id;

DROP INDEX IF EXISTS uq_ingredient_stock_ingredient_storage;
DROP INDEX IF EXISTS idx_ingredient_stock_storage_id;

ALTER TABLE ingredient_stock
DROP CONSTRAINT IF EXISTS fk_ingredient_stock_storage;

ALTER TABLE ingredient_stock
DROP COLUMN IF EXISTS storage_id;

ALTER TABLE ingredient_stock
ALTER COLUMN branch_id SET NOT NULL;

ALTER TABLE ingredients
ADD COLUMN IF NOT EXISTS quantity BIGINT DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_ingredients_quantity ON ingredients(quantity) WHERE deleted_at = 0;
