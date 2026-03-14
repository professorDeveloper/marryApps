-- name: CreateGood :one
INSERT INTO goods (id, name, description, name_i18n, description_i18n, category_id, branch_id, picture_url, color_code, price, cook_time)
VALUES ($1, $2, $3, $4, $5, $6, NULLIF(current_setting('app.branch_id', true), '')::uuid, $7, $8, $9, $10)
RETURNING goods.id, goods.name, goods.description, goods.name_i18n, goods.description_i18n, goods.category_id, goods.branch_id, goods.picture_url, goods.color_code, goods.price, goods.cook_time, goods.cost_price, goods.profit, goods.profit_margin, goods.created_at, goods.updated_at, goods.deleted_at;

-- name: GetGoodByID :one
SELECT goods.id, goods.name, goods.description, goods.name_i18n, goods.description_i18n, goods.category_id, goods.branch_id, goods.picture_url, goods.color_code, goods.price, goods.cook_time, goods.cost_price, goods.profit, goods.profit_margin, goods.created_at, goods.updated_at, goods.deleted_at
FROM goods
WHERE goods.id = $1 AND deleted_at = 0
  AND goods.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid;

-- name: GetAllGoods :many
SELECT goods.id, goods.name, goods.description, goods.name_i18n, goods.description_i18n, goods.category_id, goods.branch_id, goods.picture_url, goods.color_code, goods.price, goods.cook_time, goods.cost_price, goods.profit, goods.profit_margin, goods.created_at, goods.updated_at, goods.deleted_at
FROM goods
WHERE deleted_at = 0
  AND goods.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
ORDER BY created_at DESC
LIMIT $1 OFFSET $2;

-- name: GetGoodsByCategoryID :many
SELECT goods.id, goods.name, goods.description, goods.name_i18n, goods.description_i18n, goods.category_id, goods.branch_id, goods.picture_url, goods.color_code, goods.price, goods.cook_time, goods.cost_price, goods.profit, goods.profit_margin, goods.created_at, goods.updated_at, goods.deleted_at
FROM goods
WHERE category_id = $1 AND deleted_at = 0
  AND goods.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
ORDER BY name ASC
LIMIT $2 OFFSET $3;

-- name: GetGoodsByPriceRange :many
SELECT goods.id, goods.name, goods.description, goods.name_i18n, goods.description_i18n, goods.category_id, goods.branch_id, goods.picture_url, goods.color_code, goods.price, goods.cook_time, goods.cost_price, goods.profit, goods.profit_margin, goods.created_at, goods.updated_at, goods.deleted_at
FROM goods
WHERE price >= $1 AND price <= $2 AND deleted_at = 0
  AND goods.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
ORDER BY price ASC
LIMIT $3 OFFSET $4;

-- name: UpdateGood :one
UPDATE goods
SET name = COALESCE($2, name),
    description = COALESCE($3, description),
    name_i18n = COALESCE($4, name_i18n),
    description_i18n = COALESCE($5, description_i18n),
    category_id = COALESCE($6, category_id),
    picture_url = COALESCE($7, picture_url),
    color_code = COALESCE($8, color_code),
    price = COALESCE($9, price),
    cook_time = COALESCE($10, cook_time),
    updated_at = NOW()
WHERE goods.id = $1 AND deleted_at = 0
  AND goods.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
RETURNING goods.id, goods.name, goods.description, goods.name_i18n, goods.description_i18n, goods.category_id, goods.branch_id, goods.picture_url, goods.color_code, goods.price, goods.cook_time, goods.cost_price, goods.profit, goods.profit_margin, goods.created_at, goods.updated_at, goods.deleted_at;

-- name: UpdateGoodPrice :one
UPDATE goods
SET price = $2,
    updated_at = NOW()
WHERE goods.id = $1 AND deleted_at = 0
  AND goods.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
RETURNING goods.id, goods.name, goods.description, goods.name_i18n, goods.description_i18n, goods.category_id, goods.branch_id, goods.picture_url, goods.color_code, goods.price, goods.cook_time, goods.cost_price, goods.profit, goods.profit_margin, goods.created_at, goods.updated_at, goods.deleted_at;

-- name: UpdateGoodCostFields :one
UPDATE goods
SET cost_price = $2,
    profit = $3,
    profit_margin = $4,
    updated_at = NOW()
WHERE goods.id = $1 AND deleted_at = 0
  AND goods.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
RETURNING goods.id, goods.name, goods.description, goods.name_i18n, goods.description_i18n, goods.category_id, goods.branch_id, goods.picture_url, goods.color_code, goods.price, goods.cook_time, goods.cost_price, goods.profit, goods.profit_margin, goods.created_at, goods.updated_at, goods.deleted_at;

