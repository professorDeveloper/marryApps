-- name: GetAllUsers :many
SELECT * FROM users;

-- name: GetUserByUsername :one
SELECT * FROM users WHERE username = $1;

-- name: GetUserByGUID :one
SELECT * FROM users WHERE guid = $1;

-- name: CreateUser :one
INSERT INTO
    users
    (username, password_hash, company_id, role, type)
VALUES
    ($1, $2, $3, $4, $5)
RETURNING *;

