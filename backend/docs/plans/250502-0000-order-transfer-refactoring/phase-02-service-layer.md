# Phase 2: Order & Session Service Layer Implementation

**Complexity**: M (Medium)  
**Risk**: M (Medium)  
**Duration**: 4-6 hours  
**Owner**: Backend Engineer

---

## Objective

Implement the core business logic for:
1. Creating Sessions for every order (regardless of table type)
2. Transferring orders between tables with two-phase logic (Phase A + Phase B)
3. Managing segment lifecycle (open/close with type awareness)
4. Ensuring atomic transactions

## Current State

✅ `OrderService` exists in `service/order.go`  
✅ `CafeTableService` exists in `service/cafe_table.go`  
✅ Transaction management pattern already established  
❌ `TransferOrder` method does not exist  
❌ Session creation not called from order creation  
❌ Segment closure logic incomplete

---

## Implementation Details

### 2.1 Extend Order Model

**File**: `internal/model/order.go`

**Add field to OrderResponse**:
```go
type OrderResponse struct {
    ID              string              `json:"id"`
    TableID         string              `json:"table_id"`
    WaiterID        *string             `json:"waiter_id,omitempty"`
    CashierID       *string             `json:"cashier_id,omitempty"`
    Status          OrderStatus         `json:"status"`
    GuestCount      *int32              `json:"guest_count,omitempty"`
    TotalAmount     string              `json:"total_amount"`
    Comment         *string             `json:"comment,omitempty"`
    
    // ← NEW FIELD
    ActiveSessionID *string             `json:"active_session_id,omitempty"`
    
    Items           []OrderItemResponse `json:"items,omitempty"`
    CreatedAt       *time.Time          `json:"created_at,omitempty"`
    UpdatedAt       *time.Time          `json:"updated_at,omitempty"`
}
```

**Rationale**: Allows frontend to:
- Track current session for pause/resume operations
- Validate operations based on session state
- Display session-specific UI (timer for time-based tables)

---

### 2.2 Implement Session Creation

**File**: `internal/service/order.go`

**New method: `createSessionForOrder`**

```go
func (s *OrderS) createSessionForOrder(
    ctx context.Context,
    q *pg.Queries,
    orderID, tableID uuid.UUID,
    tableType string,
) (uuid.UUID, error) {
    // 1. Create session record
    session, err := q.CreateTableTimeSession(ctx, pg.CreateTableTimeSessionParams{
        ID:        uuid.New(),
        OrderID:   orderID,
        TableID:   tableID,
        TableType: tableType,
        State:     pg.TableSessionStateRunning,
        StartedAt: pgtype.Timestamptz{Time: time.Now(), Valid: true},
    })
    if err != nil {
        return uuid.Nil, fmt.Errorf("failed to create session: %w", err)
    }
    
    // 2. If time-based, create opening segment
    if tableType == string(model.TableTypeTimeBased) {
        _, err := q.CreateTableTimeSessionSegment(ctx, pg.CreateTableTimeSessionSegmentParams{
            ID:              uuid.New(),
            SessionID:       session.ID,
            OrderID:         orderID,
            TableID:         tableID,
            MoveInReason:    "start",
            StartedAt:       pgtype.Timestamptz{Time: time.Now(), Valid: true},
            ActiveSeconds:   0,
            PausedSeconds:   0,
        })
        if err != nil {
            return uuid.Nil, fmt.Errorf("failed to create opening segment: %w", err)
        }
    }
    
    return session.ID, nil
}
```

**Rationale**: 
- Consistent session creation for all table types
- Type-aware segment handling
- Encapsulates transaction logic

---

### 2.3 Implement Transfer Logic (Phase A + Phase B)

**File**: `internal/service/order.go`

**New method: `TransferOrder`**

