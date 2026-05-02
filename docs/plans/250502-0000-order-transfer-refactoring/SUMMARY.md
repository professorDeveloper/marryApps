# Order Transfer Refactoring - Implementation Plan

**Plan Version**: 1.0  
**Created**: 2026-05-02  
**Target**: MARY_AI Backend (Go)  
**Status**: Ready for Review

---

## Executive Summary

This plan enables seamless movement of orders between **Simple Tables** and **Time-Based Tables** by treating every table assignment as a **Session** record. The refactoring addresses a critical business requirement: customers should be able to move their orders between table types without losing data or billing accuracy.

### Key Achievements After This Plan

✅ **Unified Sessions Architecture**: Every table assignment tracked as a Session entity  
✅ **Type-Aware Segments**: Time-Based tables create Segments for billing; Simple tables don't  
✅ **Atomic Transfers**: Two-phase transfer logic prevents "ghost orders"  
✅ **Accurate Billing**: Billing engine sums charges only from Time-Based table segments  
✅ **Table Status Management**: Source table → Available, target table → Occupied  
✅ **Frontend Protection**: API prevents invalid operations (e.g., pause on Simple tables)

---

## Context

### Current State

- ✅ Database has `table_time_sessions` and `table_time_session_segments` tables (migrations 33, 48)
- ✅ Two table types exist: `TableTypeSimple` and `TableTypeTimeBased`
- ✅ Orders link to tables via `table_id`
- ✅ Time-based billing exists via `price_per_hour` on tables
- ❌ **Sessions only created for Time-Based tables**
- ❌ **Order Transfer endpoint does not exist**
- ❌ **Billing engine may not sum segments correctly**

### Problem Statement

Currently, when an order is placed on a Simple Table and needs to move to a Time-Based Table:
1. No Session is created for the Simple Table assignment
2. The transfer operation doesn't exist
3. If transferred, billing calculations become ambiguous
4. No mechanism to track table transitions

### Solution Overview

**Sessions as first-class entity** representing every table assignment:

```
┌─────────────────────────────────────────────┐
│         Order Life Cycle                    │
├─────────────────────────────────────────────┤
│ 1. Create Order                             │
│    ↓ [Phase A] Create Initial Session      │
│    └─→ Simple Table: No Segments created   │
│    └─→ Time-Based Table: Segment opened    │
│                                             │
│ 2. Transfer Order (if needed)              │
│    ↓ [Phase A] Close Current Session       │
│    │   └─→ Time-Based: Close Segment       │
│    │   └─→ Calculate partial charges       │
│    │                                        │
│    ↓ [Phase B] Open New Session            │
│    │   └─→ Simple Table: No Segments       │
│    │   └─→ Time-Based Table: Open Segment  │
│    │                                        │
│ 3. Close Order (Payment)                   │
│    ↓ Sum all Segments across all Sessions  │
│    ↓ Calculate final charges                │
│    ↓ Mark all Sessions as closed           │
└─────────────────────────────────────────────┘
```

---

## Scope

### In Scope ✅

1. **Database Schema**: Extend Sessions to support `table_type` field
2. **Service Layer**: Implement `TransferOrder` service method
3. **API Endpoint**: `POST /orders/{id}/transfer` with `target_table_id`
4. **Billing Logic**: Update cost calculation to sum segments from correct table types
5. **Table Status**: Update source/target table status during transfer
6. **Transaction Safety**: Ensure atomic operations prevent partial transfers
7. **Integration Tests**: Verify transfer scenarios (Simple→Time, Time→Simple, etc.)

### Out of Scope ❌

- Frontend implementation (UI validation)
- WebSocket notifications for real-time UI updates
- Advanced features like batch transfers
- Performance optimization beyond indexed queries
- Audit logging beyond `created_by`, `updated_by` fields

---

## Risks & Assumptions

### Assumptions

