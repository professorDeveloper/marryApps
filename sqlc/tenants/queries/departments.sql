-- name: CreateDepartment :one
INSERT INTO departments (id, name, name_i18n, storage_id, color_code, picture_url)
SELECT $1, $2, $3, $4, $5, $6
WHERE EXISTS (
    SELECT 1 FROM storages s
    WHERE s.id = $4
      AND s.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
)
RETURNING id, name, color_code, picture_url, name_i18n, storage_id, created_at, updated_at, deleted_at;

-- name: GetDepartmentByID :one
SELECT id, name, color_code, picture_url, name_i18n, storage_id, created_at, updated_at, deleted_at
FROM departments
WHERE departments.id = $1 AND deleted_at = 0
  AND EXISTS (
    SELECT 1 FROM storages s
    WHERE s.id = departments.storage_id
      AND s.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
  );

-- name: GetAllDepartments :many
SELECT
    d.id,
    d.name,
    d.storage_id,
    d.name_i18n,
    d.picture_url,
    d.color_code,
    d.created_at,
    d.updated_at,
    d.deleted_at
FROM departments d
LEFT JOIN translations t
    ON d.name_i18n = t.id
   AND t.deleted_at = 0
WHERE d.deleted_at = 0
  AND EXISTS (
        SELECT 1
        FROM storages s
        WHERE s.id = d.storage_id
          AND s.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
      )
  AND (
        sqlc.arg('search')::text = ''
        OR COALESCE(d.name, '') ILIKE '%' || sqlc.arg('search')::text || '%'
        OR COALESCE(t.uz, '') ILIKE '%' || sqlc.arg('search')::text || '%'
        OR COALESCE(t.ru, '') ILIKE '%' || sqlc.arg('search')::text || '%'
        OR COALESCE(t.en, '') ILIKE '%' || sqlc.arg('search')::text || '%'
      )
  AND (
        sqlc.narg('storage_id')::uuid IS NULL
        OR d.storage_id = sqlc.narg('storage_id')::uuid
      )
ORDER BY
    CASE
        WHEN sqlc.arg('sort_by')::text = 'name' AND sqlc.arg('sort_order')::text = 'asc'
        THEN d.name
    END ASC,
    CASE
        WHEN sqlc.arg('sort_by')::text = 'name' AND sqlc.arg('sort_order')::text = 'desc'
        THEN d.name
    END DESC,
    CASE
        WHEN sqlc.arg('sort_by')::text = 'created_at' AND sqlc.arg('sort_order')::text = 'asc'
        THEN d.created_at
    END ASC,
    CASE
        WHEN sqlc.arg('sort_by')::text = 'created_at' AND sqlc.arg('sort_order')::text = 'desc'
        THEN d.created_at
    END DESC,
    d.created_at DESC
LIMIT sqlc.arg('limit')::int
OFFSET sqlc.arg('offset')::int;

-- name: CountDepartments :one
SELECT COUNT(*)
FROM departments d
LEFT JOIN translations t
    ON d.name_i18n = t.id
   AND t.deleted_at = 0
WHERE d.deleted_at = 0
  AND EXISTS (
        SELECT 1
        FROM storages s
        WHERE s.id = d.storage_id
          AND s.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
      )
  AND (
        sqlc.arg('search')::text = ''
        OR COALESCE(d.name, '') ILIKE '%' || sqlc.arg('search')::text || '%'
        OR COALESCE(t.uz, '') ILIKE '%' || sqlc.arg('search')::text || '%'
        OR COALESCE(t.ru, '') ILIKE '%' || sqlc.arg('search')::text || '%'
        OR COALESCE(t.en, '') ILIKE '%' || sqlc.arg('search')::text || '%'
      )
  AND (
        sqlc.narg('storage_id')::uuid IS NULL
        OR d.storage_id = sqlc.narg('storage_id')::uuid
      );

-- name: GetDepartmentsByStorageID :many
SELECT id, name, color_code, picture_url, name_i18n, storage_id, created_at, updated_at, deleted_at
FROM departments
WHERE storage_id = $1 AND deleted_at = 0
  AND EXISTS (
    SELECT 1 FROM storages s
    WHERE s.id = departments.storage_id
      AND s.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
  )
ORDER BY created_at DESC
LIMIT $2 OFFSET $3;

