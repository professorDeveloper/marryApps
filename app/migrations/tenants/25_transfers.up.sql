-- Transfer status enum
CREATE TYPE transfer_status AS ENUM ('draft', 'active', 'deleted');

-- Transfers table: moves ingredients between branches/storages
CREATE TABLE IF NOT EXISTS transfers (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    number          BIGSERIAL,
    from_branch_id  UUID NOT NULL REFERENCES branches(id) ON DELETE RESTRICT,
    to_branch_id    UUID NOT NULL REFERENCES branches(id) ON DELETE RESTRICT,
    from_storage_id UUID NOT NULL REFERENCES storages(id) ON DELETE RESTRICT,
    to_storage_id   UUID NOT NULL REFERENCES storages(id) ON DELETE RESTRICT,
    act_group_id    UUID REFERENCES deduction_act_groups(id) ON DELETE SET NULL,
    description     TEXT,
    status          transfer_status NOT NULL DEFAULT 'active',
    date            TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    total_amount    NUMERIC(18,2) NOT NULL DEFAULT 0,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    deleted_at      BIGINT NOT NULL DEFAULT 0,
    CONSTRAINT chk_transfers_different_branches CHECK (from_branch_id != to_branch_id)
);

CREATE INDEX IF NOT EXISTS idx_transfers_from_branch ON transfers(from_branch_id) WHERE deleted_at = 0;
CREATE INDEX IF NOT EXISTS idx_transfers_to_branch ON transfers(to_branch_id) WHERE deleted_at = 0;
CREATE INDEX IF NOT EXISTS idx_transfers_status ON transfers(status) WHERE deleted_at = 0;
CREATE INDEX IF NOT EXISTS idx_transfers_date ON transfers(date) WHERE deleted_at = 0;

-- Transfer items table
CREATE TABLE IF NOT EXISTS transfer_items (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transfer_id      UUID NOT NULL REFERENCES transfers(id) ON DELETE CASCADE,
    ingredient_id    UUID NOT NULL REFERENCES ingredients(id) ON DELETE RESTRICT,
    quantity         NUMERIC(18,6) NOT NULL,
    stock_qty_before NUMERIC(18,6) NOT NULL DEFAULT 0,
    stock_qty_after  NUMERIC(18,6) NOT NULL DEFAULT 0,
    price            NUMERIC(18,2) NOT NULL DEFAULT 0,
    total_amount     NUMERIC(18,2) NOT NULL DEFAULT 0,
    created_at       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    deleted_at       BIGINT NOT NULL DEFAULT 0,
    CONSTRAINT chk_transfer_items_qty_positive CHECK (quantity > 0)
);

CREATE INDEX IF NOT EXISTS idx_transfer_items_transfer ON transfer_items(transfer_id) WHERE deleted_at = 0;
CREATE INDEX IF NOT EXISTS idx_transfer_items_ingredient ON transfer_items(ingredient_id) WHERE deleted_at = 0;