-- name: DeleteGood :exec
UPDATE goods
SET deleted_at = EXTRACT(EPOCH FROM NOW())::BIGINT
WHERE goods.id = $1 AND deleted_at = 0
  AND goods.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid;

-- name: RestoreGood :exec
UPDATE goods
SET deleted_at = 0
WHERE goods.id = $1 AND deleted_at != 0
  AND goods.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid;

-- name: SearchGoods :many
SELECT goods.id, goods.name, goods.description, goods.name_i18n, goods.description_i18n, goods.category_id, goods.picture_url, goods.price, goods.cook_time, goods.cost_price, goods.profit, goods.profit_margin, goods.created_at, goods.updated_at, goods.deleted_at
FROM goods
WHERE deleted_at = 0
AND (name ILIKE '%' || $1 || '%' OR description ILIKE '%' || $1 || '%')
  AND goods.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
ORDER BY name ASC
LIMIT $2 OFFSET $3;

-- name: CountGoods :one
SELECT COUNT(*) FROM goods
WHERE deleted_at = 0
  AND goods.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid;

-- name: CountGoodsByCategory :one
SELECT COUNT(*) FROM goods
WHERE category_id = $1 AND deleted_at = 0
  AND goods.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid;

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
    c.name as category_name
FROM goods g
LEFT JOIN categories c ON g.category_id = c.id AND c.deleted_at = 0
WHERE g.id = $1 AND g.deleted_at = 0
  AND g.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid;

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
  AND g.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
GROUP BY g.id, g.name, g.picture_url, g.price, g.cook_time
ORDER BY order_count DESC
LIMIT $1 OFFSET $2;



-- name: CreateGoodDetail :one
INSERT INTO goods_details (id, good_id, ingredient_id, compound_id, measurement, quantity)
SELECT $1, $2, $3, $4, $5, $6
WHERE (
    EXISTS (
      SELECT 1 FROM goods g
      WHERE g.id = $2
        AND g.deleted_at = 0
        AND g.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
    )
    AND (
      $3 IS NULL OR EXISTS (
        SELECT 1 FROM ingredients i
        WHERE i.id = $3
          AND i.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
      )
    )
    AND (
      $4 IS NULL OR EXISTS (
        SELECT 1 FROM compounds c
        WHERE c.id = $4
          AND c.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
      )
    )
)
RETURNING goods_details.id, goods_details.good_id, goods_details.ingredient_id, goods_details.compound_id, goods_details.measurement, goods_details.quantity, goods_details.created_at, goods_details.updated_at, goods_details.deleted_at;

-- name: GetGoodDetailByID :one
SELECT goods_details.id, goods_details.good_id, goods_details.ingredient_id, goods_details.compound_id, goods_details.measurement, goods_details.quantity, goods_details.created_at, goods_details.updated_at, goods_details.deleted_at
FROM goods_details
WHERE goods_details.id = $1 AND deleted_at = 0
  AND EXISTS (
    SELECT 1 FROM goods g
    WHERE g.id = goods_details.good_id
      AND g.deleted_at = 0
      AND g.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
  );

-- name: GetAllGoodDetails :many
SELECT goods_details.id, goods_details.good_id, goods_details.ingredient_id, goods_details.compound_id, goods_details.measurement, goods_details.quantity, goods_details.created_at, goods_details.updated_at, goods_details.deleted_at
FROM goods_details
WHERE deleted_at = 0
  AND EXISTS (
    SELECT 1 FROM goods g
    WHERE g.id = goods_details.good_id
      AND g.deleted_at = 0
      AND g.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
  )
ORDER BY created_at DESC
LIMIT $1 OFFSET $2;

-- name: GetGoodDetailsByGoodID :many
SELECT goods_details.id, goods_details.good_id, goods_details.ingredient_id, goods_details.compound_id, goods_details.measurement, goods_details.quantity, goods_details.created_at, goods_details.updated_at, goods_details.deleted_at
FROM goods_details
WHERE goods_details.good_id = $1 AND deleted_at = 0
  AND EXISTS (
    SELECT 1 FROM goods g
    WHERE g.id = $1
      AND g.deleted_at = 0
      AND g.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
  )
ORDER BY created_at ASC;

-- name: GetGoodDetailsByIngredientID :many
SELECT goods_details.id, goods_details.good_id, goods_details.ingredient_id, goods_details.compound_id, goods_details.measurement, goods_details.quantity, goods_details.created_at, goods_details.updated_at, goods_details.deleted_at
FROM goods_details
WHERE ingredient_id = $1 AND deleted_at = 0
  AND EXISTS (
    SELECT 1 FROM ingredients i
    WHERE i.id = $1
      AND i.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
  )
  AND EXISTS (
    SELECT 1 FROM goods g
    WHERE g.id = goods_details.good_id
      AND g.deleted_at = 0
      AND g.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
  )
