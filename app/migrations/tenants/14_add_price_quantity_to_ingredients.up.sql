-- Add price_per_unit and quantity columns to ingredients table
ALTER TABLE ingredients
ADD COLUMN price_per_unit DECIMAL(15, 2) DEFAULT 0,
ADD COLUMN quantity BIGINT DEFAULT 0;

-- Create index for price_per_unit for query performance
CREATE INDEX idx_ingredients_price_per_unit ON ingredients(price_per_unit) WHERE deleted_at = 0;
CREATE INDEX idx_ingredients_quantity ON ingredients(quantity) WHERE deleted_at = 0;
