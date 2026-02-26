-- name: CreateOutgoingInvoice :one
INSERT INTO outgoing_invoices (
  id, date, storage_id, group_id, branch_id, description, status
)
VALUES (
  gen_random_uuid(), $1, $2, $3,
  NULLIF(current_setting('app.branch_id', true), '')::uuid,
  $4, 'active'
)
RETURNING id, number, date, storage_id, group_id, branch_id, description, status, total_amount, created_at, updated_at, deleted_at;

-- name: GetOutgoingInvoiceByID :one
SELECT id, number, date, storage_id, group_id, branch_id, description, status, total_amount, created_at, updated_at, deleted_at
FROM outgoing_invoices
WHERE id = $1 AND deleted_at = 0
  AND branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid;

-- name: ListOutgoingInvoices :many
SELECT id, number, date, storage_id, group_id, branch_id, description, status, total_amount, created_at, updated_at, deleted_at
FROM outgoing_invoices
WHERE deleted_at = 0
  AND branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
  AND (NULLIF($1::text, '')::uuid IS NULL OR storage_id = NULLIF($1::text, '')::uuid)
  AND (NULLIF($2::text, '')::uuid IS NULL OR group_id   = NULLIF($2::text, '')::uuid)
  AND (NULLIF($3::text, '')::outgoing_invoice_status IS NULL OR status = NULLIF($3::text, '')::outgoing_invoice_status)
  AND ($4::timestamp IS NULL OR date >= $4)
  AND ($5::timestamp IS NULL OR date <= $5)
ORDER BY date DESC, number DESC
LIMIT $6 OFFSET $7;

-- name: CountOutgoingInvoices :one
SELECT COUNT(*) FROM outgoing_invoices
WHERE deleted_at = 0
  AND branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
  AND (NULLIF($1::text, '')::uuid IS NULL OR storage_id = NULLIF($1::text, '')::uuid)
  AND (NULLIF($2::text, '')::uuid IS NULL OR group_id   = NULLIF($2::text, '')::uuid)
  AND (NULLIF($3::text, '')::outgoing_invoice_status IS NULL OR status = NULLIF($3::text, '')::outgoing_invoice_status)
  AND ($4::timestamp IS NULL OR date >= $4)
  AND ($5::timestamp IS NULL OR date <= $5);

-- name: SumOutgoingInvoices :one
SELECT COALESCE(SUM(total_amount), 0)::numeric(15,2) FROM outgoing_invoices
WHERE deleted_at = 0
  AND branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
  AND (NULLIF($1::text, '')::uuid IS NULL OR storage_id = NULLIF($1::text, '')::uuid)
  AND (NULLIF($2::text, '')::uuid IS NULL OR group_id   = NULLIF($2::text, '')::uuid)
  AND (NULLIF($3::text, '')::outgoing_invoice_status IS NULL OR status = NULLIF($3::text, '')::outgoing_invoice_status)
  AND ($4::timestamp IS NULL OR date >= $4)
  AND ($5::timestamp IS NULL OR date <= $5);

-- name: UpdateOutgoingInvoice :one
UPDATE outgoing_invoices
SET date        = COALESCE($2, date),
    storage_id  = COALESCE($3, storage_id),
    group_id    = COALESCE($4, group_id),
    description = COALESCE($5, description),
    updated_at  = NOW()
WHERE id = $1 AND deleted_at = 0 AND status = 'active'
  AND branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
RETURNING id, number, date, storage_id, group_id, branch_id, description, status, total_amount, created_at, updated_at, deleted_at;

-- name: ConfirmOutgoingInvoice :one
UPDATE outgoing_invoices
SET updated_at = NOW()
WHERE id = $1 AND deleted_at = 0 AND status = 'active'
  AND branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
RETURNING id, number, date, storage_id, group_id, branch_id, description, status, total_amount, created_at, updated_at, deleted_at;

-- name: CancelOutgoingInvoice :one
UPDATE outgoing_invoices
SET status     = 'cancelled',
    updated_at = NOW()
WHERE id = $1 AND deleted_at = 0 AND status = 'active'
  AND branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
RETURNING id, number, date, storage_id, group_id, branch_id, description, status, total_amount, created_at, updated_at, deleted_at;

-- name: DeleteOutgoingInvoice :exec
UPDATE outgoing_invoices
SET deleted_at = EXTRACT(EPOCH FROM NOW())::BIGINT,
    updated_at = NOW()
WHERE id = $1 AND deleted_at = 0 AND status = 'active'
  AND branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid;

-- name: UpdateOutgoingInvoiceTotalAmount :one
UPDATE outgoing_invoices
SET total_amount = $2,
    updated_at  = NOW()
WHERE id = $1 AND deleted_at = 0
RETURNING id, number, date, storage_id, group_id, branch_id, description, status, total_amount, created_at, updated_at, deleted_at;

-- ==================== OUTGOING INVOICE ITEMS ====================

-- name: UpsertOutgoingInvoiceItem :one
INSERT INTO outgoing_invoice_items (
  id, outgoing_invoice_id, ingredient_id, quantity, price_per_unit, total_amount
)
VALUES (
  gen_random_uuid(), $1, $2, $3, $4, $3::numeric * $4::numeric
)
ON CONFLICT (outgoing_invoice_id, ingredient_id) WHERE deleted_at = 0
DO UPDATE SET
  quantity       = EXCLUDED.quantity,
  price_per_unit = EXCLUDED.price_per_unit,
  total_amount   = EXCLUDED.total_amount,
  updated_at     = NOW()
RETURNING id, outgoing_invoice_id, ingredient_id, quantity, price_per_unit, total_amount, stock_before, stock_after, created_at, updated_at, deleted_at;

-- name: GetOutgoingInvoiceItemsByInvoiceID :many
SELECT id, outgoing_invoice_id, ingredient_id, quantity, price_per_unit, total_amount, stock_before, stock_after, created_at, updated_at, deleted_at
FROM outgoing_invoice_items
WHERE outgoing_invoice_id = $1 AND deleted_at = 0
ORDER BY created_at ASC;

-- name: GetOutgoingInvoiceItemByID :one
SELECT id, outgoing_invoice_id, ingredient_id, quantity, price_per_unit, total_amount, stock_before, stock_after, created_at, updated_at, deleted_at
FROM outgoing_invoice_items
WHERE id = $1 AND deleted_at = 0;

-- name: DeleteOutgoingInvoiceItem :exec
UPDATE outgoing_invoice_items
SET deleted_at = EXTRACT(EPOCH FROM NOW())::BIGINT,
    updated_at = NOW()
WHERE id = $1 AND deleted_at = 0;

-- name: UpdateOutgoingInvoiceItemStockSnapshot :one
UPDATE outgoing_invoice_items
SET stock_before = $2,
    stock_after  = $3,
    updated_at   = NOW()
WHERE id = $1
RETURNING id, outgoing_invoice_id, ingredient_id, quantity, price_per_unit, total_amount, stock_before, stock_after, created_at, updated_at, deleted_at;
