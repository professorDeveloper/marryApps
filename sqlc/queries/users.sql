-- name: GetAllUsers :many
SELECT * FROM users;

-- name: GetUserByID :one
SELECT * FROM users WHERE id = $1;

-- name: GetUserByEmail :one
SELECT * FROM users WHERE email = $1;

-- name: CreateUser :one
INSERT INTO users (
    id,
    "fullName",
    "dateOfBirth",
    "overAll",
    level,
    email,
    "phoneNumber",
    "passwordHash",
    role,
    gender,
    "isAgreedForUserContract",
    "isVerified",
    status,
    "group",
    photo,
    "XP",
    balance,
    "firebaseToken"
)
VALUES (
    $1, $2, $3, $4, $5,
    $6, $7, $8, $9, $10,
    $11, $12, $13, $14,
    $15, $16, $17, $18
)
RETURNING *;

-- name: GetUserByID :one
SELECT * FROM users WHERE id = $1;