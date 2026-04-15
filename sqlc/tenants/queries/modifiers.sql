-- name: CreateModifier :one
INSERT INTO modifiers (
    id,
    name,
    name_i18n,
    description,
    code,
    is_active,
    picture_url
)
VALUES (
    $1, $2, $3, $4, $5, $6, $7
)
RETURNING
    id,
    name,
    name_i18n,
    description,
    code,
    is_active,
    picture_url,
    created_at,
    updated_at,
    deleted_at;

-- name: GetModifierByID :one
SELECT
    id,
    name,
    name_i18n,
    description,
    code,
    is_active,
    picture_url,
    created_at,
    updated_at,
    deleted_at
FROM modifiers
WHERE id = $1
  AND deleted_at = 0;

-- name: GetModifiers :many
SELECT
    id,
    name,
    name_i18n,
    description,
    code,
    is_active,
    picture_url,
    created_at,
    updated_at,
    deleted_at
FROM modifiers
WHERE deleted_at = 0
  AND (
      $1::text = ''
      OR name ILIKE '%' || $1 || '%'
      OR COALESCE(description, '') ILIKE '%' || $1 || '%'
      OR COALESCE(code, '') ILIKE '%' || $1 || '%'
  )
ORDER BY created_at DESC
LIMIT $2 OFFSET $3;

-- name: CountModifiersFiltered :one
SELECT COUNT(*)
FROM modifiers
WHERE deleted_at = 0
  AND (
      $1::text = ''
      OR name ILIKE '%' || $1 || '%'
      OR COALESCE(description, '') ILIKE '%' || $1 || '%'
      OR COALESCE(code, '') ILIKE '%' || $1 || '%'
  );

-- name: UpdateModifier :one
UPDATE modifiers
SET
    name = $2,
    name_i18n = $3,
    description = $4,
    code = $5,
    is_active = $6,
    picture_url = $7
WHERE id = $1
  AND deleted_at = 0
RETURNING
    id,
    name,
    name_i18n,
    description,
    code,
    is_active,
    picture_url,
    created_at,
    updated_at,
    deleted_at;

-- name: DeleteModifier :exec
UPDATE modifiers
SET deleted_at = EXTRACT(EPOCH FROM NOW())::BIGINT
WHERE id = $1
  AND deleted_at = 0;

-- name: RestoreModifier :exec
UPDATE modifiers
SET deleted_at = 0
WHERE id = $1
  AND deleted_at <> 0;

-- name: GetModifierByCode :one
SELECT
    id,
    name,
    name_i18n,
    description,
    code,
    is_active,
    picture_url,
    created_at,
    updated_at,
    deleted_at
FROM modifiers
WHERE code = $1
  AND deleted_at = 0;


-- name: CountActiveOrderItemModifiersByModifierID :one
SELECT COUNT(*)
FROM order_item_modifiers oim
JOIN order_items oi ON oi.id = oim.order_item_id
WHERE oim.modifier_id = $1
  AND oim.deleted_at = 0
  AND oi.deleted_at = 0
  AND oi.status IN (
    'pending'::order_items_status,
    'cooking'::order_items_status,
    'ready'::order_items_status
  );