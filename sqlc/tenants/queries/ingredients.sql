-- ==================== INGREDIENT GROUPS QUERIES ====================

-- name: CreateIngredientGroup :one
INSERT INTO ingredient_groups (id, name, picture_url, name_i18n, color_code)
VALUES ($1, $2, $3, $4, $5)
RETURNING id, name, picture_url, name_i18n, color_code, created_at, updated_at, deleted_at;

-- name: GetIngredientGroupByID :one
SELECT id, name, picture_url, name_i18n, color_code, created_at, updated_at, deleted_at
FROM ingredient_groups
WHERE id = $1 AND deleted_at = 0;

-- name: GetAllIngredientGroups :many
SELECT id, name, picture_url, name_i18n, color_code, created_at, updated_at, deleted_at
FROM ingredient_groups
WHERE deleted_at = 0
ORDER BY created_at DESC
LIMIT $1 OFFSET $2;

-- UpdateIngredientGroup updates an ingredient group
-- name: UpdateIngredientGroup :one
UPDATE ingredient_groups
SET name = COALESCE($2, name),
    picture_url = COALESCE($3, picture_url),
    name_i18n = COALESCE($4, name_i18n),
    color_code = COALESCE($5, color_code),
    updated_at = NOW()
WHERE id = $1 AND deleted_at = 0
RETURNING id, name, picture_url, name_i18n, color_code, created_at, updated_at, deleted_at;

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
SELECT id, name, picture_url, name_i18n, color_code, created_at, updated_at, deleted_at
FROM ingredient_groups
WHERE deleted_at = 0 AND name ILIKE '%' || $1 || '%'
ORDER BY created_at DESC
LIMIT $2 OFFSET $3;

-- CountIngredientGroups counts total ingredient groups
-- name: CountIngredientGroups :one
SELECT COUNT(*) FROM ingredient_groups WHERE deleted_at = 0;


-- CreateIngredient creates a new ingredient
-- name: CreateIngredient :one
INSERT INTO ingredients (id, name, name_i18n, group_id, measurement, picture_url, color_code, brand_id)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
RETURNING id, name, name_i18n, group_id, measurement, picture_url, color_code, brand_id, price_per_unit, created_at, updated_at, deleted_at;

-- GetIngredientByID retrieves an ingredient by ID
-- name: GetIngredientByID :one
SELECT id, name, name_i18n, group_id, measurement, picture_url, color_code, brand_id, price_per_unit, created_at, updated_at, deleted_at
FROM ingredients
WHERE id = $1 AND deleted_at = 0;

-- GetAllIngredients retrieves all ingredients with pagination
-- name: GetAllIngredients :many
SELECT id, name, name_i18n, group_id, measurement, picture_url, color_code, brand_id, price_per_unit, created_at, updated_at, deleted_at
FROM ingredients
WHERE deleted_at = 0
ORDER BY created_at DESC
LIMIT $1 OFFSET $2;

-- GetIngredientsByGroupID retrieves ingredients by group ID
-- name: GetIngredientsByGroupID :many
SELECT id, name, name_i18n, group_id, measurement, picture_url, color_code, brand_id, price_per_unit, created_at, updated_at, deleted_at
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
    color_code = COALESCE($7, color_code),
    brand_id = COALESCE($8, brand_id),
    updated_at = NOW()
WHERE id = $1 AND deleted_at = 0
RETURNING id, name, name_i18n, group_id, measurement, picture_url, color_code, brand_id, price_per_unit, created_at, updated_at, deleted_at;

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
SELECT id, name, name_i18n, group_id, measurement, picture_url, color_code, brand_id, price_per_unit, created_at, updated_at, deleted_at
FROM ingredients
WHERE deleted_at = 0 AND name ILIKE '%' || $1 || '%'
ORDER BY created_at DESC
LIMIT $2 OFFSET $3;

-- CountIngredients counts total ingredients
-- name: CountIngredients :one
SELECT COUNT(*) FROM ingredients WHERE deleted_at = 0;

-- UpdateIngredientPriceAndQuantity updates price_per_unit for an ingredient
-- name: UpdateIngredientPriceAndQuantity :one
UPDATE ingredients
SET price_per_unit = COALESCE($2, price_per_unit),
    updated_at = NOW()
