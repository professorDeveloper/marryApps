DROP TABLE IF EXISTS printer_settings;

CREATE TABLE IF NOT EXISTS printer_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ip TEXT NOT NULL,
    port INTEGER NOT NULL,
    type TEXT NOT NULL,
    connected_entity_ids UUID[] NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at BIGINT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_printer_settings_type
ON printer_settings(type);

CREATE INDEX IF NOT EXISTS idx_printer_settings_deleted_at
ON printer_settings(deleted_at);