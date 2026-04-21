-- ============================================
-- COMPLETE INVOICE DATA QUERY
-- Tenant: tenant_mary_ai
-- ============================================
SET search_path TO "tenant_mary_ai", public;

-- ============================================
-- 1. BOTH INVOICES - ALL FIELDS
-- ============================================
SELECT
    i.id,
    i.supplier_id,
    s.name AS supplier_name,
    s.phone_number,
    s.location,
    i.storage_id,
    st.name AS storage_name,
    st.address AS storage_address,
    i.branch_id,
    b.name AS branch_name,
    i.total_amount,
    i.status,
    i.date,
    i.created_at,
    i.updated_at,
    i.deleted_at
FROM invoices i
LEFT JOIN suppliers s ON i.supplier_id = s.id
LEFT JOIN storages st ON i.storage_id = st.id
LEFT JOIN branches b ON i.branch_id = b.id
WHERE i.id IN ('aef8885a-ae6d-4247-b0eb-191f123af972', '3141926c-ae5e-4ba3-b8c6-d3df55f789a8')
ORDER BY i.date DESC;

-- ============================================
-- 2. INVOICE 1 - COMPLETE WITH ALL LINE ITEMS
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
    i.total_amount AS invoice_total,
    i.status,
    i.date AS invoice_date,
    i.created_at,
    i.updated_at,
    -- Invoice detail line items
    id.id AS line_item_id,
    id.ingredient_id,
    ing.name AS ingredient_name,
    ing.measurement,
    ing.price_per_unit AS ingredient_catalog_price,
    ig.id AS ingredient_group_id,
    ig.name AS ingredient_group_name,
    id.quantity,
    id.price,
    id.price_per_unit AS invoice_line_price,
    (id.quantity * id.price_per_unit) AS line_total,
    id.created_at AS line_item_created_at
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
-- 3. INVOICE 2 - COMPLETE WITH ALL LINE ITEMS
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
    i.total_amount AS invoice_total,
    i.status,
    i.date AS invoice_date,
    i.created_at,
    i.updated_at,
    -- Invoice detail line items
    id.id AS line_item_id,
    id.ingredient_id,
    ing.name AS ingredient_name,
    ing.measurement,
    ing.price_per_unit AS ingredient_catalog_price,
    ig.id AS ingredient_group_id,
    ig.name AS ingredient_group_name,
    id.quantity,
    id.price,
    id.price_per_unit AS invoice_line_price,
    (id.quantity * id.price_per_unit) AS line_total,
    id.created_at AS line_item_created_at
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
-- 4. INGREDIENT 6632017e-fe9b-4320-8c82-b7e208ec1de0 - ALL RELATED DATA
-- ============================================

-- Basic ingredient info
SELECT
    'INGREDIENT_INFO' AS data_section,
    i.id,
    i.name,
    i.measurement,
    i.price_per_unit,
    i.picture_url,
    i.color_code,
    ig.name AS group_name,
    i.created_at,
    i.updated_at,
    NULL::TEXT AS supplementary_info
FROM ingredients i
LEFT JOIN ingredient_groups ig ON i.group_id = ig.id
WHERE i.id = '6632017e-fe9b-4320-8c82-b7e208ec1de0';

-- Stock info
SELECT
    'STOCK_INFO' AS data_section,
    ils.id,
    ils.ingredient_id,
    ils.storage_id,
    s.name AS storage_name,
    ils.branch_id,
    b.name AS branch_name,
    ils.quantity AS current_quantity,
    ils.created_at,
    ils.updated_at,
    NULL::TEXT AS supplementary_info
FROM ingredient_stock ils
LEFT JOIN storages s ON ils.storage_id = s.id
LEFT JOIN branches b ON ils.branch_id = b.id
WHERE ils.ingredient_id = '6632017e-fe9b-4320-8c82-b7e208ec1de0'
  AND ils.deleted_at = 0;

-- Invoice items
SELECT
    'INVOICE_ITEM' AS data_section,
    id.id,
    id.ingredient_id,
    id.invoice_id,
    inv.date AS invoice_date,
    inv.status,
    s.name AS supplier_name,
    st.name AS storage_name,
    b.name AS branch_name,
    id.quantity,
    id.price,
    id.price_per_unit,
    (id.quantity * id.price_per_unit) AS line_total,
    inv.created_at AS invoice_created_at,
    id.created_at AS item_created_at,
    NULL::TEXT AS supplementary_info
FROM invoice_detailed id
JOIN invoices inv ON id.invoice_id = inv.id
LEFT JOIN suppliers s ON inv.supplier_id = s.id
LEFT JOIN storages st ON inv.storage_id = st.id
LEFT JOIN branches b ON inv.branch_id = b.id
WHERE id.ingredient_id = '6632017e-fe9b-4320-8c82-b7e208ec1de0'
  AND id.deleted_at = 0
ORDER BY inv.date DESC;

