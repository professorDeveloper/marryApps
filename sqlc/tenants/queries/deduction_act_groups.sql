-- name: CreateDeductionActGroup :one
INSERT INTO deduction_act_groups (
  id,
  name
)
VALUES ($1, $2)
RETURNING id, name, created_at, updated_at, deleted_at;

-- name: GetDeductionActGroupByID :one
SELECT id, name, created_at, updated_at, deleted_at
FROM deduction_act_groups
WHERE id = $1 AND deleted_at = 0;

-- name: GetAllDeductionActGroups :many
SELECT id, name, created_at, updated_at, deleted_at
FROM deduction_act_groups
WHERE deleted_at = 0
ORDER BY created_at DESC
LIMIT $1 OFFSET $2;

-- name: UpdateDeductionActGroup :one
UPDATE deduction_act_groups
SET name = $2,
    updated_at = NOW()
WHERE id = $1 AND deleted_at = 0
RETURNING id, name, created_at, updated_at, deleted_at;

-- name: DeleteDeductionActGroup :exec
UPDATE deduction_act_groups
SET deleted_at = EXTRACT(EPOCH FROM NOW())::BIGINT,
    updated_at = NOW()
WHERE id = $1 AND deleted_at = 0;

-- name: RestoreDeductionActGroup :one
UPDATE deduction_act_groups
SET deleted_at = 0,
    updated_at = NOW()
WHERE id = $1
RETURNING id, name, created_at, updated_at, deleted_at;
