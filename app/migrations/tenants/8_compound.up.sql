CREATE TABLE IF NOT EXISTS compounds (
  id               UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
  name             TEXT      NOT NULL,
  name_i18n        UUID      REFERENCES translations(id) ON DELETE SET NULL,
  description      TEXT,
  description_i18n UUID      REFERENCES translations(id) ON DELETE SET NULL,
  quantity         INTEGER,
  picture_url      TEXT,
  color_code       TEXT,
  measurement      measurement_type,
  price            DECIMAL(15,2),
  department_id    UUID      REFERENCES departments(id) ON DELETE SET NULL,
  cost_price DECIMAL(15,2) DEFAULT 0,
  profit DECIMAL(15,2) DEFAULT 0,
  profit_margin DECIMAL(10,4) DEFAULT 0,
  created_at       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  deleted_at       BIGINT    DEFAULT 0
);

CREATE TABLE IF NOT EXISTS compounds_details (
  id           UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
  compound_id  UUID      NOT NULL REFERENCES compounds(id) ON DELETE CASCADE,
  ingredient_id UUID     NOT NULL REFERENCES ingredients(id) ON DELETE RESTRICT,
  quantity     BIGINT    NOT NULL,
  created_at   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  deleted_at   BIGINT    DEFAULT 0
);

CREATE TABLE IF NOT EXISTS compound_stock (
  id          UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
  compound_id UUID      NOT NULL REFERENCES compounds(id) ON DELETE CASCADE,
  quantity    BIGINT    NOT NULL DEFAULT 0,
  branch_id   UUID      NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  deleted_at  BIGINT    DEFAULT 0
);

CREATE INDEX idx_compounds_department ON compounds(department_id) WHERE deleted_at = 0;
CREATE INDEX idx_compounds_details_compound ON compounds_details(compound_id) WHERE deleted_at = 0;
CREATE INDEX idx_compound_stock_compound ON compound_stock(compound_id) WHERE deleted_at = 0;
CREATE INDEX idx_compound_stock_branch ON compound_stock(branch_id) WHERE deleted_at = 0;


