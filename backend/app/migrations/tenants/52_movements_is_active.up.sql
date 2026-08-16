-- Add is_active column to ingredient_stock_movements to allow marking movements as inactive
-- This enables "deactivating" specific movement logs so they don't appear in reports
ALTER TABLE ingredient_stock_movements
ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE;

-- Create index for efficient filtering of active movements in reports
CREATE INDEX IF NOT EXISTS idx_ingredient_stock_movements_is_active
ON ingredient_stock_movements(is_active);
