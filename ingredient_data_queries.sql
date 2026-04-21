-- ============================================
-- COMPREHENSIVE INGREDIENT DATA QUERIES
-- ============================================
-- Ingredient ID: 6632017e-fe9b-4320-8c82-b7e208ec1de0

-- 1. INGREDIENT BASIC INFO
-- ============================================
SELECT
    i.id,
    i.name,
    i.measurement,
    i.price_per_unit,
    i.picture_url,
    i.color_code,
    ig.name AS group_name,
    t.uz AS name_uz,
    t.ru AS name_ru,
    t.en AS name_en,
    i.created_at,
    i.updated_at
FROM ingredients i
LEFT JOIN ingredient_groups ig ON i.group_id = ig.id
LEFT JOIN translations t ON i.name_i18n = t.id
WHERE i.id = '6632017e-fe9b-4320-8c82-b7e208ec1de0'
  AND i.deleted_at = 0;

-- 2. INGREDIENT STOCK (by storage and branch)
-- ============================================
SELECT
    ils.id,
    ils.ingredient_id,
    ils.storage_id,
    s.name AS storage_name,
    ils.branch_id,
    b.name AS branch_name,
    ils.quantity,
    ils.created_at,
    ils.updated_at
FROM ingredient_stock ils
LEFT JOIN storages s ON ils.storage_id = s.id
LEFT JOIN branches b ON ils.branch_id = b.id
WHERE ils.ingredient_id = '6632017e-fe9b-4320-8c82-b7e208ec1de0'
  AND ils.deleted_at = 0;

-- 3. INCOMING INVOICES (from suppliers)
-- ============================================
SELECT
    inv.id,
    inv.supplier_id,
    sup.name AS supplier_name,
    inv.storage_id,
    s.name AS storage_name,
    inv.branch_id,
    b.name AS branch_name,
    inv.total_amount,
    inv.status,
    inv.date,
    inv.created_at,
    inv.updated_at
FROM invoices inv
LEFT JOIN suppliers sup ON inv.supplier_id = sup.id
LEFT JOIN storages s ON inv.storage_id = s.id
LEFT JOIN branches b ON inv.branch_id = b.id
WHERE inv.id IN (
    SELECT DISTINCT id.invoice_id
    FROM invoice_detailed id
    WHERE id.ingredient_id = '6632017e-fe9b-4320-8c82-b7e208ec1de0'
      AND id.deleted_at = 0
)
  AND inv.deleted_at = 0
ORDER BY inv.date DESC;

-- 4. INVOICE DETAILS FOR THIS INGREDIENT
-- ============================================
SELECT
    id.id,
    id.invoice_id,
    inv.supplier_id,
    sup.name AS supplier_name,
    id.ingredient_id,
    id.quantity,
    id.price,
    id.price_per_unit,
    (id.quantity * id.price_per_unit) AS total_item_price,
    inv.date,
    inv.status,
    id.created_at
FROM invoice_detailed id
JOIN invoices inv ON id.invoice_id = inv.id
LEFT JOIN suppliers sup ON inv.supplier_id = sup.id
WHERE id.ingredient_id = '6632017e-fe9b-4320-8c82-b7e208ec1de0'
  AND id.deleted_at = 0
ORDER BY inv.date DESC;

-- 5. OUTGOING INVOICES (to other locations/branches)
-- ============================================
SELECT
    oi.id,
    oi.number,
    oi.date,
    oi.storage_id,
    s.name AS storage_name,
    oi.branch_id,
    b.name AS branch_name,
    oi.total_amount,
    oi.status,
    oi.description,
    oi.created_at
FROM outgoing_invoices oi
LEFT JOIN storages s ON oi.storage_id = s.id
LEFT JOIN branches b ON oi.branch_id = b.id
WHERE oi.id IN (
    SELECT DISTINCT oii.outgoing_invoice_id
    FROM outgoing_invoice_items oii
    WHERE oii.ingredient_id = '6632017e-fe9b-4320-8c82-b7e208ec1de0'
      AND oii.deleted_at = 0
)
  AND oi.deleted_at = 0
ORDER BY oi.date DESC;

-- 6. OUTGOING INVOICE ITEMS FOR THIS INGREDIENT
-- ============================================
SELECT
    oii.id,
    oii.outgoing_invoice_id,
    oi.number AS invoice_number,
    oii.ingredient_id,
    oii.quantity,
    oii.price_per_unit,
    oii.total_amount,
    oii.stock_before,
    oii.stock_after,
    oi.date,
    oi.status,
    oii.created_at
FROM outgoing_invoice_items oii
JOIN outgoing_invoices oi ON oii.outgoing_invoice_id = oi.id
WHERE oii.ingredient_id = '6632017e-fe9b-4320-8c82-b7e208ec1de0'
  AND oii.deleted_at = 0
ORDER BY oi.date DESC;

-- 7. INGREDIENT STOCK MOVEMENTS
-- ============================================
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
    ism.created_at
FROM ingredient_stock_movements ism
LEFT JOIN storages s ON ism.storage_id = s.id
WHERE ism.ingredient_id = '6632017e-fe9b-4320-8c82-b7e208ec1de0'
ORDER BY ism.created_at DESC;

-- 8. INVENTORY ITEMS (from inventory counts)
-- ============================================
SELECT
    ii.id,
    ii.inventory_id,
    inv.number AS inventory_number,
    inv.date AS inventory_date,
    inv.storage_id,
    s.name AS storage_name,
    ii.ingredient_id,
    ii.counted_quantity,
    ii.created_at
