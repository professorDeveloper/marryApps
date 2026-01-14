-- Create calculation table for goods and compounds ingredient composition
CREATE TABLE IF NOT EXISTS calculation (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    good_id UUID REFERENCES goods(id) ON DELETE CASCADE,
    compound_id UUID REFERENCES compounds(id) ON DELETE CASCADE,
    ingredient_id UUID REFERENCES ingredients(id) ON DELETE RESTRICT,
    component_compound_id UUID REFERENCES compounds(id) ON DELETE RESTRICT,
    quantity NUMERIC NOT NULL,
    measurement_unit VARCHAR(50) NOT NULL,
    price_per_unit NUMERIC NOT NULL,
    total_cost NUMERIC NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at BIGINT DEFAULT 0,
    -- Constraint: at least one of good_id or compound_id must be set
    CHECK (
        (good_id IS NOT NULL AND compound_id IS NULL) OR 
        (good_id IS NULL AND compound_id IS NOT NULL)
    )
);

-- Create index for common queries
CREATE INDEX idx_calculation_good_id ON calculation(good_id) WHERE deleted_at = 0;
CREATE INDEX idx_calculation_compound_id ON calculation(compound_id) WHERE deleted_at = 0;
CREATE INDEX idx_calculation_ingredient_id ON calculation(ingredient_id) WHERE deleted_at = 0;
CREATE INDEX idx_calculation_deleted_at ON calculation(deleted_at);
