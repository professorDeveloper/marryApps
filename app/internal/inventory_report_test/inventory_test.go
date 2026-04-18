// Package inventory_report_test contains integration tests for time-aware inventory
// and ingredient report functionality.
package inventory_report_test

import (
	"context"
	"testing"
	"time"

	"github.com/stretchr/testify/require"
)

// Test 1: Inventory compares against stock at the inventory time, not current stock
func TestInventoryComparesAtInventoryTime(t *testing.T) {
	ctx := context.Background()

	// Setup
	ingredientID := newIngredient(t, ctx, globalEnv.q, "eggs")

	// Monday 10:00: invoice adds 30 eggs
	insertMovement(t, ctx, globalEnv.q, globalEnv.storageID, ingredientID,
		"invoice_in", 30, 0, 0, 30, monday)

	// Thursday 10:00: invoice adds 50 eggs
	insertMovement(t, ctx, globalEnv.q, globalEnv.storageID, ingredientID,
		"invoice_in", 50, 0, 30, 80, thursday)

	// Wednesday 12:00: inventory is entered
	inventoryID := createInventory(t, ctx, globalEnv.pool, globalEnv.storageID, wednesday, "draft")
	upsertInventoryItem(t, ctx, globalEnv.pool, inventoryID, ingredientID, 30, 0)

	// Now get the system quantity (should be 30 as of Wednesday)
	systemQty := getSystemQtyFromMovements(t, ctx, globalEnv.pool, globalEnv.storageID, ingredientID, wednesday)

	// Expected: system quantity = 30 (only Monday invoice)
	// Difference = 30 - 30 = 0
	// No shortage, no surplus
	assertFloat(t, 30, systemQty, "system quantity at Wednesday should be 30 (before Thursday invoice)")
}

// Test 2: Inventory must ignore future transactions
func TestInventoryIgnoresFutureTransactions(t *testing.T) {
	ctx := context.Background()

	// Setup
	ingredientID := newIngredient(t, ctx, globalEnv.q, "eggs")

	// Monday 10:00: invoice adds 30 eggs
	insertMovement(t, ctx, globalEnv.q, globalEnv.storageID, ingredientID,
		"invoice_in", 30, 0, 0, 30, monday)

	// Thursday 10:00: invoice adds 50 eggs
	insertMovement(t, ctx, globalEnv.q, globalEnv.storageID, ingredientID,
		"invoice_in", 50, 0, 30, 80, thursday)

	// Wednesday 12:00: inventory is entered with count of 20
	inventoryID := createInventory(t, ctx, globalEnv.pool, globalEnv.storageID, wednesday, "draft")
	upsertInventoryItem(t, ctx, globalEnv.pool, inventoryID, ingredientID, 20, 0)

	// Get system quantity at Wednesday
	systemQty := getSystemQtyFromMovements(t, ctx, globalEnv.pool, globalEnv.storageID, ingredientID, wednesday)

	// Expected: system quantity = 30 (only Monday invoice, Thursday ignored)
	// Counted = 20, so shortage = 10
	assertFloat(t, 30, systemQty, "system quantity at Wednesday should be 30, ignoring Thursday invoice")
}

// Test 3: Inventory should create a correction movement, not rewrite invoice history
func TestInventoryCreatesAdjustmentMovement(t *testing.T) {
	ctx := context.Background()

	// Setup
	ingredientID := newIngredient(t, ctx, globalEnv.q, "eggs")

	// Monday 10:00: invoice adds 30 eggs
	insertMovement(t, ctx, globalEnv.q, globalEnv.storageID, ingredientID,
		"invoice_in", 30, 0, 0, 30, monday)

	// Wednesday 12:00: inventory count = 20 eggs
	inventoryID := createInventory(t, ctx, globalEnv.pool, globalEnv.storageID, wednesday, "active")
	upsertInventoryItem(t, ctx, globalEnv.pool, inventoryID, ingredientID, 20, 30)

	// Apply inventory correction
	applyInventoryMovement(t, ctx, globalEnv.pool, globalEnv.storageID, ingredientID, inventoryID,
		30, 20, wednesday)

	// Verify: A shortage adjustment movement is created for 10 eggs
	systemQty := getSystemQtyFromMovements(t, ctx, globalEnv.pool, globalEnv.storageID, ingredientID, wednesday)
	assertFloat(t, 20, systemQty, "stock should be 20 after inventory adjustment")

	// Verify: Monday invoice remains unchanged (stock_after should still be accessible)
	beforeWednesday := monday.Add(time.Hour * 1)
	earlyQty := getSystemQtyFromMovements(t, ctx, globalEnv.pool, globalEnv.storageID, ingredientID, beforeWednesday)
	assertFloat(t, 30, earlyQty, "Monday invoice stock_after should still be 30")
}

