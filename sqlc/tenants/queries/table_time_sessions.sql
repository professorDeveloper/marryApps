-- name: GetTableTimeSessionForOrderExclusive :one
SELECT * FROM table_time_sessions
WHERE order_id = $1 AND deleted_at = 0
FOR UPDATE;

-- name: GetTableTimeSessionByID :one
SELECT * FROM table_time_sessions
WHERE id = $1 AND deleted_at = 0;

-- name: GetSessionsForOrder :many
SELECT * FROM table_time_sessions
WHERE order_id = $1 AND deleted_at = 0
ORDER BY started_at ASC;

-- name: GetOpenSegmentsForSession :many
SELECT * FROM table_time_session_segments
WHERE session_id = $1 AND deleted_at = 0 AND ended_at IS NULL
ORDER BY started_at;

-- name: CreateTableTimeSession :one
INSERT INTO table_time_sessions (
    id, order_id, table_id, table_type, state, started_at, created_at, updated_at
) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
RETURNING *;

-- name: CreateTableTimeSessionSegment :one
INSERT INTO table_time_session_segments (
    id, session_id, order_id, table_id, move_in_reason, started_at, active_seconds, paused_seconds, created_at
) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
RETURNING *;

-- name: UpdateTableTimeSession :one
UPDATE table_time_sessions
SET ended_at = $2, updated_at = NOW()
WHERE id = $1 AND deleted_at = 0
RETURNING *;

-- name: UpdateTableTimeSessionSegment :one
UPDATE table_time_session_segments
SET
    ended_at = $2,
    active_seconds = $3,
    move_out_reason = $4,
    moved_to_table_id = $5
WHERE id = $1 AND deleted_at = 0
RETURNING *;

-- name: GetSegmentsForSession :many
SELECT * FROM table_time_session_segments
WHERE session_id = $1 AND deleted_at = 0
ORDER BY started_at ASC;
