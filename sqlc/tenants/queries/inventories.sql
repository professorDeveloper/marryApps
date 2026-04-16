-- ==================== INVENTORIES QUERIES ====================

-- name: CreateInventory :one
INSERT INTO inventories (id, date, storage_id, description, description_i18n, status)
VALUES ($1, $2, $3, $4, $5, $6)
RETURNING id, number, date, storage_id, description, description_i18n, status,
          surplus_amount, shortage_amount, remaining_amount,
          created_at, updated_at, deleted_at;

-- name: GetInventoryByID :one
SELECT id, number, date, storage_id, description, description_i18n, status,
       surplus_amount, shortage_amount, remaining_amount,
       created_at, updated_at, deleted_at
FROM inventories
WHERE inventories.id = $1 AND inventories.deleted_at = 0
  AND EXISTS (
    SELECT 1 FROM storages s
    WHERE s.id = inventories.storage_id
      AND s.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
  );

-- name: GetAllInventories :many
SELECT id, number, date, storage_id, description, description_i18n, status,
       surplus_amount, shortage_amount, remaining_amount,
       created_at, updated_at, deleted_at
FROM inventories
WHERE EXISTS (
    SELECT 1 FROM storages s
    WHERE s.id = inventories.storage_id
      AND s.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
  )
ORDER BY date DESC, number DESC
LIMIT $1 OFFSET $2;

-- name: GetInventoriesFiltered :many
WITH filtered AS (
    SELECT DISTINCT
        inv.id,
        inv.number,
        inv.date,
        inv.storage_id,
        inv.description,
        inv.description_i18n,
        inv.status,
        inv.surplus_amount,
        inv.shortage_amount,
        inv.remaining_amount,
        inv.created_at,
        inv.updated_at,
        inv.deleted_at
    FROM inventories inv
    LEFT JOIN inventory_items ii
      ON ii.inventory_id = inv.id
     AND ii.deleted_at = 0
    WHERE EXISTS (
        SELECT 1
        FROM storages s
        WHERE s.id = inv.storage_id
          AND s.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
    )
      AND (sqlc.narg('date_from')::date IS NULL OR inv.date >= sqlc.narg('date_from')::date)
      AND (sqlc.narg('date_to')::date IS NULL OR inv.date <= sqlc.narg('date_to')::date)
      AND (sqlc.narg('storage_id')::uuid IS NULL OR inv.storage_id = sqlc.narg('storage_id')::uuid)
      AND (sqlc.arg('status')::text = '' OR inv.status = sqlc.arg('status')::text)
      AND (sqlc.narg('ingredient_id')::uuid IS NULL OR ii.ingredient_id = sqlc.narg('ingredient_id')::uuid)
      AND (
            sqlc.arg('search')::text = ''
            OR COALESCE(inv.description, '') ILIKE '%' || sqlc.arg('search')::text || '%'
            OR CAST(inv.number AS TEXT) ILIKE '%' || sqlc.arg('search')::text || '%'
          )
)
SELECT
    id,
    number,
    date,
    storage_id,
    description,
    description_i18n,
    status,
    surplus_amount,
    shortage_amount,
    remaining_amount,
    created_at,
    updated_at,
    deleted_at
FROM filtered
ORDER BY
    CASE
        WHEN sqlc.arg('sort_by')::text = 'date' AND sqlc.arg('sort_order')::text = 'asc'
        THEN date
    END ASC,
    CASE
        WHEN sqlc.arg('sort_by')::text = 'date' AND sqlc.arg('sort_order')::text = 'desc'
        THEN date
    END DESC,
    CASE
        WHEN sqlc.arg('sort_by')::text = 'number' AND sqlc.arg('sort_order')::text = 'asc'
        THEN number
    END ASC,
    CASE
        WHEN sqlc.arg('sort_by')::text = 'number' AND sqlc.arg('sort_order')::text = 'desc'
        THEN number
    END DESC,
    CASE
        WHEN sqlc.arg('sort_by')::text = 'created_at' AND sqlc.arg('sort_order')::text = 'asc'
        THEN created_at
    END ASC,
    CASE
        WHEN sqlc.arg('sort_by')::text = 'created_at' AND sqlc.arg('sort_order')::text = 'desc'
        THEN created_at
    END DESC,
    date DESC,
    number DESC
LIMIT sqlc.arg('limit')::int
OFFSET sqlc.arg('offset')::int;

-- name: GetInventoriesByStorageID :many
SELECT id, number, date, storage_id, description, description_i18n, status,
       surplus_amount, shortage_amount, remaining_amount,
       created_at, updated_at, deleted_at
FROM inventories
WHERE storage_id = $1 AND deleted_at = 0
  AND EXISTS (
    SELECT 1 FROM storages s
    WHERE s.id = inventories.storage_id
      AND s.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
  )
ORDER BY date DESC, number DESC
LIMIT $2 OFFSET $3;

-- name: GetInventoriesByStatus :many
SELECT id, number, date, storage_id, description, description_i18n, status,
       surplus_amount, shortage_amount, remaining_amount,
       created_at, updated_at, deleted_at
