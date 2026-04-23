-- Add performance indexes for goods table sorting and filtering

-- Index for default sort: ORDER BY created_at DESC
CREATE INDEX IF NOT EXISTS idx_goods_created_at
    ON goods(created_at DESC)
    WHERE deleted_at = 0;

-- Index for price filtering and sorting
CREATE INDEX IF NOT EXISTS idx_goods_price
    ON goods(price)
    WHERE deleted_at = 0;

-- GIN trigram index for text search (ILIKE '%search%')
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS idx_goods_name_trgm
    ON goods USING GIN (name gin_trgm_ops)
    WHERE deleted_at = 0;
