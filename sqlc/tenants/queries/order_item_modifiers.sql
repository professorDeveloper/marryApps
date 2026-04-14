-- name: CreateOrderItemModifier :one
INSERT INTO order_item_modifiers (
    id,
    order_item_id,
    modifier_id,
    units
)
VALUES (
    $1, $2, $3, $4
)
RETURNING
    id,
    order_item_id,
    modifier_id,
    units,
    created_at,
    updated_at,
    deleted_at;

-- name: GetOrderItemModifiersByOrderItemID :many
SELECT
    id,
    order_item_id,
    modifier_id,
    units,
    created_at,
    updated_at,
    deleted_at
FROM order_item_modifiers
WHERE order_item_id = $1
  AND deleted_at = 0
ORDER BY created_at ASC;

-- name: ListOrderItemModifiersByOrderID :many
SELECT
    oim.id,
    oim.order_item_id,
    oim.modifier_id,
    oim.units,
    oim.created_at,
    oim.updated_at,
    oim.deleted_at
FROM order_item_modifiers oim
JOIN order_items oi ON oi.id = oim.order_item_id
WHERE oi.order_id = $1
  AND oi.deleted_at = 0
  AND oim.deleted_at = 0
ORDER BY oi.created_at ASC, oim.created_at ASC;

-- name: DeleteOrderItemModifiersByOrderItemID :exec
UPDATE order_item_modifiers
SET deleted_at = EXTRACT(EPOCH FROM NOW())::BIGINT
WHERE order_item_id = $1
  AND deleted_at = 0;
