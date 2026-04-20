-- ============================================
-- INVOICE DATA WITH DELETED STATUS ANALYSIS
-- Tenant: tenant_mary_ai
-- ============================================
SET search_path TO "tenant_mary_ai", public;

-- ============================================
-- 1. INVOICE DETAILED - SHOW DELETED STATUS
-- ============================================
SELECT
    id.id,
    id.invoice_id,
    id.ingredient_id,
    id.quantity,
    id.price,
    id.price_per_unit,
    id.created_at,
    id.updated_at,
    id.deleted_at,
    CASE
        WHEN id.deleted_at = 0 THEN 'ACTIVE'
        WHEN id.deleted_at > 0 THEN 'DELETED at ' || to_timestamp(id.deleted_at)::text
    END AS status_info,
    (id.quantity * id.price_per_unit) AS line_total
FROM invoice_detailed id
WHERE id.invoice_id IN ('aef8885a-ae6d-4247-b0eb-191f123af972', '3141926c-ae5e-4ba3-b8c6-d3df55f789a8')
ORDER BY id.invoice_id, id.created_at;

-- ============================================
-- 2. ONLY ACTIVE INVOICE DETAILS (deleted_at = 0)
-- ============================================
SELECT
    id.id,
    id.invoice_id,
    id.ingredient_id,
    ing.name AS ingredient_name,
    id.quantity,
    id.price,
    id.price_per_unit,
    (id.quantity * id.price_per_unit) AS line_total,
    id.created_at
FROM invoice_detailed id
LEFT JOIN ingredients ing ON id.ingredient_id = ing.id
WHERE id.invoice_id IN ('aef8885a-ae6d-4247-b0eb-191f123af972', '3141926c-ae5e-4ba3-b8c6-d3df55f789a8')
  AND id.deleted_at = 0
ORDER BY id.invoice_id, id.created_at;

-- ============================================
-- 3. COMPLETE INVOICE 1 WITH ONLY ACTIVE ITEMS
-- ============================================
SELECT
    i.id AS invoice_id,
    i.date AS invoice_date,
    i.status,
    i.total_amount,
    s.name AS supplier_name,
    st.name AS storage_name,
    -- Line items (active only)
    id.id AS line_item_id,
    id.ingredient_id,
    ing.name AS ingredient_name,
    ing.measurement,
    id.quantity,
    id.price_per_unit,
    (id.quantity * id.price_per_unit) AS line_total
FROM invoices i
LEFT JOIN suppliers s ON i.supplier_id = s.id
LEFT JOIN storages st ON i.storage_id = st.id
LEFT JOIN invoice_detailed id ON i.id = id.invoice_id AND id.deleted_at = 0
LEFT JOIN ingredients ing ON id.ingredient_id = ing.id
WHERE i.id = 'aef8885a-ae6d-4247-b0eb-191f123af972'
ORDER BY id.created_at;

-- ============================================
-- 4. COMPLETE INVOICE 2 WITH ONLY ACTIVE ITEMS
-- ============================================
SELECT
    i.id AS invoice_id,
    i.date AS invoice_date,
    i.status,
    i.total_amount,
    s.name AS supplier_name,
    st.name AS storage_name,
    -- Line items (active only)
    id.id AS line_item_id,
    id.ingredient_id,
    ing.name AS ingredient_name,
    ing.measurement,
    id.quantity,
    id.price_per_unit,
    (id.quantity * id.price_per_unit) AS line_total
FROM invoices i
LEFT JOIN suppliers s ON i.supplier_id = s.id
LEFT JOIN storages st ON i.storage_id = st.id
LEFT JOIN invoice_detailed id ON i.id = id.invoice_id AND id.deleted_at = 0
LEFT JOIN ingredients ing ON id.ingredient_id = ing.id
WHERE i.id = '3141926c-ae5e-4ba3-b8c6-d3df55f789a8'
ORDER BY id.created_at;

-- ============================================
-- 5. INGREDIENT 6632017e-fe9b-4320-8c82-b7e208ec1de0 - ONLY ACTIVE DATA
-- ============================================

-- All invoice items for this ingredient (active only)
SELECT
    'INVOICE_ITEM' AS data_type,
    id.id,
    id.invoice_id,
    inv.date AS invoice_date,
    inv.status,
    s.name AS supplier_name,
    id.quantity,
    id.price_per_unit,
    (id.quantity * id.price_per_unit) AS line_total,
    id.created_at
FROM invoice_detailed id
JOIN invoices inv ON id.invoice_id = inv.id
LEFT JOIN suppliers s ON inv.supplier_id = s.id
WHERE id.ingredient_id = '6632017e-fe9b-4320-8c82-b7e208ec1de0'
  AND id.deleted_at = 0
ORDER BY inv.date DESC;

-- Stock info
SELECT
    'STOCK_INFO' AS data_type,
    ils.id,
    ils.storage_id,
    s.name AS storage_name,
    ils.quantity AS current_quantity,
    ils.created_at
FROM ingredient_stock ils
LEFT JOIN storages s ON ils.storage_id = s.id
WHERE ils.ingredient_id = '6632017e-fe9b-4320-8c82-b7e208ec1de0'
  AND ils.deleted_at = 0;

-- Stock movements
SELECT
    'STOCK_MOVEMENT' AS data_type,
    ism.id,
    ism.storage_id,
    s.name AS storage_name,
    ism.event_type,
    ism.qty_in,
    ism.qty_out,
    ism.stock_before,
    ism.stock_after,
    ism.created_at
FROM ingredient_stock_movements ism
LEFT JOIN storages s ON ism.storage_id = s.id
WHERE ism.ingredient_id = '6632017e-fe9b-4320-8c82-b7e208ec1de0'
ORDER BY ism.created_at DESC;

-- ============================================
-- 6. DELETED VS ACTIVE COUNT
-- ============================================
SELECT
    'Invoice 1' AS invoice,
    (SELECT COUNT(*) FROM invoice_detailed WHERE invoice_id = 'aef8885a-ae6d-4247-b0eb-191f123af972' AND deleted_at = 0) AS active_items,
    (SELECT COUNT(*) FROM invoice_detailed WHERE invoice_id = 'aef8885a-ae6d-4247-b0eb-191f123af972' AND deleted_at > 0) AS deleted_items
UNION ALL
SELECT
    'Invoice 2',
    (SELECT COUNT(*) FROM invoice_detailed WHERE invoice_id = '3141926c-ae5e-4ba3-b8c6-d3df55f789a8' AND deleted_at = 0),
    (SELECT COUNT(*) FROM invoice_detailed WHERE invoice_id = '3141926c-ae5e-4ba3-b8c6-d3df55f789a8' AND deleted_at > 0);

-- ============================================
-- 7. INVOICES THEMSELVES - STATUS
-- ============================================
SELECT
    i.id,
    i.date,
    i.status,
    i.total_amount,
    s.name AS supplier_name,
    i.deleted_at,
    CASE
        WHEN i.deleted_at = 0 THEN 'ACTIVE'
        WHEN i.deleted_at > 0 THEN 'DELETED'
    END AS invoice_status
FROM invoices i
LEFT JOIN suppliers s ON i.supplier_id = s.id
WHERE i.id IN ('aef8885a-ae6d-4247-b0eb-191f123af972', '3141926c-ae5e-4ba3-b8c6-d3df55f789a8');
