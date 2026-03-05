-- name: CreateShipment :one
INSERT INTO shipments (
  id, date, storage_id, supplier_id, branch_id, description, status
)
VALUES (
  gen_random_uuid(), $1, $2, $3,
  NULLIF(current_setting('app.branch_id', true), '')::uuid,
  $4, 'active'
)
RETURNING id, number, date, storage_id, supplier_id, branch_id, description, status, total_amount, paid_amount, created_at, updated_at, deleted_at;

-- name: GetShipmentByID :one
SELECT id, number, date, storage_id, supplier_id, branch_id, description, status, total_amount, paid_amount, created_at, updated_at, deleted_at
FROM shipments
WHERE id = $1 AND deleted_at = 0
  AND branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid;

-- name: ListShipments :many
SELECT id, number, date, storage_id, supplier_id, branch_id, description, status, total_amount, paid_amount, created_at, updated_at, deleted_at
FROM shipments
WHERE branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
  AND (NULLIF($1::text, '')::uuid IS NULL OR storage_id  = NULLIF($1::text, '')::uuid)
  AND (NULLIF($2::text, '')::uuid IS NULL OR supplier_id = NULLIF($2::text, '')::uuid)
  AND (NULLIF($3::text, '')::shipment_status IS NULL OR status = NULLIF($3::text, '')::shipment_status)
  AND ($4::timestamp IS NULL OR date >= $4)
  AND ($5::timestamp IS NULL OR date <= $5)
ORDER BY date DESC, number DESC
LIMIT $6 OFFSET $7;

-- name: CountShipments :one
SELECT COUNT(*) FROM shipments
WHERE branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
  AND (NULLIF($1::text, '')::uuid IS NULL OR storage_id  = NULLIF($1::text, '')::uuid)
  AND (NULLIF($2::text, '')::uuid IS NULL OR supplier_id = NULLIF($2::text, '')::uuid)
  AND (NULLIF($3::text, '')::shipment_status IS NULL OR status = NULLIF($3::text, '')::shipment_status)
  AND ($4::timestamp IS NULL OR date >= $4)
  AND ($5::timestamp IS NULL OR date <= $5);

-- name: UpdateShipment :one
UPDATE shipments
SET date        = COALESCE($2, date),
    storage_id  = COALESCE($3, storage_id),
    supplier_id = COALESCE($4, supplier_id),
    description = COALESCE($5, description),
    updated_at  = NOW()
WHERE id = $1 AND deleted_at = 0 AND status = 'active'
  AND branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
RETURNING id, number, date, storage_id, supplier_id, branch_id, description, status, total_amount, paid_amount, created_at, updated_at, deleted_at;

-- name: ConfirmShipment :one
UPDATE shipments
SET updated_at = NOW()
WHERE id = $1 AND deleted_at = 0 AND status = 'active'
  AND branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
RETURNING id, number, date, storage_id, supplier_id, branch_id, description, status, total_amount, paid_amount, created_at, updated_at, deleted_at;

-- name: CancelShipment :one
UPDATE shipments
SET status     = 'cancelled',
    updated_at = NOW()
WHERE id = $1 AND deleted_at = 0 AND status = 'active'
  AND branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
RETURNING id, number, date, storage_id, supplier_id, branch_id, description, status, total_amount, paid_amount, created_at, updated_at, deleted_at;

-- name: DeleteShipment :exec
UPDATE shipments
SET deleted_at = EXTRACT(EPOCH FROM NOW())::BIGINT,
    updated_at = NOW()
WHERE id = $1 AND deleted_at = 0 AND status = 'active'
  AND branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid;

-- name: UpdateShipmentTotalAmount :one
UPDATE shipments
SET total_amount = $2,
    updated_at  = NOW()
WHERE id = $1 AND deleted_at = 0
RETURNING id, number, date, storage_id, supplier_id, branch_id, description, status, total_amount, paid_amount, created_at, updated_at, deleted_at;

-- ==================== SHIPMENT ITEMS ====================

-- name: UpsertShipmentItem :one
INSERT INTO shipment_items (
  id, shipment_id, ingredient_id, quantity, price_per_unit, total_amount
)
VALUES (
  gen_random_uuid(), $1, $2, $3, $4, $3::numeric * $4::numeric
)
ON CONFLICT (shipment_id, ingredient_id) WHERE deleted_at = 0
DO UPDATE SET
  quantity       = EXCLUDED.quantity,
  price_per_unit = EXCLUDED.price_per_unit,
  total_amount   = EXCLUDED.total_amount,
  updated_at     = NOW()
RETURNING id, shipment_id, ingredient_id, quantity, price_per_unit, total_amount, stock_before, stock_after, created_at, updated_at, deleted_at;

-- name: GetShipmentItemsByShipmentID :many
SELECT id, shipment_id, ingredient_id, quantity, price_per_unit, total_amount, stock_before, stock_after, created_at, updated_at, deleted_at
FROM shipment_items
WHERE shipment_id = $1 AND deleted_at = 0
ORDER BY created_at ASC;

-- name: GetShipmentItemByID :one
SELECT id, shipment_id, ingredient_id, quantity, price_per_unit, total_amount, stock_before, stock_after, created_at, updated_at, deleted_at
FROM shipment_items
WHERE id = $1 AND deleted_at = 0;

-- name: DeleteShipmentItem :exec
UPDATE shipment_items
SET deleted_at = EXTRACT(EPOCH FROM NOW())::BIGINT,
    updated_at = NOW()
WHERE id = $1 AND deleted_at = 0;

-- name: UpdateShipmentItemStockSnapshot :one
UPDATE shipment_items
SET stock_before = $2,
    stock_after  = $3,
    updated_at   = NOW()
WHERE id = $1
RETURNING id, shipment_id, ingredient_id, quantity, price_per_unit, total_amount, stock_before, stock_after, created_at, updated_at, deleted_at;
