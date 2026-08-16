package inventory_report_test

import (
	"context"
	"testing"
	"time"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/stretchr/testify/require"

	pg "gitlab.yurtal.tech/company/maryai/back/internal/repository/pg/tenantsdb"
)

// TestInventoryStatusReport_RecentCount tests the report when an ingredient
// has an inventory event. The begin_qty should be stock_after from that event,
// and subsequent movements are summed normally.
func TestInventoryStatusReport_RecentCount(t *testing.T) {
	ctx := context.Background()
	ingredientID := newIngredient(t, ctx, globalEnv.q, "flour-status-a")

	t3 := ts(2026, time.February, 1, 8, 0)
	t2 := ts(2026, time.February, 2, 8, 0)
	t1 := ts(2026, time.February, 3, 8, 0)
	t0 := ts(2026, time.February, 4, 8, 0)
	endTs := ts(2026, time.February, 5, 0, 0)

	insertMovement(t, ctx, globalEnv.q, globalEnv.storageID, ingredientID,
		"invoice_in", 10, 0, 0, 10, t3)
	insertMovement(t, ctx, globalEnv.q, globalEnv.storageID, ingredientID,
		"order_out", 0, 2, 10, 8, t2)
	// Inventory event at t1: stock_after=5 (shortage of 3 units)
	applyInventoryMovement(t, ctx, globalEnv.pool,
		globalEnv.storageID, ingredientID, createInventory(t, ctx, globalEnv.pool, globalEnv.storageID, t1, "active"),
		8, 5, t1)
	insertMovement(t, ctx, globalEnv.q, globalEnv.storageID, ingredientID,
		"order_out", 0, 2, 5, 3, t0)

	rows, err := globalEnv.q.GetIngredientInventoryStatusReport(ctx, pg.GetIngredientInventoryStatusReportParams{
		StorageID:    globalEnv.storageID,
		End:          pgtype.Timestamptz{Time: endTs, Valid: true},
		IngredientID: &ingredientID,
		Limit:        10,
		Offset:       0,
	})
	require.NoError(t, err)
	require.Len(t, rows, 1)

	r := rows[0]
	assertFloat(t, 5, numericToFloat(r.BeginQty), "begin_qty should be stock_after from inventory event")
	assertFloat(t, 0, numericToFloat(r.InQty), "no in_qty movements after inventory event")
	assertFloat(t, 2, numericToFloat(r.OutQty), "one order_out after inventory event")
	assertFloat(t, 3, numericToFloat(r.EndQty), "end_qty = begin(5) - out(2)")
}

// TestInventoryStatusReport_FreshIngredient tests when an ingredient has never been
// counted (no inventory event). In this case, begin_qty=0, and all movements are summed.
func TestInventoryStatusReport_FreshIngredient(t *testing.T) {
	ctx := context.Background()
	ingredientID := newIngredient(t, ctx, globalEnv.q, "salt-status-b")

	t2 := ts(2026, time.March, 1, 8, 0)
	t1 := ts(2026, time.March, 2, 8, 0)
	endTs := ts(2026, time.March, 3, 0, 0)

	insertMovement(t, ctx, globalEnv.q, globalEnv.storageID, ingredientID,
		"invoice_in", 15, 0, 0, 15, t2)
	insertMovement(t, ctx, globalEnv.q, globalEnv.storageID, ingredientID,
		"order_out", 0, 5, 15, 10, t1)

	rows, err := globalEnv.q.GetIngredientInventoryStatusReport(ctx, pg.GetIngredientInventoryStatusReportParams{
		StorageID:    globalEnv.storageID,
		End:          pgtype.Timestamptz{Time: endTs, Valid: true},
		IngredientID: &ingredientID,
		Limit:        10,
		Offset:       0,
	})
	require.NoError(t, err)
	require.Len(t, rows, 1)

	r := rows[0]
	assertFloat(t, 0, numericToFloat(r.BeginQty), "begin_qty=0 with no inventory event")
	assertFloat(t, 15, numericToFloat(r.InQty), "all invoice_in counted")
	assertFloat(t, 5, numericToFloat(r.OutQty), "all order_out counted")
	assertFloat(t, 10, numericToFloat(r.EndQty), "end_qty = begin(0) + in(15) - out(5)")
}

