-- name: CreateBrand :one
INSERT INTO brands (
  name,
  brand_id
) VALUES (
  $1,
  $2
)
RETURNING id, name, brand_id, created_at, updated_at;

-- name: GetBrandByID :one
SELECT id, name, brand_id, created_at, updated_at
FROM brands
WHERE id = $1;

-- name: GetBrandByBrandID :one
SELECT id, name, brand_id, created_at, updated_at
FROM brands
WHERE brand_id = $1;

-- name: ListBrands :many
SELECT id, name, brand_id, created_at, updated_at
FROM brands
ORDER BY id DESC
LIMIT $1 OFFSET $2;

-- name: DeleteBrand :one
DELETE FROM brands WHERE id = $1 RETURNING id, name, brand_id, created_at, updated_at;
