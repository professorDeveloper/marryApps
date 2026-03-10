-- ==================== INVOICES QUERIES ====================

-- name: CreateInvoice :one
INSERT INTO invoices (id, supplier_id, storage_id, total_amount, status, date, branch_id)
VALUES ($1, $2, $3, $4, $5, $6, (SELECT branch_id FROM storages WHERE id = $3))
RETURNING id, supplier_id, storage_id, branch_id, total_amount, status, date, created_at, updated_at, deleted_at;

-- name: GetInvoiceByID :one
SELECT id, supplier_id, storage_id, branch_id, total_amount, status, date, created_at, updated_at, deleted_at
FROM invoices
WHERE invoices.id = $1
  AND branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
  AND deleted_at = 0;

-- name: GetAllInvoices :many
SELECT id, supplier_id, storage_id, branch_id, total_amount, status, date, created_at, updated_at, deleted_at
FROM invoices
WHERE branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
ORDER BY date DESC
LIMIT $1 OFFSET $2;

-- name: GetInvoicesByStatus :many
SELECT id, supplier_id, storage_id, branch_id, total_amount, status, date, created_at, updated_at, deleted_at
FROM invoices
WHERE status = $1
  AND branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
ORDER BY date DESC
LIMIT $2 OFFSET $3;

-- name: GetInvoicesBySupplier :many
SELECT i.id, i.supplier_id, i.storage_id, i.branch_id, i.total_amount, i.status, i.date, i.created_at, i.updated_at, i.deleted_at
FROM invoices i
JOIN suppliers s ON i.supplier_id = s.id AND s.deleted_at = 0
WHERE s.name ILIKE '%' || $1 || '%'
  AND i.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
ORDER BY i.date DESC
LIMIT $2 OFFSET $3;

-- name: GetInvoicesByDateRange :many
SELECT id, supplier_id, storage_id, branch_id, total_amount, status, date, created_at, updated_at, deleted_at
FROM invoices
WHERE date >= $1
  AND date <= $2
  AND branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
ORDER BY date DESC
LIMIT $3 OFFSET $4;

-- name: UpdateInvoice :one
UPDATE invoices
SET supplier_id = COALESCE($2, supplier_id),
    storage_id = COALESCE($3, storage_id),
    total_amount = COALESCE($4, total_amount),
    status = COALESCE($5, status),
    date = COALESCE($6, date),
    updated_at = NOW(),
    branch_id = COALESCE((SELECT branch_id FROM storages WHERE id = COALESCE($3, storage_id)), branch_id)
WHERE invoices.id = $1
  AND branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
  AND deleted_at = 0
RETURNING id, supplier_id, storage_id, branch_id, total_amount, status, date, created_at, updated_at, deleted_at;

-- name: UpdateInvoiceStatus :one
UPDATE invoices
SET status = $2,
    updated_at = NOW()
WHERE invoices.id = $1
  AND branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
  AND deleted_at = 0
RETURNING id, supplier_id, storage_id, branch_id, total_amount, status, date, created_at, updated_at, deleted_at;

-- name: MarkInvoiceArrived :one
UPDATE invoices
SET status = 'arrived',
    updated_at = NOW()
WHERE invoices.id = $1
  AND branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
  AND deleted_at = 0
RETURNING id, supplier_id, storage_id, branch_id, total_amount, status, date, created_at, updated_at, deleted_at;

-- name: MarkInvoiceReceived :one
UPDATE invoices
SET status = 'received',
    updated_at = NOW()
WHERE invoices.id = $1
  AND branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
  AND deleted_at = 0
RETURNING id, supplier_id, storage_id, branch_id, total_amount, status, date, created_at, updated_at, deleted_at;

-- name: CancelInvoice :one
UPDATE invoices
SET status = 'cancelled',
    updated_at = NOW()
WHERE invoices.id = $1
  AND branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
  AND deleted_at = 0
