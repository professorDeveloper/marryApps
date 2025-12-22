CREATE TABLE IF NOT EXISTS cafe_tables (
  id         UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
  hall_id    UUID      NOT NULL REFERENCES halls(id) ON DELETE CASCADE,
  number     INTEGER   NOT NULL,
  capacity   INTEGER   NOT NULL DEFAULT 4,
  status     VARCHAR(20) DEFAULT 'available',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  deleted_at BIGINT    DEFAULT 0
);

CREATE TABLE IF NOT EXISTS qr_sessions (
  id         UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
  table_id   UUID      NOT NULL REFERENCES cafe_tables(id) ON DELETE CASCADE,
  device_id  TEXT      UNIQUE,
  start_time TIMESTAMP,
  end_time   TIMESTAMP,
  is_active  BOOLEAN   DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  deleted_at BIGINT    DEFAULT 0
);

CREATE INDEX idx_cafe_tables_hall ON cafe_tables(hall_id) WHERE deleted_at = 0;
CREATE INDEX idx_cafe_tables_status ON cafe_tables(status) WHERE deleted_at = 0;
CREATE INDEX idx_qr_sessions_table ON qr_sessions(table_id) WHERE deleted_at = 0;
CREATE INDEX idx_qr_sessions_active ON qr_sessions(is_active) WHERE deleted_at = 0;

-- Create triggers to automatically update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_cafe_tables_updated_at BEFORE UPDATE ON cafe_tables
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_qr_sessions_updated_at BEFORE UPDATE ON qr_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
