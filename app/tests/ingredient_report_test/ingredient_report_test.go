package ingredient_report_test

import (
	"context"
	"fmt"
	"testing"
	"time"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/stretchr/testify/require"

	pg "gitlab.yurtal.tech/company/maryai/back/internal/repository/pg/tenantsdb"
)

// TestIngredientReport_SortingByInQty tests sorting by in field
func TestIngredientReport_SortingByInQty(t *testing.T) {
	ctx := context.Background()

	storage := newStorage(t, ctx, globalEnv.q, "Test Storage")
	ing1 := newIngredient(t, ctx, globalEnv.q, "Flour", "kg")
	ing2 := newIngredient(t, ctx, globalEnv.q, "Sugar", "kg")
	ing3 := newIngredient(t, ctx, globalEnv.q, "Salt", "kg")

	now := ts(2026, time.January, 10, 12, 0)
	insertMovement(t, ctx, globalEnv.pool, storage, ing1, "invoice_in", 50, 0, 2.0, now)
	insertMovement(t, ctx, globalEnv.pool, storage, ing2, "invoice_in", 30, 0, 1.5, now)
	insertMovement(t, ctx, globalEnv.pool, storage, ing3, "invoice_in", 100, 0, 0.5, now)

	startTs := pgtype.Timestamptz{Time: ts(2026, time.January, 1, 0, 0), Valid: true}
	endTs := pgtype.Timestamptz{Time: ts(2026, time.January, 15, 0, 0), Valid: true}

	// Test ascending sort
	rows, err := globalEnv.q.GetIngredientReport(ctx, pg.GetIngredientReportParams{
		StorageID:     storage,
		Start:         startTs,
		End:           endTs,
		IngredientID:  nil,
		Limit:         100,
		Offset:        0,
		Measurement:   "",
		IngredientIDs: "",
		SortBy:        "in",
		SortOrder:     "asc",
	})
	require.NoError(t, err)
	require.Len(t, rows, 3)
	require.Equal(t, "Sugar", rows[0].IngredientName)
	require.Equal(t, "Flour", rows[1].IngredientName)
	require.Equal(t, "Salt", rows[2].IngredientName)

	// Test descending sort
	rows, err = globalEnv.q.GetIngredientReport(ctx, pg.GetIngredientReportParams{
		StorageID:     storage,
		Start:         startTs,
		End:           endTs,
		IngredientID:  nil,
		Limit:         100,
		Offset:        0,
		Measurement:   "",
		IngredientIDs: "",
		SortBy:        "in",
		SortOrder:     "desc",
	})
	require.NoError(t, err)
	require.Len(t, rows, 3)
	require.Equal(t, "Salt", rows[0].IngredientName)
	require.Equal(t, "Flour", rows[1].IngredientName)
	require.Equal(t, "Sugar", rows[2].IngredientName)
}

// TestIngredientReport_SortingByOutQty tests sorting by out field
func TestIngredientReport_SortingByOutQty(t *testing.T) {
	ctx := context.Background()

	storage := newStorage(t, ctx, globalEnv.q, "Test Storage 2")
	ing1 := newIngredient(t, ctx, globalEnv.q, "Milk", "liters")
	ing2 := newIngredient(t, ctx, globalEnv.q, "Water", "liters")
	ing3 := newIngredient(t, ctx, globalEnv.q, "Oil", "liters")

	now := ts(2026, time.January, 10, 12, 0)
	insertMovement(t, ctx, globalEnv.pool, storage, ing1, "order_out", 0, 20, 1.0, now)
	insertMovement(t, ctx, globalEnv.pool, storage, ing2, "order_out", 0, 40, 0.5, now)
	insertMovement(t, ctx, globalEnv.pool, storage, ing3, "order_out", 0, 10, 3.0, now)

	startTs := pgtype.Timestamptz{Time: ts(2026, time.January, 1, 0, 0), Valid: true}
	endTs := pgtype.Timestamptz{Time: ts(2026, time.January, 15, 0, 0), Valid: true}

	// Test descending sort (highest out first)
	rows, err := globalEnv.q.GetIngredientReport(ctx, pg.GetIngredientReportParams{
		StorageID:     storage,
		Start:         startTs,
		End:           endTs,
		IngredientID:  nil,
		Limit:         100,
		Offset:        0,
		Measurement:   "",
		IngredientIDs: "",
		SortBy:        "out",
		SortOrder:     "desc",
	})
	require.NoError(t, err)
	require.Len(t, rows, 3)
	require.Equal(t, "Water", rows[0].IngredientName)
	require.Equal(t, "Milk", rows[1].IngredientName)
	require.Equal(t, "Oil", rows[2].IngredientName)
}

