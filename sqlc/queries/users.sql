-- name: CreateUser :one
INSERT INTO users (
    id, "fullName", "dateOfBirth", email, "phoneNumber", 
    "passwordHash", role, "isVerified", status, "group", "googleId"
)
VALUES (
    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
)
RETURNING *;

-- name: UpdateUser :one
UPDATE users SET
    "fullName" = $2,
    "dateOfBirth" = $3,
    "overAll" = $4,
    email = $5,
    "phoneNumber" = $6,
    "passwordHash" = $7,
    role = $8,
    gender = $9,
    "isVerified" = $10,
    status = $11,
    "group" = $12,
    photo = $13,
    "XP" = $14,
    balance = $15,
    "firebaseToken" = $16,
    "googleId" = $17,
    "updatedAt" = NOW()
WHERE id = $1
RETURNING *;

-- name: GetAllUsers :many

SELECT * FROM users;



-- name: GetUserByEmail :one

SELECT * FROM users WHERE email = $1;

-- name: GetUserByID :one

SELECT * FROM users WHERE id = $1;



-- name: GetUserByPhoneNumber :one

SELECT * FROM users WHERE "phoneNumber" = $1;

-- name: UpdateUserPassword :one

UPDATE users SET

"passwordHash" = $2

WHERE id = $1

RETURNING *; 