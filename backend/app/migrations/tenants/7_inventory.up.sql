-- ==================== INVENTORIES ====================
CREATE TABLE IF NOT EXISTS inventories (
  id               UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  number           BIGSERIAL     NOT NULL,
  date             DATE          NOT NULL,
  storage_id       UUID          NOT NULL REFERENCES storages(id) ON DELETE RESTRICT,
  description      TEXT,
  description_i18n UUID          REFERENCES translations(id) ON DELETE RESTRICT,
  status           VARCHAR(50)   NOT NULL DEFAULT 'active' CHECK (status IN ('deleted', 'draft', 'active')),
  surplus_amount   DECIMAL(15,2) NOT NULL DEFAULT 0,
  shortage_amount  DECIMAL(15,2) NOT NULL DEFAULT 0,
  remaining_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
  applied_at       TIMESTAMPTZ,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW(),
  deleted_at       BIGINT        NOT NULL DEFAULT 0
);

CREATE INDEX idx_inventories_storage_id ON inventories(storage_id) WHERE deleted_at = 0;
CREATE INDEX idx_inventories_date       ON inventories(date)        WHERE deleted_at = 0;
CREATE INDEX idx_inventories_number     ON inventories(number)      WHERE deleted_at = 0;

-- ==================== INVENTORY ITEMS ====================
CREATE TABLE IF NOT EXISTS inventory_items (
  id               UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  inventory_id     UUID          NOT NULL REFERENCES inventories(id) ON DELETE CASCADE,
  ingredient_id    UUID          NOT NULL REFERENCES ingredients(id) ON DELETE RESTRICT,
  counted_quantity NUMERIC(18,6) NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW(),
  deleted_at       BIGINT        NOT NULL DEFAULT 0
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_inventory_items_inventory_ingredient
ON inventory_items(inventory_id, ingredient_id);

-- ==================== DEDUCTIONS ====================
CREATE TABLE IF NOT EXISTS deduction_act_groups (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       VARCHAR(255) NOT NULL,
  branch_id  UUID        REFERENCES branches(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at BIGINT      NOT NULL DEFAULT 0
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_deduction_act_groups_name
ON deduction_act_groups(name)
WHERE deleted_at = 0;

CREATE INDEX idx_deduction_act_groups_branch_id ON deduction_act_groups(branch_id) WHERE deleted_at = 0;

CREATE TRIGGER update_deduction_act_groups_updated_at
BEFORE UPDATE ON deduction_act_groups
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE IF NOT EXISTS deductions (
  id               UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  number           BIGSERIAL     NOT NULL,
  date             DATE          NOT NULL,
  act_group_id     UUID          REFERENCES deduction_act_groups(id) ON DELETE RESTRICT,
  storage_id       UUID          NOT NULL REFERENCES storages(id) ON DELETE RESTRICT,
  description      TEXT,
  description_i18n UUID          REFERENCES translations(id) ON DELETE RESTRICT,
  status           VARCHAR(50)   NOT NULL DEFAULT 'active' CHECK (status IN ('deleted', 'draft', 'active')),
  balance          NUMERIC(18,2) NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW(),
  deleted_at       BIGINT        NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_deductions_storage_id   ON deductions(storage_id)   WHERE deleted_at = 0;
CREATE INDEX IF NOT EXISTS idx_deductions_date         ON deductions(date)          WHERE deleted_at = 0;
CREATE INDEX IF NOT EXISTS idx_deductions_number       ON deductions(number)        WHERE deleted_at = 0;
CREATE INDEX IF NOT EXISTS idx_deductions_act_group_id ON deductions(act_group_id)  WHERE deleted_at = 0;

CREATE TRIGGER update_deductions_updated_at
BEFORE UPDATE ON deductions
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE IF NOT EXISTS deduction_items (
  id            UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  deduction_id  UUID          NOT NULL REFERENCES deductions(id) ON DELETE CASCADE,
  ingredient_id UUID          REFERENCES ingredients(id) ON DELETE RESTRICT,
  good_id       UUID          REFERENCES goods(id)       ON DELETE RESTRICT,
  compound_id   UUID          REFERENCES compounds(id)   ON DELETE RESTRICT,
  quantity      NUMERIC(18,6) NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW(),
  deleted_at    BIGINT        NOT NULL DEFAULT 0,
  CONSTRAINT chk_deduction_items_one_ref CHECK (
    (CASE WHEN ingredient_id IS NULL THEN 0 ELSE 1 END) +
    (CASE WHEN good_id       IS NULL THEN 0 ELSE 1 END) +
    (CASE WHEN compound_id   IS NULL THEN 0 ELSE 1 END) = 1
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_deduction_items_deduction_ingredient
ON deduction_items(deduction_id, ingredient_id) WHERE deleted_at = 0 AND ingredient_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_deduction_items_deduction_good
ON deduction_items(deduction_id, good_id) WHERE deleted_at = 0 AND good_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_deduction_items_deduction_compound
ON deduction_items(deduction_id, compound_id) WHERE deleted_at = 0 AND compound_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_deduction_items_deduction_id  ON deduction_items(deduction_id)  WHERE deleted_at = 0;
CREATE INDEX IF NOT EXISTS idx_deduction_items_ingredient_id ON deduction_items(ingredient_id) WHERE deleted_at = 0;
CREATE INDEX IF NOT EXISTS idx_deduction_items_good_id       ON deduction_items(good_id)       WHERE deleted_at = 0;
CREATE INDEX IF NOT EXISTS idx_deduction_items_compound_id   ON deduction_items(compound_id)   WHERE deleted_at = 0;

CREATE TRIGGER update_deduction_items_updated_at
BEFORE UPDATE ON deduction_items
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==================== DEDUCTION ITEM INGREDIENTS ====================
CREATE TABLE IF NOT EXISTS deduction_item_ingredients (
  id                UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  deduction_item_id UUID          NOT NULL REFERENCES deduction_items(id) ON DELETE CASCADE,
  ingredient_id     UUID          NOT NULL REFERENCES ingredients(id)     ON DELETE RESTRICT,
  quantity          NUMERIC(18,6) NOT NULL DEFAULT 0,
  stock_before      NUMERIC(18,6) NOT NULL DEFAULT 0,
  stock_after       NUMERIC(18,6) NOT NULL DEFAULT 0,
  price_per_unit    NUMERIC(18,2) NOT NULL DEFAULT 0,
  amount            NUMERIC(18,2) NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW(),
  deleted_at        BIGINT        NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_deduction_item_ingredients_deduction_item_id
ON deduction_item_ingredients(deduction_item_id) WHERE deleted_at = 0;

CREATE INDEX IF NOT EXISTS idx_deduction_item_ingredients_ingredient_id
ON deduction_item_ingredients(ingredient_id) WHERE deleted_at = 0;

CREATE TRIGGER update_deduction_item_ingredients_updated_at
BEFORE UPDATE ON deduction_item_ingredients
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
