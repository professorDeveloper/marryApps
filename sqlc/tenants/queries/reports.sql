-- name: GoodsReport :many
SELECT
  g.id::text                                                               AS good_id,
  g.name                                                                   AS name,
  COALESCE(SUM(oi.quantity), 0)::bigint                                    AS total_qty,
  COALESCE(AVG(oi.price), 0)::numeric                                      AS avg_sell_price,
  COALESCE(SUM(oi.quantity::numeric * oi.price), 0)                        AS total_sell,
  COALESCE(AVG(oi.cost_price), 0)::numeric                                 AS avg_cost_price,
  COALESCE(SUM(oi.quantity::numeric * oi.cost_price), 0)                   AS total_cost,
  COALESCE(AVG(oi.price - oi.cost_price), 0)::numeric                     AS avg_markup,
  COALESCE(SUM(oi.quantity::numeric * (oi.price - oi.cost_price)), 0)      AS total_markup,
  CASE
    WHEN COALESCE(AVG(oi.cost_price), 0) = 0 THEN 0
    ELSE (AVG(oi.price - oi.cost_price) / AVG(oi.cost_price)) * 100
  END::numeric                                                             AS avg_markup_pct
FROM order_items oi
JOIN orders o           ON o.id  = oi.order_id   AND o.deleted_at = 0 AND o.bill_status = 'paid'
JOIN goods g            ON g.id  = oi.good_id    AND g.deleted_at = 0
LEFT JOIN categories c  ON c.id  = g.category_id AND c.deleted_at = 0
LEFT JOIN cafe_tables ct ON ct.id = o.table_id
WHERE oi.deleted_at = 0
  AND o.created_at >= $1
  AND o.created_at <  $2
  AND o.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
  AND (NULLIF($3::text, '') IS NULL OR c.department_id = NULLIF($3::text, '')::uuid)
  AND (NULLIF($4::text, '') IS NULL OR g.category_id   = NULLIF($4::text, '')::uuid)
  AND (NULLIF($5::text, '') IS NULL OR g.id             = NULLIF($5::text, '')::uuid)
  AND (NULLIF($6::text, '') IS NULL OR o.waiter_id      = NULLIF($6::text, '')::uuid)
  AND (NULLIF($7::text, '') IS NULL OR ct.hall_id        = NULLIF($7::text, '')::uuid)
  AND (NULLIF($8::text, '') IS NULL OR o.table_id        = NULLIF($8::text, '')::uuid)
GROUP BY g.id, g.name
ORDER BY g.name
LIMIT  $9
OFFSET $10;

-- name: GoodsReportTotals :one
SELECT
  COALESCE(SUM(oi.quantity), 0)::bigint                                          AS total_qty,
  COALESCE(SUM(oi.quantity::numeric * oi.price), 0)                              AS total_sell,
  COALESCE(SUM(oi.quantity::numeric * oi.cost_price), 0)                         AS total_cost,
  COALESCE(SUM(oi.quantity::numeric * (oi.price - oi.cost_price)), 0)            AS total_markup,
  CASE
    WHEN COALESCE(SUM(oi.quantity::numeric * oi.cost_price), 0) = 0 THEN 0
    ELSE SUM(oi.quantity::numeric * (oi.price - oi.cost_price))
       / SUM(oi.quantity::numeric * oi.cost_price) * 100
  END::numeric                                                                   AS avg_markup_pct,
  COUNT(DISTINCT g.id)::bigint                                                   AS total_count
FROM order_items oi
JOIN orders o           ON o.id  = oi.order_id   AND o.deleted_at = 0 AND o.bill_status = 'paid'
JOIN goods g            ON g.id  = oi.good_id    AND g.deleted_at = 0
LEFT JOIN categories c  ON c.id  = g.category_id AND c.deleted_at = 0
LEFT JOIN cafe_tables ct ON ct.id = o.table_id
WHERE oi.deleted_at = 0
  AND o.created_at >= $1
  AND o.created_at <  $2
  AND o.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
  AND (NULLIF($3::text, '') IS NULL OR c.department_id = NULLIF($3::text, '')::uuid)
  AND (NULLIF($4::text, '') IS NULL OR g.category_id   = NULLIF($4::text, '')::uuid)
  AND (NULLIF($5::text, '') IS NULL OR g.id             = NULLIF($5::text, '')::uuid)
  AND (NULLIF($6::text, '') IS NULL OR o.waiter_id      = NULLIF($6::text, '')::uuid)
  AND (NULLIF($7::text, '') IS NULL OR ct.hall_id        = NULLIF($7::text, '')::uuid)
  AND (NULLIF($8::text, '') IS NULL OR o.table_id        = NULLIF($8::text, '')::uuid);

