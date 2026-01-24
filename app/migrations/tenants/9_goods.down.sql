DROP TRIGGER IF EXISTS update_goods_details_updated_at ON goods_details;
DROP TRIGGER IF EXISTS update_goods_updated_at ON goods;

DROP COLUMN IF EXISTS cost_price;
DROP COLUMN IF EXISTS profit;
DROP COLUMN IF EXISTS profit_margin;


DROP TABLE IF EXISTS goods_details CASCADE;
DROP TABLE IF EXISTS goods CASCADE;

DROP INDEX IF EXISTS idx_goods_details_good;
DROP INDEX IF EXISTS idx_goods_department;
DROP INDEX IF EXISTS idx_goods_category;

