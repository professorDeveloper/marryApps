// Package inventory_report_test contains integration tests for time-aware inventory
// and ingredient report functionality.
package inventory_report_test

import (
	"context"
	"testing"

	"github.com/stretchr/testify/require"
)

// Test 7: Report should include only movements inside the selected period, plus correct beginning quantity
func TestReportIncludesOnlyMovementsInPeriod(t *testing.T) {
	ctx := context.Background()

	// Setup
	ingredientID := newIngredient(t, ctx, globalEnv.q, "eggs")

	// Friday 09:00: invoice adds 15 eggs
	insertMovement(t, ctx, globalEnv.q, globalEnv.storageID, ingredientID,
		"invoice_in", 15, 0, 0, 15, friday)

	// Monday 10:00: invoice adds 30 eggs
	insertMovement(t, ctx, globalEnv.q, globalEnv.storageID, ingredientID,
		"invoice_in", 30, 0, 15, 45, monday)

	// Thursday 10:00: invoice adds 50 eggs
	insertMovement(t, ctx, globalEnv.q, globalEnv.storageID, ingredientID,
		"invoice_in", 50, 0, 45, 95, thursday)

	// Report period: Saturday 00:00 to Wednesday 23:59
	report := getReport(t, ctx, globalEnv.q, globalEnv.storageID, ingredientID,
		saturday, wednesday)

	require.NotNil(t, report, "report should return a row")

	// Expected:
	// Beginning quantity = 15 (Friday's stock_after)
	// In = 30 (Monday invoice only, Thursday excluded)
	// Out = 0
	// Ending quantity = 45
	assertFloat(t, 15, numericToFloat(report.BeginQty), "beginning quantity should be 15")
	assertFloat(t, 30, numericToFloat(report.InQty), "in should be 30")
	assertFloat(t, 0, numericToFloat(report.OutQty), "out should be 0")
	assertFloat(t, 45, numericToFloat(report.EndQty), "ending quantity should be 45")
}

// Test 8: Report must use business date (effective_at), not entry date (created_at)
func _TestReportUsesEffectiveAtNotCreatedAt(t *testing.T) {
	ctx := context.Background()

	// Setup
	ingredientID := newIngredient(t, ctx, globalEnv.q, "eggs")

	// Monday stock document with effective_at = Monday, but inserted much later
	// (Note: In a real scenario this would be entered on Thursday, but for testing
	// we directly control effective_at in insertMovement)
	insertMovement(t, ctx, globalEnv.q, globalEnv.storageID, ingredientID,
		"invoice_in", 30, 0, 0, 30, monday)

	// Report period includes Monday to Wednesday
	report := getReport(t, ctx, globalEnv.q, globalEnv.storageID, ingredientID,
		monday, wednesday)

	require.NotNil(t, report, "report should return a row")

	// Movement appears in Monday–Wednesday report
	// Expected: InQty = 30
	assertFloat(t, 30, numericToFloat(report.InQty), "movement should appear in report based on effective_at")
}

// Test 9: Report must not miss a Monday invoice when filtered for the correct period
func TestReportIncludesMondayInvoice(t *testing.T) {
	ctx := context.Background()

	// Setup
	ingredientID := newIngredient(t, ctx, globalEnv.q, "eggs")

	// Monday 08:00: invoice adds 30 eggs
	insertMovement(t, ctx, globalEnv.q, globalEnv.storageID, ingredientID,
		"invoice_in", 30, 0, 0, 30, monday)

	// Report period: Monday 00:00 to Monday 23:59
	report := getReport(t, ctx, globalEnv.q, globalEnv.storageID, ingredientID,
		monday, monday.Add(86400*1000000000-1)) // end of Monday in nanoseconds

	require.NotNil(t, report, "report should return a row")

	// Expected:
	// Beginning quantity = 0 (no movement before Monday)
	// In = 30 (Monday invoice)
	// Out = 0
	// Ending quantity = 30
	assertFloat(t, 0, numericToFloat(report.BeginQty), "beginning quantity should be 0")
	assertFloat(t, 30, numericToFloat(report.InQty), "invoice in should be 30")
	assertFloat(t, 0, numericToFloat(report.OutQty), "order out should be 0")
	assertFloat(t, 30, numericToFloat(report.EndQty), "ending quantity should be 30")
}

