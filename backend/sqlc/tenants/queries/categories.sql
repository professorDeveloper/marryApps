-- name: CreateCategory :one
INSERT INTO categories (id, name, picture_url, name_i18n, department_id, parent, color_code)
SELECT $1, $2, $3, $4, $5, $6, $7
WHERE $5 IS NOT NULL AND EXISTS (
  SELECT 1 FROM departments dep
  JOIN storages s ON s.id = dep.storage_id
  WHERE dep.id = $5
    AND s.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
)
RETURNING id, name, picture_url, color_code, name_i18n, department_id,
  (SELECT dep.storage_id FROM departments dep WHERE dep.id = department_id AND dep.deleted_at = 0) as storage_id,
  parent, created_at, updated_at, deleted_at;

-- name: GetCategoryByID :one
SELECT c.id, c.name, c.picture_url, c.color_code, c.name_i18n, c.department_id,
       d.storage_id, c.parent, c.created_at, c.updated_at, c.deleted_at
FROM categories c
LEFT JOIN departments d ON c.department_id = d.id AND d.deleted_at = 0
WHERE c.id = $1 AND c.deleted_at = 0
  AND EXISTS (
    SELECT 1 FROM storages s
    WHERE s.id = d.storage_id
      AND s.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
  );

-- name: GetAllCategories :many
SELECT
    c.id,
    c.name,
    c.picture_url,
    c.color_code,
    c.name_i18n,
    c.department_id,
    d.storage_id,
    c.parent,
    c.created_at,
    c.updated_at,
    c.deleted_at
FROM categories c
LEFT JOIN departments d
    ON c.department_id = d.id
   AND d.deleted_at = 0
LEFT JOIN translations t
    ON c.name_i18n = t.id
   AND t.deleted_at = 0
WHERE c.deleted_at = 0
  AND (
        sqlc.arg('search')::text = ''
        OR COALESCE(c.name, '') ILIKE '%' || sqlc.arg('search')::text || '%'
        OR COALESCE(t.uz, '') ILIKE '%' || sqlc.arg('search')::text || '%'
        OR COALESCE(t.ru, '') ILIKE '%' || sqlc.arg('search')::text || '%'
        OR COALESCE(t.en, '') ILIKE '%' || sqlc.arg('search')::text || '%'
      )
  AND (
        sqlc.narg('department_id')::uuid IS NULL
        OR c.department_id = sqlc.narg('department_id')::uuid
      )
  AND (
        sqlc.narg('storage_id')::uuid IS NULL
        OR d.storage_id = sqlc.narg('storage_id')::uuid
      )
  AND EXISTS (
        SELECT 1
        FROM storages s
        WHERE s.id = d.storage_id
          AND s.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
      )
ORDER BY
    CASE
        WHEN sqlc.arg('sort_by')::text = 'name' AND sqlc.arg('sort_order')::text = 'asc'
        THEN c.name
    END ASC,
    CASE
        WHEN sqlc.arg('sort_by')::text = 'name' AND sqlc.arg('sort_order')::text = 'desc'
        THEN c.name
    END DESC,
    CASE
        WHEN sqlc.arg('sort_by')::text = 'created_at' AND sqlc.arg('sort_order')::text = 'asc'
        THEN c.created_at
    END ASC,
    CASE
        WHEN sqlc.arg('sort_by')::text = 'created_at' AND sqlc.arg('sort_order')::text = 'desc'
        THEN c.created_at
    END DESC,
    c.created_at DESC
LIMIT sqlc.arg('limit')::int
OFFSET sqlc.arg('offset')::int;

-- name: GetCategoriesByDepartmentID :many
SELECT c.id, c.name, c.picture_url, c.color_code, c.name_i18n, c.department_id,
       d.storage_id, c.parent, c.created_at, c.updated_at, c.deleted_at
FROM categories c
LEFT JOIN departments d ON c.department_id = d.id AND d.deleted_at = 0
WHERE c.department_id = $1 AND c.deleted_at = 0
  AND EXISTS (
    SELECT 1 FROM storages s
    WHERE s.id = d.storage_id
      AND s.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
  )
ORDER BY c.created_at DESC
LIMIT $2 OFFSET $3;

