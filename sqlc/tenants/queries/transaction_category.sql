-- ==================== TRANSACTION QUERIES ====================

-- name: CreateTransaction :one
INSERT INTO transactions (
  id, type,
  cash_register_id,
  from_cash_register_id, to_cash_register_id, from_branch_id, to_branch_id,
  group_transaction_id, amount, description, pay_type, date, user_id, branch_id
)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13,
        COALESCE(sqlc.narg('branch_id')::uuid, NULLIF(current_setting('app.branch_id', true), '')::uuid))
RETURNING id, type,
          cash_register_id,
          from_cash_register_id, to_cash_register_id, from_branch_id, to_branch_id,
          group_transaction_id, amount, description, pay_type, date, user_id, branch_id,
          created_at, updated_at, deleted_at;

-- name: GetTransactionByID :one
SELECT id, type,
       cash_register_id,
       from_cash_register_id, to_cash_register_id, from_branch_id, to_branch_id,
       group_transaction_id, amount, description, pay_type, date, user_id, branch_id,
       created_at, updated_at, deleted_at
FROM transactions
WHERE id = $1
  AND branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
  AND deleted_at = 0;

-- name: GetAllTransactions :many
SELECT id, type,
       cash_register_id,
       from_cash_register_id, to_cash_register_id, from_branch_id, to_branch_id,
       group_transaction_id, amount, description, pay_type, date, user_id, branch_id,
       created_at, updated_at, deleted_at
FROM transactions
WHERE branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
  AND deleted_at = 0
ORDER BY date DESC
LIMIT $1 OFFSET $2;

-- name: GetTransactionsByType :many
SELECT id, type,
       cash_register_id,
       from_cash_register_id, to_cash_register_id, from_branch_id, to_branch_id,
       group_transaction_id, amount, description, pay_type, date, user_id, branch_id,
       created_at, updated_at, deleted_at
FROM transactions
WHERE branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
  AND type = $1
  AND deleted_at = 0
ORDER BY date DESC
LIMIT $2 OFFSET $3;

-- name: GetTransactionsByCashRegister :many
SELECT id, type,
       cash_register_id,
       from_cash_register_id, to_cash_register_id, from_branch_id, to_branch_id,
       group_transaction_id, amount, description, pay_type, date, user_id, branch_id,
       created_at, updated_at, deleted_at
FROM transactions
WHERE branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
  AND cash_register_id = $1
  AND deleted_at = 0
ORDER BY date DESC
LIMIT $2 OFFSET $3;

-- name: GetTransactionsByDateRange :many
SELECT id, type,
       cash_register_id,
       from_cash_register_id, to_cash_register_id, from_branch_id, to_branch_id,
       group_transaction_id, amount, description, pay_type, date, user_id, branch_id,
       created_at, updated_at, deleted_at
FROM transactions
WHERE branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
  AND date >= $1
  AND date <= $2
  AND deleted_at = 0
ORDER BY date DESC
LIMIT $3 OFFSET $4;

-- name: GetTransactionsByGroup :many
SELECT id, type,
       cash_register_id,
       from_cash_register_id, to_cash_register_id, from_branch_id, to_branch_id,
       group_transaction_id, amount, description, pay_type, date, user_id, branch_id,
       created_at, updated_at, deleted_at
FROM transactions
WHERE branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
  AND group_transaction_id = $1
  AND deleted_at = 0
ORDER BY date DESC
LIMIT $2 OFFSET $3;

-- name: UpdateTransaction :one
UPDATE transactions
SET amount      = $2,
    description = $3,
    pay_type    = $4,
    date        = $5,
    updated_at  = NOW()
WHERE id = $1
  AND branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
  AND deleted_at = 0
RETURNING id, type,
          cash_register_id,
          from_cash_register_id, to_cash_register_id, from_branch_id, to_branch_id,
          group_transaction_id, amount, description, pay_type, date, user_id, branch_id,
          created_at, updated_at, deleted_at;

-- name: DeleteTransaction :exec
UPDATE transactions
SET deleted_at = EXTRACT(EPOCH FROM NOW())::BIGINT
WHERE id = $1
  AND branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
  AND deleted_at = 0;

-- name: CountTransactions :one
SELECT COUNT(*) FROM transactions
WHERE branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
  AND deleted_at = 0;