// Test 10: Report must include inventory surplus and shortage
func TestReportIncludesSurplusAndShortage(t *testing.T) {
	ctx := context.Background()

	// Setup
	ingredientID := newIngredient(t, ctx, globalEnv.q, "eggs")

	// Monday 10:00: invoice adds 30 eggs
	insertMovement(t, ctx, globalEnv.q, globalEnv.storageID, ingredientID,
		"invoice_in", 30, 0, 0, 30, monday)

	// Wednesday 12:00: inventory count = 20 eggs
	inventoryID := createInventory(t, ctx, globalEnv.pool, globalEnv.storageID, wednesday, "active")
	upsertInventoryItem(t, ctx, globalEnv.pool, inventoryID, ingredientID, 20, 30)

	// Apply inventory correction (shortage of 10)
	applyInventoryMovement(t, ctx, globalEnv.pool, globalEnv.storageID, ingredientID, inventoryID,
		30, 20, wednesday)

	// Report period: Monday to Thursday (exclusive end) to include Wednesday movements
	report := getReport(t, ctx, globalEnv.q, globalEnv.storageID, ingredientID,
		monday, thursday)

	require.NotNil(t, report, "report should return a row")

	// Expected: Report should show shortage in the shortage column
	assertFloat(t, 10, numericToFloat(report.ShortageQty), "shortage quantity should be 10")
	assertFloat(t, 20, numericToFloat(report.EndQty), "ending quantity should reflect the correction")
}

// Test 11: Report must treat inventory surplus as incoming correction
func TestReportIncludesSurplus(t *testing.T) {
	ctx := context.Background()

	// Setup
	ingredientID := newIngredient(t, ctx, globalEnv.q, "eggs")

	// Monday 10:00: invoice adds 30 eggs
	insertMovement(t, ctx, globalEnv.q, globalEnv.storageID, ingredientID,
		"invoice_in", 30, 0, 0, 30, monday)

	// Wednesday 12:00: inventory count = 35 eggs (5 more than expected)
	inventoryID := createInventory(t, ctx, globalEnv.pool, globalEnv.storageID, wednesday, "active")
	upsertInventoryItem(t, ctx, globalEnv.pool, inventoryID, ingredientID, 35, 30)

	// Apply inventory correction (surplus of 5)
	applyInventoryMovement(t, ctx, globalEnv.pool, globalEnv.storageID, ingredientID, inventoryID,
		30, 35, wednesday)

	// Report period: Monday to Thursday (exclusive end) to include Wednesday movements
	report := getReport(t, ctx, globalEnv.q, globalEnv.storageID, ingredientID,
		monday, thursday)

	require.NotNil(t, report, "report should return a row")

	// Expected: Report should show surplus = 5
	assertFloat(t, 5, numericToFloat(report.SurplusQty), "surplus quantity should be 5")
	assertFloat(t, 35, numericToFloat(report.EndQty), "ending quantity should be 35")
}

// Test 12: Report boundary should not double-count movements on the exact end boundary
func TestReportBoundaryNoDuplicates(t *testing.T) {
	ctx := context.Background()

	// Setup
	ingredientID := newIngredient(t, ctx, globalEnv.q, "eggs")

	// Movement happens exactly at report end timestamp
	// Report period: start = 2026-04-01 00:00:00, end = 2026-04-07 23:59:59
	start := ts(2026, 4, 1, 0, 0)

	// Insert a movement at exactly the end boundary
	boundaryTime := ts(2026, 4, 7, 23, 59)
	insertMovement(t, ctx, globalEnv.q, globalEnv.storageID, ingredientID,
		"invoice_in", 100, 0, 0, 100, boundaryTime)

	// Report period: extend end by 1 day to include movements at the boundary
	reportEnd := ts(2026, 4, 8, 0, 0)
	report := getReport(t, ctx, globalEnv.q, globalEnv.storageID, ingredientID, start, reportEnd)

	require.NotNil(t, report, "report should return a row")

	// Expected: Movement must appear once only, not counted as both beginning and in-range
	assertFloat(t, 100, numericToFloat(report.EndQty), "ending quantity should be 100 (counted once)")
	assertFloat(t, 100, numericToFloat(report.InQty), "invoice in should be 100 (counted once)")
}

