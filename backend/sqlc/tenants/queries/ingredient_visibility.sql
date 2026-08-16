-- EnsureIngredientVisibility upserts a visibility record (ingredient_id, branch_id) with is_visible=true
-- name: EnsureIngredientVisibility :exec
INSERT INTO ingredient_visibility (id, ingredient_id, branch_id, is_visible)
VALUES (gen_random_uuid(), $1, $2, true)
ON CONFLICT (ingredient_id, branch_id)
DO UPDATE SET is_visible = true, updated_at = NOW();

-- SetIngredientVisibility sets is_visible for a specific ingredient+branch pair
-- name: SetIngredientVisibility :exec
INSERT INTO ingredient_visibility (id, ingredient_id, branch_id, is_visible)
VALUES (gen_random_uuid(), $1, $2, $3)
ON CONFLICT (ingredient_id, branch_id)
DO UPDATE SET is_visible = EXCLUDED.is_visible, updated_at = NOW();

-- GetIngredientVisibility gets visibility status for an ingredient in a branch
-- name: GetIngredientVisibility :one
SELECT id, ingredient_id, branch_id, is_visible, created_at, updated_at
FROM ingredient_visibility
WHERE ingredient_id = $1 AND branch_id = $2;

-- EnsureIngredientVisibilityForCurrentBranch upserts visibility for current branch (from session)
-- name: EnsureIngredientVisibilityForCurrentBranch :exec
INSERT INTO ingredient_visibility (id, ingredient_id, branch_id, is_visible)
VALUES (gen_random_uuid(), $1, NULLIF(current_setting('app.branch_id', true), '')::uuid, true)
ON CONFLICT (ingredient_id, branch_id)
DO UPDATE SET is_visible = true, updated_at = NOW();
