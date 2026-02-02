ALTER TABLE deduction_items
  ALTER COLUMN quantity TYPE BIGINT USING trunc(quantity)::bigint,
  ALTER COLUMN quantity SET DEFAULT 0;

ALTER TABLE inventory_items
  ALTER COLUMN counted_quantity TYPE BIGINT USING trunc(counted_quantity)::bigint,
  ALTER COLUMN counted_quantity SET DEFAULT 0;

ALTER TABLE invoice_detailed
  ALTER COLUMN quantity TYPE BIGINT USING trunc(quantity)::bigint;

ALTER TABLE ingredient_stock
  ALTER COLUMN quantity TYPE BIGINT USING trunc(quantity)::bigint,
  ALTER COLUMN quantity SET DEFAULT 0;