-- name: GetCategoriesByStorageID :many
SELECT c.id, c.name, c.picture_url, c.color_code, c.name_i18n, c.department_id,
       d.storage_id, c.parent, c.created_at, c.updated_at, c.deleted_at
FROM categories c
LEFT JOIN departments d ON c.department_id = d.id AND d.deleted_at = 0
WHERE c.deleted_at = 0
  AND d.storage_id = $1
  AND EXISTS (
    SELECT 1 FROM storages s
    WHERE s.id = $1
      AND s.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
  )
ORDER BY c.created_at DESC
LIMIT $2 OFFSET $3;

-- name: GetCategoriesByParentID :many
SELECT c.id, c.name, c.picture_url, c.color_code, c.name_i18n, c.department_id,
       d.storage_id, c.parent, c.created_at, c.updated_at, c.deleted_at
FROM categories c
LEFT JOIN departments d ON c.department_id = d.id AND d.deleted_at = 0
WHERE c.parent = $1 AND c.deleted_at = 0
  AND EXISTS (
    SELECT 1 FROM storages s
    WHERE s.id = d.storage_id
      AND s.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
  )
ORDER BY c.created_at DESC
LIMIT $2 OFFSET $3;

-- name: GetRootCategories :many
SELECT c.id, c.name, c.picture_url, c.color_code, c.name_i18n, c.department_id,
       d.storage_id, c.parent, c.created_at, c.updated_at, c.deleted_at
FROM categories c
LEFT JOIN departments d ON c.department_id = d.id AND d.deleted_at = 0
WHERE c.parent IS NULL AND c.deleted_at = 0
  AND EXISTS (
    SELECT 1 FROM storages s
    WHERE s.id = d.storage_id
      AND s.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
  )
ORDER BY c.created_at DESC
LIMIT $1 OFFSET $2;

-- name: UpdateCategory :one
UPDATE categories
SET name          = COALESCE($2, name),
    picture_url   = COALESCE($3, picture_url),
    name_i18n     = COALESCE($4, name_i18n),
    department_id = COALESCE($5, department_id),
    parent        = COALESCE($6, parent),
    color_code    = COALESCE($7, color_code),
    updated_at    = NOW()
WHERE categories.id = $1 AND deleted_at = 0
  AND EXISTS (
    SELECT 1 FROM departments d
    JOIN storages s ON s.id = d.storage_id
    WHERE d.id = categories.department_id
      AND s.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
  )
  AND ($5 IS NULL OR EXISTS (
    SELECT 1 FROM departments d2
    JOIN storages s2 ON s2.id = d2.storage_id
    WHERE d2.id = $5
      AND s2.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
  ))
RETURNING id, name, picture_url, color_code, name_i18n, department_id,
  (SELECT dep.storage_id FROM departments dep WHERE dep.id = department_id AND dep.deleted_at = 0) as storage_id,
  parent, created_at, updated_at, deleted_at;

-- name: DeleteCategory :exec
UPDATE categories
SET deleted_at = EXTRACT(EPOCH FROM NOW())::BIGINT
WHERE categories.id = $1 AND deleted_at = 0
  AND EXISTS (
    SELECT 1 FROM departments d
    JOIN storages s ON s.id = d.storage_id
    WHERE d.id = categories.department_id
      AND s.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
  );

-- name: RestoreCategory :exec
UPDATE categories
SET deleted_at = 0
WHERE categories.id = $1 AND deleted_at != 0
  AND EXISTS (
    SELECT 1 FROM departments d
    JOIN storages s ON s.id = d.storage_id
    WHERE d.id = categories.department_id
      AND s.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
  );

-- name: CountCategories :one
SELECT COUNT(*)
FROM categories c
LEFT JOIN departments d
    ON c.department_id = d.id
   AND d.deleted_at = 0
LEFT JOIN translations t
    ON c.name_i18n = t.id
   AND t.deleted_at = 0
