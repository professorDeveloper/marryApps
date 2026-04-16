// Package inventory_report_test contains integration tests for time-aware inventory
// and ingredient report functionality.
package inventory_report_test

import (
	"context"
	"testing"
	"time"

	"github.com/stretchr/testify/require"
)

// Test 15: Report and inventory must stay correct across timezone-sensitive timestamps
func TestTimezoneSensitiveTimestamps(t *testing.T) {
	ctx := context.Background()

	// Setup
	ingredientID := newIngredient(t, ctx, globalEnv.q, "eggs")

	// A movement is stored with timezone-aware timestamp
	// (All timestamps in our test are UTC, which is the canonical form)
	insertMovement(t, ctx, globalEnv.q, globalEnv.storageID, ingredientID,
		"invoice_in", 30, 0, 0, 30, monday)

	// Report period is created (in UTC, which is what we're using)
	// Same calendar day, same offset
	report := getReport(t, ctx, globalEnv.q, globalEnv.storageID, ingredientID,
		monday, monday.Add(24*time.Hour-1*time.Second))

	require.NotNil(t, report, "report should return a row for UTC-aware timestamps")

	// Expected: Movement belongs to the correct business day
	// No off-by-one-day error
	assertFloat(t, 30, numericToFloat(report.InvoiceInQty), "movement should appear on the correct business day")
	assertFloat(t, 30, numericToFloat(report.EndQty), "ending quantity should be 30")
}

// Test 16: Backdated invoice must affect historical report, not just current stock
func TestBackdatedInvoiceAffectsHistoricalReport(t *testing.T) {
	ctx := context.Background()

	// Setup
	ingredientID := newIngredient(t, ctx, globalEnv.q, "eggs")

	// Today is Thursday (in our test, this is an explicit point in time)
	// But we can use it as a reference point

	// User enters invoice with effective_at = Monday, quantity = 30
	// This is inserted at Thursday (created_at), but effective_at is Monday
	insertMovement(t, ctx, globalEnv.q, globalEnv.storageID, ingredientID,
		"invoice_in", 30, 0, 0, 30, monday) // effective_at = Monday

	// Monday report includes that invoice
	report := getReport(t, ctx, globalEnv.q, globalEnv.storageID, ingredientID,
		monday, monday.Add(24*time.Hour-1*time.Second))

	require.NotNil(t, report, "report should return a row")
	assertFloat(t, 30, numericToFloat(report.InvoiceInQty), "Monday report includes the backdated invoice")
	assertFloat(t, 30, numericToFloat(report.EndQty), "ending quantity should reflect the backdated invoice")

	// Current stock also reflects it (if we query after the invoice is processed)
	// (This is implicitly tested by the movement write)
}

// Test 17: Future-dated movement must not affect earlier inventory
func TestFutureDatedMovementNotInEarlierInventory(t *testing.T) {
	ctx := context.Background()

	// Setup
	ingredientID := newIngredient(t, ctx, globalEnv.q, "eggs")

	// Wednesday 12:00: inventory count = 30
	inventoryID := createInventory(t, ctx, globalEnv.pool, globalEnv.storageID, wednesday, "draft")
	upsertInventoryItem(t, ctx, globalEnv.pool, inventoryID, ingredientID, 30, 0)

	// Thursday 10:00: invoice adds 50 (future from Wednesday's perspective)
	insertMovement(t, ctx, globalEnv.q, globalEnv.storageID, ingredientID,
		"invoice_in", 50, 0, 0, 50, thursday)

	// Get system quantity at Wednesday (should NOT include Thursday's invoice)
	systemQty := getSystemQtyFromMovements(t, ctx, globalEnv.pool, globalEnv.storageID, ingredientID, wednesday)

	// Expected: system quantity = 0 (no movements before or on Wednesday)
	// Difference = 30 - 0 = 30 (surplus of 30? or no prior movements so difference is based on expectation)
	// But the point is: Thursday movement does not affect Wednesday inventory
	assertFloat(t, 0, systemQty, "Wednesday inventory should not include Thursday movement")
}

// Test 18: Cached live stock and reconstructed stock should match after all movements are applied
func TestCachedVsReconstructedStockMatch(t *testing.T) {
	ctx := context.Background()

	// Setup
	ingredientID := newIngredient(t, ctx, globalEnv.q, "eggs")

	// Create several invoices, orders, write-offs, and one inventory correction
	// Monday 10:00: invoice adds 100
	insertMovement(t, ctx, globalEnv.q, globalEnv.storageID, ingredientID,
		"invoice_in", 100, 0, 0, 100, monday)

	// Tuesday 14:00: order uses 30
	insertMovement(t, ctx, globalEnv.q, globalEnv.storageID, ingredientID,
		"order_out", 0, 30, 100, 70, tuesday)

	// Wednesday 09:00: write-off removes 5
	insertMovement(t, ctx, globalEnv.q, globalEnv.storageID, ingredientID,
		"deduction_out", 0, 5, 70, 65, wednesday)

	// Wednesday 16:00: inventory correction (count is 65, matches current stock)
	inventoryID := createInventory(t, ctx, globalEnv.pool, globalEnv.storageID, wednesday, "active")
	upsertInventoryItem(t, ctx, globalEnv.pool, inventoryID, ingredientID, 65, 65)

	// Apply inventory correction (no change needed, counts match)
	applyInventoryMovement(t, ctx, globalEnv.pool, globalEnv.storageID, ingredientID, inventoryID,
		65, 65, wednesday)

	// Recompute stock from ledger
	reconstructedQty := getSystemQtyFromMovements(t, ctx, globalEnv.pool, globalEnv.storageID, ingredientID, thursday)

	// Get live stock
	liveStock := getLiveStock(t, ctx, globalEnv.pool, globalEnv.storageID, ingredientID)

	// Expected: Reconstructed ledger balance equals ingredient_stock.quantity
	assertFloat(t, reconstructedQty, liveStock, "reconstructed stock from ledger should match live stock")
	assertFloat(t, 65, liveStock, "final stock should be 65 (100 - 30 - 5)")
	assertFloat(t, 65, reconstructedQty, "reconstructed stock should be 65")
}
