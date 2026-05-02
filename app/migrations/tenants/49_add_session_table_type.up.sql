-- Add table_type column to table_time_sessions
-- This allows the system to distinguish between Simple and Time-Based table sessions
-- for proper billing and business logic handling

ALTER TABLE table_time_sessions
ADD COLUMN IF NOT EXISTS table_type TEXT DEFAULT 'simple'
  CHECK (table_type IN ('simple', 'time_based'));

-- Create index for filtering sessions by table type
CREATE INDEX IF NOT EXISTS idx_table_time_sessions_type
ON table_time_sessions(table_type)
WHERE deleted_at = 0;

-- Backfill existing sessions with 'time_based' since they had segments
-- Sessions created before this migration are assumed to be time-based (they have segments)
UPDATE table_time_sessions
SET table_type = 'time_based'
WHERE table_type = 'simple'
  AND deleted_at = 0
  AND EXISTS (
    SELECT 1
    FROM table_time_session_segments seg
    WHERE seg.session_id = table_time_sessions.id
      AND seg.deleted_at = 0
  );