WHERE c.deleted_at = 0
  AND (
        sqlc.arg('search')::text = ''
        OR COALESCE(c.name, '') ILIKE '%' || sqlc.arg('search')::text || '%'
        OR COALESCE(t.uz, '') ILIKE '%' || sqlc.arg('search')::text || '%'
        OR COALESCE(t.ru, '') ILIKE '%' || sqlc.arg('search')::text || '%'
        OR COALESCE(t.en, '') ILIKE '%' || sqlc.arg('search')::text || '%'
      )
  AND (
        sqlc.narg('department_id')::uuid IS NULL
        OR c.department_id = sqlc.narg('department_id')::uuid
      )
  AND (
        sqlc.narg('storage_id')::uuid IS NULL
        OR d.storage_id = sqlc.narg('storage_id')::uuid
      )
  AND EXISTS (
        SELECT 1
        FROM storages s
        WHERE s.id = d.storage_id
          AND s.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
      );

-- name: CountCategoriesByDepartment :one
SELECT COUNT(*) FROM categories c
LEFT JOIN departments d ON c.department_id = d.id AND d.deleted_at = 0
WHERE c.department_id = $1 AND c.deleted_at = 0
  AND EXISTS (
    SELECT 1 FROM storages s
    WHERE s.id = d.storage_id
      AND s.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
  );

-- name: CountCategoriesByParent :one
SELECT COUNT(*) FROM categories c
LEFT JOIN departments d ON c.department_id = d.id AND d.deleted_at = 0
WHERE c.parent = $1 AND c.deleted_at = 0
  AND EXISTS (
    SELECT 1 FROM storages s
    WHERE s.id = d.storage_id
      AND s.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
  );

-- name: CountCategoriesByStorage :one
SELECT COUNT(*) FROM categories c
LEFT JOIN departments d ON c.department_id = d.id AND d.deleted_at = 0
WHERE c.deleted_at = 0
  AND d.storage_id = $1
  AND EXISTS (
    SELECT 1 FROM storages s
    WHERE s.id = $1
      AND s.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
  );

-- name: CountRootCategories :one
SELECT COUNT(*) FROM categories c
LEFT JOIN departments d ON c.department_id = d.id AND d.deleted_at = 0
WHERE c.parent IS NULL AND c.deleted_at = 0
  AND EXISTS (
    SELECT 1 FROM storages s
    WHERE s.id = d.storage_id
      AND s.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
  );

-- name: GetCategoryWithRelations :one
SELECT
    c.id, c.name, c.picture_url, c.name_i18n, c.department_id,
    d.storage_id, c.parent, c.color_code, c.created_at, c.updated_at,
    d.name as department_name,
    s.name as storage_name,
    pc.name as parent_name
FROM categories c
LEFT JOIN departments d ON c.department_id = d.id AND d.deleted_at = 0
LEFT JOIN storages s ON d.storage_id = s.id AND s.deleted_at = 0
LEFT JOIN categories pc ON c.parent = pc.id AND pc.deleted_at = 0
WHERE c.id = $1 AND c.deleted_at = 0
  AND EXISTS (
    SELECT 1 FROM storages s2
    WHERE s2.id = d.storage_id
      AND s2.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
  );

-- name: GetCategoryByIDWithLanguage :one
SELECT
    c.id,
    COALESCE(CASE
        WHEN $2::text = 'uz' THEN t.uz
        WHEN $2::text = 'ru' THEN t.ru
        WHEN $2::text = 'en' THEN t.en
        ELSE c.name
    END, c.name) as name,
    c.picture_url, c.name_i18n, c.department_id,
    d.storage_id, c.parent, c.color_code, c.created_at, c.updated_at, c.deleted_at
FROM categories c
LEFT JOIN departments d ON c.department_id = d.id AND d.deleted_at = 0
LEFT JOIN translations t ON c.name_i18n = t.id AND t.deleted_at = 0
WHERE c.id = $1 AND c.deleted_at = 0
  AND EXISTS (
    SELECT 1 FROM storages s
    WHERE s.id = d.storage_id
      AND s.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
  );

-- name: GetAllCategoriesWithLanguage :many
SELECT
    c.id,
    COALESCE(
        CASE
            WHEN sqlc.arg('lang')::text = 'uz' THEN t.uz
            WHEN sqlc.arg('lang')::text = 'ru' THEN t.ru
            WHEN sqlc.arg('lang')::text = 'en' THEN t.en
            ELSE c.name
        END,
        c.name
    ) AS name,
    c.picture_url,
    c.color_code,
    c.name_i18n,
    c.department_id,
    d.storage_id,
    c.parent,
    c.created_at,
    c.updated_at,
    c.deleted_at
