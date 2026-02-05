CREATE TABLE IF NOT EXISTS ingredient_stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  storage_id UUID NOT NULL REFERENCES storages(id) ON DELETE RESTRICT,
  ingredient_id UUID NOT NULL REFERENCES ingredients(id) ON DELETE RESTRICT,
  event_type VARCHAR(50) NOT NULL,
  qty_in NUMERIC(18,6) NOT NULL DEFAULT 0,
  qty_out NUMERIC(18,6) NOT NULL DEFAULT 0,
  stock_before NUMERIC(18,6) NOT NULL DEFAULT 0,
  stock_after NUMERIC(18,6) NOT NULL DEFAULT 0,
  price_per_unit NUMERIC(18,2) NOT NULL DEFAULT 0,
  source_type VARCHAR(50),
  source_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_ingredient_stock_movements_qty_nonneg CHECK (qty_in >= 0 AND qty_out >= 0)
);

CREATE INDEX IF NOT EXISTS idx_ingredient_stock_movements_storage_time
ON ingredient_stock_movements(storage_id, created_at);

CREATE INDEX IF NOT EXISTS idx_ingredient_stock_movements_storage_ingredient_time
ON ingredient_stock_movements(storage_id, ingredient_id, created_at);

CREATE INDEX IF NOT EXISTS idx_ingredient_stock_movements_source
ON ingredient_stock_movements(source_type, source_id);

ALTER TABLE inventories
ADD COLUMN IF NOT EXISTS applied_at TIMESTAMP WITH TIME ZONE;

INSERT INTO ingredient_stock_movements (
  id,
  storage_id,
  ingredient_id,
  event_type,
  qty_in,
  qty_out,
  stock_before,
  stock_after,
  price_per_unit,
  source_type,
  source_id,
  created_at
)
SELECT
  gen_random_uuid(),
  st.storage_id,
  st.ingredient_id,
  'opening_balance',
  GREATEST(st.quantity, 0::numeric),
  GREATEST(-st.quantity, 0::numeric),
  0,
  st.quantity,
  COALESCE(ing.price_per_unit, 0),
  'system',
  NULL,
  NOW()
FROM ingredient_stock st
JOIN ingredients ing ON ing.id = st.ingredient_id AND ing.deleted_at = 0
WHERE st.deleted_at = 0
  AND st.storage_id IS NOT NULL
  AND COALESCE(st.quantity, 0) <> 0;