ORDER BY created_at DESC
LIMIT $2 OFFSET $3;

-- name: GetGoodDetailsByCompoundID :many
SELECT goods_details.id, goods_details.good_id, goods_details.ingredient_id, goods_details.compound_id, goods_details.measurement, goods_details.quantity, goods_details.created_at, goods_details.updated_at, goods_details.deleted_at
FROM goods_details
WHERE compound_id = $1 AND deleted_at = 0
  AND EXISTS (
    SELECT 1 FROM compounds c
    WHERE c.id = $1
      AND c.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
  )
  AND EXISTS (
    SELECT 1 FROM goods g
    WHERE g.id = goods_details.good_id
      AND g.deleted_at = 0
      AND g.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
  )
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
WHERE goods_details.id = $1 AND deleted_at = 0
  AND EXISTS (
    SELECT 1 FROM goods g
    WHERE g.id = goods_details.good_id
      AND g.deleted_at = 0
      AND g.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
  )
  AND (
    $2 IS NULL OR EXISTS (
      SELECT 1 FROM goods g2
      WHERE g2.id = $2
        AND g2.deleted_at = 0
        AND g2.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
    )
  )
  AND (
    $3 IS NULL OR EXISTS (
      SELECT 1 FROM ingredients i
      WHERE i.id = $3
        AND i.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
    )
  )
  AND (
    $4 IS NULL OR EXISTS (
      SELECT 1 FROM compounds c
      WHERE c.id = $4
        AND c.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
    )
  )
RETURNING goods_details.id, goods_details.good_id, goods_details.ingredient_id, goods_details.compound_id, goods_details.measurement, goods_details.quantity, goods_details.created_at, goods_details.updated_at, goods_details.deleted_at;

-- name: UpdateGoodDetailQuantity :one
UPDATE goods_details
SET quantity = $2,
    updated_at = NOW()
WHERE goods_details.id = $1 AND deleted_at = 0
  AND EXISTS (
    SELECT 1 FROM goods g
    WHERE g.id = goods_details.good_id
      AND g.deleted_at = 0
      AND g.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
  )
RETURNING goods_details.id, goods_details.good_id, goods_details.ingredient_id, goods_details.compound_id, goods_details.measurement, goods_details.quantity, goods_details.created_at, goods_details.updated_at, goods_details.deleted_at;

-- name: DeleteGoodDetail :exec
UPDATE goods_details
SET deleted_at = EXTRACT(EPOCH FROM NOW())::BIGINT
WHERE goods_details.id = $1 AND deleted_at = 0
  AND EXISTS (
    SELECT 1 FROM goods g
    WHERE g.id = goods_details.good_id
      AND g.deleted_at = 0
      AND g.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
  );

-- name: RestoreGoodDetail :exec
UPDATE goods_details
SET deleted_at = 0
WHERE goods_details.id = $1 AND deleted_at != 0
  AND EXISTS (
    SELECT 1 FROM goods g
    WHERE g.id = goods_details.good_id
      AND g.deleted_at = 0
      AND g.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
  );

-- name: DeleteGoodDetailsByGoodID :exec
UPDATE goods_details
SET deleted_at = EXTRACT(EPOCH FROM NOW())::BIGINT
WHERE goods_details.good_id = $1 AND deleted_at = 0
  AND EXISTS (
    SELECT 1 FROM goods g
    WHERE g.id = $1
      AND g.deleted_at = 0
      AND g.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
  );

-- name: CountGoodDetails :one
SELECT COUNT(*) FROM goods_details
WHERE deleted_at = 0
  AND EXISTS (
    SELECT 1 FROM goods g
    WHERE g.id = goods_details.good_id
      AND g.deleted_at = 0
      AND g.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
  );

-- name: CountGoodDetailsByGood :one
SELECT COUNT(*) FROM goods_details
WHERE goods_details.good_id = $1 AND deleted_at = 0
  AND EXISTS (
    SELECT 1 FROM goods g
    WHERE g.id = $1
      AND g.deleted_at = 0
      AND g.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
  );

