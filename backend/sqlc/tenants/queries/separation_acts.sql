-- name: CreateSeparationAct :one
INSERT INTO separation_acts (
  id, date, storage_id, source_ingredient_id, source_quantity, group_id, branch_id, description, status
)
VALUES (
  gen_random_uuid(), $1, $2, $3, $4, $5,
  NULLIF(current_setting('app.branch_id', true), '')::uuid,
  $6, 'draft'
)
RETURNING id, number, date, storage_id, source_ingredient_id, source_quantity, source_stock_before, source_stock_after, group_id, branch_id, description, status, total_amount, created_at, updated_at, deleted_at;

-- name: GetSeparationActByID :one
SELECT id, number, date, storage_id, source_ingredient_id, source_quantity, source_stock_before, source_stock_after, group_id, branch_id, description, status, total_amount, created_at, updated_at, deleted_at
FROM separation_acts
WHERE id = $1 AND deleted_at = 0
  AND branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid;

-- name: ListSeparationActs :many
SELECT
  sa.id, sa.number, sa.date, sa.storage_id,
  sa.source_ingredient_id, sa.source_quantity,
  sa.source_stock_before, sa.source_stock_after,
  sa.group_id, sa.branch_id, sa.description, sa.status,
  sa.total_amount, sa.created_at, sa.updated_at, sa.deleted_at,
  (sa.source_quantity - COALESCE(
    (SELECT SUM(sai.quantity) FROM separation_act_items sai
     WHERE sai.separation_act_id = sa.id AND sai.deleted_at = 0), 0
  ))::NUMERIC(18,6) AS waste_quantity
FROM separation_acts sa
WHERE sa.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
  AND (NULLIF($1::text, '')::uuid IS NULL OR sa.storage_id           = NULLIF($1::text, '')::uuid)
  AND (NULLIF($2::text, '')::uuid IS NULL OR sa.group_id             = NULLIF($2::text, '')::uuid)
  AND (NULLIF($3::text, '')::uuid IS NULL OR sa.source_ingredient_id = NULLIF($3::text, '')::uuid)
  AND (NULLIF($4::text, '')::separation_act_status IS NULL OR sa.status = NULLIF($4::text, '')::separation_act_status)
  AND ($5::timestamp IS NULL OR sa.date >= $5)
  AND ($6::timestamp IS NULL OR sa.date <= $6)
ORDER BY sa.date DESC, sa.number DESC
LIMIT $7 OFFSET $8;

-- name: CountSeparationActs :one
SELECT COUNT(*) FROM separation_acts
WHERE branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
  AND (NULLIF($1::text, '')::uuid IS NULL OR storage_id           = NULLIF($1::text, '')::uuid)
  AND (NULLIF($2::text, '')::uuid IS NULL OR group_id             = NULLIF($2::text, '')::uuid)
  AND (NULLIF($3::text, '')::uuid IS NULL OR source_ingredient_id = NULLIF($3::text, '')::uuid)
  AND (NULLIF($4::text, '')::separation_act_status IS NULL OR status = NULLIF($4::text, '')::separation_act_status)
  AND ($5::timestamp IS NULL OR date >= $5)
  AND ($6::timestamp IS NULL OR date <= $6);

-- name: SumSeparationActsTotalAmount :one
SELECT COALESCE(SUM(total_amount), 0)::numeric(15,2) FROM separation_acts
WHERE deleted_at = 0
  AND branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
  AND (NULLIF($1::text, '')::uuid IS NULL OR storage_id           = NULLIF($1::text, '')::uuid)
  AND (NULLIF($2::text, '')::uuid IS NULL OR group_id             = NULLIF($2::text, '')::uuid)
  AND (NULLIF($3::text, '')::uuid IS NULL OR source_ingredient_id = NULLIF($3::text, '')::uuid)
  AND (NULLIF($4::text, '')::separation_act_status IS NULL OR status = NULLIF($4::text, '')::separation_act_status)
  AND ($5::timestamp IS NULL OR date >= $5)
  AND ($6::timestamp IS NULL OR date <= $6);

-- name: SumSeparationActsSourceQty :one
SELECT COALESCE(SUM(source_quantity), 0)::numeric(18,6) FROM separation_acts
WHERE deleted_at = 0
  AND branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
  AND (NULLIF($1::text, '')::uuid IS NULL OR storage_id           = NULLIF($1::text, '')::uuid)
  AND (NULLIF($2::text, '')::uuid IS NULL OR group_id             = NULLIF($2::text, '')::uuid)
  AND (NULLIF($3::text, '')::uuid IS NULL OR source_ingredient_id = NULLIF($3::text, '')::uuid)
  AND (NULLIF($4::text, '')::separation_act_status IS NULL OR status = NULLIF($4::text, '')::separation_act_status)
  AND ($5::timestamp IS NULL OR date >= $5)
  AND ($6::timestamp IS NULL OR date <= $6);

