CREATE TABLE IF NOT EXISTS translations (
  id         UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
  uz         TEXT,
  ru         TEXT,
  en         TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  deleted_at BIGINT    DEFAULT 0
);

CREATE TABLE IF NOT EXISTS branches (
  id         UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT      NOT NULL,
  name_i18n  UUID REFERENCES translations(id) ON DELETE CASCADE,
  address    TEXT,
  phone      VARCHAR(20),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  deleted_at BIGINT    DEFAULT 0
);


CREATE INDEX idx_branches_deleted ON branches(deleted_at);