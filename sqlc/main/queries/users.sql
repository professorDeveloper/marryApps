-- name: GetMainUserByUsername :one
SELECT id, username, password, email, role, created_at, updated_at
FROM users
WHERE username = $1;

-- name: GetMainUserByID :one
SELECT id, username, password, email, role, created_at, updated_at
FROM users
WHERE id = $1;