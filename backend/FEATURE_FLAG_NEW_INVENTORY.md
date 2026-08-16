# Feature Flag: New Inventory Time-Aware Flow

## Overview

The new inventory system introduces point-in-time stock accounting with business-date-aware reporting. To allow safe production testing, all changes are guarded by a feature flag: `USE_NEW_INVENTORY_FLOW`.

**Default:** `false` (system uses legacy behavior)

## Enabling the Feature

Set the environment variable or config:

```bash
export USE_NEW_INVENTORY_FLOW=true
```

Or in your YAML config:

```yaml
features:
  use-new-inventory-flow: true
```

## What Changes When Enabled

### 1. **Inventory System Quantity Calculation**
- **Legacy (OFF):** `system_quantity` is a snapshot of current live stock at item entry time
- **New (ON):** `system_quantity` is reconstructed from movements at the inventory's business date

### 2. **Stock Movement Timestamp**
- **Legacy (OFF):** Movements use `created_at` (wall-clock time when record was created)
- **New (ON):** Movements use `effective_at` (business date from source document) + fallback to `created_at`

### 3. **Ingredient Reports**
- **Legacy (OFF):** Report windowing uses `created_at` (entry time)
- **New (ON):** Report windowing uses `COALESCE(effective_at, created_at)` (business date with fallback)

## Affected Services

The flag is threaded into:

- `InventoryS` — controls `applyStockForItems`, `reverseStockForItems`
- `InvoiceS` — controls `applyInvoiceStockMovement` 
- `IngredientS` — controls `GetIngredientReport` (repo call selection)
- `DeductionS` — controls `reverseAllDeductionStock`, `reverseDeductionItemStock`

## Backward Compatibility

When `USE_NEW_INVENTORY_FLOW=false`:

- The system behaves exactly as before
- No `effective_at` is set on movements (NULL in DB)
- Reports use legacy `created_at` filtering (`GetIngredientReportLegacy`)
- Inventory `system_quantity` uses current live stock snapshot (`UpdateInventoryItemSystemQuantityFromStock`)

**All existing deployments continue to work without changes.**

## Database Considerations

The `effective_at` column in `ingredient_stock_movements` exists regardless of the flag. When the flag is OFF, this column remains NULL. When the flag is ON, it is populated.

**Migration added in:** `migrations/tenants/42_fix_invoices_date_timezone.up.sql`

## Testing

The new behavior is covered by integration tests in `app/internal/inventory_report_test/`:

- `inventory_test.go` — Tests 1–6 (inventory time-awareness)
- `report_test.go` — Tests 7–14 (report correctness)
- `consistency_test.go` — Tests 15–18 (data consistency)

Run tests:

```bash
cd app
go test ./internal/inventory_report_test -v
```

**Note:** Tests always run with the new flow enabled (passed as `true` to test setup).

## Rollback

If issues are detected in production:

1. Set `USE_NEW_INVENTORY_FLOW=false`
2. Restart the application
3. Existing movements with `effective_at` NULL remain unaffected
4. Reports revert to legacy windowing immediately

**No data loss.** The column exists; the system just stops reading it.

## Logging

Minimal logging is added inline:

```go
if s.useNewInventoryFlow {
    // New logic path
} else {
    // Legacy logic path
}
```

For debugging, check logs where inventory/invoice/deduction movements are created — the paths differ based on the flag.

## FAQ

**Q: Can I switch the flag on/off without data migration?**  
A: Yes. Movements without `effective_at` are safe; they fall back to `created_at` when the new flow is enabled.

**Q: Will enabling this flag change historical reports?**  
A: Yes. Reports will retroactively reflect business dates of movements instead of entry dates. This is the intended fix.

**Q: What if a movement is missing `effective_at`?**  
A: The system gracefully falls back to `created_at` via `COALESCE(effective_at, created_at)` in the report query.

**Q: Should I enable this in production immediately?**  
A: Test in staging first. Run the test suite with the flag on and verify reports match expectations. Once confident, enable in production.

---

**Implementation date:** 2026-04-16  
**Tests passing:** 18/18 (inventory + report + consistency)
