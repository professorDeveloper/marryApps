ALTER TABLE ingredient_stock
ADD COLUMN IF NOT EXISTS storage_id UUID;

ALTER TABLE ingredient_stock
ALTER COLUMN branch_id DROP NOT NULL;

ALTER TABLE invoices
ADD COLUMN IF NOT EXISTS storage_id UUID;

-- If you have existing ingredient_stock rows per branch, try to map them to a storage of that branch.
-- This picks the earliest-created storage per branch.
UPDATE ingredient_stock s
SET storage_id = (
    SELECT st.id
    FROM storages st
    WHERE st.branch_id = s.branch_id
      AND st.deleted_at = 0
    ORDER BY st.created_at ASC
    LIMIT 1
)
WHERE s.deleted_at = 0
  AND s.storage_id IS NULL;

DO $$
BEGIN
  ALTER TABLE ingredient_stock
  ADD CONSTRAINT fk_ingredient_stock_storage
  FOREIGN KEY (storage_id) REFERENCES storages(id) ON DELETE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE invoices
  ADD CONSTRAINT fk_invoices_storage
  FOREIGN KEY (storage_id) REFERENCES storages(id) ON DELETE SET NULL;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_ingredient_stock_storage_id ON ingredient_stock(storage_id) WHERE deleted_at = 0;
CREATE INDEX IF NOT EXISTS idx_invoices_storage_id ON invoices(storage_id) WHERE deleted_at = 0;

-- Unique per ingredient per storage (for upsert operations)
CREATE UNIQUE INDEX IF NOT EXISTS uq_ingredient_stock_ingredient_storage
ON ingredient_stock(ingredient_id, storage_id);

-- Quantity is now tracked in ingredient_stock only
ALTER TABLE ingredients
DROP COLUMN IF EXISTS quantity;

DROP INDEX IF EXISTS idx_ingredients_quantity;
