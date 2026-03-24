package pg

import (
	"context"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
)

// DeductStockAllowNegative deducts qty from stock without checking for a floor — stock may go negative.
func (q *Queries) DeductStockAllowNegative(ctx context.Context, id uuid.UUID, quantity pgtype.Numeric) (AddStockByIDRow, error) {
	const sql = `
		UPDATE ingredient_stock
		SET quantity   = quantity - $2,
		    updated_at = NOW()
		WHERE id = $1 AND deleted_at = 0
		RETURNING id, ingredient_id, quantity, branch_id, storage_id, created_at, updated_at, deleted_at
	`
	row := q.db.QueryRow(ctx, sql, id, quantity)
	var i AddStockByIDRow
	err := row.Scan(
		&i.ID, &i.IngredientID, &i.Quantity,
		&i.BranchID, &i.StorageID,
		&i.CreatedAt, &i.UpdatedAt, &i.DeletedAt,
	)
	return i, err
}

// ==================== FILTERED LIST ====================

type GetTransfersFilteredParams struct {
	DateFrom     pgtype.Date
	DateTo       pgtype.Date
	Status       string
	FromStorageID uuid.UUID
	ToStorageID   uuid.UUID
	ActGroupID    uuid.UUID
	IngredientID  uuid.UUID
	Limit         int32
	Offset        int32
}

type CountTransfersFilteredParams struct {
	DateFrom      pgtype.Date
	DateTo        pgtype.Date
	Status        string
	FromStorageID uuid.UUID
	ToStorageID   uuid.UUID
	ActGroupID    uuid.UUID
	IngredientID  uuid.UUID
}

// SumTransfersFiltered returns the total_amount sum for the filtered transfer set.
func (q *Queries) SumTransfersFiltered(ctx context.Context, arg CountTransfersFilteredParams) (pgtype.Numeric, error) {
	const sql = `
		SELECT COALESCE(SUM(t.total_amount), 0)
		FROM transfers t
		LEFT JOIN transfer_items ti ON ti.transfer_id = t.id AND ti.deleted_at = 0
		WHERE t.deleted_at = 0
		  AND (NULLIF(current_setting('app.branch_id', true), '') IS NULL
		       OR t.from_branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
		       OR t.to_branch_id   = NULLIF(current_setting('app.branch_id', true), '')::uuid)
		  AND ($1::date IS NULL OR t.date::date >= $1)
		  AND ($2::date IS NULL OR t.date::date <= $2)
		  AND (NULLIF($3::text, '') IS NULL OR t.status::text = $3)
		  AND (NULLIF($4::uuid, '00000000-0000-0000-0000-000000000000') IS NULL OR t.from_storage_id = $4)
		  AND (NULLIF($5::uuid, '00000000-0000-0000-0000-000000000000') IS NULL OR t.to_storage_id   = $5)
		  AND (NULLIF($6::uuid, '00000000-0000-0000-0000-000000000000') IS NULL OR t.act_group_id    = $6)
		  AND (NULLIF($7::uuid, '00000000-0000-0000-0000-000000000000') IS NULL OR ti.ingredient_id  = $7)
	`
	var sum pgtype.Numeric
	if err := q.db.QueryRow(ctx, sql,
		arg.DateFrom, arg.DateTo, arg.Status,
		arg.FromStorageID, arg.ToStorageID, arg.ActGroupID, arg.IngredientID,
	).Scan(&sum); err != nil {
		return pgtype.Numeric{}, err
	}
	return sum, nil
}

