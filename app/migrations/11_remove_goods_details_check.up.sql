-- Remove CHECK constraint from goods_details table
ALTER TABLE goods_details DROP CONSTRAINT chk_ingredient_or_compound;
