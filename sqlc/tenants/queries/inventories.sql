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
WHERE id = $1 AND deleted_at = 0;

-- name: GetAllInventories :many
SELECT id, number, date, storage_id, description, description_i18n, status,
       surplus_amount, shortage_amount, remaining_amount,
       created_at, updated_at, deleted_at
FROM inventories
WHERE deleted_at = 0
ORDER BY date DESC, number DESC
LIMIT $1 OFFSET $2;

-- name: GetInventoriesByStorageID :many
SELECT id, number, date, storage_id, description, description_i18n, status,
       surplus_amount, shortage_amount, remaining_amount,
       created_at, updated_at, deleted_at
FROM inventories
WHERE storage_id = $1 AND deleted_at = 0
ORDER BY date DESC, number DESC
LIMIT $2 OFFSET $3;

-- name: GetInventoriesByStatus :many
SELECT id, number, date, storage_id, description, description_i18n, status,
       surplus_amount, shortage_amount, remaining_amount,
       created_at, updated_at, deleted_at
FROM inventories
WHERE status = $1 AND deleted_at = 0
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
WHERE id = $1 AND deleted_at = 0
RETURNING id, number, date, storage_id, description, description_i18n, status,
          surplus_amount, shortage_amount, remaining_amount,
          created_at, updated_at, deleted_at;

-- name: DeleteInventory :exec
UPDATE inventories
SET deleted_at = EXTRACT(EPOCH FROM NOW())::BIGINT
WHERE id = $1 AND deleted_at = 0;

-- name: RestoreInventory :one
UPDATE inventories
SET deleted_at = 0,
    updated_at = NOW()
WHERE id = $1 AND deleted_at != 0
RETURNING id, number, date, storage_id, description, description_i18n, status,
          surplus_amount, shortage_amount, remaining_amount,
          created_at, updated_at, deleted_at;

-- name: SearchInventories :many
SELECT id, number, date, storage_id, description, description_i18n, status,
       surplus_amount, shortage_amount, remaining_amount,
       created_at, updated_at, deleted_at
FROM inventories
WHERE deleted_at = 0
AND (
    description ILIKE '%' || $1 || '%'
    OR CAST(number AS TEXT) ILIKE '%' || $1 || '%'
)
ORDER BY date DESC, number DESC
LIMIT $2 OFFSET $3;

-- name: CountInventories :one
SELECT COUNT(*) FROM inventories WHERE deleted_at = 0;


-- ==================== INVENTORY ITEMS ====================

-- UpsertInventoryItem creates or updates counted quantity for an ingredient in an inventory
-- name: UpsertInventoryItem :one
INSERT INTO inventory_items (id, inventory_id, ingredient_id, counted_quantity)
VALUES ($1, $2, $3, $4)
ON CONFLICT (inventory_id, ingredient_id)
DO UPDATE SET
  counted_quantity = EXCLUDED.counted_quantity,
  updated_at = NOW(),
  deleted_at = 0
RETURNING id, inventory_id, ingredient_id, counted_quantity, created_at, updated_at, deleted_at;

-- name: GetInventoryItemByID :one
SELECT id, inventory_id, ingredient_id, counted_quantity, created_at, updated_at, deleted_at
FROM inventory_items
WHERE id = $1 AND deleted_at = 0;

-- name: GetAllInventoryItems :many
SELECT id, inventory_id, ingredient_id, counted_quantity, created_at, updated_at, deleted_at
FROM inventory_items
WHERE deleted_at = 0
ORDER BY created_at DESC
LIMIT $1 OFFSET $2;

-- name: GetInventoryItemsByInventoryID :many
SELECT id, inventory_id, ingredient_id, counted_quantity, created_at, updated_at, deleted_at
FROM inventory_items
WHERE inventory_id = $1 AND deleted_at = 0
ORDER BY created_at DESC
LIMIT $2 OFFSET $3;

