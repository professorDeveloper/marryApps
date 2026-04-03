DROP TRIGGER IF EXISTS trg_pos_auth_settings_updated_at ON pos_auth_settings;
DROP FUNCTION IF EXISTS update_pos_auth_settings_updated_at();
DROP TABLE IF EXISTS pos_auth_settings;