-- name: CreateOrder :one
INSERT INTO orders (
    id,
    table_id,
    waiter_id,
    cashier_id,
    cash_register_id,
    status,
    guest_count,
    total_amount,
    comment,
    order_type,
    scheduled_at,
    client_created_at,
    branch_id
)
VALUES (
    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12,
    COALESCE(
        (SELECT h.branch_id FROM cafe_tables ct JOIN halls h ON h.id = ct.hall_id WHERE ct.id = $2),
        (SELECT s.branch_id FROM users u JOIN shifts s ON s.id = u.shift_id WHERE u.id = $3),
        (SELECT s.branch_id FROM users u JOIN shifts s ON s.id = u.shift_id WHERE u.id = $4),
        NULLIF(current_setting('app.branch_id', true), '')::uuid
    )
)
RETURNING id, table_id, waiter_id, cashier_id, cash_register_id, branch_id, status, guest_count, total_amount, comment,
          order_type, scheduled_at, reschedule_comment, client_created_at, created_at, updated_at, deleted_at;

-- name: GetOrderByID :one
SELECT id, table_id, waiter_id, cashier_id, cash_register_id, branch_id, status, guest_count, total_amount, comment,
       order_type, scheduled_at, reschedule_comment, client_created_at, paid_at, created_at, updated_at, deleted_at
FROM orders
WHERE orders.id = $1
  AND branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
  AND deleted_at = 0;

-- name: GetAllOrders :many
SELECT
    id,
    table_id,
    waiter_id,
    cashier_id,
    cash_register_id,
    branch_id,
    status,
    guest_count,
    total_amount,
    comment,
    order_type,
    scheduled_at,
    reschedule_comment,
    client_created_at,
    paid_at,
    created_at,
    updated_at,
    deleted_at
FROM orders
WHERE deleted_at = 0
  AND branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
  AND (
        sqlc.narg('order_type')::text IS NULL
        OR order_type = sqlc.narg('order_type')::text
      )
  AND (
        sqlc.narg('status')::order_status IS NULL
        OR status = sqlc.narg('status')::order_status
      )
  AND (
        sqlc.narg('table_id')::uuid IS NULL
        OR table_id = sqlc.narg('table_id')::uuid
      )
  AND (
        sqlc.narg('period_start')::timestamptz IS NULL
        OR created_at >= sqlc.narg('period_start')::timestamptz
      )
  AND (
        sqlc.narg('period_end')::timestamptz IS NULL
        OR created_at < sqlc.narg('period_end')::timestamptz
      )
ORDER BY
  CASE
    WHEN sqlc.arg('sort_by')::text = 'created_at' AND sqlc.arg('sort_order')::text = 'asc'
      THEN created_at
  END ASC,
  CASE
    WHEN sqlc.arg('sort_by')::text = 'created_at' AND sqlc.arg('sort_order')::text = 'desc'
      THEN created_at
  END DESC,
  CASE
    WHEN sqlc.arg('sort_by')::text = 'updated_at' AND sqlc.arg('sort_order')::text = 'asc'
      THEN updated_at
  END ASC,
  CASE
    WHEN sqlc.arg('sort_by')::text = 'updated_at' AND sqlc.arg('sort_order')::text = 'desc'
      THEN updated_at
  END DESC,
  created_at DESC
LIMIT sqlc.arg('page_limit')::int
OFFSET sqlc.arg('page_offset')::int;

-- name: GetOrdersByStatus :many
SELECT id, table_id, waiter_id, cashier_id, cash_register_id, branch_id, status, guest_count, total_amount, comment,
       order_type, scheduled_at, reschedule_comment, client_created_at, paid_at, created_at, updated_at, deleted_at
FROM orders
WHERE status = $1
  AND branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
  AND deleted_at = 0
ORDER BY created_at DESC
LIMIT $2 OFFSET $3;

-- name: GetOrdersByTableID :many
SELECT id, table_id, waiter_id, cashier_id, cash_register_id, branch_id, status, guest_count, total_amount, comment,
       order_type, scheduled_at, reschedule_comment, client_created_at, paid_at, created_at, updated_at, deleted_at
FROM orders
WHERE table_id = $1
  AND branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
  AND deleted_at = 0
ORDER BY created_at DESC;

-- name: GetOrdersByWaiterID :many
SELECT id, table_id, waiter_id, cashier_id, cash_register_id, branch_id, status, guest_count, total_amount, comment,
       order_type, scheduled_at, reschedule_comment, client_created_at, paid_at, created_at, updated_at, deleted_at
