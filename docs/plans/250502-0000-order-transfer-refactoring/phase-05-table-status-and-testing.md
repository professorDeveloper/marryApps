# Phase 5: Table Status Management & E2E Testing

**Complexity**: S (Small)  
**Risk**: M (Medium)  
**Duration**: 3-4 hours  
**Owner**: QA Engineer + Backend Engineer

---

## Objective

1. Ensure table status transitions correctly during order transfer
2. Validate concurrent operation safety
3. Run comprehensive end-to-end tests
4. Verify no regressions in existing functionality

---

## Current State

✅ Table status fields exist (free, busy)  
✅ Service methods to update status exist  
⚠️ May not be called consistently during transfer  
❌ E2E tests for transfer don't exist  
❌ Concurrent scenario testing incomplete

---

## Implementation Details

### 5.1 Table Status Lifecycle

**Expected transitions during transfer**:

```
Source Table (before transfer):
  Status = "busy" (table is occupied by order)
  ↓ [Transfer starts]
  Status = "free" (order moves away)

Target Table (before transfer):
  Status = "free" (no order)
  ↓ [Transfer starts]
  Status = "busy" (receives order)
```

**Verification in TransferOrder service method**:

Already implemented in Phase 2, verify:

```go
// Source table → free
_, err = q.UpdateCafeTableStatus(txCtx, pg.UpdateCafeTableStatusParams{
    ID:     sourceTableID,
    Status: pg.TableStatusFree,
})

// Target table → busy
_, err = q.UpdateCafeTableStatus(txCtx, pg.UpdateCafeTableStatusParams{
    ID:     targetTableUUID,
    Status: pg.TableStatusBusy,
})
```

✅ **No additional implementation needed** - verified from Phase 2

---

### 5.2 Concurrent Operation Safety

**Risk**: Two simultaneous transfers of same order

**Prevention**: 
- ✅ Phase 2 uses `FOR UPDATE` lock on sessions table
- ✅ Transaction ensures atomicity
- ✅ Session.ended_at is checked before modification

**Testing required**: Verify lock prevents race conditions

---

## Comprehensive Testing

### 5.3 Test Categories

#### A. Functional Tests (Happy Path)

**Test Suite**: `tests/integration/transfer_happy_path_test.go`

```go
func TestTransferSimpleToTimeBased(t *testing.T) {
    // Setup: Create simple table, time-based table, order on simple table
    // Action: Transfer to time-based table
    // Verify:
    // - Order.table_id updated
    // - New session created (time_based)
    // - New segment created
    // - Old session.ended_at set
    // - Source table status = free
    // - Target table status = busy
    // - active_session_id returned in response
}

func TestTransferTimeBasedToSimple(t *testing.T) {
    // Setup: Order on time-based table (with running segment)
    // Action: Transfer to simple table
    // Verify:
    // - Old segment closed (move_out_reason = transfer)
    // - New session created (simple)
    // - No segment created for simple table
    // - Table statuses updated correctly
}

func TestTransferTimeBasedToTimeBased(t *testing.T) {
    // Setup: Order on time-based table A
    // Action: Transfer to different time-based table B
    // Verify:
    // - Old segment closed with transfer reason
    // - New segment created with transfer reason
    // - moved_from_table_id and moved_to_table_id set correctly
}

func TestTransferSimpleToSimple(t *testing.T) {
    // Setup: Order on simple table A
    // Action: Transfer to simple table B
    // Verify:
    // - No segments created or modified
    // - Only sessions and order.table_id updated
}
```

#### B. Error Cases

**Test Suite**: `tests/integration/transfer_errors_test.go`

```go
func TestTransferNonExistentOrder(t *testing.T) {
    // Action: Transfer order that doesn't exist
    // Expected: 404 error
}

func TestTransferNonExistentTargetTable(t *testing.T) {
    // Setup: Valid order
    // Action: Transfer to non-existent table
    // Expected: 404 error
}

func TestTransferToOccupiedTable(t *testing.T) {
    // Setup: Two orders, one on table A, one on table B
    // Action: Transfer from A to B (B is occupied)
    // Expected: 409 Conflict error
}

func TestTransferCompletedOrder(t *testing.T) {
    // Setup: Order with ended_at set
    // Action: Transfer completed order
    // Expected: 400 Bad Request error
}

func TestTransferToSameTable(t *testing.T) {
    // Setup: Order on table A
    // Action: Transfer to same table A
    // Expected: May succeed (no-op) or return error - define behavior
}
```

