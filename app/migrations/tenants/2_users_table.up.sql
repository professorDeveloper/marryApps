CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS shifts (
  id           UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT      NOT NULL,
  role         TEXT CHECK (role IN ('admin', 'user', 'cashier', 'superadmin', 'kitchen', 'waiter', 'manager')),
  working_days TEXT,
  open_time    BIGINT,
  close_time   BIGINT,
  branch_id    UUID REFERENCES branches(id) on DELETE CASCADE,
  created_at   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  deleted_at   BIGINT    DEFAULT 0
);

CREATE TABLE IF NOT EXISTS users (
  id            UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name     TEXT,
  username      TEXT      UNIQUE,
  role          TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user', 'cashier', 'superadmin', 'kitchen', 'waiter', 'manager')),
  email         TEXT      UNIQUE,
  shift_id      UUID      REFERENCES shifts(id) ON DELETE CASCADE,
  pincode       VARCHAR(10) UNIQUE,
  hash_password TEXT,
  brand_id      UUID,
  phone_number  VARCHAR(20) UNIQUE,
  fcm_token     TEXT,
  created_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  deleted_at    BIGINT    DEFAULT 0,

  CONSTRAINT check_email_format CHECK (email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$'),
  CONSTRAINT check_phone_format CHECK (phone_number ~ '^\+?[0-9\-\s\(\)]{7,}$' OR phone_number IS NULL)
);

CREATE TABLE IF NOT EXISTS attendances (
  id            UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  open_date     DATE,
  close_date    DATE,
  difference    INTEGER,
  working_hours INTEGER,
  created_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  deleted_at    BIGINT    DEFAULT 0
);

CREATE INDEX idx_users_username ON users(username) WHERE deleted_at = 0;
CREATE INDEX idx_users_email ON users(email) WHERE deleted_at = 0;
CREATE INDEX idx_users_shift ON users(shift_id) WHERE deleted_at = 0;
CREATE INDEX idx_attendances_user ON attendances(user_id) WHERE deleted_at = 0;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


ALTER TABLE shifts
ADD CONSTRAINT fk_shifts_branch_id
FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE;

CREATE INDEX idx_shifts_branch ON shifts(branch_id) WHERE deleted_at = 0;
CREATE INDEX idx_users_fcm_token ON users(fcm_token) WHERE fcm_token IS NOT NULL AND deleted_at = 0;

