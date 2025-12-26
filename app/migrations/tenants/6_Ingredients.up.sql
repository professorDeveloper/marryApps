CREATE TYPE measurement_type AS ENUM ('kg', 'l', 'piece');

CREATE TABLE IF NOT EXISTS ingredient_groups (
  id          UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT      NOT NULL,
  picture_url TEXT,
  name_i18n   UUID      REFERENCES translations(id) ON DELETE SET NULL,
  created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  deleted_at  BIGINT    DEFAULT 0
);

CREATE TABLE IF NOT EXISTS ingredients (
  id          UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT      NOT NULL,
  name_i18n   UUID      REFERENCES translations(id) ON DELETE SET NULL,
  group_id    UUID      REFERENCES ingredient_groups(id) ON DELETE SET NULL,
  measurement measurement_type,
  picture_url TEXT,
  brand_id    UUID,
  created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  deleted_at  BIGINT    DEFAULT 0
);

CREATE TABLE IF NOT EXISTS ingredient_stock (
  id            UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
  ingredient_id UUID      NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
  quantity      BIGINT    NOT NULL DEFAULT 0,
  branch_id     UUID      NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  created_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  deleted_at    BIGINT    DEFAULT 0
);

CREATE INDEX idx_ingredients_group ON ingredients(group_id) WHERE deleted_at = 0;
CREATE INDEX idx_ingredient_stock_ingredient ON ingredient_stock(ingredient_id) WHERE deleted_at = 0;
CREATE INDEX idx_ingredient_stock_branch ON ingredient_stock(branch_id) WHERE deleted_at = 0;

-- Create triggers to automatically update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_ingredient_groups_updated_at BEFORE UPDATE ON ingredient_groups
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ingredients_updated_at BEFORE UPDATE ON ingredients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ingredient_stock_updated_at BEFORE UPDATE ON ingredient_stock
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
