-- ==================== MODIFIERS ====================
CREATE TABLE IF NOT EXISTS modifiers (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  name_i18n   UUID REFERENCES translations(id) ON DELETE SET NULL,
  description TEXT,
  code        TEXT,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  picture_url TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  deleted_at  BIGINT DEFAULT 0
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_modifiers_code_unique
  ON modifiers(code)
  WHERE code IS NOT NULL AND deleted_at = 0;

CREATE INDEX IF NOT EXISTS idx_modifiers_name
  ON modifiers(name)
  WHERE deleted_at = 0;

CREATE INDEX IF NOT EXISTS idx_modifiers_is_active
  ON modifiers(is_active)
  WHERE deleted_at = 0;

CREATE INDEX IF NOT EXISTS idx_modifiers_deleted_at
  ON modifiers(deleted_at);

CREATE TRIGGER update_modifiers_updated_at
BEFORE UPDATE ON modifiers
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==================== GOODS_MODIFIERS ====================
CREATE TABLE IF NOT EXISTS goods_modifiers (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  good_id     UUID NOT NULL REFERENCES goods(id) ON DELETE CASCADE,
  modifier_id UUID NOT NULL REFERENCES modifiers(id) ON DELETE CASCADE,
  is_required BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  deleted_at  BIGINT DEFAULT 0
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_goods_modifiers_unique_active
  ON goods_modifiers(good_id, modifier_id)
  WHERE deleted_at = 0;

CREATE INDEX IF NOT EXISTS idx_goods_modifiers_good_id
  ON goods_modifiers(good_id)
  WHERE deleted_at = 0;

CREATE INDEX IF NOT EXISTS idx_goods_modifiers_modifier_id
  ON goods_modifiers(modifier_id)
  WHERE deleted_at = 0;

CREATE INDEX IF NOT EXISTS idx_goods_modifiers_good_sort
  ON goods_modifiers(good_id, sort_order)
  WHERE deleted_at = 0;

CREATE INDEX IF NOT EXISTS idx_goods_modifiers_deleted_at
  ON goods_modifiers(deleted_at);

CREATE TRIGGER update_goods_modifiers_updated_at
BEFORE UPDATE ON goods_modifiers
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();