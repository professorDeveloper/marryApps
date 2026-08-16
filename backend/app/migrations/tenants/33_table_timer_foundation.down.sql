DROP TABLE IF EXISTS table_time_events;
DROP TABLE IF EXISTS table_time_sessions;

ALTER TABLE cafe_tables
DROP CONSTRAINT IF EXISTS chk_cafe_tables_table_type;

DROP INDEX IF EXISTS idx_cafe_tables_table_type;
ALTER TABLE cafe_tables DROP COLUMN IF EXISTS table_type;