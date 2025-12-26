-- name: CreateDatabaseCredential :one
INSERT INTO database_credentials (
  brand_id,
  host,
  port,
  username,
  password_hash,
  db_name,
  s3_bucket_name
) VALUES (
  $1, $2, $3, $4, $5, $6, $7
)
RETURNING id, brand_id, host, port, username, password_hash, db_name, s3_bucket_name, created_at, updated_at;

-- name: GetDatabaseCredentialByBrandID :one
SELECT id, brand_id, host, port, username, password_hash, db_name, s3_bucket_name, created_at, updated_at
FROM database_credentials
WHERE brand_id = $1;

-- name: ListDatabaseCredentials :many
SELECT id, brand_id, host, port, username, password_hash, db_name, s3_bucket_name, created_at, updated_at
FROM database_credentials
ORDER BY id DESC
LIMIT $1 OFFSET $2;
