package pg

import (
	"context"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
)

type InsertIngredientStockMovementParams struct {
	ID           uuid.UUID
	StorageID    uuid.UUID
	IngredientID uuid.UUID

	EventType string

	QtyIn        pgtype.Numeric
	QtyOut       pgtype.Numeric
	StockBefore  pgtype.Numeric
	StockAfter   pgtype.Numeric
	PricePerUnit pgtype.Numeric

	SourceType *string
	SourceID   *uuid.UUID
}

func (q *Queries) InsertIngredientStockMovement(ctx context.Context, arg InsertIngredientStockMovementParams) error {
	const sql = `
		INSERT INTO ingredient_stock_movements (
			id,
			storage_id,
			ingredient_id,
			event_type,
			qty_in,
			qty_out,
			stock_before,
			stock_after,
			price_per_unit,
			source_type,
			source_id
		)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
	`

	_, err := q.db.Exec(ctx, sql,
		arg.ID,
		arg.StorageID,
		arg.IngredientID,
		arg.EventType,
		arg.QtyIn,
		arg.QtyOut,
		arg.StockBefore,
		arg.StockAfter,
		arg.PricePerUnit,
		arg.SourceType,
		arg.SourceID,
	)
	return err
}

type InventoryForApplyRow struct {
	ID        uuid.UUID
	StorageID uuid.UUID
	AppliedAt pgtype.Timestamptz
}

func (q *Queries) GetInventoryForApply(ctx context.Context, id uuid.UUID) (InventoryForApplyRow, error) {
	const sql = `
		SELECT id, storage_id, applied_at
		FROM inventories
		WHERE id = $1 AND deleted_at = 0
		FOR UPDATE
	`

	row := q.db.QueryRow(ctx, sql, id)
	var out InventoryForApplyRow
	if err := row.Scan(&out.ID, &out.StorageID, &out.AppliedAt); err != nil {
		return InventoryForApplyRow{}, err
	}
	return out, nil
}

func (q *Queries) MarkInventoryApplied(ctx context.Context, id uuid.UUID) error {
	const sql = `
		UPDATE inventories
		SET applied_at = NOW(), updated_at = NOW()
		WHERE id = $1 AND deleted_at = 0 AND applied_at IS NULL
	`
	_, err := q.db.Exec(ctx, sql, id)
	return err
}

type IngredientStockForUpdateRow struct {
	ID           uuid.UUID
	IngredientID uuid.UUID
	Quantity     pgtype.Numeric
	StorageID    pgtype.UUID
}

func (q *Queries) GetIngredientStockByIDForUpdate(ctx context.Context, id uuid.UUID) (IngredientStockForUpdateRow, error) {
	const sql = `
		SELECT id, ingredient_id, quantity, storage_id
		FROM ingredient_stock
		WHERE id = $1 AND deleted_at = 0
		FOR UPDATE
	`

	row := q.db.QueryRow(ctx, sql, id)
	var out IngredientStockForUpdateRow
	if err := row.Scan(&out.ID, &out.IngredientID, &out.Quantity, &out.StorageID); err != nil {
		return IngredientStockForUpdateRow{}, err
	}
	return out, nil
}

type StockMovementForReversalRow struct {
	IngredientID uuid.UUID
	StorageID    uuid.UUID
	StockBefore  pgtype.Numeric
}

func (q *Queries) GetStockMovementsBySourceID(ctx context.Context, sourceID uuid.UUID) ([]StockMovementForReversalRow, error) {
	const sql = `
		SELECT DISTINCT ON (ingredient_id) ingredient_id, storage_id, stock_before
		FROM ingredient_stock_movements
		WHERE source_id = $1 AND source_type = 'inventory'
		ORDER BY ingredient_id, created_at ASC
	`

	rows, err := q.db.Query(ctx, sql, sourceID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []StockMovementForReversalRow
	for rows.Next() {
		var row StockMovementForReversalRow
		if err := rows.Scan(&row.IngredientID, &row.StorageID, &row.StockBefore); err != nil {
			return nil, err
		}
		items = append(items, row)
	}
	return items, rows.Err()
}
