-- Add performance indexes for goods table sorting and filtering
-- (Migration 46 failed due to CONCURRENTLY in transaction, this is the fixed version)

-- Index for default sort: ORDER BY created_at DESC
CREATE INDEX IF NOT EXISTS idx_goods_created_at
    ON goods(created_at DESC)
    WHERE deleted_at = 0;

-- Index for price filtering and sorting
CREATE INDEX IF NOT EXISTS idx_goods_price
    ON goods(price)
    WHERE deleted_at = 0;

-- GIN trigram index for text search (ILIKE '%search%')
-- Skip trigram index if pg_trgm extension is not available
-- This index requires: CREATE EXTENSION pg_trgm
-- For now, create a simple prefix index on name for faster LIKE searches
CREATE INDEX IF NOT EXISTS idx_goods_name_prefix
    ON goods(name)
    WHERE deleted_at = 0;
