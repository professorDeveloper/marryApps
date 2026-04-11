DROP TABLE IF EXISTS printer_settings;

CREATE TABLE IF NOT EXISTS printer_settings (
    id SMALLINT PRIMARY KEY,
    cashier_printer_ip TEXT NOT NULL,
    kitchen_printer_ip TEXT NOT NULL,
    printer_port INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO printer_settings (
    id,
    cashier_printer_ip,
    kitchen_printer_ip,
    printer_port
)
VALUES (
    1,
    '',
    '',
    9100
)
ON CONFLICT (id) DO NOTHING;