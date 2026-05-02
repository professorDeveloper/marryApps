# Phase 1: Database Schema Updates

**Complexity**: S (Small)  
**Risk**: L (Low)  
**Duration**: 1-2 hours  
**Owner**: Backend Lead

---

## Objective

Extend the database schema to:
1. Track table type in Sessions table for type-aware billing
2. Add explicit indicators for segment lifecycle (moved_from/moved_to fields)
3. Ensure proper indexing for transfer queries

## Current State

✅ `table_time_sessions` exists (migration 33)  
✅ `table_time_session_segments` exists (migration 48)  
❌ Sessions don't track table type  
❌ No explicit transfer reason tracking in segments

## Changes Required

### 1.1 Add `table_type` column to Sessions

**File**: `migrations/tenants/50_add_session_table_type.up.sql`

```sql
ALTER TABLE table_time_sessions
ADD COLUMN IF NOT EXISTS table_type TEXT DEFAULT 'simple'
  CHECK (table_type IN ('simple', 'time_based'));

CREATE INDEX IF NOT EXISTS idx_table_time_sessions_type
ON table_time_sessions(table_type)
WHERE deleted_at = 0;
```

**Rollback**: `migrations/tenants/50_add_session_table_type.down.sql`

```sql
DROP INDEX IF EXISTS idx_table_time_sessions_type;
ALTER TABLE table_time_sessions
DROP COLUMN IF EXISTS table_type;
```

**Rationale**: 
- Allows billing query to filter: `WHERE table_type = 'time_based'`
- Enables frontend to validate operations based on table type
- Backward compatible (defaults to 'simple')

---

### 1.2 Ensure Segment Transfer Fields

**Status**: ✅ Already exist in migration 48

Fields already in `table_time_session_segments`:
- `move_in_reason` (start | transfer)
- `move_out_reason` (transfer | close)
- `moved_from_table_id`
- `moved_to_table_id`

**No changes needed** - reuse existing fields for tracking transfers.

---

### 1.3 Add Composite Index for Transfer Queries

**File**: `migrations/tenants/51_transfer_query_indexes.up.sql`

```sql
-- Index for finding active sessions for an order
CREATE INDEX IF NOT EXISTS idx_table_time_sessions_order_active
ON table_time_sessions(order_id)
WHERE deleted_at = 0 AND ended_at IS NULL;

-- Index for finding sessions by table
CREATE INDEX IF NOT EXISTS idx_table_time_sessions_table_active
ON table_time_sessions(table_id)
WHERE deleted_at = 0 AND ended_at IS NULL;

-- Index for segment queries during transfer
CREATE INDEX IF NOT EXISTS idx_table_time_session_segments_active
ON table_time_session_segments(session_id, ended_at)
WHERE deleted_at = 0;
```

**Rollback**: `migrations/tenants/51_transfer_query_indexes.down.sql`

```sql
DROP INDEX IF EXISTS idx_table_time_sessions_order_active;
DROP INDEX IF EXISTS idx_table_time_sessions_table_active;
DROP INDEX IF EXISTS idx_table_time_session_segments_active;
```

**Rationale**: 
- Speed up `SELECT ... WHERE order_id = ? AND ended_at IS NULL`
- Speed up `SELECT ... WHERE table_id = ? AND ended_at IS NULL`
- Speed up segment queries during transfer phase

---

## Verification Steps

### Task 1: Create migrations

**Command**:
```bash
cd /home/spike/Documents/work/MARY_AI/back/app
ls -la migrations/tenants/ | grep "50_\|51_"
```

**Expected Output**: Two new migration files appear

### Task 2: Run migrations locally

**Command**:
```bash
# Using the migrate tool (as configured in the app)
make db-migrate  # or equivalent migrate command
```

**Expected Output**:
```
Applied migration: 50_add_session_table_type
Applied migration: 51_transfer_query_indexes
✅ All migrations successful
```

### Task 3: Verify schema changes

**Command**:
```sql
-- Connect to test database
\d table_time_sessions
-- Output should show: table_type column with CHECK constraint

\d table_time_session_segments
-- Output should show: existing move_* fields intact

-- Check indexes
\di *table_time_sessions*
-- Output should show new indexes created
```

### Task 4: Validate backward compatibility

**Command**:
```sql
-- Verify existing sessions can still be queried
SELECT COUNT(*) FROM table_time_sessions WHERE table_type = 'simple' OR table_type IS NOT NULL;
-- Should return current session count without errors
```

---

## Exit Criteria

✅ Migration files created in `migrations/tenants/`  
✅ Migrations applied successfully to test database  
✅ `table_type` column added with constraint  
✅ Indexes created and validated with EXPLAIN  
✅ Existing data still queryable without errors  
✅ Rollback scripts tested (reverse and forward again)

---

## Files to Create/Modify

| File | Type | Change |
|------|------|--------|
| `migrations/tenants/50_add_session_table_type.up.sql` | Create | Add table_type column |
| `migrations/tenants/50_add_session_table_type.down.sql` | Create | Drop table_type column |
| `migrations/tenants/51_transfer_query_indexes.up.sql` | Create | Add indexes |
| `migrations/tenants/51_transfer_query_indexes.down.sql` | Create | Drop indexes |

---

## Notes & Gotchas

- ⚠️ **Migration order matters**: Migration 50 must run before 51
- ⚠️ **Defaults to 'simple'**: Existing sessions without explicit type are treated as simple tables
- ⚠️ **PostgreSQL version**: Uses standard DDL (compatible with 14+)
- 📌 **Zero downtime**: Column add with default is safe for running systems

---

## Rollback Plan

If issues arise, execute down migrations in reverse order:
```bash
migrate -path migrations/tenants -database "$DATABASE_URL" down 2
```

---

**Next Phase**: Phase 2 - Order & Session Service Layer