// TestIngredientReport_SortingBySurplus tests sorting by surplus field
func TestIngredientReport_SortingBySurplus(t *testing.T) {
	ctx := context.Background()

	storage := newStorage(t, ctx, globalEnv.q, "Test Storage 3")
	ing1 := newIngredient(t, ctx, globalEnv.q, "Rice", "kg")
	ing2 := newIngredient(t, ctx, globalEnv.q, "Beans", "kg")
	ing3 := newIngredient(t, ctx, globalEnv.q, "Corn", "kg")

	now := ts(2026, time.January, 10, 12, 0)
	insertMovement(t, ctx, globalEnv.pool, storage, ing1, "inventory_surplus_in", 15, 0, 1.0, now)
	insertMovement(t, ctx, globalEnv.pool, storage, ing2, "inventory_surplus_in", 25, 0, 1.5, now)
	insertMovement(t, ctx, globalEnv.pool, storage, ing3, "inventory_surplus_in", 5, 0, 2.0, now)

	startTs := pgtype.Timestamptz{Time: ts(2026, time.January, 1, 0, 0), Valid: true}
	endTs := pgtype.Timestamptz{Time: ts(2026, time.January, 15, 0, 0), Valid: true}

	rows, err := globalEnv.q.GetIngredientReport(ctx, pg.GetIngredientReportParams{
		StorageID:     storage,
		Start:         startTs,
		End:           endTs,
		IngredientID:  nil,
		Limit:         100,
		Offset:        0,
		Measurement:   "",
		IngredientIDs: "",
		SortBy:        "surplus",
		SortOrder:     "desc",
	})
	require.NoError(t, err)
	require.Len(t, rows, 3)
	require.Equal(t, "Beans", rows[0].IngredientName)
	require.Equal(t, "Rice", rows[1].IngredientName)
	require.Equal(t, "Corn", rows[2].IngredientName)
}

// TestIngredientReport_SortingByShortage tests sorting by shortage field
func TestIngredientReport_SortingByShortage(t *testing.T) {
	ctx := context.Background()

	storage := newStorage(t, ctx, globalEnv.q, "Test Storage 4")
	ing1 := newIngredient(t, ctx, globalEnv.q, "Tomatoes", "kg")
	ing2 := newIngredient(t, ctx, globalEnv.q, "Onions", "kg")
	ing3 := newIngredient(t, ctx, globalEnv.q, "Garlic", "kg")

	now := ts(2026, time.January, 10, 12, 0)
	insertMovement(t, ctx, globalEnv.pool, storage, ing1, "inventory_shortage_out", 0, 8, 2.0, now)
	insertMovement(t, ctx, globalEnv.pool, storage, ing2, "inventory_shortage_out", 0, 12, 1.5, now)
	insertMovement(t, ctx, globalEnv.pool, storage, ing3, "inventory_shortage_out", 0, 4, 5.0, now)

	startTs := pgtype.Timestamptz{Time: ts(2026, time.January, 1, 0, 0), Valid: true}
	endTs := pgtype.Timestamptz{Time: ts(2026, time.January, 15, 0, 0), Valid: true}

	rows, err := globalEnv.q.GetIngredientReport(ctx, pg.GetIngredientReportParams{
		StorageID:     storage,
		Start:         startTs,
		End:           endTs,
		IngredientID:  nil,
		Limit:         100,
		Offset:        0,
		Measurement:   "",
		IngredientIDs: "",
		SortBy:        "shortage",
		SortOrder:     "desc",
	})
	require.NoError(t, err)
	require.Len(t, rows, 3)
	require.Equal(t, "Onions", rows[0].IngredientName)
	require.Equal(t, "Tomatoes", rows[1].IngredientName)
	require.Equal(t, "Garlic", rows[2].IngredientName)
}

