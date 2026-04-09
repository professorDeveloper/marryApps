-- name: AttachModifierToGood :one
INSERT INTO goods_modifiers (
    id,
    good_id,
    modifier_id,
    is_required,
    sort_order
)
VALUES (
    $1, $2, $3, $4, $5
)
RETURNING
    id,
    good_id,
    modifier_id,
    is_required,
    sort_order,
    created_at,
    updated_at,
    deleted_at;

-- name: GetGoodModifierByGoodAndModifierID :one
SELECT
    id,
    good_id,
    modifier_id,
    is_required,
    sort_order,
    created_at,
    updated_at,
    deleted_at
FROM goods_modifiers
WHERE good_id = $1
  AND modifier_id = $2
LIMIT 1;

-- name: GetActiveGoodModifierByGoodAndModifierID :one
SELECT
    id,
    good_id,
    modifier_id,
    is_required,
    sort_order,
    created_at,
    updated_at,
    deleted_at
FROM goods_modifiers
WHERE good_id = $1
  AND modifier_id = $2
  AND deleted_at = 0
LIMIT 1;

-- name: RestoreModifierToGood :exec
UPDATE goods_modifiers
SET
    deleted_at = 0,
    is_required = $3,
    sort_order = $4
WHERE good_id = $1
  AND modifier_id = $2
  AND deleted_at <> 0;

-- name: UpdateGoodModifierSettings :one
UPDATE goods_modifiers
SET
    is_required = $3,
    sort_order = $4
WHERE good_id = $1
  AND modifier_id = $2
  AND deleted_at = 0
RETURNING
    id,
    good_id,
    modifier_id,
    is_required,
    sort_order,
    created_at,
    updated_at,
    deleted_at;

-- name: GetModifiersByGoodID :many
SELECT
    gm.id,
    gm.good_id,
    gm.modifier_id,
    gm.is_required,
    gm.sort_order,
    gm.created_at,
    gm.updated_at,
    gm.deleted_at,
    m.name,
    m.name_i18n,
    m.description,
    m.code,
    m.is_active,
    m.picture_url
FROM goods_modifiers gm
JOIN modifiers m ON m.id = gm.modifier_id
WHERE gm.good_id = $1
  AND gm.deleted_at = 0
  AND m.deleted_at = 0
ORDER BY gm.sort_order ASC, gm.created_at ASC;

-- name: GetModifiersByGoodIDPaginated :many
SELECT
    gm.id,
    gm.good_id,
    gm.modifier_id,
    gm.is_required,
    gm.sort_order,
    gm.created_at,
    gm.updated_at,
    gm.deleted_at,
    m.name,
    m.name_i18n,
    m.description,
    m.code,
    m.is_active,
    m.picture_url
FROM goods_modifiers gm
JOIN modifiers m ON m.id = gm.modifier_id
WHERE gm.good_id = $1
  AND gm.deleted_at = 0
  AND m.deleted_at = 0
ORDER BY gm.sort_order ASC, gm.created_at ASC
LIMIT $2 OFFSET $3;

-- name: CountModifiersByGoodID :one
SELECT COUNT(*)
FROM goods_modifiers gm
JOIN modifiers m ON m.id = gm.modifier_id
WHERE gm.good_id = $1
  AND gm.deleted_at = 0
  AND m.deleted_at = 0;

-- name: DetachModifierFromGood :exec
UPDATE goods_modifiers
SET deleted_at = EXTRACT(EPOCH FROM NOW())::BIGINT
WHERE good_id = $1
  AND modifier_id = $2
  AND deleted_at = 0;

-- name: GetGoodsByModifierID :many
SELECT
    gm.id,
    gm.good_id,
    gm.modifier_id,
    gm.is_required,
    gm.sort_order,
    gm.created_at,
    gm.updated_at,
    gm.deleted_at
FROM goods_modifiers gm
WHERE gm.modifier_id = $1
  AND gm.deleted_at = 0
ORDER BY gm.sort_order ASC, gm.created_at ASC;

-- name: DeleteGoodModifierByID :exec
UPDATE goods_modifiers
SET deleted_at = EXTRACT(EPOCH FROM NOW())::BIGINT
WHERE id = $1
  AND deleted_at = 0;