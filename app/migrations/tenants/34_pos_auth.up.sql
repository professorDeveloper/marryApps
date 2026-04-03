CREATE TABLE IF NOT EXISTS pos_auth_settings (
  id                SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  pos_password_hash TEXT NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION update_pos_auth_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_pos_auth_settings_updated_at ON pos_auth_settings;

CREATE TRIGGER trg_pos_auth_settings_updated_at
BEFORE UPDATE ON pos_auth_settings
FOR EACH ROW
EXECUTE FUNCTION update_pos_auth_settings_updated_at();