#### C. Concurrency Tests

**Test Suite**: `tests/integration/transfer_concurrency_test.go`

```go
func TestConcurrentTransfersSameOrder(t *testing.T) {
    // Setup: Order on table A, prepare transfer to B and C concurrently
    // Action: Launch two goroutines, both calling TransferOrder
    // Expected: One succeeds, one fails (locked by FOR UPDATE)
    // Verify: Only one transfer succeeded, consistent state
}

func TestConcurrentTransfersIntoSameTable(t *testing.T) {
    // Setup: Two orders on tables A and B, empty table C
    // Action: Transfer both orders to C simultaneously
    // Expected: One succeeds, one fails (table status check)
    // Verify: Only one order on C, both transfers logged correctly
}

func TestConcurrentTransferAndClose(t *testing.T) {
    // Setup: Order on table A, time-based table B
    // Action: Simultaneously transfer and close order
    // Expected: One operation succeeds, other fails or completes safely
    // Verify: Consistent final state (either transferred or closed, not both)
}
```

#### D. Billing Verification Tests

**Test Suite**: `tests/integration/transfer_billing_test.go`

```go
func TestBillingAfterSimpleToTransfer(t *testing.T) {
    // Setup: Simple table (no charge) → Time-based table (1hr @ $30/hr)
    // Action: Create order, transfer, wait 1 hour, close
    // Verify: Order charge = $30 (from time-based session only)
}

func TestBillingAfterMultipleTransfers(t *testing.T) {
    // Setup: 
    //   Session 1: Simple table (0 charge)
    //   Session 2: Time-based table A (1hr @ $30/hr = $30)
    //   Session 3: Time-based table B (2hr @ $25/hr = $50)
    // Verify: Total charge = $80
}

func TestBillingIgnoresSimpleSessions(t *testing.T) {
    // Setup: Order transfers from time-based table → simple → time-based
    // Verify: Middle simple table session is not charged
}
```

#### E. Data Integrity Tests

**Test Suite**: `tests/integration/transfer_integrity_test.go`

```go
func TestSegmentIntegrity(t *testing.T) {
    // Verify: 
    // - No duplicate segments
    // - Segment timeline is continuous (no gaps)
    // - All segments have valid timestamps
    // - moved_from/moved_to fields correctly populated
}

func TestSessionIntegrity(t *testing.T) {
    // Verify:
    // - Order has exactly one active session (ended_at IS NULL)
    // - All historical sessions have ended_at set
    // - Session.table_id matches current order.table_id
}

func TestTableStatusConsistency(t *testing.T) {
    // Verify:
    // - Table marked "busy" has exactly one active order
    // - Table marked "free" has no active orders
    // - No orphaned orders (all have valid session)
}
```

---

### 5.4 Test Implementation Template

**File**: `tests/integration/transfer_test.go`

