CREATE TABLE IF NOT EXISTS goods (
  id               UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
  name             TEXT      NOT NULL,
  description      TEXT,
  name_i18n        UUID      REFERENCES translations(id) ON DELETE SET NULL,
  description_i18n UUID      REFERENCES translations(id) ON DELETE SET NULL,
  category_id      UUID      REFERENCES categories(id) ON DELETE SET NULL,
  department_id    UUID      REFERENCES departments(id) ON DELETE SET NULL,
  picture_url      TEXT,
  color_code       TEXT,
  price            DECIMAL(15,2) NOT NULL,
  cook_time        INTEGER,
  cost_price DECIMAL(15,2) DEFAULT 0,
  profit DECIMAL(15,2) DEFAULT 0,
  profit_margin DECIMAL(10,4) DEFAULT 0,
  created_at       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  deleted_at       BIGINT    DEFAULT 0
);

CREATE TABLE IF NOT EXISTS goods_details (
  id           UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
  good_id      UUID      NOT NULL REFERENCES goods(id) ON DELETE CASCADE,
  ingredient_id UUID     REFERENCES ingredients(id) ON DELETE RESTRICT,
  compound_id  UUID      REFERENCES compounds(id) ON DELETE RESTRICT,
  measurement  measurement_type,
  quantity     BIGINT    NOT NULL,
  created_at   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  deleted_at   BIGINT    DEFAULT 0
);


CREATE INDEX idx_goods_category ON goods(category_id) WHERE deleted_at = 0;
CREATE INDEX idx_goods_department ON goods(department_id) WHERE deleted_at = 0;
CREATE INDEX idx_goods_details_good ON goods_details(good_id) WHERE deleted_at = 0;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_goods_updated_at BEFORE UPDATE ON goods
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_goods_details_updated_at BEFORE UPDATE ON goods_details
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON COLUMN goods.cost_price IS 'Total preparation cost (sum of all calculations total_cost)';
COMMENT ON COLUMN goods.profit IS 'Profit = price - cost_price';
COMMENT ON COLUMN goods.profit_margin IS 'Profit margin percentage = (profit / cost_price) * 100';