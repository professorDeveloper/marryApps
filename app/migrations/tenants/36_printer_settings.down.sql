DROP TRIGGER IF EXISTS trg_printer_settings_updated_at ON printer_settings;
DROP FUNCTION IF EXISTS update_printer_settings_updated_at();
DROP TABLE IF EXISTS printer_settings;