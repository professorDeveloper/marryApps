ALTER TABLE inventories
DROP COLUMN IF EXISTS applied_at;

DROP TABLE IF EXISTS ingredient_stock_movements;
