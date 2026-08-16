-- Rollback: Remove table_type column from table_time_sessions

DROP INDEX IF EXISTS idx_table_time_sessions_type;

ALTER TABLE table_time_sessions
DROP COLUMN IF EXISTS table_type;
