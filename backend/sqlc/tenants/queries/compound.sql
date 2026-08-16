-- name: CreateCompound :one
INSERT INTO compounds (id, name, name_i18n, description, description_i18n, quantity, picture_url, color_code, measurement, price, branch_id, ingredient_group_id)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NULLIF(current_setting('app.branch_id', true), '')::uuid, $11)
RETURNING compounds.id, compounds.name, compounds.name_i18n, compounds.description, compounds.description_i18n, compounds.quantity, compounds.picture_url, compounds.color_code, compounds.measurement, compounds.price, compounds.branch_id, compounds.ingredient_group_id, compounds.cost_price, compounds.profit, compounds.profit_margin, compounds.created_at, compounds.updated_at, compounds.deleted_at;

-- name: GetCompoundByID :one
SELECT compounds.id, compounds.name, compounds.name_i18n, compounds.description, compounds.description_i18n, compounds.quantity, compounds.picture_url, compounds.color_code, compounds.measurement, compounds.price, compounds.branch_id, compounds.ingredient_group_id, compounds.cost_price, compounds.profit, compounds.profit_margin, compounds.created_at, compounds.updated_at, compounds.deleted_at
FROM compounds
WHERE compounds.id = $1 AND deleted_at = 0
  AND compounds.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid;

-- name: GetAllCompounds :many
SELECT
    c.id,
    c.name,
    c.name_i18n,
    c.description,
    c.description_i18n,
    c.quantity,
    c.picture_url,
    c.color_code,
    c.measurement,
    c.price,
    c.branch_id,
    c.ingredient_group_id,
    c.cost_price,
    c.profit,
    c.profit_margin,
    c.created_at,
    c.updated_at,
    c.deleted_at
FROM compounds c
WHERE c.deleted_at = 0
  AND c.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
  AND (
        sqlc.arg('search')::text = ''
        OR COALESCE(c.name, '') ILIKE '%' || sqlc.arg('search')::text || '%'
        OR COALESCE(c.description, '') ILIKE '%' || sqlc.arg('search')::text || '%'
      )
ORDER BY
    CASE
        WHEN sqlc.arg('sort_by')::text = 'name' AND sqlc.arg('sort_order')::text = 'asc'
        THEN c.name
    END ASC,
    CASE
        WHEN sqlc.arg('sort_by')::text = 'name' AND sqlc.arg('sort_order')::text = 'desc'
        THEN c.name
    END DESC,
    CASE
        WHEN sqlc.arg('sort_by')::text = 'created_at' AND sqlc.arg('sort_order')::text = 'asc'
        THEN c.created_at
    END ASC,
    CASE
        WHEN sqlc.arg('sort_by')::text = 'created_at' AND sqlc.arg('sort_order')::text = 'desc'
        THEN c.created_at
    END DESC,
    c.created_at DESC
LIMIT sqlc.arg('limit')::int
OFFSET sqlc.arg('offset')::int;

-- name: UpdateCompound :one
UPDATE compounds
SET name = COALESCE($2, name),
    name_i18n = COALESCE($3, name_i18n),
    description = COALESCE($4, description),
    description_i18n = COALESCE($5, description_i18n),
    quantity = COALESCE($6, quantity),
    picture_url = COALESCE($7, picture_url),
    color_code = COALESCE($8, color_code),
    measurement = COALESCE($9, measurement),
    price = COALESCE($10, price),
    ingredient_group_id = COALESCE($11, ingredient_group_id),
    updated_at = NOW()
WHERE compounds.id = $1 AND deleted_at = 0
  AND compounds.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
RETURNING compounds.id, compounds.name, compounds.name_i18n, compounds.description, compounds.description_i18n, compounds.quantity, compounds.picture_url, compounds.color_code, compounds.measurement, compounds.price, compounds.branch_id, compounds.ingredient_group_id, compounds.cost_price, compounds.profit, compounds.profit_margin, compounds.created_at, compounds.updated_at, compounds.deleted_at;

-- name: UpdateCompoundPrice :one
UPDATE compounds
SET price = $2,
    updated_at = NOW()
WHERE compounds.id = $1 AND deleted_at = 0
  AND compounds.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
RETURNING compounds.id, compounds.name, compounds.name_i18n, compounds.description, compounds.description_i18n, compounds.quantity, compounds.picture_url, compounds.color_code, compounds.measurement, compounds.price, compounds.branch_id, compounds.ingredient_group_id, compounds.cost_price, compounds.profit, compounds.profit_margin, compounds.created_at, compounds.updated_at, compounds.deleted_at;

