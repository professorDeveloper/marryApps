-- name: GetDashboardKPIs :one
SELECT
  COALESCE(SUM(o.grand_total), 0)::numeric AS revenue,
  COUNT(DISTINCT o.id)::bigint AS checks_count,
  CASE
    WHEN COUNT(DISTINCT o.id) = 0 THEN 0
    ELSE COALESCE(SUM(o.grand_total), 0) / COUNT(DISTINCT o.id)
  END::numeric AS average_check,
  0::bigint AS returns_count,
  COALESCE(SUM(o.discount_amount), 0)::numeric AS discounts_amount,
  0::numeric AS vat_amount
FROM orders o
WHERE o.deleted_at = 0
  AND o.bill_status = 'paid'
  AND o.created_at >= $1
  AND o.created_at < $2
  AND o.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid;

-- name: GetDashboardSalesDynamics :many
SELECT
  CASE
    WHEN $3::text = 'day' THEN TO_CHAR(o.created_at, 'YYYY-MM-DD')
    WHEN $3::text = 'week' THEN 'W' || TO_CHAR(o.created_at, 'YYYY-IW')
    WHEN $3::text = 'month' THEN TO_CHAR(o.created_at, 'YYYY-MM')
    ELSE TO_CHAR(o.created_at, 'YYYY-MM-DD')
  END AS period,
  CASE
    WHEN $3::text = 'day' THEN TO_CHAR(o.created_at, 'DD')
    WHEN $3::text = 'week' THEN TO_CHAR(o.created_at, 'IW')
    WHEN $3::text = 'month' THEN TO_CHAR(o.created_at, 'MM')
    ELSE TO_CHAR(o.created_at, 'DD')
  END AS label,
  COALESCE(SUM(o.grand_total), 0)::numeric AS revenue,
  COUNT(DISTINCT o.id)::bigint AS checks_count,
  CASE
    WHEN COUNT(DISTINCT o.id) = 0 THEN 0
    ELSE COALESCE(SUM(o.grand_total), 0) / COUNT(DISTINCT o.id)
  END::numeric AS average_check
FROM orders o
WHERE o.deleted_at = 0
  AND o.bill_status = 'paid'
  AND o.created_at >= $1
  AND o.created_at < $2
  AND o.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
GROUP BY
  CASE
    WHEN $3::text = 'day' THEN TO_CHAR(o.created_at, 'YYYY-MM-DD')
    WHEN $3::text = 'week' THEN 'W' || TO_CHAR(o.created_at, 'YYYY-IW')
    WHEN $3::text = 'month' THEN TO_CHAR(o.created_at, 'YYYY-MM')
    ELSE TO_CHAR(o.created_at, 'YYYY-MM-DD')
  END,
  CASE
    WHEN $3::text = 'day' THEN TO_CHAR(o.created_at, 'DD')
    WHEN $3::text = 'week' THEN TO_CHAR(o.created_at, 'IW')
    WHEN $3::text = 'month' THEN TO_CHAR(o.created_at, 'MM')
    ELSE TO_CHAR(o.created_at, 'DD')
  END
ORDER BY period ASC;

-- name: GetDashboardRevenueByPaymentTypes :many
WITH payment_totals AS (
  SELECT
    COALESCE(o.payment_type::text, 'unknown') AS payment_type,
    COALESCE(SUM(o.grand_total), 0)::numeric AS revenue
  FROM orders o
  WHERE o.deleted_at = 0
    AND o.bill_status = 'paid'
    AND o.created_at >= $1
    AND o.created_at < $2
    AND o.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
  GROUP BY o.payment_type
)
SELECT
  payment_type,
  revenue,
  ROUND(
    CASE
      WHEN (SELECT SUM(revenue) FROM payment_totals) = 0 THEN 0::numeric
      ELSE (revenue / (SELECT SUM(revenue) FROM payment_totals)) * 100
    END::numeric, 2
  ) AS percent
FROM payment_totals
ORDER BY revenue DESC;

-- name: GetDashboardRevenueByCategories :many
WITH category_totals AS (
  SELECT
    c.id::text AS category_id,
    COALESCE(c.name,
      CASE
        WHEN $3::text = 'ru' THEN 'Без названия'
        WHEN $3::text = 'uz' THEN 'Nomsiz'
        ELSE 'Unnamed'
      END
    ) AS category_name,
    COALESCE(SUM(oi.quantity::numeric * oi.price), 0)::numeric AS revenue
  FROM orders o
  JOIN order_items oi ON oi.order_id = o.id AND oi.deleted_at = 0
  JOIN goods g ON g.id = oi.good_id AND g.deleted_at = 0
  LEFT JOIN categories c ON c.id = g.category_id AND c.deleted_at = 0
  WHERE o.deleted_at = 0
    AND o.bill_status = 'paid'
    AND o.created_at >= $1
    AND o.created_at < $2
    AND o.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
  GROUP BY c.id, c.name
)
SELECT
  category_id,
  category_name,
  revenue,
  ROUND(
    CASE
      WHEN (SELECT SUM(revenue) FROM category_totals) = 0 THEN 0::numeric
      ELSE (revenue / (SELECT SUM(revenue) FROM category_totals)) * 100
    END::numeric, 2
  ) AS percent
FROM category_totals
ORDER BY revenue DESC;

-- name: GetDashboardDishSales :many
SELECT
  g.id::text AS good_id,
  g.name AS good_name,
  COALESCE(SUM(oi.quantity::numeric * oi.price), 0)::numeric AS revenue,
  COALESCE(SUM(oi.quantity::numeric), 0)::numeric AS quantity
FROM order_items oi
JOIN orders o ON o.id = oi.order_id AND o.deleted_at = 0 AND o.bill_status = 'paid'
JOIN goods g ON g.id = oi.good_id AND g.deleted_at = 0
WHERE oi.deleted_at = 0
  AND o.created_at >= $1
  AND o.created_at < $2
  AND o.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
GROUP BY g.id, g.name
ORDER BY
  CASE
    WHEN $3::text = 'revenue' AND $4::text = 'asc' THEN COALESCE(SUM(oi.quantity::numeric * oi.price), 0)
  END ASC,
  CASE
    WHEN $3::text = 'revenue' AND $4::text = 'desc' THEN COALESCE(SUM(oi.quantity::numeric * oi.price), 0)
  END DESC,
  CASE
    WHEN $3::text = 'quantity' AND $4::text = 'asc' THEN COALESCE(SUM(oi.quantity::numeric), 0)
  END ASC,
  CASE
    WHEN $3::text = 'quantity' AND $4::text = 'desc' THEN COALESCE(SUM(oi.quantity::numeric), 0)
  END DESC,
  g.name
LIMIT $5;