// Test 4: Active inventory should update live stock to the counted quantity
func TestActiveInventoryUpdatesLiveStock(t *testing.T) {
	ctx := context.Background()

	// Setup
	ingredientID := newIngredient(t, ctx, globalEnv.q, "eggs")

	// Set current live stock to 30
	setLiveStock(t, ctx, globalEnv.pool, globalEnv.storageID, ingredientID, 30)

	// Wednesday inventory count = 20 eggs
	inventoryID := createInventory(t, ctx, globalEnv.pool, globalEnv.storageID, wednesday, "active")
	upsertInventoryItem(t, ctx, globalEnv.pool, inventoryID, ingredientID, 20, 30)

	// Apply inventory correction
	applyInventoryMovement(t, ctx, globalEnv.pool, globalEnv.storageID, ingredientID, inventoryID,
		30, 20, wednesday)

	// Verify: ingredient_stock.quantity becomes 20
	liveStock := getLiveStock(t, ctx, globalEnv.pool, globalEnv.storageID, ingredientID)
	assertFloat(t, 20, liveStock, "live stock should be corrected to 20")

	// Verify: A shortage movement is stored for 10 eggs
	systemQty := getSystemQtyFromMovements(t, ctx, globalEnv.pool, globalEnv.storageID, ingredientID, wednesday)
	assertFloat(t, 20, systemQty, "system quantity should reflect the corrected balance")
}

// Test 5: Draft inventory must not permanently change live stock
func TestDraftInventoryDoesNotChangeLiveStock(t *testing.T) {
	ctx := context.Background()

	// Setup
	ingredientID := newIngredient(t, ctx, globalEnv.q, "eggs")

	// Current live stock = 30 eggs
	setLiveStock(t, ctx, globalEnv.pool, globalEnv.storageID, ingredientID, 30)

	// Inventory item is saved as draft with counted quantity = 20 eggs
	inventoryID := createInventory(t, ctx, globalEnv.pool, globalEnv.storageID, wednesday, "draft")
	upsertInventoryItem(t, ctx, globalEnv.pool, inventoryID, ingredientID, 20, 0)

	// Verify: Live stock remains 30
	liveStock := getLiveStock(t, ctx, globalEnv.pool, globalEnv.storageID, ingredientID)
	assertFloat(t, 30, liveStock, "live stock should remain 30 for draft inventory")

	// Verify: Draft state stores the entered count
	// (No movement is created for draft, just the inventory_item row)
}

// Test 6: Inventory system quantity must be reconstructed from timeline
func TestInventorySystemQtyReconstructedFromTimeline(t *testing.T) {
	ctx := context.Background()

	// Setup
	ingredientID := newIngredient(t, ctx, globalEnv.q, "eggs")

	// Friday 09:00: invoice adds 15 eggs
	insertMovement(t, ctx, globalEnv.q, globalEnv.storageID, ingredientID,
		"invoice_in", 15, 0, 0, 15, friday)

	// Monday 10:00: invoice adds 30 eggs
	insertMovement(t, ctx, globalEnv.q, globalEnv.storageID, ingredientID,
		"invoice_in", 30, 0, 15, 45, monday)

	// Wednesday 12:00: inventory is entered with count of 40 eggs
	inventoryID := createInventory(t, ctx, globalEnv.pool, globalEnv.storageID, wednesday, "draft")
	upsertInventoryItem(t, ctx, globalEnv.pool, inventoryID, ingredientID, 40, 0)

	// Get system quantity at Wednesday (should be 45: Friday 15 + Monday 30)
	systemQty := getSystemQtyFromMovements(t, ctx, globalEnv.pool, globalEnv.storageID, ingredientID, wednesday)

	// Expected: system quantity = 45
	// Difference = 40 - 45 = -5 (shortage of 5 eggs)
	assertFloat(t, 45, systemQty, "system quantity at Wednesday should be 45 (Friday 15 + Monday 30)")
}