WHERE id = $1 AND deleted_at = 0
RETURNING id, name, name_i18n, group_id, measurement, picture_url, color_code, brand_id, price_per_unit, created_at, updated_at, deleted_at;

-- AddIngredientQuantity adds/accumulates quantity to an ingredient (for invoice arrivals)
-- Also updates the price_per_unit to the latest price from invoice
-- name: AddIngredientQuantity :one
UPDATE ingredients
SET price_per_unit = COALESCE($2, price_per_unit),
    updated_at = NOW()
WHERE id = $1 AND deleted_at = 0
RETURNING id, name, name_i18n, group_id, measurement, picture_url, color_code, brand_id, price_per_unit, created_at, updated_at, deleted_at;

-- GetIngredientByIDWithPriceQuantity retrieves ingredient with price and quantity by ID
-- name: GetIngredientByIDWithPriceQuantity :one
SELECT id, name, name_i18n, group_id, measurement, picture_url, color_code, brand_id, price_per_unit, created_at, updated_at, deleted_at
FROM ingredients
WHERE id = $1 AND deleted_at = 0;


-- name: CreateIngredientStock :one
INSERT INTO ingredient_stock (id, ingredient_id, quantity, branch_id, storage_id)
VALUES ($1, $2, $3, $4, $5)
RETURNING id, ingredient_id, quantity, branch_id, storage_id, created_at, updated_at, deleted_at;

-- GetIngredientStockByID retrieves ingredient stock by ID
-- name: GetIngredientStockByID :one
SELECT id, ingredient_id, quantity, branch_id, storage_id, created_at, updated_at, deleted_at
FROM ingredient_stock
WHERE id = $1 AND deleted_at = 0;

-- GetStockByIngredientAndBranch retrieves stock for a specific ingredient and branch
-- name: GetStockByIngredientAndBranch :one
SELECT id, ingredient_id, quantity, branch_id, storage_id, created_at, updated_at, deleted_at
FROM ingredient_stock
WHERE ingredient_id = $1 AND branch_id = $2 AND deleted_at = 0;

-- GetStockByIngredientAndStorageForUpdate retrieves and locks stock row for an ingredient in a storage
-- name: GetStockByIngredientAndStorageForUpdate :one
SELECT id, ingredient_id, quantity, branch_id, storage_id, created_at, updated_at, deleted_at
FROM ingredient_stock
WHERE ingredient_id = $1 AND storage_id = $2 AND deleted_at = 0
FOR UPDATE;

-- EnsureIngredientStockByStorage ensures a stock row exists for (ingredient_id, storage_id)
-- name: EnsureIngredientStockByStorage :one
INSERT INTO ingredient_stock (id, ingredient_id, storage_id, quantity, deleted_at)
VALUES ($1, $2, $3, 0, 0)
ON CONFLICT (ingredient_id, storage_id)
DO UPDATE SET deleted_at = 0, updated_at = NOW()
RETURNING id;

-- GetAllIngredientStock retrieves all ingredient stock entries with pagination
-- name: GetAllIngredientStock :many
SELECT id, ingredient_id, quantity, branch_id, storage_id, created_at, updated_at, deleted_at
FROM ingredient_stock
WHERE deleted_at = 0
ORDER BY created_at DESC
LIMIT $1 OFFSET $2;

-- GetStockByBranchID retrieves all stock for a branch
-- name: GetStockByBranchID :many
SELECT id, ingredient_id, quantity, branch_id, storage_id, created_at, updated_at, deleted_at
FROM ingredient_stock
WHERE branch_id = $1 AND deleted_at = 0
ORDER BY created_at DESC
LIMIT $2 OFFSET $3;

-- GetStockByIngredientID retrieves all stock for an ingredient
-- name: GetStockByIngredientID :many
SELECT id, ingredient_id, quantity, branch_id, storage_id, created_at, updated_at, deleted_at
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
RETURNING id, ingredient_id, quantity, branch_id, storage_id, created_at, updated_at, deleted_at;

-- AddToIngredientStock increases ingredient stock quantity
-- name: AddToIngredientStock :one
UPDATE ingredient_stock
SET quantity = quantity + $2,
    updated_at = NOW()
