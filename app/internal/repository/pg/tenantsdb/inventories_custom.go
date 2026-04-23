package pg

import (
	"context"
	"time"

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

type LastActiveInventoryByStorageRow struct {
	ID        uuid.UUID
	Date      pgtype.Date
	CountedAt time.Time
	AppliedAt pgtype.Timestamptz
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

// UpdateInventoryItemSystemQuantityFromMovements refreshes system_quantity by reconstructing balance from movements at the inventory counted_at timestamp.
// This ensures inventory comparisons use point-in-time stock, not current stock.
func (q *Queries) UpdateInventoryItemSystemQuantityFromMovements(ctx context.Context, itemID uuid.UUID) (InventoryItemForProcess, error) {
	const sql = `
		UPDATE inventory_items ii
		SET system_quantity = COALESCE((
			SELECT COALESCE(stock_after, 0)
			FROM ingredient_stock_movements m
			WHERE m.ingredient_id = ii.ingredient_id
			  AND m.storage_id = (SELECT storage_id FROM inventories WHERE id = ii.inventory_id)
			  AND COALESCE(m.effective_at, m.created_at) <= (SELECT counted_at FROM inventories WHERE id = ii.inventory_id)
			ORDER BY COALESCE(m.effective_at, m.created_at) DESC, m.id DESC
			LIMIT 1
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

func (q *Queries) GetLastActiveInventoryByStorage(ctx context.Context, storageID uuid.UUID) (LastActiveInventoryByStorageRow, error) {
	const sql = `
		SELECT id, date, counted_at, applied_at
		FROM inventories
		WHERE storage_id = $1
		  AND status = 'active'
		  AND deleted_at = 0
		ORDER BY counted_at DESC, applied_at DESC NULLS LAST, created_at DESC, id DESC
		LIMIT 1
	`

	row := q.db.QueryRow(ctx, sql, storageID)
	var out LastActiveInventoryByStorageRow
	if err := row.Scan(&out.ID, &out.Date, &out.CountedAt, &out.AppliedAt); err != nil {
		return LastActiveInventoryByStorageRow{}, err
	}
	return out, nil
}

func (q *Queries) HasNewerActiveInventoryByStorage(ctx context.Context, storageID, currentInventoryID uuid.UUID, currentCountedAt time.Time) (bool, error) {
	const sql = `
		SELECT EXISTS (
			SELECT 1
			FROM inventories
			WHERE storage_id = $1
			  AND status = 'active'
			  AND deleted_at = 0
			  AND id <> $2
			  AND counted_at > $3
		)
	`

	var exists bool
	if err := q.db.QueryRow(ctx, sql, storageID, currentInventoryID, currentCountedAt).Scan(&exists); err != nil {
		return false, err
	}
	return exists, nil
}
