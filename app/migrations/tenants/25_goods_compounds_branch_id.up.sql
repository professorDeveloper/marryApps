ALTER TABLE goods DROP COLUMN IF EXISTS department_id;
ALTER TABLE goods ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES branches(id) ON DELETE CASCADE;
CREATE INDEX idx_goods_branch ON goods(branch_id) WHERE deleted_at = 0;

ALTER TABLE compounds DROP COLUMN IF EXISTS department_id;
ALTER TABLE compounds ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES branches(id) ON DELETE CASCADE;
CREATE INDEX idx_compounds_branch ON compounds(branch_id) WHERE deleted_at = 0;