-- name: UpdateSeparationAct :one
UPDATE separation_acts
SET date        = COALESCE($2, date),
    storage_id  = COALESCE($3, storage_id),
    group_id    = COALESCE($4, group_id),
    description = COALESCE($5, description),
    updated_at  = NOW()
WHERE id = $1 AND deleted_at = 0 AND status = 'draft'
  AND branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
RETURNING id, number, date, storage_id, source_ingredient_id, source_quantity, source_stock_before, source_stock_after, group_id, branch_id, description, status, total_amount, created_at, updated_at, deleted_at;

-- name: ConfirmSeparationAct :one
UPDATE separation_acts
SET status              = 'active',
    source_stock_before = $2,
    source_stock_after  = $3,
    updated_at          = NOW()
WHERE id = $1 AND deleted_at = 0 AND status = 'draft'
  AND branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
RETURNING id, number, date, storage_id, source_ingredient_id, source_quantity, source_stock_before, source_stock_after, group_id, branch_id, description, status, total_amount, created_at, updated_at, deleted_at;

-- name: CancelSeparationAct :one
UPDATE separation_acts
SET status     = 'cancelled',
    updated_at = NOW()
WHERE id = $1 AND deleted_at = 0 AND status = 'draft'
  AND branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
RETURNING id, number, date, storage_id, source_ingredient_id, source_quantity, source_stock_before, source_stock_after, group_id, branch_id, description, status, total_amount, created_at, updated_at, deleted_at;

-- name: DeleteSeparationAct :exec
UPDATE separation_acts
SET deleted_at = EXTRACT(EPOCH FROM NOW())::BIGINT,
    updated_at = NOW()
WHERE id = $1 AND deleted_at = 0
  AND branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid;

-- name: UpdateSeparationActTotalAmount :one
UPDATE separation_acts
SET total_amount = $2,
    updated_at   = NOW()
WHERE id = $1 AND deleted_at = 0
RETURNING id, number, date, storage_id, source_ingredient_id, source_quantity, source_stock_before, source_stock_after, group_id, branch_id, description, status, total_amount, created_at, updated_at, deleted_at;

-- ==================== SEPARATION ACT ITEMS ====================

-- name: UpsertSeparationActItem :one
INSERT INTO separation_act_items (
  id, separation_act_id, ingredient_id, storage_id, quantity, price_per_unit, total_amount
)
VALUES (
  gen_random_uuid(), $1, $2, $3, $4, $5, $4::numeric * $5::numeric
)
ON CONFLICT (separation_act_id, ingredient_id) WHERE deleted_at = 0
DO UPDATE SET
  storage_id     = EXCLUDED.storage_id,
  quantity       = EXCLUDED.quantity,
  price_per_unit = EXCLUDED.price_per_unit,
  total_amount   = EXCLUDED.total_amount,
  updated_at     = NOW()
RETURNING id, separation_act_id, ingredient_id, storage_id, quantity, price_per_unit, total_amount, stock_before, stock_after, created_at, updated_at, deleted_at;

-- name: GetSeparationActItemsByActID :many
SELECT id, separation_act_id, ingredient_id, storage_id, quantity, price_per_unit, total_amount, stock_before, stock_after, created_at, updated_at, deleted_at
FROM separation_act_items
WHERE separation_act_id = $1 AND deleted_at = 0
ORDER BY created_at ASC;

-- name: GetSeparationActItemByID :one
SELECT id, separation_act_id, ingredient_id, storage_id, quantity, price_per_unit, total_amount, stock_before, stock_after, created_at, updated_at, deleted_at
FROM separation_act_items
WHERE id = $1 AND deleted_at = 0;

-- name: DeleteSeparationActItem :exec
UPDATE separation_act_items
SET deleted_at = EXTRACT(EPOCH FROM NOW())::BIGINT,
    updated_at = NOW()
WHERE id = $1 AND deleted_at = 0;

-- name: UpdateSeparationActItemStockSnapshot :one
UPDATE separation_act_items
SET stock_before = $2,
    stock_after  = $3,
    updated_at   = NOW()
WHERE id = $1
RETURNING id, separation_act_id, ingredient_id, storage_id, quantity, price_per_unit, total_amount, stock_before, stock_after, created_at, updated_at, deleted_at;