```go
func (s *OrderS) TransferOrder(
    ctx context.Context,
    orderID string,
    targetTableID string,
) (*model.OrderResponse, error) {
    orderUUID, err := uuid.Parse(orderID)
    if err != nil {
        return nil, fmt.Errorf("invalid order_id: %w", err)
    }
    
    targetTableUUID, err := uuid.Parse(targetTableID)
    if err != nil {
        return nil, fmt.Errorf("invalid target_table_id: %w", err)
    }
    
    // Get transaction context
    q, txCtx, tx, ownsTx, err := s.getTenantMutationQueries(ctx)
    if err != nil {
        return nil, err
    }
    if ownsTx {
        defer tx.Rollback(ctx)
    }
    
    // ============ VALIDATION ============
    order, err := q.GetOrderByID(txCtx, orderUUID)
    if err != nil {
        return nil, fmt.Errorf("order not found: %w", err)
    }
    
    // Lock source session with FOR UPDATE
    currentSession, err := q.GetTableTimeSessionForOrderExclusive(txCtx, orderUUID)
    if err != nil {
        return nil, fmt.Errorf("no active session for order: %w", err)
    }
    
    if currentSession.EndedAt.Valid {
        return nil, fmt.Errorf("cannot transfer completed order")
    }
    
    targetTable, err := q.GetCafeTableByID(txCtx, targetTableUUID)
    if err != nil {
        return nil, fmt.Errorf("target table not found: %w", err)
    }
    
    if string(targetTable.Status) != "free" {
        return nil, fmt.Errorf("target table is not available")
    }
    
    // ============ PHASE A: CLOSE CURRENT SESSION ============
    
    sourceTableType := currentSession.TableType
    
    // Close any open segments in source session
    if sourceTableType == string(model.TableTypeTimeBased) {
        openSegments, err := q.GetOpenSegmentsForSession(txCtx, currentSession.ID)
        if err != nil {
            return nil, fmt.Errorf("failed to fetch segments: %w", err)
        }
        
        now := time.Now()
        for _, seg := range openSegments {
            // Calculate active/paused durations
            activeDuration := calculateActiveDuration(seg)
            
            // Close segment with transfer reason
            _, err := q.UpdateTableTimeSessionSegment(txCtx, pg.UpdateTableTimeSessionSegmentParams{
                ID:           seg.ID,
                EndedAt:      pgtype.Timestamptz{Time: now, Valid: true},
                ActiveSeconds: activeDuration,
                MoveOutReason: "transfer",
                MovedToTableID: pgtype.UUID{Bytes: targetTableUUID, Valid: true},
            })
            if err != nil {
                return nil, fmt.Errorf("failed to close segment: %w", err)
            }
        }
    }
    
    // Mark source session as ended (but don't delete)
    _, err = q.UpdateTableTimeSession(txCtx, pg.UpdateTableTimeSessionParams{
        ID:     currentSession.ID,
        EndedAt: pgtype.Timestamptz{Time: time.Now(), Valid: true},
    })
    if err != nil {
        return nil, fmt.Errorf("failed to close source session: %w", err)
    }
    
    // ============ PHASE B: OPEN NEW SESSION ============
    
    targetTableType := string(targetTable.TableType)
    
    newSessionID, err := s.createSessionForOrder(txCtx, q, orderUUID, targetTableUUID, targetTableType)
    if err != nil {
        return nil, fmt.Errorf("failed to create new session: %w", err)
    }
    
    if targetTableType == string(model.TableTypeTimeBased) && sourceTableType != targetTableType {
        // Creating first segment in new time-based table
        _, err := q.CreateTableTimeSessionSegment(txCtx, pg.CreateTableTimeSessionSegmentParams{
            ID:              uuid.New(),
            SessionID:       newSessionID,
            OrderID:         orderUUID,
            TableID:         targetTableUUID,
            MoveInReason:    "transfer",
            MovedFromTableID: pgtype.UUID{Bytes: uuid.MustParse(order.TableID), Valid: true},
            StartedAt:       pgtype.Timestamptz{Time: time.Now(), Valid: true},
            ActiveSeconds:   0,
            PausedSeconds:   0,
        })
        if err != nil {
            return nil, fmt.Errorf("failed to create transfer segment: %w", err)
        }
    }
    
    // ============ UPDATE ORDER AND TABLES ============
    
    // Update order with new table
    _, err = q.UpdateOrder(txCtx, pg.UpdateOrderParams{
        ID:      orderUUID,
        TableID: targetTableUUID,
    })
    if err != nil {
        return nil, fmt.Errorf("failed to update order table: %w", err)
    }
    
    // Update table statuses
    sourceTableID := uuid.MustParse(order.TableID)
    
    // Source table → free
    _, err = q.UpdateCafeTableStatus(txCtx, pg.UpdateCafeTableStatusParams{
        ID:     sourceTableID,
        Status: pg.TableStatusFree,
    })
    if err != nil {
        return nil, fmt.Errorf("failed to free source table: %w", err)
    }
    
    // Target table → busy
    _, err = q.UpdateCafeTableStatus(txCtx, pg.UpdateCafeTableStatusParams{
        ID:     targetTableUUID,
        Status: pg.TableStatusBusy,
    })
    if err != nil {
        return nil, fmt.Errorf("failed to occupy target table: %w", err)
    }
    
    // ============ COMMIT AND RETURN ============
    
    if ownsTx {
        if err := tx.Commit(ctx); err != nil {
            return nil, fmt.Errorf("failed to commit transfer: %w", err)
        }
    }
    
    // Fetch updated order
    updated, err := s.GetOrderByID(ctx, orderID)
    if err != nil {
        return nil, fmt.Errorf("failed to fetch updated order: %w", err)
    }
    
    // Set active session ID in response
    if updated != nil {
        sessionID := newSessionID.String()
        updated.ActiveSessionID = &sessionID
    }
    
    return updated, nil
}
```