FROM orders
WHERE waiter_id = $1
  AND branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
  AND deleted_at = 0
ORDER BY created_at DESC
LIMIT $2 OFFSET $3;

-- name: GetOrdersByDateRange :many
SELECT id, table_id, waiter_id, cashier_id, cash_register_id, branch_id, status, guest_count, total_amount, comment,
       order_type, scheduled_at, reschedule_comment, client_created_at, paid_at, created_at, updated_at, deleted_at
FROM orders
WHERE created_at >= $1
  AND created_at <= $2
  AND branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
  AND deleted_at = 0
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
    updated_at = NOW(),
    branch_id = COALESCE(
        (SELECT h.branch_id FROM cafe_tables ct JOIN halls h ON h.id = ct.hall_id WHERE ct.id = COALESCE($2, table_id)),
        (SELECT s.branch_id FROM users u JOIN shifts s ON s.id = u.shift_id WHERE u.id = COALESCE($3, waiter_id)),
        (SELECT s.branch_id FROM users u JOIN shifts s ON s.id = u.shift_id WHERE u.id = COALESCE($4, cashier_id)),
        branch_id
    )
WHERE orders.id = $1
  AND branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
  AND deleted_at = 0
RETURNING id, table_id, waiter_id, cashier_id, branch_id, status, guest_count, total_amount, comment,
          order_type, scheduled_at, reschedule_comment, client_created_at, paid_at, created_at, updated_at, deleted_at;

-- name: UpdateOrderStatus :one
UPDATE orders
SET status = $2,
    updated_at = NOW()
WHERE orders.id = $1
  AND branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
  AND deleted_at = 0
RETURNING id, table_id, waiter_id, cashier_id, branch_id, status, guest_count, total_amount, comment,
          order_type, scheduled_at, reschedule_comment, client_created_at, paid_at, created_at, updated_at, deleted_at;

-- name: AssignWaiterToOrder :one
UPDATE orders
SET waiter_id = $2,
    updated_at = NOW()
WHERE orders.id = $1
  AND branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
  AND deleted_at = 0
RETURNING id, table_id, waiter_id, cashier_id, branch_id, status, guest_count, total_amount, comment,
          order_type, scheduled_at, reschedule_comment, client_created_at, paid_at, created_at, updated_at, deleted_at;

-- name: AssignCashierToOrder :one
UPDATE orders
SET cashier_id = $2,
    updated_at = NOW()
WHERE orders.id = $1
  AND branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
  AND deleted_at = 0
RETURNING id, table_id, waiter_id, cashier_id, branch_id, status, guest_count, total_amount, comment,
          order_type, scheduled_at, reschedule_comment, client_created_at, created_at, updated_at, deleted_at;

-- name: MarkOrderCooking :one
UPDATE orders
SET status = 'cooking',
    updated_at = NOW()
WHERE orders.id = $1
  AND branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
  AND deleted_at = 0
RETURNING id, table_id, waiter_id, cashier_id, branch_id, status, guest_count, total_amount, comment,
          order_type, scheduled_at, reschedule_comment, client_created_at, paid_at, created_at, updated_at, deleted_at;

-- name: MarkOrderReady :one
UPDATE orders
SET status = 'ready',
    updated_at = NOW()
WHERE orders.id = $1
  AND branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
  AND deleted_at = 0
RETURNING id, table_id, waiter_id, cashier_id, branch_id, status, guest_count, total_amount, comment,
          order_type, scheduled_at, reschedule_comment, client_created_at, paid_at, created_at, updated_at, deleted_at;

-- name: MarkOrderServed :one
UPDATE orders
SET status = 'served',
    updated_at = NOW()
WHERE id = $1 AND deleted_at = 0
  AND branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
RETURNING id, table_id, waiter_id, cashier_id, branch_id, status, guest_count, total_amount, comment,
          order_type, scheduled_at, reschedule_comment, client_created_at, paid_at, created_at, updated_at, deleted_at;

-- name: MarkOrderPaid :one
UPDATE orders
SET status = 'paid',
    cashier_id = $2,
    updated_at = NOW()
WHERE id = $1 AND deleted_at = 0
  AND branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
RETURNING id, table_id, waiter_id, cashier_id, branch_id, status, guest_count, total_amount, comment,
          order_type, scheduled_at, reschedule_comment, client_created_at, paid_at, created_at, updated_at, deleted_at;

-- name: CancelOrder :one
UPDATE orders
SET status = 'cancelled',
    updated_at = NOW()
