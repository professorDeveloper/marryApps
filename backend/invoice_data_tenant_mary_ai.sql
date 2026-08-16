-- ============================================
-- INVOICE DATA FOR TENANT: tenant_mary_ai
-- ============================================
-- Set search path to the correct tenant schema
SET search_path TO "tenant_mary_ai", public;

-- ============================================
-- 1. CHECK BOTH INVOICES
-- ============================================
SELECT
   *
FROM invoices i
WHERE i.id IN ('aef8885a-ae6d-4247-b0eb-191f123af972', '3141926c-ae5e-4ba3-b8c6-d3df55f789a8');

-- ============================================
-- 2. INVOICE DETAILS - ALL FIELDS
-- ============================================
SELECT
   *
FROM invoice_detailed id
WHERE id.invoice_id IN ('aef8885a-ae6d-4247-b0eb-191f123af972', '3141926c-ae5e-4ba3-b8c6-d3df55f789a8');

-- ============================================
-- 3. COMPLETE INVOICE 1 WITH ALL DETAILS
-- ============================================
SELECT
    i.id AS invoice_id,
    i.supplier_id,
    s.name AS supplier_name,
    s.phone_number AS supplier_phone,
    s.location AS supplier_location,
    i.storage_id,
    st.name AS storage_name,
    i.branch_id,
    b.name AS branch_name,
    i.total_amount,
    i.status,
    i.date,
    i.created_at,
    i.updated_at,
    i.deleted_at,
    -- Invoice details
    id.id AS detail_id,
    id.ingredient_id,
    ing.name AS ingredient_name,
    ing.measurement,
    ing.price_per_unit AS ingredient_price_per_unit,
    ig.name AS ingredient_group,
    id.quantity,
    id.price AS detail_price,
    id.price_per_unit AS detail_price_per_unit,
    (id.quantity * id.price_per_unit) AS line_total
FROM invoices i
LEFT JOIN suppliers s ON i.supplier_id = s.id
LEFT JOIN storages st ON i.storage_id = st.id
LEFT JOIN branches b ON i.branch_id = b.id
LEFT JOIN invoice_detailed id ON i.id = id.invoice_id
LEFT JOIN ingredients ing ON id.ingredient_id = ing.id
LEFT JOIN ingredient_groups ig ON ing.group_id = ig.id
WHERE i.id = 'aef8885a-ae6d-4247-b0eb-191f123af972'
ORDER BY id.created_at;

-- ============================================
-- 4. COMPLETE INVOICE 2 WITH ALL DETAILS
-- ============================================
SELECT
    i.id AS invoice_id,
    i.supplier_id,
    s.name AS supplier_name,
    s.phone_number AS supplier_phone,
    s.location AS supplier_location,
    i.storage_id,
    st.name AS storage_name,
    i.branch_id,
    b.name AS branch_name,
    i.total_amount,
    i.status,
    i.date,
    i.created_at,
    i.updated_at,
    i.deleted_at,
    -- Invoice details
    id.id AS detail_id,
    id.ingredient_id,
    ing.name AS ingredient_name,
    ing.measurement,
    ing.price_per_unit AS ingredient_price_per_unit,
    ig.name AS ingredient_group,
    id.quantity,
    id.price AS detail_price,
    id.price_per_unit AS detail_price_per_unit,
    (id.quantity * id.price_per_unit) AS line_total
FROM invoices i
LEFT JOIN suppliers s ON i.supplier_id = s.id
LEFT JOIN storages st ON i.storage_id = st.id
LEFT JOIN branches b ON i.branch_id = b.id
LEFT JOIN invoice_detailed id ON i.id = id.invoice_id
LEFT JOIN ingredients ing ON id.ingredient_id = ing.id
LEFT JOIN ingredient_groups ig ON ing.group_id = ig.id
WHERE i.id = '3141926c-ae5e-4ba3-b8c6-d3df55f789a8'
ORDER BY id.created_at;

-- ============================================
-- 5. ALL RELATED DATA FOR INGREDIENT 6632017e-fe9b-4320-8c82-b7e208ec1de0
-- ============================================

-- Ingredient basic info
SELECT 'INGREDIENT' AS data_type, * FROM (
    SELECT
        i.id,
        i.name,
        i.measurement,
        i.price_per_unit,
        i.picture_url,
        i.color_code,
        ig.name AS group_name,
        i.created_at,
        i.updated_at,
        i.deleted_at
    FROM ingredients i
    LEFT JOIN ingredient_groups ig ON i.group_id = ig.id
    WHERE i.id = '6632017e-fe9b-4320-8c82-b7e208ec1de0'
) t;

-- Invoices containing this ingredient
SELECT 'INVOICE' AS data_type, * FROM (
    SELECT
        i.id,
        i.supplier_id,
        s.name AS supplier_name,
        i.storage_id,
        st.name AS storage_name,
        i.branch_id,
        b.name AS branch_name,
        i.total_amount,
        i.status,
        i.date,
        i.created_at,
        i.updated_at,
        i.deleted_at,
        NULL::UUID AS ingredient_id,
        NULL::TEXT AS ingredient_name,
        NULL::NUMERIC AS qty,
        NULL::NUMERIC AS ppu
    FROM invoices i
    LEFT JOIN suppliers s ON i.supplier_id = s.id
    LEFT JOIN storages st ON i.storage_id = st.id
    LEFT JOIN branches b ON i.branch_id = b.id
    WHERE i.id IN (
        SELECT DISTINCT invoice_id FROM invoice_detailed
        WHERE ingredient_id = '6632017e-fe9b-4320-8c82-b7e208ec1de0'
    )
) t;

