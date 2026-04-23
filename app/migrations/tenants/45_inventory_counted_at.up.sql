-- Add counted_at column to inventories table for precise inventory timestamp
-- Step 1: Add column as nullable
ALTER TABLE inventories ADD COLUMN counted_at TIMESTAMPTZ;

-- Step 2: Backfill existing data: use applied_at if available, otherwise use date at midnight UTC
UPDATE inventories 
SET counted_at = COALESCE(applied_at, date::timestamptz)
WHERE counted_at IS NULL;

-- Step 3: Set column to NOT NULL
ALTER TABLE inventories ALTER COLUMN counted_at SET NOT NULL;

-- Step 4: Add index on counted_at for performance
CREATE INDEX idx_inventories_counted_at ON inventories(counted_at) WHERE deleted_at = 0;
