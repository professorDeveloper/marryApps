-- name: CreateGood :one
INSERT INTO goods (id, name, description, name_i18n, description_i18n, category_id, department_id, picture_url, color_code, price, cook_time)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
RETURNING id, name, description, name_i18n, description_i18n, category_id, department_id, picture_url, color_code, price, cook_time, cost_price, profit, profit_margin, created_at, updated_at, deleted_at;

-- name: GetGoodByID :one
SELECT id, name, description, name_i18n, description_i18n, category_id, department_id, picture_url, color_code, price, cook_time, cost_price, profit, profit_margin, created_at, updated_at, deleted_at
FROM goods
WHERE id = $1 AND deleted_at = 0;

-- name: GetAllGoods :many
SELECT id, name, description, name_i18n, description_i18n, category_id, department_id, picture_url, color_code, price, cook_time, cost_price, profit, profit_margin, created_at, updated_at, deleted_at
FROM goods
WHERE deleted_at = 0
ORDER BY created_at DESC
LIMIT $1 OFFSET $2;

-- name: GetGoodsByCategoryID :many
SELECT id, name, description, name_i18n, description_i18n, category_id, department_id, picture_url, color_code, price, cook_time, cost_price, profit, profit_margin, created_at, updated_at, deleted_at
FROM goods
WHERE category_id = $1 AND deleted_at = 0
ORDER BY name ASC
LIMIT $2 OFFSET $3;

-- name: GetGoodsByDepartmentID :many
SELECT id, name, description, name_i18n, description_i18n, category_id, department_id, picture_url, color_code, price, cook_time, cost_price, profit, profit_margin, created_at, updated_at, deleted_at
FROM goods
WHERE department_id = $1 AND deleted_at = 0
ORDER BY name ASC
LIMIT $2 OFFSET $3;

-- name: GetGoodsByPriceRange :many
SELECT id, name, description, name_i18n, description_i18n, category_id, department_id, picture_url, color_code, price, cook_time, cost_price, profit, profit_margin, created_at, updated_at, deleted_at
FROM goods
WHERE price >= $1 AND price <= $2 AND deleted_at = 0
ORDER BY price ASC
LIMIT $3 OFFSET $4;

-- name: UpdateGood :one
UPDATE goods
SET name = COALESCE($2, name),
    description = COALESCE($3, description),
    name_i18n = COALESCE($4, name_i18n),
    description_i18n = COALESCE($5, description_i18n),
    category_id = COALESCE($6, category_id),
    department_id = COALESCE($7, department_id),
    picture_url = COALESCE($8, picture_url),
    color_code = COALESCE($9, color_code),
    price = COALESCE($10, price),
    cook_time = COALESCE($11, cook_time),
    updated_at = NOW()
WHERE id = $1 AND deleted_at = 0
RETURNING id, name, description, name_i18n, description_i18n, category_id, department_id, picture_url, color_code, price, cook_time, cost_price, profit, profit_margin, created_at, updated_at, deleted_at;

-- name: UpdateGoodPrice :one
UPDATE goods
SET price = $2,
    updated_at = NOW()
WHERE id = $1 AND deleted_at = 0
RETURNING id, name, description, name_i18n, description_i18n, category_id, department_id, picture_url, color_code, price, cook_time, cost_price, profit, profit_margin, created_at, updated_at, deleted_at;

-- name: UpdateGoodCostFields :one
UPDATE goods
SET cost_price = $2,
    profit = $3,
    profit_margin = $4,
    updated_at = NOW()
WHERE id = $1 AND deleted_at = 0
RETURNING id, name, description, name_i18n, description_i18n, category_id, department_id, picture_url, color_code, price, cook_time, cost_price, profit, profit_margin, created_at, updated_at, deleted_at;

-- name: DeleteGood :exec
UPDATE goods
SET deleted_at = EXTRACT(EPOCH FROM NOW())::BIGINT
WHERE id = $1 AND deleted_at = 0;

-- name: RestoreGood :exec
UPDATE goods
SET deleted_at = 0
WHERE id = $1 AND deleted_at != 0;

-- name: SearchGoods :many
SELECT id, name, description, name_i18n, description_i18n, category_id, department_id, picture_url, price, cook_time, cost_price, profit, profit_margin, created_at, updated_at, deleted_at
FROM goods
WHERE deleted_at = 0 
AND (name ILIKE '%' || $1 || '%' OR description ILIKE '%' || $1 || '%')
ORDER BY name ASC
LIMIT $2 OFFSET $3;

-- name: CountGoods :one
SELECT COUNT(*) FROM goods WHERE deleted_at = 0;

