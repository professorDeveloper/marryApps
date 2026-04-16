ALTER TABLE cafe_tables
    ALTER COLUMN pos_x TYPE DOUBLE PRECISION USING pos_x::DOUBLE PRECISION,
    ALTER COLUMN pos_y TYPE DOUBLE PRECISION USING pos_y::DOUBLE PRECISION;

ALTER TABLE cafe_tables
    ADD COLUMN IF NOT EXISTS shape TEXT NOT NULL DEFAULT 'square';

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'chk_cafe_tables_shape'
    ) THEN
        ALTER TABLE cafe_tables
        ADD CONSTRAINT chk_cafe_tables_shape
        CHECK (shape IN ('circle', 'square'));
    END IF;
END
$$;

CREATE INDEX IF NOT EXISTS idx_cafe_tables_shape
ON cafe_tables(shape)
WHERE deleted_at = 0;