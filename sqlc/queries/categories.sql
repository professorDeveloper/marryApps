-- name: CreateCategory :one
INSERT INTO categories (id, name, picture_url, name_i18n, department_id, storage_id, parent)
VALUES ($1, $2, $3, $4, $5, $6, $7)
RETURNING id, name, picture_url, name_i18n, department_id, storage_id, parent, created_at, updated_at, deleted_at;

-- name: GetCategoryByID :one
SELECT id, name, picture_url, name_i18n, department_id, storage_id, parent, created_at, updated_at, deleted_at
FROM categories
WHERE id = $1 AND deleted_at = 0;

-- name: GetAllCategories :many
SELECT id, name, picture_url, name_i18n, department_id, storage_id, parent, created_at, updated_at, deleted_at
FROM categories
WHERE deleted_at = 0
ORDER BY created_at DESC
LIMIT $1 OFFSET $2;

-- name: GetCategoriesByDepartmentID :many
SELECT id, name, picture_url, name_i18n, department_id, storage_id, parent, created_at, updated_at, deleted_at
FROM categories
WHERE department_id = $1 AND deleted_at = 0
ORDER BY created_at DESC
LIMIT $2 OFFSET $3;

-- name: GetCategoriesByStorageID :many
SELECT id, name, picture_url, name_i18n, department_id, storage_id, parent, created_at, updated_at, deleted_at
FROM categories
WHERE storage_id = $1 AND deleted_at = 0
ORDER BY created_at DESC
LIMIT $2 OFFSET $3;

-- name: GetCategoriesByParentID :many
SELECT id, name, picture_url, name_i18n, department_id, storage_id, parent, created_at, updated_at, deleted_at
FROM categories
WHERE parent = $1 AND deleted_at = 0
ORDER BY created_at DESC
LIMIT $2 OFFSET $3;

-- name: GetRootCategories :many
SELECT id, name, picture_url, name_i18n, department_id, storage_id, parent, created_at, updated_at, deleted_at
FROM categories
WHERE parent IS NULL AND deleted_at = 0
ORDER BY created_at DESC
LIMIT $1 OFFSET $2;

-- name: UpdateCategory :one
UPDATE categories
SET name = COALESCE($2, name),
    picture_url = COALESCE($3, picture_url),
    name_i18n = COALESCE($4, name_i18n),
    department_id = COALESCE($5, department_id),
    storage_id = COALESCE($6, storage_id),
    parent = COALESCE($7, parent),
    updated_at = NOW()
WHERE id = $1 AND deleted_at = 0
RETURNING id, name, picture_url, name_i18n, department_id, storage_id, parent, created_at, updated_at, deleted_at;

-- name: DeleteCategory :exec
UPDATE categories
SET deleted_at = EXTRACT(EPOCH FROM NOW())::BIGINT
WHERE id = $1 AND deleted_at = 0;

-- name: RestoreCategory :exec
UPDATE categories
SET deleted_at = 0
WHERE id = $1 AND deleted_at != 0;

-- name: SearchCategories :many
SELECT id, name, picture_url, name_i18n, department_id, storage_id, parent, created_at, updated_at, deleted_at
FROM categories
WHERE deleted_at = 0 AND name ILIKE '%' || $1 || '%'
ORDER BY created_at DESC
LIMIT $2 OFFSET $3;

-- name: CountCategories :one
SELECT COUNT(*) FROM categories WHERE deleted_at = 0;

-- name: CountCategoriesByDepartment :one
SELECT COUNT(*) FROM categories WHERE department_id = $1 AND deleted_at = 0;

-- name: CountCategoriesByParent :one
SELECT COUNT(*) FROM categories WHERE parent = $1 AND deleted_at = 0;

-- name: CountRootCategories :one
SELECT COUNT(*) FROM categories WHERE parent IS NULL AND deleted_at = 0;

-- name: GetCategoryWithRelations :one
SELECT 
    c.id,
    c.name,
    c.picture_url,
    c.name_i18n,
    c.department_id,
    c.storage_id,
    c.parent,
    c.created_at,
    c.updated_at,
    d.name as department_name,
    s.name as storage_name,
    pc.name as parent_name
FROM categories c
LEFT JOIN departments d ON c.department_id = d.id AND d.deleted_at = 0
LEFT JOIN storages s ON c.storage_id = s.id AND s.deleted_at = 0
LEFT JOIN categories pc ON c.parent = pc.id AND pc.deleted_at = 0
WHERE c.id = $1 AND c.deleted_at = 0;
