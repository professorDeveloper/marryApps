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