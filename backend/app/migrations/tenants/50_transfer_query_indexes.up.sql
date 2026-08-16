-- Add indexes to optimize transfer operation queries

-- Index for finding active sessions for an order (used in transfer lookup)
CREATE INDEX IF NOT EXISTS idx_table_time_sessions_order_active
ON table_time_sessions(order_id)
WHERE deleted_at = 0 AND ended_at IS NULL;

-- Index for finding sessions by table (used to check table occupancy)
CREATE INDEX IF NOT EXISTS idx_table_time_sessions_table_active
ON table_time_sessions(table_id)
WHERE deleted_at = 0 AND ended_at IS NULL;

-- Index for segment queries during transfer (finding open segments to close)
CREATE INDEX IF NOT EXISTS idx_table_time_session_segments_active
ON table_time_session_segments(session_id, ended_at)
WHERE deleted_at = 0;

-- Index for billing queries (sum segments by order, filter by table type)
CREATE INDEX IF NOT EXISTS idx_table_time_session_segments_order_type
ON table_time_session_segments(order_id)
WHERE deleted_at = 0;
