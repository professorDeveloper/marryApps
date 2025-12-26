-- name: CreateBrand :one
INSERT INTO brands (
  name
) VALUES (
  $1
)
RETURNING id, name, brand_db_id, created_at, updated_at;

-- name: GetBrandByID :one
SELECT id, name, brand_db_id, created_at, updated_at
FROM brands
WHERE id = $1;

-- name: ListBrands :many
SELECT id, name, brand_db_id, created_at, updated_at
FROM brands
ORDER BY id DESC
LIMIT $1 OFFSET $2;