FROM inventories
WHERE status = $1 AND deleted_at = 0
  AND EXISTS (
    SELECT 1 FROM storages s
    WHERE s.id = inventories.storage_id
      AND s.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
  )
ORDER BY date DESC, number DESC
LIMIT $2 OFFSET $3;

-- name: UpdateInventory :one
UPDATE inventories
SET date = COALESCE($2, date),
    storage_id = COALESCE($3, storage_id),
    description = COALESCE($4, description),
    description_i18n = COALESCE($5, description_i18n),
    status = COALESCE($6, status),
    updated_at = NOW()
WHERE inventories.id = $1 AND inventories.deleted_at = 0
  AND EXISTS (
    SELECT 1 FROM storages s
    WHERE s.id = inventories.storage_id
      AND s.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
  )
RETURNING id, number, date, storage_id, description, description_i18n, status,
          surplus_amount, shortage_amount, remaining_amount,
          created_at, updated_at, deleted_at;

-- name: DeleteInventory :exec
UPDATE inventories
SET deleted_at = EXTRACT(EPOCH FROM NOW())::BIGINT
WHERE inventories.id = $1 AND inventories.deleted_at = 0
  AND EXISTS (
    SELECT 1 FROM storages s
    WHERE s.id = inventories.storage_id
      AND s.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
  );

-- name: RestoreInventory :one
UPDATE inventories
SET deleted_at = 0,
    updated_at = NOW()
WHERE inventories.id = $1 AND inventories.deleted_at != 0
  AND EXISTS (
    SELECT 1 FROM storages s
    WHERE s.id = inventories.storage_id
      AND s.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
  )
RETURNING id, number, date, storage_id, description, description_i18n, status,
          surplus_amount, shortage_amount, remaining_amount,
          created_at, updated_at, deleted_at;


-- ==================== INVENTORY ITEMS ====================

-- UpsertInventoryItem creates or updates counted quantity for an ingredient in an inventory
-- name: UpsertInventoryItem :one
INSERT INTO inventory_items (id, inventory_id, ingredient_id, counted_quantity, system_quantity)
VALUES ($1, $2, $3, $4,
  COALESCE((
    SELECT st.quantity
    FROM ingredient_stock st
    JOIN inventories inv ON inv.id = $2
    WHERE st.ingredient_id = $3
      AND st.storage_id = inv.storage_id
      AND st.deleted_at = 0
  ), 0))
ON CONFLICT (inventory_id, ingredient_id)
DO UPDATE SET
  counted_quantity = EXCLUDED.counted_quantity,
  updated_at = NOW(),
  deleted_at = 0
RETURNING id, inventory_id, ingredient_id, counted_quantity, system_quantity, created_at, updated_at, deleted_at;

-- name: GetInventoryItemByID :one
SELECT id, inventory_id, ingredient_id, counted_quantity, system_quantity, created_at, updated_at, deleted_at
FROM inventory_items
WHERE inventory_items.id = $1 AND inventory_items.deleted_at = 0
  AND EXISTS (
    SELECT 1 FROM inventories inv
    JOIN storages s ON s.id = inv.storage_id
    WHERE inv.id = inventory_items.inventory_id
      AND s.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
  );

-- name: GetAllInventoryItems :many
SELECT id, inventory_id, ingredient_id, counted_quantity, system_quantity, created_at, updated_at, deleted_at
FROM inventory_items
WHERE inventory_items.deleted_at = 0
  AND EXISTS (
    SELECT 1 FROM inventories inv
    JOIN storages s ON s.id = inv.storage_id
    WHERE inv.id = inventory_items.inventory_id
      AND s.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
  )
ORDER BY created_at DESC
LIMIT $1 OFFSET $2;

-- name: GetInventoryItemsByInventoryID :many
SELECT id, inventory_id, ingredient_id, counted_quantity, system_quantity, created_at, updated_at, deleted_at
FROM inventory_items
WHERE inventory_id = $1 AND inventory_items.deleted_at = 0
  AND EXISTS (
    SELECT 1 FROM inventories inv
    JOIN storages s ON s.id = inv.storage_id
    WHERE inv.id = inventory_items.inventory_id
      AND s.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
  )
ORDER BY created_at DESC
LIMIT $2 OFFSET $3;

-- name: UpdateInventoryItem :one
UPDATE inventory_items
SET counted_quantity = $2,
    updated_at = NOW()
WHERE inventory_items.id = $1 AND inventory_items.deleted_at = 0
  AND EXISTS (
    SELECT 1 FROM inventories inv
    JOIN storages s ON s.id = inv.storage_id
    WHERE inv.id = inventory_items.inventory_id
      AND s.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
  )
RETURNING id, inventory_id, ingredient_id, counted_quantity, system_quantity, created_at, updated_at, deleted_at;

-- name: DeleteInventoryItem :exec
UPDATE inventory_items
SET deleted_at = EXTRACT(EPOCH FROM NOW())::BIGINT,
    updated_at = NOW()
