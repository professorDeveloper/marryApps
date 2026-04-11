-- name: CreatePrinterSetting :one
INSERT INTO printer_settings (
  ip,
  port,
  type,
  connected_entity_ids
)
VALUES (
  sqlc.arg(ip),
  sqlc.arg(port),
  sqlc.arg(type),
  ARRAY(
    SELECT x::uuid
    FROM unnest(sqlc.arg(connected_entity_ids)::text[]) AS x
  )
)
RETURNING
  id,
  ip,
  port,
  type,
  connected_entity_ids,
  created_at,
  updated_at,
  deleted_at;

-- name: ListPrinterSettings :many
SELECT
  id,
  ip,
  port,
  type,
  connected_entity_ids,
  created_at,
  updated_at,
  deleted_at
FROM printer_settings
WHERE deleted_at = 0
ORDER BY created_at DESC;

-- name: GetPrinterSettingByID :one
SELECT
  id,
  ip,
  port,
  type,
  connected_entity_ids,
  created_at,
  updated_at,
  deleted_at
FROM printer_settings
WHERE id = sqlc.arg(id)
  AND deleted_at = 0
LIMIT 1;

-- name: UpdatePrinterSetting :one
UPDATE printer_settings
SET
  ip = sqlc.arg(ip),
  port = sqlc.arg(port),
  type = sqlc.arg(type),
  connected_entity_ids = ARRAY(
    SELECT x::uuid
    FROM unnest(sqlc.arg(connected_entity_ids)::text[]) AS x
  ),
  updated_at = NOW()
WHERE id = sqlc.arg(id)
  AND deleted_at = 0
RETURNING
  id,
  ip,
  port,
  type,
  connected_entity_ids,
  created_at,
  updated_at,
  deleted_at;