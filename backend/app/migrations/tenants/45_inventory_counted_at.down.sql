-- Drop the counted_at index
DROP INDEX IF EXISTS idx_inventories_counted_at;

-- Remove the counted_at column
ALTER TABLE inventories DROP COLUMN IF EXISTS counted_at;