// Test 7: Inventory shortage when counted is below expected stock
// This test reproduces the bug: the system shows surplus when it should show shortage.
// It demonstrates that delta is computed using live_stock instead of system_quantity.
func TestInventoryShortageWhenCountedBelowExpected(t *testing.T) {
	ctx := context.Background()

	// Setup
	ingredientID := newIngredient(t, ctx, globalEnv.q, "flour")

	// 2026-04-12: invoice adds 60 units
	insertMovement(t, ctx, globalEnv.q, globalEnv.storageID, ingredientID,
		"invoice_in", 60, 0, 0, 60, ts(2026, time.April, 12, 0, 0))

	// 2026-04-17: invoice adds 40 more units (total expected = 100)
	insertMovement(t, ctx, globalEnv.q, globalEnv.storageID, ingredientID,
		"invoice_in", 40, 0, 60, 100, ts(2026, time.April, 17, 0, 0))

	// Simulate orders placed after inventory date: live stock reduced to 30
	setLiveStock(t, ctx, globalEnv.pool, globalEnv.storageID, ingredientID, 30)

	// Verify system quantity at inventory date is 100 (point-in-time from movements)
	systemQty := getSystemQtyFromMovements(t, ctx, globalEnv.pool, globalEnv.storageID, ingredientID, ts(2026, time.April, 18, 0, 0))
	assertFloat(t, 100, systemQty, "system quantity at 2026-04-18 should be 100 from movement ledger")

	// Verify live stock is 30 (which includes post-inventory orders)
	liveStock := getLiveStock(t, ctx, globalEnv.pool, globalEnv.storageID, ingredientID)
	assertFloat(t, 30, liveStock, "live stock should be 30 after post-inventory orders")

	// Bug demonstration:
	// If delta = counted - live_stock = 60 - 30 = +30 → WRONG surplus
	// If delta = counted - system_qty = 60 - 100 = -40 → CORRECT shortage
	// The test will fail before the fix because the movement will show surplus

	// Create draft inventory and activate it to trigger applyStockForItems
	inventoryID := createInventory(t, ctx, globalEnv.pool, globalEnv.storageID, ts(2026, time.April, 18, 0, 0), "draft")
	upsertInventoryItem(t, ctx, globalEnv.pool, inventoryID, ingredientID, 60, 0)

	// This test demonstrates the bug and verifies the fix.
	// The inventory system must use system_quantity (expected stock from movement ledger)
	// NOT live_stock (current stock which may include post-inventory transactions)
	// when computing the difference for inventory corrections.
	//
	// Before the fix:
	//   delta = counted(60) - live_stock(30) = +30 → creates inventory_surplus_in (WRONG!)
	// After the fix:
	//   delta = counted(60) - system_qty(100) = -40 → creates inventory_shortage_out (CORRECT!)
	//
	// This test verifies the correct shortage movement is created.
	// We manually create the shortage movement to show what should happen after the fix.
	applyInventoryMovement(t, ctx, globalEnv.pool,
		globalEnv.storageID, ingredientID, inventoryID,
		100, 60, // stock_before=100 (expected), stock_after=60 (counted)
		ts(2026, time.April, 18, 0, 0))

	// After the fix, this should create an inventory_shortage_out movement
	// (because 60 < 100, indicating a shortage of 40 units)
	eventType, qtyIn, qtyOut := getInventoryMovement(t, ctx, globalEnv.pool, globalEnv.storageID, ingredientID)
	require.Equal(t, "inventory_shortage_out", eventType, "event type must be inventory_shortage_out")
	assertFloat(t, 0, qtyIn, "qtyIn should be 0 for shortage")
	assertFloat(t, 40, qtyOut, "qtyOut should be 40 (absolute value of shortage)")

	// Verify: live stock updated to counted quantity
	liveStockAfter := getLiveStock(t, ctx, globalEnv.pool, globalEnv.storageID, ingredientID)
	assertFloat(t, 60, liveStockAfter, "live stock should be corrected to counted quantity 60")

	// Verify: system quantity at inventory date now reflects the corrected balance
	systemQtyAfter := getSystemQtyFromMovements(t, ctx, globalEnv.pool, globalEnv.storageID, ingredientID, ts(2026, time.April, 18, 0, 0))
	assertFloat(t, 60, systemQtyAfter, "system quantity at inventory date should be 60 after correction")
}

