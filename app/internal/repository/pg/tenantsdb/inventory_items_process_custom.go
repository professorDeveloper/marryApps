package pg

import (
	"context"

	"github.com/google/uuid"
)

func (q *Queries) GetInventoryItemsForProcessByInventoryID(ctx context.Context, inventoryID uuid.UUID) ([]InventoryItemForProcess, error) {
	const sql = `
	SELECT
		id,
		ingredient_id,
		counted_quantity,
		system_quantity
	FROM inventory_items
	WHERE inventory_id = $1
	  AND deleted_at = 0
	ORDER BY created_at ASC, id ASC
	`

	rows, err := q.db.Query(ctx, sql, inventoryID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var out []InventoryItemForProcess
	for rows.Next() {
		var r InventoryItemForProcess
		if err := rows.Scan(
			&r.ID,
			&r.IngredientID,
			&r.CountedQuantity,
			&r.SystemQuantity,
		); err != nil {
			return nil, err
		}
		out = append(out, r)
	}

	return out, rows.Err()
}
