# Order Transfer Refactoring - Implementation Audit

## Executive Summary
**Status**: ⚠️ **INCOMPLETE** - The implementation has compilation fixes but is missing critical business logic to fully comply with the design requirements.

---

## Requirement Compliance Checklist

### ✅ IMPLEMENTED
1. **Session Creation** - Sessions are created for both Simple and Time-Based tables
2. **Phase A Logic** - Current session is closed with `ended_at` timestamp
3. **Segment Closure** - Open segments are closed with end_time for Time-Based transfers
4. **Phase B Logic** - New session is created for target table
5. **Table Status Updates** - Source table set to free, target to busy
6. **Atomic Transaction** - Entire transfer wrapped in single transaction
7. **Segment Creation for Time-Based** - New segments created when moving to Time-Based table

### ❌ **CRITICAL GAPS**

#### 1. Session Table Type Not Being Set
**Issue**: The `table_type` column exists in the database (added by migration 49), but:
- `CreateTableTimeSessionParams` doesn't have `table_type` field
- Sessions are created without tracking whether they're Simple or Time-Based
- This violates the core requirement: "Sessions must track type (Simple or Time-Based)"

**Current Code** (Line 4477-4487):
```go
session, err := q.CreateTableTimeSession(ctx, pg.CreateTableTimeSessionParams{
    ID:                   uuid.New(),
    OrderID:              orderID,
    TableID:              tableID,
    State:                state,
    StartedAt:            now,
    ActiveStartedAt:      activeStartedAt,
    AccumulatedActiveSec: 0,
    CreatedBy:            pgtype.UUID{Bytes: userID, Valid: userIDValid},
    UpdatedBy:            pgtype.UUID{Bytes: userID, Valid: userIDValid},
    // ❌ Missing: table_type parameter
})
```

**Required Fix**:
- Add `table_type` parameter to `CreateTableTimeSessionParams` struct
- Pass `tableType` when creating sessions
- Update sqlc queries to include table_type

#### 2. Session Table Type Not Being Updated on Transfer
**Issue**: When sessions are closed, the `table_type` is not being preserved/considered.

**Required Fix**:
- When fetching active session, retrieve and validate the `table_type`
- Use `table_type` to determine if Phase A should close segments (not just table.TableType)
- Ensure consistency between session.table_type and table.table_type

#### 3. Response Missing Session Table Type
**Issue**: The API response doesn't include the session's `table_type` information.

**Current Code** (Line 4437-4441):
```go
if updated != nil {
    sessionID := newSessionID.String()
    updated.ActiveSessionID = &sessionID
    // ❌ Missing: ActiveSessionTableType or similar field
}
```

**Required Fix**:
- Return both `active_session_id` AND the session's `table_type` in response
- This allows frontend to validate: don't pause orders on Simple table sessions

#### 4. Billing Engine Integration Not Implemented
**Issue**: The requirement states:
> "The billing engine must be updated to sum up segments from all 'Time-Based' sessions within a single order, while ignoring 'Simple' sessions."

**Current State**: No changes to billing/cost calculation logic found.

**Required Implementation**:
- Filter sessions by `table_type = 'time_based'` when calculating charges
- Sum segment durations only from time-based sessions
- Ensure billing queries account for multiple sessions per order

#### 5. Frontend Validation Not Addressed
**Issue**: The requirement states:
> "Ensure the UI/Frontend does not attempt to 'Pause' an order while it is on a Simple Table, as no segments will exist to be paused."

**Current State**: No API-level validation implemented to prevent pause on Simple table sessions.

**Required Implementation**:
- Add validation endpoint or flag that returns current session's table_type
- Return error if pause/resume attempted on Simple table session
- Document API response that includes table_type

---

## Database Schema Status

### ✅ Table Supports Type Tracking
```sql
ALTER TABLE table_time_sessions
ADD COLUMN IF NOT EXISTS table_type TEXT DEFAULT 'simple'
  CHECK (table_type IN ('simple', 'time_based'));
```

The column exists (migration 49), but it's not being used by the application layer.