WHERE inventory_items.id = $1 AND inventory_items.deleted_at = 0
  AND EXISTS (
    SELECT 1 FROM inventories inv
    JOIN storages s ON s.id = inv.storage_id
    WHERE inv.id = inventory_items.inventory_id
      AND s.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
  );

-- name: GetInventoryItemsComputedAll :many
SELECT
  ii.id as inventory_item_id,
  inv.id as inventory_id,
  ing.id as ingredient_id,
  ing.name as ingredient_name,
  ing.measurement as ingredient_measurement,
  ing.picture_url as ingredient_picture_url,
  ing.color_code as ingredient_color_code,
  ii.system_quantity as system_quantity,
  ii.counted_quantity as counted_quantity,
  (ii.counted_quantity - ii.system_quantity)::numeric(15,6) as difference_quantity,
  ing.price_per_unit as price_per_unit,
  (GREATEST((ii.counted_quantity - ii.system_quantity), 0::numeric) * ing.price_per_unit)::numeric(15,2) as surplus_amount,
  (GREATEST((ii.system_quantity - ii.counted_quantity), 0::numeric) * ing.price_per_unit)::numeric(15,2) as shortage_amount,
  (ii.counted_quantity::numeric * ing.price_per_unit)::numeric(15,2) as remaining_amount
FROM inventories inv
JOIN inventory_items ii
  ON ii.inventory_id = inv.id
  AND ii.deleted_at = 0
JOIN ingredients ing
  ON ing.id = ii.ingredient_id
  AND ing.deleted_at = 0
WHERE inv.id = $1 AND inv.deleted_at = 0
  AND EXISTS (
    SELECT 1 FROM storages s
    WHERE s.id = inv.storage_id
      AND s.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
  )
ORDER BY ing.name ASC;

-- name: CalculateInventoryTotals :one
SELECT
  COALESCE(SUM(t.surplus_amount), 0)::numeric(15,2) as surplus_amount,
  COALESCE(SUM(t.shortage_amount), 0)::numeric(15,2) as shortage_amount,
  COALESCE(SUM(t.remaining_amount), 0)::numeric(15,2) as remaining_amount
FROM (
  SELECT
    (GREATEST((ii.counted_quantity - ii.system_quantity), 0::numeric) * ing.price_per_unit)::numeric(15,2) as surplus_amount,
    (GREATEST((ii.system_quantity - ii.counted_quantity), 0::numeric) * ing.price_per_unit)::numeric(15,2) as shortage_amount,
    (ii.counted_quantity::numeric * ing.price_per_unit)::numeric(15,2) as remaining_amount
  FROM inventories inv
  JOIN inventory_items ii
    ON ii.inventory_id = inv.id
    AND ii.deleted_at = 0
  JOIN ingredients ing
    ON ing.id = ii.ingredient_id
    AND ing.deleted_at = 0
  WHERE inv.id = $1 AND inv.deleted_at = 0
) t;

-- name: CountInventoriesFiltered :one
SELECT COUNT(DISTINCT inv.id)
FROM inventories inv
LEFT JOIN inventory_items ii
  ON ii.inventory_id = inv.id
 AND ii.deleted_at = 0
WHERE EXISTS (
    SELECT 1
    FROM storages s
    WHERE s.id = inv.storage_id
      AND s.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
)
  AND (sqlc.narg('date_from')::date IS NULL OR inv.date >= sqlc.narg('date_from')::date)
  AND (sqlc.narg('date_to')::date IS NULL OR inv.date <= sqlc.narg('date_to')::date)
  AND (sqlc.narg('storage_id')::uuid IS NULL OR inv.storage_id = sqlc.narg('storage_id')::uuid)
  AND (sqlc.arg('status')::text = '' OR inv.status = sqlc.arg('status')::text)
  AND (sqlc.narg('ingredient_id')::uuid IS NULL OR ii.ingredient_id = sqlc.narg('ingredient_id')::uuid)
  AND (
        sqlc.arg('search')::text = ''
        OR COALESCE(inv.description, '') ILIKE '%' || sqlc.arg('search')::text || '%'
        OR CAST(inv.number AS TEXT) ILIKE '%' || sqlc.arg('search')::text || '%'
      );

-- name: DeleteInventoriesBatch :exec
UPDATE inventories
SET deleted_at = EXTRACT(EPOCH FROM NOW())::BIGINT
WHERE id = ANY($1::uuid[]) AND deleted_at = 0
  AND EXISTS (
    SELECT 1 FROM storages s
    WHERE s.id = inventories.storage_id
      AND s.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
  );

-- name: UpdateInventoryAmounts :one
UPDATE inventories
SET surplus_amount = $2,
    shortage_amount = $3,
    remaining_amount = $4,
    updated_at = NOW()
WHERE inventories.id = $1 AND inventories.deleted_at = 0
  AND EXISTS (
    SELECT 1 FROM storages s
    WHERE s.id = inventories.storage_id
      AND s.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
  )
RETURNING id, number, date, storage_id, description, description_i18n, status,
          surplus_amount, shortage_amount, remaining_amount,
          created_at, updated_at, deleted_at;
