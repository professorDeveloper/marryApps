-- ==================== COMPOUNDS ====================
CREATE TABLE IF NOT EXISTS compounds (
  id               UUID             PRIMARY KEY DEFAULT gen_random_uuid(),
  name             TEXT             NOT NULL,
  name_i18n        UUID             REFERENCES translations(id) ON DELETE SET NULL,
  description      TEXT,
  description_i18n UUID             REFERENCES translations(id) ON DELETE SET NULL,
  quantity         INTEGER,
  picture_url      TEXT,
  color_code       TEXT,
  measurement      measurement_type,
  price            DECIMAL(15,2),
  department_id    UUID             REFERENCES departments(id) ON DELETE SET NULL,
  cost_price       DECIMAL(15,2)   DEFAULT 0,
  profit           DECIMAL(15,2)   DEFAULT 0,
  profit_margin    DECIMAL(10,4)   DEFAULT 0,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW(),
  deleted_at       BIGINT          DEFAULT 0
);

CREATE INDEX idx_compounds_department ON compounds(department_id) WHERE deleted_at = 0;

CREATE TABLE IF NOT EXISTS compounds_details (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  compound_id   UUID        NOT NULL REFERENCES compounds(id) ON DELETE CASCADE,
  ingredient_id UUID        NOT NULL REFERENCES ingredients(id) ON DELETE RESTRICT,
  quantity      BIGINT      NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW(),
  deleted_at    BIGINT      DEFAULT 0
);

CREATE INDEX idx_compounds_details_compound ON compounds_details(compound_id) WHERE deleted_at = 0;

CREATE TABLE IF NOT EXISTS compound_stock (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  compound_id UUID        NOT NULL REFERENCES compounds(id) ON DELETE CASCADE,
  quantity    BIGINT      NOT NULL DEFAULT 0,
  branch_id   UUID        NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  deleted_at  BIGINT      DEFAULT 0
);

CREATE INDEX idx_compound_stock_compound ON compound_stock(compound_id) WHERE deleted_at = 0;
CREATE INDEX idx_compound_stock_branch   ON compound_stock(branch_id)   WHERE deleted_at = 0;

-- ==================== GOODS ====================
CREATE TABLE IF NOT EXISTS goods (
  id               UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  name             TEXT          NOT NULL,
  description      TEXT,
  name_i18n        UUID          REFERENCES translations(id) ON DELETE SET NULL,
  description_i18n UUID          REFERENCES translations(id) ON DELETE SET NULL,
  category_id      UUID          REFERENCES categories(id) ON DELETE SET NULL,
  department_id    UUID          REFERENCES departments(id) ON DELETE SET NULL,
  picture_url      TEXT,
  color_code       TEXT,
  price            DECIMAL(15,2) NOT NULL,
  cook_time        INTEGER,
  cost_price       DECIMAL(15,2) DEFAULT 0,
  profit           DECIMAL(15,2) DEFAULT 0,
  profit_margin    DECIMAL(10,4) DEFAULT 0,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW(),
  deleted_at       BIGINT        DEFAULT 0
);

CREATE INDEX idx_goods_category   ON goods(category_id)   WHERE deleted_at = 0;
CREATE INDEX idx_goods_department ON goods(department_id) WHERE deleted_at = 0;

CREATE TRIGGER update_goods_updated_at
BEFORE UPDATE ON goods
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE IF NOT EXISTS goods_details (
  id            UUID             PRIMARY KEY DEFAULT gen_random_uuid(),
  good_id       UUID             NOT NULL REFERENCES goods(id) ON DELETE CASCADE,
  ingredient_id UUID             REFERENCES ingredients(id) ON DELETE RESTRICT,
  compound_id   UUID             REFERENCES compounds(id) ON DELETE RESTRICT,
  measurement   measurement_type,
  quantity      BIGINT           NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW(),
  deleted_at    BIGINT           DEFAULT 0
);

CREATE INDEX idx_goods_details_good ON goods_details(good_id) WHERE deleted_at = 0;

CREATE TRIGGER update_goods_details_updated_at
BEFORE UPDATE ON goods_details
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==================== CALCULATION ====================
CREATE TABLE IF NOT EXISTS calculation (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  good_id               UUID        REFERENCES goods(id)      ON DELETE CASCADE,
  compound_id           UUID        REFERENCES compounds(id)  ON DELETE CASCADE,
  ingredient_id         UUID        REFERENCES ingredients(id) ON DELETE RESTRICT,
  component_compound_id UUID        REFERENCES compounds(id)  ON DELETE RESTRICT,
  quantity              NUMERIC     NOT NULL,
  measurement_unit      VARCHAR(50) NOT NULL,
  price_per_unit        NUMERIC     NOT NULL,
  total_cost            NUMERIC     NOT NULL,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW(),
  deleted_at            BIGINT      DEFAULT 0,
  CHECK (
    (good_id IS NOT NULL AND compound_id IS NULL) OR
    (good_id IS NULL AND compound_id IS NOT NULL)
  )
);

CREATE INDEX idx_calculation_good_id       ON calculation(good_id)       WHERE deleted_at = 0;
CREATE INDEX idx_calculation_compound_id   ON calculation(compound_id)   WHERE deleted_at = 0;
CREATE INDEX idx_calculation_ingredient_id ON calculation(ingredient_id) WHERE deleted_at = 0;
CREATE INDEX idx_calculation_deleted_at    ON calculation(deleted_at);