// TestInventoryStatusReport_Mixed tests that two ingredients (one counted, one never counted)
// both return correct data in the same request.
func TestInventoryStatusReport_Mixed(t *testing.T) {
	ctx := context.Background()

	ingA := newIngredient(t, ctx, globalEnv.q, "pepper-status-c-a")
	ingB := newIngredient(t, ctx, globalEnv.q, "pepper-status-c-b")

	t3 := ts(2026, time.April, 1, 8, 0)
	t2 := ts(2026, time.April, 2, 8, 0)
	t1 := ts(2026, time.April, 3, 8, 0)
	t0 := ts(2026, time.April, 4, 8, 0)
	endTs := ts(2026, time.April, 5, 0, 0)

	// Ingredient A: receives inventory event
	insertMovement(t, ctx, globalEnv.q, globalEnv.storageID, ingA,
		"invoice_in", 20, 0, 0, 20, t3)
	applyInventoryMovement(t, ctx, globalEnv.pool,
		globalEnv.storageID, ingA, createInventory(t, ctx, globalEnv.pool, globalEnv.storageID, t2, "active"),
		20, 18, t2)
	insertMovement(t, ctx, globalEnv.q, globalEnv.storageID, ingA,
		"order_out", 0, 3, 18, 15, t1)

	// Ingredient B: no inventory event
	insertMovement(t, ctx, globalEnv.q, globalEnv.storageID, ingB,
		"invoice_in", 50, 0, 0, 50, t3)
	insertMovement(t, ctx, globalEnv.q, globalEnv.storageID, ingB,
		"order_out", 0, 10, 50, 40, t0)

	// Get both ingredients in separate calls since they may be mixed with other test data
	rowA, err := globalEnv.q.GetIngredientInventoryStatusReport(ctx, pg.GetIngredientInventoryStatusReportParams{
		StorageID:    globalEnv.storageID,
		End:          pgtype.Timestamptz{Time: endTs, Valid: true},
		IngredientID: &ingA,
		Limit:        10,
		Offset:       0,
	})
	require.NoError(t, err)
	require.Len(t, rowA, 1, "should have 1 row for ingredient A")

	rowB, err := globalEnv.q.GetIngredientInventoryStatusReport(ctx, pg.GetIngredientInventoryStatusReportParams{
		StorageID:    globalEnv.storageID,
		End:          pgtype.Timestamptz{Time: endTs, Valid: true},
		IngredientID: &ingB,
		Limit:        10,
		Offset:       0,
	})
	require.NoError(t, err)
	require.Len(t, rowB, 1, "should have 1 row for ingredient B")

	// Ingredient A: has inventory event at t2 with stock_after=18
	a := rowA[0]
	assertFloat(t, 18, numericToFloat(a.BeginQty), "A: begin_qty = stock_after of inventory event")
	assertFloat(t, 3, numericToFloat(a.OutQty), "A: only order_out after inventory event")
	assertFloat(t, 15, numericToFloat(a.EndQty), "A: end_qty = begin(18) - out(3)")

	// Ingredient B: no inventory event, begins at 0
	b := rowB[0]
	assertFloat(t, 0, numericToFloat(b.BeginQty), "B: no inventory event, begin=0")
	assertFloat(t, 50, numericToFloat(b.InQty), "B: full invoice_in counted")
	assertFloat(t, 10, numericToFloat(b.OutQty), "B: full order_out counted")
	assertFloat(t, 40, numericToFloat(b.EndQty), "B: end_qty = begin(0) + in(50) - out(10)")
}

// TestInventoryStatusReport_InventoryEventNotCountedInSums verifies that the inventory
// event row itself does NOT appear in the in_qty/out_qty/shortage_qty sums.
func TestInventoryStatusReport_InventoryEventNotCountedInSums(t *testing.T) {
	ctx := context.Background()
	ingredientID := newIngredient(t, ctx, globalEnv.q, "rice-status-d")

	t1 := ts(2026, time.May, 1, 10, 0)
	endTs := ts(2026, time.May, 2, 0, 0)

	// Single inventory event: stock_after=25 (shortage of 5)
	// No movements after it.
	applyInventoryMovement(t, ctx, globalEnv.pool,
		globalEnv.storageID, ingredientID,
		createInventory(t, ctx, globalEnv.pool, globalEnv.storageID, t1, "active"),
		30, 25, t1)

	rows, err := globalEnv.q.GetIngredientInventoryStatusReport(ctx, pg.GetIngredientInventoryStatusReportParams{
		StorageID:    globalEnv.storageID,
		End:          pgtype.Timestamptz{Time: endTs, Valid: true},
		IngredientID: &ingredientID,
		Limit:        10,
		Offset:       0,
	})
	require.NoError(t, err)
	require.Len(t, rows, 1)

	r := rows[0]
	assertFloat(t, 25, numericToFloat(r.BeginQty), "begin=stock_after of event")
	assertFloat(t, 0, numericToFloat(r.OutQty), "inventory event itself not in out_qty")
	assertFloat(t, 0, numericToFloat(r.ShortageQty), "shortage_qty only counts movements after anchor")
	assertFloat(t, 25, numericToFloat(r.EndQty), "end=begin with no subsequent movements")
}

// TestInventoryStatusReport_NoInventoryEventMultipleInvoices verifies that when an
// ingredient has NO inventory events (only regular movements), all movements are summed.
// This is a regression test for the bug where sums CTE was using INNER JOIN instead of LEFT JOIN.
func TestInventoryStatusReport_NoInventoryEventMultipleInvoices(t *testing.T) {
	ctx := context.Background()
	ingredientID := newIngredient(t, ctx, globalEnv.q, "oil-status-e")

	t1 := ts(2026, time.June, 1, 8, 0)
	t2 := ts(2026, time.June, 2, 8, 0)
	endTs := ts(2026, time.June, 3, 0, 0)

	// Two invoices, NO inventory event
	insertMovement(t, ctx, globalEnv.q, globalEnv.storageID, ingredientID,
		"invoice_in", 30, 0, 0, 30, t1)
	insertMovement(t, ctx, globalEnv.q, globalEnv.storageID, ingredientID,
		"invoice_in", 40, 0, 30, 70, t2)

	rows, err := globalEnv.q.GetIngredientInventoryStatusReport(ctx, pg.GetIngredientInventoryStatusReportParams{
		StorageID:    globalEnv.storageID,
		End:          pgtype.Timestamptz{Time: endTs, Valid: true},
		IngredientID: &ingredientID,
		Limit:        10,
		Offset:       0,
	})
	require.NoError(t, err)
	require.Len(t, rows, 1)

	r := rows[0]
	// With no inventory event, both invoices should be included
	assertFloat(t, 0, numericToFloat(r.BeginQty), "begin_qty=0 with no inventory event")
	assertFloat(t, 70, numericToFloat(r.InQty), "both invoices summed: 30 + 40")
	assertFloat(t, 0, numericToFloat(r.OutQty), "no out movements")
	assertFloat(t, 70, numericToFloat(r.EndQty), "end_qty = 0 + 70")
}
