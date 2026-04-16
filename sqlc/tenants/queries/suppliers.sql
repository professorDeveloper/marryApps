-- ==================== SUPPLIERS QUERIES ====================

-- name: CreateSupplier :one
INSERT INTO suppliers (id, name, phone_number, location, branch_id)
VALUES ($1, $2, $3, $4, NULLIF(current_setting('app.branch_id', true), '')::uuid)
RETURNING id, name, phone_number, location, branch_id, created_at, updated_at, deleted_at;

-- name: GetSupplierByID :one
SELECT id, name, phone_number, location, branch_id, created_at, updated_at, deleted_at
FROM suppliers
WHERE id = $1
  AND branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
  AND deleted_at = 0;

-- name: GetAllSuppliers :many
SELECT
    s.id,
    s.name,
    s.phone_number,
    s.location,
    s.created_at,
    s.updated_at,
    s.deleted_at
FROM suppliers s
WHERE s.deleted_at = 0
  AND s.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
  AND (
        sqlc.arg('search')::text = ''
        OR COALESCE(s.name, '') ILIKE '%' || sqlc.arg('search')::text || '%'
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

-- name: UpdateSupplier :one
UPDATE suppliers
SET name = $2,
    phone_number = $3,
    location = $4,
    updated_at = NOW()
WHERE id = $1
  AND branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
RETURNING id, name, phone_number, location, branch_id, created_at, updated_at, deleted_at;

-- name: DeleteSupplier :exec
UPDATE suppliers
SET deleted_at = EXTRACT(EPOCH FROM NOW())::BIGINT
WHERE id = $1
  AND branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid;

-- name: RestoreSupplier :one
UPDATE suppliers
SET deleted_at = 0,
    updated_at = NOW()
WHERE id = $1
  AND branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
RETURNING id, name, phone_number, location, branch_id, created_at, updated_at, deleted_at;

-- name: CountSuppliers :one
SELECT COUNT(*)
FROM suppliers s
WHERE s.deleted_at = 0
  AND s.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
  AND (
        sqlc.arg('search')::text = ''
        OR COALESCE(s.name, '') ILIKE '%' || sqlc.arg('search')::text || '%'
      );

-- name: GetSuppliersByPhoneNumber :many
SELECT id, name, phone_number, location, branch_id, created_at, updated_at, deleted_at
FROM suppliers
WHERE phone_number = $1
  AND branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
  AND deleted_at = 0;
