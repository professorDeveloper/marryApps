-- Rollback: Remove transfer query indexes

DROP INDEX IF EXISTS idx_table_time_sessions_order_active;
DROP INDEX IF EXISTS idx_table_time_sessions_table_active;
DROP INDEX IF EXISTS idx_table_time_session_segments_active;
DROP INDEX IF EXISTS idx_table_time_session_segments_order_type;
