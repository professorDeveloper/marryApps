# Phase 4: Billing Engine Updates

**Complexity**: M (Medium)  
**Risk**: H (High) - Billing is critical  
**Duration**: 2-3 hours  
**Owner**: Backend Engineer + Finance Validation

---

## Objective

Update the billing/cost calculation engine to:
1. Sum charges only from Time-Based table segments
2. Ignore Simple table segments (they have no charge)
3. Handle multi-session orders correctly
4. Ensure backward compatibility

---

## Current State

❌ Billing query may sum all segments regardless of table type  
❌ No table_type filter in segment cost calculation  
❌ Multi-session orders may be double-counted  

---

## Implementation Details

### 4.1 Identify Billing Query Location

**Search for**:
```bash
grep -r "table_time_session_segments" internal/service/
grep -r "active_seconds" internal/service/
grep -r "SUM.*segment" internal/service/
```

**Expected**: Find query that calculates order costs from segments

---

### 4.2 Update Billing Query

**File**: `internal/service/billing_engine.go` (or equivalent)

**Original query** (example):
```sql
SELECT 
    SUM(COALESCE(s.active_seconds, 0) * COALESCE(t.price_per_hour, 0) / 3600.0) as total_charge
FROM table_time_session_segments s
JOIN table_time_sessions sess ON s.session_id = sess.id
JOIN cafe_tables t ON s.table_id = t.id
WHERE s.order_id = $1
  AND s.deleted_at = 0
  AND t.price_per_hour IS NOT NULL;
```

**Updated query** (with table_type filter):
```sql
SELECT 
    SUM(COALESCE(s.active_seconds, 0) * COALESCE(t.price_per_hour, 0) / 3600.0) as total_charge
FROM table_time_session_segments s
JOIN table_time_sessions sess ON s.session_id = sess.id
JOIN cafe_tables t ON s.table_id = t.id
WHERE s.order_id = $1
  AND s.deleted_at = 0
  AND sess.table_type = 'time_based'  -- ← CRITICAL ADDITION
  AND t.price_per_hour IS NOT NULL;
```

**Rationale**: 
- Only time-based tables have `price_per_hour`
- Simple tables should never charge by time
- Filter ensures no accidental charges from Simple table transfers

---

### 4.3 Handle Multiple Sessions per Order

**Scenario**: Order transferred from Simple → Time-Based → Time-Based

```
Session 1 (Simple Table):
  - No segments (Simple tables don't create segments)
  - Charge: $0

Session 2 (Time-Based Table A):
  - Segment: 2 hours active
  - Price: $30/hr
  - Charge: $60

Session 3 (Time-Based Table B):
  - Segment: 1 hour active
  - Price: $25/hr
  - Charge: $25

Total Order Charge: $0 + $60 + $25 = $85
```

**Implementation**:

```go
func (s *BillingEngine) CalculateOrderCharge(ctx context.Context, orderID uuid.UUID) (decimal.Decimal, error) {
    // Get all sessions for this order
    sessions, err := q.GetSessionsForOrder(ctx, orderID)
    if err != nil {
        return decimal.Zero, err
    }
    
    totalCharge := decimal.Zero
    
    // For each session, sum segment charges
    for _, session := range sessions {
        // Only charge time-based sessions
        if session.TableType != "time_based" {
            continue  // Skip simple table sessions
        }
        
        // Get segments for this session
        segments, err := q.GetSegmentsForSession(ctx, session.ID)
        if err != nil {
            return decimal.Zero, err
        }
        
        // Get table details for pricing
        table, err := q.GetCafeTableByID(ctx, session.TableID)
        if err != nil {
            return decimal.Zero, err
        }
        
        // Sum active seconds for this session
        totalActiveSeconds := int64(0)
        for _, seg := range segments {
            if !seg.EndedAt.Valid {
                // Open segment - shouldn't happen at billing time
                continue
            }
            totalActiveSeconds += seg.ActiveSeconds
        }
        
        // Calculate charge for this session
        pricePerSecond := table.PricePerHour / 3600
        sessionCharge := decimal.NewFromInt(totalActiveSeconds).Mul(pricePerSecond)
        
        totalCharge = totalCharge.Add(sessionCharge)
    }
    
    return totalCharge, nil
}
```

**Rationale**: Explicit logic makes intent clear and prevents subtle bugs

---

### 4.4 Update SQL Generation (SQLC)

**File**: `sqlc/tenants/queries/orders.sql`

**Add query**:
```sql
-- name: GetSessionsForOrder :many
SELECT * FROM table_time_sessions
WHERE order_id = $1
  AND deleted_at = 0
ORDER BY started_at ASC;

-- name: CalculateOrderChargeFromSegments :one
SELECT 
    SUM(COALESCE(s.active_seconds, 0)) as total_active_seconds,
    COUNT(DISTINCT s.session_id) as session_count
FROM table_time_session_segments s
JOIN table_time_sessions sess ON s.session_id = sess.id
WHERE s.order_id = $1
  AND s.deleted_at = 0
  AND sess.table_type = 'time_based'
  AND s.ended_at IS NOT NULL;
```