RETURNING id, supplier_id, storage_id, branch_id, total_amount, status, date, created_at, updated_at, deleted_at;

-- name: DeleteInvoice :exec
UPDATE invoices
SET deleted_at = EXTRACT(EPOCH FROM NOW())::BIGINT
WHERE invoices.id = $1
  AND branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
  AND deleted_at = 0;

-- name: RestoreInvoice :exec
UPDATE invoices
SET deleted_at = 0
WHERE invoices.id = $1
  AND branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
  AND deleted_at != 0;

-- name: CountInvoices :one
SELECT COUNT(*) FROM invoices
WHERE branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid;

-- name: GetFilteredInvoices :many
SELECT i.id, i.supplier_id, i.storage_id, i.branch_id, i.total_amount, i.status, i.date, i.created_at, i.updated_at, i.deleted_at
FROM invoices i
WHERE i.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
  AND i.deleted_at = 0
  AND ($1::timestamp IS NULL OR i.date >= $1)
  AND ($2::timestamp IS NULL OR i.date <= $2)
  AND (NULLIF($3::text, '')::uuid IS NULL OR i.storage_id = NULLIF($3::text, '')::uuid)
  AND (NULLIF($4::text, '')::uuid IS NULL OR i.supplier_id = NULLIF($4::text, '')::uuid)
  AND ($5 = '' OR i.status::text = $5)
  AND (NULLIF($6::text, '')::uuid IS NULL OR EXISTS (
    SELECT 1 FROM invoice_detailed id_t
    WHERE id_t.invoice_id = i.id AND id_t.ingredient_id = NULLIF($6::text, '')::uuid AND id_t.deleted_at = 0
  ))
ORDER BY i.date DESC
LIMIT $7 OFFSET $8;

-- name: CountFilteredInvoices :one
SELECT COUNT(*) FROM invoices i
WHERE i.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
  AND i.deleted_at = 0
  AND ($1::timestamp IS NULL OR i.date >= $1)
  AND ($2::timestamp IS NULL OR i.date <= $2)
  AND (NULLIF($3::text, '')::uuid IS NULL OR i.storage_id = NULLIF($3::text, '')::uuid)
  AND (NULLIF($4::text, '')::uuid IS NULL OR i.supplier_id = NULLIF($4::text, '')::uuid)
  AND ($5 = '' OR i.status::text = $5)
  AND (NULLIF($6::text, '')::uuid IS NULL OR EXISTS (
    SELECT 1 FROM invoice_detailed id_t
    WHERE id_t.invoice_id = i.id AND id_t.ingredient_id = NULLIF($6::text, '')::uuid AND id_t.deleted_at = 0
  ));

-- name: CountInvoicesByStatus :one
SELECT COUNT(*) FROM invoices
WHERE status = $1
  AND branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid;

-- name: SearchInvoices :many
SELECT i.id, i.supplier_id, i.storage_id, i.branch_id, i.total_amount, i.status, i.date, i.created_at, i.updated_at, i.deleted_at
FROM invoices i
JOIN suppliers s ON i.supplier_id = s.id AND s.deleted_at = 0
WHERE i.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
AND (
    s.name ILIKE '%' || $1 || '%' OR
    s.phone_number ILIKE '%' || $1 || '%'
)
ORDER BY i.date DESC
LIMIT $2 OFFSET $3;


-- ==================== INVOICE DETAILED QUERIES ====================

-- name: CreateInvoiceDetail :one
INSERT INTO invoice_detailed (id, invoice_id, ingredient_id, quantity, price, price_per_unit)
VALUES ($1, $2, $3, $4, $5, $6)
RETURNING id, invoice_id, ingredient_id, quantity, price, price_per_unit, created_at, updated_at, deleted_at;

-- name: GetInvoiceDetailByID :one
SELECT id, invoice_id, ingredient_id, quantity, price, price_per_unit, created_at, updated_at, deleted_at
FROM invoice_detailed
WHERE invoice_detailed.id = $1 AND invoice_detailed.deleted_at = 0
  AND EXISTS (
    SELECT 1 FROM invoices i
    WHERE i.id = invoice_detailed.invoice_id
      AND i.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
  );

