-- ==================== INGREDIENT GROUPS QUERIES ====================

-- name: CreateIngredientGroup :one
INSERT INTO ingredient_groups (id, name, name_i18n)
VALUES ($1, $2, $3)
RETURNING id, name, name_i18n, created_at, updated_at, deleted_at;

-- name: GetIngredientGroupByID :one
SELECT id, name, name_i18n, created_at, updated_at, deleted_at
FROM ingredient_groups
WHERE id = $1 AND deleted_at = 0;

-- name: GetAllIngredientGroups :many
SELECT id, name, name_i18n, created_at, updated_at, deleted_at
FROM ingredient_groups
WHERE deleted_at = 0
ORDER BY created_at DESC
LIMIT $1 OFFSET $2;

-- UpdateIngredientGroup updates an ingredient group
-- name: UpdateIngredientGroup :one
UPDATE ingredient_groups
SET name = COALESCE($2, name),
    name_i18n = COALESCE($3, name_i18n),
    updated_at = NOW()
WHERE id = $1 AND deleted_at = 0
RETURNING id, name, name_i18n, created_at, updated_at, deleted_at;

-- DeleteIngredientGroup soft deletes an ingredient group
-- name: DeleteIngredientGroup :exec
UPDATE ingredient_groups
SET deleted_at = EXTRACT(EPOCH FROM NOW())::BIGINT
WHERE id = $1 AND deleted_at = 0;

-- RestoreIngredientGroup restores a deleted ingredient group
-- name: RestoreIngredientGroup :exec
UPDATE ingredient_groups
SET deleted_at = 0
WHERE id = $1 AND deleted_at != 0;

-- SearchIngredientGroups searches ingredient groups by name
-- name: SearchIngredientGroups :many
SELECT id, name, name_i18n, created_at, updated_at, deleted_at
FROM ingredient_groups
WHERE deleted_at = 0 AND name ILIKE '%' || $1 || '%'
ORDER BY created_at DESC
LIMIT $2 OFFSET $3;

-- CountIngredientGroups counts total ingredient groups
-- name: CountIngredientGroups :one
SELECT COUNT(*) FROM ingredient_groups WHERE deleted_at = 0;


-- CreateIngredient creates a new ingredient
-- name: CreateIngredient :one
INSERT INTO ingredients (id, name, name_i18n, group_id, measurement, picture_url, brand_id)
VALUES ($1, $2, $3, $4, $5, $6, $7)
RETURNING id, name, name_i18n, group_id, measurement, picture_url, brand_id, created_at, updated_at, deleted_at;

-- GetIngredientByID retrieves an ingredient by ID
-- name: GetIngredientByID :one
SELECT id, name, name_i18n, group_id, measurement, picture_url, brand_id, created_at, updated_at, deleted_at
FROM ingredients
WHERE id = $1 AND deleted_at = 0;

-- GetAllIngredients retrieves all ingredients with pagination
-- name: GetAllIngredients :many
SELECT id, name, name_i18n, group_id, measurement, picture_url, brand_id, created_at, updated_at, deleted_at
FROM ingredients
WHERE deleted_at = 0
ORDER BY created_at DESC
LIMIT $1 OFFSET $2;

-- GetIngredientsByGroupID retrieves ingredients by group ID
-- name: GetIngredientsByGroupID :many
SELECT id, name, name_i18n, group_id, measurement, picture_url, brand_id, created_at, updated_at, deleted_at
FROM ingredients
WHERE group_id = $1 AND deleted_at = 0
ORDER BY created_at DESC
LIMIT $2 OFFSET $3;

-- UpdateIngredient updates an ingredient
-- name: UpdateIngredient :one
UPDATE ingredients
SET name = COALESCE($2, name),
    name_i18n = COALESCE($3, name_i18n),
    group_id = COALESCE($4, group_id),
    measurement = COALESCE($5, measurement),
    picture_url = COALESCE($6, picture_url),
    brand_id = COALESCE($7, brand_id),
    updated_at = NOW()
WHERE id = $1 AND deleted_at = 0
RETURNING id, name, name_i18n, group_id, measurement, picture_url, brand_id, created_at, updated_at, deleted_at;

-- DeleteIngredient soft deletes an ingredient
-- name: DeleteIngredient :exec
UPDATE ingredients
SET deleted_at = EXTRACT(EPOCH FROM NOW())::BIGINT
WHERE id = $1 AND deleted_at = 0;