**Rationale**:
- Clear separation of Phase A (close) and Phase B (open)
- `FOR UPDATE` lock prevents concurrent modifications
- Segment tracking with move_in/move_out reasons
- Table status management in single transaction
- All-or-nothing: partial transfer fails and rolls back

---

### 2.4 Update CreateOrder to Create Session

**File**: `internal/service/order.go`

**Modify `CreateOrder` method**:

```go
func (s *OrderS) CreateOrder(ctx context.Context, req *model.CreateOrderRequest) (*model.OrderResponse, error) {
    // ... existing validation ...
    
    q, txCtx, tx, ownsTx, err := s.getTenantMutationQueries(ctx)
    if err != nil {
        return nil, err
    }
    if ownsTx {
        defer tx.Rollback(ctx)
    }
    
    // Create order record
    order, err := q.CreateOrder(txCtx, params)
    if err != nil {
        return nil, fmt.Errorf("failed to create order: %w", err)
    }
    
    // ← NEW: Get table and determine type
    table, err := q.GetCafeTableByID(txCtx, tableUUID)
    if err != nil {
        return nil, fmt.Errorf("failed to get table: %w", err)
    }
    
    // ← NEW: Create session for this order
    sessionID, err := s.createSessionForOrder(txCtx, q, order.ID, tableUUID, string(table.TableType))
    if err != nil {
        return nil, fmt.Errorf("failed to create session: %w", err)
    }
    
    // ... rest of order creation (items, etc.) ...
    
    if ownsTx {
        if err := tx.Commit(ctx); err != nil {
            return nil, err
        }
    }
    
    resp := toOrderResponse(order)
    resp.ActiveSessionID = &sessionID.String()  // ← NEW
    return resp, nil
}
```

**Rationale**: Every order automatically gets a Session, enabling transfer and billing logic

---

### 2.5 Add Repository Methods

**File**: `internal/repository/pg/tenantsdb/order_custom.go` (new or extend)

Required SQLC queries (add to `sqlc/tenants/queries/orders.sql`):