-- name: CountGoodsByCategory :one
SELECT COUNT(*) FROM goods WHERE category_id = $1 AND deleted_at = 0;

-- name: CountGoodsByDepartment :one
SELECT COUNT(*) FROM goods WHERE department_id = $1 AND deleted_at = 0;

-- name: GetGoodWithRelations :one
SELECT 
    g.id,
    g.name,
    g.description,
    g.name_i18n,
    g.description_i18n,
    g.picture_url,
    g.price,
    g.cook_time,
    g.cost_price,
    g.profit,
    g.profit_margin,
    g.created_at,
    g.updated_at,
    c.name as category_name,
    d.name as department_name
FROM goods g
LEFT JOIN categories c ON g.category_id = c.id AND c.deleted_at = 0
LEFT JOIN departments d ON g.department_id = d.id AND d.deleted_at = 0
WHERE g.id = $1 AND g.deleted_at = 0;

-- name: GetPopularGoods :many
SELECT 
    g.id,
    g.name,
    g.picture_url,
    g.price,
    g.cook_time,
    COUNT(oi.id) as order_count,
    SUM(oi.quantity) as total_ordered
FROM goods g
LEFT JOIN order_items oi ON g.id = oi.good_id AND oi.deleted_at = 0
WHERE g.deleted_at = 0
GROUP BY g.id, g.name, g.picture_url, g.price, g.cook_time
ORDER BY order_count DESC
LIMIT $1 OFFSET $2;



-- name: CreateGoodDetail :one
INSERT INTO goods_details (id, good_id, ingredient_id, compound_id, measurement, quantity)
VALUES ($1, $2, $3, $4, $5, $6)
RETURNING id, good_id, ingredient_id, compound_id, measurement, quantity, created_at, updated_at, deleted_at;

-- name: GetGoodDetailByID :one
SELECT id, good_id, ingredient_id, compound_id, measurement, quantity, created_at, updated_at, deleted_at
FROM goods_details
WHERE id = $1 AND deleted_at = 0;

-- name: GetAllGoodDetails :many
SELECT id, good_id, ingredient_id, compound_id, measurement, quantity, created_at, updated_at, deleted_at
FROM goods_details
WHERE deleted_at = 0
ORDER BY created_at DESC
LIMIT $1 OFFSET $2;

-- name: GetGoodDetailsByGoodID :many
SELECT id, good_id, ingredient_id, compound_id, measurement, quantity, created_at, updated_at, deleted_at
FROM goods_details
WHERE good_id = $1 AND deleted_at = 0
ORDER BY created_at ASC;

-- name: GetGoodDetailsByIngredientID :many
SELECT id, good_id, ingredient_id, compound_id, measurement, quantity, created_at, updated_at, deleted_at
FROM goods_details
WHERE ingredient_id = $1 AND deleted_at = 0
ORDER BY created_at DESC
LIMIT $2 OFFSET $3;

-- name: GetGoodDetailsByCompoundID :many
SELECT id, good_id, ingredient_id, compound_id, measurement, quantity, created_at, updated_at, deleted_at
FROM goods_details
WHERE compound_id = $1 AND deleted_at = 0
ORDER BY created_at DESC
LIMIT $2 OFFSET $3;

-- name: UpdateGoodDetail :one
UPDATE goods_details
SET good_id = COALESCE($2, good_id),
    ingredient_id = COALESCE($3, ingredient_id),
    compound_id = COALESCE($4, compound_id),
    measurement = COALESCE($5, measurement),
    quantity = COALESCE($6, quantity),
    updated_at = NOW()
WHERE id = $1 AND deleted_at = 0
RETURNING id, good_id, ingredient_id, compound_id, measurement, quantity, created_at, updated_at, deleted_at;

-- name: UpdateGoodDetailQuantity :one
UPDATE goods_details
SET quantity = $2,
    updated_at = NOW()
WHERE id = $1 AND deleted_at = 0
RETURNING id, good_id, ingredient_id, compound_id, measurement, quantity, created_at, updated_at, deleted_at;

-- name: DeleteGoodDetail :exec
UPDATE goods_details
SET deleted_at = EXTRACT(EPOCH FROM NOW())::BIGINT
WHERE id = $1 AND deleted_at = 0;

-- name: RestoreGoodDetail :exec
UPDATE goods_details
SET deleted_at = 0
WHERE id = $1 AND deleted_at != 0;

-- name: DeleteGoodDetailsByGoodID :exec
UPDATE goods_details
SET deleted_at = EXTRACT(EPOCH FROM NOW())::BIGINT
WHERE good_id = $1 AND deleted_at = 0;

-- name: CountGoodDetails :one
SELECT COUNT(*) FROM goods_details WHERE deleted_at = 0;