-- Stock movements
SELECT
    'STOCK_MOVEMENT' AS data_section,
    ism.id,
    ism.ingredient_id,
    ism.storage_id,
    s.name AS storage_name,
    ism.event_type,
    ism.qty_in,
    ism.qty_out,
    ism.stock_before,
    ism.stock_after,
    ism.price_per_unit,
    ism.source_type,
    ism.source_id,
    ism.created_at,
    NULL::BIGINT AS updated_at,
    NULL::TEXT AS supplementary_info
FROM ingredient_stock_movements ism
LEFT JOIN storages s ON ism.storage_id = s.id
WHERE ism.ingredient_id = '6632017e-fe9b-4320-8c82-b7e208ec1de0'
ORDER BY ism.created_at DESC;

-- Inventory items
SELECT
    'INVENTORY_ITEM' AS data_section,
    ii.id,
    ii.inventory_id,
    ii.ingredient_id,
    inv.number AS inventory_number,
    inv.date AS inventory_date,
    inv.status,
    s.name AS storage_name,
    ii.counted_quantity,
    inv.surplus_amount,
    inv.shortage_amount,
    inv.remaining_amount,
    inv.applied_at,
    ii.created_at,
    NULL::TEXT AS supplementary_info
FROM inventory_items ii
JOIN inventories inv ON ii.inventory_id = inv.id
LEFT JOIN storages s ON inv.storage_id = s.id
WHERE ii.ingredient_id = '6632017e-fe9b-4320-8c82-b7e208ec1de0'
  AND ii.deleted_at = 0
ORDER BY inv.date DESC;

-- Deduction items
SELECT
    'DEDUCTION_ITEM' AS data_section,
    di.id,
    di.ingredient_id,
    di.deduction_id,
    ded.number AS deduction_number,
    ded.date AS deduction_date,
    ded.status,
    s.name AS storage_name,
    di.quantity,
    ded.balance,
    ded.created_at,
    NULL::BIGINT AS updated_at,
    NULL::TEXT AS supplementary_info
FROM deduction_items di
JOIN deductions ded ON di.deduction_id = ded.id
LEFT JOIN storages s ON ded.storage_id = s.id
WHERE di.ingredient_id = '6632017e-fe9b-4320-8c82-b7e208ec1de0'
  AND di.deleted_at = 0
ORDER BY ded.date DESC;

-- Deduction item ingredients (detailed)
SELECT
    'DEDUCTION_ITEM_INGREDIENT' AS data_section,
    dii.id,
    dii.ingredient_id,
    dii.deduction_item_id,
    di.deduction_id,
    ded.number AS deduction_number,
    ded.date AS deduction_date,
    s.name AS storage_name,
    dii.quantity,
    dii.stock_before,
    dii.stock_after,
    dii.price_per_unit,
    dii.amount,
    dii.created_at,
    NULL::TEXT AS supplementary_info
FROM deduction_item_ingredients dii
JOIN deduction_items di ON dii.deduction_item_id = di.id
JOIN deductions ded ON di.deduction_id = ded.id
LEFT JOIN storages s ON ded.storage_id = s.id
WHERE dii.ingredient_id = '6632017e-fe9b-4320-8c82-b7e208ec1de0'
  AND dii.deleted_at = 0
ORDER BY ded.date DESC;

-- ============================================
-- 5. SUMMARY - HOW MANY RECORDS OF EACH TYPE
-- ============================================
SELECT
    (SELECT COUNT(*) FROM invoices WHERE id IN ('aef8885a-ae6d-4247-b0eb-191f123af972', '3141926c-ae5e-4ba3-b8c6-d3df55f789a8')) AS matching_invoices,
    (SELECT COUNT(*) FROM invoice_detailed WHERE invoice_id IN ('aef8885a-ae6d-4247-b0eb-191f123af972', '3141926c-ae5e-4ba3-b8c6-d3df55f789a8')) AS invoice_line_items,
    (SELECT COUNT(*) FROM invoice_detailed WHERE ingredient_id = '6632017e-fe9b-4320-8c82-b7e208ec1de0') AS items_for_ingredient,
    (SELECT COUNT(*) FROM ingredient_stock WHERE ingredient_id = '6632017e-fe9b-4320-8c82-b7e208ec1de0' AND deleted_at = 0) AS stock_records,
    (SELECT COUNT(*) FROM ingredient_stock_movements WHERE ingredient_id = '6632017e-fe9b-4320-8c82-b7e208ec1de0') AS movement_records,
    (SELECT COUNT(*) FROM inventory_items WHERE ingredient_id = '6632017e-fe9b-4320-8c82-b7e208ec1de0' AND deleted_at = 0) AS inventory_items,
    (SELECT COUNT(*) FROM deduction_items WHERE ingredient_id = '6632017e-fe9b-4320-8c82-b7e208ec1de0' AND deleted_at = 0) AS deduction_items;
