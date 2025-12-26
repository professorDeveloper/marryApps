-- name: CreateHall :one
INSERT INTO halls (id, branch_id, name, name_i18n)
VALUES ($1, $2, $3, $4)
RETURNING id, branch_id, name, name_i18n, created_at, updated_at, deleted_at;

-- name: GetHallByID :one
SELECT id, branch_id, name, name_i18n, created_at, updated_at, deleted_at
FROM halls
WHERE id = $1 AND deleted_at = 0;

-- name: GetAllHalls :many
SELECT id, branch_id, name, name_i18n, created_at, updated_at, deleted_at
FROM halls
WHERE deleted_at = 0
ORDER BY created_at DESC
LIMIT $1 OFFSET $2;

-- name: GetHallsByBranchID :many
SELECT id, branch_id, name, name_i18n, created_at, updated_at, deleted_at
FROM halls
WHERE branch_id = $1 AND deleted_at = 0
ORDER BY created_at DESC
LIMIT $2 OFFSET $3;

-- name: UpdateHall :one
UPDATE halls
SET branch_id = COALESCE($2, branch_id),
    name = COALESCE($3, name),
    name_i18n = COALESCE($4, name_i18n),
    updated_at = NOW()
WHERE id = $1 AND deleted_at = 0
RETURNING id, branch_id, name, name_i18n, created_at, updated_at, deleted_at;

-- name: DeleteHall :exec
UPDATE halls
SET deleted_at = EXTRACT(EPOCH FROM NOW())::BIGINT
WHERE id = $1 AND deleted_at = 0;

-- name: RestoreHall :exec
UPDATE halls
SET deleted_at = 0
WHERE id = $1 AND deleted_at != 0;

-- name: SearchHalls :many
SELECT id, branch_id, name, name_i18n, created_at, updated_at, deleted_at
FROM halls
WHERE deleted_at = 0 AND name ILIKE '%' || $1 || '%'
ORDER BY created_at DESC
LIMIT $2 OFFSET $3;

-- name: CountHalls :one
SELECT COUNT(*) FROM halls WHERE deleted_at = 0;

-- name: CountHallsByBranch :one
SELECT COUNT(*) FROM halls WHERE branch_id = $1 AND deleted_at = 0;


-- name: GetHallWithBranch :one
SELECT 
    h.id,
    h.branch_id,
    h.name,
    h.name_i18n,
    h.created_at,
    h.updated_at,
    b.name as branch_name,
    b.address as branch_address
FROM halls h
LEFT JOIN branches b ON h.branch_id = b.id AND b.deleted_at = 0
WHERE h.id = $1 AND h.deleted_at = 0;


