-- ==================== STORAGES ====================
CREATE TABLE IF NOT EXISTS storages (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT        NOT NULL,
  branch_id   UUID        REFERENCES branches(id) ON DELETE CASCADE,
  name_i18n   UUID        REFERENCES translations(id) ON DELETE SET NULL,
  picture_url TEXT,
  color_code  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  deleted_at  BIGINT      DEFAULT 0
);

CREATE INDEX idx_storages_branch ON storages(branch_id) WHERE deleted_at = 0;

CREATE TRIGGER update_storages_updated_at
BEFORE UPDATE ON storages
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==================== HALLS ====================
CREATE TABLE IF NOT EXISTS halls (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id  UUID        NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  name       TEXT        NOT NULL,
  name_i18n  UUID        REFERENCES translations(id) ON DELETE SET NULL,
  width      INTEGER     NOT NULL DEFAULT 0,
  height     INTEGER     NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at BIGINT      DEFAULT 0
);

CREATE INDEX idx_halls_branch ON halls(branch_id) WHERE deleted_at = 0;

CREATE TRIGGER update_halls_updated_at
BEFORE UPDATE ON halls
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==================== DEPARTMENTS ====================
CREATE TABLE IF NOT EXISTS departments (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT        NOT NULL,
  color_code  TEXT,
  picture_url TEXT,
  name_i18n   UUID        REFERENCES translations(id) ON DELETE SET NULL,
  storage_id  UUID        REFERENCES storages(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  deleted_at  BIGINT      DEFAULT 0
);

CREATE INDEX idx_departments_storage ON departments(storage_id) WHERE deleted_at = 0;

CREATE TRIGGER update_departments_updated_at
BEFORE UPDATE ON departments
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==================== CATEGORIES ====================
CREATE TABLE IF NOT EXISTS categories (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT        NOT NULL,
  picture_url   TEXT,
  color_code    TEXT,
  name_i18n     UUID        REFERENCES translations(id) ON DELETE CASCADE,
  department_id UUID        REFERENCES departments(id) ON DELETE CASCADE,
  storage_id    UUID        REFERENCES storages(id) ON DELETE CASCADE,
  parent        UUID        REFERENCES categories(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW(),
  deleted_at    BIGINT      DEFAULT 0
);

CREATE INDEX idx_categories_department ON categories(department_id) WHERE deleted_at = 0;
CREATE INDEX idx_categories_parent     ON categories(parent)        WHERE deleted_at = 0;

CREATE TRIGGER update_categories_updated_at
BEFORE UPDATE ON categories
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==================== CAFE TABLES ====================
CREATE TYPE table_status AS ENUM ('free', 'busy');

CREATE TABLE IF NOT EXISTS cafe_tables (
  id         UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  hall_id    UUID         NOT NULL REFERENCES halls(id) ON DELETE CASCADE,
  number     INTEGER      NOT NULL,
  capacity   INTEGER      NOT NULL DEFAULT 4,
  status     table_status DEFAULT 'free',
  pos_x      INTEGER      NOT NULL DEFAULT 0,
  pos_y      INTEGER      NOT NULL DEFAULT 0,
  width      INTEGER      NOT NULL DEFAULT 0,
  height     INTEGER      NOT NULL DEFAULT 0,
  rotation   INTEGER      NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at BIGINT       DEFAULT 0
);

CREATE INDEX idx_cafe_tables_hall   ON cafe_tables(hall_id) WHERE deleted_at = 0;
CREATE INDEX idx_cafe_tables_status ON cafe_tables(status)  WHERE deleted_at = 0;

CREATE TRIGGER update_cafe_tables_updated_at
BEFORE UPDATE ON cafe_tables
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==================== QR SESSIONS ====================
CREATE TABLE IF NOT EXISTS qr_sessions (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  table_id   UUID        NOT NULL REFERENCES cafe_tables(id) ON DELETE CASCADE,
  device_id  TEXT        UNIQUE,
  start_time TIMESTAMP,
  end_time   TIMESTAMP,
  is_active  BOOLEAN     DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at BIGINT      DEFAULT 0
);

CREATE INDEX idx_qr_sessions_table  ON qr_sessions(table_id) WHERE deleted_at = 0;
CREATE INDEX idx_qr_sessions_active ON qr_sessions(is_active) WHERE deleted_at = 0;

CREATE TRIGGER update_qr_sessions_updated_at
BEFORE UPDATE ON qr_sessions
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
