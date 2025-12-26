-- name: CreateOrder :one
INSERT INTO orders (id, table_id, waiter_id, cashier_id, status, guest_count, total_amount, comment)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
RETURNING id, table_id, waiter_id, cashier_id, status, guest_count, total_amount, comment, created_at, updated_at, deleted_at;

-- name: GetOrderByID :one
SELECT id, table_id, waiter_id, cashier_id, status, guest_count, total_amount, comment, created_at, updated_at, deleted_at
FROM orders
WHERE id = $1 AND deleted_at = 0;

-- name: GetAllOrders :many
SELECT id, table_id, waiter_id, cashier_id, status, guest_count, total_amount, comment, created_at, updated_at, deleted_at
FROM orders
WHERE deleted_at = 0
ORDER BY created_at DESC
LIMIT $1 OFFSET $2;

-- name: GetOrdersByStatus :many
SELECT id, table_id, waiter_id, cashier_id, status, guest_count, total_amount, comment, created_at, updated_at, deleted_at
FROM orders
WHERE status = $1 AND deleted_at = 0
ORDER BY created_at DESC
LIMIT $2 OFFSET $3;

-- name: GetOrdersByTableID :many
SELECT id, table_id, waiter_id, cashier_id, status, guest_count, total_amount, comment, created_at, updated_at, deleted_at
FROM orders
WHERE table_id = $1 AND deleted_at = 0
ORDER BY created_at DESC;

-- name: GetOrdersByWaiterID :many
SELECT id, table_id, waiter_id, cashier_id, status, guest_count, total_amount, comment, created_at, updated_at, deleted_at
FROM orders
WHERE waiter_id = $1 AND deleted_at = 0
ORDER BY created_at DESC
LIMIT $2 OFFSET $3;



-- name: GetOrdersByDateRange :many
SELECT id, table_id, waiter_id, cashier_id, status, guest_count, total_amount, comment, created_at, updated_at, deleted_at
FROM orders
WHERE created_at >= $1 AND created_at <= $2 AND deleted_at = 0
ORDER BY created_at DESC
LIMIT $3 OFFSET $4;




-- name: UpdateOrder :one
UPDATE orders
SET table_id = COALESCE($2, table_id),
    waiter_id = COALESCE($3, waiter_id),
    cashier_id = COALESCE($4, cashier_id),
    status = COALESCE($5, status),
    guest_count = COALESCE($6, guest_count),
    total_amount = COALESCE($7, total_amount),
    comment = COALESCE($8, comment),
    updated_at = NOW()
WHERE id = $1 AND deleted_at = 0
RETURNING id, table_id, waiter_id, cashier_id, status, guest_count, total_amount, comment, created_at, updated_at, deleted_at;

-- name: UpdateOrderStatus :one
UPDATE orders
SET status = $2,
    updated_at = NOW()
WHERE id = $1 AND deleted_at = 0
RETURNING id, table_id, waiter_id, cashier_id, status, guest_count, total_amount, comment, created_at, updated_at, deleted_at;



-- name: AssignWaiterToOrder :one
UPDATE orders
SET waiter_id = $2,
    updated_at = NOW()
WHERE id = $1 AND deleted_at = 0
RETURNING id, table_id, waiter_id, cashier_id, status, guest_count, total_amount, comment, created_at, updated_at, deleted_at;

-- name: AssignCashierToOrder :one
UPDATE orders
SET cashier_id = $2,
    updated_at = NOW()
WHERE id = $1 AND deleted_at = 0
RETURNING id, table_id, waiter_id, cashier_id, status, guest_count, total_amount, comment, created_at, updated_at, deleted_at;

-- name: MarkOrderCooking :one
UPDATE orders
SET status = 'cooking',
    updated_at = NOW()
WHERE id = $1 AND deleted_at = 0
RETURNING id, table_id, waiter_id, cashier_id, status, guest_count, total_amount, comment, created_at, updated_at, deleted_at;

-- name: MarkOrderReady :one
UPDATE orders
SET status = 'ready',
    updated_at = NOW()
