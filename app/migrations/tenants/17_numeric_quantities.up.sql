ALTER TABLE ingredient_stock
  ALTER COLUMN quantity TYPE NUMERIC(18,6) USING quantity::numeric,
  ALTER COLUMN quantity SET DEFAULT 0;

ALTER TABLE invoice_detailed
  ALTER COLUMN quantity TYPE NUMERIC(18,6) USING quantity::numeric;

ALTER TABLE inventory_items
  ALTER COLUMN counted_quantity TYPE NUMERIC(18,6) USING counted_quantity::numeric,
  ALTER COLUMN counted_quantity SET DEFAULT 0;

ALTER TABLE deduction_items
  ALTER COLUMN quantity TYPE NUMERIC(18,6) USING quantity::numeric,
  ALTER COLUMN quantity SET DEFAULT 0;
