-- ==================== TRANSACTION QUERIES ====================

-- name: CreateTransaction :one
INSERT INTO transactions (
  id, type,
  cash_register_id,
  from_cash_register_id, to_cash_register_id, from_branch_id, to_branch_id,
  group_transaction_id, amount, description, pay_type, date, user_id, branch_id,
  customer_paid_amount, change_amount
)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13,
        COALESCE(sqlc.narg('branch_id')::uuid, NULLIF(current_setting('app.branch_id', true), '')::uuid),
        sqlc.narg('customer_paid_amount'), sqlc.narg('change_amount'))
RETURNING id, type,
          cash_register_id,
          from_cash_register_id, to_cash_register_id, from_branch_id, to_branch_id,
          group_transaction_id, amount, description, pay_type, date, user_id, branch_id,
          created_at, updated_at, deleted_at,
          customer_paid_amount, change_amount;

-- name: GetTransactionByID :one
SELECT id, type,
       cash_register_id,
       from_cash_register_id, to_cash_register_id, from_branch_id, to_branch_id,
       group_transaction_id, amount, description, pay_type, date, user_id, branch_id,
       created_at, updated_at, deleted_at,
       customer_paid_amount, change_amount
FROM transactions
WHERE id = $1
  AND branch_id IS NOT DISTINCT FROM NULLIF(current_setting('app.branch_id', true), '')::uuid
  AND deleted_at = 0;

-- name: GetAllTransactions :many
SELECT id, type,
       cash_register_id,
       from_cash_register_id, to_cash_register_id, from_branch_id, to_branch_id,
       group_transaction_id, amount, description, pay_type, date, user_id, branch_id,
       created_at, updated_at, deleted_at,
       customer_paid_amount, change_amount
FROM transactions
WHERE branch_id IS NOT DISTINCT FROM NULLIF(current_setting('app.branch_id', true), '')::uuid
  AND deleted_at = 0
  AND (
        sqlc.arg('search')::text = ''
        OR COALESCE(description, '') ILIKE '%' || sqlc.arg('search')::text || '%'
        OR COALESCE(amount::text, '') ILIKE '%' || sqlc.arg('search')::text || '%'
      )
  AND (
        sqlc.arg('type')::text = ''
        OR type::text = sqlc.arg('type')::text
      )
  AND (
        sqlc.narg('cash_register_id')::uuid IS NULL
        OR cash_register_id = sqlc.narg('cash_register_id')::uuid
      )
  AND (
        sqlc.narg('group_transaction_id')::uuid IS NULL
        OR group_transaction_id = sqlc.narg('group_transaction_id')::uuid
      )
  AND (
        sqlc.narg('date_from')::timestamptz IS NULL
        OR date >= sqlc.narg('date_from')::timestamptz
      )
  AND (
        sqlc.narg('date_to')::timestamptz IS NULL
        OR date <= sqlc.narg('date_to')::timestamptz
      )
  AND (
      sqlc.arg('pay_type')::text = ''
      OR pay_type::text = sqlc.arg('pay_type')::text
    )
ORDER BY
    CASE
        WHEN sqlc.arg('sort_by')::text = 'amount' AND sqlc.arg('sort_order')::text = 'asc'
        THEN amount
    END ASC,
    CASE
        WHEN sqlc.arg('sort_by')::text = 'amount' AND sqlc.arg('sort_order')::text = 'desc'
        THEN amount
    END DESC,
    CASE
        WHEN sqlc.arg('sort_by')::text = 'date' AND sqlc.arg('sort_order')::text = 'asc'
        THEN date
    END ASC,
    CASE
        WHEN sqlc.arg('sort_by')::text = 'date' AND sqlc.arg('sort_order')::text = 'desc'
        THEN date
    END DESC,
    CASE
        WHEN sqlc.arg('sort_by')::text = 'created_at' AND sqlc.arg('sort_order')::text = 'asc'
        THEN created_at
    END ASC,
    CASE
        WHEN sqlc.arg('sort_by')::text = 'created_at' AND sqlc.arg('sort_order')::text = 'desc'
        THEN created_at
    END DESC,
    date DESC,
    created_at DESC
LIMIT sqlc.arg('limit')::int
OFFSET sqlc.arg('offset')::int;

-- name: GetTransactionsByType :many
SELECT id, type,
       cash_register_id,
       from_cash_register_id, to_cash_register_id, from_branch_id, to_branch_id,
       group_transaction_id, amount, description, pay_type, date, user_id, branch_id,
       created_at, updated_at, deleted_at,
       customer_paid_amount, change_amount
FROM transactions
WHERE branch_id IS NOT DISTINCT FROM NULLIF(current_setting('app.branch_id', true), '')::uuid
  AND type = $1
  AND deleted_at = 0
ORDER BY date DESC
LIMIT $2 OFFSET $3;

-- name: GetTransactionsByCashRegister :many
SELECT id, type,
       cash_register_id,
       from_cash_register_id, to_cash_register_id, from_branch_id, to_branch_id,
       group_transaction_id, amount, description, pay_type, date, user_id, branch_id,
       created_at, updated_at, deleted_at,
       customer_paid_amount, change_amount
FROM transactions
WHERE branch_id IS NOT DISTINCT FROM NULLIF(current_setting('app.branch_id', true), '')::uuid
  AND cash_register_id = $1
  AND deleted_at = 0
ORDER BY date DESC
LIMIT $2 OFFSET $3;

-- name: GetTransactionsByDateRange :many
SELECT id, type,
       cash_register_id,
       from_cash_register_id, to_cash_register_id, from_branch_id, to_branch_id,
       group_transaction_id, amount, description, pay_type, date, user_id, branch_id,
       created_at, updated_at, deleted_at,
       customer_paid_amount, change_amount