### ❌ Sqlc Generated Code Not Updated
The sqlc-generated code for `CreateTableTimeSessionParams` and related queries needs:
1. Add `table_type` field to `CreateTableTimeSessionParams`
2. Update CREATE query to include table_type
3. Update retrieval queries to return table_type

---

## Phase A Logic Analysis

### Current Implementation (Lines 4305-4363)
```
1. Get source table type ✅
2. If Time-Based:
   - List all segments ✅
   - Close open segments ✅
3. Close session with EndedAt ✅
4. Set table to free status ✅
```

### What's Missing
```
- Session.table_type is never set or verified
- Billing calculation for closed segment not done
- No final_amount calculation before closing session
```

### Correct Implementation Should Be
```
1. Get active session (includes table_type) ✅
2. Get session.table_type (not table.table_type)
3. If session.table_type == 'time_based':
   - Close open segments ✅
   - Calculate charges for segments ❌ MISSING
   - Update session.final_amount with charges ❌ MISSING
4. Close session with EndedAt ✅
```

---

## Phase B Logic Analysis

### Current Implementation (Lines 4365-4389)
```
1. Get target table type ✅
2. Create new session ❌ (missing table_type)
3. If Time-Based:
   - Create first segment ✅
4. Do NOT create segment if Simple ✅
```

### What's Missing
```
- New session not created with table_type parameter
- No validation that session was created with correct type
```

---

## Required Fixes Priority

### Priority 1 (Blocking)
1. **Add `table_type` to `CreateTableTimeSessionParams`**
   - File: `internal/repository/pg/tenantsdb/table_timer_manual.go`
   - Add field: `TableType string`
   - Update CREATE TABLE query to include this parameter

2. **Update `createSessionForOrder` to set table_type**
   - Pass `tableType` parameter when creating session
   - Validate session was created with correct type

3. **Update `TransferOrder` Phase B to verify session type**
   - After creating session, fetch and verify table_type was set
   - Ensure segments are only created for time_based sessions

### Priority 2 (Functional)
4. **Calculate final charges before closing session**
   - Sum segment active_seconds
   - Apply billing rate
   - Set final_amount before `UpdateTableTimeSessionClose`

5. **Add table_type to API response**
   - Include session's table_type in OrderResponse
   - Return: `active_session_id`, `active_session_table_type`

### Priority 3 (Supporting)
6. **Add validation endpoint for pause/resume**
   - Return error if attempting to pause Simple table session
   - Document in API that table_type must be checked

7. **Update billing engine**
   - Filter by session.table_type when calculating charges
   - Sum segments only from time_based sessions

---

## Testing Impact

The current unit tests pass because they test type conversions and error handling, but they don't test:
1. ✅ Actual session.table_type being set (currently always NULL)
2. ✅ Billing calculations happening
3. ✅ API response including table_type
4. ✅ Validation preventing pause on Simple tables

**New Tests Needed**:
- Verify sessions created with correct table_type
- Verify segments only created for time_based sessions
- Verify final_amount calculated on transfer
- Verify API response includes table_type
- Verify pause/resume validation works

---

## Implementation Steps

1. **Update Sqlc Queries** (table_timer_manual.go)
   - Add table_type to CreateTableTimeSessionParams
   - Update query templates

2. **Fix createSessionForOrder**
   - Pass tableType to query
   - Add field to params struct

3. **Fix TransferOrder Phase B**
   - Verify session created with correct type
   - Add logging/validation

4. **Add Billing Calculation**
   - Calculate charges before closing session
   - Update final_amount field

5. **Update API Response**
   - Add active_session_table_type field
   - Return in OrderResponse

6. **Add Validation Endpoint**
   - Check if session is Simple before allowing pause
   - Return helpful error message

7. **Update Tests**
   - Test actual session.table_type being set
   - Test billing calculations
   - Test API response

---

## Conclusion

**The implementation partially works** (compiles, doesn't crash) but **violates core requirements**:
- ❌ Sessions don't track table_type (always NULL)
- ❌ No billing calculation on transfer
- ❌ API response missing table_type
- ❌ No validation for Simple table pause attempts

These gaps must be addressed before production deployment.
