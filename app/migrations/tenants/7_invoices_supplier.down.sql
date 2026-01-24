DROP TABLE IF EXISTS invoice_detailed CASCADE;
DROP TABLE IF EXISTS invoices CASCADE;
DROP TABLE IF EXISTS suppliers CASCADE;

DROP INDEX IF EXISTS idx_invoice_detailed_invoice;
DROP INDEX IF EXISTS idx_invoices_date;
DROP INDEX IF EXISTS idx_invoices_supplier_id;
DROP INDEX IF EXISTS idx_suppliers_name;
DROP TYPE IF EXISTS invoice_status CASCADE;