```go
package integration

import (
    "context"
    "testing"
    "time"
    
    "gitlab.yurtal.tech/company/maryai/back/internal/model"
    "github.com/stretchr/testify/assert"
    "github.com/stretchr/testify/require"
)

type TransferTestSuite struct {
    db     *testdb.DB
    repo   *repository.Repository
    svc    *service.OrderService
}

func setupTransferTest(t *testing.T) *TransferTestSuite {
    // Setup test database with migrations
    db := setupTestDatabase(t)
    repo := repository.New(db.Conn)
    svc := service.NewOrderService(repo)
    
    return &TransferTestSuite{db, repo, svc}
}

func (s *TransferTestSuite) createSimpleTable(t *testing.T, hallID string) string {
    table, err := s.svc.CreateCafeTable(
        context.Background(),
        hallID,
        1,  // number
        4,  // capacity
        "simple",  // table_type
        nil,  // price_per_hour
    )
    require.NoError(t, err)
    return table.ID
}

func (s *TransferTestSuite) createTimeBasedTable(t *testing.T, hallID string) string {
    pricePerHour := int64(30000)  // 30,000 per hour
    table, err := s.svc.CreateCafeTable(
        context.Background(),
        hallID,
        2,  // number
        2,  // capacity
        "time_based",  // table_type
        &pricePerHour,  // price_per_hour
    )
    require.NoError(t, err)
    return table.ID
}

func (s *TransferTestSuite) createOrder(t *testing.T, tableID string) string {
    order, err := s.svc.CreateOrder(context.Background(), &model.CreateOrderRequest{
        TableID: tableID,
    })
    require.NoError(t, err)
    return order.ID
}

func TestTransferSimpleToTimeBased(t *testing.T) {
    suite := setupTransferTest(t)
    
    // Create tables
    hallID := "11111111-1111-1111-1111-111111111111"
    simpleTableID := suite.createSimpleTable(t, hallID)
    timeTableID := suite.createTimeBasedTable(t, hallID)
    
    // Create order on simple table
    orderID := suite.createOrder(t, simpleTableID)
    
    // Verify initial session
    initialSession, err := suite.repo.GetTableTimeSessionForOrder(context.Background(), orderID)
    require.NoError(t, err)
    assert.Equal(t, "simple", initialSession.TableType)
    assert.Nil(t, initialSession.EndedAt)
    
    // Transfer to time-based table
    updatedOrder, err := suite.svc.TransferOrder(context.Background(), orderID, timeTableID)
    require.NoError(t, err)
    
    // Verify response
    assert.NotNil(t, updatedOrder.ActiveSessionID)
    assert.Equal(t, timeTableID, updatedOrder.TableID)
    
    // Verify old session closed
    oldSession, _ := suite.repo.GetTableTimeSessionForOrder(context.Background(), orderID)
    // Note: May need different query for historical session
    
    // Verify new session created and time-based
    newSessionID := *updatedOrder.ActiveSessionID
    newSession, err := suite.repo.GetTableTimeSessionByID(context.Background(), newSessionID)
    require.NoError(t, err)
    assert.Equal(t, "time_based", newSession.TableType)
    assert.Nil(t, newSession.EndedAt)
    
    // Verify segment created for new session
    segments, err := suite.repo.GetSegmentsForSession(context.Background(), newSessionID)
    require.NoError(t, err)
    assert.Greater(t, len(segments), 0)
    assert.Equal(t, "transfer", segments[0].MoveInReason)
    
    // Verify table statuses
    simpleTable, _ := suite.repo.GetCafeTableByID(context.Background(), simpleTableID)
    assert.Equal(t, "free", string(simpleTable.Status))
    
    timeTable, _ := suite.repo.GetCafeTableByID(context.Background(), timeTableID)
    assert.Equal(t, "busy", string(timeTable.Status))
}

// Additional test functions follow same pattern...
```

---

## Verification Checklist

### Pre-Testing

- [ ] All Phase 1-4 changes merged and tested
- [ ] Database migrations applied
- [ ] Compilation successful
- [ ] No linting errors

### Functional Testing

- [ ] Simple → Time-Based transfer works
- [ ] Time-Based → Simple transfer works
- [ ] Time-Based → Time-Based transfer works
- [ ] Simple → Simple transfer works (or rejected appropriately)
- [ ] Order properties updated correctly
- [ ] Sessions and segments created/closed correctly
- [ ] Active session ID returned in response

### Error Handling

- [ ] Non-existent order returns 404
- [ ] Non-existent table returns 404
- [ ] Occupied table returns 409
- [ ] Completed order returns 400
- [ ] Invalid request returns 422

### Billing

- [ ] Simple table sessions charged $0
- [ ] Time-based sessions charged correctly
- [ ] Multi-session orders sum correctly
- [ ] Partial hours rounded correctly

### Concurrency

- [ ] Simultaneous transfers locked correctly
- [ ] No race conditions in final state
- [ ] Consistent ordering of operations

### Data Integrity

- [ ] No duplicate segments
- [ ] Segments have valid timestamps
- [ ] Sessions properly linked to orders
- [ ] Table statuses consistent with orders

---

## Test Execution

