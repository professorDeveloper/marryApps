CREATE TABLE IF NOT EXISTS inventories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    number BIGSERIAL NOT NULL,
    date DATE NOT NULL,
    storage_id UUID NOT NULL REFERENCES storages(id) ON DELETE RESTRICT,
    description TEXT,
    description_i18n UUID REFERENCES translations(id) ON DELETE RESTRICT,
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('deleted', 'draft', 'active')),
    surplus_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    shortage_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    remaining_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    deleted_at BIGINT NOT NULL DEFAULT 0
);

CREATE INDEX idx_inventories_storage_id ON inventories(storage_id) WHERE deleted_at = 0;
CREATE INDEX idx_inventories_date ON inventories(date) WHERE deleted_at = 0;
CREATE INDEX idx_inventories_number ON inventories(number) WHERE deleted_at = 0;
