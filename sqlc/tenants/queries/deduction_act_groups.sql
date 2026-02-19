-- name: CreateDeductionActGroup :one
INSERT INTO deduction_act_groups (
  id,
  name,
  branch_id
)
VALUES ($1, $2, NULLIF(current_setting('app.branch_id', true), '')::uuid)
RETURNING id, name, branch_id, created_at, updated_at, deleted_at;

-- name: GetDeductionActGroupByID :one
SELECT id, name, branch_id, created_at, updated_at, deleted_at
FROM deduction_act_groups
WHERE id = $1
  AND branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
  AND deleted_at = 0;

-- name: GetAllDeductionActGroups :many
SELECT id, name, branch_id, created_at, updated_at, deleted_at
FROM deduction_act_groups
WHERE branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
  AND deleted_at = 0
ORDER BY created_at DESC
LIMIT $1 OFFSET $2;

-- name: UpdateDeductionActGroup :one
UPDATE deduction_act_groups
SET name = $2,
    updated_at = NOW()
WHERE id = $1
  AND branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
  AND deleted_at = 0
RETURNING id, name, branch_id, created_at, updated_at, deleted_at;

-- name: DeleteDeductionActGroup :exec
UPDATE deduction_act_groups
SET deleted_at = EXTRACT(EPOCH FROM NOW())::BIGINT,
    updated_at = NOW()
WHERE id = $1
  AND branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
  AND deleted_at = 0;

-- name: RestoreDeductionActGroup :one
UPDATE deduction_act_groups
SET deleted_at = 0,
    updated_at = NOW()
WHERE id = $1
  AND branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
RETURNING id, name, branch_id, created_at, updated_at, deleted_at;
