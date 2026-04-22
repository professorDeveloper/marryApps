-- ==================== TRANSFERS ====================

-- name: CreateTransfer :one
INSERT INTO transfers (id, from_branch_id, to_branch_id, from_storage_id, to_storage_id, act_group_id, description, status, date, total_amount, created_at, updated_at, deleted_at)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW(), 0)
RETURNING *;

-- name: GetTransferByID :one
SELECT * FROM transfers
WHERE id = $1 AND deleted_at = 0
  AND (NULLIF(current_setting('app.branch_id', true), '') IS NULL
       OR from_branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
       OR to_branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid);

-- name: GetAllTransfers :many
SELECT * FROM transfers
WHERE (NULLIF(current_setting('app.branch_id', true), '') IS NULL
       OR from_branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
       OR to_branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid)
ORDER BY created_at DESC
LIMIT $1 OFFSET $2;

-- name: UpdateTransfer :one
UPDATE transfers
SET from_branch_id = COALESCE($2, from_branch_id),
    to_branch_id = COALESCE($3, to_branch_id),
    from_storage_id = COALESCE($4, from_storage_id),
    to_storage_id = COALESCE($5, to_storage_id),
    act_group_id = COALESCE($6, act_group_id),
    description = COALESCE($7, description),
    status = COALESCE($8, status),
    date = COALESCE($9, date),
    total_amount = COALESCE($10, total_amount),
    updated_at = NOW()
WHERE id = $1 AND deleted_at = 0
  AND (NULLIF(current_setting('app.branch_id', true), '') IS NULL
       OR from_branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
       OR to_branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid)
RETURNING *;

-- name: UpdateTransferTotalAmount :exec
UPDATE transfers
SET total_amount = $2, updated_at = NOW()
WHERE id = $1 AND deleted_at = 0;

-- name: DeleteTransfer :exec
UPDATE transfers
SET deleted_at = EXTRACT(EPOCH FROM NOW()), status = 'deleted'
WHERE id = $1 AND deleted_at = 0;

-- name: CountTransfers :one
SELECT COUNT(*) as count
FROM transfers
WHERE deleted_at = 0
  AND (NULLIF(current_setting('app.branch_id', true), '') IS NULL
       OR from_branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
       OR to_branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid);

-- ==================== TRANSFER ITEMS ====================

-- name: CreateTransferItem :one
INSERT INTO transfer_items (id, transfer_id, ingredient_id, quantity, stock_qty_before, stock_qty_after, price, total_amount, created_at, updated_at, deleted_at)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW(), 0)
RETURNING *;

-- name: GetTransferItemByID :one
SELECT * FROM transfer_items
WHERE id = $1 AND deleted_at = 0;

-- name: GetTransferItemsByTransferID :many
SELECT * FROM transfer_items
WHERE transfer_id = $1 AND deleted_at = 0
ORDER BY created_at ASC;

-- name: DeleteTransferItem :exec
UPDATE transfer_items
SET deleted_at = EXTRACT(EPOCH FROM NOW()), updated_at = NOW()
WHERE id = $1 AND deleted_at = 0;

-- name: DeleteTransferItemsByTransferID :exec
UPDATE transfer_items
SET deleted_at = EXTRACT(EPOCH FROM NOW()), updated_at = NOW()
WHERE transfer_id = $1 AND deleted_at = 0;

-- name: RecalculateTransferTotal :exec
UPDATE transfers
SET total_amount = COALESCE((
    SELECT SUM(total_amount) FROM transfer_items WHERE transfer_id = $1 AND deleted_at = 0
), 0),
    updated_at = NOW()
WHERE id = $1 AND deleted_at = 0;

-- ==================== STOCK HELPERS FOR TRANSFERS ====================
-- These bypass app.branch_id filter since transfers are cross-branch

-- name: GetStockByIngredientAndStorageExplicit :one
SELECT id, ingredient_id, quantity, branch_id, storage_id, created_at, updated_at, deleted_at
FROM ingredient_stock
WHERE ingredient_id = $1 AND storage_id = $2 AND deleted_at = 0
FOR UPDATE;

-- name: EnsureIngredientStockByStorageWithBranch :one
INSERT INTO ingredient_stock (id, ingredient_id, storage_id, branch_id, quantity, deleted_at)
VALUES ($1, $2, $3, $4, 0, 0)
ON CONFLICT (ingredient_id, storage_id)
DO UPDATE SET deleted_at = 0, updated_at = NOW()
RETURNING id, ingredient_id, quantity, branch_id, storage_id, created_at, updated_at, deleted_at;

-- name: DeductStockByID :one
UPDATE ingredient_stock
SET quantity = quantity - $2,
    updated_at = NOW()
WHERE id = $1 AND deleted_at = 0 AND quantity >= $2
RETURNING id, ingredient_id, quantity, branch_id, storage_id, created_at, updated_at, deleted_at;

-- name: AddStockByID :one
UPDATE ingredient_stock
SET quantity = quantity + $2,
    updated_at = NOW()
WHERE id = $1 AND deleted_at = 0
RETURNING id, ingredient_id, quantity, branch_id, storage_id, created_at, updated_at, deleted_at;

-- name: UpdateIngredientStockExplicit :one
UPDATE ingredient_stock
SET quantity = $2,
    updated_at = NOW()
WHERE id = $1
  AND deleted_at = 0
RETURNING id, ingredient_id, quantity, branch_id, storage_id, created_at, updated_at, deleted_at;
