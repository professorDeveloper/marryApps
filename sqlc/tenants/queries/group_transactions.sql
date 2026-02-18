-- name: CreateGroupTransaction :one
INSERT INTO group_transactions (id, name, branch_id)
VALUES ($1, $2, NULLIF(current_setting('app.branch_id', true), '')::uuid)
RETURNING id, name, branch_id, created_at, updated_at, deleted_at;

-- name: GetGroupTransactionByID :one
SELECT id, name, branch_id, created_at, updated_at, deleted_at
FROM group_transactions
WHERE id = $1
  AND branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
  AND deleted_at = 0;

-- name: GetAllGroupTransactions :many
SELECT id, name, branch_id, created_at, updated_at, deleted_at
FROM group_transactions
WHERE branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
  AND deleted_at = 0
ORDER BY created_at DESC
LIMIT $1 OFFSET $2;

-- name: UpdateGroupTransaction :one
UPDATE group_transactions
SET name = COALESCE($2, name),
    updated_at = NOW()
WHERE id = $1
  AND branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
  AND deleted_at = 0
RETURNING id, name, branch_id, created_at, updated_at, deleted_at;

-- name: DeleteGroupTransaction :exec
UPDATE group_transactions
SET deleted_at = EXTRACT(EPOCH FROM NOW())::BIGINT
WHERE id = $1
  AND branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
  AND deleted_at = 0;

-- name: RestoreGroupTransaction :one
UPDATE group_transactions
SET deleted_at = 0, updated_at = NOW()
WHERE id = $1
  AND branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
RETURNING id, name, branch_id, created_at, updated_at, deleted_at;

-- name: SearchGroupTransactions :many
SELECT id, name, branch_id, created_at, updated_at, deleted_at
FROM group_transactions
WHERE branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
  AND deleted_at = 0
  AND (LOWER(name) LIKE LOWER('%' || $1 || '%'))
ORDER BY created_at DESC
LIMIT $2 OFFSET $3;