-- name: UpdateCompoundCostFields :one
UPDATE compounds
SET cost_price = $2,
    profit = $3,
    profit_margin = $4,
    updated_at = NOW()
WHERE compounds.id = $1 AND deleted_at = 0
  AND compounds.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
RETURNING compounds.id, compounds.name, compounds.name_i18n, compounds.description, compounds.description_i18n, compounds.quantity, compounds.picture_url, compounds.color_code, compounds.measurement, compounds.price, compounds.branch_id, compounds.ingredient_group_id, compounds.cost_price, compounds.profit, compounds.profit_margin, compounds.created_at, compounds.updated_at, compounds.deleted_at;

-- name: DeleteCompound :exec
UPDATE compounds
SET deleted_at = EXTRACT(EPOCH FROM NOW())::BIGINT
WHERE compounds.id = $1 AND deleted_at = 0
  AND compounds.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid;

-- name: RestoreCompound :exec
UPDATE compounds
SET deleted_at = 0
WHERE compounds.id = $1 AND deleted_at != 0
  AND compounds.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid;


-- name: CountCompounds :one
SELECT COUNT(*)
FROM compounds c
WHERE c.deleted_at = 0
  AND c.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
  AND (
        sqlc.arg('search')::text = ''
        OR COALESCE(c.name, '') ILIKE '%' || sqlc.arg('search')::text || '%'
        OR COALESCE(c.description, '') ILIKE '%' || sqlc.arg('search')::text || '%'
      );

-- name: GetCompoundWithDepartment :one
SELECT
    c.id,
    c.name,
    c.name_i18n,
    c.description,
    c.description_i18n,
    c.quantity,
    c.picture_url,
    c.measurement,
    c.price,
    c.branch_id,
    c.ingredient_group_id,
    c.cost_price,
    c.profit,
    c.profit_margin,
    c.created_at,
    c.updated_at
FROM compounds c
WHERE c.id = $1 AND c.deleted_at = 0
  AND c.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid;




-- name: GetCompoundByIDWithLanguage :one
SELECT
    c.id,
    COALESCE(CASE
        WHEN $2::text = 'uz' THEN tn.uz
        WHEN $2::text = 'ru' THEN tn.ru
        WHEN $2::text = 'en' THEN tn.en
        ELSE c.name
    END, c.name) as name,
    c.name_i18n,
    COALESCE(CASE
        WHEN $2::text = 'uz' THEN td.uz
        WHEN $2::text = 'ru' THEN td.ru
        WHEN $2::text = 'en' THEN td.en
        ELSE c.description
    END, c.description) as description,
    c.description_i18n,
    c.quantity,
    c.picture_url,
    c.color_code,
    c.measurement,
    c.price,
    c.branch_id,
    c.ingredient_group_id,
    c.cost_price,
    c.profit,
    c.profit_margin,
    c.created_at,
    c.updated_at,
    c.deleted_at
FROM compounds c
LEFT JOIN translations tn ON c.name_i18n = tn.id AND tn.deleted_at = 0
LEFT JOIN translations td ON c.description_i18n = td.id AND td.deleted_at = 0
WHERE c.id = $1 AND c.deleted_at = 0
  AND c.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid;

-- name: GetAllCompoundsWithLanguage :many
SELECT
    c.id,
    COALESCE(
        CASE
            WHEN sqlc.arg('lang')::text = 'uz' THEN tn.uz
            WHEN sqlc.arg('lang')::text = 'ru' THEN tn.ru
            WHEN sqlc.arg('lang')::text = 'en' THEN tn.en
            ELSE c.name
        END,
        c.name
    ) AS name,
    c.name_i18n,
    COALESCE(
        CASE
            WHEN sqlc.arg('lang')::text = 'uz' THEN td.uz
            WHEN sqlc.arg('lang')::text = 'ru' THEN td.ru
            WHEN sqlc.arg('lang')::text = 'en' THEN td.en
            ELSE c.description
        END,
        c.description
    ) AS description,
    c.description_i18n,
    c.quantity,
    c.picture_url,
    c.color_code,
    c.measurement,
    c.price,
    c.branch_id,
    c.ingredient_group_id,
    c.cost_price,
    c.profit,
    c.profit_margin,
    c.created_at,
    c.updated_at,
    c.deleted_at
