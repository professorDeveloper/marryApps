CREATE TYPE measurement_type AS ENUM ('kg', 'l', 'piece');

-- ==================== INGREDIENT GROUPS ====================
-- Groups are shared across all branches (no branch_id filtering)
-- branch_id kept as nullable legacy column
CREATE TABLE IF NOT EXISTS ingredient_groups (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT        NOT NULL,
  picture_url TEXT,
  color_code  TEXT,
  name_i18n   UUID        REFERENCES translations(id) ON DELETE SET NULL,
  branch_id   UUID        REFERENCES branches(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  deleted_at  BIGINT      DEFAULT 0
);

CREATE INDEX idx_ingredient_groups_branch_id ON ingredient_groups(branch_id) WHERE deleted_at = 0;

CREATE TRIGGER update_ingredient_groups_updated_at
BEFORE UPDATE ON ingredient_groups
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==================== INGREDIENTS ====================
-- Ingredients are shared across all branches (brand-wide catalog)
-- branch_id kept as nullable legacy column; visibility controlled via ingredient_visibility
CREATE TABLE IF NOT EXISTS ingredients (
  id             UUID             PRIMARY KEY DEFAULT gen_random_uuid(),
  name           TEXT             NOT NULL,
  name_i18n      UUID             REFERENCES translations(id) ON DELETE SET NULL,
  group_id       UUID             REFERENCES ingredient_groups(id) ON DELETE SET NULL,
  measurement    measurement_type,
  picture_url    TEXT,
  color_code     TEXT,
  brand_id       UUID,
  branch_id      UUID             REFERENCES branches(id) ON DELETE SET NULL,
  price_per_unit DECIMAL(15,2)   DEFAULT 0,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW(),
  deleted_at     BIGINT          DEFAULT 0
);

CREATE INDEX idx_ingredients_group         ON ingredients(group_id)       WHERE deleted_at = 0;
CREATE INDEX idx_ingredients_branch_id     ON ingredients(branch_id)      WHERE deleted_at = 0;
CREATE INDEX idx_ingredients_price_per_unit ON ingredients(price_per_unit) WHERE deleted_at = 0;

CREATE TRIGGER update_ingredients_updated_at
BEFORE UPDATE ON ingredients
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==================== INGREDIENT STOCK ====================
-- Stock is tracked per (ingredient, storage), scoped to a branch
CREATE TABLE IF NOT EXISTS ingredient_stock (
  id            UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  ingredient_id UUID          NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
  storage_id    UUID          REFERENCES storages(id) ON DELETE RESTRICT,
  branch_id     UUID          REFERENCES branches(id) ON DELETE SET NULL,
  quantity      NUMERIC(18,6) NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW(),
  deleted_at    BIGINT        DEFAULT 0,
  UNIQUE (ingredient_id, storage_id)
);

CREATE INDEX idx_ingredient_stock_ingredient ON ingredient_stock(ingredient_id) WHERE deleted_at = 0;
CREATE INDEX idx_ingredient_stock_branch     ON ingredient_stock(branch_id)     WHERE deleted_at = 0;

CREATE TRIGGER update_ingredient_stock_updated_at
BEFORE UPDATE ON ingredient_stock
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==================== INGREDIENT VISIBILITY ====================
-- Controls which ingredients each branch can see in their catalog
CREATE TABLE IF NOT EXISTS ingredient_visibility (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  ingredient_id UUID        NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
  branch_id     UUID        NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  is_visible    BOOLEAN     NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (ingredient_id, branch_id)
);

CREATE INDEX idx_ingredient_visibility_ingredient ON ingredient_visibility(ingredient_id);
CREATE INDEX idx_ingredient_visibility_branch     ON ingredient_visibility(branch_id);
CREATE INDEX idx_ingredient_visibility_visible    ON ingredient_visibility(branch_id, is_visible) WHERE is_visible = true;