// GetTransfersFiltered returns transfers matching the given filters with pagination.
func (q *Queries) GetTransfersFiltered(ctx context.Context, arg GetTransfersFilteredParams) ([]Transfer, error) {
	const sql = `
		SELECT DISTINCT t.id, t.number, t.from_branch_id, t.to_branch_id,
		       t.from_storage_id, t.to_storage_id, t.act_group_id,
		       t.description, t.status, t.date, t.total_amount,
		       t.created_at, t.updated_at, t.deleted_at
		FROM transfers t
		LEFT JOIN transfer_items ti ON ti.transfer_id = t.id AND ti.deleted_at = 0
		WHERE t.deleted_at = 0
		  AND (NULLIF(current_setting('app.branch_id', true), '') IS NULL
		       OR t.from_branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
		       OR t.to_branch_id   = NULLIF(current_setting('app.branch_id', true), '')::uuid)
		  AND ($1::date IS NULL OR t.date::date >= $1)
		  AND ($2::date IS NULL OR t.date::date <= $2)
		  AND (NULLIF($3::text, '') IS NULL OR t.status::text = $3)
		  AND (NULLIF($4::uuid, '00000000-0000-0000-0000-000000000000') IS NULL OR t.from_storage_id = $4)
		  AND (NULLIF($5::uuid, '00000000-0000-0000-0000-000000000000') IS NULL OR t.to_storage_id   = $5)
		  AND (NULLIF($6::uuid, '00000000-0000-0000-0000-000000000000') IS NULL OR t.act_group_id    = $6)
		  AND (NULLIF($7::uuid, '00000000-0000-0000-0000-000000000000') IS NULL OR ti.ingredient_id  = $7)
		ORDER BY t.date DESC, t.number DESC
		LIMIT $8 OFFSET $9
	`
	rows, err := q.db.Query(ctx, sql,
		arg.DateFrom, arg.DateTo, arg.Status,
		arg.FromStorageID, arg.ToStorageID, arg.ActGroupID, arg.IngredientID,
		arg.Limit, arg.Offset,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []Transfer
	for rows.Next() {
		var t Transfer
		if err := rows.Scan(
			&t.ID, &t.Number, &t.FromBranchID, &t.ToBranchID,
			&t.FromStorageID, &t.ToStorageID, &t.ActGroupID,
			&t.Description, &t.Status, &t.Date, &t.TotalAmount,
			&t.CreatedAt, &t.UpdatedAt, &t.DeletedAt,
		); err != nil {
			return nil, err
		}
		items = append(items, t)
	}
	return items, rows.Err()
}

// CountTransfersFiltered returns total count for the filtered transfers list.
func (q *Queries) CountTransfersFiltered(ctx context.Context, arg CountTransfersFilteredParams) (int64, error) {
	const sql = `
		SELECT COUNT(DISTINCT t.id)
		FROM transfers t
		LEFT JOIN transfer_items ti ON ti.transfer_id = t.id AND ti.deleted_at = 0
		WHERE t.deleted_at = 0
		  AND (NULLIF(current_setting('app.branch_id', true), '') IS NULL
		       OR t.from_branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
		       OR t.to_branch_id   = NULLIF(current_setting('app.branch_id', true), '')::uuid)
		  AND ($1::date IS NULL OR t.date::date >= $1)
		  AND ($2::date IS NULL OR t.date::date <= $2)
		  AND (NULLIF($3::text, '') IS NULL OR t.status::text = $3)
		  AND (NULLIF($4::uuid, '00000000-0000-0000-0000-000000000000') IS NULL OR t.from_storage_id = $4)
		  AND (NULLIF($5::uuid, '00000000-0000-0000-0000-000000000000') IS NULL OR t.to_storage_id   = $5)
		  AND (NULLIF($6::uuid, '00000000-0000-0000-0000-000000000000') IS NULL OR t.act_group_id    = $6)
		  AND (NULLIF($7::uuid, '00000000-0000-0000-0000-000000000000') IS NULL OR ti.ingredient_id  = $7)
	`
	var count int64
	if err := q.db.QueryRow(ctx, sql,
		arg.DateFrom, arg.DateTo, arg.Status,
		arg.FromStorageID, arg.ToStorageID, arg.ActGroupID, arg.IngredientID,
	).Scan(&count); err != nil {
		return 0, err
	}
	return count, nil
}
