-- name: CreateDeduction :one
INSERT INTO deductions (
  id,
  date,
  act_group_id,
  storage_id,
  description,
  description_i18n,
  status,
  balance
)
VALUES ($1, $2, $3, $4, $5, $6, $7, 0)
RETURNING id, number, date, act_group_id, storage_id, description, description_i18n, status, balance, created_at, updated_at, deleted_at;

-- name: GetDeductionByID :one
SELECT id, number, date, act_group_id, storage_id, description, description_i18n, status, balance, created_at, updated_at, deleted_at
FROM deductions
WHERE id = $1 AND deleted_at = 0;

-- name: GetAllDeductions :many
SELECT id, number, date, act_group_id, storage_id, description, description_i18n, status, balance, created_at, updated_at, deleted_at
FROM deductions
ORDER BY date DESC, number DESC
LIMIT $1 OFFSET $2;

-- name: UpdateDeduction :one
UPDATE deductions
SET date = $2,
    act_group_id = $3,
    storage_id = $4,
    description = $5,
    description_i18n = $6,
    status = $7,
    updated_at = NOW()
WHERE id = $1 AND deleted_at = 0
RETURNING id, number, date, act_group_id, storage_id, description, description_i18n, status, balance, created_at, updated_at, deleted_at;

-- name: DeleteDeduction :exec
UPDATE deductions
SET deleted_at = EXTRACT(EPOCH FROM NOW())::BIGINT,
    updated_at = NOW()
WHERE id = $1 AND deleted_at = 0;

-- name: RestoreDeduction :one
UPDATE deductions
SET deleted_at = 0,
    updated_at = NOW()
WHERE id = $1
RETURNING id, number, date, act_group_id, storage_id, description, description_i18n, status, balance, created_at, updated_at, deleted_at;

-- name: CreateDeductionItem :one
INSERT INTO deduction_items (
  id,
  deduction_id,
  ingredient_id,
  good_id,
  compound_id,
  quantity
)
VALUES ($1, $2, $3, $4, $5, $6)
RETURNING id, deduction_id, ingredient_id, good_id, compound_id, quantity, created_at, updated_at, deleted_at;

-- name: GetDeductionItemsByDeductionID :many
SELECT id, deduction_id, ingredient_id, good_id, compound_id, quantity, created_at, updated_at, deleted_at
FROM deduction_items
WHERE deduction_id = $1 AND deleted_at = 0
ORDER BY created_at ASC;

-- name: CreateDeductionItemIngredient :one
INSERT INTO deduction_item_ingredients (
  id,
  deduction_item_id,
  ingredient_id,
  quantity,
  stock_before,
  stock_after,
  price_per_unit,
  amount
)
VALUES ($1, $2, $3, $4, $5, $6, $7, ($4::numeric * $7::numeric))
RETURNING id, deduction_item_id, ingredient_id, quantity, stock_before, stock_after, price_per_unit, amount, created_at, updated_at, deleted_at;

-- name: GetDeductionItemIngredientsByDeductionItemID :many
SELECT id, deduction_item_id, ingredient_id, quantity, stock_before, stock_after, price_per_unit, amount, created_at, updated_at, deleted_at
FROM deduction_item_ingredients
WHERE deduction_item_id = $1 AND deleted_at = 0
ORDER BY created_at ASC;

-- name: UpdateDeductionBalanceFromItems :one
UPDATE deductions d
SET balance = COALESCE((
  SELECT SUM(dii.amount)
  FROM deduction_item_ingredients dii
  JOIN deduction_items di ON di.id = dii.deduction_item_id
  WHERE di.deduction_id = d.id
    AND di.deleted_at = 0
    AND dii.deleted_at = 0
), 0),
    updated_at = NOW()
WHERE d.id = $1 AND d.deleted_at = 0
RETURNING id, number, date, act_group_id, storage_id, description, description_i18n, status, balance, created_at, updated_at, deleted_at;
