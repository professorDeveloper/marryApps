-- Add effective_at column to track when an event economically happened
-- separate from created_at (when it was entered into the system)
-- This enables correct time-based inventory reporting
ALTER TABLE ingredient_stock_movements
ADD COLUMN effective_at TIMESTAMPTZ NULL;

-- Create index on effective_at for efficient date-range queries
-- This will be used by reports to filter movements by business date
CREATE INDEX IF NOT EXISTS idx_ingredient_stock_movements_effective_at
ON ingredient_stock_movements(storage_id, COALESCE(effective_at, created_at));

-- Create composite index for the most common query pattern (point-in-time balance)
CREATE INDEX IF NOT EXISTS idx_ingredient_stock_movements_storage_ingredient_effective
ON ingredient_stock_movements(storage_id, ingredient_id, COALESCE(effective_at, created_at));

-- Fix invoices.date column to use TIMESTAMPTZ for proper timezone handling
-- This ensures timezone-aware date filtering across the application
ALTER TABLE invoices ALTER COLUMN date TYPE TIMESTAMPTZ USING date AT TIME ZONE 'UTC';
