CREATE TABLE IF NOT EXISTS group_transactions (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name       TEXT NOT NULL,
    branch_id  UUID REFERENCES branches(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at BIGINT DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_group_transactions_branch_id ON group_transactions(branch_id) WHERE deleted_at = 0;
CREATE INDEX IF NOT EXISTS idx_group_transactions_deleted_at ON group_transactions(deleted_at);