FROM compounds c
LEFT JOIN translations tn ON c.name_i18n = tn.id AND tn.deleted_at = 0
LEFT JOIN translations td ON c.description_i18n = td.id AND td.deleted_at = 0
WHERE c.deleted_at = 0
  AND c.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
  AND (
        sqlc.arg('search')::text = ''
        OR COALESCE(c.name, '') ILIKE '%' || sqlc.arg('search')::text || '%'
        OR COALESCE(c.description, '') ILIKE '%' || sqlc.arg('search')::text || '%'
        OR COALESCE(tn.uz, '') ILIKE '%' || sqlc.arg('search')::text || '%'
        OR COALESCE(tn.ru, '') ILIKE '%' || sqlc.arg('search')::text || '%'
        OR COALESCE(tn.en, '') ILIKE '%' || sqlc.arg('search')::text || '%'
        OR COALESCE(td.uz, '') ILIKE '%' || sqlc.arg('search')::text || '%'
        OR COALESCE(td.ru, '') ILIKE '%' || sqlc.arg('search')::text || '%'
        OR COALESCE(td.en, '') ILIKE '%' || sqlc.arg('search')::text || '%'
      )
ORDER BY
    CASE
        WHEN sqlc.arg('sort_by')::text = 'name' AND sqlc.arg('sort_order')::text = 'asc'
        THEN COALESCE(
            CASE
                WHEN sqlc.arg('lang')::text = 'uz' THEN tn.uz
                WHEN sqlc.arg('lang')::text = 'ru' THEN tn.ru
                WHEN sqlc.arg('lang')::text = 'en' THEN tn.en
                ELSE c.name
            END,
            c.name
        )
    END ASC,
    CASE
        WHEN sqlc.arg('sort_by')::text = 'name' AND sqlc.arg('sort_order')::text = 'desc'
        THEN COALESCE(
            CASE
                WHEN sqlc.arg('lang')::text = 'uz' THEN tn.uz
                WHEN sqlc.arg('lang')::text = 'ru' THEN tn.ru
                WHEN sqlc.arg('lang')::text = 'en' THEN tn.en
                ELSE c.name
            END,
            c.name
        )
    END DESC,
    CASE
        WHEN sqlc.arg('sort_by')::text = 'created_at' AND sqlc.arg('sort_order')::text = 'asc'
        THEN c.created_at
    END ASC,
    CASE
        WHEN sqlc.arg('sort_by')::text = 'created_at' AND sqlc.arg('sort_order')::text = 'desc'
        THEN c.created_at
    END DESC,
    c.created_at DESC
LIMIT sqlc.arg('limit')::int
OFFSET sqlc.arg('offset')::int;

-- Compound details queries -----------------------------------------------------------

-- name: CreateCompoundDetail :one
INSERT INTO compounds_details (id, compound_id, ingredient_id, quantity)
SELECT $1, $2, $3, $4
WHERE (
    EXISTS (
      SELECT 1 FROM compounds c
      WHERE c.id = $2
        AND c.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
    )
    AND EXISTS (
      SELECT 1 FROM ingredients i
      WHERE i.id = $3
        AND i.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
    )
)
RETURNING compounds_details.id, compounds_details.compound_id, compounds_details.ingredient_id, compounds_details.quantity, compounds_details.created_at, compounds_details.updated_at, compounds_details.deleted_at;

-- name: GetCompoundDetailByID :one
SELECT compounds_details.id, compounds_details.compound_id, compounds_details.ingredient_id, compounds_details.quantity, compounds_details.created_at, compounds_details.updated_at, compounds_details.deleted_at
FROM compounds_details
WHERE compounds_details.id = $1 AND deleted_at = 0
  AND EXISTS (
    SELECT 1 FROM compounds c
    WHERE c.id = compounds_details.compound_id
      AND c.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
  );

-- name: GetAllCompoundDetails :many
SELECT compounds_details.id, compounds_details.compound_id, compounds_details.ingredient_id, compounds_details.quantity, compounds_details.created_at, compounds_details.updated_at, compounds_details.deleted_at
FROM compounds_details
WHERE deleted_at = 0
  AND EXISTS (
    SELECT 1 FROM compounds c
    WHERE c.id = compounds_details.compound_id
      AND c.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
  )
