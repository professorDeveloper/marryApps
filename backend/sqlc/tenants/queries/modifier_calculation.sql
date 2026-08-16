-- name: CreateModifierCalculation :one
INSERT INTO modifier_calculation (
    id,
    modifier_id,
    ingredient_id,
    component_compound_id,
    quantity,
    measurement_unit,
    price_per_unit,
    total_cost
)
VALUES (
    $1, $2, $3, $4, $5, $6, $7, $8
)
RETURNING
    id,
    modifier_id,
    ingredient_id,
    component_compound_id,
    quantity,
    measurement_unit,
    price_per_unit,
    total_cost,
    created_at,
    updated_at,
    deleted_at;

-- name: GetModifierCalculationByID :one
SELECT
    id,
    modifier_id,
    ingredient_id,
    component_compound_id,
    quantity,
    measurement_unit,
    price_per_unit,
    total_cost,
    created_at,
    updated_at,
    deleted_at
FROM modifier_calculation
WHERE id = $1
  AND deleted_at = 0;

-- name: GetModifierCalculationsByModifierID :many
SELECT
    id,
    modifier_id,
    ingredient_id,
    component_compound_id,
    quantity,
    measurement_unit,
    price_per_unit,
    total_cost,
    created_at,
    updated_at,
    deleted_at
FROM modifier_calculation
WHERE modifier_id = $1
  AND deleted_at = 0
ORDER BY created_at ASC;

-- name: GetTotalCostByModifierID :one
SELECT COALESCE(SUM(total_cost), 0) AS total_cost
FROM modifier_calculation
WHERE modifier_id = $1
  AND deleted_at = 0;

-- name: UpdateModifierCalculation :one
UPDATE modifier_calculation
SET
    quantity = COALESCE($2, quantity),
    measurement_unit = COALESCE($3, measurement_unit),
    price_per_unit = COALESCE($4, price_per_unit),
    total_cost = COALESCE($5, total_cost),
    updated_at = NOW()
WHERE id = $1
  AND deleted_at = 0
RETURNING
    id,
    modifier_id,
    ingredient_id,
    component_compound_id,
    quantity,
    measurement_unit,
    price_per_unit,
    total_cost,
    created_at,
    updated_at,
    deleted_at;

-- name: DeleteModifierCalculation :exec
UPDATE modifier_calculation
SET deleted_at = EXTRACT(EPOCH FROM NOW())::BIGINT
WHERE id = $1
  AND deleted_at = 0;

-- name: DeleteModifierCalculationsByModifierID :exec
UPDATE modifier_calculation
SET deleted_at = EXTRACT(EPOCH FROM NOW())::BIGINT
WHERE modifier_id = $1
  AND deleted_at = 0;
