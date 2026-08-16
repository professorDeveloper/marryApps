-- name: CreateStorage :one
INSERT INTO storages (id, name, branch_id, name_i18n, picture_url, color_code)
VALUES ($1, $2, $3, $4, $5, $6)
RETURNING id, name, branch_id, name_i18n, picture_url, color_code, created_at, updated_at, deleted_at;

-- name: GetStorageByID :one
SELECT id, name, branch_id, name_i18n, picture_url, color_code, created_at, updated_at, deleted_at
FROM storages
WHERE id = $1 AND deleted_at = 0
  AND branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid;

-- name: GetAllStorages :many
SELECT
    s.id,
    s.name,
    s.branch_id,
    s.name_i18n,
    s.picture_url,
    s.color_code,
    s.created_at,
    s.updated_at,
    s.deleted_at
FROM storages s
LEFT JOIN translations t
    ON s.name_i18n = t.id
   AND t.deleted_at = 0
WHERE s.deleted_at = 0
  AND s.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
  AND (
        sqlc.arg('search')::text = ''
        OR COALESCE(s.name, '') ILIKE '%' || sqlc.arg('search')::text || '%'
        OR COALESCE(t.uz, '') ILIKE '%' || sqlc.arg('search')::text || '%'
        OR COALESCE(t.ru, '') ILIKE '%' || sqlc.arg('search')::text || '%'
        OR COALESCE(t.en, '') ILIKE '%' || sqlc.arg('search')::text || '%'
      )
ORDER BY
    CASE
        WHEN sqlc.arg('sort_by')::text = 'name' AND sqlc.arg('sort_order')::text = 'asc'
        THEN s.name
    END ASC,
    CASE
        WHEN sqlc.arg('sort_by')::text = 'name' AND sqlc.arg('sort_order')::text = 'desc'
        THEN s.name
    END DESC,
    CASE
        WHEN sqlc.arg('sort_by')::text = 'created_at' AND sqlc.arg('sort_order')::text = 'asc'
        THEN s.created_at
    END ASC,
    CASE
        WHEN sqlc.arg('sort_by')::text = 'created_at' AND sqlc.arg('sort_order')::text = 'desc'
        THEN s.created_at
    END DESC,
    s.created_at DESC
LIMIT sqlc.arg('limit')::int
OFFSET sqlc.arg('offset')::int;

-- name: GetStoragesByBranchID :many
SELECT id, name, branch_id, name_i18n, picture_url, color_code, created_at, updated_at, deleted_at
FROM storages
WHERE branch_id = $1 AND deleted_at = 0
ORDER BY created_at DESC
LIMIT $2 OFFSET $3;

-- name: UpdateStorage :one
UPDATE storages
SET name = COALESCE($2, name),
    branch_id = COALESCE($3, branch_id),
    name_i18n = COALESCE($4, name_i18n),
    picture_url = COALESCE($5, picture_url),
    color_code = COALESCE($6, color_code),
    updated_at = NOW()
WHERE id = $1 AND deleted_at = 0
  AND branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
RETURNING id, name, branch_id, name_i18n, picture_url, color_code, created_at, updated_at, deleted_at;

-- name: DeleteStorage :exec
UPDATE storages
SET deleted_at = EXTRACT(EPOCH FROM NOW())::BIGINT
WHERE id = $1 AND deleted_at = 0
  AND branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid;

-- name: RestoreStorage :exec
UPDATE storages
SET deleted_at = 0
WHERE id = $1 AND deleted_at != 0
  AND branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid;


-- name: CountStorages :one
SELECT COUNT(*)
FROM storages s
LEFT JOIN translations t
    ON s.name_i18n = t.id
   AND t.deleted_at = 0
WHERE s.deleted_at = 0
  AND s.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
  AND (
        sqlc.arg('search')::text = ''
        OR COALESCE(s.name, '') ILIKE '%' || sqlc.arg('search')::text || '%'
        OR COALESCE(t.uz, '') ILIKE '%' || sqlc.arg('search')::text || '%'
        OR COALESCE(t.ru, '') ILIKE '%' || sqlc.arg('search')::text || '%'
        OR COALESCE(t.en, '') ILIKE '%' || sqlc.arg('search')::text || '%'
      );

-- name: CountStoragesByBranch :one
SELECT COUNT(*) FROM storages
WHERE branch_id = $1 AND deleted_at = 0
  AND branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid;


-- name: GetStorageWithBranch :one
SELECT 
    s.id,
    s.name,
    s.branch_id,
    s.name_i18n,
    s.picture_url,
    s.created_at,
    s.updated_at,
    b.name as branch_name,
    b.address as branch_address
FROM storages s
LEFT JOIN branches b ON s.branch_id = b.id AND b.deleted_at = 0
WHERE s.id = $1 AND s.deleted_at = 0
  AND s.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid;

-- name: GetStorageStats :one
SELECT 
    s.id,
    s.name,
    s.picture_url,
    COUNT(DISTINCT d.id) as department_count,
    COUNT(DISTINCT c.id) as category_count
FROM storages s
LEFT JOIN departments d ON s.id = d.storage_id AND d.deleted_at = 0
LEFT JOIN categories c ON s.id = c.storage_id AND c.deleted_at = 0
WHERE s.id = $1 AND s.deleted_at = 0
  AND s.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
GROUP BY s.id, s.name, s.picture_url;

-- name: GetStorageByIDWithLanguage :one
SELECT 
    s.id,
    COALESCE(CASE 
        WHEN $2::text = 'uz' THEN t.uz
        WHEN $2::text = 'ru' THEN t.ru
        WHEN $2::text = 'en' THEN t.en
        ELSE s.name
    END, s.name) as name,
    s.branch_id,
    s.name_i18n,
    s.picture_url,
    s.color_code,
    s.created_at,
    s.updated_at,
    s.deleted_at
FROM storages s
LEFT JOIN translations t ON s.name_i18n = t.id AND t.deleted_at = 0
WHERE s.id = $1 AND s.deleted_at = 0
  AND s.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid;

-- name: GetAllStoragesWithLanguage :many
SELECT 
    s.id,
    COALESCE(CASE 
        WHEN $1::text = 'uz' THEN t.uz
        WHEN $1::text = 'ru' THEN t.ru
        WHEN $1::text = 'en' THEN t.en
        ELSE s.name
    END, s.name) as name,
    s.branch_id,
    s.name_i18n,
    s.picture_url,
    s.color_code,
    s.created_at,
    s.updated_at,
    s.deleted_at
FROM storages s
LEFT JOIN translations t ON s.name_i18n = t.id AND t.deleted_at = 0
WHERE s.deleted_at = 0
  AND s.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
ORDER BY s.created_at DESC
LIMIT $2 OFFSET $3;

