ALTER TABLE printer_settings
ADD COLUMN IF NOT EXISTS connection_type TEXT NOT NULL DEFAULT 'cable';