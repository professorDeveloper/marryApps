DROP INDEX IF EXISTS idx_cafe_tables_shape;

ALTER TABLE cafe_tables
    DROP CONSTRAINT IF EXISTS chk_cafe_tables_shape;

ALTER TABLE cafe_tables
    DROP COLUMN IF EXISTS shape;

ALTER TABLE cafe_tables
    ALTER COLUMN pos_x TYPE INTEGER USING ROUND(pos_x)::INTEGER,
    ALTER COLUMN pos_y TYPE INTEGER USING ROUND(pos_y)::INTEGER;