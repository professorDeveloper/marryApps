package pg

import (
	"context"
	"fmt"
	"strings"

	"github.com/google/uuid"
)

type GetIngredientStockFilteredParams struct {
	IngredientID   uuid.UUID
	IngredientName string
	Search         string
	StorageID      uuid.UUID
	Measurement    string
	SortBy         string
	SortOrder      string
	Limit          int32
	Offset         int32
}

type CountIngredientStockFilteredParams struct {
	IngredientID   uuid.UUID
	IngredientName string
	Search         string
	StorageID      uuid.UUID
	Measurement    string
}

func ingredientStockOrderClause(sortBy, sortOrder string) string {
	column := "st.created_at"
	switch strings.ToLower(strings.TrimSpace(sortBy)) {
	case "quantity":
		column = "st.quantity"
	case "price_per_unit", "priceperunit":
		column = "i.price_per_unit"
	case "created_at", "createdat", "created_date", "createddate":
		column = "st.created_at"
	}

	order := "DESC"
	if strings.EqualFold(strings.TrimSpace(sortOrder), "asc") {
		order = "ASC"
	}

	return fmt.Sprintf(" ORDER BY %s %s, st.created_at DESC", column, order)
}

func (q *Queries) CountIngredientStockFiltered(ctx context.Context, arg CountIngredientStockFilteredParams) (int64, error) {
	const sql = `
		SELECT COUNT(*)
		FROM ingredient_stock st
		JOIN ingredients i ON i.id = st.ingredient_id AND i.deleted_at = 0
		WHERE st.deleted_at = 0
		  AND st.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
		  AND (NULLIF($1::uuid, '00000000-0000-0000-0000-000000000000') IS NULL OR st.ingredient_id = $1)
		  AND (NULLIF($2::text, '') IS NULL OR i.name ILIKE '%' || $2 || '%')
		  AND (NULLIF($3::text, '') IS NULL OR i.name ILIKE '%' || $3 || '%')
		  AND (NULLIF($4::uuid, '00000000-0000-0000-0000-000000000000') IS NULL OR st.storage_id = $4)
		  AND (NULLIF($5::text, '') IS NULL OR i.measurement::text = $5)
	`
	var count int64
	if err := q.db.QueryRow(ctx, sql,
		arg.IngredientID,
		arg.IngredientName,
		arg.Search,
		arg.StorageID,
		arg.Measurement,
	).Scan(&count); err != nil {
		return 0, err
	}
	return count, nil
}

func (q *Queries) GetIngredientStockFiltered(ctx context.Context, arg GetIngredientStockFilteredParams) ([]IngredientStock, error) {
	baseSQL := `
		SELECT st.id, st.ingredient_id, st.storage_id, st.branch_id, st.quantity, st.created_at, st.updated_at, st.deleted_at
		FROM ingredient_stock st
		JOIN ingredients i ON i.id = st.ingredient_id AND i.deleted_at = 0
		WHERE st.deleted_at = 0
		  AND st.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
		  AND (NULLIF($1::uuid, '00000000-0000-0000-0000-000000000000') IS NULL OR st.ingredient_id = $1)
		  AND (NULLIF($2::text, '') IS NULL OR i.name ILIKE '%' || $2 || '%')
		  AND (NULLIF($3::text, '') IS NULL OR i.name ILIKE '%' || $3 || '%')
		  AND (NULLIF($4::uuid, '00000000-0000-0000-0000-000000000000') IS NULL OR st.storage_id = $4)
		  AND (NULLIF($5::text, '') IS NULL OR i.measurement::text = $5)
	`

	sql := baseSQL + ingredientStockOrderClause(arg.SortBy, arg.SortOrder) + ` LIMIT $6 OFFSET $7`

	rows, err := q.db.Query(ctx, sql,
		arg.IngredientID,
		arg.IngredientName,
		arg.Search,
		arg.StorageID,
		arg.Measurement,
		arg.Limit,
		arg.Offset,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []IngredientStock
	for rows.Next() {
		var item IngredientStock
		if err := rows.Scan(
			&item.ID,
			&item.IngredientID,
			&item.StorageID,
			&item.BranchID,
			&item.Quantity,
			&item.CreatedAt,
			&item.UpdatedAt,
			&item.DeletedAt,
		); err != nil {
			return nil, err
		}
		items = append(items, item)
	}

	return items, rows.Err()
}