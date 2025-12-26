-- name: CreateQRSession :one
INSERT INTO qr_sessions (id, table_id, device_id, start_time, is_active)
VALUES ($1, $2, $3, $4, $5)
RETURNING id, table_id, device_id, start_time, end_time, is_active, created_at, updated_at, deleted_at;

-- name: GetQRSessionByID :one
SELECT id, table_id, device_id, start_time, end_time, is_active, created_at, updated_at, deleted_at
FROM qr_sessions
WHERE id = $1 AND deleted_at = 0;

-- name: GetActiveQRSessionByTableID :one
SELECT id, table_id, device_id, start_time, end_time, is_active, created_at, updated_at, deleted_at
FROM qr_sessions
WHERE table_id = $1 AND is_active = true AND deleted_at = 0
ORDER BY start_time DESC
LIMIT 1;

-- name: GetQRSessionsByTableID :many
SELECT id, table_id, device_id, start_time, end_time, is_active, created_at, updated_at, deleted_at
FROM qr_sessions
WHERE table_id = $1 AND deleted_at = 0
ORDER BY start_time DESC
LIMIT $2 OFFSET $3;

-- name: GetAllQRSessions :many
SELECT id, table_id, device_id, start_time, end_time, is_active, created_at, updated_at, deleted_at
FROM qr_sessions
WHERE deleted_at = 0
ORDER BY start_time DESC
LIMIT $1 OFFSET $2;

-- name: UpdateQRSession :one
UPDATE qr_sessions
SET device_id = COALESCE($2, device_id),
    start_time = COALESCE($3, start_time),
    end_time = COALESCE($4, end_time),
    is_active = COALESCE($5, is_active),
    updated_at = NOW()
WHERE id = $1 AND deleted_at = 0
RETURNING id, table_id, device_id, start_time, end_time, is_active, created_at, updated_at, deleted_at;

-- name: EndQRSession :one
UPDATE qr_sessions
SET end_time = NOW(),
    is_active = false,
    updated_at = NOW()
WHERE id = $1 AND deleted_at = 0
RETURNING id, table_id, device_id, start_time, end_time, is_active, created_at, updated_at, deleted_at;

-- name: DeleteQRSession :exec
UPDATE qr_sessions
SET deleted_at = EXTRACT(EPOCH FROM NOW())::BIGINT
WHERE id = $1 AND deleted_at = 0;

-- name: RestoreQRSession :exec
UPDATE qr_sessions
SET deleted_at = 0
WHERE id = $1 AND deleted_at != 0;