-- Invoice line items for this ingredient
SELECT 'INVOICE_DETAIL' AS data_type, * FROM (
    SELECT
        id.id,
        id.invoice_id,
        inv.date,
        inv.status,
        s.name AS supplier_name,
        id.ingredient_id,
        id.quantity AS qty,
        id.price_per_unit AS ppu,
        id.quantity * id.price_per_unit AS total,
        id.created_at,
        id.updated_at,
        id.deleted_at,
        NULL::UUID AS storage_id,
        NULL::TEXT AS storage_name,
        NULL::UUID AS branch_id,
        NULL::TEXT AS branch_name,
        NULL::NUMERIC AS total_amount,
        NULL::TEXT AS ingredient_name
    FROM invoice_detailed id
    JOIN invoices inv ON id.invoice_id = inv.id
    LEFT JOIN suppliers s ON inv.supplier_id = s.id
    WHERE id.ingredient_id = '6632017e-fe9b-4320-8c82-b7e208ec1de0'
) t;

-- Stock movements
SELECT 'STOCK_MOVEMENT' AS data_type, * FROM (
    SELECT
        ism.id,
        ism.storage_id,
        s.name AS storage_name,
        ism.ingredient_id,
        ism.event_type,
        ism.qty_in,
        ism.qty_out,
        ism.stock_before,
        ism.stock_after,
        ism.price_per_unit,
        ism.source_type,
        ism.source_id,
        ism.created_at,
        NULL::TIMESTAMPTZ AS updated_at,
        NULL::BIGINT AS deleted_at,
        NULL::UUID AS invoice_id,
        NULL::NUMERIC AS quantity,
        NULL::NUMERIC AS price,
        NULL::TEXT AS supplier_name,
        NULL::TEXT AS status
    FROM ingredient_stock_movements ism
    LEFT JOIN storages s ON ism.storage_id = s.id
    WHERE ism.ingredient_id = '6632017e-fe9b-4320-8c82-b7e208ec1de0'
) t;

-- ============================================
-- 6. SUPPLIERS - ALL DATA
-- ============================================
SELECT
    s.id,
    s.name,
    s.phone_number,
    s.location,
    s.branch_id,
    b.name AS branch_name,
    s.created_at,
    s.updated_at,
    s.deleted_at
FROM suppliers s
LEFT JOIN branches b ON s.branch_id = b.id
WHERE s.id IN (
    SELECT DISTINCT supplier_id FROM invoices
    WHERE id IN ('aef8885a-ae6d-4247-b0eb-191f123af972', '3141926c-ae5e-4ba3-b8c6-d3df55f789a8')
);

-- ============================================
-- 7. STORAGES - ALL DATA
-- ============================================
SELECT
    st.id,
    st.name,
    st.address,
    st.branch_id,
    b.name AS branch_name,
    st.created_at,
    st.updated_at,
    st.deleted_at
FROM storages st
LEFT JOIN branches b ON st.branch_id = b.id
WHERE st.id IN (
    SELECT DISTINCT storage_id FROM invoices
    WHERE id IN ('aef8885a-ae6d-4247-b0eb-191f123af972', '3141926c-ae5e-4ba3-b8c6-d3df55f789a8')
);

-- ============================================
-- 8. BRANCHES - ALL DATA
-- ============================================
SELECT
    b.id,
    b.name,
    b.address,
    b.phone,
    b.default_service_percent,
    b.created_at,
    b.updated_at,
    b.deleted_at
FROM branches b
WHERE b.id IN (
    SELECT DISTINCT branch_id FROM invoices
    WHERE id IN ('aef8885a-ae6d-4247-b0eb-191f123af972', '3141926c-ae5e-4ba3-b8c6-d3df55f789a8')
);

-- ============================================
-- 9. INGREDIENTS - ALL DATA FROM INVOICES
-- ============================================
SELECT
    i.id,
    i.name,
    i.measurement,
    i.price_per_unit,
    i.picture_url,
    i.color_code,
    ig.name AS group_name,
    i.created_at,
    i.updated_at,
    i.deleted_at
FROM ingredients i
LEFT JOIN ingredient_groups ig ON i.group_id = ig.id
WHERE i.id IN (
    SELECT DISTINCT ingredient_id FROM invoice_detailed
    WHERE invoice_id IN ('aef8885a-ae6d-4247-b0eb-191f123af972', '3141926c-ae5e-4ba3-b8c6-d3df55f789a8')
);

-- ============================================
-- 10. DATA SUMMARY/COUNTS
-- ============================================
SELECT 'invoices' as table_name, COUNT(*) as total_rows FROM invoices
UNION ALL SELECT 'invoice_detailed', COUNT(*) FROM invoice_detailed
UNION ALL SELECT 'suppliers', COUNT(*) FROM suppliers
UNION ALL SELECT 'storages', COUNT(*) FROM storages
UNION ALL SELECT 'branches', COUNT(*) FROM branches
UNION ALL SELECT 'ingredients', COUNT(*) FROM ingredients
UNION ALL SELECT 'ingredient_stock_movements', COUNT(*) FROM ingredient_stock_movements;
