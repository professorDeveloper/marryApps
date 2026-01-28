-- name: CreateDepartment :one
INSERT INTO departments (id, name, name_i18n, storage_id, color_code, picture_url)
VALUES ($1, $2, $3, $4, $5, $6)
RETURNING id, name, name_i18n, storage_id, color_code, picture_url, created_at, updated_at, deleted_at;

-- name: GetDepartmentByID :one
SELECT id, name, name_i18n, storage_id, color_code, picture_url, created_at, updated_at, deleted_at
FROM departments
WHERE id = $1 AND deleted_at = 0;

-- name: GetAllDepartments :many
SELECT id, name, name_i18n, storage_id, color_code, picture_url, created_at, updated_at, deleted_at
FROM departments
WHERE deleted_at = 0
ORDER BY created_at DESC
LIMIT $1 OFFSET $2;

-- name: GetDepartmentsByStorageID :many
SELECT id, name, name_i18n, storage_id, color_code, picture_url, created_at, updated_at, deleted_at
FROM departments
WHERE storage_id = $1 AND deleted_at = 0
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
WHERE id = $1 AND deleted_at = 0
RETURNING id, name, name_i18n, storage_id, color_code, picture_url, created_at, updated_at, deleted_at;

-- name: DeleteDepartment :exec
UPDATE departments
SET deleted_at = EXTRACT(EPOCH FROM NOW())::BIGINT
WHERE id = $1 AND deleted_at = 0;

-- name: RestoreDepartment :exec
UPDATE departments
SET deleted_at = 0
WHERE id = $1 AND deleted_at != 0;

-- name: SearchDepartments :many
SELECT id, name, name_i18n, storage_id, color_code, picture_url, created_at, updated_at, deleted_at
FROM departments
WHERE deleted_at = 0 AND name ILIKE '%' || $1 || '%'
ORDER BY created_at DESC
LIMIT $2 OFFSET $3;

-- name: CountDepartments :one
SELECT COUNT(*) FROM departments WHERE deleted_at = 0;

-- name: CountDepartmentsByStorage :one
SELECT COUNT(*) FROM departments WHERE storage_id = $1 AND deleted_at = 0;



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
WHERE d.id = $1 AND d.deleted_at = 0;



-- name: GetDepartmentStats :one
SELECT 
    d.id,
    d.name,
    COUNT(DISTINCT c.id) as category_count
FROM departments d
LEFT JOIN categories c ON d.id = c.department_id AND c.deleted_at = 0
WHERE d.id = $1 AND d.deleted_at = 0
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
WHERE d.id = $1 AND d.deleted_at = 0;

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
ORDER BY d.created_at DESC
LIMIT $2 OFFSET $3;