-- name: GetAllInvoiceDetails :many
SELECT id, invoice_id, ingredient_id, quantity, price, price_per_unit, created_at, updated_at, deleted_at
FROM invoice_detailed
WHERE deleted_at = 0
  AND EXISTS (
    SELECT 1 FROM invoices i
    WHERE i.id = invoice_detailed.invoice_id
      AND i.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
  )
ORDER BY created_at DESC
LIMIT $1 OFFSET $2;

-- name: GetInvoiceDetailsByInvoiceID :many
SELECT id, invoice_id, ingredient_id, quantity, price, price_per_unit, created_at, updated_at, deleted_at
FROM invoice_detailed
WHERE invoice_id = $1 AND deleted_at = 0
  AND EXISTS (
    SELECT 1 FROM invoices i
    WHERE i.id = invoice_detailed.invoice_id
      AND i.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
  )
ORDER BY created_at ASC
LIMIT $2 OFFSET $3;

-- name: GetInvoiceDetailsByIngredientID :many
SELECT id, invoice_id, ingredient_id, quantity, price, price_per_unit, created_at, updated_at, deleted_at
FROM invoice_detailed
WHERE ingredient_id = $1 AND deleted_at = 0
  AND EXISTS (
    SELECT 1 FROM invoices i
    WHERE i.id = invoice_detailed.invoice_id
      AND i.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
  )
ORDER BY created_at DESC
LIMIT $2 OFFSET $3;

-- name: GetLatestInvoiceDetailByIngredientID :one
SELECT id, invoice_id, ingredient_id, quantity, price, price_per_unit, created_at, updated_at, deleted_at
FROM invoice_detailed
WHERE ingredient_id = $1 AND deleted_at = 0
  AND EXISTS (
    SELECT 1 FROM invoices i
    WHERE i.id = invoice_detailed.invoice_id
      AND i.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
  )
ORDER BY created_at DESC
LIMIT 1;

-- name: UpdateInvoiceDetail :one
UPDATE invoice_detailed
SET ingredient_id = $2,
    quantity = $3,
    price = $4,
    price_per_unit = $5,
    updated_at = NOW()
WHERE invoice_detailed.id = $1 AND invoice_detailed.deleted_at = 0
  AND EXISTS (
    SELECT 1 FROM invoices i
    WHERE i.id = invoice_detailed.invoice_id
      AND i.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
  )
RETURNING id, invoice_id, ingredient_id, quantity, price, price_per_unit, created_at, updated_at, deleted_at;

-- name: UpdateInvoiceDetailQuantity :one
UPDATE invoice_detailed
SET quantity = $2,
    price = $2 * price_per_unit,
    updated_at = NOW()
WHERE invoice_detailed.id = $1 AND invoice_detailed.deleted_at = 0
  AND EXISTS (
    SELECT 1 FROM invoices i
    WHERE i.id = invoice_detailed.invoice_id
      AND i.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
  )
RETURNING id, invoice_id, ingredient_id, quantity, price, price_per_unit, created_at, updated_at, deleted_at;


-- name: DeleteInvoiceDetail :exec
UPDATE invoice_detailed
SET deleted_at = EXTRACT(EPOCH FROM NOW())::BIGINT
WHERE invoice_detailed.id = $1 AND invoice_detailed.deleted_at = 0
  AND EXISTS (
    SELECT 1 FROM invoices i
    WHERE i.id = invoice_detailed.invoice_id
      AND i.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
  );

-- name: RestoreInvoiceDetail :exec
UPDATE invoice_detailed
SET deleted_at = 0
WHERE invoice_detailed.id = $1 AND invoice_detailed.deleted_at != 0
  AND EXISTS (
    SELECT 1 FROM invoices i
    WHERE i.id = invoice_detailed.invoice_id
      AND i.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
  );

