-- DOWN migration
-- Roll back support for transfer events in check constraint.
-- Existing transfer events are mapped to closed to preserve audit rows.
-- Note: PostgreSQL cannot drop enum values directly, so public.table_time_event_type will still contain 'transfer'.

UPDATE table_time_events
SET event_type = 'closed'
WHERE event_type::text = 'transfer';

ALTER TABLE table_time_events
DROP CONSTRAINT IF EXISTS table_time_events_event_type_check;

ALTER TABLE table_time_events
ADD CONSTRAINT table_time_events_event_type_check
CHECK (
    event_type::text IN (
        'started',
        'paused',
        'resumed',
        'closed'
    )
);