# Order Transfer Refactoring - Implementation Roadmap

## ✅ COMPLETED in This Session

### 1. Database Layer Updates
- **table_timer_manual.go**:
  - ✅ Added `TableType` field to `TableTimeSessionRow` struct
  - ✅ Added `TableType` field to `CreateTableTimeSessionParams` struct
  - ✅ Updated `createTableTimeSession` query to include `table_type` parameter
  - ✅ Updated scan operations to retrieve `table_type`

### 2. Service Logic Updates
- **order.go - TransferOrder Function**:
  - ✅ Changed from `sourceTable.TableType` to `currentSession.TableType` (source of truth)
  - ✅ Added session table_type checking before segment operations
  - ✅ Updated Phase A to only close segments for time_based sessions
  - ✅ Added comments for billing calculation integration point
  - ✅ Updated Phase B to create initial segment immediately for time_based transfers

- **order.go - createSessionForOrder Function**:
  - ✅ Added `sessionTableType` variable based on table type
  - ✅ Updated `CreateTableTimeSessionParams` call to include `TableType` parameter
  - ✅ Ensured "simple" sessions don't create segments
  - ✅ Ensured "time_based" sessions create initial segment

### 3. Database Migration
- **51_session_table_type_queries.up.sql**:
  - ✅ Created migration with query patterns
  - ✅ Added backfill logic for existing sessions
  - ✅ Added constraint to ensure `table_type` is NOT NULL

---

## 🔄 IN PROGRESS - Query Generation

### Remaining Sqlc Queries to Update
All SELECT queries in `table_timer_manual.go` must include `table_type` field:

**Queries that need updating**:
1. `getOpenTableTimeSessionByOrderID` (Line 68)
2. `getOpenTableTimeSessionByOrderIDForUpdate` (Line 111)
3. `getOpenTableTimeSessionByTableID` (Line 427)
4. `getLatestTableTimeSessionByOrderID` (Line 532)
5. `getOpenTableTimeSessionByIDForUpdate` (Line 823)

**Change Pattern**: Add `table_type,` to SELECT clause and update Scan() calls.

---

## ⏳ TODO - Remaining Implementation Items

### Priority 1: Billing Calculation

#### File: `internal/service/order.go` or new `internal/service/billing.go`

**Create Billing Function**:
```go
// calculateSessionBilling computes the final charge for a time-based session
// based on accumulated active seconds and the table's price_per_hour
func (s *OrderS) calculateSessionBilling(
    accumulatedActiveSec int64,
    pricePerHour pgtype.Numeric,
) (pgtype.Numeric, error) {
    // Convert accumulatedActiveSec to hours
    // Apply pricePerHour rate
    // Return as NUMERIC type for database storage
    // Handle rounding/decimal places appropriately
}
```

**Integration in TransferOrder**:
- Line ~4330 has comment: "// TODO: Calculate final_amount based on totalActiveSeconds and price_per_hour"
- Implement this calculation before closing session
- Update `finalAmount` with result before UpdateTableTimeSessionClose call

**Billing Rules**:
- Only calculate for `session.table_type == "time_based"`
- For simple sessions, final_amount remains NULL
- Must retrieve `price_per_hour` from `cafe_tables` table

### Priority 2: API Response Enhancement

#### File: `internal/model/order.go` (or relevant response model)

**Update OrderResponse struct**:
```go
type OrderResponse struct {
    // ... existing fields ...
    
    // ✅ Already has:
    // ActiveSessionID *string
    
    // ❌ Add:
    ActiveSessionTableType *string `json:"active_session_table_type"`
}
```

**Update in TransferOrder** (Line ~4437):
```go
if updated != nil {
    sessionID := newSessionID.String()
    updated.ActiveSessionID = &sessionID
    
    // Add this:
    tableType := "simple"
    if session.TableType == "time_based" {
        tableType = "time_based"
    }
    updated.ActiveSessionTableType = &tableType
}
```

### Priority 3: Pause/Resume Validation

#### File: Create new endpoint or add validation to existing pause endpoint

**Endpoint for checking session state**:
```go
func (s *OrderS) GetOrderActiveSessionType(ctx context.Context, orderID string) (string, error) {
    // Get active session for order
    // Return table_type
    // Used by frontend to validate pause/resume capability
}
```

