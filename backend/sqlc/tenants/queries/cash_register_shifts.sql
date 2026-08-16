-- name: OpenCashRegisterShift :one
INSERT INTO cash_register_shifts (
  cash_register_id, cashier_id, branch_id, opened_at, opening_cash, opening_card
) VALUES (
  $1, $2,
  NULLIF(current_setting('app.branch_id', true), '')::uuid,
  NOW(), $3, $4
)
RETURNING *;

-- name: GetCashRegisterShiftByID :one
SELECT * FROM cash_register_shifts
WHERE id = $1 AND deleted_at = 0
  AND branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid;

-- name: GetActiveShiftByCashRegister :one
SELECT * FROM cash_register_shifts
WHERE cash_register_id = $1 AND closed_at IS NULL AND deleted_at = 0
  AND branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid;

-- name: ListCashRegisterShifts :many
SELECT * FROM cash_register_shifts
WHERE branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
  AND (NULLIF($1::text, '')::uuid IS NULL OR cash_register_id = NULLIF($1::text, '')::uuid)
  AND (NULLIF($2::text, '')::uuid IS NULL OR cashier_id       = NULLIF($2::text, '')::uuid)
  AND (NULLIF($3::text, '') IS NULL
       OR (NULLIF($3::text, '') = 'open'   AND closed_at IS NULL)
       OR (NULLIF($3::text, '') = 'closed' AND closed_at IS NOT NULL))
ORDER BY opened_at DESC
LIMIT $4 OFFSET $5;

-- name: CountCashRegisterShifts :one
SELECT COUNT(*) FROM cash_register_shifts
WHERE branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
  AND (NULLIF($1::text, '')::uuid IS NULL OR cash_register_id = NULLIF($1::text, '')::uuid)
  AND (NULLIF($2::text, '')::uuid IS NULL OR cashier_id       = NULLIF($2::text, '')::uuid)
  AND (NULLIF($3::text, '') IS NULL
       OR (NULLIF($3::text, '') = 'open'   AND closed_at IS NULL)
       OR (NULLIF($3::text, '') = 'closed' AND closed_at IS NOT NULL));

-- name: CloseCashRegisterShift :one
UPDATE cash_register_shifts
SET closed_at    = NOW(),
    closing_cash = $2,
    closing_card = $3,
    notes        = COALESCE($4, notes),
    updated_at   = NOW()
WHERE id = $1 AND closed_at IS NULL AND deleted_at = 0
  AND branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
RETURNING *;

-- name: DeleteCashRegisterShift :exec
UPDATE cash_register_shifts
SET deleted_at = EXTRACT(EPOCH FROM NOW())::BIGINT,
    updated_at = NOW()
WHERE id = $1 AND deleted_at = 0
  AND branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid;
