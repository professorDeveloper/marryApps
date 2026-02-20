-- name: CreateCashRegister :one
INSERT INTO cash_registers (
    id,
    name,
    branch_id
)
VALUES ($1, $2, $3)
RETURNING *;

-- name: GetCashRegisterByID :one
SELECT * FROM cash_registers
WHERE id = $1 AND deleted_at = 0
  AND branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid;

-- name: GetAllCashRegisters :many
SELECT * FROM cash_registers
WHERE deleted_at = 0
  AND branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
ORDER BY created_at DESC
LIMIT $1 OFFSET $2;

-- name: UpdateCashRegister :one
UPDATE cash_registers SET
    name = COALESCE($2, name),
    updated_at = NOW()
WHERE id = $1 AND deleted_at = 0
  AND branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
RETURNING *;

-- name: SoftDeleteCashRegister :one
UPDATE cash_registers SET
    deleted_at = EXTRACT(EPOCH FROM CURRENT_TIMESTAMP)::bigint
WHERE id = $1 AND deleted_at = 0
  AND branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
RETURNING *;

-- name: RestoreCashRegister :one
UPDATE cash_registers SET
    deleted_at = 0
WHERE id = $1 AND deleted_at != 0
  AND branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
RETURNING *;

-- name: GetCashRegistersByBranchID :many
SELECT * FROM cash_registers
WHERE deleted_at = 0
  AND branch_id = $1
ORDER BY created_at DESC
LIMIT $2 OFFSET $3;

-- name: CountCashRegisters :one
SELECT COUNT(*) FROM cash_registers
WHERE deleted_at = 0
  AND branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid;