// TestIngredientReport_SortingByEndQuantity tests sorting by end_quantity field
func TestIngredientReport_SortingByEndQuantity(t *testing.T) {
	ctx := context.Background()

	storage := newStorage(t, ctx, globalEnv.q, "Test Storage 5")
	ing1 := newIngredient(t, ctx, globalEnv.q, "Beef", "kg")
	ing2 := newIngredient(t, ctx, globalEnv.q, "Chicken", "kg")
	ing3 := newIngredient(t, ctx, globalEnv.q, "Pork", "kg")

	now := ts(2026, time.January, 10, 12, 0)
	// Initial stock
	insertMovement(t, ctx, globalEnv.pool, storage, ing1, "manual_in", 100, 0, 10.0, ts(2026, time.January, 1, 0, 0))
	insertMovement(t, ctx, globalEnv.pool, storage, ing2, "manual_in", 80, 0, 8.0, ts(2026, time.January, 1, 0, 0))
	insertMovement(t, ctx, globalEnv.pool, storage, ing3, "manual_in", 120, 0, 12.0, ts(2026, time.January, 1, 0, 0))
	// Consumption
	insertMovement(t, ctx, globalEnv.pool, storage, ing1, "order_out", 0, 30, 10.0, now)
	insertMovement(t, ctx, globalEnv.pool, storage, ing2, "order_out", 0, 50, 8.0, now)
	insertMovement(t, ctx, globalEnv.pool, storage, ing3, "order_out", 0, 20, 12.0, now)

	startTs := pgtype.Timestamptz{Time: ts(2026, time.January, 1, 0, 0), Valid: true}
	endTs := pgtype.Timestamptz{Time: ts(2026, time.January, 15, 0, 0), Valid: true}

	rows, err := globalEnv.q.GetIngredientReport(ctx, pg.GetIngredientReportParams{
		StorageID:     storage,
		Start:         startTs,
		End:           endTs,
		IngredientID:  nil,
		Limit:         100,
		Offset:        0,
		Measurement:   "",
		IngredientIDs: "",
		SortBy:        "end_quantity",
		SortOrder:     "desc",
	})
	require.NoError(t, err)
	require.Len(t, rows, 3)
	require.Equal(t, "Pork", rows[0].IngredientName)
	require.Equal(t, "Beef", rows[1].IngredientName)
	require.Equal(t, "Chicken", rows[2].IngredientName)
}

// TestIngredientReport_FilterByMeasurement tests filtering by measurement
func TestIngredientReport_FilterByMeasurement(t *testing.T) {
	ctx := context.Background()

	storage := newStorage(t, ctx, globalEnv.q, "Test Storage 6")
	ing1 := newIngredient(t, ctx, globalEnv.q, "Flour", "kg")
	ing2 := newIngredient(t, ctx, globalEnv.q, "Milk", "liters")
	ing3 := newIngredient(t, ctx, globalEnv.q, "Sugar", "kg")

	now := ts(2026, time.January, 10, 12, 0)
	insertMovement(t, ctx, globalEnv.pool, storage, ing1, "invoice_in", 50, 0, 2.0, now)
	insertMovement(t, ctx, globalEnv.pool, storage, ing2, "invoice_in", 30, 0, 1.5, now)
	insertMovement(t, ctx, globalEnv.pool, storage, ing3, "invoice_in", 100, 0, 0.5, now)

	startTs := pgtype.Timestamptz{Time: ts(2026, time.January, 1, 0, 0), Valid: true}
	endTs := pgtype.Timestamptz{Time: ts(2026, time.January, 15, 0, 0), Valid: true}

	// Filter by measurement "kg"
	rows, err := globalEnv.q.GetIngredientReport(ctx, pg.GetIngredientReportParams{
		StorageID:     storage,
		Start:         startTs,
		End:           endTs,
		IngredientID:  nil,
		Limit:         100,
		Offset:        0,
		Measurement:   "kg",
		IngredientIDs: "",
		SortBy:        "",
		SortOrder:     "",
	})
	require.NoError(t, err)
	require.Len(t, rows, 2)

	measurements := make(map[string]bool)
	for _, row := range rows {
		if row.Measurement != nil {
			measurements[*row.Measurement] = true
		}
	}
	require.True(t, measurements["kg"])
	require.False(t, measurements["liters"])
}