```sql
-- name: GetTableTimeSessionForOrderExclusive :one
SELECT * FROM table_time_sessions
WHERE order_id = $1 AND deleted_at = 0
FOR UPDATE;

-- name: GetOpenSegmentsForSession :many
SELECT * FROM table_time_session_segments
WHERE session_id = $1 AND deleted_at = 0 AND ended_at IS NULL
ORDER BY started_at;

-- name: CreateTableTimeSession :one
INSERT INTO table_time_sessions (
    id, order_id, table_id, table_type, state, started_at
) VALUES ($1, $2, $3, $4, $5, $6)
RETURNING *;

-- name: CreateTableTimeSessionSegment :one
INSERT INTO table_time_session_segments (
    id, session_id, order_id, table_id, move_in_reason, started_at, active_seconds, paused_seconds
) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
RETURNING *;

-- name: UpdateTableTimeSession :one
UPDATE table_time_sessions
SET ended_at = $2, updated_at = NOW()
WHERE id = $1
RETURNING *;

-- name: UpdateTableTimeSessionSegment :one
UPDATE table_time_session_segments
SET ended_at = $2, active_seconds = $3, move_out_reason = $4, moved_to_table_id = $5, updated_at = NOW()
WHERE id = $1
RETURNING *;

-- name: UpdateCafeTableStatus :one
UPDATE cafe_tables
SET status = $2, updated_at = NOW()
WHERE id = $1
RETURNING *;
```

**Note**: These should be added to SQLC config and `sqlc generate` should be run.

---

## Verification Steps

### Task 1: Create service methods

**Check**:
```bash
cd /home/spike/Documents/work/MARY_AI/back/app
grep -n "func (s \*OrderS) TransferOrder" internal/service/order.go
# Expected: Method exists with correct signature
```

### Task 2: Generate SQLC code

**Command**:
```bash
cd sqlc/tenants
sqlc generate
# Expected: New query methods in repository/pg/tenantsdb/models.go
```

### Task 3: Verify compilation

**Command**:
```bash
cd app
go build ./cmd/main.go
# Expected: No compilation errors
```

### Task 4: Unit test TransferOrder logic

**Test file**: `tests/unit/transfer_test.go` (create new)

```go
func TestTransferOrder(t *testing.T) {
    // Test 1: Transfer Simple → Time-Based (new segment created)
    // Test 2: Transfer Time-Based → Simple (segment closed)
    // Test 3: Transfer with locked session (prevents race conditions)
    // Test 4: Transfer to occupied table (returns error)
    // Test 5: Transfer completed order (returns error)
}
```

---

## Exit Criteria

✅ `TransferOrder` method implemented and compiles  
✅ `createSessionForOrder` helper implemented  
✅ Order creation calls session creation  
✅ SQLC queries generated without errors  
✅ All service methods use transaction context correctly  
✅ FOR UPDATE locks prevent concurrent modifications  
✅ Unit tests demonstrate correct logic flow  
✅ No race conditions in Phase A/B logic

---

## Files to Create/Modify

| File | Type | Change |
|------|------|--------|
| `internal/model/order.go` | Modify | Add ActiveSessionID field |
| `internal/service/order.go` | Modify | Add TransferOrder, createSessionForOrder |
| `sqlc/tenants/queries/orders.sql` | Modify | Add new query definitions |
| `internal/repository/pg/tenantsdb/order_custom.go` | Create | Custom query implementations (if needed) |
| `tests/unit/transfer_test.go` | Create | Unit tests for transfer logic |

---

## Notes & Gotchas

- ⚠️ **FOR UPDATE lock is critical**: Without it, concurrent transfers can corrupt state
- ⚠️ **Transaction scope**: Phase A and Phase B must be in same transaction
- 📌 **SQLC generation**: Run `sqlc generate` in sqlc/tenants after adding queries
- 📌 **Segment calculations**: `calculateActiveDuration` helper needs implementation
- 🚀 **Performance**: Indexed queries ensure O(1) lookups for active sessions

---

## Rollback Plan

If issues arise, revert in reverse:
1. Remove TransferOrder method
2. Remove session creation from CreateOrder
3. Drop new SQLC queries
4. Revert model changes

---

**Next Phase**: Phase 3 - Transfer API Endpoint
