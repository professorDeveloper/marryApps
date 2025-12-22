-- Branches Management Queries

-- CreateBranch creates a new branch
-- name: CreateBranch :one
INSERT INTO branches (id, name, name_i18n, address, phone, created_at, updated_at, deleted_at)
VALUES ($1, $2, $3, $4, $5, NOW(), NOW(), 0)
RETURNING id, name, name_i18n, address, phone, created_at, updated_at, deleted_at;

-- GetBranchByID retrieves a branch by its ID
-- name: GetBranchByID :one
SELECT id, name, name_i18n, address, phone, created_at, updated_at, deleted_at
FROM branches
WHERE id = $1 AND deleted_at = 0;

-- GetAllBranches retrieves all branches (with pagination)
-- name: GetAllBranches :many
SELECT id, name, name_i18n, address, phone, created_at, updated_at, deleted_at
FROM branches
WHERE deleted_at = 0
ORDER BY created_at DESC
LIMIT $1 OFFSET $2;

-- UpdateBranch updates an existing branch
-- name: UpdateBranch :one
UPDATE branches
SET name = COALESCE($2, name),
    name_i18n = COALESCE($3, name_i18n),
    address = COALESCE($4, address),
    phone = COALESCE($5, phone),
    updated_at = NOW()
WHERE id = $1 AND deleted_at = 0
RETURNING id, name, name_i18n, address, phone, created_at, updated_at, deleted_at;

-- DeleteBranch performs soft delete on a branch
-- name: DeleteBranch :exec
UPDATE branches
SET deleted_at = EXTRACT(EPOCH FROM NOW())
WHERE id = $1 AND deleted_at = 0;

-- RestoreBranch restores a deleted branch
-- name: RestoreBranch :exec
UPDATE branches
SET deleted_at = 0
WHERE id = $1;

-- CountBranches counts total active branches
-- name: CountBranches :one
SELECT COUNT(*) as count
FROM branches
WHERE deleted_at = 0;

-- SearchBranches searches branches by name or phone
-- name: SearchBranches :many
SELECT id, name, name_i18n, address, phone, created_at, updated_at, deleted_at
FROM branches
WHERE deleted_at = 0
  AND (LOWER(name) LIKE LOWER('%' || $1 || '%')
       OR LOWER(address) LIKE LOWER('%' || $1 || '%')
       OR phone LIKE '%' || $1 || '%')
ORDER BY created_at DESC
LIMIT $2 OFFSET $3;


-- Translations Management Queries

-- CreateTranslation creates a new translation
-- name: CreateTranslation :one
INSERT INTO translations (id, uz, ru, en, created_at, updated_at, deleted_at)
VALUES ($1, $2, $3, $4, NOW(), NOW(), 0)
RETURNING id, uz, ru, en, created_at, updated_at, deleted_at;

-- GetTranslationByID retrieves a translation by its ID
-- name: GetTranslationByID :one
SELECT id, uz, ru, en, created_at, updated_at, deleted_at
FROM translations
WHERE id = $1 AND deleted_at = 0;

-- GetAllTranslations retrieves all translations (with pagination)
-- name: GetAllTranslations :many
SELECT id, uz, ru, en, created_at, updated_at, deleted_at
FROM translations
WHERE deleted_at = 0
ORDER BY created_at DESC
LIMIT $1 OFFSET $2;

-- UpdateTranslation updates an existing translation
-- name: UpdateTranslation :one
UPDATE translations
SET uz = COALESCE($2, uz),
    ru = COALESCE($3, ru),
    en = COALESCE($4, en),
    updated_at = NOW()
WHERE id = $1 AND deleted_at = 0
RETURNING id, uz, ru, en, created_at, updated_at, deleted_at;

-- DeleteTranslation performs soft delete on a translation
-- name: DeleteTranslation :exec
UPDATE translations
SET deleted_at = EXTRACT(EPOCH FROM NOW())
WHERE id = $1 AND deleted_at = 0;

-- RestoreTranslation restores a deleted translation
-- name: RestoreTranslation :exec
UPDATE translations
SET deleted_at = 0
WHERE id = $1;

-- CountTranslations counts total active translations
-- name: CountTranslations :one
SELECT COUNT(*) as count
FROM translations
WHERE deleted_at = 0;

-- SearchTranslations searches translations by content
-- name: SearchTranslations :many
SELECT id, uz, ru, en, created_at, updated_at, deleted_at
FROM translations
WHERE deleted_at = 0
  AND (LOWER(uz) LIKE LOWER('%' || $1 || '%')
       OR LOWER(ru) LIKE LOWER('%' || $1 || '%')
       OR LOWER(en) LIKE LOWER('%' || $1 || '%'))
ORDER BY created_at DESC
LIMIT $2 OFFSET $3;