FROM categories c
LEFT JOIN departments d
    ON c.department_id = d.id
   AND d.deleted_at = 0
LEFT JOIN translations t
    ON c.name_i18n = t.id
   AND t.deleted_at = 0
WHERE c.deleted_at = 0
  AND (
        sqlc.arg('search')::text = ''
        OR COALESCE(c.name, '') ILIKE '%' || sqlc.arg('search')::text || '%'
        OR COALESCE(t.uz, '') ILIKE '%' || sqlc.arg('search')::text || '%'
        OR COALESCE(t.ru, '') ILIKE '%' || sqlc.arg('search')::text || '%'
        OR COALESCE(t.en, '') ILIKE '%' || sqlc.arg('search')::text || '%'
      )
  AND (
        sqlc.narg('department_id')::uuid IS NULL
        OR c.department_id = sqlc.narg('department_id')::uuid
      )
  AND (
        sqlc.narg('storage_id')::uuid IS NULL
        OR d.storage_id = sqlc.narg('storage_id')::uuid
      )
  AND EXISTS (
        SELECT 1
        FROM storages s
        WHERE s.id = d.storage_id
          AND s.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
      )
ORDER BY
    CASE
        WHEN sqlc.arg('sort_by')::text = 'name' AND sqlc.arg('sort_order')::text = 'asc'
        THEN COALESCE(
            CASE
                WHEN sqlc.arg('lang')::text = 'uz' THEN t.uz
                WHEN sqlc.arg('lang')::text = 'ru' THEN t.ru
                WHEN sqlc.arg('lang')::text = 'en' THEN t.en
                ELSE c.name
            END,
            c.name
        )
    END ASC,
    CASE
        WHEN sqlc.arg('sort_by')::text = 'name' AND sqlc.arg('sort_order')::text = 'desc'
        THEN COALESCE(
            CASE
                WHEN sqlc.arg('lang')::text = 'uz' THEN t.uz
                WHEN sqlc.arg('lang')::text = 'ru' THEN t.ru
                WHEN sqlc.arg('lang')::text = 'en' THEN t.en
                ELSE c.name
            END,
            c.name
        )
    END DESC,
    CASE
        WHEN sqlc.arg('sort_by')::text = 'created_at' AND sqlc.arg('sort_order')::text = 'asc'
        THEN c.created_at
    END ASC,
    CASE
        WHEN sqlc.arg('sort_by')::text = 'created_at' AND sqlc.arg('sort_order')::text = 'desc'
        THEN c.created_at
    END DESC,
    c.created_at DESC
LIMIT sqlc.arg('limit')::int
OFFSET sqlc.arg('offset')::int;

-- name: CountCategoriesWithLanguage :one
SELECT COUNT(*)
FROM categories c
LEFT JOIN departments d
    ON c.department_id = d.id
   AND d.deleted_at = 0
LEFT JOIN translations t
    ON c.name_i18n = t.id
   AND t.deleted_at = 0
WHERE c.deleted_at = 0
  AND (
        sqlc.arg('search')::text = ''
        OR COALESCE(c.name, '') ILIKE '%' || sqlc.arg('search')::text || '%'
        OR COALESCE(t.uz, '') ILIKE '%' || sqlc.arg('search')::text || '%'
        OR COALESCE(t.ru, '') ILIKE '%' || sqlc.arg('search')::text || '%'
        OR COALESCE(t.en, '') ILIKE '%' || sqlc.arg('search')::text || '%'
      )
  AND (
        sqlc.narg('department_id')::uuid IS NULL
        OR c.department_id = sqlc.narg('department_id')::uuid
      )
  AND (
        sqlc.narg('storage_id')::uuid IS NULL
        OR d.storage_id = sqlc.narg('storage_id')::uuid
      )
  AND EXISTS (
        SELECT 1
        FROM storages s
        WHERE s.id = d.storage_id
          AND s.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
      );

-- name: CountCategoriesByIDs :one
SELECT COUNT(*)::BIGINT
FROM categories
WHERE deleted_at = 0
  AND id IN (
    SELECT x::uuid
    FROM unnest(sqlc.arg(ids)::text[]) AS x
  );