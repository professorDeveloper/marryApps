-- ============================================
-- ALL INVOICE DATA - NO FILTERING
-- Tenant: tenant_mary_ai
-- ============================================
SET search_path TO "tenant_mary_ai", public;

-- ============================================
-- 1. BOTH INVOICES - RAW DATA
-- ============================================
SELECT * FROM invoices
WHERE id IN ('aef8885a-ae6d-4247-b0eb-191f123af972', '3141926c-ae5e-4ba3-b8c6-d3df55f789a8');

-- ============================================
-- 2. ALL INVOICE DETAILS - RAW DATA
-- ============================================
SELECT * FROM invoice_detailed
WHERE invoice_id IN ('aef8885a-ae6d-4247-b0eb-191f123af972', '3141926c-ae5e-4ba3-b8c6-d3df55f789a8')
ORDER BY invoice_id, created_at;

-- ============================================
-- 3. INVOICE 1 - COMPLETE WITH ALL DETAILS (NO DELETED FILTER)
-- ============================================
SELECT
    i.*,
    s.name AS supplier_name,
    st.name AS storage_name,
    b.name AS branch_name,
    id.id AS detail_id,
    id.ingredient_id,
    ing.name AS ingredient_name,
    id.quantity,
    id.price,
    id.price_per_unit,
    (id.quantity * id.price_per_unit) AS line_total,
    id.deleted_at AS detail_deleted_at
FROM invoices i
LEFT JOIN suppliers s ON i.supplier_id = s.id
LEFT JOIN storages st ON i.storage_id = st.id
LEFT JOIN branches b ON i.branch_id = b.id
LEFT JOIN invoice_detailed id ON i.id = id.invoice_id
LEFT JOIN ingredients ing ON id.ingredient_id = ing.id
WHERE i.id = 'aef8885a-ae6d-4247-b0eb-191f123af972'
ORDER BY id.created_at;

-- ============================================
-- 4. INVOICE 2 - COMPLETE WITH ALL DETAILS (NO DELETED FILTER)
-- ============================================
SELECT
    i.*,
    s.name AS supplier_name,
    st.name AS storage_name,
    b.name AS branch_name,
    id.id AS detail_id,
    id.ingredient_id,
    ing.name AS ingredient_name,
    id.quantity,
    id.price,
    id.price_per_unit,
    (id.quantity * id.price_per_unit) AS line_total,
    id.deleted_at AS detail_deleted_at
FROM invoices i
LEFT JOIN suppliers s ON i.supplier_id = s.id
LEFT JOIN storages st ON i.storage_id = st.id
LEFT JOIN branches b ON i.branch_id = b.id
LEFT JOIN invoice_detailed id ON i.id = id.invoice_id
LEFT JOIN ingredients ing ON id.ingredient_id = ing.id
WHERE i.id = '3141926c-ae5e-4ba3-b8c6-d3df55f789a8'
ORDER BY id.created_at;

-- ============================================
-- 5. INGREDIENT 6632017e-fe9b-4320-8c82-b7e208ec1de0 - ALL DATA
-- ============================================
SELECT
    'INGREDIENT' AS section,
    i.id,
    i.name,
    i.measurement,
    i.price_per_unit,
    NULL::UUID AS related_id,
    NULL::TEXT AS related_name,
    NULL::NUMERIC AS qty,
    i.created_at,
    0 AS deleted_at
FROM ingredients i
WHERE i.id = '6632017e-fe9b-4320-8c82-b7e208ec1de0'

UNION ALL

SELECT
    'INVOICE_DETAILED',
    id.id,
    id.ingredient_id::text,
    'qty='||id.quantity::text,
    id.price_per_unit,
    id.invoice_id,
    inv.date::text,
    id.quantity,
    id.created_at,
    id.deleted_at
FROM invoice_detailed id
JOIN invoices inv ON id.invoice_id = inv.id
WHERE id.ingredient_id = '6632017e-fe9b-4320-8c82-b7e208ec1de0'

UNION ALL

SELECT
    'STOCK',
    ils.id,
    ils.ingredient_id::text,
    'qty='||ils.quantity::text,
    ils.quantity,
    ils.storage_id,
    (SELECT name FROM storages WHERE id = ils.storage_id),
    ils.quantity,
    ils.created_at,
    ils.deleted_at
FROM ingredient_stock ils
WHERE ils.ingredient_id = '6632017e-fe9b-4320-8c82-b7e208ec1de0'

UNION ALL

SELECT
    'MOVEMENT',
    ism.id,
    ism.ingredient_id::text,
    'in='||ism.qty_in::text||',out='||ism.qty_out::text,
    ism.qty_in,
    ism.storage_id,
    (SELECT name FROM storages WHERE id = ism.storage_id),
    ism.qty_in,
    ism.created_at,
    0
FROM ingredient_stock_movements ism
WHERE ism.ingredient_id = '6632017e-fe9b-4320-8c82-b7e208ec1de0'

ORDER BY created_at DESC;
