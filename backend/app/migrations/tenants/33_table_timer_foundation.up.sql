ALTER TABLE cafe_tables
ADD COLUMN IF NOT EXISTS table_type TEXT NOT NULL DEFAULT 'simple';

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'chk_cafe_tables_table_type'
    ) THEN
        ALTER TABLE cafe_tables
        ADD CONSTRAINT chk_cafe_tables_table_type
        CHECK (table_type IN ('simple', 'time_based'));
    END IF;
END
$$;

CREATE INDEX IF NOT EXISTS idx_cafe_tables_table_type
ON cafe_tables(table_type)
WHERE deleted_at = 0;

CREATE TABLE IF NOT EXISTS table_time_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    table_id UUID NOT NULL REFERENCES cafe_tables(id) ON DELETE CASCADE,

    state TEXT NOT NULL DEFAULT 'running'
        CHECK (state IN ('running', 'paused', 'closed')),

    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    active_started_at TIMESTAMPTZ,
    accumulated_active_sec BIGINT NOT NULL DEFAULT 0 CHECK (accumulated_active_sec >= 0),

    ended_at TIMESTAMPTZ,
    final_amount NUMERIC(15,2),

    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES users(id) ON DELETE SET NULL,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at BIGINT DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_table_time_sessions_order
ON table_time_sessions(order_id)
WHERE deleted_at = 0;

CREATE INDEX IF NOT EXISTS idx_table_time_sessions_table
ON table_time_sessions(table_id)
WHERE deleted_at = 0;

CREATE INDEX IF NOT EXISTS idx_table_time_sessions_state
ON table_time_sessions(state)
WHERE deleted_at = 0;

CREATE UNIQUE INDEX IF NOT EXISTS uq_table_time_sessions_open_order
ON table_time_sessions(order_id)
WHERE deleted_at = 0 AND ended_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_table_time_sessions_open_table
ON table_time_sessions(table_id)
WHERE deleted_at = 0 AND ended_at IS NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'update_table_time_sessions_updated_at'
    ) THEN
        CREATE TRIGGER update_table_time_sessions_updated_at
        BEFORE UPDATE ON table_time_sessions
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END
$$;

CREATE TABLE IF NOT EXISTS table_time_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    session_id UUID NOT NULL REFERENCES table_time_sessions(id) ON DELETE CASCADE,
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    table_id UUID NOT NULL REFERENCES cafe_tables(id) ON DELETE CASCADE,

    event_type TEXT NOT NULL
        CHECK (event_type IN ('started', 'paused', 'resumed', 'closed')),

    actor_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    actor_role TEXT,
    comment TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at BIGINT DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_table_time_events_session
ON table_time_events(session_id)
WHERE deleted_at = 0;

CREATE INDEX IF NOT EXISTS idx_table_time_events_order
ON table_time_events(order_id)
WHERE deleted_at = 0;

CREATE INDEX IF NOT EXISTS idx_table_time_events_table
ON table_time_events(table_id)
WHERE deleted_at = 0;

CREATE INDEX IF NOT EXISTS idx_table_time_events_type
ON table_time_events(event_type)
WHERE deleted_at = 0;