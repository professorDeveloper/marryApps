-- name: CreatePayment :one
INSERT INTO "studentPayments" (
    "id", "student", "priceForLevel", "isPaid", "clickTransId", "clickPayDocId",
    "error", "errorNote", "status", "merchantPrepareId", "paymeId", "provider",
    "orderNumber", "paidAt", "timePaymeTransCreated", "reason", "amount",
    "cancelTime", "created", "updated"
) VALUES (
    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
    $11, $12, $13, $14, $15, $16, $17, $18, $19, $20
) RETURNING *;

-- name: GetPayment :one
SELECT * FROM "studentPayments" WHERE "id" = $1;

-- name: GetPayments :many
SELECT * FROM "studentPayments";

-- name: UpdatePayment :one
UPDATE "studentPayments" SET
    "student" = $2,
    "priceForLevel" = $3,
    "isPaid" = $4,
    "clickTransId" = $5,
    "clickPayDocId" = $6,
    "error" = $7,
    "errorNote" = $8,
    "status" = $9,
    "merchantPrepareId" = $10,
    "paymeId" = $11,
    "provider" = $12,
    "orderNumber" = $13,
    "paidAt" = $14,
    "timePaymeTransCreated" = $15,
    "reason" = $16,
    "amount" = $17,
    "cancelTime" = $18,
    "created" = $19,
    "updated" = $20
WHERE "id" = $1
RETURNING *;

-- name: DeletePayment :exec
DELETE FROM "studentPayments" WHERE "id" = $1;

-- name: GetPaymentPriceForLevel :one
SELECT * FROM "priceForLevels" WHERE "id" = $1;
-- name: GetPaymentPriceForLevelByLevel :one
SELECT * FROM "priceForLevels" WHERE "level" = $1;

-- name: CreatePaymentPriceForLevel :one
INSERT INTO "priceForLevels" (
    "id", "level", "amount", "created", "updated"
) VALUES (
    $1, $2, $3, $4, $5
) RETURNING *;

-- name: GetPaymentPriceForLevels :many
SELECT * FROM "priceForLevels";

-- name: UpdatePaymentPriceForLevel :one
UPDATE "priceForLevels" SET
    "level" = $2,
    "amount" = $3,
    "created" = $4,
    "updated" = $5
WHERE "id" = $1
RETURNING *;

-- name: DeletePaymentPriceForLevel :exec
DELETE FROM "priceForLevels" WHERE "id" = $1;
