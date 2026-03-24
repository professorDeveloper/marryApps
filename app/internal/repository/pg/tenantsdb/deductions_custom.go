package pg

import (
	"context"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
)

type GetDeductionsFilteredParams struct {
	DateFrom     pgtype.Date
	DateTo       pgtype.Date
	Status       string
	StorageID    uuid.UUID
	ActGroupID   uuid.UUID
	IngredientID uuid.UUID
	Limit        int32
	Offset       int32
}

// GetDeductionsFiltered returns deductions matching the given filters with pagination.
func (q *Queries) GetDeductionsFiltered(ctx context.Context, arg GetDeductionsFilteredParams) ([]Deduction, error) {
	const sql = `
		SELECT DISTINCT d.id, d.number, d.date, d.act_group_id, d.storage_id,
		       d.description, d.description_i18n, d.status, d.balance,
		       d.created_at, d.updated_at, d.deleted_at
		FROM deductions d
		LEFT JOIN deduction_items di ON di.deduction_id = d.id AND di.deleted_at = 0
		WHERE d.deleted_at = 0
		  AND ($1::date IS NULL OR d.date >= $1)
		  AND ($2::date IS NULL OR d.date <= $2)
		  AND (NULLIF($3::text, '') IS NULL OR d.status = $3)
		  AND (NULLIF($4::uuid, '00000000-0000-0000-0000-000000000000') IS NULL OR d.storage_id = $4)
		  AND (NULLIF($5::uuid, '00000000-0000-0000-0000-000000000000') IS NULL OR d.act_group_id = $5)
		  AND (NULLIF($6::uuid, '00000000-0000-0000-0000-000000000000') IS NULL OR di.ingredient_id = $6)
		ORDER BY d.date DESC, d.number DESC
		LIMIT $7 OFFSET $8
	`
	rows, err := q.db.Query(ctx, sql,
		arg.DateFrom, arg.DateTo, arg.Status,
		arg.StorageID, arg.ActGroupID, arg.IngredientID,
		arg.Limit, arg.Offset,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []Deduction
	for rows.Next() {
		var d Deduction
		if err := rows.Scan(
			&d.ID, &d.Number, &d.Date, &d.ActGroupID, &d.StorageID,
			&d.Description, &d.DescriptionI18n, &d.Status, &d.Balance,
			&d.CreatedAt, &d.UpdatedAt, &d.DeletedAt,
		); err != nil {
			return nil, err
		}
		items = append(items, d)
	}
	return items, rows.Err()
}

type CountDeductionsFilteredParams struct {
	DateFrom     pgtype.Date
	DateTo       pgtype.Date
	Status       string
	StorageID    uuid.UUID
	ActGroupID   uuid.UUID
	IngredientID uuid.UUID
}

// CountDeductionsFiltered returns the total count for the filtered deductions list.
func (q *Queries) CountDeductionsFiltered(ctx context.Context, arg CountDeductionsFilteredParams) (int64, error) {
	const sql = `
		SELECT COUNT(DISTINCT d.id)
		FROM deductions d
		LEFT JOIN deduction_items di ON di.deduction_id = d.id AND di.deleted_at = 0
		WHERE d.deleted_at = 0
		  AND ($1::date IS NULL OR d.date >= $1)
		  AND ($2::date IS NULL OR d.date <= $2)
		  AND (NULLIF($3::text, '') IS NULL OR d.status = $3)
		  AND (NULLIF($4::uuid, '00000000-0000-0000-0000-000000000000') IS NULL OR d.storage_id = $4)
		  AND (NULLIF($5::uuid, '00000000-0000-0000-0000-000000000000') IS NULL OR d.act_group_id = $5)
		  AND (NULLIF($6::uuid, '00000000-0000-0000-0000-000000000000') IS NULL OR di.ingredient_id = $6)
	`
	var count int64
	if err := q.db.QueryRow(ctx, sql,
		arg.DateFrom, arg.DateTo, arg.Status,
		arg.StorageID, arg.ActGroupID, arg.IngredientID,
	).Scan(&count); err != nil {
		return 0, err
	}
	return count, nil
}

// CountDeductions returns total count of non-deleted deductions.
func (q *Queries) CountDeductions(ctx context.Context) (int64, error) {
	const sql = `SELECT COUNT(*) FROM deductions WHERE deleted_at = 0`
	var count int64
	if err := q.db.QueryRow(ctx, sql).Scan(&count); err != nil {
		return 0, err
	}
	return count, nil
}

// GetDeductionItemIngredientsByDeductionID returns all breakdown records for every item of a deduction.
func (q *Queries) GetDeductionItemIngredientsByDeductionID(ctx context.Context, deductionID uuid.UUID) ([]DeductionItemIngredient, error) {
	const sql = `
		SELECT dii.id, dii.deduction_item_id, dii.ingredient_id, dii.quantity,
		       dii.stock_before, dii.stock_after, dii.price_per_unit, dii.amount,
		       dii.created_at, dii.updated_at, dii.deleted_at
		FROM deduction_item_ingredients dii
		JOIN deduction_items di ON di.id = dii.deduction_item_id
		WHERE di.deduction_id = $1 AND di.deleted_at = 0 AND dii.deleted_at = 0
	`
	rows, err := q.db.Query(ctx, sql, deductionID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var result []DeductionItemIngredient
	for rows.Next() {
		var r DeductionItemIngredient
		if err := rows.Scan(
			&r.ID, &r.DeductionItemID, &r.IngredientID, &r.Quantity,
			&r.StockBefore, &r.StockAfter, &r.PricePerUnit, &r.Amount,
			&r.CreatedAt, &r.UpdatedAt, &r.DeletedAt,
		); err != nil {
			return nil, err
		}
		result = append(result, r)
	}
	return result, rows.Err()
}
