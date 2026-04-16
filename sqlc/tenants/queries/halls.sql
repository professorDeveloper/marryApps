-- name: CreateHall :one
INSERT INTO halls (id, branch_id, name, name_i18n, width, height)
VALUES ($1, $2, $3, $4, $5, $6)
RETURNING id, branch_id, name, name_i18n, width, height, created_at, updated_at, deleted_at;

-- name: GetHallByID :one
SELECT id, branch_id, name, name_i18n, width, height, created_at, updated_at, deleted_at
FROM halls
WHERE id = $1 AND deleted_at = 0
  AND branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid;

-- name: GetAllHalls :many
SELECT
    id,
    branch_id,
    name,
    name_i18n,
    width,
    height,
    created_at,
    updated_at,
    deleted_at
FROM halls
WHERE deleted_at = 0
  AND branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
  AND (
        sqlc.arg('search')::text = ''
        OR COALESCE(name, '') ILIKE '%' || sqlc.arg('search')::text || '%'
      )
ORDER BY
    CASE
        WHEN sqlc.arg('sort_by')::text = 'name' AND sqlc.arg('sort_order')::text = 'asc'
        THEN name
    END ASC,
    CASE
        WHEN sqlc.arg('sort_by')::text = 'name' AND sqlc.arg('sort_order')::text = 'desc'
        THEN name
    END DESC,
    CASE
        WHEN sqlc.arg('sort_by')::text = 'created_at' AND sqlc.arg('sort_order')::text = 'asc'
        THEN created_at
    END ASC,
    CASE
        WHEN sqlc.arg('sort_by')::text = 'created_at' AND sqlc.arg('sort_order')::text = 'desc'
        THEN created_at
    END DESC,
    created_at DESC
LIMIT sqlc.arg('limit')::int
OFFSET sqlc.arg('offset')::int;

-- name: GetHallsByBranchID :many
SELECT id, branch_id, name, name_i18n, width, height, created_at, updated_at, deleted_at
FROM halls
WHERE branch_id = $1 AND deleted_at = 0
  AND branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
ORDER BY created_at DESC
LIMIT $2 OFFSET $3;

-- name: UpdateHall :one
UPDATE halls
SET branch_id = COALESCE($2, branch_id),
    name = COALESCE($3, name),
    name_i18n = COALESCE($4, name_i18n),
    width = COALESCE($5, width),
    height = COALESCE($6, height),
    updated_at = NOW()
WHERE id = $1 AND deleted_at = 0
  AND branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
RETURNING id, branch_id, name, name_i18n, width, height, created_at, updated_at, deleted_at;

-- name: DeleteHall :exec
UPDATE halls
SET deleted_at = EXTRACT(EPOCH FROM NOW())::BIGINT
WHERE id = $1 AND deleted_at = 0
  AND branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid;

-- name: RestoreHall :exec
UPDATE halls
SET deleted_at = 0
WHERE id = $1 AND deleted_at != 0
  AND branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid;

-- name: CountHalls :one
SELECT COUNT(*)
FROM halls
WHERE deleted_at = 0
  AND branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
  AND (
        sqlc.arg('search')::text = ''
        OR COALESCE(name, '') ILIKE '%' || sqlc.arg('search')::text || '%'
      );

-- name: CountHallsByBranch :one
SELECT COUNT(*) FROM halls
WHERE branch_id = $1 AND deleted_at = 0
  AND branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid;


-- name: GetHallWithBranch :one
SELECT 
    h.id,
    h.branch_id,
    h.name,
    h.name_i18n,
    h.created_at,
    h.updated_at,
    h.width,
    h.height,
    b.name as branch_name,
    b.address as branch_address
FROM halls h
LEFT JOIN branches b ON h.branch_id = b.id AND b.deleted_at = 0
WHERE h.id = $1 AND h.deleted_at = 0
  AND h.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid;

-- name: GetAllHallsWithLanguage :many
SELECT
    h.id,
    h.branch_id,
    COALESCE(
        CASE
            WHEN sqlc.arg('lang')::text = 'uz' THEN t.uz
            WHEN sqlc.arg('lang')::text = 'ru' THEN t.ru
            WHEN sqlc.arg('lang')::text = 'en' THEN t.en
            ELSE h.name
        END,
        h.name
    ) AS name,
    h.name_i18n,
    h.width,
    h.height,
    h.created_at,
    h.updated_at,
    h.deleted_at
FROM halls h
LEFT JOIN translations t
    ON h.name_i18n = t.id
   AND t.deleted_at = 0
WHERE h.deleted_at = 0
  AND h.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
  AND (
        sqlc.arg('search')::text = ''
        OR COALESCE(h.name, '') ILIKE '%' || sqlc.arg('search')::text || '%'
        OR COALESCE(t.uz, '') ILIKE '%' || sqlc.arg('search')::text || '%'
        OR COALESCE(t.ru, '') ILIKE '%' || sqlc.arg('search')::text || '%'
        OR COALESCE(t.en, '') ILIKE '%' || sqlc.arg('search')::text || '%'
      )
ORDER BY
    CASE
        WHEN sqlc.arg('sort_by')::text = 'name' AND sqlc.arg('sort_order')::text = 'asc'
        THEN COALESCE(
            CASE
                WHEN sqlc.arg('lang')::text = 'uz' THEN t.uz
                WHEN sqlc.arg('lang')::text = 'ru' THEN t.ru
                WHEN sqlc.arg('lang')::text = 'en' THEN t.en
                ELSE h.name
            END,
            h.name
        )
    END ASC,
    CASE
        WHEN sqlc.arg('sort_by')::text = 'name' AND sqlc.arg('sort_order')::text = 'desc'
        THEN COALESCE(
            CASE
                WHEN sqlc.arg('lang')::text = 'uz' THEN t.uz
                WHEN sqlc.arg('lang')::text = 'ru' THEN t.ru
                WHEN sqlc.arg('lang')::text = 'en' THEN t.en
                ELSE h.name
            END,
            h.name
        )
    END DESC,
    CASE
        WHEN sqlc.arg('sort_by')::text = 'created_at' AND sqlc.arg('sort_order')::text = 'asc'
        THEN h.created_at
    END ASC,
    CASE
        WHEN sqlc.arg('sort_by')::text = 'created_at' AND sqlc.arg('sort_order')::text = 'desc'
        THEN h.created_at
    END DESC,
    h.created_at DESC
LIMIT sqlc.arg('limit')::int
OFFSET sqlc.arg('offset')::int;

-- name: GetHallsByBranchIDWithLanguage :many
SELECT
    h.id,
    h.branch_id,
    COALESCE(CASE
        WHEN $2::text = 'uz' THEN t.uz
        WHEN $2::text = 'ru' THEN t.ru
        WHEN $2::text = 'en' THEN t.en
        ELSE h.name
    END, h.name) as name,
    h.name_i18n,
    h.width,
    h.height,
    h.created_at,
    h.updated_at,
    h.deleted_at
FROM halls h
LEFT JOIN translations t ON h.name_i18n = t.id AND t.deleted_at = 0
WHERE h.branch_id = $1 AND h.deleted_at = 0
  AND h.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
ORDER BY h.created_at DESC
LIMIT $3 OFFSET $4;