-- name: UpdateInventoryItem :one
UPDATE inventory_items
SET counted_quantity = $2,
    updated_at = NOW()
WHERE id = $1 AND deleted_at = 0
RETURNING id, inventory_id, ingredient_id, counted_quantity, created_at, updated_at, deleted_at;

-- name: DeleteInventoryItem :exec
UPDATE inventory_items
SET deleted_at = EXTRACT(EPOCH FROM NOW())::BIGINT,
    updated_at = NOW()
WHERE id = $1 AND deleted_at = 0;

-- name: GetInventoryItemsComputedAll :many
SELECT
  ii.id as inventory_item_id,
  inv.id as inventory_id,
  ing.id as ingredient_id,
  ing.name as ingredient_name,
  ing.measurement as ingredient_measurement,
  ing.picture_url as ingredient_picture_url,
  ing.color_code as ingredient_color_code,
  ing.brand_id as ingredient_brand_id,
  COALESCE(st.quantity, 0::numeric) as system_quantity,
  ii.counted_quantity as counted_quantity,
  (ii.counted_quantity - COALESCE(st.quantity, 0::numeric))::numeric(15,6) as difference_quantity,
  ing.price_per_unit as price_per_unit,
  (GREATEST((ii.counted_quantity - COALESCE(st.quantity, 0::numeric)), 0::numeric) * ing.price_per_unit)::numeric(15,2) as surplus_amount,
  (GREATEST((COALESCE(st.quantity, 0::numeric) - ii.counted_quantity), 0::numeric) * ing.price_per_unit)::numeric(15,2) as shortage_amount,
  (ii.counted_quantity::numeric * ing.price_per_unit)::numeric(15,2) as remaining_amount
FROM inventories inv
JOIN inventory_items ii
  ON ii.inventory_id = inv.id
  AND ii.deleted_at = 0
JOIN ingredients ing
  ON ing.id = ii.ingredient_id
  AND ing.deleted_at = 0
LEFT JOIN ingredient_stock st
  ON st.ingredient_id = ing.id
  AND st.storage_id = inv.storage_id
  AND st.deleted_at = 0
WHERE inv.id = $1 AND inv.deleted_at = 0
ORDER BY ing.name ASC;

-- name: CalculateInventoryTotals :one
SELECT
  COALESCE(SUM(t.surplus_amount), 0)::numeric(15,2) as surplus_amount,
  COALESCE(SUM(t.shortage_amount), 0)::numeric(15,2) as shortage_amount,
  COALESCE(SUM(t.remaining_amount), 0)::numeric(15,2) as remaining_amount
FROM (
  SELECT
    (GREATEST((ii.counted_quantity - COALESCE(st.quantity, 0::numeric)), 0::numeric) * ing.price_per_unit)::numeric(15,2) as surplus_amount,
    (GREATEST((COALESCE(st.quantity, 0::numeric) - ii.counted_quantity), 0::numeric) * ing.price_per_unit)::numeric(15,2) as shortage_amount,
    (ii.counted_quantity::numeric * ing.price_per_unit)::numeric(15,2) as remaining_amount
  FROM inventories inv
  JOIN inventory_items ii
    ON ii.inventory_id = inv.id
    AND ii.deleted_at = 0
  JOIN ingredients ing
    ON ing.id = ii.ingredient_id
    AND ing.deleted_at = 0
  LEFT JOIN ingredient_stock st
    ON st.ingredient_id = ing.id
    AND st.storage_id = inv.storage_id
    AND st.deleted_at = 0
  WHERE inv.id = $1 AND inv.deleted_at = 0
) t;

-- name: UpdateInventoryAmounts :one
UPDATE inventories
SET surplus_amount = $2,
    shortage_amount = $3,
    remaining_amount = $4,
    updated_at = NOW()
WHERE id = $1 AND deleted_at = 0
RETURNING id, number, date, storage_id, description, description_i18n, status,
          surplus_amount, shortage_amount, remaining_amount,
          created_at, updated_at, deleted_at;
