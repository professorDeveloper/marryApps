-- Shared ingredient catalog: ingredient_visibility controls per-branch access
CREATE TABLE IF NOT EXISTS ingredient_visibility (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ingredient_id UUID NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
  branch_id     UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  is_visible    BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(ingredient_id, branch_id)
);

CREATE INDEX IF NOT EXISTS idx_ingredient_visibility_ingredient ON ingredient_visibility(ingredient_id);
CREATE INDEX IF NOT EXISTS idx_ingredient_visibility_branch ON ingredient_visibility(branch_id);
CREATE INDEX IF NOT EXISTS idx_ingredient_visibility_visible ON ingredient_visibility(branch_id, is_visible) WHERE is_visible = true;

-- Backfill: create visibility records from existing ingredients.branch_id
INSERT INTO ingredient_visibility (id, ingredient_id, branch_id, is_visible)
SELECT gen_random_uuid(), id, branch_id, true
FROM ingredients
WHERE branch_id IS NOT NULL AND deleted_at = 0
ON CONFLICT (ingredient_id, branch_id) DO NOTHING;
