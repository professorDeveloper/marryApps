-- Update to ensure sessions always include table_type in queries
-- This is a documentation migration - actual sqlc code generation is manual
-- The following query patterns must be used when generating sqlc code:

-- Pattern 1: Insert with table_type
-- INSERT INTO table_time_sessions (
--     id, order_id, table_id, state, table_type, started_at, active_started_at,
--     accumulated_active_sec, created_by, updated_by
-- ) VALUES (...)

-- Pattern 2: Select with table_type
-- SELECT id, order_id, table_id, state, table_type, started_at, active_started_at,
--     accumulated_active_sec, ended_at, final_amount, created_by, updated_by,
--     created_at, updated_at
-- FROM table_time_sessions WHERE ...

-- Pattern 3: Update session and maintain table_type
-- UPDATE table_time_sessions
-- SET state = ..., ended_at = ..., final_amount = ...
-- WHERE id = $1
-- RETURNING id, order_id, table_id, state, table_type, started_at, active_started_at, ...

-- Verify table_type column exists and has correct constraint
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'table_time_sessions'
        AND column_name = 'table_type'
    ) THEN
        RAISE EXCEPTION 'table_type column missing from table_time_sessions';
    END IF;
END
$$;

-- Verify backfill of table_type based on segments
UPDATE table_time_sessions ts
SET table_type = 'time_based'
WHERE table_type IS NULL
  AND COALESCE(deleted_at, 0) = 0
  AND EXISTS (
    SELECT 1 FROM table_time_session_segments seg
    WHERE seg.session_id = ts.id AND seg.deleted_at = 0
  );

-- Set remaining sessions to simple (no segments)
UPDATE table_time_sessions
SET table_type = 'simple'
WHERE table_type IS NULL
  AND COALESCE(deleted_at, 0) = 0;

-- Ensure no NULLs remain
ALTER TABLE table_time_sessions
ALTER COLUMN table_type SET NOT NULL;