WHERE id = $1 AND deleted_at = 0
RETURNING id, table_id, waiter_id, cashier_id, status, guest_count, total_amount, comment, created_at, updated_at, deleted_at;

-- name: MarkOrderServed :one
UPDATE orders
SET status = 'served',
    updated_at = NOW()
WHERE id = $1 AND deleted_at = 0
RETURNING id, table_id, waiter_id, cashier_id, status, guest_count, total_amount, comment, created_at, updated_at, deleted_at;

-- name: MarkOrderPaid :one
UPDATE orders
SET status = 'paid',
    cashier_id = $2,
    updated_at = NOW()
WHERE id = $1 AND deleted_at = 0
RETURNING id, table_id, waiter_id, cashier_id, status, guest_count, total_amount, comment, created_at, updated_at, deleted_at;

-- name: CancelOrder :one
UPDATE orders
SET status = 'cancelled',
    updated_at = NOW()
WHERE id = $1 AND deleted_at = 0
RETURNING id, table_id, waiter_id, cashier_id, status, guest_count, total_amount, comment, created_at, updated_at, deleted_at;

-- name: DeleteOrder :exec
UPDATE orders
SET deleted_at = EXTRACT(EPOCH FROM NOW())::BIGINT
WHERE id = $1 AND deleted_at = 0;

-- name: RestoreOrder :exec
UPDATE orders
SET deleted_at = 0
WHERE id = $1 AND deleted_at != 0;

-- name: CountOrders :one
SELECT COUNT(*) FROM orders WHERE deleted_at = 0;

-- name: CountOrdersByStatus :one
SELECT COUNT(*) FROM orders WHERE status = $1 AND deleted_at = 0;

-- name: CountActiveOrders :one
SELECT COUNT(*) FROM orders WHERE status NOT IN ('paid', 'cancelled') AND deleted_at = 0;



-- name: CreateOrderItem :one
INSERT INTO order_items (id, good_id, order_id, quantity, price, status, comment)
VALUES ($1, $2, $3, $4, $5, $6, $7)
RETURNING id, good_id, order_id, quantity, price, status, comment, created_at, updated_at, deleted_at;

-- name: GetOrderItemByID :one
SELECT id, good_id, order_id, quantity, price, status, comment, created_at, updated_at, deleted_at
FROM order_items
WHERE id = $1 AND deleted_at = 0;

-- name: GetAllOrderItems :many
SELECT id, good_id, order_id, quantity, price, status, comment, created_at, updated_at, deleted_at
FROM order_items
WHERE deleted_at = 0
ORDER BY created_at DESC
LIMIT $1 OFFSET $2;

-- name: GetOrderItemsByOrderID :many
SELECT id, good_id, order_id, quantity, price, status, comment, created_at, updated_at, deleted_at
FROM order_items
WHERE order_id = $1 AND deleted_at = 0
ORDER BY created_at ASC;



-- name: GetOrderItemsByStatus :many
SELECT id, good_id, order_id, quantity, price, status, comment, created_at, updated_at, deleted_at
FROM order_items
WHERE status = $1 AND deleted_at = 0
ORDER BY created_at ASC
LIMIT $2 OFFSET $3;

-- name: UpdateOrderItem :one
UPDATE order_items
SET good_id = COALESCE($2, good_id),
    order_id = COALESCE($3, order_id),
    quantity = COALESCE($4, quantity),
    price = COALESCE($5, price),
    status = COALESCE($6, status),
    comment = COALESCE($7, comment),
    updated_at = NOW()
WHERE id = $1 AND deleted_at = 0
RETURNING id, good_id, order_id, quantity, price, status, comment, created_at, updated_at, deleted_at;

-- name: UpdateOrderItemQuantity :one
UPDATE order_items
SET quantity = $2,
    updated_at = NOW()
WHERE id = $1 AND deleted_at = 0
RETURNING id, good_id, order_id, quantity, price, status, comment, created_at, updated_at, deleted_at;

-- name: UpdateOrderItemStatus :one
UPDATE order_items
SET status = $2,
    updated_at = NOW()
WHERE id = $1 AND deleted_at = 0
RETURNING id, good_id, order_id, quantity, price, status, comment, created_at, updated_at, deleted_at;