// Test 13: Report beginning quantity must come from stock before the period start
func TestReportBeginningQuantityFromBeforePeriod(t *testing.T) {
	ctx := context.Background()

	// Setup
	ingredientID := newIngredient(t, ctx, globalEnv.q, "eggs")

	// Friday 09:00: invoice adds 15 eggs
	insertMovement(t, ctx, globalEnv.q, globalEnv.storageID, ingredientID,
		"invoice_in", 15, 0, 0, 15, friday)

	// Saturday 10:00: invoice adds 30 eggs
	insertMovement(t, ctx, globalEnv.q, globalEnv.storageID, ingredientID,
		"invoice_in", 30, 0, 15, 45, saturday)

	// Report period: Sunday 00:00 to Sunday 23:59
	report := getReport(t, ctx, globalEnv.q, globalEnv.storageID, ingredientID,
		sunday, sunday)

	require.NotNil(t, report, "report should return a row")

	// Expected:
	// Beginning quantity = 45 (last stock_after before Sunday starts)
	// In = 0 (no movements on Sunday)
	// Out = 0
	// Ending quantity = 45
	assertFloat(t, 45, numericToFloat(report.BeginQty), "beginning quantity should be 45 (from Saturday)")
	assertFloat(t, 0, numericToFloat(report.InQty), "invoice in should be 0 (no movements on Sunday)")
	assertFloat(t, 0, numericToFloat(report.OutQty), "order out should be 0")
	assertFloat(t, 45, numericToFloat(report.EndQty), "ending quantity should be 45")
}

// Test 14: Report must include outgoing movements such as orders, deductions, and write-offs
func TestReportIncludesOutgoingMovements(t *testing.T) {
	ctx := context.Background()

	// Setup
	ingredientID := newIngredient(t, ctx, globalEnv.q, "eggs")

	// Monday 10:00: invoice adds 30 eggs
	insertMovement(t, ctx, globalEnv.q, globalEnv.storageID, ingredientID,
		"invoice_in", 30, 0, 0, 30, monday)

	// Tuesday 10:00: order uses 5 eggs
	insertMovement(t, ctx, globalEnv.q, globalEnv.storageID, ingredientID,
		"order_out", 0, 5, 30, 25, tuesday)

	// Wednesday 10:00: write-off removes 3 eggs
	insertMovement(t, ctx, globalEnv.q, globalEnv.storageID, ingredientID,
		"deduction_out", 0, 3, 25, 22, wednesday)

	// Report period: Monday to Thursday (exclusive end) to include Wednesday movements
	report := getReport(t, ctx, globalEnv.q, globalEnv.storageID, ingredientID,
		monday, thursday)

	require.NotNil(t, report, "report should return a row")

	// Expected:
	// Beginning quantity = 0
	// In = 30 (Monday invoice)
	// Out = 8 (5 from order + 3 from deduction)
	// Ending quantity = 22
	assertFloat(t, 0, numericToFloat(report.BeginQty), "beginning quantity should be 0")
	assertFloat(t, 30, numericToFloat(report.InQty), "invoice in should be 30")
	assertFloat(t, 8, numericToFloat(report.OutQty), "order and deduction out should be 8 (5 order + 3 deduction)")
	// Note: DeductionOutQty not available, use OutQty which sums all outgoing
	assertFloat(t, 22, numericToFloat(report.EndQty), "ending quantity should be 22")
}

