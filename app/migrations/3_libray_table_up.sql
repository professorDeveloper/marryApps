-- Migration: Create library_items table
CREATE TABLE IF NOT EXISTS library_items (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    item_type VARCHAR(50) NOT NULL CHECK (item_type IN ('book', 'audio', 'video')),
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITHOUT TIME ZONE
);

CREATE INDEX idx_library_items_type ON library_items(item_type);
CREATE INDEX idx_library_items_title ON library_items(title);


-- Migration: Create categories table
CREATE TABLE IF NOT EXISTS categories (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Migration: Create library_item_categories junction table
CREATE TABLE IF NOT EXISTS library_item_categories (
    library_item_id BIGINT NOT NULL REFERENCES library_items(id) ON DELETE CASCADE,
    category_id BIGINT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (library_item_id, category_id)
);

CREATE INDEX idx_library_item_categories_category_id ON library_item_categories(category_id);

