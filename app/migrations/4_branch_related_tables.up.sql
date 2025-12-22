CREATE TABLE IF NOT EXISTS storages (
  id         UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT      NOT NULL,
  branch_id  UUID      REFERENCES branches(id) ON DELETE CASCADE,
  name_i18n  UUID      REFERENCES translations(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  deleted_at BIGINT    DEFAULT 0
);

CREATE TABLE IF NOT EXISTS halls (
  id         UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id  UUID      NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  name       TEXT      NOT NULL,
  name_i18n  UUID      REFERENCES translations(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  deleted_at BIGINT    DEFAULT 0
);

CREATE TABLE IF NOT EXISTS departments (
  id         UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT      NOT NULL,
  name_i18n  UUID      REFERENCES translations(id) ON DELETE SET NULL,
  storage_id UUID      REFERENCES storages(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  deleted_at BIGINT    DEFAULT 0
);

CREATE TABLE IF NOT EXISTS categories (
  id            UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT      NOT NULL,
  name_i18n     UUID      REFERENCES translations(id) ON DELETE CASCADE,
  department_id UUID      REFERENCES departments(id) ON DELETE CASCADE,
  storage_id    UUID      REFERENCES storages(id) ON DELETE CASCADE,
  parent        UUID      REFERENCES categories(id) ON DELETE CASCADE,
  created_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  deleted_at    BIGINT    DEFAULT 0
);

CREATE INDEX idx_storages_branch ON storages(branch_id) WHERE deleted_at = 0;
CREATE INDEX idx_halls_branch ON halls(branch_id) WHERE deleted_at = 0;
CREATE INDEX idx_categories_department ON categories(department_id) WHERE deleted_at = 0;
CREATE INDEX idx_categories_parent ON categories(parent) WHERE deleted_at = 0;
CREATE INDEX idx_departments_storage ON departments(storage_id) WHERE deleted_at = 0;

-- Create triggers to automatically update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_storages_updated_at BEFORE UPDATE ON storages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_halls_updated_at BEFORE UPDATE ON halls
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_departments_updated_at BEFORE UPDATE ON departments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();