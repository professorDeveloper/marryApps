CREATE UNIQUE INDEX IF NOT EXISTS uq_printer_settings_ip_port_type_active
ON printer_settings (ip, port, type)
WHERE deleted_at = 0;