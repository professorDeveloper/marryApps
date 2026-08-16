CREATE TYPE separation_act_status AS ENUM ('draft', 'active', 'cancelled');

-- ==================== SEPARATION ACTS ====================
CREATE TABLE IF NOT EXISTS separation_acts (
  id                   UUID                   PRIMARY KEY DEFAULT gen_random_uuid(),
  number               SERIAL                 NOT NULL,
  date                 TIMESTAMP              NOT NULL DEFAULT NOW(),
  storage_id           UUID                   REFERENCES storages(id)              ON DELETE SET NULL,
  source_ingredient_id UUID                   NOT NULL REFERENCES ingredients(id)  ON DELETE RESTRICT,
  source_quantity      NUMERIC(18,6)          NOT NULL DEFAULT 0,
  source_stock_before  NUMERIC(18,6)          NOT NULL DEFAULT 0,
  source_stock_after   NUMERIC(18,6)          NOT NULL DEFAULT 0,
  group_id             UUID                   REFERENCES deduction_act_groups(id)  ON DELETE SET NULL,
  branch_id            UUID                   REFERENCES branches(id)              ON DELETE SET NULL,
  description          TEXT,
  status               separation_act_status  NOT NULL DEFAULT 'draft',
  total_amount         DECIMAL(15,2)          NOT NULL DEFAULT 0,
  created_at           TIMESTAMPTZ            DEFAULT NOW(),
  updated_at           TIMESTAMPTZ            DEFAULT NOW(),
  deleted_at           BIGINT                 DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_separation_acts_branch_id   ON separation_acts(branch_id)            WHERE deleted_at = 0;
CREATE INDEX IF NOT EXISTS idx_separation_acts_storage_id  ON separation_acts(storage_id)           WHERE deleted_at = 0;
CREATE INDEX IF NOT EXISTS idx_separation_acts_group_id    ON separation_acts(group_id)             WHERE deleted_at = 0;
CREATE INDEX IF NOT EXISTS idx_separation_acts_ingredient  ON separation_acts(source_ingredient_id) WHERE deleted_at = 0;
CREATE INDEX IF NOT EXISTS idx_separation_acts_date        ON separation_acts(date)                 WHERE deleted_at = 0;
CREATE INDEX IF NOT EXISTS idx_separation_acts_status      ON separation_acts(status)               WHERE deleted_at = 0;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_separation_acts_updated_at') THEN
        CREATE TRIGGER update_separation_acts_updated_at
        BEFORE UPDATE ON separation_acts
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- ==================== SEPARATION ACT ITEMS ====================
CREATE TABLE IF NOT EXISTS separation_act_items (
  id                UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  separation_act_id UUID          NOT NULL REFERENCES separation_acts(id) ON DELETE CASCADE,
  ingredient_id     UUID          NOT NULL REFERENCES ingredients(id)     ON DELETE RESTRICT,
  storage_id        UUID          REFERENCES storages(id)                  ON DELETE SET NULL,
  quantity          NUMERIC(18,6) NOT NULL,
  price_per_unit    DECIMAL(15,2) NOT NULL DEFAULT 0,
  total_amount      DECIMAL(15,2) NOT NULL DEFAULT 0,
  stock_before      NUMERIC(18,6) NOT NULL DEFAULT 0,
  stock_after       NUMERIC(18,6) NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ   DEFAULT NOW(),
  updated_at        TIMESTAMPTZ   DEFAULT NOW(),
  deleted_at        BIGINT        DEFAULT 0
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_separation_act_items_act_ingredient
ON separation_act_items(separation_act_id, ingredient_id) WHERE deleted_at = 0;

CREATE INDEX IF NOT EXISTS idx_separation_act_items_act_id        ON separation_act_items(separation_act_id) WHERE deleted_at = 0;
CREATE INDEX IF NOT EXISTS idx_separation_act_items_ingredient_id ON separation_act_items(ingredient_id)     WHERE deleted_at = 0;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_separation_act_items_updated_at') THEN
        CREATE TRIGGER update_separation_act_items_updated_at
        BEFORE UPDATE ON separation_act_items
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;
