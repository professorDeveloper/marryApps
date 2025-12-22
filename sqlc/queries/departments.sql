-- name: CreateDepartment :one
INSERT INTO departments (id, name, name_i18n, storage_id)
VALUES ($1, $2, $3, $4)
RETURNING id, name, name_i18n, storage_id, created_at, updated_at, deleted_at;

-- name: GetDepartmentByID :one
SELECT id, name, name_i18n, storage_id, created_at, updated_at, deleted_at
FROM departments
WHERE id = $1 AND deleted_at = 0;

-- name: GetAllDepartments :many
SELECT id, name, name_i18n, storage_id, created_at, updated_at, deleted_at
FROM departments
WHERE deleted_at = 0
ORDER BY created_at DESC
LIMIT $1 OFFSET $2;

-- name: GetDepartmentsByStorageID :many
SELECT id, name, name_i18n, storage_id, created_at, updated_at, deleted_at
FROM departments
WHERE storage_id = $1 AND deleted_at = 0
ORDER BY created_at DESC
LIMIT $2 OFFSET $3;

-- name: UpdateDepartment :one
UPDATE departments
SET name = COALESCE($2, name),
    name_i18n = COALESCE($3, name_i18n),
    storage_id = COALESCE($4, storage_id),
    updated_at = NOW()
WHERE id = $1 AND deleted_at = 0
RETURNING id, name, name_i18n, storage_id, created_at, updated_at, deleted_at;

-- name: DeleteDepartment :exec
UPDATE departments
SET deleted_at = EXTRACT(EPOCH FROM NOW())::BIGINT
WHERE id = $1 AND deleted_at = 0;

-- name: RestoreDepartment :exec
UPDATE departments
SET deleted_at = 0
WHERE id = $1 AND deleted_at != 0;

-- name: SearchDepartments :many
SELECT id, name, name_i18n, storage_id, created_at, updated_at, deleted_at
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

