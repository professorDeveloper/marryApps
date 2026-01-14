-- name: CreateCalculation :one
INSERT INTO calculation (id, good_id, compound_id, ingredient_id, component_compound_id, quantity, measurement_unit, price_per_unit, total_cost)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
RETURNING id, good_id, compound_id, ingredient_id, component_compound_id, quantity, measurement_unit, price_per_unit, total_cost, created_at, updated_at, deleted_at;

-- name: GetCalculationByID :one
SELECT id, good_id, compound_id, ingredient_id, component_compound_id, quantity, measurement_unit, price_per_unit, total_cost, created_at, updated_at, deleted_at
FROM calculation
WHERE id = $1 AND deleted_at = 0;

-- name: GetCalculationsByGoodID :many
SELECT id, good_id, compound_id, ingredient_id, component_compound_id, quantity, measurement_unit, price_per_unit, total_cost, created_at, updated_at, deleted_at
FROM calculation
WHERE good_id = $1 AND deleted_at = 0
ORDER BY created_at DESC;

-- name: GetCalculationsByCompoundID :many
SELECT id, good_id, compound_id, ingredient_id, component_compound_id, quantity, measurement_unit, price_per_unit, total_cost, created_at, updated_at, deleted_at
FROM calculation
WHERE compound_id = $1 AND deleted_at = 0
ORDER BY created_at DESC;

-- name: GetCalculationsByIngredientID :many
SELECT id, good_id, compound_id, ingredient_id, component_compound_id, quantity, measurement_unit, price_per_unit, total_cost, created_at, updated_at, deleted_at
FROM calculation
WHERE ingredient_id = $1 AND deleted_at = 0
ORDER BY created_at DESC;

-- name: GetTotalCostByGoodID :one
SELECT COALESCE(SUM(total_cost), 0) as total_cost
FROM calculation
WHERE good_id = $1 AND deleted_at = 0;

-- name: GetTotalCostByCompoundID :one
SELECT COALESCE(SUM(total_cost), 0) as total_cost
FROM calculation
WHERE compound_id = $1 AND deleted_at = 0;

-- name: UpdateCalculation :one
UPDATE calculation
SET quantity = COALESCE($2, quantity),
    measurement_unit = COALESCE($3, measurement_unit),
    price_per_unit = COALESCE($4, price_per_unit),
    total_cost = COALESCE($5, total_cost),
    updated_at = NOW()
WHERE id = $1 AND deleted_at = 0
RETURNING id, good_id, compound_id, ingredient_id, component_compound_id, quantity, measurement_unit, price_per_unit, total_cost, created_at, updated_at, deleted_at;

-- name: DeleteCalculation :exec
UPDATE calculation
SET deleted_at = EXTRACT(EPOCH FROM NOW())::BIGINT
WHERE id = $1 AND deleted_at = 0;

-- name: RestoreCalculation :exec
UPDATE calculation
SET deleted_at = 0
WHERE id = $1 AND deleted_at != 0;

-- name: DeleteCalculationsByGoodID :exec
UPDATE calculation
SET deleted_at = EXTRACT(EPOCH FROM NOW())::BIGINT
WHERE good_id = $1 AND deleted_at = 0;

-- name: DeleteCalculationsByCompoundID :exec
UPDATE calculation
SET deleted_at = EXTRACT(EPOCH FROM NOW())::BIGINT
WHERE compound_id = $1 AND deleted_at = 0;

-- name: GetAllCalculations :many
SELECT id, good_id, compound_id, ingredient_id, component_compound_id, quantity, measurement_unit, price_per_unit, total_cost, created_at, updated_at, deleted_at
FROM calculation
WHERE deleted_at = 0
ORDER BY created_at DESC
LIMIT $1 OFFSET $2;
