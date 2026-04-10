CREATE TABLE IF NOT EXISTS printer_settings (
  id                 SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  cashier_printer_ip TEXT NOT NULL DEFAULT '',
  kitchen_printer_ip TEXT NOT NULL DEFAULT '',
  printer_port       INTEGER NOT NULL DEFAULT 9100 CHECK (printer_port > 0 AND printer_port <= 65535),
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION update_printer_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_printer_settings_updated_at ON printer_settings;

CREATE TRIGGER trg_printer_settings_updated_at
BEFORE UPDATE ON printer_settings
FOR EACH ROW
EXECUTE FUNCTION update_printer_settings_updated_at();