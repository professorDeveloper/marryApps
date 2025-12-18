-- name: CreateUser :one
INSERT INTO users (
    id, "fullName", "dateOfBirth", email, "phoneNumber", 
    "passwordHash", role, "isVerified", status,"googleId"
)
VALUES (
    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10
)
RETURNING *;

-- name: UpdateUser :one
UPDATE users SET
    "fullName" = COALESCE($2, "fullName"),
    "dateOfBirth" = COALESCE($3, "dateOfBirth"),
    "overAll" = COALESCE($4, "overAll"),
    email = COALESCE($5, email),
    "phoneNumber" = COALESCE($6, "phoneNumber"),
    "passwordHash" = COALESCE($7, "passwordHash"),
    role = COALESCE($8, role),
    gender = COALESCE($9, gender),
    "isVerified" = COALESCE($10, "isVerified"),
    status = COALESCE($11, status),
    "group" = COALESCE($12, "group"),
    photo = COALESCE($13, photo),
    "XP" = COALESCE($14, "XP"),
    balance = COALESCE($15, balance),
    "firebaseToken" = COALESCE($16, "firebaseToken"),
    "googleId" = COALESCE($17, "googleId")
WHERE id = $1
RETURNING *;

-- name: GetAllUsers :many
SELECT * FROM users 
WHERE "deletedAt" IS NULL
ORDER BY "createdAt" DESC;

-- name: GetAllUsersPaginated :many
SELECT * FROM users 
WHERE "deletedAt" IS NULL
ORDER BY "createdAt" DESC
LIMIT $1 OFFSET $2;

-- name: GetUserByEmail :one
SELECT * FROM users 
WHERE email = $1 AND "deletedAt" IS NULL;

-- name: GetUserByID :one
SELECT * FROM users 
WHERE id = $1 AND "deletedAt" IS NULL;

-- name: GetUserByPhoneNumber :one
SELECT * FROM users 
WHERE "phoneNumber" = $1 AND "deletedAt" IS NULL;

-- name: GetUsersByStatus :many
SELECT * FROM users 
WHERE status = $1 AND "deletedAt" IS NULL
ORDER BY "createdAt" DESC;

-- name: GetUsersByRole :many
SELECT * FROM users 
WHERE role = $1 AND "deletedAt" IS NULL
ORDER BY "createdAt" DESC;

-- name: GetUsersByGroup :many
SELECT * FROM users 
WHERE "group" = $1 AND "deletedAt" IS NULL
ORDER BY "createdAt" DESC;

-- name: UpdateUserPassword :one
UPDATE users SET
    "passwordHash" = $2
WHERE id = $1 AND "deletedAt" IS NULL
RETURNING *;

-- name: SoftDeleteUser :one
UPDATE users SET
    "deletedAt" = CURRENT_TIMESTAMP
WHERE id = $1 AND "deletedAt" IS NULL
RETURNING *;