ORDER BY created_at DESC
LIMIT $1 OFFSET $2;

-- name: GetCompoundDetailsByCompoundID :many
SELECT compounds_details.id, compounds_details.compound_id, compounds_details.ingredient_id, compounds_details.quantity, compounds_details.created_at, compounds_details.updated_at, compounds_details.deleted_at
FROM compounds_details
WHERE compound_id = $1 AND deleted_at = 0
  AND EXISTS (
    SELECT 1 FROM compounds c
    WHERE c.id = $1
      AND c.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
  )
ORDER BY created_at DESC;

-- name: GetCompoundDetailsByIngredientID :many
SELECT compounds_details.id, compounds_details.compound_id, compounds_details.ingredient_id, compounds_details.quantity, compounds_details.created_at, compounds_details.updated_at, compounds_details.deleted_at
FROM compounds_details
WHERE ingredient_id = $1 AND deleted_at = 0
  AND EXISTS (
    SELECT 1 FROM ingredients i
    WHERE i.id = $1
      AND i.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
  )
  AND EXISTS (
    SELECT 1 FROM compounds c
    WHERE c.id = compounds_details.compound_id
      AND c.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
  )
ORDER BY created_at DESC
LIMIT $2 OFFSET $3;

-- name: UpdateCompoundDetail :one
UPDATE compounds_details
SET compound_id = COALESCE($2, compound_id),
    ingredient_id = COALESCE($3, ingredient_id),
    quantity = COALESCE($4, quantity),
    updated_at = NOW()
WHERE compounds_details.id = $1 AND deleted_at = 0
  AND EXISTS (
    SELECT 1 FROM compounds c
    WHERE c.id = compounds_details.compound_id
      AND c.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
  )
  AND (
    $2 IS NULL OR EXISTS (
      SELECT 1 FROM compounds c2
      WHERE c2.id = $2
        AND c2.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
    )
  )
  AND (
    $3 IS NULL OR EXISTS (
      SELECT 1 FROM ingredients i
      WHERE i.id = $3
        AND i.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
    )
  )
RETURNING compounds_details.id, compounds_details.compound_id, compounds_details.ingredient_id, compounds_details.quantity, compounds_details.created_at, compounds_details.updated_at, compounds_details.deleted_at;

-- name: DeleteCompoundDetail :exec
UPDATE compounds_details
SET deleted_at = EXTRACT(EPOCH FROM NOW())::BIGINT
WHERE compounds_details.id = $1 AND deleted_at = 0
  AND EXISTS (
    SELECT 1 FROM compounds c
    WHERE c.id = compounds_details.compound_id
      AND c.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
  );

-- name: RestoreCompoundDetail :exec
UPDATE compounds_details
SET deleted_at = 0
WHERE compounds_details.id = $1 AND deleted_at != 0
  AND EXISTS (
    SELECT 1 FROM compounds c
    WHERE c.id = compounds_details.compound_id
      AND c.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
  );

-- name: DeleteCompoundDetailsByCompoundID :exec
UPDATE compounds_details
SET deleted_at = EXTRACT(EPOCH FROM NOW())::BIGINT
WHERE compound_id = $1 AND deleted_at = 0
  AND EXISTS (
    SELECT 1 FROM compounds c
    WHERE c.id = $1
      AND c.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
  );

-- name: CountCompoundDetails :one
SELECT COUNT(*) FROM compounds_details
WHERE deleted_at = 0
  AND EXISTS (
    SELECT 1 FROM compounds c
    WHERE c.id = compounds_details.compound_id
      AND c.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
  );

-- name: CountCompoundDetailsByCompound :one
SELECT COUNT(*) FROM compounds_details
WHERE compound_id = $1 AND deleted_at = 0
  AND EXISTS (
    SELECT 1 FROM compounds c
    WHERE c.id = $1
      AND c.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
  );

-- name: GetCompoundDetailWithIngredient :one
SELECT
    cd.id,
    cd.compound_id,
    cd.ingredient_id,
    cd.quantity,
    cd.created_at,
    cd.updated_at,
    i.name as ingredient_name,
    i.measurement as ingredient_measurement
FROM compounds_details cd
LEFT JOIN ingredients i ON cd.ingredient_id = i.id AND i.deleted_at = 0
WHERE cd.id = $1 AND cd.deleted_at = 0
  AND EXISTS (
    SELECT 1 FROM compounds c
    WHERE c.id = cd.compound_id
      AND c.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
  );

