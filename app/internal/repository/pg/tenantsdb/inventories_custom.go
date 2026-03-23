package pg

import (
	"context"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
)

// InventoryItemForProcess is used to read all items of an inventory for stock operations.
type InventoryItemForProcess struct {
	ID              uuid.UUID
	InventoryID     uuid.UUID
	IngredientID    uuid.UUID
	CountedQuantity pgtype.Numeric
	SystemQuantity  pgtype.Numeric
}

// GetInventoryItemsByInventoryIDAll returns all non-deleted items for an inventory without pagination.
func (q *Queries) GetInventoryItemsByInventoryIDAll(ctx context.Context, inventoryID uuid.UUID) ([]InventoryItemForProcess, error) {
	const sql = `
		SELECT id, inventory_id, ingredient_id, counted_quantity, system_quantity
		FROM inventory_items
		WHERE inventory_id = $1 AND deleted_at = 0
		ORDER BY created_at ASC
	`
	rows, err := q.db.Query(ctx, sql, inventoryID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []InventoryItemForProcess
	for rows.Next() {
		var item InventoryItemForProcess
		if err := rows.Scan(&item.ID, &item.InventoryID, &item.IngredientID, &item.CountedQuantity, &item.SystemQuantity); err != nil {
			return nil, err
		}
		items = append(items, item)
	}
	return items, rows.Err()
}

// UpdateInventoryItemSystemQuantityFromStock refreshes system_quantity from the current ingredient_stock value.
// Returns the updated row so the caller can use the new system_quantity immediately.
func (q *Queries) UpdateInventoryItemSystemQuantityFromStock(ctx context.Context, itemID uuid.UUID) (InventoryItemForProcess, error) {
	const sql = `
		UPDATE inventory_items ii
		SET system_quantity = COALESCE((
		    SELECT st.quantity
		    FROM ingredient_stock st
		    JOIN inventories inv ON inv.id = ii.inventory_id
		    WHERE st.ingredient_id = ii.ingredient_id
		      AND st.storage_id = inv.storage_id
		      AND st.deleted_at = 0
		), 0),
		    updated_at = NOW()
		WHERE ii.id = $1 AND ii.deleted_at = 0
		RETURNING id, inventory_id, ingredient_id, counted_quantity, system_quantity
	`
	row := q.db.QueryRow(ctx, sql, itemID)
	var item InventoryItemForProcess
	if err := row.Scan(&item.ID, &item.InventoryID, &item.IngredientID, &item.CountedQuantity, &item.SystemQuantity); err != nil {
		return InventoryItemForProcess{}, err
	}
	return item, nil
}

// UpdateInventoryItemCountedQuantity updates only counted_quantity, leaving system_quantity unchanged.
func (q *Queries) UpdateInventoryItemCountedQuantity(ctx context.Context, itemID uuid.UUID, countedQuantity pgtype.Numeric) (InventoryItemForProcess, error) {
	const sql = `
		UPDATE inventory_items
		SET counted_quantity = $2,
		    updated_at = NOW()
		WHERE id = $1 AND deleted_at = 0
		RETURNING id, inventory_id, ingredient_id, counted_quantity, system_quantity
	`
	row := q.db.QueryRow(ctx, sql, itemID, countedQuantity)
	var item InventoryItemForProcess
	if err := row.Scan(&item.ID, &item.InventoryID, &item.IngredientID, &item.CountedQuantity, &item.SystemQuantity); err != nil {
		return InventoryItemForProcess{}, err
	}
	return item, nil
}

// InsertInventoryItemWithSystemQty inserts a new inventory item with an explicit system_quantity value.
// Used when adding a new item to an already-active inventory (system_quantity must be captured before stock is changed).
func (q *Queries) InsertInventoryItemWithSystemQty(ctx context.Context, id, inventoryID, ingredientID uuid.UUID, countedQty, systemQty pgtype.Numeric) (InventoryItemForProcess, error) {
	const sql = `
		INSERT INTO inventory_items (id, inventory_id, ingredient_id, counted_quantity, system_quantity)
		VALUES ($1, $2, $3, $4, $5)
		ON CONFLICT (inventory_id, ingredient_id)
		DO UPDATE SET
		  counted_quantity = EXCLUDED.counted_quantity,
		  updated_at = NOW(),
		  deleted_at = 0
		RETURNING id, inventory_id, ingredient_id, counted_quantity, system_quantity
	`
	row := q.db.QueryRow(ctx, sql, id, inventoryID, ingredientID, countedQty, systemQty)
	var item InventoryItemForProcess
	if err := row.Scan(&item.ID, &item.InventoryID, &item.IngredientID, &item.CountedQuantity, &item.SystemQuantity); err != nil {
		return InventoryItemForProcess{}, err
	}
	return item, nil
}

// DeleteInventoryItemByID soft-deletes a single inventory item by its ID.
func (q *Queries) DeleteInventoryItemByID(ctx context.Context, id uuid.UUID) error {
	const sql = `
		UPDATE inventory_items
		SET deleted_at = EXTRACT(EPOCH FROM NOW())::BIGINT, updated_at = NOW()
		WHERE id = $1 AND deleted_at = 0
	`
	_, err := q.db.Exec(ctx, sql, id)
	return err
}

type CountInventoriesFilteredParams struct {
	DateFrom     pgtype.Date
	DateTo       pgtype.Date
	StorageID    uuid.UUID
	Status       string
	IngredientID uuid.UUID
}

// CountInventoriesFiltered returns the total count for paginated filtered list.
func (q *Queries) CountInventoriesFiltered(ctx context.Context, arg CountInventoriesFilteredParams) (int64, error) {
	const sql = `
		SELECT COUNT(DISTINCT inv.id)
		FROM inventories inv
		LEFT JOIN inventory_items ii ON ii.inventory_id = inv.id AND ii.deleted_at = 0
		WHERE EXISTS (
		    SELECT 1 FROM storages s
		    WHERE s.id = inv.storage_id
		      AND s.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
		  )
		  AND ($1::date IS NULL OR inv.date >= $1)
		  AND ($2::date IS NULL OR inv.date <= $2)
		  AND (NULLIF($3::uuid, '00000000-0000-0000-0000-000000000000') IS NULL OR inv.storage_id = $3)
		  AND (NULLIF($4::text, '') IS NULL OR inv.status = $4)
		  AND (NULLIF($5::uuid, '00000000-0000-0000-0000-000000000000') IS NULL OR ii.ingredient_id = $5)
	`
	row := q.db.QueryRow(ctx, sql, arg.DateFrom, arg.DateTo, arg.StorageID, arg.Status, arg.IngredientID)
	var count int64
	if err := row.Scan(&count); err != nil {
		return 0, err
	}
	return count, nil
}

// DeleteInventoriesBatch soft-deletes multiple inventories by their IDs.
// Stock reversal must be handled in the service layer before calling this.
func (q *Queries) DeleteInventoriesBatch(ctx context.Context, ids []uuid.UUID) error {
	const sql = `
		UPDATE inventories
		SET deleted_at = EXTRACT(EPOCH FROM NOW())::BIGINT
		WHERE id = ANY($1::uuid[]) AND deleted_at = 0
		  AND EXISTS (
		    SELECT 1 FROM storages s
		    WHERE s.id = inventories.storage_id
		      AND s.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
		  )
	`
	_, err := q.db.Exec(ctx, sql, ids)
	return err
}