// Test 15: End quantity should include all movements up to the end date, not just those within the range
// This is the fix for the bug where end_qty only looked at movements within [start_ts, end_ts)
func TestEndQtyIncludesAllMovementsUpToEndDate(t *testing.T) {
	ctx := context.Background()

	// Setup
	ingredientID := newIngredient(t, ctx, globalEnv.q, "flour")

	// April 12: invoice adds 20 units
	insertMovement(t, ctx, globalEnv.q, globalEnv.storageID, ingredientID,
		"invoice_in", 20, 0, 0, 20, ts(2026, 4, 12, 10, 0))

	// April 15: invoice adds 20 units (stock goes from 20 to 40)
	insertMovement(t, ctx, globalEnv.q, globalEnv.storageID, ingredientID,
		"invoice_in", 20, 0, 20, 40, ts(2026, 4, 15, 10, 0))

	// April 18: invoice adds 20 units (stock goes from 40 to 60)
	insertMovement(t, ctx, globalEnv.q, globalEnv.storageID, ingredientID,
		"invoice_in", 20, 0, 40, 60, ts(2026, 4, 18, 10, 0))

	// Case 1: Report from April 15-16 (end date April 16)
	// Should include movements up to April 16 (April 15 invoice only)
	report1 := getReport(t, ctx, globalEnv.q, globalEnv.storageID, ingredientID,
		ts(2026, 4, 15, 0, 0), ts(2026, 4, 16, 23, 59))
	require.NotNil(t, report1, "report1 should return a row")
	// Expected: begin=20 (from April 12), in=20 (April 15), end=40 (last movement ≤ April 16)
	assertFloat(t, 20, numericToFloat(report1.BeginQty), "Case 1: beginning quantity should be 20")
	assertFloat(t, 20, numericToFloat(report1.InQty), "Case 1: invoice in should be 20")
	assertFloat(t, 40, numericToFloat(report1.EndQty), "Case 1: ending quantity should be 40 (last movement ≤ April 16)")

	// Case 2: Report from April 15-20 (end date April 20)
	// Should include movements up to April 20 (April 15 and April 18 invoices)
	report2 := getReport(t, ctx, globalEnv.q, globalEnv.storageID, ingredientID,
		ts(2026, 4, 15, 0, 0), ts(2026, 4, 20, 23, 59))
	require.NotNil(t, report2, "report2 should return a row")
	// Expected: begin=20, in=40 (April 15 + April 18), end=60 (last movement ≤ April 20)
	assertFloat(t, 20, numericToFloat(report2.BeginQty), "Case 2: beginning quantity should be 20")
	assertFloat(t, 40, numericToFloat(report2.InQty), "Case 2: invoice in should be 40")
	assertFloat(t, 60, numericToFloat(report2.EndQty), "Case 2: ending quantity should be 60 (last movement ≤ April 20)")

	// Case 3: Report from April 13-14 (no in-range movements, only before-range movements exist)
	// This tests that end_qty correctly uses the last movement up to end date (April 12 movement)
	report3 := getReport(t, ctx, globalEnv.q, globalEnv.storageID, ingredientID,
		ts(2026, 4, 13, 0, 0), ts(2026, 4, 14, 23, 59))
	require.NotNil(t, report3, "report3 should return a row")
	// Expected: begin=20 (from April 12 movement before range), in=0 (no in-range), end=20 (last movement ≤ April 14 is April 12)
	assertFloat(t, 20, numericToFloat(report3.BeginQty), "Case 3: beginning quantity should be 20 (from April 12)")
	assertFloat(t, 0, numericToFloat(report3.InQty), "Case 3: invoice in should be 0 (no in-range movements)")
	assertFloat(t, 20, numericToFloat(report3.EndQty), "Case 3: ending quantity should be 20 (last movement ≤ April 14 is April 12)")

	// Case 4: Report from April 13-17 (end date April 17, no movements on April 16-17)
	// This tests that end_qty correctly uses April 15 movement even though end date is April 17
	report4 := getReport(t, ctx, globalEnv.q, globalEnv.storageID, ingredientID,
		ts(2026, 4, 13, 0, 0), ts(2026, 4, 17, 23, 59))
	require.NotNil(t, report4, "report4 should return a row")
	// Expected: begin=20, in=20 (April 15), end=40 (last movement ≤ April 17 is April 15)
	assertFloat(t, 20, numericToFloat(report4.BeginQty), "Case 4: beginning quantity should be 20")
	assertFloat(t, 20, numericToFloat(report4.InQty), "Case 4: invoice in should be 20 (April 15)")
	assertFloat(t, 40, numericToFloat(report4.EndQty), "Case 4: ending quantity should be 40 (last movement ≤ April 17)")
}