-- name: CountGoodDetailsByGood :one
SELECT COUNT(*) FROM goods_details WHERE good_id = $1 AND deleted_at = 0;


-- -- ==================== RECIPE & INGREDIENT TRACKING ====================

-- -- name: GetGoodRecipeWithIngredients :many
-- SELECT 
--     gd.id,
--     gd.good_id,
--     gd.ingredient_id,
--     gd.compound_id,
--     gd.quantity,
--     gd.measurement,
--     CASE 
--         WHEN gd.ingredient_id IS NOT NULL THEN i.name
--         WHEN gd.compound_id IS NOT NULL THEN c.name
--     END as item_name,
--     CASE 
--         WHEN gd.ingredient_id IS NOT NULL THEN 'ingredient'
--         WHEN gd.compound_id IS NOT NULL THEN 'compound'
--     END as item_type,
--     i.picture_url as ingredient_picture,
--     c.price as compound_price
-- FROM goods_details gd
-- LEFT JOIN ingredients i ON gd.ingredient_id = i.id AND i.deleted_at = 0
-- LEFT JOIN compounds c ON gd.compound_id = c.id AND c.deleted_at = 0
-- WHERE gd.good_id = $1 AND gd.deleted_at = 0
-- ORDER BY gd.created_at ASC;

-- -- name: GetGoodAvailabilityByBranch :one
-- WITH recipe_items AS (
--     SELECT 
--         gd.id as detail_id,
--         gd.ingredient_id,
--         gd.compound_id,
--         gd.quantity as required_quantity,
--         CASE 
--             WHEN gd.ingredient_id IS NOT NULL THEN 
--                 COALESCE((SELECT quantity FROM ingredient_stock 
--                          WHERE ingredient_id = gd.ingredient_id 
--                          AND branch_id = $2 
--                          AND deleted_at = 0 
--                          LIMIT 1), 0)
--             WHEN gd.compound_id IS NOT NULL THEN 
--                 COALESCE((SELECT quantity FROM compound_stock 
--                          WHERE compound_id = gd.compound_id 
--                          AND branch_id = $2 
--                          AND deleted_at = 0 
--                          LIMIT 1), 0)
--         END as available_quantity
--     FROM goods_details gd
--     WHERE gd.good_id = $1 AND gd.deleted_at = 0
-- )
-- SELECT 
--     COUNT(*) as total_items,
--     SUM(CASE WHEN available_quantity >= required_quantity THEN 1 ELSE 0 END) as available_items,
--     MIN(CASE WHEN required_quantity > 0 THEN available_quantity / required_quantity ELSE 0 END) as max_servings,
--     CASE 
--         WHEN COUNT(*) = SUM(CASE WHEN available_quantity >= required_quantity THEN 1 ELSE 0 END) 
--         THEN true 
--         ELSE false 
--     END as is_available
-- FROM recipe_items;

-- -- name: GetGoodMissingIngredients :many
-- SELECT 
--     gd.id,
--     gd.good_id,
--     gd.ingredient_id,
--     gd.compound_id,
--     gd.quantity as required_quantity,
--     gd.measurement,
--     CASE 
--         WHEN gd.ingredient_id IS NOT NULL THEN i.name
--         WHEN gd.compound_id IS NOT NULL THEN c.name
--     END as item_name,
--     CASE 
--         WHEN gd.ingredient_id IS NOT NULL THEN 
--             COALESCE((SELECT quantity FROM ingredient_stock 
--                      WHERE ingredient_id = gd.ingredient_id 
--                      AND branch_id = $2 
--                      AND deleted_at = 0 
--                      LIMIT 1), 0)
--         WHEN gd.compound_id IS NOT NULL THEN 
--             COALESCE((SELECT quantity FROM compound_stock 
--                      WHERE compound_id = gd.compound_id 
--                      AND branch_id = $2 
--                      AND deleted_at = 0 
--                      LIMIT 1), 0)
--     END as available_quantity,
--     CASE 
--         WHEN gd.ingredient_id IS NOT NULL THEN 
--             gd.quantity - COALESCE((SELECT quantity FROM ingredient_stock 
--                                    WHERE ingredient_id = gd.ingredient_id 
--                                    AND branch_id = $2 
--                                    AND deleted_at = 0 
--                                    LIMIT 1), 0)
--         WHEN gd.compound_id IS NOT NULL THEN 
--             gd.quantity - COALESCE((SELECT quantity FROM compound_stock 
--                                    WHERE compound_id = gd.compound_id 
--                                    AND branch_id = $2 
--                                    AND deleted_at = 0 
--                                    LIMIT 1), 0)
--     END as shortage
-- FROM goods_details gd
-- LEFT JOIN ingredients i ON gd.ingredient_id = i.id AND i.deleted_at = 0
-- LEFT JOIN compounds c ON gd.compound_id = c.id AND c.deleted_at = 0
-- WHERE gd.good_id = $1 
-- AND gd.deleted_at = 0
-- AND (
--     (gd.ingredient_id IS NOT NULL AND 
--      gd.quantity > COALESCE((SELECT quantity FROM ingredient_stock 
--                             WHERE ingredient_id = gd.ingredient_id 
--                             AND branch_id = $2 
--                             AND deleted_at = 0 
--                             LIMIT 1), 0))
--     OR
--     (gd.compound_id IS NOT NULL AND 
--      gd.quantity > COALESCE((SELECT quantity FROM compound_stock 
--                             WHERE compound_id = gd.compound_id 
--                             AND branch_id = $2 
--                             AND deleted_at = 0 
--                             LIMIT 1), 0))
-- )
-- ORDER BY shortage DESC;

