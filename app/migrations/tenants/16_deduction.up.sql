CREATE TABLE IF NOT EXISTS deduction_act_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    deleted_at BIGINT NOT NULL DEFAULT 0
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_deduction_act_groups_name
ON deduction_act_groups(name)
WHERE deleted_at = 0;


CREATE TABLE IF NOT EXISTS deductions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  number BIGSERIAL NOT NULL,
  date DATE NOT NULL,
  act_group_id UUID REFERENCES deduction_act_groups(id) ON DELETE RESTRICT,
  storage_id UUID NOT NULL REFERENCES storages(id) ON DELETE RESTRICT,
  description TEXT,
  description_i18n UUID REFERENCES translations(id) ON DELETE RESTRICT,
  status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('deleted', 'draft', 'active')),
  balance DECIMAL(15,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  deleted_at BIGINT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_deductions_storage_id ON deductions(storage_id) WHERE deleted_at = 0;
CREATE INDEX IF NOT EXISTS idx_deductions_date ON deductions(date) WHERE deleted_at = 0;
CREATE INDEX IF NOT EXISTS idx_deductions_number ON deductions(number) WHERE deleted_at = 0;
CREATE INDEX IF NOT EXISTS idx_deductions_act_group_id ON deductions(act_group_id) WHERE deleted_at = 0;

CREATE TABLE IF NOT EXISTS deduction_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deduction_id UUID NOT NULL REFERENCES deductions(id) ON DELETE CASCADE,
    ingredient_id UUID REFERENCES ingredients(id) ON DELETE RESTRICT,
    good_id UUID REFERENCES goods(id) ON DELETE RESTRICT,
    compound_id UUID REFERENCES compounds(id) ON DELETE RESTRICT,
    quantity BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    deleted_at BIGINT NOT NULL DEFAULT 0,
    CONSTRAINT chk_deduction_items_one_ref
      CHECK (
        (CASE WHEN ingredient_id IS NULL THEN 0 ELSE 1 END) +
        (CASE WHEN good_id IS NULL THEN 0 ELSE 1 END) +
        (CASE WHEN compound_id IS NULL THEN 0 ELSE 1 END)
      = 1
    )
);

CREATE INDEX IF NOT EXISTS idx_deduction_items_deduction_id ON deduction_items(deduction_id) WHERE deleted_at = 0;
CREATE INDEX IF NOT EXISTS idx_deduction_items_ingredient_id ON deduction_items(ingredient_id) WHERE deleted_at = 0;
CREATE INDEX IF NOT EXISTS idx_deduction_items_good_id ON deduction_items(good_id) WHERE deleted_at = 0;
CREATE INDEX IF NOT EXISTS idx_deduction_items_compound_id ON deduction_items(compound_id) WHERE deleted_at = 0;

CREATE TRIGGER update_deduction_act_groups_updated_at BEFORE UPDATE ON deduction_act_groups
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_deductions_updated_at BEFORE UPDATE ON deductions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_deduction_items_updated_at BEFORE UPDATE ON deduction_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