1. **Sessions table is stable**: No concurrent modifications to sessions during transfer
2. **Atomic transactions**: PostgreSQL transactions provide sufficient isolation
3. **Table types are immutable**: Once a table is Simple or Time-Based, it doesn't change
4. **Orders exist only during active sessions**: Order lifecycle starts and ends with Session lifecycle
5. **Billing closure happens atomically**: All segments sum in one operation per order

### Risks & Mitigations

| Risk | Severity | Mitigation |
|------|----------|-----------|
| Race condition during transfer | HIGH | Use `FOR UPDATE` locks on Sessions table |
| Partial transfer on crash | HIGH | Wrap Phase A + Phase B in single transaction |
| Incorrect segment duplication | MEDIUM | Validate segment count before creating new ones |
| Billing query O(n) complexity | LOW | Indexed queries on `session_id`, `table_id`, `order_id` |
| NULL handling for Simple table segments | MEDIUM | Explicit `WHERE table_type = 'time_based'` in billing query |

---

## Success Criteria

| Criterion | Verification |
|-----------|--------------|
| **Sessions created for all orders** | ✅ Query: `SELECT COUNT(*) FROM table_time_sessions WHERE order_id IS NOT NULL` = order count |
| **Transfer is atomic** | ✅ No partial transfers in database even on connection loss |
| **Billing sums correctly** | ✅ Manual order: Simple (5hr/50k) + Time (3hr/75k) = 125k ✅ |
| **Table status transitions** | ✅ Source=Available, Target=Occupied after transfer |
| **API rejects invalid ops** | ✅ Pause on Simple table returns 400 error |
| **Integration tests pass** | ✅ All 4 transfer scenarios verified |

---

## Implementation Phases

### Phase 1: Database Schema Updates (Complexity: S, Risk: L)
- Extend Sessions table to track table type
- Add explicit segment lifecycle tracking
- Create indexes for transfer queries

### Phase 2: Order & Session Service Layer (Complexity: M, Risk: M)
- Implement `CreateSessionForOrder` (handles both table types)
- Implement `TransferOrderBetweenTables` (Phase A + Phase B)
- Implement segment closure/creation logic

### Phase 3: Transfer API Endpoint (Complexity: M, Risk: M)
- Implement `POST /orders/{id}/transfer` handler
- Validate target table exists and is available
- Return updated order with new `active_session_id`

### Phase 4: Billing Engine Updates (Complexity: M, Risk: H)
- Update cost calculation query to sum segments only from Time-Based sessions
- Handle multi-session orders correctly
- Add validation tests for billing scenarios

### Phase 5: Table Status Management & E2E Testing (Complexity: S, Risk: M)
- Implement table status update during transfer
- Create integration tests for all transfer scenarios
- Verify concurrent operation safety

---

## Technical Architecture

### Key Design Decisions

1. **Sessions as first-class entity**: Every table assignment creates a Session, not just time-based ones
2. **Type-aware segment creation**: Segments only created for `table_type = 'time_based'`
3. **Atomic transactions**: Transfer wrapped in PostgreSQL transaction with savepoints
4. **Locking strategy**: `SELECT ... FOR UPDATE` on Sessions during transfer
5. **Billing query change**: Add filter `AND sessions.table_type = 'time_based'` to segment sum

### Data Flow

```
┌─────────────────┐
│  POST /transfer │
├─────────────────┤
│ 1. Validate     │
│ 2. Begin TX     │
│ 3. Phase A:     │
│    - Lock order │
│    - Lock src   │
│    - Close seg  │
│    - Release    │
│ 4. Phase B:     │
│    - Open seg   │
│    - Update     │
│    - Release    │
│ 5. Commit TX    │
└────────┬────────┘
         │
    ┌────▼────────────────────┐
    │ Return OrderResponse     │
    │ {active_session_id: ...} │
    └─────────────────────────┘
```

### Files to Modify

