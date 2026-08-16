DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'transaction_type'
      AND n.nspname = current_schema()
  ) THEN
    -- Type doesn't exist yet — create with all values
    CREATE TYPE transaction_type AS ENUM (
      'income', 'expense', 'transfer',
      'transfer_income', 'transfer_expense', 'bill_payment'
    );

  ELSIF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'transaction_type'
      AND e.enumlabel = 'transfer_income'
      AND n.nspname = current_schema()
  ) THEN
    -- Type exists but is missing new values — recreate it
    ALTER TYPE transaction_type RENAME TO transaction_type_old;
    CREATE TYPE transaction_type AS ENUM (
      'income', 'expense', 'transfer',
      'transfer_income', 'transfer_expense', 'bill_payment'
    );
    IF EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = current_schema()
        AND table_name = 'transactions'
    ) THEN
      ALTER TABLE transactions
        ALTER COLUMN type TYPE transaction_type USING type::text::transaction_type;
    END IF;
    DROP TYPE transaction_type_old;
  END IF;
  -- Else: type already has all values — nothing to do
END $$;
