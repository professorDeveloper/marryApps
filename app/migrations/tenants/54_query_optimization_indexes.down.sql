-- =========================================================
-- Rollback Query Optimization Indexes
-- =========================================================

-- Remove GIN trigram indexes for ILIKE searches
DROP INDEX IF EXISTS idx_users_full_name_trgm;
DROP INDEX IF EXISTS idx_users_username_trgm;
DROP INDEX IF EXISTS idx_users_phone_number_trgm;

DROP INDEX IF EXISTS idx_cafe_tables_number_text_trgm;

DROP INDEX IF EXISTS idx_modifiers_name_trgm;
DROP INDEX IF EXISTS idx_modifiers_code_trgm;

-- Remove composite partial indexes for date-range/list queries
DROP INDEX IF EXISTS idx_attendances_branch_open_date_active;
DROP INDEX IF EXISTS idx_transaction_categories_branch_date_active;
DROP INDEX IF EXISTS idx_shipments_branch_date_active;

-- Important:
-- pg_trgm extension is intentionally NOT dropped.
-- Reason:
-- It may be used by other indexes, schemas, or future migrations.
-- DROP EXTENSION could break unrelated objects.