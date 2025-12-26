DROP TRIGGER IF EXISTS update_qr_sessions_updated_at ON qr_sessions;
DROP TRIGGER IF EXISTS update_cafe_tables_updated_at ON cafe_tables;

DROP TABLE IF EXISTS qr_sessions CASCADE;
DROP TABLE IF EXISTS cafe_tables CASCADE;

DROP INDEX IF EXISTS idx_qr_sessions_active;
DROP INDEX IF EXISTS idx_qr_sessions_table;
DROP INDEX IF EXISTS idx_cafe_tables_status;
DROP INDEX IF EXISTS idx_cafe_tables_hall;