-- name: DeleteInvoiceDetailsByInvoiceID :exec
UPDATE invoice_detailed
SET deleted_at = EXTRACT(EPOCH FROM NOW())::BIGINT
WHERE invoice_id = $1 AND deleted_at = 0
  AND EXISTS (
    SELECT 1 FROM invoices i
    WHERE i.id = invoice_detailed.invoice_id
      AND i.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
  );

-- name: CountInvoiceDetails :one
SELECT COUNT(*) FROM invoice_detailed
WHERE deleted_at = 0
  AND EXISTS (
    SELECT 1 FROM invoices i
    WHERE i.id = invoice_detailed.invoice_id
      AND i.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
  );

-- name: CountInvoiceDetailsByInvoice :one
SELECT COUNT(*) FROM invoice_detailed
WHERE invoice_id = $1 AND deleted_at = 0
  AND EXISTS (
    SELECT 1 FROM invoices i
    WHERE i.id = invoice_detailed.invoice_id
      AND i.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
  );

-- name: CountInvoiceDetailsByIngredient :one
SELECT COUNT(*) FROM invoice_detailed
WHERE ingredient_id = $1 AND deleted_at = 0
  AND EXISTS (
    SELECT 1 FROM invoices i
    WHERE i.id = invoice_detailed.invoice_id
      AND i.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
  );



-- name: GetInvoiceWithDetails :one
SELECT 
    i.id,
    i.supplier_id,
    i.storage_id,
    i.total_amount,
    i.status,
    i.date,
    i.created_at,
    i.updated_at,
    i.branch_id,
    COUNT(id_table.id) as item_count,
    (COALESCE(SUM(id_table.quantity), 0::numeric))::numeric(18,6) as total_quantity
FROM invoices i
LEFT JOIN invoice_detailed id_table ON i.id = id_table.invoice_id AND id_table.deleted_at = 0
WHERE i.id = $1 AND i.deleted_at = 0
  AND i.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
GROUP BY i.id, i.supplier_id, i.storage_id, i.total_amount, i.status, i.date, i.created_at, i.updated_at, i.branch_id;

-- name: GetInvoiceStatsBySupplier :many
SELECT 
    s.name as supplier_name,
    COUNT(*) as invoice_count,
    SUM(i.total_amount) as total_spent,
    AVG(i.total_amount) as avg_invoice_amount,
    MAX(i.date) as last_order_date
FROM invoices i
JOIN suppliers s ON i.supplier_id = s.id AND s.deleted_at = 0
WHERE i.deleted_at = 0
  AND i.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
GROUP BY s.name
ORDER BY total_spent DESC
LIMIT $1 OFFSET $2;

-- name: GetInvoiceStatsByDateRange :one
SELECT 
    COUNT(*) as invoice_count,
    SUM(total_amount) as total_spent,
    AVG(total_amount) as avg_invoice_amount,
    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count,
    COUNT(CASE WHEN status = 'arrived' THEN 1 END) as arrived_count,
    COUNT(CASE WHEN status = 'received' THEN 1 END) as received_count,
    COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_count
FROM invoices
WHERE date >= $1 AND date <= $2 AND deleted_at = 0
  AND branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid;

-- name: GetInvoiceDetailWithIngredient :one
SELECT 
    id_table.id,
    id_table.invoice_id,
    id_table.ingredient_id,
    id_table.quantity,
    id_table.price,
    id_table.price_per_unit,
    id_table.created_at,
    id_table.updated_at,
    ing.name as ingredient_name,
    ing.measurement as ingredient_measurement,
    ing.picture_url as ingredient_picture
FROM invoice_detailed id_table
LEFT JOIN ingredients ing ON id_table.ingredient_id = ing.id AND ing.deleted_at = 0
WHERE id_table.id = $1 AND id_table.deleted_at = 0
  AND EXISTS (
    SELECT 1 FROM invoices i
    WHERE i.id = id_table.invoice_id
      AND i.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
  );