WHERE id = $1 AND deleted_at = 0
  AND branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
RETURNING id, table_id, waiter_id, cashier_id, branch_id, status, guest_count, total_amount, comment,
          order_type, scheduled_at, reschedule_comment, client_created_at, paid_at, created_at, updated_at, deleted_at;

-- name: ActivateOrder :one
UPDATE orders
SET status = 'open',
    updated_at = NOW()
WHERE id = $1
  AND status IN ('reserved', 'rescheduled')
  AND deleted_at = 0
  AND branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
RETURNING id, table_id, waiter_id, cashier_id, branch_id, status, guest_count, total_amount, comment,
          order_type, scheduled_at, reschedule_comment, client_created_at, paid_at, created_at, updated_at, deleted_at;

-- name: DeleteOrder :exec
UPDATE orders
SET deleted_at = EXTRACT(EPOCH FROM NOW())::BIGINT
WHERE orders.id = $1
  AND branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
  AND deleted_at = 0;

-- name: RestoreOrder :exec
UPDATE orders
SET deleted_at = 0
WHERE orders.id = $1
  AND branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
  AND deleted_at != 0;

-- name: CountOrders :one
SELECT COUNT(*) FROM orders
WHERE deleted_at = 0
  AND branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid;

-- name: CountOrdersByStatus :one
SELECT COUNT(*) FROM orders
WHERE status = $1
  AND deleted_at = 0
  AND branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid;

-- name: CountActiveOrders :one
SELECT COUNT(*) FROM orders
WHERE status NOT IN ('paid', 'cancelled')
  AND deleted_at = 0
  AND branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid;

-- name: ActivateReservedOrders :many
UPDATE orders
SET status = 'open',
    updated_at = NOW()
WHERE status IN ('reserved', 'rescheduled')
  AND scheduled_at <= NOW()
  AND deleted_at = 0
  AND branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
RETURNING id, table_id, order_type;

-- name: RescheduleOrder :one
UPDATE orders
SET status = 'rescheduled',
    scheduled_at = $2,
    reschedule_comment = $3,
    updated_at = NOW()
WHERE id = $1
  AND status IN ('reserved', 'rescheduled')
  AND deleted_at = 0
  AND branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
RETURNING id, table_id, waiter_id, cashier_id, branch_id, status, guest_count, total_amount, comment,
          order_type, scheduled_at, reschedule_comment, client_created_at, paid_at, created_at, updated_at, deleted_at;

-- name: CreateOrderItem :one
INSERT INTO order_items (id, good_id, order_id, quantity, price, cost_price, status, comment)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
RETURNING id, good_id, order_id, quantity, price, status, comment, created_at, updated_at, deleted_at, cost_price;

-- name: GetOrderItemByID :one
SELECT id, good_id, order_id, quantity, price, status, comment, created_at, updated_at, deleted_at, cost_price
FROM order_items
WHERE order_items.id = $1
  AND order_items.deleted_at = 0
  AND EXISTS (
    SELECT 1 FROM orders o
    WHERE o.id = order_items.order_id
      AND o.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
  );

-- name: GetAllOrderItems :many
SELECT id, good_id, order_id, quantity, price, status, comment, created_at, updated_at, deleted_at, cost_price
FROM order_items
WHERE order_items.deleted_at = 0
  AND EXISTS (
    SELECT 1 FROM orders o
    WHERE o.id = order_items.order_id
      AND o.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
  )
ORDER BY created_at DESC
LIMIT $1 OFFSET $2;

-- name: GetOrderItemsByOrderID :many
SELECT id, good_id, order_id, quantity, price, status, comment, created_at, updated_at, deleted_at, cost_price
FROM order_items
WHERE order_items.order_id = $1
  AND order_items.deleted_at = 0
  AND EXISTS (
    SELECT 1 FROM orders o
    WHERE o.id = order_items.order_id
      AND o.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
  )
ORDER BY created_at ASC;



-- name: GetOrderItemsByStatus :many
SELECT id, good_id, order_id, quantity, price, status, comment, created_at, updated_at, deleted_at, cost_price
FROM order_items
WHERE order_items.status = $1
  AND order_items.deleted_at = 0
  AND EXISTS (
    SELECT 1 FROM orders o
    WHERE o.id = order_items.order_id
      AND o.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
  )
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
WHERE order_items.id = $1 AND order_items.deleted_at = 0
  AND EXISTS (
    SELECT 1 FROM orders o
    WHERE o.id = order_items.order_id
      AND o.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
  )
