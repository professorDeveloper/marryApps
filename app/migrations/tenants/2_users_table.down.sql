DROP TRIGGER IF EXISTS update_users_updated_at ON "users";
DROP FUNCTION IF EXISTS update_updated_at_column();


DROP INDEX IF EXISTS idx_attendances_user;
DROP INDEX IF EXISTS idx_users_shift;
DROP INDEX IF EXISTS idx_users_email;
DROP INDEX IF EXISTS idx_users_username;
DROP INDEX IF EXISTS idx_shifts_branch;
DROP INDEX IF EXISTS idx_halls_branch;
DROP INDEX IF EXISTS idx_storages_branch;


DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS attendances CASCADE;
DROP TABLE IF EXISTS shifts CASCADE;
DROP TYPE IF EXISTS user_role;

ALTER TABLE shifts
DROP CONSTRAINT IF EXISTS fk_shifts_branch_id;

DROP INDEX IF EXISTS idx_shifts_branch;
