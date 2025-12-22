-- name: CreateUserPayment :one
INSERT INTO user_payments (
    id,
    user_id,
    price_for_plan_id,
    provider,
    order_number,
    amount
) VALUES (
    $1, $2, $3, $4, $5, $6
) RETURNING *;

-- name: GetUserPayment :one
SELECT * FROM user_payments WHERE id = $1;

-- name: GetUserPayments :many
SELECT * FROM user_payments;

-- name: UpdateUserPayment :one
UPDATE user_payments SET
    user_id = $2,
    price_for_plan_id = $3,
    is_paid = $4,
    click_trans_id = $5,
    click_pay_doc_id = $6,
    error = $7,
    error_note = $8,
    status = $9,
    merchant_prepare_id = $10,
    payme_id = $11,
    provider = $12,
    order_number = $13,
    paid_at = $14,
    time_payme_trans_created = $15,
    reason = $16,
    amount = $17,
    cancel_time = $18,
    updated_at = CURRENT_TIMESTAMP
WHERE id = $1
RETURNING *;

-- name: DeleteUserPayment :exec
DELETE FROM user_payments WHERE id = $1;

-- name: GetPriceForPlan :one
SELECT * FROM price_for_plans WHERE id = $1;

-- name: CreatePriceForPlan :one
INSERT INTO price_for_plans (
    id, name, amount
) VALUES (
    $1, $2, $3
) RETURNING *;

-- name: GetPriceForPlans :many
SELECT * FROM price_for_plans;

-- name: UpdatePriceForPlan :one
UPDATE price_for_plans SET
    name = $2,
    amount = $3,
    updated_at = CURRENT_TIMESTAMP
WHERE id = $1
RETURNING *;

-- name: DeletePriceForPlan :exec
DELETE FROM price_for_plans WHERE id = $1;
