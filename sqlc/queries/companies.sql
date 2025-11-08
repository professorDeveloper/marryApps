-- name: CreateCompany :one
INSERT INTO
    companies
    (name)
VALUES
    ($1)
RETURNING *;