FROM inventory_items ii
JOIN inventories inv ON ii.inventory_id = inv.id
LEFT JOIN storages s ON inv.storage_id = s.id
WHERE ii.ingredient_id = '6632017e-fe9b-4320-8c82-b7e208ec1de0'
  AND ii.deleted_at = 0
  AND inv.deleted_at = 0
ORDER BY inv.date DESC;

-- 9. DEDUCTION ITEMS (losses/waste)
-- ============================================
SELECT
    di.id,
    di.deduction_id,
    ded.number AS deduction_number,
    ded.date AS deduction_date,
    ded.storage_id,
    s.name AS storage_name,
    di.ingredient_id,
    di.quantity,
    ded.status,
    ded.created_at
FROM deduction_items di
JOIN deductions ded ON di.deduction_id = ded.id
LEFT JOIN storages s ON ded.storage_id = s.id
WHERE di.ingredient_id = '6632017e-fe9b-4320-8c82-b7e208ec1de0'
  AND di.deleted_at = 0
  AND ded.deleted_at = 0
ORDER BY ded.date DESC;

-- 10. DEDUCTION ITEM INGREDIENTS (detailed deduction tracking)
-- ============================================
SELECT
    dii.id,
    dii.deduction_item_id,
    di.deduction_id,
    ded.number AS deduction_number,
    ded.date AS deduction_date,
    dii.ingredient_id,
    dii.quantity,
    dii.stock_before,
    dii.stock_after,
    dii.price_per_unit,
    dii.amount,
    dii.created_at
FROM deduction_item_ingredients dii
JOIN deduction_items di ON dii.deduction_item_id = di.id
JOIN deductions ded ON di.deduction_id = ded.id
WHERE dii.ingredient_id = '6632017e-fe9b-4320-8c82-b7e208ec1de0'
  AND dii.deleted_at = 0
ORDER BY ded.date DESC;

-- 11. INGREDIENT VISIBILITY (which branches can see it)
-- ============================================
SELECT
    iv.id,
    iv.ingredient_id,
    iv.branch_id,
    b.name AS branch_name,
    iv.is_visible,
    iv.created_at,
    iv.updated_at
FROM ingredient_visibility iv
LEFT JOIN branches b ON iv.branch_id = b.id
WHERE iv.ingredient_id = '6632017e-fe9b-4320-8c82-b7e208ec1de0';

-- 12. COMPLETE TRANSACTION SUMMARY
-- ============================================
-- Summary of all movements (in, out, losses) for this ingredient
SELECT
    'Incoming Invoice' AS transaction_type,
    id.invoice_id AS transaction_id,
    inv.date AS transaction_date,
    'Purchase' AS event_type,
    id.quantity AS quantity,
    0 AS quantity_out,
    id.price_per_unit,
    (id.quantity * id.price_per_unit) AS total_amount,
    sup.name AS related_entity,
    inv.status AS transaction_status,
    id.created_at
FROM invoice_detailed id
JOIN invoices inv ON id.invoice_id = inv.id
LEFT JOIN suppliers sup ON inv.supplier_id = sup.id
WHERE id.ingredient_id = '6632017e-fe9b-4320-8c82-b7e208ec1de0'
  AND id.deleted_at = 0

UNION ALL

SELECT
    'Outgoing Invoice' AS transaction_type,
    oii.outgoing_invoice_id AS transaction_id,
    oi.date AS transaction_date,
    'Sale/Transfer' AS event_type,
    0 AS quantity,
    oii.quantity AS quantity_out,
    oii.price_per_unit,
    oii.total_amount,
    b.name AS related_entity,
    oi.status AS transaction_status,
    oii.created_at
FROM outgoing_invoice_items oii
JOIN outgoing_invoices oi ON oii.outgoing_invoice_id = oi.id
LEFT JOIN branches b ON oi.branch_id = b.id
WHERE oii.ingredient_id = '6632017e-fe9b-4320-8c82-b7e208ec1de0'
  AND oii.deleted_at = 0

UNION ALL

SELECT
    'Deduction' AS transaction_type,
    dii.deduction_item_id AS transaction_id,
    ded.date AS transaction_date,
    'Loss/Waste' AS event_type,
    0 AS quantity,
    dii.quantity AS quantity_out,
    dii.price_per_unit,
    dii.amount,
    ded.status AS related_entity,
    ded.status AS transaction_status,
    dii.created_at
FROM deduction_item_ingredients dii
JOIN deduction_items di ON dii.deduction_item_id = di.id
JOIN deductions ded ON di.deduction_id = ded.id
WHERE dii.ingredient_id = '6632017e-fe9b-4320-8c82-b7e208ec1de0'
  AND dii.deleted_at = 0

ORDER BY transaction_date DESC;

-- 13. INVENTORY COUNT HISTORY
-- ============================================
SELECT
    inv.id,
    inv.number,
    inv.date,
    s.name AS storage_name,
    ii.counted_quantity,
    inv.status,
    inv.surplus_amount,
    inv.shortage_amount,
    inv.remaining_amount,
    inv.applied_at,
    inv.created_at
FROM inventories inv
JOIN inventory_items ii ON inv.id = ii.inventory_id
LEFT JOIN storages s ON inv.storage_id = s.id
WHERE ii.ingredient_id = '6632017e-fe9b-4320-8c82-b7e208ec1de0'
  AND ii.deleted_at = 0
  AND inv.deleted_at = 0
ORDER BY inv.date DESC;
