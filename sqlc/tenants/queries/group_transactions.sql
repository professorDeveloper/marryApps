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
  AND (
        sqlc.arg('search')::text = ''
        OR LOWER(name) LIKE LOWER('%' || sqlc.arg('search')::text || '%')
      )
ORDER BY
    CASE
        WHEN sqlc.arg('sort_by')::text = 'name' AND sqlc.arg('sort_order')::text = 'asc'
        THEN name
    END ASC,
    CASE
        WHEN sqlc.arg('sort_by')::text = 'name' AND sqlc.arg('sort_order')::text = 'desc'
        THEN name
    END DESC,
    CASE
        WHEN sqlc.arg('sort_by')::text = 'created_at' AND sqlc.arg('sort_order')::text = 'asc'
        THEN created_at
    END ASC,
    CASE
        WHEN sqlc.arg('sort_by')::text = 'created_at' AND sqlc.arg('sort_order')::text = 'desc'
        THEN created_at
    END DESC,
    created_at DESC
LIMIT sqlc.arg('limit')::int
OFFSET sqlc.arg('offset')::int;

-- name: CountGroupTransactions :one
SELECT COUNT(*)
FROM group_transactions
WHERE branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
  AND deleted_at = 0
  AND (
        sqlc.arg('search')::text = ''
        OR LOWER(name) LIKE LOWER('%' || sqlc.arg('search')::text || '%')
      );

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