-- -- name: GetAvailableGoodsByBranch :many
-- WITH good_availability AS (
--     SELECT 
--         g.id,
--         g.name,
--         g.description,
--         g.price,
--         g.cook_time,
--         g.category_id,
--         COUNT(gd.id) as recipe_item_count,
--         SUM(
--             CASE 
--                 WHEN gd.ingredient_id IS NOT NULL THEN 
--                     CASE WHEN COALESCE((SELECT quantity FROM ingredient_stock 
--                                        WHERE ingredient_id = gd.ingredient_id 
--                                        AND branch_id = $1 
--                                        AND deleted_at = 0 
--                                        LIMIT 1), 0) >= gd.quantity 
--                     THEN 1 ELSE 0 END
--                 WHEN gd.compound_id IS NOT NULL THEN 
--                     CASE WHEN COALESCE((SELECT quantity FROM compound_stock 
--                                        WHERE compound_id = gd.compound_id 
--                                        AND branch_id = $1 
--                                        AND deleted_at = 0 
--                                        LIMIT 1), 0) >= gd.quantity 
--                     THEN 1 ELSE 0 END
--             END
--         ) as available_item_count
--     FROM goods g
--     LEFT JOIN goods_details gd ON g.id = gd.good_id AND gd.deleted_at = 0
--     WHERE g.deleted_at = 0
--     GROUP BY g.id, g.name, g.description, g.price, g.cook_time, g.category_id
-- )
-- SELECT 
--     id,
--     name,
--     description,
--     price,
--     cook_time,
--     category_id,
--     recipe_item_count,
--     available_item_count
-- FROM good_availability
-- WHERE recipe_item_count = available_item_count OR recipe_item_count = 0
-- ORDER BY name ASC
-- LIMIT $2 OFFSET $3;

-- -- name: GetGoodCostAnalysis :one
-- SELECT 
--     g.id,
--     g.name,
--     g.price as selling_price,
--     SUM(
--         CASE 
--             WHEN gd.ingredient_id IS NOT NULL THEN 0
--             WHEN gd.compound_id IS NOT NULL THEN COALESCE(c.price, 0) * gd.quantity
--         END
--     ) as ingredient_cost,
--     g.price - SUM(
--         CASE 
--             WHEN gd.ingredient_id IS NOT NULL THEN 0
--             WHEN gd.compound_id IS NOT NULL THEN COALESCE(c.price, 0) * gd.quantity
--         END
--     ) as profit_margin,
--     (g.price - SUM(
--         CASE 
--             WHEN gd.ingredient_id IS NOT NULL THEN 0
--             WHEN gd.compound_id IS NOT NULL THEN COALESCE(c.price, 0) * gd.quantity
--         END
--     )) / NULLIF(g.price, 0) * 100 as profit_percentage
-- FROM goods g
-- LEFT JOIN goods_details gd ON g.id = gd.good_id AND gd.deleted_at = 0
-- LEFT JOIN compounds c ON gd.compound_id = c.id AND c.deleted_at = 0
-- WHERE g.id = $1 AND g.deleted_at = 0
-- GROUP BY g.id, g.name, g.price;

-- -- name: GetGoodsWithRecipeCount :many
-- SELECT 
--     g.id,
--     g.name,
--     g.description,
--     g.price,
--     g.cook_time,
--     g.category_id,
--     COUNT(gd.id) as ingredient_count
-- FROM goods g
-- LEFT JOIN goods_details gd ON g.id = gd.good_id AND gd.deleted_at = 0
-- WHERE g.deleted_at = 0
-- GROUP BY g.id, g.name, g.description, g.price, g.cook_time, g.category_id
-- ORDER BY g.name ASC
-- LIMIT $1 OFFSET $2;