package pg

import (
	"context"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
)

type IngredientStockMovementForRebalanceRow struct {
	ID          uuid.UUID
	QtyIn       pgtype.Numeric
	QtyOut      pgtype.Numeric
	StockBefore pgtype.Numeric
	StockAfter  pgtype.Numeric
	CreatedAt   pgtype.Timestamptz
	EffectiveAt pgtype.Timestamptz
}

func (q *Queries) ListIngredientStockMovementsForRebalance(ctx context.Context,storageID uuid.UUID,ingredientID uuid.UUID) ([]IngredientStockMovementForRebalanceRow, error) {
	const sql = `
	SELECT
		id,
		qty_in,
		qty_out,
		stock_before,
		stock_after,
		created_at,
		effective_at
	FROM ingredient_stock_movements
	WHERE storage_id = $1
	AND ingredient_id = $2
	ORDER BY COALESCE(effective_at, created_at) ASC, created_at ASC, id ASC
`

	rows, err := q.db.Query(ctx, sql, storageID, ingredientID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var out []IngredientStockMovementForRebalanceRow
	for rows.Next() {
		var r IngredientStockMovementForRebalanceRow
		if err := rows.Scan(
			&r.ID,
			&r.QtyIn,
			&r.QtyOut,
			&r.StockBefore,
			&r.StockAfter,
			&r.CreatedAt,
			&r.EffectiveAt,
		); err != nil {
			return nil, err
		}
		out = append(out, r)
	}

	return out, rows.Err()
}

type UpdateIngredientStockMovementBalancesParams struct {
	ID          uuid.UUID
	StockBefore pgtype.Numeric
	StockAfter  pgtype.Numeric
}

func (q *Queries) UpdateIngredientStockMovementBalances(ctx context.Context,arg UpdateIngredientStockMovementBalancesParams,) error {
	const sql = `
	UPDATE ingredient_stock_movements
	SET stock_before = $2,
		stock_after  = $3
	WHERE id = $1
	`

	_, err := q.db.Exec(ctx, sql, arg.ID, arg.StockBefore, arg.StockAfter)
	return err
}