-- RestoreIngredient restores a deleted ingredient
-- name: RestoreIngredient :exec
UPDATE ingredients
SET deleted_at = 0
WHERE id = $1 AND deleted_at != 0;

-- SearchIngredients searches ingredients by name
-- name: SearchIngredients :many
SELECT id, name, name_i18n, group_id, measurement, picture_url, brand_id, created_at, updated_at, deleted_at
FROM ingredients
WHERE deleted_at = 0 AND name ILIKE '%' || $1 || '%'
ORDER BY created_at DESC
LIMIT $2 OFFSET $3;

-- CountIngredients counts total ingredients
-- name: CountIngredients :one
SELECT COUNT(*) FROM ingredients WHERE deleted_at = 0;


-- CreateIngredientStock creates a new ingredient stock entry
-- name: CreateIngredientStock :one
INSERT INTO ingredient_stock (id, ingredient_id, quantity, branch_id)
VALUES ($1, $2, $3, $4)
RETURNING id, ingredient_id, quantity, branch_id, created_at, updated_at, deleted_at;

-- GetIngredientStockByID retrieves ingredient stock by ID
-- name: GetIngredientStockByID :one
SELECT id, ingredient_id, quantity, branch_id, created_at, updated_at, deleted_at
FROM ingredient_stock
WHERE id = $1 AND deleted_at = 0;

-- GetStockByIngredientAndBranch retrieves stock for a specific ingredient and branch
-- name: GetStockByIngredientAndBranch :one
SELECT id, ingredient_id, quantity, branch_id, created_at, updated_at, deleted_at
FROM ingredient_stock
WHERE ingredient_id = $1 AND branch_id = $2 AND deleted_at = 0;

-- GetAllIngredientStock retrieves all ingredient stock entries with pagination
-- name: GetAllIngredientStock :many
SELECT id, ingredient_id, quantity, branch_id, created_at, updated_at, deleted_at
FROM ingredient_stock
WHERE deleted_at = 0
ORDER BY created_at DESC
LIMIT $1 OFFSET $2;

-- GetStockByBranchID retrieves all stock for a branch
-- name: GetStockByBranchID :many
SELECT id, ingredient_id, quantity, branch_id, created_at, updated_at, deleted_at
FROM ingredient_stock
WHERE branch_id = $1 AND deleted_at = 0
ORDER BY created_at DESC
LIMIT $2 OFFSET $3;

-- GetStockByIngredientID retrieves all stock for an ingredient
-- name: GetStockByIngredientID :many
SELECT id, ingredient_id, quantity, branch_id, created_at, updated_at, deleted_at
FROM ingredient_stock
WHERE ingredient_id = $1 AND deleted_at = 0
ORDER BY created_at DESC
LIMIT $2 OFFSET $3;

-- UpdateIngredientStock updates ingredient stock quantity
-- name: UpdateIngredientStock :one
UPDATE ingredient_stock
SET quantity = COALESCE($2, quantity),
    updated_at = NOW()
WHERE id = $1 AND deleted_at = 0
RETURNING id, ingredient_id, quantity, branch_id, created_at, updated_at, deleted_at;

-- AddToIngredientStock increases ingredient stock quantity
-- name: AddToIngredientStock :one
UPDATE ingredient_stock
SET quantity = quantity + $2,
    updated_at = NOW()
WHERE id = $1 AND deleted_at = 0
RETURNING id, ingredient_id, quantity, branch_id, created_at, updated_at, deleted_at;

-- RemoveFromIngredientStock decreases ingredient stock quantity
-- name: RemoveFromIngredientStock :one
UPDATE ingredient_stock
SET quantity = CASE 
    WHEN quantity - $2 < 0 THEN 0 
    ELSE quantity - $2 
END,
    updated_at = NOW()
WHERE id = $1 AND deleted_at = 0
RETURNING id, ingredient_id, quantity, branch_id, created_at, updated_at, deleted_at;

-- DeleteIngredientStock soft deletes ingredient stock
-- name: DeleteIngredientStock :exec
UPDATE ingredient_stock
SET deleted_at = EXTRACT(EPOCH FROM NOW())::BIGINT
WHERE id = $1 AND deleted_at = 0;

-- RestoreIngredientStock restores deleted ingredient stock
-- name: RestoreIngredientStock :exec
UPDATE ingredient_stock
SET deleted_at = 0
WHERE id = $1 AND deleted_at != 0;

-- CountIngredientStock counts total ingredient stock entries
-- name: CountIngredientStock :one
SELECT COUNT(*) FROM ingredient_stock WHERE deleted_at = 0;