WHERE id = $1 AND deleted_at = 0
RETURNING id, ingredient_id, quantity, branch_id, storage_id, created_at, updated_at, deleted_at;

-- RemoveFromIngredientStock decreases ingredient stock quantity
-- name: RemoveFromIngredientStock :one
UPDATE ingredient_stock
SET quantity = CASE 
    WHEN quantity - $2 < 0 THEN 0::numeric 
    ELSE quantity - $2 
END,
    updated_at = NOW()
WHERE id = $1 AND deleted_at = 0
RETURNING id, ingredient_id, quantity, branch_id, storage_id, created_at, updated_at, deleted_at;

-- UpsertAddIngredientStockByStorage increases stock for ingredient in a storage (used for invoice arrivals)
-- name: UpsertAddIngredientStockByStorage :one
INSERT INTO ingredient_stock (id, ingredient_id, storage_id, quantity, deleted_at)
VALUES ($1, $2, $3, $4, 0)
ON CONFLICT (ingredient_id, storage_id)
DO UPDATE SET
  quantity = ingredient_stock.quantity + EXCLUDED.quantity,
  updated_at = NOW(),
  deleted_at = 0
RETURNING id, ingredient_id, quantity, branch_id, storage_id, created_at, updated_at, deleted_at;

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

-- name: GetIngredientGroupByIDWithLanguage :one
SELECT 
    ig.id,
    COALESCE(CASE 
        WHEN $2::text = 'uz' THEN t.uz
        WHEN $2::text = 'ru' THEN t.ru
        WHEN $2::text = 'en' THEN t.en
        ELSE ig.name
    END, ig.name) as name,
    ig.picture_url,
    ig.name_i18n,
    ig.color_code,
    ig.created_at,
    ig.updated_at,
    ig.deleted_at
FROM ingredient_groups ig
LEFT JOIN translations t ON ig.name_i18n = t.id AND t.deleted_at = 0
WHERE ig.id = $1 AND ig.deleted_at = 0;

-- name: GetAllIngredientGroupsWithLanguage :many
SELECT 
    ig.id,
    COALESCE(CASE 
        WHEN $1::text = 'uz' THEN t.uz
        WHEN $1::text = 'ru' THEN t.ru
        WHEN $1::text = 'en' THEN t.en
        ELSE ig.name
    END, ig.name) as name,
    ig.picture_url,
    ig.name_i18n,
    ig.color_code,
    ig.created_at,
    ig.updated_at,
    ig.deleted_at
FROM ingredient_groups ig
LEFT JOIN translations t ON ig.name_i18n = t.id AND t.deleted_at = 0
WHERE ig.deleted_at = 0
ORDER BY ig.created_at DESC
LIMIT $2 OFFSET $3;

-- name: GetIngredientByIDWithLanguage :one
SELECT 
    i.id,
    COALESCE(CASE 
        WHEN $2::text = 'uz' THEN t.uz
        WHEN $2::text = 'ru' THEN t.ru
        WHEN $2::text = 'en' THEN t.en
        ELSE i.name
    END, i.name) as name,
    i.name_i18n,
    i.group_id,
    i.measurement,
    i.picture_url,
    i.color_code,
    i.brand_id,
    i.price_per_unit,
    i.created_at,
    i.updated_at,
    i.deleted_at
FROM ingredients i
LEFT JOIN translations t ON i.name_i18n = t.id AND t.deleted_at = 0
WHERE i.id = $1 AND i.deleted_at = 0;

-- name: GetAllIngredientsWithLanguage :many
SELECT 
    i.id,
    COALESCE(CASE 
        WHEN $1::text = 'uz' THEN t.uz
        WHEN $1::text = 'ru' THEN t.ru
        WHEN $1::text = 'en' THEN t.en
        ELSE i.name
    END, i.name) as name,
    i.name_i18n,
    i.group_id,
    i.measurement,
    i.picture_url,
    i.color_code,
    i.brand_id,
    i.price_per_unit,
    i.created_at,
    i.updated_at,
    i.deleted_at
FROM ingredients i
LEFT JOIN translations t ON i.name_i18n = t.id AND t.deleted_at = 0
WHERE i.deleted_at = 0
ORDER BY i.created_at DESC
LIMIT $2 OFFSET $3;

