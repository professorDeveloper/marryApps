package pg

import (
	"context"

	"github.com/google/uuid"
)

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
