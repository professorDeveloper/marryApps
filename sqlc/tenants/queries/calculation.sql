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

-- name: GetCalculationsByGoodIDPaginated :many
SELECT id, good_id, compound_id, ingredient_id, component_compound_id, quantity, measurement_unit, price_per_unit, total_cost, created_at, updated_at, deleted_at
FROM calculation
WHERE good_id = $1 AND deleted_at = 0
ORDER BY created_at DESC
LIMIT $2 OFFSET $3;

-- name: CountCalculationsByGoodID :one
SELECT COUNT(*) FROM calculation
WHERE good_id = $1 AND deleted_at = 0;

-- name: GetCalculationsByCompoundIDPaginated :many
SELECT id, good_id, compound_id, ingredient_id, component_compound_id, quantity, measurement_unit, price_per_unit, total_cost, created_at, updated_at, deleted_at
FROM calculation
WHERE compound_id = $1 AND deleted_at = 0
ORDER BY created_at DESC
LIMIT $2 OFFSET $3;

-- name: CountCalculationsByCompoundID :one
SELECT COUNT(*) FROM calculation
WHERE compound_id = $1 AND deleted_at = 0;

-- Dynamic price recalculation queries -----------------------------------------

-- name: UpdateCalculationsByIngredientPrice :exec
UPDATE calculation
SET price_per_unit = $2,
    total_cost     = quantity * $2,
    updated_at     = NOW()
WHERE ingredient_id = $1 AND deleted_at = 0;

-- name: UpdateCalculationsByChildCompoundPrice :exec
UPDATE calculation
SET price_per_unit = $2,
    total_cost     = quantity * $2,
    updated_at     = NOW()
WHERE component_compound_id = $1 AND deleted_at = 0;

-- name: GetCompoundIDsByIngredient :many
SELECT DISTINCT compound_id FROM calculation
WHERE ingredient_id = $1 AND compound_id IS NOT NULL AND deleted_at = 0;

-- name: GetGoodIDsByIngredient :many
SELECT DISTINCT good_id FROM calculation
WHERE ingredient_id = $1 AND good_id IS NOT NULL AND deleted_at = 0;

-- name: GetParentCompoundIDsByChildCompound :many
SELECT DISTINCT compound_id FROM calculation
WHERE component_compound_id = $1 AND compound_id IS NOT NULL AND deleted_at = 0;

-- name: GetParentGoodIDsByChildCompound :many
SELECT DISTINCT good_id FROM calculation
WHERE component_compound_id = $1 AND good_id IS NOT NULL AND deleted_at = 0;

-- name: GetDynamicCompoundCostFromIngredients :one
SELECT COALESCE(SUM(c.quantity * i.price_per_unit), 0) AS total_cost
FROM calculation c
JOIN ingredients i ON c.ingredient_id = i.id AND i.deleted_at = 0
WHERE c.compound_id = $1 AND c.ingredient_id IS NOT NULL AND c.deleted_at = 0;

-- name: GetDynamicCompoundCostFromChildCompounds :one
SELECT COALESCE(SUM(c.quantity * comp.price), 0) AS total_cost
FROM calculation c
JOIN compounds comp ON c.component_compound_id = comp.id AND comp.deleted_at = 0
WHERE c.compound_id = $1 AND c.component_compound_id IS NOT NULL AND c.deleted_at = 0;

-- name: GetDynamicGoodCostFromIngredients :one
SELECT COALESCE(SUM(c.quantity * i.price_per_unit), 0) AS total_cost
FROM calculation c
JOIN ingredients i ON c.ingredient_id = i.id AND i.deleted_at = 0
WHERE c.good_id = $1 AND c.ingredient_id IS NOT NULL AND c.deleted_at = 0;

-- name: GetDynamicGoodCostFromChildCompounds :one
SELECT COALESCE(SUM(c.quantity * comp.price), 0) AS total_cost
FROM calculation c
JOIN compounds comp ON c.component_compound_id = comp.id AND comp.deleted_at = 0
WHERE c.good_id = $1 AND c.component_compound_id IS NOT NULL AND c.deleted_at = 0;
