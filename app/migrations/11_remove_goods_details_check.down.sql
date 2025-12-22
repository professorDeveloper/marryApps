-- Restore CHECK constraint on goods_details table (rollback)
ALTER TABLE goods_details ADD CONSTRAINT chk_ingredient_or_compound CHECK (
  (ingredient_id IS NOT NULL AND compound_id IS NULL) OR
  (ingredient_id IS NULL AND compound_id IS NOT NULL)
);