RETURNING id, good_id, order_id, quantity, price, status, comment, created_at, updated_at, deleted_at, cost_price;

-- name: UpdateOrderItemQuantity :one
UPDATE order_items
SET quantity = $2,
    updated_at = NOW()
WHERE order_items.id = $1 AND order_items.deleted_at = 0
  AND EXISTS (
    SELECT 1 FROM orders o
    WHERE o.id = order_items.order_id
      AND o.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
  )
RETURNING id, good_id, order_id, quantity, price, status, comment, created_at, updated_at, deleted_at, cost_price;

-- name: UpdateOrderItemStatus :one
UPDATE order_items
SET status = $2,
    updated_at = NOW()
WHERE order_items.id = $1 AND order_items.deleted_at = 0
  AND EXISTS (
    SELECT 1 FROM orders o
    WHERE o.id = order_items.order_id
      AND o.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
  )
RETURNING id, good_id, order_id, quantity, price, status, comment, created_at, updated_at, deleted_at, cost_price;

-- name: MarkOrderItemCooking :one
UPDATE order_items
SET status = 'cooking',
    updated_at = NOW()
WHERE order_items.id = $1 AND order_items.deleted_at = 0
  AND EXISTS (
    SELECT 1 FROM orders o
    WHERE o.id = order_items.order_id
      AND o.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
  )
RETURNING id, good_id, order_id, quantity, price, status, comment, created_at, updated_at, deleted_at, cost_price;

-- name: MarkOrderItemReady :one
UPDATE order_items
SET status = 'ready',
    updated_at = NOW()
WHERE order_items.id = $1 AND order_items.deleted_at = 0
  AND EXISTS (
    SELECT 1 FROM orders o
    WHERE o.id = order_items.order_id
      AND o.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
  )
RETURNING id, good_id, order_id, quantity, price, status, comment, created_at, updated_at, deleted_at, cost_price;

-- name: CancelOrderItem :one
UPDATE order_items
SET status = 'cancelled',
    updated_at = NOW()
WHERE order_items.id = $1 AND order_items.deleted_at = 0
  AND EXISTS (
    SELECT 1 FROM orders o
    WHERE o.id = order_items.order_id
      AND o.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
  )
RETURNING id, good_id, order_id, quantity, price, status, comment, created_at, updated_at, deleted_at, cost_price;


-- name: DeleteOrderItem :exec
UPDATE order_items
SET deleted_at = EXTRACT(EPOCH FROM NOW())::BIGINT
WHERE order_items.id = $1 AND order_items.deleted_at = 0
  AND EXISTS (
    SELECT 1 FROM orders o
    WHERE o.id = order_items.order_id
      AND o.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
  );

-- name: RestoreOrderItem :exec
UPDATE order_items
SET deleted_at = 0
WHERE order_items.id = $1 AND order_items.deleted_at != 0
  AND EXISTS (
    SELECT 1 FROM orders o
    WHERE o.id = order_items.order_id
      AND o.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
  );

-- name: DeleteOrderItemsByOrderID :exec
UPDATE order_items
SET deleted_at = EXTRACT(EPOCH FROM NOW())::BIGINT
WHERE order_items.order_id = $1 AND order_items.deleted_at = 0
  AND EXISTS (
    SELECT 1 FROM orders o
    WHERE o.id = order_items.order_id
      AND o.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
  );

-- name: CountOrderItems :one
SELECT COUNT(*) FROM order_items
WHERE order_items.deleted_at = 0
  AND EXISTS (
    SELECT 1 FROM orders o
    WHERE o.id = order_items.order_id
      AND o.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
  );

-- name: CountOrderItemsByOrder :one
SELECT COUNT(*) FROM order_items
WHERE order_items.order_id = $1 AND order_items.deleted_at = 0
  AND EXISTS (
    SELECT 1 FROM orders o
    WHERE o.id = order_items.order_id
      AND o.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
  );

-- name: CountOrderItemsByStatus :one
SELECT COUNT(*) FROM order_items
WHERE order_items.status = $1 AND order_items.deleted_at = 0
  AND EXISTS (
    SELECT 1 FROM orders o
    WHERE o.id = order_items.order_id
      AND o.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
  );



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
    o.order_type,
    o.scheduled_at,
    o.reschedule_comment,
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
WHERE o.id = $1
  AND o.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
  AND o.deleted_at = 0
