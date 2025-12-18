DROP TRIGGER IF EXISTS update_users_updated_at ON "users";
DROP FUNCTION IF EXISTS update_updated_at_column();

DROP INDEX IF EXISTS "idx_users_email";
DROP INDEX IF EXISTS "idx_users_googleId";
DROP INDEX IF EXISTS "idx_users_phoneNumber";
DROP INDEX IF EXISTS "idx_users_role";
DROP INDEX IF EXISTS "idx_users_status";
DROP INDEX IF EXISTS "idx_users_group";
DROP INDEX IF EXISTS "idx_users_createdAt";
DROP INDEX IF EXISTS "idx_users_deletedAt";
DROP INDEX IF EXISTS "idx_users_status_role";
DROP INDEX IF EXISTS "idx_users_group_status";

DROP TABLE IF EXISTS "users";

DROP TYPE IF EXISTS user_role;
DROP TYPE IF EXISTS user_gender;
DROP TYPE IF EXISTS user_status;
DROP TYPE IF EXISTS proficiency_level;