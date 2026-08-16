-- ============================================
-- DEBUG: Check specific invoices and all related data
-- ============================================

-- 1. CHECK BOTH INVOICES DIRECTLY
SELECT * FROM invoices WHERE id IN ('aef8885a-ae6d-4247-b0eb-191f123af972', '3141926c-ae5e-4ba3-b8c6-d3df55f789a8');

-- 2. CHECK INVOICE DETAILS FOR FIRST INVOICE
SELECT * FROM invoice_detailed WHERE invoice_id = 'aef8885a-ae6d-4247-b0eb-191f123af972';

-- 3. CHECK INVOICE DETAILS FOR SECOND INVOICE
SELECT * FROM invoice_detailed WHERE invoice_id = '3141926c-ae5e-4ba3-b8c6-d3df55f789a8';

-- 4. CHECK IF INGREDIENT EXISTS
SELECT * FROM ingredients WHERE id = '6632017e-fe9b-4320-8c82-b7e208ec1de0';

-- 5. CHECK INGREDIENT STOCK
SELECT * FROM ingredient_stock WHERE ingredient_id = '6632017e-fe9b-4320-8c82-b7e208ec1de0';

-- 6. CHECK STOCK MOVEMENTS
SELECT * FROM ingredient_stock_movements WHERE ingredient_id = '6632017e-fe9b-4320-8c82-b7e208ec1de0';

-- 7. ALL INVOICE DETAILS FOR THESE INVOICES
SELECT * FROM invoice_detailed WHERE invoice_id IN ('aef8885a-ae6d-4247-b0eb-191f123af972', '3141926c-ae5e-4ba3-b8c6-d3df55f789a8');

-- 8. GET ALL INGREDIENTS IN THESE INVOICES
SELECT DISTINCT
    id.ingredient_id,
    i.name,
    i.measurement,
    id.quantity,
    id.price,
    id.price_per_unit
FROM invoice_detailed id
LEFT JOIN ingredients i ON id.ingredient_id = i.id
WHERE id.invoice_id IN ('aef8885a-ae6d-4247-b0eb-191f123af972', '3141926c-ae5e-4ba3-b8c6-d3df55f789a8');