-- name: MarkOrderItemCooking :one
UPDATE order_items
SET status = 'cooking',
    updated_at = NOW()
WHERE id = $1 AND deleted_at = 0
RETURNING id, good_id, order_id, quantity, price, status, comment, created_at, updated_at, deleted_at;

-- name: MarkOrderItemReady :one
UPDATE order_items
SET status = 'ready',
    updated_at = NOW()
WHERE id = $1 AND deleted_at = 0
RETURNING id, good_id, order_id, quantity, price, status, comment, created_at, updated_at, deleted_at;

-- name: CancelOrderItem :one
UPDATE order_items
SET status = 'cancelled',
    updated_at = NOW()
WHERE id = $1 AND deleted_at = 0
RETURNING id, good_id, order_id, quantity, price, status, comment, created_at, updated_at, deleted_at;


-- name: DeleteOrderItem :exec
UPDATE order_items
SET deleted_at = EXTRACT(EPOCH FROM NOW())::BIGINT
WHERE id = $1 AND deleted_at = 0;

-- name: RestoreOrderItem :exec
UPDATE order_items
SET deleted_at = 0
WHERE id = $1 AND deleted_at != 0;

-- name: DeleteOrderItemsByOrderID :exec
UPDATE order_items
SET deleted_at = EXTRACT(EPOCH FROM NOW())::BIGINT
WHERE order_id = $1 AND deleted_at = 0;

-- name: CountOrderItems :one
SELECT COUNT(*) FROM order_items WHERE deleted_at = 0;

-- name: CountOrderItemsByOrder :one
SELECT COUNT(*) FROM order_items WHERE order_id = $1 AND deleted_at = 0;

-- name: CountOrderItemsByStatus :one
SELECT COUNT(*) FROM order_items WHERE status = $1 AND deleted_at = 0;



-- name: GetOrderWithDetails :one
SELECT 
    o.id,
    o.table_id,
    o.waiter_id,
    o.cashier_id,
    o.status,
    o.guest_count,
    o.total_amount,
    o.comment,
    o.created_at,
    o.updated_at,
    ct.number as table_number,
    ct.capacity as table_capacity,
    h.name as hall_name,
    w.full_name as waiter_name,
    c.full_name as cashier_name,
    COUNT(oi.id) as item_count,
    SUM(oi.quantity) as total_items
FROM orders o
LEFT JOIN cafe_tables ct ON o.table_id = ct.id AND ct.deleted_at = 0
LEFT JOIN halls h ON ct.hall_id = h.id AND h.deleted_at = 0
LEFT JOIN users w ON o.waiter_id = w.id AND w.deleted_at = 0
LEFT JOIN users c ON o.cashier_id = c.id AND c.deleted_at = 0
LEFT JOIN order_items oi ON o.id = oi.order_id AND oi.deleted_at = 0
WHERE o.id = $1 AND o.deleted_at = 0
GROUP BY o.id, o.table_id, o.waiter_id, o.cashier_id, o.status, o.guest_count, o.total_amount, o.comment, o.created_at, o.updated_at, ct.number, ct.capacity, h.name, w.full_name, c.full_name;


-- name: GetKitchenQueue :many
SELECT 
    oi.id,
    oi.order_id,
    oi.good_id,
    oi.quantity,
    oi.status,
    oi.comment,
    oi.created_at,
    g.name as dish_name,
    g.cook_time,
    o.table_id,
    ct.number as table_number,
    h.name as hall_name,
    o.guest_count,
    EXTRACT(EPOCH FROM (NOW() - oi.created_at))/60 as wait_time_minutes
FROM order_items oi
LEFT JOIN goods g ON oi.good_id = g.id AND g.deleted_at = 0
LEFT JOIN orders o ON oi.order_id = o.id AND o.deleted_at = 0
LEFT JOIN cafe_tables ct ON o.table_id = ct.id AND ct.deleted_at = 0
LEFT JOIN halls h ON ct.hall_id = h.id AND h.deleted_at = 0
WHERE oi.status IN ('pending', 'cooking') 
AND oi.deleted_at = 0
ORDER BY oi.created_at ASC;
