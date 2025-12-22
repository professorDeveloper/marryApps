-- name: CreateStorage :one
INSERT INTO storages (id, name, branch_id, name_i18n)
VALUES ($1, $2, $3, $4)
RETURNING id, name, branch_id, name_i18n, created_at, updated_at, deleted_at;

-- name: GetStorageByID :one
SELECT id, name, branch_id, name_i18n, created_at, updated_at, deleted_at
FROM storages
WHERE id = $1 AND deleted_at = 0;

-- name: GetAllStorages :many
SELECT id, name, branch_id, name_i18n, created_at, updated_at, deleted_at
FROM storages
WHERE deleted_at = 0
ORDER BY created_at DESC
LIMIT $1 OFFSET $2;

-- name: GetStoragesByBranchID :many
SELECT id, name, branch_id, name_i18n, created_at, updated_at, deleted_at
FROM storages
WHERE branch_id = $1 AND deleted_at = 0
ORDER BY created_at DESC
LIMIT $2 OFFSET $3;

-- name: UpdateStorage :one
UPDATE storages
SET name = COALESCE($2, name),
    branch_id = COALESCE($3, branch_id),
    name_i18n = COALESCE($4, name_i18n),
    updated_at = NOW()
WHERE id = $1 AND deleted_at = 0
RETURNING id, name, branch_id, name_i18n, created_at, updated_at, deleted_at;

-- name: DeleteStorage :exec
UPDATE storages
SET deleted_at = EXTRACT(EPOCH FROM NOW())::BIGINT
WHERE id = $1 AND deleted_at = 0;

-- name: RestoreStorage :exec
UPDATE storages
SET deleted_at = 0
WHERE id = $1 AND deleted_at != 0;

-- name: SearchStorages :many
SELECT id, name, branch_id, name_i18n, created_at, updated_at, deleted_at
FROM storages
WHERE deleted_at = 0 AND name ILIKE '%' || $1 || '%'
ORDER BY created_at DESC
LIMIT $2 OFFSET $3;

-- name: CountStorages :one
SELECT COUNT(*) FROM storages WHERE deleted_at = 0;

-- name: CountStoragesByBranch :one
SELECT COUNT(*) FROM storages WHERE branch_id = $1 AND deleted_at = 0;


-- name: GetStorageWithBranch :one
SELECT 
    s.id,
    s.name,
    s.branch_id,
    s.name_i18n,
    s.created_at,
    s.updated_at,
    b.name as branch_name,
    b.address as branch_address
FROM storages s
LEFT JOIN branches b ON s.branch_id = b.id AND b.deleted_at = 0
WHERE s.id = $1 AND s.deleted_at = 0;

-- name: GetStorageStats :one
SELECT 
    s.id,
    s.name,
    COUNT(DISTINCT d.id) as department_count,
    COUNT(DISTINCT c.id) as category_count
FROM storages s
LEFT JOIN departments d ON s.id = d.storage_id AND d.deleted_at = 0
LEFT JOIN categories c ON s.id = c.storage_id AND c.deleted_at = 0
WHERE s.id = $1 AND s.deleted_at = 0
GROUP BY s.id, s.name;