FROM transactions
WHERE branch_id IS NOT DISTINCT FROM NULLIF(current_setting('app.branch_id', true), '')::uuid
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
       created_at, updated_at, deleted_at,
       customer_paid_amount, change_amount
FROM transactions
WHERE branch_id IS NOT DISTINCT FROM NULLIF(current_setting('app.branch_id', true), '')::uuid
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
  AND branch_id IS NOT DISTINCT FROM NULLIF(current_setting('app.branch_id', true), '')::uuid
  AND deleted_at = 0
RETURNING id, type,
          cash_register_id,
          from_cash_register_id, to_cash_register_id, from_branch_id, to_branch_id,
          group_transaction_id, amount, description, pay_type, date, user_id, branch_id,
          created_at, updated_at, deleted_at,
          customer_paid_amount, change_amount;

-- name: DeleteTransaction :exec
UPDATE transactions
SET deleted_at = EXTRACT(EPOCH FROM NOW())::BIGINT
WHERE id = $1
  AND branch_id IS NOT DISTINCT FROM NULLIF(current_setting('app.branch_id', true), '')::uuid
  AND deleted_at = 0;

-- name: CountTransactions :one
SELECT COUNT(*)
FROM transactions
WHERE branch_id IS NOT DISTINCT FROM NULLIF(current_setting('app.branch_id', true), '')::uuid
  AND deleted_at = 0
  AND (
        sqlc.arg('search')::text = ''
        OR COALESCE(description, '') ILIKE '%' || sqlc.arg('search')::text || '%'
        OR COALESCE(amount::text, '') ILIKE '%' || sqlc.arg('search')::text || '%'
      )
  AND (
        sqlc.arg('type')::text = ''
        OR type::text = sqlc.arg('type')::text
      )
  AND (
        sqlc.narg('cash_register_id')::uuid IS NULL
        OR cash_register_id = sqlc.narg('cash_register_id')::uuid
      )
  AND (
        sqlc.narg('group_transaction_id')::uuid IS NULL
        OR group_transaction_id = sqlc.narg('group_transaction_id')::uuid
      )
  AND (
        sqlc.narg('date_from')::timestamptz IS NULL
        OR date >= sqlc.narg('date_from')::timestamptz
      )
  AND (
        sqlc.narg('date_to')::timestamptz IS NULL
        OR date <= sqlc.narg('date_to')::timestamptz
      )
  AND (
      sqlc.arg('pay_type')::text = ''
      OR pay_type::text = sqlc.arg('pay_type')::text
      );

-- ==================== CASH REPORT QUERIES ====================

-- name: GetTransactionReportSummary :many
-- Returns totals grouped by type × pay_type (cash/card) for the date range.
SELECT
  type,
  COALESCE(SUM(amount) FILTER (WHERE pay_type = 'cash'), 0::numeric) AS cash_total,
  COALESCE(SUM(amount) FILTER (WHERE pay_type = 'card'), 0::numeric) AS card_total,
  COALESCE(SUM(amount), 0::numeric)                                  AS total
FROM transactions
WHERE branch_id IS NOT DISTINCT FROM NULLIF(current_setting('app.branch_id', true), '')::uuid
  AND deleted_at = 0
  AND date >= sqlc.arg('from_date')::timestamptz
  AND date <= sqlc.arg('to_date')::timestamptz
  AND (sqlc.narg('cash_register_id')::uuid IS NULL OR cash_register_id = sqlc.narg('cash_register_id')::uuid)
GROUP BY type
ORDER BY type;

-- name: GetTransactionGroupReport :many
-- Returns totals grouped by (group_transaction, type) for the income/expense detail panels.
SELECT
  gt.id   AS group_id,
  gt.name AS group_name,
  t.type,
  COALESCE(SUM(t.amount) FILTER (WHERE t.pay_type = 'cash'), 0::numeric) AS cash_total,
  COALESCE(SUM(t.amount) FILTER (WHERE t.pay_type = 'card'), 0::numeric) AS card_total,
  COALESCE(SUM(t.amount), 0::numeric)                                     AS total
FROM transactions t
LEFT JOIN group_transactions gt
  ON gt.id = t.group_transaction_id AND gt.deleted_at = 0
WHERE t.branch_id IS NOT DISTINCT FROM NULLIF(current_setting('app.branch_id', true), '')::uuid
  AND t.deleted_at = 0
  AND t.date >= sqlc.arg('from_date')::timestamptz
  AND t.date <= sqlc.arg('to_date')::timestamptz
  AND (sqlc.narg('cash_register_id')::uuid IS NULL OR t.cash_register_id = sqlc.narg('cash_register_id')::uuid)
GROUP BY gt.id, gt.name, t.type
ORDER BY t.type, gt.name;

-- name: GetTransactionOpeningBalance :one
-- Returns income/expense totals before from_date to compute opening balance.
SELECT
  COALESCE(SUM(amount) FILTER (WHERE
    type = 'income' OR type = 'bill_payment' OR type = 'transfer_income'
  ), 0::numeric) AS income_total,
  COALESCE(SUM(amount) FILTER (WHERE
    type = 'expense' OR type = 'transfer_expense'
  ), 0::numeric) AS expense_total
FROM transactions
WHERE branch_id IS NOT DISTINCT FROM NULLIF(current_setting('app.branch_id', true), '')::uuid
  AND deleted_at = 0
  AND date < sqlc.arg('from_date')::timestamptz
  AND (sqlc.narg('cash_register_id')::uuid IS NULL OR cash_register_id = sqlc.narg('cash_register_id')::uuid);