| Layer | File | Change Type | Scope |
|-------|------|-------------|-------|
| Model | `model/order.go` | Add | `OrderResponse.active_session_id` field |
| Service | `service/order.go` | Add | `TransferOrder` method |
| Service | `service/cafe_table.go` | Modify | Add table status update logic |
| Handler | `handler/order.go` | Add | `TransferOrder` HTTP handler |
| Handler | `handler/order.go` | Modify | Register `POST /orders/:id/transfer` route |
| Repository | `repository/pg/tenantsdb/order_custom.go` | Add | Custom session creation query |
| Billing | `service/billing_engine.go` | Modify | Update segment sum query with type filter |
| Tests | `tests/integration/transfer_test.go` | Add | New integration tests |

---

## File-by-File Changes

### 1. `internal/model/order.go`

**Change**: Add `ActiveSessionID` field to `OrderResponse`

```go
type OrderResponse struct {
    // ... existing fields ...
    ActiveSessionID *string `json:"active_session_id,omitempty"`
}
```

**Impact**: Allows frontend to track current session for operations like pause/resume

---

### 2. `internal/service/order.go`

**Changes**:
- Add `TransferOrder` service method
- Ensure `CreateOrder` calls session creation
- Add session lookup for order operations

```go
func (s *OrderS) TransferOrder(ctx context.Context, orderID, targetTableID string) (*model.OrderResponse, error)
func (s *OrderS) ensureSessionForOrder(ctx context.Context, order *pg.Order, tableType string) error
```

---

### 3. `internal/handler/order.go`

**Changes**:
- Add `TransferOrder` HTTP handler
- Register `POST /orders/:id/transfer` route
- Parse and validate request

```go
func (h *OrderHandler) TransferOrder(c echo.Context) error {
    // Implementation
}
```

---

### 4. `internal/service/cafe_table.go`

**Changes**:
- Add `UpdateTableStatus` service method
- Handle status transitions during transfer

```go
func (s *CafeTableS) UpdateTableStatus(ctx context.Context, tableID, newStatus string) error
```

---

### 5. Billing query in `service/billing_engine.go`

**Change**: Filter segments by table type

```sql
SELECT SUM(seg.active_seconds)
FROM table_time_session_segments seg
JOIN table_time_sessions sess ON seg.session_id = sess.id
WHERE seg.order_id = $1
  AND sess.table_type = 'time_based'  -- ← NEW FILTER
  AND seg.deleted_at = 0
```

---

## Next Steps (After Plan Approval)

1. ✅ Review plan with stakeholders
2. ✅ Identify any scope adjustments
3. ✅ Assign implementation owner
4. → Execute phases in order (1→2→3→4→5)
5. → Run integration tests after each phase
6. → Deploy with feature flag (rollout in stages)

---

## Appendices

### A. SQL Queries Reference

#### Get active session for order:
```sql
SELECT * FROM table_time_sessions
WHERE order_id = $1 AND ended_at IS NULL
FOR UPDATE;
```

#### Get segments for session:
```sql
SELECT * FROM table_time_session_segments
WHERE session_id = $1 AND deleted_at = 0
ORDER BY started_at;
```

#### Sum charges for order (corrected):
```sql
SELECT SUM(seg.active_seconds * tbl.price_per_hour / 3600)
FROM table_time_session_segments seg
JOIN table_time_sessions sess ON seg.session_id = sess.id
JOIN cafe_tables tbl ON seg.table_id = tbl.id
WHERE seg.order_id = $1
  AND tbl.table_type = 'time_based'
  AND seg.deleted_at = 0;
```

### B. Environment/Config

No new environment variables needed. Feature uses existing:
- `DATABASE_URL` (PostgreSQL connection)
- Tenant context from JWT (brand_id)

### C. Testing Checklist

- [ ] Create order on Simple Table → Session created
- [ ] Create order on Time-Based Table → Session + Segment created
- [ ] Transfer Simple → Time → Segment created in new session
- [ ] Transfer Time → Simple → Previous segment closed
- [ ] Billing correct after multi-session order
- [ ] Concurrent transfers don't corrupt data
- [ ] Table status updated correctly
- [ ] API returns active_session_id

---

**Document Version**: 1.0  
**Last Updated**: 2026-05-02  
**Plan Status**: ⏳ Awaiting Review & Approval