-- name: GetCompoundDetailsWithIngredients :many
SELECT
    cd.id,
    cd.compound_id,
    cd.ingredient_id,
    cd.quantity,
    cd.created_at,
    cd.updated_at,
    i.name as ingredient_name,
    i.measurement as ingredient_measurement,
    i.picture_url as ingredient_picture
FROM compounds_details cd
LEFT JOIN ingredients i ON cd.ingredient_id = i.id AND i.deleted_at = 0
WHERE cd.compound_id = $1 AND cd.deleted_at = 0
  AND EXISTS (
    SELECT 1 FROM compounds c
    WHERE c.id = $1
      AND c.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
  )
ORDER BY cd.created_at DESC;


--    compound stock queries ----------------------------------------------------

-- name: CreateCompoundStock :one
INSERT INTO compound_stock (id, compound_id, quantity, branch_id)
VALUES ($1, $2, $3, $4)
RETURNING id, compound_id, quantity, branch_id, created_at, updated_at, deleted_at;

-- name: GetCompoundStockByID :one
SELECT id, compound_id, quantity, branch_id, created_at, updated_at, deleted_at
FROM compound_stock
WHERE id = $1 AND deleted_at = 0
  AND branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid;

-- name: GetStockByCompoundAndBranch :one
SELECT id, compound_id, quantity, branch_id, created_at, updated_at, deleted_at
FROM compound_stock
WHERE compound_id = $1 AND branch_id = $2 AND deleted_at = 0
  AND branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid;

-- name: GetAllCompoundStock :many
SELECT id, compound_id, quantity, branch_id, created_at, updated_at, deleted_at
FROM compound_stock
WHERE deleted_at = 0
  AND branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
ORDER BY created_at DESC
LIMIT $1 OFFSET $2;

-- name: GetCompoundStockByBranchID :many
SELECT id, compound_id, quantity, branch_id, created_at, updated_at, deleted_at
FROM compound_stock
WHERE branch_id = $1 AND deleted_at = 0
  AND branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
ORDER BY created_at DESC
LIMIT $2 OFFSET $3;

-- name: GetCompoundStockByCompoundID :many
SELECT id, compound_id, quantity, branch_id, created_at, updated_at, deleted_at
FROM compound_stock
WHERE compound_id = $1 AND deleted_at = 0
  AND branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
ORDER BY created_at DESC
LIMIT $2 OFFSET $3;

-- name: UpdateCompoundStock :one
UPDATE compound_stock
SET quantity = COALESCE($2, quantity),
    updated_at = NOW()
WHERE id = $1 AND deleted_at = 0
  AND branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
RETURNING id, compound_id, quantity, branch_id, created_at, updated_at, deleted_at;

-- name: AddToCompoundStock :one
UPDATE compound_stock
SET quantity = quantity + $2,
    updated_at = NOW()
WHERE id = $1 AND deleted_at = 0
  AND branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
RETURNING id, compound_id, quantity, branch_id, created_at, updated_at, deleted_at;

-- name: RemoveFromCompoundStock :one
UPDATE compound_stock
SET quantity = CASE
    WHEN quantity - $2 < 0 THEN 0
    ELSE quantity - $2
  END,
    updated_at = NOW()
WHERE id = $1 AND deleted_at = 0
  AND branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
RETURNING id, compound_id, quantity, branch_id, created_at, updated_at, deleted_at;

-- name: DeleteCompoundStock :exec
UPDATE compound_stock
SET deleted_at = EXTRACT(EPOCH FROM NOW())::BIGINT
WHERE id = $1 AND deleted_at = 0
  AND branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid;

-- name: RestoreCompoundStock :exec
UPDATE compound_stock
SET deleted_at = 0
WHERE id = $1 AND deleted_at != 0
  AND branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid;

-- name: CountCompoundStock :one
SELECT COUNT(*) FROM compound_stock WHERE deleted_at = 0
  AND branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid;

-- name: CountCompoundStockByBranch :one
SELECT COUNT(*) FROM compound_stock WHERE branch_id = $1 AND deleted_at = 0
  AND branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid;

-- name: CountCompoundStockByCompound :one
SELECT COUNT(*) FROM compound_stock WHERE compound_id = $1 AND deleted_at = 0
  AND branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid;
