# Stock Reduction Issue - Root Cause Analysis

## Why Stock Wasn't Being Reduced

There were **THREE primary causes**:

### 1. **Missing Stock Consumption in `CreateOrderItems` (PRIMARY BUG)**
   - **Location**: `order.go:1948` (CreateOrderItems method)
   - **Issue**: This method was creating order items WITHOUT calling `consumeItemStock()`
   - **Impact**: If your API was using this endpoint to add items, no stock was ever deducted
   - **Status**: ✅ FIXED - Now consumes stock when items are created

### 2. **Goods Without Ingredient Calculations (CONFIGURATION ISSUE)**
   - **Cause**: Good items must have recipes/bill-of-materials (BOM) defined in the database
   - **Table**: `goods_calculations` table needs entries mapping each good to its ingredients
   - **Detection**: If you see `"WARN: Good X has no ingredient calculations configured"` in logs
   - **Action Required**: Set up ingredient calculations for each good in your system
   - **Check Query**:
     ```sql
     SELECT good_id, COUNT(*) as ingredient_count 
     FROM goods_calculations 
     GROUP BY good_id;
     ```

### 3. **Goods Without Storage Assignment (CONFIGURATION ISSUE)**
   - **Cause**: Each good's category must belong to a department with a `storage_id` assigned
   - **Tables**: `categories` → `departments` → `storages`
   - **Detection**: If you see `"ERROR: No storage configured for good X"` in logs
   - **Action Required**: Ensure the good's category links to a department with storage configured
   - **Check Query**:
     ```sql
     SELECT g.id, g.name, c.name as category, d.name as department, d.storage_id
     FROM goods g
     JOIN categories c ON g.category_id = c.id
     JOIN departments d ON c.department_id = d.id
     WHERE d.storage_id IS NULL;
     ```

## Stock Reduction Flow (After Fix)

### When Order is Created
```
CreateOrder()
  └─ For each item:
      1. Create order item
      2. Save modifiers
      3. [NEW] Call consumeItemStock()
         ├─ Get storage from good's department
         ├─ Expand good → ingredients (via calculations)
         ├─ For each ingredient:
         │   ├─ Ensure stock row exists
         │   ├─ Lock stock row (FOR UPDATE)
         │   ├─ Deduct quantity from ingredient_stock.quantity
         │   └─ Record stock movement (audit trail)
         └─ Return success/error
```

### When Items Added to Existing Order
```
AddOrderItems()
  └─ For each item:
      1. Create order item
      2. Save modifiers
      3. [EXISTING] Call consumeItemStock()
         └─ Same as above
```

### When Items Created Separately
```
CreateOrderItems()
  └─ For each item:
      1. Create order item
      2. Save modifiers
      3. [NEW] Call consumeItemStock()
         └─ Same as above
```

## New Debug Logging

All three methods now emit detailed logs with emoji indicators:

- `🔄` = Starting stock consumption for an item
- `✓` = Step completed successfully
- `❌` = Error occurred
- `⚠️` = Warning (e.g., no ingredients configured)
- `✅` = Stock consumption succeeded

### Example Log Output
```
🔄 [ORDER 5abc1234] Consuming stock for good 7def5678 (qty: 2)...

=== STOCK CONSUMPTION START ===
Good ID: 7def5678-... | Order ID: 5abc1234-... | Quantity: 2
✓ Storage found: 9ghi0123-...
✓ Ingredient usages expanded: 3 ingredients found

  📦 Processing ingredient: 1jkl4567-...
  ✓ Stock row ensured: 2mno8901-...
  ✓ Stock locked | Before: 100 | To Reduce: 5
  ✅ REDUCED | Before: 100 | After: 95 | Reduced By: 5
  ✓ Stock movement recorded (order_out event)

  📦 Processing ingredient: 3pqr2345-...
  ...

=== STOCK CONSUMPTION SUCCESS ===

✅ [ORDER 5abc1234] Stock consumption SUCCESS for good 7def5678
```

## Verification Checklist

After deployment, verify stock reduction is working:

1. ✅ Check application logs for success messages
2. ✅ Query `ingredient_stock` table - quantities should decrease
3. ✅ Query `ingredient_stock_movements` table - should see `order_out` events
4. ✅ Verify `stock_before` and `stock_after` values are correct

## Configuration Requirements

Before stock reduction will work, ensure:

- [ ] Each good has entries in `goods_calculations` (ingredients + quantities)
- [ ] Each good's category belongs to a department
- [ ] Each department has a `storage_id` assigned
- [ ] Storage records exist in the `storages` table
- [ ] Ingredients exist in the `ingredients` table

If any are missing, logs will clearly indicate which step failed.
