-- ============================================
-- COMPLETE INVOICE DATA WITH ALL FIELDS
-- ============================================

-- First, let's get BOTH invoices with complete details
WITH invoice_data AS (
    SELECT
        i.*,
        s.id AS supplier_id_check,
        s.name AS supplier_name,
        s.phone_number AS supplier_phone,
        s.location AS supplier_location,
        st.id AS storage_id_check,
        st.name AS storage_name,
        st.address AS storage_address,
        b.id AS branch_id_check,
        b.name AS branch_name,
        b.address AS branch_address,
        b.phone AS branch_phone
    FROM invoices i
    LEFT JOIN suppliers s ON i.supplier_id = s.id
    LEFT JOIN storages st ON i.storage_id = st.id
    LEFT JOIN branches b ON i.branch_id = b.id
    WHERE i.id IN ('aef8885a-ae6d-4247-b0eb-191f123af972', '3141926c-ae5e-4ba3-b8c6-d3df55f789a8')
)
SELECT * FROM invoice_data;

-- ============================================
-- INVOICE DETAILED - ALL FIELDS
-- ============================================
-- Get every single field from invoice_detailed for these invoices
SELECT
    id.id,
    id.invoice_id,
    id.ingredient_id,
    i.name AS ingredient_name,
    i.measurement,
    i.price_per_unit AS ingredient_price_per_unit,
    i.picture_url,
    i.color_code,
    ig.name AS ingredient_group,
    id.quantity,
    id.price,
    id.price_per_unit AS invoice_line_price_per_unit,
    (id.quantity * id.price_per_unit) AS line_total,
    id.created_at,
    id.updated_at,
    id.deleted_at
FROM invoice_detailed id
LEFT JOIN ingredients i ON id.ingredient_id = i.id
LEFT JOIN ingredient_groups ig ON i.group_id = ig.id
WHERE id.invoice_id IN ('aef8885a-ae6d-4247-b0eb-191f123af972', '3141926c-ae5e-4ba3-b8c6-d3df55f789a8')
ORDER BY id.invoice_id, id.created_at;

-- ============================================
-- SUPPLIERS - ALL FIELDS
-- ============================================
SELECT
    s.*
FROM suppliers s
WHERE s.id IN (
    SELECT DISTINCT supplier_id FROM invoices
    WHERE id IN ('aef8885a-ae6d-4247-b0eb-191f123af972', '3141926c-ae5e-4ba3-b8c6-d3df55f789a8')
);

-- ============================================
-- STORAGES - ALL FIELDS
-- ============================================
SELECT
    st.*
FROM storages st
WHERE st.id IN (
    SELECT DISTINCT storage_id FROM invoices
    WHERE id IN ('aef8885a-ae6d-4247-b0eb-191f123af972', '3141926c-ae5e-4ba3-b8c6-d3df55f789a8')
);

-- ============================================
-- BRANCHES - ALL FIELDS
-- ============================================
SELECT
    b.*
FROM branches b
WHERE b.id IN (
    SELECT DISTINCT branch_id FROM invoices
    WHERE id IN ('aef8885a-ae6d-4247-b0eb-191f123af972', '3141926c-ae5e-4ba3-b8c6-d3df55f789a8')
);

-- ============================================
-- INGREDIENTS - ALL FIELDS (from these invoices)
-- ============================================
SELECT
    i.id,
    i.name,
    i.name_i18n,
    i.group_id,
    ig.name AS group_name,
    i.measurement,
    i.picture_url,
    i.color_code,
    i.price_per_unit,
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
-- UNIFIED VIEW - EVERYTHING IN ONE RESULT
-- ============================================
-- Combine everything into a single comprehensive view
SELECT
    'INVOICE' AS data_type,
    i.id,
    i.id AS invoice_id,
    i.supplier_id,
    i.storage_id,
    i.branch_id,
    i.total_amount,
    i.status,
    i.date,
    i.created_at,
    i.updated_at,
    i.deleted_at,
    s.name AS supplier_name,
    st.name AS storage_name,
    b.name AS branch_name,
    NULL::TEXT AS ingredient_name,
    NULL::TEXT AS ingredient_id,
    NULL::NUMERIC AS quantity,
    NULL::NUMERIC AS line_price,
    NULL::BIGINT AS line_created_at
FROM invoices i
LEFT JOIN suppliers s ON i.supplier_id = s.id
LEFT JOIN storages st ON i.storage_id = st.id
LEFT JOIN branches b ON i.branch_id = b.id
WHERE i.id IN ('aef8885a-ae6d-4247-b0eb-191f123af972', '3141926c-ae5e-4ba3-b8c6-d3df55f789a8')

UNION ALL

SELECT
    'INVOICE_DETAIL' AS data_type,
    id.id,
    id.invoice_id,
    NULL::UUID AS supplier_id,
    NULL::UUID AS storage_id,
    NULL::UUID AS branch_id,
    NULL::NUMERIC AS total_amount,
    NULL::TEXT AS status,
    NULL::TIMESTAMP AS date,
    id.created_at,
    id.updated_at,
    id.deleted_at,
    NULL::TEXT AS supplier_name,
    NULL::TEXT AS storage_name,
    NULL::TEXT AS branch_name,
    i.name AS ingredient_name,
    id.ingredient_id,
    id.quantity,
    id.price_per_unit AS line_price,
    NULL::BIGINT AS line_created_at
FROM invoice_detailed id
LEFT JOIN ingredients i ON id.ingredient_id = i.id
WHERE id.invoice_id IN ('aef8885a-ae6d-4247-b0eb-191f123af972', '3141926c-ae5e-4ba3-b8c6-d3df55f789a8')

ORDER BY invoice_id, data_type;

-- ============================================
-- QUICK SUMMARY
-- ============================================
SELECT
    COUNT(*) as total_invoices,
    SUM(CASE WHEN id IN ('aef8885a-ae6d-4247-b0eb-191f123af972', '3141926c-ae5e-4ba3-b8c6-d3df55f789a8') THEN 1 ELSE 0 END) as matching_invoices
FROM invoices;

SELECT 'invoice_detailed' as table_name, COUNT(*) as count FROM invoice_detailed
UNION ALL
SELECT 'invoices', COUNT(*) FROM invoices
UNION ALL
SELECT 'suppliers', COUNT(*) FROM suppliers
UNION ALL
SELECT 'storages', COUNT(*) FROM storages
UNION ALL
SELECT 'branches', COUNT(*) FROM branches
UNION ALL
SELECT 'ingredients', COUNT(*) FROM ingredients;
