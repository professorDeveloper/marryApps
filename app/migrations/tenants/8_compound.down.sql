DROP TABLE IF EXISTS compound_stock CASCADE;
DROP TABLE IF EXISTS compounds_details CASCADE;
DROP TABLE IF EXISTS compounds CASCADE;

DROP INDEX IF EXISTS idx_compound_stock_branch;
DROP INDEX IF EXISTS idx_compound_stock_compound;
DROP INDEX IF EXISTS idx_compounds_details_compound;
DROP INDEX IF EXISTS idx_compounds_department;


-- Remove cost calculation fields from compounds table

DROP COLUMN IF EXISTS cost_price;
DROP COLUMN IF EXISTS profit;
DROP COLUMN IF EXISTS profit_margin;
