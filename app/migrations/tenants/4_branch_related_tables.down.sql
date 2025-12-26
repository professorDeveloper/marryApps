DROP TRIGGER IF EXISTS update_categories_updated_at ON categories;
DROP TRIGGER IF EXISTS update_departments_updated_at ON departments;
DROP TRIGGER IF EXISTS update_halls_updated_at ON halls;
DROP TRIGGER IF EXISTS update_storages_updated_at ON storages;

DROP TABLE IF EXISTS halls CASCADE;
DROP TABLE IF EXISTS storages CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS departments CASCADE;

DROP INDEX IF EXISTS idx_departments_storage;
DROP INDEX IF EXISTS idx_categories_parent;
DROP INDEX IF EXISTS idx_categories_department;
DROP INDEX IF EXISTS idx_halls_branch;
DROP INDEX IF EXISTS idx_storages_branch;