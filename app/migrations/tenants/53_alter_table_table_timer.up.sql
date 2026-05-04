-- UP migration
-- Add transfer event type for table timer transfer history.
-- This migration is executed per tenant schema by RunMigrationsInSchema.
-- table_time_event_type enum lives in public schema.

ALTER TYPE public.table_time_event_type ADD VALUE IF NOT EXISTS 'transfer';

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