-- name: GetGoodByIDWithLanguage :one
SELECT
    g.id,
    COALESCE(CASE
        WHEN $2::text = 'uz' THEN tn.uz
        WHEN $2::text = 'ru' THEN tn.ru
        WHEN $2::text = 'en' THEN tn.en
        ELSE g.name
    END, g.name) as name,
    COALESCE(CASE
        WHEN $2::text = 'uz' THEN td.uz
        WHEN $2::text = 'ru' THEN td.ru
        WHEN $2::text = 'en' THEN td.en
        ELSE g.description
    END, g.description) as description,
    g.name_i18n,
    g.description_i18n,
    g.category_id,
    g.branch_id,
    g.picture_url,
    g.color_code,
    g.price,
    g.cook_time,
    g.cost_price,
    g.profit,
    g.profit_margin,
    g.created_at,
    g.updated_at,
    g.deleted_at
FROM goods g
LEFT JOIN translations tn ON g.name_i18n = tn.id AND tn.deleted_at = 0
LEFT JOIN translations td ON g.description_i18n = td.id AND td.deleted_at = 0
WHERE g.id = $1 AND g.deleted_at = 0
  AND g.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid;

-- name: GetAllGoodsWithLanguage :many
SELECT
    g.id,
    COALESCE(CASE
        WHEN $1::text = 'uz' THEN tn.uz
        WHEN $1::text = 'ru' THEN tn.ru
        WHEN $1::text = 'en' THEN tn.en
        ELSE g.name
    END, g.name) as name,
    COALESCE(CASE
        WHEN $1::text = 'uz' THEN td.uz
        WHEN $1::text = 'ru' THEN td.ru
        WHEN $1::text = 'en' THEN td.en
        ELSE g.description
    END, g.description) as description,
    g.name_i18n,
    g.description_i18n,
    g.category_id,
    g.branch_id,
    g.picture_url,
    g.color_code,
    g.price,
    g.cook_time,
    g.cost_price,
    g.profit,
    g.profit_margin,
    g.created_at,
    g.updated_at,
    g.deleted_at
FROM goods g
LEFT JOIN translations tn ON g.name_i18n = tn.id AND tn.deleted_at = 0
LEFT JOIN translations td ON g.description_i18n = td.id AND td.deleted_at = 0
WHERE g.deleted_at = 0
  AND g.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
ORDER BY g.created_at DESC
LIMIT $2 OFFSET $3;


-- ==================== FILTERED GOODS ====================

-- name: GetGoodsFiltered :many
SELECT goods.id, goods.name, goods.description, goods.name_i18n, goods.description_i18n, goods.category_id, goods.branch_id, goods.picture_url, goods.color_code, goods.price, goods.cook_time, goods.cost_price, goods.profit, goods.profit_margin, goods.created_at, goods.updated_at, goods.deleted_at
FROM goods
WHERE goods.deleted_at = 0
  AND goods.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
  AND (($1::uuid = '00000000-0000-0000-0000-000000000000') OR goods.category_id = $1)
  AND ($2 = '' OR goods.name ILIKE '%' || $2 || '%')
ORDER BY goods.created_at DESC
LIMIT $3 OFFSET $4;

-- name: CountGoodsFiltered :one
SELECT COUNT(*)
FROM goods
WHERE goods.deleted_at = 0
  AND goods.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
  AND (($1::uuid = '00000000-0000-0000-0000-000000000000') OR goods.category_id = $1)
  AND ($2 = '' OR goods.name ILIKE '%' || $2 || '%');

-- name: GetGoodsFilteredWithLanguage :many
SELECT
    g.id,
    COALESCE(CASE
        WHEN $1::text = 'uz' THEN tn.uz
        WHEN $1::text = 'ru' THEN tn.ru
        WHEN $1::text = 'en' THEN tn.en
        ELSE g.name
    END, g.name) as name,
    COALESCE(CASE
        WHEN $1::text = 'uz' THEN td.uz
        WHEN $1::text = 'ru' THEN td.ru
        WHEN $1::text = 'en' THEN td.en
        ELSE g.description
    END, g.description) as description,
    g.name_i18n,
    g.description_i18n,
    g.category_id,
    g.branch_id,
    g.picture_url,
    g.color_code,
    g.price,
    g.cook_time,
    g.cost_price,
    g.profit,
    g.profit_margin,
    g.created_at,
    g.updated_at,
    g.deleted_at
FROM goods g
LEFT JOIN translations tn ON g.name_i18n = tn.id AND tn.deleted_at = 0
LEFT JOIN translations td ON g.description_i18n = td.id AND td.deleted_at = 0
WHERE g.deleted_at = 0
  AND g.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
  AND (($2::uuid = '00000000-0000-0000-0000-000000000000') OR g.category_id = $2)
  AND ($3 = '' OR g.name ILIKE '%' || $3 || '%')
ORDER BY g.created_at DESC
LIMIT $4 OFFSET $5;
