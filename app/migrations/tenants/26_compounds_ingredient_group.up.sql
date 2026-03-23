ALTER TABLE compounds ADD COLUMN IF NOT EXISTS ingredient_group_id UUID REFERENCES ingredient_groups(id) ON DELETE SET NULL;