### Run unit tests
```bash
make test-unit
# Expected: All unit tests pass
```

### Run integration tests
```bash
make test-integration
# Expected: All integration tests pass
```

### Run full test suite
```bash
make test
# Expected: All tests pass, coverage > 80%
```

### Manual smoke tests
```bash
# Start dev server
make run-dev

# Test each scenario manually with curl/Postman
# Verify UI displays active_session_id correctly
```

---

## Exit Criteria

✅ All functional tests pass (happy path + error cases)  
✅ Concurrency tests demonstrate no race conditions  
✅ Billing tests verify correct charge calculation  
✅ Data integrity tests pass  
✅ Table status updates verified  
✅ No regressions in existing order functionality  
✅ Code coverage > 80% for new code  
✅ Manual smoke tests successful  
✅ Documentation updated with examples

---

## Files to Create/Modify

| File | Type | Change |
|------|------|--------|
| `tests/integration/transfer_happy_path_test.go` | Create | Happy path tests |
| `tests/integration/transfer_errors_test.go` | Create | Error scenario tests |
| `tests/integration/transfer_concurrency_test.go` | Create | Concurrency tests |
| `tests/integration/transfer_billing_test.go` | Create | Billing verification tests |
| `tests/integration/transfer_integrity_test.go` | Create | Data integrity tests |
| `tests/integration/test_helpers.go` | Modify | Add transfer test utilities |

---

## Test Data Fixtures

Create fixtures for:
- Simple table definitions
- Time-based table definitions (various price_per_hour)
- Sample orders on various table types
- Helper functions for time manipulation (pause/resume simulation)

---

## Performance Benchmarks

Run benchmarks to ensure no degradation:

```bash
go test -bench=BenchmarkTransferOrder ./tests/integration -benchmem

# Expected output:
# BenchmarkTransferOrder/simple_to_time_based-8    100    10000000 ns/op    15KB/op
# (Should complete transfer in < 50ms)
```

---

## Notes & Gotchas

- ⚠️ **Test isolation**: Each test must create fresh tables/orders (no shared state)
- ⚠️ **Time-dependent tests**: Mock time for testing hour-based charges
- 📌 **Database cleanup**: Rollback transactions after each test
- 📌 **Concurrent tests**: Use sync.WaitGroup for coordinating goroutines
- 🚀 **CI/CD integration**: Add test stage to pipeline

---

## Regression Testing

Before shipping, verify these existing features still work:
- [ ] Order creation (without transfer)
- [ ] Order status updates (cooking, ready, served)
- [ ] Pause/resume on time-based tables
- [ ] Billing for non-transferred orders
- [ ] Table management (create, update, list)
- [ ] QR session creation

---

## Rollback Plan

If critical test failure:
1. Stop deployment
2. Revert Phases 1-5 changes
3. Investigate root cause
4. Fix and re-test
5. Resume phased rollout

---

## Success Metrics

After all tests pass:

| Metric | Target | Status |
|--------|--------|--------|
| Test coverage | > 80% | ✅ |
| Functional tests | 100% pass | ✅ |
| Error scenarios | 100% handled | ✅ |
| Concurrency tests | No race conditions | ✅ |
| Billing accuracy | 100% match | ✅ |
| Data integrity | No corruption | ✅ |
| Performance | < 50ms transfer | ✅ |

---

**End of Phase 5 - Implementation Complete**

---

## Post-Implementation

### Deployment Strategy

1. **Stage 1**: Deploy to staging environment (full testing cycle)
2. **Stage 2**: Deploy to production with feature flag (disabled by default)
3. **Stage 3**: Enable for 5% of tenants (canary release)
4. **Stage 4**: Monitor metrics and error rates for 24 hours
5. **Stage 5**: Enable for 50% of tenants
6. **Stage 6**: Monitor another 24 hours
7. **Stage 7**: Roll out to 100% of tenants

### Monitoring

Track these metrics post-deployment:
- Transfer success rate (target: > 99.9%)
- Billing accuracy (target: 100%)
- Error rates by error type
- Transfer latency (target: < 100ms p95)
- Table status consistency (target: 100%)

---

**Implementation Plan Complete**