GROUP BY o.id, o.table_id, o.waiter_id, o.cashier_id, o.status, o.guest_count, o.total_amount, o.comment,
         o.order_type, o.scheduled_at, o.reschedule_comment, o.created_at, o.updated_at,
         ct.number, ct.capacity, h.name, w.full_name, c.full_name;


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
  AND o.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
  AND o.status NOT IN ('reserved', 'rescheduled')
ORDER BY oi.created_at ASC;

-- name: GetOrderWithTablePrice :one
SELECT
  o.id,
  o.created_at,
  o.scheduled_at,
  o.table_id,
  ct.price_per_hour
FROM orders o
JOIN cafe_tables ct ON ct.id = o.table_id AND ct.deleted_at = 0
WHERE o.id = $1
  AND o.deleted_at = 0
  AND o.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid;

-- name: GetMyWaiterOrders :many
SELECT
    o.id,
    o.table_id,
    o.waiter_id,
    o.cashier_id,
    o.cash_register_id,
    o.status,
    o.guest_count,
    o.total_amount,
    o.comment,
    o.order_type,
    o.scheduled_at,
    o.reschedule_comment,
    o.client_created_at,
    o.paid_at,
    o.created_at,
    o.updated_at,
    ct.number AS table_number,
    h.name AS hall_name,
    COUNT(oi.id)::bigint AS item_count,
    CAST(COALESCE(SUM(COALESCE(oi.quantity, 0)), 0) AS bigint) AS total_items
FROM orders o
LEFT JOIN cafe_tables ct ON o.table_id = ct.id AND ct.deleted_at = 0
LEFT JOIN halls h ON ct.hall_id = h.id AND h.deleted_at = 0
LEFT JOIN order_items oi ON o.id = oi.order_id AND oi.deleted_at = 0
WHERE o.waiter_id = sqlc.arg(waiter_id)::uuid
  AND o.deleted_at = 0
  AND (
        sqlc.arg(scope)::text = 'all'
        OR (
            sqlc.arg(scope)::text = 'active'
            AND (
                o.status IN ('open', 'cooking', 'ready', 'served')
                OR (o.order_type = 'takeaway' AND o.status = 'paid')
            )
        )
        OR (
            sqlc.arg(scope)::text = 'reservations'
            AND o.status IN ('reserved', 'rescheduled')
        )
        OR (
            sqlc.arg(scope)::text = 'history'
            AND o.status IN ('paid', 'cancelled')
        )
      )
  AND (
        sqlc.narg(order_type)::text IS NULL
        OR o.order_type = sqlc.narg(order_type)::text
      )
  AND (
        sqlc.narg(table_id)::uuid IS NULL
        OR o.table_id = sqlc.narg(table_id)::uuid
      )
  AND (
        CASE
            WHEN o.status IN ('reserved', 'rescheduled') AND o.scheduled_at IS NOT NULL
                THEN o.scheduled_at
            ELSE o.created_at
        END
      ) >= sqlc.arg(day_start)::timestamptz
  AND (
        CASE
            WHEN o.status IN ('reserved', 'rescheduled') AND o.scheduled_at IS NOT NULL
                THEN o.scheduled_at
            ELSE o.created_at
        END
      ) < sqlc.arg(day_end)::timestamptz
GROUP BY
    o.id,
    o.table_id,
    o.waiter_id,
    o.cashier_id,
    o.cash_register_id,
    o.status,
    o.guest_count,
    o.total_amount,
    o.comment,
    o.order_type,
    o.scheduled_at,
    o.reschedule_comment,
    o.client_created_at,
    o.paid_at,
    o.created_at,
    o.updated_at,
    ct.number,
    h.name
ORDER BY
    CASE
        WHEN o.status = 'ready' THEN 1
        WHEN o.status = 'cooking' THEN 2
        WHEN o.status = 'open' THEN 3
        WHEN o.status = 'served' THEN 4
        WHEN o.status = 'reserved' THEN 5
        WHEN o.status = 'rescheduled' THEN 6
        WHEN o.status = 'paid' THEN 7
        WHEN o.status = 'cancelled' THEN 8
        ELSE 99
    END,
    o.created_at DESC
LIMIT sqlc.arg(page_limit)::int
OFFSET sqlc.arg(page_offset)::int;

-- name: GetOrderItemByIDForUpdate :one
SELECT id, good_id, order_id, quantity, price, status, comment, created_at, updated_at, deleted_at, cost_price
FROM order_items
WHERE order_items.id = $1
  AND order_items.deleted_at = 0
  AND EXISTS (
    SELECT 1 FROM orders o
    WHERE o.id = order_items.order_id
      AND o.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
  )
FOR UPDATE;