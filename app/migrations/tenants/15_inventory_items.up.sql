CREATE TABLE IF NOT EXISTS inventory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inventory_id UUID NOT NULL REFERENCES inventories(id) ON DELETE CASCADE,
  ingredient_id UUID NOT NULL REFERENCES ingredients(id) ON DELETE RESTRICT,
  counted_quantity BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  deleted_at BIGINT NOT NULL DEFAULT 0
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_inventory_items_inventory_ingredient
ON inventory_items(inventory_id, ingredient_id);

CREATE INDEX IF NOT EXISTS idx_inventory_items_inventory_id
ON inventory_items(inventory_id) WHERE deleted_at = 0;

CREATE INDEX IF NOT EXISTS idx_inventory_items_ingredient_id
ON inventory_items(ingredient_id) WHERE deleted_at = 0;

CREATE TRIGGER update_inventory_items_updated_at BEFORE UPDATE ON inventory_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
