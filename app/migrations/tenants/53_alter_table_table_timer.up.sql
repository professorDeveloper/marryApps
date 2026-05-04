DO $$
DECLARE
    event_type_schema text;
BEGIN
    SELECT c.udt_schema
    INTO event_type_schema
    FROM information_schema.columns c
    WHERE c.table_name = 'table_time_events'
      AND c.column_name = 'event_type'
      AND c.table_schema = current_schema()
    LIMIT 1;

    IF event_type_schema IS NOT NULL THEN
        IF EXISTS (
            SELECT 1
            FROM pg_type t
            JOIN pg_namespace n ON n.oid = t.typnamespace
            WHERE t.typname = 'table_time_event_type'
              AND n.nspname = event_type_schema
        ) THEN
            EXECUTE format(
                'ALTER TYPE %I.table_time_event_type ADD VALUE IF NOT EXISTS ''transfer''',
                event_type_schema
            );
        END IF;
    END IF;
END $$;

ALTER TABLE table_time_events
DROP CONSTRAINT IF EXISTS table_time_events_event_type_check;

ALTER TABLE table_time_events
ADD CONSTRAINT table_time_events_event_type_check
CHECK (
    event_type::text IN (
        'started',
        'paused',
        'resumed',
        'closed',
        'transfer'
    )
);