-- name: UpdateDepartment :one
UPDATE departments
SET name = COALESCE($2, name),
    name_i18n = COALESCE($3, name_i18n),
    storage_id = COALESCE($4, storage_id),
    color_code = COALESCE($5, color_code),
    picture_url = COALESCE($6, picture_url),
    updated_at = NOW()
WHERE departments.id = $1 AND deleted_at = 0
  AND EXISTS (
    SELECT 1 FROM storages s
    WHERE s.id = departments.storage_id
      AND s.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
  )
  AND (
    $4 IS NULL OR EXISTS (
      SELECT 1 FROM storages s2
      WHERE s2.id = $4
        AND s2.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
    )
  )
RETURNING id, name, color_code, picture_url, name_i18n, storage_id, created_at, updated_at, deleted_at;

-- name: DeleteDepartment :exec
UPDATE departments
SET deleted_at = EXTRACT(EPOCH FROM NOW())::BIGINT
WHERE departments.id = $1 AND deleted_at = 0
  AND EXISTS (
    SELECT 1 FROM storages s
    WHERE s.id = departments.storage_id
      AND s.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
  );

-- name: RestoreDepartment :exec
UPDATE departments
SET deleted_at = 0
WHERE departments.id = $1 AND deleted_at != 0
  AND EXISTS (
    SELECT 1 FROM storages s
    WHERE s.id = departments.storage_id
      AND s.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
  );

-- name: CountDepartmentsByStorage :one
SELECT COUNT(*) FROM departments
WHERE storage_id = $1 AND deleted_at = 0
  AND EXISTS (
    SELECT 1 FROM storages s
    WHERE s.id = departments.storage_id
      AND s.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
  );

-- name: GetDepartmentWithStorage :one
SELECT 
    d.id,
    d.name,
    d.name_i18n,
    d.storage_id,
    d.created_at,
    d.updated_at,
    s.name as storage_name,
    s.branch_id as storage_branch_id
FROM departments d
LEFT JOIN storages s ON d.storage_id = s.id AND s.deleted_at = 0
WHERE d.id = $1 AND d.deleted_at = 0
  AND s.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid;

-- name: GetDepartmentStats :one
SELECT 
    d.id,
    d.name,
    COUNT(DISTINCT c.id) as category_count
FROM departments d
LEFT JOIN categories c ON d.id = c.department_id AND c.deleted_at = 0
WHERE d.id = $1 AND d.deleted_at = 0
  AND EXISTS (
    SELECT 1 FROM storages s
    WHERE s.id = d.storage_id
      AND s.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
  )
GROUP BY d.id, d.name;

-- name: GetDepartmentByIDWithLanguage :one
SELECT 
    d.id,
    COALESCE(CASE 
        WHEN $2::text = 'uz' THEN t.uz
        WHEN $2::text = 'ru' THEN t.ru
        WHEN $2::text = 'en' THEN t.en
        ELSE d.name
    END, d.name) as name,
    d.name_i18n,
    d.storage_id,
    d.color_code,
    d.picture_url,
    d.created_at,
    d.updated_at,
    d.deleted_at
FROM departments d
LEFT JOIN translations t ON d.name_i18n = t.id AND t.deleted_at = 0
WHERE d.id = $1 AND d.deleted_at = 0
  AND EXISTS (
    SELECT 1 FROM storages s
    WHERE s.id = d.storage_id
      AND s.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
  );

-- name: GetAllDepartmentsWithLanguage :many
SELECT 
    d.id,
    COALESCE(CASE 
        WHEN $1::text = 'uz' THEN t.uz
        WHEN $1::text = 'ru' THEN t.ru
        WHEN $1::text = 'en' THEN t.en
        ELSE d.name
    END, d.name) as name,
    d.name_i18n,
    d.storage_id,
    d.color_code,
    d.picture_url,
    d.created_at,
    d.updated_at,
    d.deleted_at
FROM departments d
LEFT JOIN translations t ON d.name_i18n = t.id AND t.deleted_at = 0
WHERE d.deleted_at = 0
  AND EXISTS (
    SELECT 1 FROM storages s
    WHERE s.id = d.storage_id
      AND s.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
  )
ORDER BY d.created_at DESC
LIMIT $2 OFFSET $3;
