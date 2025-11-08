-- 000002_add_indexes.up.sql
CREATE INDEX IF NOT EXISTS idx_users_guid ON users(guid);
CREATE INDEX IF NOT EXISTS idx_users_company_id ON users(company_id);
CREATE INDEX IF NOT EXISTS idx_users_company_role ON users(company_id, role);
CREATE INDEX IF NOT EXISTS idx_companies_guid ON companies(guid);