// TestIngredientReport_FilterByIngredientIDs tests filtering by ingredient_ids array
func TestIngredientReport_FilterByIngredientIDs(t *testing.T) {
	ctx := context.Background()

	storage := newStorage(t, ctx, globalEnv.q, "Test Storage 7")
	ing1 := newIngredient(t, ctx, globalEnv.q, "Pasta", "kg")
	ing2 := newIngredient(t, ctx, globalEnv.q, "Rice", "kg")
	ing3 := newIngredient(t, ctx, globalEnv.q, "Bread", "kg")

	now := ts(2026, time.January, 10, 12, 0)
	insertMovement(t, ctx, globalEnv.pool, storage, ing1, "invoice_in", 40, 0, 2.0, now)
	insertMovement(t, ctx, globalEnv.pool, storage, ing2, "invoice_in", 50, 0, 1.5, now)
	insertMovement(t, ctx, globalEnv.pool, storage, ing3, "invoice_in", 30, 0, 3.0, now)

	startTs := pgtype.Timestamptz{Time: ts(2026, time.January, 1, 0, 0), Valid: true}
	endTs := pgtype.Timestamptz{Time: ts(2026, time.January, 15, 0, 0), Valid: true}

	// Filter by two specific ingredients
	ingredientIDsStr := fmt.Sprintf("%s,%s", ing1.String(), ing3.String())
	rows, err := globalEnv.q.GetIngredientReport(ctx, pg.GetIngredientReportParams{
		StorageID:     storage,
		Start:         startTs,
		End:           endTs,
		IngredientID:  nil,
		Limit:         100,
		Offset:        0,
		Measurement:   "",
		IngredientIDs: ingredientIDsStr,
		SortBy:        "",
		SortOrder:     "",
	})
	require.NoError(t, err)
	require.Len(t, rows, 2)

	ingredientIDsReturned := make(map[string]bool)
	for _, row := range rows {
		ingredientIDsReturned[row.IngredientID.String()] = true
	}
	require.True(t, ingredientIDsReturned[ing1.String()])
	require.True(t, ingredientIDsReturned[ing3.String()])
	require.False(t, ingredientIDsReturned[ing2.String()])
}

// TestIngredientReport_NoSorting tests default behavior when no sort parameters provided
func TestIngredientReport_NoSorting(t *testing.T) {
	ctx := context.Background()

	storage := newStorage(t, ctx, globalEnv.q, "Test Storage 8")
	ing1 := newIngredient(t, ctx, globalEnv.q, "Zucchini", "kg")
	ing2 := newIngredient(t, ctx, globalEnv.q, "Apple", "kg")
	ing3 := newIngredient(t, ctx, globalEnv.q, "Mango", "kg")

	now := ts(2026, time.January, 10, 12, 0)
	insertMovement(t, ctx, globalEnv.pool, storage, ing1, "invoice_in", 10, 0, 2.0, now)
	insertMovement(t, ctx, globalEnv.pool, storage, ing2, "invoice_in", 10, 0, 1.5, now)
	insertMovement(t, ctx, globalEnv.pool, storage, ing3, "invoice_in", 10, 0, 3.0, now)

	startTs := pgtype.Timestamptz{Time: ts(2026, time.January, 1, 0, 0), Valid: true}
	endTs := pgtype.Timestamptz{Time: ts(2026, time.January, 15, 0, 0), Valid: true}

	// No sorting parameters - should default to ingredient name
	rows, err := globalEnv.q.GetIngredientReport(ctx, pg.GetIngredientReportParams{
		StorageID:     storage,
		Start:         startTs,
		End:           endTs,
		IngredientID:  nil,
		Limit:         100,
		Offset:        0,
		Measurement:   "",
		IngredientIDs: "",
		SortBy:        "",
		SortOrder:     "",
	})
	require.NoError(t, err)
	require.Len(t, rows, 3)
	require.Equal(t, "Apple", rows[0].IngredientName)
	require.Equal(t, "Mango", rows[1].IngredientName)
	require.Equal(t, "Zucchini", rows[2].IngredientName)
}
