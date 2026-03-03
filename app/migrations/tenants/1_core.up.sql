CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Shared helper: auto-update updated_at on every UPDATE
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==================== TRANSLATIONS ====================
CREATE TABLE IF NOT EXISTS translations (
  id         UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
  uz         TEXT,
  ru         TEXT,
  en         TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at BIGINT      DEFAULT 0
);

-- ==================== BRANCHES ====================
CREATE TABLE IF NOT EXISTS branches (
  id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name                    TEXT        NOT NULL,
  name_i18n               UUID        REFERENCES translations(id) ON DELETE CASCADE,
  address                 TEXT,
  phone                   VARCHAR(20),
  default_service_percent NUMERIC(6,2) NOT NULL DEFAULT 20,
  created_at              TIMESTAMPTZ DEFAULT NOW(),
  updated_at              TIMESTAMPTZ DEFAULT NOW(),
  deleted_at              BIGINT      DEFAULT 0
);

CREATE INDEX idx_branches_deleted ON branches(deleted_at);

-- ==================== SHIFTS ====================
CREATE TABLE IF NOT EXISTS shifts (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT        NOT NULL,
  role         TEXT        CHECK (role IN ('admin', 'user', 'superadmin', 'kitchen', 'waiter', 'manager')),
  working_days TEXT,
  open_time    BIGINT,
  close_time   BIGINT,
  branch_id    UUID        REFERENCES branches(id) ON DELETE CASCADE,
  is_active    BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW(),
  deleted_at   BIGINT      DEFAULT 0
);

CREATE INDEX idx_shifts_branch ON shifts(branch_id) WHERE deleted_at = 0;

-- ==================== USERS ====================
CREATE TABLE IF NOT EXISTS users (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name     TEXT,
  username      TEXT,
  role          TEXT        NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user', 'cashier', 'superadmin', 'kitchen', 'waiter', 'manager')),
  email         TEXT,
  shift_id      UUID        REFERENCES shifts(id) ON DELETE CASCADE,
  pincode       VARCHAR(10),
  hash_password TEXT,
  brand_id      UUID,
  branch_id     UUID        REFERENCES branches(id) ON DELETE SET NULL,
  phone_number  VARCHAR(20),
  fcm_token     TEXT,
  is_active     BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW(),
  deleted_at    BIGINT      DEFAULT 0,
  CONSTRAINT check_email_format CHECK (email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$' OR email IS NULL),
  CONSTRAINT check_phone_format CHECK (phone_number ~ '^\+?[0-9\-\s\(\)]{7,}$' OR phone_number IS NULL)
);

-- Per-brand unique constraints (not global)
CREATE UNIQUE INDEX idx_users_brand_username  ON users(brand_id, username)     WHERE deleted_at = 0;
CREATE UNIQUE INDEX idx_users_brand_email     ON users(brand_id, email)        WHERE deleted_at = 0 AND email IS NOT NULL;
CREATE UNIQUE INDEX idx_users_brand_phone     ON users(brand_id, phone_number) WHERE deleted_at = 0 AND phone_number IS NOT NULL;
CREATE UNIQUE INDEX idx_users_brand_pincode   ON users(brand_id, pincode)      WHERE deleted_at = 0 AND pincode IS NOT NULL;

CREATE INDEX idx_users_shift     ON users(shift_id)   WHERE deleted_at = 0;
CREATE INDEX idx_users_fcm_token ON users(fcm_token)  WHERE fcm_token IS NOT NULL AND deleted_at = 0;
CREATE INDEX idx_users_branch_id ON users(branch_id)  WHERE deleted_at = 0;

CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==================== ATTENDANCES ====================
CREATE TABLE IF NOT EXISTS attendances (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  branch_id     UUID        REFERENCES branches(id) ON DELETE SET NULL,
  open_date     DATE,
  close_date    DATE,
  difference    INTEGER,
  working_hours INTEGER,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW(),
  deleted_at    BIGINT      DEFAULT 0
);

CREATE INDEX idx_attendances_user      ON attendances(user_id)   WHERE deleted_at = 0;
CREATE INDEX idx_attendances_branch_id ON attendances(branch_id) WHERE deleted_at = 0;

-- ==================== PAYMENTS ====================
CREATE TABLE IF NOT EXISTS price_for_plans (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT        NOT NULL,
  amount     INTEGER     NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_payments (
  id                       UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                  UUID        NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  price_for_plan_id        UUID        NOT NULL REFERENCES price_for_plans(id) ON DELETE RESTRICT,
  branch_id                UUID        REFERENCES branches(id) ON DELETE SET NULL,
  is_paid                  BOOLEAN     DEFAULT FALSE,
  click_trans_id           INTEGER,
  click_pay_doc_id         INTEGER,
  error                    INTEGER,
  error_note               TEXT,
  status                   TEXT,
  merchant_prepare_id      INTEGER,
  payme_id                 TEXT,
  provider                 TEXT        NOT NULL CHECK (provider IN ('click', 'payme', 'cash')),
  order_number             INTEGER     NOT NULL,
  paid_at                  BIGINT,
  time_payme_trans_created BIGINT,
  reason                   BIGINT,
  amount                   INTEGER     NOT NULL,
  cancel_time              BIGINT,
  created_at               TIMESTAMPTZ DEFAULT NOW(),
  updated_at               TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_payments_user_id      ON user_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_user_payments_plan_id      ON user_payments(price_for_plan_id);
CREATE INDEX IF NOT EXISTS idx_user_payments_branch_id    ON user_payments(branch_id);
