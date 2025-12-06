-- name: GetAllUsers :many
SELECT * FROM users;

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
    "firebaseToken",
    "googleId"
)
VALUES (
    $1, $2, $3, $4, $5,
    $6, $7, $8, $9, $10,
    $11, $12, $13, $14,
    $15, $16, $17, $18,
    $19
)
RETURNING *;

-- name: GetUserByID :one
SELECT * FROM users WHERE id = $1;

-- name: GetUserByPhoneNumber :one
SELECT * FROM users WHERE "phoneNumber" = $1;

-- name: UpdateUser :one
UPDATE users SET
    "fullName" = $2,
    "dateOfBirth" = $3,
    "overAll" = $4,
    level = $5,
    email = $6,
    "phoneNumber" = $7,
    "passwordHash" = $8,
    role = $9,
    gender = $10,
    "isAgreedForUserContract" = $11,
    "isVerified" = $12,
    status = $13,
    "group" = $14,
    photo = $15,
    "XP" = $16,
    balance = $17,
    "firebaseToken" = $18,
    "googleId" = $19
WHERE id = $1
RETURNING *;