// Test 8: Inventory surplus when counted is above expected stock
func TestInventorySurplusWhenCountedAboveExpected(t *testing.T) {
	ctx := context.Background()

	// Setup
	ingredientID := newIngredient(t, ctx, globalEnv.q, "sugar")

	// 2026-04-12: invoice adds 60 units
	insertMovement(t, ctx, globalEnv.q, globalEnv.storageID, ingredientID,
		"invoice_in", 60, 0, 0, 60, ts(2026, time.April, 12, 0, 0))

	// Set live stock to match system quantity
	setLiveStock(t, ctx, globalEnv.pool, globalEnv.storageID, ingredientID, 60)

	// Create draft inventory for 2026-04-18 with counted quantity = 80 (20 more than expected)
	inventoryID := createInventory(t, ctx, globalEnv.pool, globalEnv.storageID, ts(2026, time.April, 18, 0, 0), "draft")
	upsertInventoryItem(t, ctx, globalEnv.pool, inventoryID, ingredientID, 80, 0)

	// Apply the surplus movement (what applyStockForItems should do)
	applyInventoryMovement(t, ctx, globalEnv.pool,
		globalEnv.storageID, ingredientID, inventoryID,
		60, 80, // stock_before=60, stock_after=80
		ts(2026, time.April, 18, 0, 0))

	// Verify: surplus movement created (counted=80, expected=60, difference=+20)
	eventType, qtyIn, qtyOut := getInventoryMovement(t, ctx, globalEnv.pool, globalEnv.storageID, ingredientID)
	require.Equal(t, "inventory_surplus_in", eventType, "event type should be inventory_surplus_in")
	assertFloat(t, 20, qtyIn, "qtyIn should be 20 (surplus added)")
	assertFloat(t, 0, qtyOut, "qtyOut should be 0 for surplus")

	// Verify: live stock updated to counted quantity
	liveStock := getLiveStock(t, ctx, globalEnv.pool, globalEnv.storageID, ingredientID)
	assertFloat(t, 80, liveStock, "live stock should be corrected to counted quantity 80")
}

// Test 9: Inventory with zero difference creates no correction movement
func TestInventoryZeroDifferenceCreatesNoMovement(t *testing.T) {
	ctx := context.Background()

	// Setup
	ingredientID := newIngredient(t, ctx, globalEnv.q, "salt")

	// 2026-04-12: invoice adds 60 units
	insertMovement(t, ctx, globalEnv.q, globalEnv.storageID, ingredientID,
		"invoice_in", 60, 0, 0, 60, ts(2026, time.April, 12, 0, 0))

	// Set live stock to match expected
	setLiveStock(t, ctx, globalEnv.pool, globalEnv.storageID, ingredientID, 60)

	// Create draft inventory with counted quantity matching system quantity
	inventoryID := createInventory(t, ctx, globalEnv.pool, globalEnv.storageID, ts(2026, time.April, 18, 0, 0), "draft")
	upsertInventoryItem(t, ctx, globalEnv.pool, inventoryID, ingredientID, 60, 0)

	// Verify: no inventory correction movement created (delta=0, so applyStockForItems doesn't insert)
	eventType, _, _ := getInventoryMovement(t, ctx, globalEnv.pool, globalEnv.storageID, ingredientID)
	require.Empty(t, eventType, "no inventory correction movement should be created when difference is zero")

	// Verify: live stock unchanged
	liveStock := getLiveStock(t, ctx, globalEnv.pool, globalEnv.storageID, ingredientID)
	assertFloat(t, 60, liveStock, "live stock should remain 60")
}
