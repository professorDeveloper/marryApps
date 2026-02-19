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
SELECT id, name, phone_number, location, branch_id, created_at, updated_at, deleted_at
FROM suppliers
WHERE branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
  AND deleted_at = 0
ORDER BY name ASC
LIMIT $1 OFFSET $2;

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

-- name: SearchSuppliers :many
SELECT id, name, phone_number, location, branch_id, created_at, updated_at, deleted_at
FROM suppliers
WHERE name ILIKE $1
  AND branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
  AND deleted_at = 0
ORDER BY name ASC
LIMIT $2 OFFSET $3;

-- name: CountSuppliers :one
SELECT COUNT(*)
FROM suppliers
WHERE branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
  AND deleted_at = 0;

-- name: GetSuppliersByPhoneNumber :many
SELECT id, name, phone_number, location, branch_id, created_at, updated_at, deleted_at
FROM suppliers
WHERE phone_number = $1
  AND branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
  AND deleted_at = 0;
