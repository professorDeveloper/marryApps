CREATE TABLE IF NOT EXISTS table_time_session_segments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    session_id UUID NOT NULL REFERENCES table_time_sessions(id) ON DELETE CASCADE,
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    table_id UUID NOT NULL REFERENCES cafe_tables(id) ON DELETE RESTRICT,

    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ended_at TIMESTAMPTZ,

    active_seconds BIGINT NOT NULL DEFAULT 0 CHECK (active_seconds >= 0),
    paused_seconds BIGINT NOT NULL DEFAULT 0 CHECK (paused_seconds >= 0),

    move_in_reason TEXT NOT NULL DEFAULT 'start'
        CHECK (move_in_reason IN ('start', 'transfer')),

    move_out_reason TEXT
        CHECK (move_out_reason IN ('transfer', 'close')),

    moved_from_table_id UUID REFERENCES cafe_tables(id) ON DELETE SET NULL,
    moved_to_table_id UUID REFERENCES cafe_tables(id) ON DELETE SET NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at BIGINT DEFAULT 0,

    CHECK (ended_at IS NULL OR ended_at >= started_at)
);

CREATE INDEX IF NOT EXISTS idx_table_time_session_segments_session
ON table_time_session_segments(session_id, started_at)
WHERE deleted_at = 0;

CREATE INDEX IF NOT EXISTS idx_table_time_session_segments_table
ON table_time_session_segments(table_id, started_at)
WHERE deleted_at = 0;

CREATE INDEX IF NOT EXISTS idx_table_time_session_segments_order
ON table_time_session_segments(order_id, started_at)
WHERE deleted_at = 0;

CREATE UNIQUE INDEX IF NOT EXISTS uq_table_time_session_segments_active_session
ON table_time_session_segments(session_id)
WHERE deleted_at = 0 AND ended_at IS NULL;

INSERT INTO table_time_session_segments (
    id,
    session_id,
    order_id,
    table_id,
    started_at,
    ended_at,
    active_seconds,
    paused_seconds,
    move_in_reason,
    move_out_reason,
    moved_from_table_id,
    moved_to_table_id,
    created_at,
    deleted_at
)
SELECT
    gen_random_uuid(),
    s.id,
    s.order_id,
    s.table_id,
    s.started_at,
    s.ended_at,
    COALESCE(s.accumulated_active_sec, 0),
    0,
    'start',
    CASE WHEN s.ended_at IS NOT NULL THEN 'close' ELSE NULL END,
    NULL,
    NULL,
    s.started_at,
    0
FROM table_time_sessions s
WHERE COALESCE(s.deleted_at, 0) = 0
  AND s.table_id IS NOT NULL
  AND s.order_id IS NOT NULL
  AND NOT EXISTS (
      SELECT 1
      FROM table_time_session_segments seg
      WHERE seg.session_id = s.id
        AND COALESCE(seg.deleted_at, 0) = 0
  );