**Rationale**: Move calculation to database for better performance

---

## Verification Steps

### Task 1: Locate current billing logic

**Command**:
```bash
grep -rn "SUM.*active_seconds\|price_per_hour" internal/service/ --include="*.go"
```

**Expected**: Find the exact location of billing calculation

### Task 2: Add table_type filter

**Edit the query** to include `AND sess.table_type = 'time_based'`

### Task 3: Test with sample data

**SQL** (manual verification):
```sql
-- Create test order with multiple sessions
INSERT INTO orders (id, table_id, status, total_amount, ...) VALUES (...);

-- Create Session 1 (Simple Table)
INSERT INTO table_time_sessions (id, order_id, table_id, table_type, ...)
VALUES (gen_random_uuid(), <order_id>, <simple_table_id>, 'simple', ...);

-- Create Session 2 (Time-Based Table, 2 hours)
INSERT INTO table_time_sessions (id, order_id, table_id, table_type, ...)
VALUES (gen_random_uuid(), <order_id>, <time_table_id>, 'time_based', ...);

INSERT INTO table_time_session_segments (session_id, order_id, active_seconds, ...)
VALUES (gen_random_uuid(), <order_id>, 7200, ...);  -- 2 hours

-- Verify billing calculation
SELECT SUM(s.active_seconds * t.price_per_hour / 3600) as charge
FROM table_time_session_segments s
JOIN table_time_sessions sess ON s.session_id = sess.id
JOIN cafe_tables t ON s.table_id = t.id
WHERE s.order_id = <order_id>
  AND sess.table_type = 'time_based'
  AND s.deleted_at = 0;
  
-- Expected: 7200 * 30000 / 3600 = 60000 (if price_per_hour = 30000)
```

### Task 4: Unit test billing calculation

**Test file**: `tests/unit/billing_test.go`

```go
func TestCalculateOrderCharge(t *testing.T) {
    // Test 1: Single session, simple table → charge = 0
    // Test 2: Single session, time-based table (1 hour, $30/hr) → charge = 30000
    // Test 3: Multiple sessions (simple + time-based) → charge from time-based only
    // Test 4: Multiple time-based sessions (1hr@$30 + 2hr@$25) → total = 30000 + 50000
    // Test 5: Partial hour rounding (1.5 hours @ $30/hr) → charge = 45000
}
```

### Task 5: Integration test end-to-end

**Test**: Create order → transfer → close → verify billing

```go
func TestOrderBillingAfterTransfer(t *testing.T) {
    // 1. Create order on Simple Table
    // 2. Transfer to Time-Based Table (active: 2 hours, price: $30/hr)
    // 3. Close order
    // 4. Verify total charge = $60 (from time-based session only)
}
```

### Task 6: Compile and test

**Command**:
```bash
cd app
go test ./internal/service -v -run TestBilling
```

---

## Exit Criteria

✅ Current billing query located and documented  
✅ Query updated with `sess.table_type = 'time_based'` filter  
✅ SQLC queries generated without errors  
✅ Manual SQL test verifies correct calculation  
✅ Unit tests pass (all 5 scenarios)  
✅ Integration test verifies multi-session order billing  
✅ Compilation successful  
✅ No regression in existing billing scenarios

---

## Files to Create/Modify

| File | Type | Change |
|------|------|--------|
| `internal/service/billing_engine.go` | Modify | Add table_type filter, handle multiple sessions |
| `sqlc/tenants/queries/orders.sql` | Modify | Add billing queries with type filter |
| `tests/unit/billing_test.go` | Create | Unit tests for billing logic |
| `tests/integration/billing_transfer_test.go` | Create | E2E tests for post-transfer billing |

---

## Critical Testing Scenarios

Must verify all these scenarios before shipping:

| Scenario | Expected Charge |
|----------|-----------------|
| Simple table, 1hr | $0 |
| Time-based table, 1hr @ $30/hr | $30 |
| Simple + Time-based (1hr @ $25/hr) | $25 |
| Time-based A (1hr @ $30/hr) + Time-based B (2hr @ $25/hr) | $80 |
| Time-based table, paused 30min, active 30min @ $30/hr | $15 |

---

## Notes & Gotchas

- ⚠️ **CRITICAL**: Wrong billing query can lead to financial discrepancies
- ⚠️ **Backward compatibility**: Ensure no existing orders are affected
- 📌 **Rounding**: Use consistent rounding rules (e.g., round to nearest cent)
- 📌 **NULL price_per_hour**: Filter should handle gracefully
- 🚀 **Audit trail**: Log all billing calculations for finance review

---

## Rollback Plan

If billing issues detected:
1. Revert query change
2. Verify all orders recalculate correctly
3. Review charge discrepancies in logs
4. Finance team validates amounts

---

**Next Phase**: Phase 5 - Table Status Management & E2E Testing