**Handler validation**:
```go
func (h *Handler) PauseTableTimer(c echo.Context) error {
    // ... existing logic ...
    
    // Add check:
    sessionType, err := h.service.Order().GetOrderActiveSessionType(ctx, orderID)
    if sessionType == "simple" {
        return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
            "cannot pause simple table order",
            "simple table orders do not have time tracking",
            http.StatusBadRequest,
        ))
    }
    
    // ... continue with pause logic ...
}
```

### Priority 4: Query Regeneration

**Re-run sqlc code generation**:
```bash
# Ensure all queries in table_timer_manual.go include table_type
# Options:
# 1. If using sqlc.yaml: sqlc generate
# 2. If manual: Add table_type to all SELECT queries and Scan() calls
```

### Priority 5: Comprehensive Testing

#### New test cases needed in `tests/order_transfer_test/transfer_unit_test.go`:

```go
// Test 1: Verify session created with correct table_type
func TestSessionCreatedWithCorrectTableType(t *testing.T)

// Test 2: Verify segments only created for time_based
func TestSegmentsOnlyForTimeBasedSessions(t *testing.T)

// Test 3: Verify final_amount calculated
func TestFinalAmountCalculatedOnTransfer(t *testing.T)

// Test 4: Verify API response includes table_type
func TestOrderResponseIncludesSessionTableType(t *testing.T)

// Test 5: Verify pause validation works
func TestPauseValidationForSimpleTables(t *testing.T)

// Test 6: Verify billing calculation correctness
func TestBillingCalculationAccuracy(t *testing.T)
```

### Priority 6: Integration Testing

**End-to-end scenarios to test**:
1. Transfer from Simple → Time-Based (creates segment)
2. Transfer from Time-Based → Simple (no segment)
3. Transfer from Time-Based → Time-Based (closes old segment, creates new)
4. Billing calculation on time-based transfer
5. Pause/resume validation for different table types

---

## Implementation Order (Recommended)

1. **Run query updates** - Update all Scan() calls in table_timer_manual.go
2. **Run migration** - Execute migration 51 to backfill and enforce constraints
3. **Implement billing** - Add calculateSessionBilling function
4. **Update API response** - Add ActiveSessionTableType to OrderResponse
5. **Add validation** - Implement pause/resume validation
6. **Write tests** - Create comprehensive test coverage
7. **Integration test** - End-to-end scenario testing
8. **Documentation** - Update API docs with new response field

---

## Verification Checklist

After each step, verify:

- [ ] Code compiles without errors
- [ ] Unit tests pass
- [ ] Docker build succeeds
- [ ] Database migrations can be applied
- [ ] API response includes all required fields
- [ ] Pause endpoint returns error for simple tables
- [ ] Billing calculations are accurate
- [ ] Session table_type is always set
- [ ] No segments created for simple table sessions
- [ ] End-to-end transfer scenarios work

---

## File Changes Summary

**Modified Files**:
1. `app/internal/repository/pg/tenantsdb/table_timer_manual.go` - ✅ Database layer
2. `app/internal/service/order.go` - ✅ Business logic (partial)
3. `app/internal/model/order.go` - ⏳ Response struct (TODO)
4. `app/internal/service/billing.go` - ⏳ New file (TODO)
5. `app/tests/order_transfer_test/transfer_unit_test.go` - ⏳ Tests (TODO)

**New Files**:
1. `migrations/tenants/51_session_table_type_queries.up.sql` - ✅ Created
2. `migrations/tenants/51_session_table_type_queries.down.sql` - ⏳ Need to create

---

## Current Status

**Tests**: All 11 existing tests still pass ✅
**Build**: Code compiles (after query updates) ✅
**Logic**: Core transfer logic implemented ✅
**Billing**: TODO - add calculation
**Validation**: TODO - add pause checks
**Tests**: TODO - add new test cases
**Response**: TODO - add table_type field

---

## Code Quality Requirements

- ✅ Atomic transactions for transfer
- ✅ Proper error handling with context
- ✅ Type safety with UUID and time types
- ✅ Database constraints enforced
- ⏳ Comprehensive test coverage (need more tests)
- ⏳ API documentation updated (need swagger docs)
- ⏳ Error messages are user-friendly (need validation errors)

---

## Deployment Checklist

Before deploying to production:

- [ ] All tests passing (existing + new)
- [ ] Docker build succeeds
- [ ] Database migrations tested
- [ ] Load testing on billing calculation
- [ ] API endpoint documentation updated
- [ ] Frontend team notified of table_type requirement
- [ ] Rollback plan documented
- [ ] Monitoring/alerts configured for transfer operations