-- name: GoodOrdersReport :many
SELECT
  o.id::text                                                                    AS order_id,
  o.bill_no::text                                                               AS bill_no,
  o.bill_status::text                                                           AS bill_status,
  o.bill_opened_at                                                              AS opened_at,
  o.bill_closed_at                                                              AS closed_at,
  COALESCE(u.full_name, cas.full_name, '')                                      AS waiter_name,
  COALESCE(h.name, '')                                                          AS hall_name,
  COALESCE(ct.number::text, '')                                                 AS table_number,
  COALESCE(SUM(oi.quantity), 0)::bigint                                         AS total_qty,
  COALESCE(AVG(oi.price), 0)::numeric                                           AS avg_sell_price,
  COALESCE(SUM(oi.quantity::numeric * oi.price), 0)                             AS total_sell,
  COALESCE(AVG(oi.cost_price), 0)::numeric                                      AS avg_cost_price,
  COALESCE(SUM(oi.quantity::numeric * oi.cost_price), 0)                        AS total_cost,
  COALESCE(AVG(oi.price - oi.cost_price), 0)::numeric                          AS avg_markup,
  COALESCE(SUM(oi.quantity::numeric * (oi.price - oi.cost_price)), 0)           AS total_markup,
  CASE
    WHEN COALESCE(AVG(oi.cost_price), 0) = 0 THEN 0
    ELSE (AVG(oi.price - oi.cost_price) / AVG(oi.cost_price)) * 100
  END::numeric                                                                  AS avg_markup_pct
FROM order_items oi
JOIN orders o            ON o.id   = oi.order_id  AND o.deleted_at = 0 AND o.bill_status = 'paid'
LEFT JOIN users u        ON u.id   = o.waiter_id  AND u.deleted_at = 0
LEFT JOIN users cas      ON cas.id = o.cashier_id AND cas.deleted_at = 0
LEFT JOIN cafe_tables ct ON ct.id  = o.table_id
LEFT JOIN halls h        ON h.id   = ct.hall_id   AND h.deleted_at = 0
WHERE oi.deleted_at = 0
  AND oi.good_id = $1
  AND o.created_at >= $2
  AND o.created_at <  $3
  AND o.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
  AND (NULLIF($4::text, '') IS NULL OR o.waiter_id = NULLIF($4::text, '')::uuid)
  AND (NULLIF($5::text, '') IS NULL OR ct.hall_id  = NULLIF($5::text, '')::uuid)
  AND (NULLIF($6::text, '') IS NULL OR o.table_id  = NULLIF($6::text, '')::uuid)
GROUP BY o.id, o.bill_no, o.bill_status, o.bill_opened_at, o.bill_closed_at,
         u.full_name, h.name, ct.number
ORDER BY o.bill_opened_at DESC
LIMIT  $7
OFFSET $8;

-- name: GoodOrdersReportTotals :one
SELECT
  COALESCE(SUM(oi.quantity), 0)::bigint                                         AS total_qty,
  COALESCE(SUM(oi.quantity::numeric * oi.price), 0)                             AS total_sell,
  COALESCE(SUM(oi.quantity::numeric * oi.cost_price), 0)                        AS total_cost,
  COALESCE(SUM(oi.quantity::numeric * (oi.price - oi.cost_price)), 0)           AS total_markup,
  CASE
    WHEN COALESCE(SUM(oi.quantity::numeric * oi.cost_price), 0) = 0 THEN 0
    ELSE SUM(oi.quantity::numeric * (oi.price - oi.cost_price))
       / SUM(oi.quantity::numeric * oi.cost_price) * 100
  END::numeric                                                                  AS avg_markup_pct,
  COUNT(DISTINCT o.id)::bigint                                                  AS total_orders
FROM order_items oi
JOIN orders o            ON o.id  = oi.order_id  AND o.deleted_at = 0 AND o.bill_status = 'paid'
LEFT JOIN cafe_tables ct ON ct.id = o.table_id
WHERE oi.deleted_at = 0
  AND oi.good_id = $1
  AND o.created_at >= $2
  AND o.created_at <  $3
  AND o.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
  AND (NULLIF($4::text, '') IS NULL OR o.waiter_id = NULLIF($4::text, '')::uuid)
  AND (NULLIF($5::text, '') IS NULL OR ct.hall_id  = NULLIF($5::text, '')::uuid)
  AND (NULLIF($6::text, '') IS NULL OR o.table_id  = NULLIF($6::text, '')::uuid);
