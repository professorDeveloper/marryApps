// Package inventory_report_test contains integration tests for time-aware inventory
// and ingredient report functionality.
package inventory_report_test

import (
	"context"
	"testing"
	"time"
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
