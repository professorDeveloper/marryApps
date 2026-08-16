-- =========================================================
-- Query Optimization Indexes
-- Purpose:
-- - Speed up ILIKE searches with pg_trgm GIN indexes
-- - Speed up common branch/date range list queries
-- - Keep migration non-destructive and production-safe
-- =========================================================

-- Enable pg_trgm extension (database-level, safe to run multiple times).
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- =========================================================
-- GIN trigram indexes for ILIKE searches
-- Operator class is schema-qualified (public.gin_trgm_ops) so it
-- resolves correctly even when search_path excludes public
-- (tenant schema context). Wrapped in DO for graceful skip if
-- the extension is unavailable.
-- =========================================================
DO $$
BEGIN
    -- Users: full_name search (GetUsersFiltered)
    CREATE INDEX IF NOT EXISTS idx_users_full_name_trgm
        ON users USING gin (full_name public.gin_trgm_ops)
        WHERE deleted_at = 0;

    -- Users: username search (GetUsersFiltered)
    CREATE INDEX IF NOT EXISTS idx_users_username_trgm
        ON users USING gin (username public.gin_trgm_ops)
        WHERE deleted_at = 0;

    -- Users: phone_number search (GetUsersFiltered)
    CREATE INDEX IF NOT EXISTS idx_users_phone_number_trgm
        ON users USING gin (phone_number public.gin_trgm_ops)
        WHERE deleted_at = 0;

    -- Cafe Tables: number::text ILIKE search
    CREATE INDEX IF NOT EXISTS idx_cafe_tables_number_text_trgm
        ON cafe_tables USING gin ((number::text) public.gin_trgm_ops)
        WHERE deleted_at = 0;

    -- Modifiers: name search (GetModifiers)
    CREATE INDEX IF NOT EXISTS idx_modifiers_name_trgm
        ON modifiers USING gin (name public.gin_trgm_ops)
        WHERE deleted_at = 0;

    -- Modifiers: code search (GetModifiers)
    CREATE INDEX IF NOT EXISTS idx_modifiers_code_trgm
        ON modifiers USING gin (code public.gin_trgm_ops)
        WHERE deleted_at = 0;

EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'pg_trgm GIN indexes skipped (extension not accessible): %', SQLERRM;
END $$;

-- =========================================================
-- Composite partial indexes for date-range / list queries
-- =========================================================

-- Attendances: branch-scoped date range filtering by open_date
CREATE INDEX IF NOT EXISTS idx_attendances_branch_open_date_active
    ON attendances (branch_id, open_date DESC)
    WHERE deleted_at = 0;

-- Transaction Categories: branch-scoped date range filtering by date.
-- Table may not exist in all environments; skipped gracefully if absent.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = current_schema()
          AND table_name   = 'transaction_categories'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_transaction_categories_branch_date_active
            ON transaction_categories (branch_id, date DESC)
            WHERE deleted_at = 0;
    END IF;
END $$;

-- Shipments: branch-scoped date range filtering by date
CREATE INDEX IF NOT EXISTS idx_shipments_branch_date_active
    ON shipments (branch_id, date DESC)
    WHERE deleted_at = 0;
