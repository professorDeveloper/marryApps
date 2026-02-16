-- name: CreateGood :one
INSERT INTO goods (id, name, description, name_i18n, description_i18n, category_id, department_id, picture_url, color_code, price, cook_time)
SELECT $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
WHERE (
    ($7 IS NULL OR EXISTS (
        SELECT 1 FROM departments d
        JOIN storages s ON s.id = d.storage_id
        WHERE d.id = $7
          AND s.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
    ))
    AND (
        $6 IS NULL OR (
            EXISTS (
                SELECT 1 FROM categories c
                JOIN storages s ON s.id = c.storage_id
                WHERE c.id = $6
                  AND s.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
            )
            OR EXISTS (
                SELECT 1 FROM categories c
                JOIN departments d ON d.id = c.department_id
                JOIN storages s ON s.id = d.storage_id
                WHERE c.id = $6
                  AND s.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
            )
        )
    )
    AND ($7 IS NOT NULL OR $6 IS NOT NULL)
)
RETURNING goods.id, goods.name, goods.description, goods.name_i18n, goods.description_i18n, goods.category_id, goods.department_id, goods.picture_url, goods.color_code, goods.price, goods.cook_time, goods.cost_price, goods.profit, goods.profit_margin, goods.created_at, goods.updated_at, goods.deleted_at;

-- name: GetGoodByID :one
SELECT goods.id, goods.name, goods.description, goods.name_i18n, goods.description_i18n, goods.category_id, goods.department_id, goods.picture_url, goods.color_code, goods.price, goods.cook_time, goods.cost_price, goods.profit, goods.profit_margin, goods.created_at, goods.updated_at, goods.deleted_at
FROM goods
WHERE goods.id = $1 AND deleted_at = 0
  AND (
    (goods.department_id IS NULL OR EXISTS (
      SELECT 1 FROM departments d
      JOIN storages s ON s.id = d.storage_id
      WHERE d.id = goods.department_id
        AND s.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
    ))
    AND (
      goods.category_id IS NULL OR (
        EXISTS (
          SELECT 1 FROM categories c
          JOIN storages s ON s.id = c.storage_id
          WHERE c.id = goods.category_id
            AND s.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
        )
        OR EXISTS (
          SELECT 1 FROM categories c
          JOIN departments d ON d.id = c.department_id
          JOIN storages s ON s.id = d.storage_id
          WHERE c.id = goods.category_id
            AND s.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
        )
      )
    )
    AND (goods.department_id IS NOT NULL OR goods.category_id IS NOT NULL)
  );

-- name: GetAllGoods :many
SELECT goods.id, goods.name, goods.description, goods.name_i18n, goods.description_i18n, goods.category_id, goods.department_id, goods.picture_url, goods.color_code, goods.price, goods.cook_time, goods.cost_price, goods.profit, goods.profit_margin, goods.created_at, goods.updated_at, goods.deleted_at
FROM goods
WHERE deleted_at = 0
  AND (
    (goods.department_id IS NULL OR EXISTS (
      SELECT 1 FROM departments d
      JOIN storages s ON s.id = d.storage_id
      WHERE d.id = goods.department_id
        AND s.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
    ))
    AND (
      goods.category_id IS NULL OR (
        EXISTS (
          SELECT 1 FROM categories c
          JOIN storages s ON s.id = c.storage_id
          WHERE c.id = goods.category_id
            AND s.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
        )
        OR EXISTS (
          SELECT 1 FROM categories c
          JOIN departments d ON d.id = c.department_id
          JOIN storages s ON s.id = d.storage_id
          WHERE c.id = goods.category_id
            AND s.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
        )
      )
    )
    AND (goods.department_id IS NOT NULL OR goods.category_id IS NOT NULL)
  )
ORDER BY created_at DESC
LIMIT $1 OFFSET $2;

-- name: GetGoodsByCategoryID :many
SELECT goods.id, goods.name, goods.description, goods.name_i18n, goods.description_i18n, goods.category_id, goods.department_id, goods.picture_url, goods.color_code, goods.price, goods.cook_time, goods.cost_price, goods.profit, goods.profit_margin, goods.created_at, goods.updated_at, goods.deleted_at
FROM goods
WHERE category_id = $1 AND deleted_at = 0
  AND (
    (goods.department_id IS NULL OR EXISTS (
      SELECT 1 FROM departments d
      JOIN storages s ON s.id = d.storage_id
      WHERE d.id = goods.department_id
        AND s.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
    ))
    AND (
      goods.category_id IS NULL OR (
        EXISTS (
          SELECT 1 FROM categories c
          JOIN storages s ON s.id = c.storage_id
          WHERE c.id = goods.category_id
            AND s.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
        )
        OR EXISTS (
          SELECT 1 FROM categories c
          JOIN departments d ON d.id = c.department_id
          JOIN storages s ON s.id = d.storage_id
          WHERE c.id = goods.category_id
            AND s.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
        )
      )
    )
    AND (goods.department_id IS NOT NULL OR goods.category_id IS NOT NULL)
  )
ORDER BY name ASC
LIMIT $2 OFFSET $3;

-- name: GetGoodsByDepartmentID :many
SELECT goods.id, goods.name, goods.description, goods.name_i18n, goods.description_i18n, goods.category_id, goods.department_id, goods.picture_url, goods.color_code, goods.price, goods.cook_time, goods.cost_price, goods.profit, goods.profit_margin, goods.created_at, goods.updated_at, goods.deleted_at
FROM goods
WHERE goods.department_id = $1 AND deleted_at = 0
  AND (
    (goods.department_id IS NULL OR EXISTS (
      SELECT 1 FROM departments d
      JOIN storages s ON s.id = d.storage_id
      WHERE d.id = goods.department_id
        AND s.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
    ))
    AND (
      goods.category_id IS NULL OR (
        EXISTS (
          SELECT 1 FROM categories c
          JOIN storages s ON s.id = c.storage_id
          WHERE c.id = goods.category_id
            AND s.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
        )
        OR EXISTS (
          SELECT 1 FROM categories c
          JOIN departments d ON d.id = c.department_id
          JOIN storages s ON s.id = d.storage_id
          WHERE c.id = goods.category_id
            AND s.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
        )
      )
    )
    AND (goods.department_id IS NOT NULL OR goods.category_id IS NOT NULL)
  )
ORDER BY name ASC
LIMIT $2 OFFSET $3;

-- name: GetGoodsByPriceRange :many
SELECT goods.id, goods.name, goods.description, goods.name_i18n, goods.description_i18n, goods.category_id, goods.department_id, goods.picture_url, goods.color_code, goods.price, goods.cook_time, goods.cost_price, goods.profit, goods.profit_margin, goods.created_at, goods.updated_at, goods.deleted_at
FROM goods
WHERE price >= $1 AND price <= $2 AND deleted_at = 0
  AND (
    (goods.department_id IS NULL OR EXISTS (
      SELECT 1 FROM departments d
      JOIN storages s ON s.id = d.storage_id
      WHERE d.id = goods.department_id
        AND s.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
    ))
    AND (
      goods.category_id IS NULL OR (
        EXISTS (
          SELECT 1 FROM categories c
          JOIN storages s ON s.id = c.storage_id
          WHERE c.id = goods.category_id
            AND s.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
        )
        OR EXISTS (
          SELECT 1 FROM categories c
          JOIN departments d ON d.id = c.department_id
          JOIN storages s ON s.id = d.storage_id
          WHERE c.id = goods.category_id
            AND s.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
        )
      )
    )
    AND (goods.department_id IS NOT NULL OR goods.category_id IS NOT NULL)
  )
ORDER BY price ASC
LIMIT $3 OFFSET $4;

-- name: UpdateGood :one
UPDATE goods
SET name = COALESCE($2, name),
    description = COALESCE($3, description),
    name_i18n = COALESCE($4, name_i18n),
    description_i18n = COALESCE($5, description_i18n),
    category_id = COALESCE($6, category_id),
    department_id = COALESCE($7, department_id),
    picture_url = COALESCE($8, picture_url),
    color_code = COALESCE($9, color_code),
    price = COALESCE($10, price),
    cook_time = COALESCE($11, cook_time),
    updated_at = NOW()
WHERE goods.id = $1 AND deleted_at = 0
  AND (
    (goods.department_id IS NULL OR EXISTS (
      SELECT 1 FROM departments d
      JOIN storages s ON s.id = d.storage_id
      WHERE d.id = goods.department_id
        AND s.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
    ))
    AND (
      goods.category_id IS NULL OR (
        EXISTS (
          SELECT 1 FROM categories c
          JOIN storages s ON s.id = c.storage_id
          WHERE c.id = goods.category_id
            AND s.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
        )
        OR EXISTS (
          SELECT 1 FROM categories c
          JOIN departments d ON d.id = c.department_id
          JOIN storages s ON s.id = d.storage_id
          WHERE c.id = goods.category_id
            AND s.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
        )
      )
    )
    AND (goods.department_id IS NOT NULL OR goods.category_id IS NOT NULL)
  )
  AND (
    $7 IS NULL OR EXISTS (
      SELECT 1 FROM departments d2
      JOIN storages s2 ON s2.id = d2.storage_id
      WHERE d2.id = $7
        AND s2.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
    )
  )
  AND (
    $6 IS NULL OR (
      EXISTS (
        SELECT 1 FROM categories c2
        JOIN storages s2 ON s2.id = c2.storage_id
        WHERE c2.id = $6
          AND s2.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
      )
      OR EXISTS (
        SELECT 1 FROM categories c2
        JOIN departments d2 ON d2.id = c2.department_id
        JOIN storages s2 ON s2.id = d2.storage_id
        WHERE c2.id = $6
          AND s2.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
      )
    )
  )
RETURNING goods.id, goods.name, goods.description, goods.name_i18n, goods.description_i18n, goods.category_id, goods.department_id, goods.picture_url, goods.color_code, goods.price, goods.cook_time, goods.cost_price, goods.profit, goods.profit_margin, goods.created_at, goods.updated_at, goods.deleted_at;

-- name: UpdateGoodPrice :one
UPDATE goods
SET price = $2,
    updated_at = NOW()
WHERE goods.id = $1 AND deleted_at = 0
  AND (
    (goods.department_id IS NULL OR EXISTS (
      SELECT 1 FROM departments d
      JOIN storages s ON s.id = d.storage_id
      WHERE d.id = goods.department_id
        AND s.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
    ))
    AND (
      goods.category_id IS NULL OR (
        EXISTS (
          SELECT 1 FROM categories c
          JOIN storages s ON s.id = c.storage_id
          WHERE c.id = goods.category_id
            AND s.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
        )
        OR EXISTS (
          SELECT 1 FROM categories c
          JOIN departments d ON d.id = c.department_id
          JOIN storages s ON s.id = d.storage_id
          WHERE c.id = goods.category_id
            AND s.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
        )
      )
    )
    AND (goods.department_id IS NOT NULL OR goods.category_id IS NOT NULL)
  )
RETURNING goods.id, goods.name, goods.description, goods.name_i18n, goods.description_i18n, goods.category_id, goods.department_id, goods.picture_url, goods.color_code, goods.price, goods.cook_time, goods.cost_price, goods.profit, goods.profit_margin, goods.created_at, goods.updated_at, goods.deleted_at;

-- name: UpdateGoodCostFields :one
UPDATE goods
SET cost_price = $2,
    profit = $3,
    profit_margin = $4,
    updated_at = NOW()
WHERE goods.id = $1 AND deleted_at = 0
  AND (
    (goods.department_id IS NULL OR EXISTS (
      SELECT 1 FROM departments d
      JOIN storages s ON s.id = d.storage_id
      WHERE d.id = goods.department_id
        AND s.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
    ))
    AND (
      goods.category_id IS NULL OR (
        EXISTS (
          SELECT 1 FROM categories c
          JOIN storages s ON s.id = c.storage_id
          WHERE c.id = goods.category_id
            AND s.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
        )
        OR EXISTS (
          SELECT 1 FROM categories c
          JOIN departments d ON d.id = c.department_id
          JOIN storages s ON s.id = d.storage_id
          WHERE c.id = goods.category_id
            AND s.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
        )
      )
    )
    AND (goods.department_id IS NOT NULL OR goods.category_id IS NOT NULL)
  )
RETURNING goods.id, goods.name, goods.description, goods.name_i18n, goods.description_i18n, goods.category_id, goods.department_id, goods.picture_url, goods.color_code, goods.price, goods.cook_time, goods.cost_price, goods.profit, goods.profit_margin, goods.created_at, goods.updated_at, goods.deleted_at;

-- name: DeleteGood :exec
UPDATE goods
SET deleted_at = EXTRACT(EPOCH FROM NOW())::BIGINT
WHERE goods.id = $1 AND deleted_at = 0
  AND (
    (goods.department_id IS NULL OR EXISTS (
      SELECT 1 FROM departments d
      JOIN storages s ON s.id = d.storage_id
      WHERE d.id = goods.department_id
        AND s.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
    ))
    AND (
      goods.category_id IS NULL OR (
        EXISTS (
          SELECT 1 FROM categories c
          JOIN storages s ON s.id = c.storage_id
          WHERE c.id = goods.category_id
            AND s.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
        )
        OR EXISTS (
          SELECT 1 FROM categories c
          JOIN departments d ON d.id = c.department_id
          JOIN storages s ON s.id = d.storage_id
          WHERE c.id = goods.category_id
            AND s.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
        )
      )
    )
    AND (goods.department_id IS NOT NULL OR goods.category_id IS NOT NULL)
  );

-- name: RestoreGood :exec
UPDATE goods
SET deleted_at = 0
WHERE goods.id = $1 AND deleted_at != 0
  AND (
    (goods.department_id IS NULL OR EXISTS (
      SELECT 1 FROM departments d
      JOIN storages s ON s.id = d.storage_id
      WHERE d.id = goods.department_id
        AND s.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
    ))
    AND (
      goods.category_id IS NULL OR (
        EXISTS (
          SELECT 1 FROM categories c
          JOIN storages s ON s.id = c.storage_id
          WHERE c.id = goods.category_id
            AND s.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
        )
        OR EXISTS (
          SELECT 1 FROM categories c
          JOIN departments d ON d.id = c.department_id
          JOIN storages s ON s.id = d.storage_id
          WHERE c.id = goods.category_id
            AND s.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
        )
      )
    )
    AND (goods.department_id IS NOT NULL OR goods.category_id IS NOT NULL)
  );

-- name: SearchGoods :many
SELECT goods.id, goods.name, goods.description, goods.name_i18n, goods.description_i18n, goods.category_id, goods.department_id, goods.picture_url, goods.price, goods.cook_time, goods.cost_price, goods.profit, goods.profit_margin, goods.created_at, goods.updated_at, goods.deleted_at
FROM goods
WHERE deleted_at = 0 
AND (name ILIKE '%' || $1 || '%' OR description ILIKE '%' || $1 || '%')
  AND (
    (goods.department_id IS NULL OR EXISTS (
      SELECT 1 FROM departments d
      JOIN storages s ON s.id = d.storage_id
      WHERE d.id = goods.department_id
        AND s.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
    ))
    AND (
      goods.category_id IS NULL OR (
        EXISTS (
          SELECT 1 FROM categories c
          JOIN storages s ON s.id = c.storage_id
          WHERE c.id = goods.category_id
            AND s.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
        )
        OR EXISTS (
          SELECT 1 FROM categories c
          JOIN departments d ON d.id = c.department_id
          JOIN storages s ON s.id = d.storage_id
          WHERE c.id = goods.category_id
            AND s.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
        )
      )
    )
    AND (goods.department_id IS NOT NULL OR goods.category_id IS NOT NULL)
  )
ORDER BY name ASC
LIMIT $2 OFFSET $3;

-- name: CountGoods :one
SELECT COUNT(*) FROM goods
WHERE deleted_at = 0
  AND (
    (goods.department_id IS NULL OR EXISTS (
      SELECT 1 FROM departments d
      JOIN storages s ON s.id = d.storage_id
      WHERE d.id = goods.department_id
        AND s.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
    ))
    AND (
      goods.category_id IS NULL OR (
        EXISTS (
          SELECT 1 FROM categories c
          JOIN storages s ON s.id = c.storage_id
          WHERE c.id = goods.category_id
            AND s.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
        )
        OR EXISTS (
          SELECT 1 FROM categories c
          JOIN departments d ON d.id = c.department_id
          JOIN storages s ON s.id = d.storage_id
          WHERE c.id = goods.category_id
            AND s.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
        )
      )
    )
    AND (goods.department_id IS NOT NULL OR goods.category_id IS NOT NULL)
  );

-- name: CountGoodsByCategory :one
SELECT COUNT(*) FROM goods
WHERE category_id = $1 AND deleted_at = 0
  AND (
    (goods.department_id IS NULL OR EXISTS (
      SELECT 1 FROM departments d
      JOIN storages s ON s.id = d.storage_id
      WHERE d.id = goods.department_id
        AND s.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
    ))
    AND (
      goods.category_id IS NULL OR (
        EXISTS (
          SELECT 1 FROM categories c
          JOIN storages s ON s.id = c.storage_id
          WHERE c.id = goods.category_id
            AND s.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
        )
        OR EXISTS (
          SELECT 1 FROM categories c
          JOIN departments d ON d.id = c.department_id
          JOIN storages s ON s.id = d.storage_id
          WHERE c.id = goods.category_id
            AND s.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
        )
      )
    )
    AND (goods.department_id IS NOT NULL OR goods.category_id IS NOT NULL)
  );

-- name: CountGoodsByDepartment :one
SELECT COUNT(*) FROM goods
WHERE goods.department_id = $1 AND deleted_at = 0
  AND (
    (goods.department_id IS NULL OR EXISTS (
      SELECT 1 FROM departments d
      JOIN storages s ON s.id = d.storage_id
      WHERE d.id = goods.department_id
        AND s.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
    ))
    AND (
      goods.category_id IS NULL OR (
        EXISTS (
          SELECT 1 FROM categories c
          JOIN storages s ON s.id = c.storage_id
          WHERE c.id = goods.category_id
            AND s.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
        )
        OR EXISTS (
          SELECT 1 FROM categories c
          JOIN departments d ON d.id = c.department_id
          JOIN storages s ON s.id = d.storage_id
          WHERE c.id = goods.category_id
            AND s.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
        )
      )
    )
    AND (goods.department_id IS NOT NULL OR goods.category_id IS NOT NULL)
  );

-- name: GetGoodWithRelations :one
SELECT 
    g.id,
    g.name,
    g.description,
    g.name_i18n,
    g.description_i18n,
    g.picture_url,
    g.price,
    g.cook_time,
    g.cost_price,
    g.profit,
    g.profit_margin,
    g.created_at,
    g.updated_at,
    c.name as category_name,
    d.name as department_name
FROM goods g
LEFT JOIN categories c ON g.category_id = c.id AND c.deleted_at = 0
LEFT JOIN departments d ON g.department_id = d.id AND d.deleted_at = 0
WHERE g.id = $1 AND g.deleted_at = 0
  AND (
    (g.department_id IS NULL OR EXISTS (
      SELECT 1 FROM departments d2
      JOIN storages s2 ON s2.id = d2.storage_id
      WHERE d2.id = g.department_id
        AND s2.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
    ))
    AND (
      g.category_id IS NULL OR (
        EXISTS (
          SELECT 1 FROM categories c2
          JOIN storages s2 ON s2.id = c2.storage_id
          WHERE c2.id = g.category_id
            AND s2.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
        )
        OR EXISTS (
          SELECT 1 FROM categories c2
          JOIN departments d2 ON d2.id = c2.department_id
          JOIN storages s2 ON s2.id = d2.storage_id
          WHERE c2.id = g.category_id
            AND s2.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
        )
      )
    )
    AND (g.department_id IS NOT NULL OR g.category_id IS NOT NULL)
  );

-- name: GetPopularGoods :many
SELECT 
    g.id,
    g.name,
    g.picture_url,
    g.price,
    g.cook_time,
    COUNT(oi.id) as order_count,
    SUM(oi.quantity) as total_ordered
FROM goods g
LEFT JOIN order_items oi ON g.id = oi.good_id AND oi.deleted_at = 0
WHERE g.deleted_at = 0
  AND (
    (g.department_id IS NULL OR EXISTS (
      SELECT 1 FROM departments d
      JOIN storages s ON s.id = d.storage_id
      WHERE d.id = g.department_id
        AND s.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
    ))
    AND (
      g.category_id IS NULL OR (
        EXISTS (
          SELECT 1 FROM categories c
          JOIN storages s ON s.id = c.storage_id
          WHERE c.id = g.category_id
            AND s.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
        )
        OR EXISTS (
          SELECT 1 FROM categories c
          JOIN departments d ON d.id = c.department_id
          JOIN storages s ON s.id = d.storage_id
          WHERE c.id = g.category_id
            AND s.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
        )
      )
    )
    AND (g.department_id IS NOT NULL OR g.category_id IS NOT NULL)
  )
GROUP BY g.id, g.name, g.picture_url, g.price, g.cook_time
ORDER BY order_count DESC
LIMIT $1 OFFSET $2;



-- name: CreateGoodDetail :one
INSERT INTO goods_details (id, good_id, ingredient_id, compound_id, measurement, quantity)
SELECT $1, $2, $3, $4, $5, $6
WHERE (
    EXISTS (
      SELECT 1 FROM goods g
      WHERE g.id = $2
        AND g.deleted_at = 0
        AND (
          (g.department_id IS NULL OR EXISTS (
            SELECT 1 FROM departments d
            JOIN storages s ON s.id = d.storage_id
            WHERE d.id = g.department_id
              AND s.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
          ))
          AND (
            g.category_id IS NULL OR (
              EXISTS (
                SELECT 1 FROM categories c
                JOIN storages s ON s.id = c.storage_id
                WHERE c.id = g.category_id
                  AND s.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
              )
              OR EXISTS (
                SELECT 1 FROM categories c
                JOIN departments d ON d.id = c.department_id
                JOIN storages s ON s.id = d.storage_id
                WHERE c.id = g.category_id
                  AND s.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
              )
            )
          )
          AND (g.department_id IS NOT NULL OR g.category_id IS NOT NULL)
        )
    )
    AND (
      $3 IS NULL OR EXISTS (
        SELECT 1 FROM ingredients i
        WHERE i.id = $3
          AND i.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
      )
    )
    AND (
      $4 IS NULL OR EXISTS (
        SELECT 1 FROM compounds c
        JOIN departments d ON d.id = c.department_id
        JOIN storages s ON s.id = d.storage_id
        WHERE c.id = $4
          AND s.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
      )
    )
)
RETURNING goods_details.id, goods_details.good_id, goods_details.ingredient_id, goods_details.compound_id, goods_details.measurement, goods_details.quantity, goods_details.created_at, goods_details.updated_at, goods_details.deleted_at;

-- name: GetGoodDetailByID :one
SELECT goods_details.id, goods_details.good_id, goods_details.ingredient_id, goods_details.compound_id, goods_details.measurement, goods_details.quantity, goods_details.created_at, goods_details.updated_at, goods_details.deleted_at
FROM goods_details
WHERE goods_details.id = $1 AND deleted_at = 0
  AND EXISTS (
    SELECT 1 FROM goods g
    WHERE g.id = goods_details.good_id
      AND g.deleted_at = 0
      AND (
        (g.department_id IS NULL OR EXISTS (
          SELECT 1 FROM departments d
          JOIN storages s ON s.id = d.storage_id
          WHERE d.id = g.department_id
            AND s.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
        ))
        AND (
          g.category_id IS NULL OR (
            EXISTS (
              SELECT 1 FROM categories c
              JOIN storages s ON s.id = c.storage_id
              WHERE c.id = g.category_id
                AND s.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
            )
            OR EXISTS (
              SELECT 1 FROM categories c
              JOIN departments d ON d.id = c.department_id
              JOIN storages s ON s.id = d.storage_id
              WHERE c.id = g.category_id
                AND s.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
            )
          )
        )
        AND (g.department_id IS NOT NULL OR g.category_id IS NOT NULL)
      )
  );

-- name: GetAllGoodDetails :many
SELECT goods_details.id, goods_details.good_id, goods_details.ingredient_id, goods_details.compound_id, goods_details.measurement, goods_details.quantity, goods_details.created_at, goods_details.updated_at, goods_details.deleted_at
FROM goods_details
WHERE deleted_at = 0
  AND EXISTS (
    SELECT 1 FROM goods g
    WHERE g.id = goods_details.good_id
      AND g.deleted_at = 0
      AND (
        (g.department_id IS NULL OR EXISTS (
          SELECT 1 FROM departments d
          JOIN storages s ON s.id = d.storage_id
          WHERE d.id = g.department_id
            AND s.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
        ))
        AND (
          g.category_id IS NULL OR (
            EXISTS (
              SELECT 1 FROM categories c
              JOIN storages s ON s.id = c.storage_id
              WHERE c.id = g.category_id
                AND s.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
            )
            OR EXISTS (
              SELECT 1 FROM categories c
              JOIN departments d ON d.id = c.department_id
              JOIN storages s ON s.id = d.storage_id
              WHERE c.id = g.category_id
                AND s.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
            )
          )
        )
        AND (g.department_id IS NOT NULL OR g.category_id IS NOT NULL)
      )
  )
ORDER BY created_at DESC
LIMIT $1 OFFSET $2;

-- name: GetGoodDetailsByGoodID :many
SELECT goods_details.id, goods_details.good_id, goods_details.ingredient_id, goods_details.compound_id, goods_details.measurement, goods_details.quantity, goods_details.created_at, goods_details.updated_at, goods_details.deleted_at
FROM goods_details
WHERE goods_details.good_id = $1 AND deleted_at = 0
  AND EXISTS (
    SELECT 1 FROM goods g
    WHERE g.id = $1
      AND g.deleted_at = 0
      AND (
        (g.department_id IS NULL OR EXISTS (
          SELECT 1 FROM departments d
          JOIN storages s ON s.id = d.storage_id
          WHERE d.id = g.department_id
            AND s.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
        ))
        AND (
          g.category_id IS NULL OR (
            EXISTS (
              SELECT 1 FROM categories c
              JOIN storages s ON s.id = c.storage_id
              WHERE c.id = g.category_id
                AND s.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
            )
            OR EXISTS (
              SELECT 1 FROM categories c
              JOIN departments d ON d.id = c.department_id
              JOIN storages s ON s.id = d.storage_id
              WHERE c.id = g.category_id
                AND s.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
            )
          )
        )
        AND (g.department_id IS NOT NULL OR g.category_id IS NOT NULL)
      )
  )
ORDER BY created_at ASC;

-- name: GetGoodDetailsByIngredientID :many
SELECT goods_details.id, goods_details.good_id, goods_details.ingredient_id, goods_details.compound_id, goods_details.measurement, goods_details.quantity, goods_details.created_at, goods_details.updated_at, goods_details.deleted_at
FROM goods_details
WHERE ingredient_id = $1 AND deleted_at = 0
  AND EXISTS (
    SELECT 1 FROM ingredients i
    WHERE i.id = $1
      AND i.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
  )
  AND EXISTS (
    SELECT 1 FROM goods g
    WHERE g.id = goods_details.good_id
      AND g.deleted_at = 0
      AND (
        (g.department_id IS NULL OR EXISTS (
          SELECT 1 FROM departments d
          JOIN storages s ON s.id = d.storage_id
          WHERE d.id = g.department_id
            AND s.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
        ))
        AND (
          g.category_id IS NULL OR (
            EXISTS (
              SELECT 1 FROM categories c
              JOIN storages s ON s.id = c.storage_id
              WHERE c.id = g.category_id
                AND s.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
            )
            OR EXISTS (
              SELECT 1 FROM categories c
              JOIN departments d ON d.id = c.department_id
              JOIN storages s ON s.id = d.storage_id
              WHERE c.id = g.category_id
                AND s.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
            )
          )
        )
        AND (g.department_id IS NOT NULL OR g.category_id IS NOT NULL)
      )
  )
ORDER BY created_at DESC
LIMIT $2 OFFSET $3;

-- name: GetGoodDetailsByCompoundID :many
SELECT goods_details.id, goods_details.good_id, goods_details.ingredient_id, goods_details.compound_id, goods_details.measurement, goods_details.quantity, goods_details.created_at, goods_details.updated_at, goods_details.deleted_at
FROM goods_details
WHERE compound_id = $1 AND deleted_at = 0
  AND EXISTS (
    SELECT 1 FROM compounds c
    JOIN departments d ON d.id = c.department_id
    JOIN storages s ON s.id = d.storage_id
    WHERE c.id = $1
      AND s.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
  )
  AND EXISTS (
    SELECT 1 FROM goods g
    WHERE g.id = goods_details.good_id
      AND g.deleted_at = 0
      AND (
        (g.department_id IS NULL OR EXISTS (
          SELECT 1 FROM departments d
          JOIN storages s ON s.id = d.storage_id
          WHERE d.id = g.department_id
            AND s.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
        ))
        AND (
          g.category_id IS NULL OR (
            EXISTS (
              SELECT 1 FROM categories c
              JOIN storages s ON s.id = c.storage_id
              WHERE c.id = g.category_id
                AND s.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
            )
            OR EXISTS (
              SELECT 1 FROM categories c
              JOIN departments d ON d.id = c.department_id
              JOIN storages s ON s.id = d.storage_id
              WHERE c.id = g.category_id
                AND s.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
            )
          )
        )
        AND (g.department_id IS NOT NULL OR g.category_id IS NOT NULL)
      )
  )
ORDER BY created_at DESC
LIMIT $2 OFFSET $3;

-- name: UpdateGoodDetail :one
UPDATE goods_details
SET good_id = COALESCE($2, good_id),
    ingredient_id = COALESCE($3, ingredient_id),
    compound_id = COALESCE($4, compound_id),
    measurement = COALESCE($5, measurement),
    quantity = COALESCE($6, quantity),
    updated_at = NOW()
WHERE goods_details.id = $1 AND deleted_at = 0
  AND EXISTS (
    SELECT 1 FROM goods g
    WHERE g.id = goods_details.good_id
      AND g.deleted_at = 0
      AND (
        (g.department_id IS NULL OR EXISTS (
          SELECT 1 FROM departments d
          JOIN storages s ON s.id = d.storage_id
          WHERE d.id = g.department_id
            AND s.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
        ))
        AND (
          g.category_id IS NULL OR (
            EXISTS (
              SELECT 1 FROM categories c
              JOIN storages s ON s.id = c.storage_id
              WHERE c.id = g.category_id
                AND s.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
            )
            OR EXISTS (
              SELECT 1 FROM categories c
              JOIN departments d ON d.id = c.department_id
              JOIN storages s ON s.id = d.storage_id
              WHERE c.id = g.category_id
                AND s.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
            )
          )
        )
        AND (g.department_id IS NOT NULL OR g.category_id IS NOT NULL)
      )
  )
  AND (
    $2 IS NULL OR EXISTS (
      SELECT 1 FROM goods g2
      WHERE g2.id = $2
        AND g2.deleted_at = 0
        AND (
          (g2.department_id IS NULL OR EXISTS (
            SELECT 1 FROM departments d2
            JOIN storages s2 ON s2.id = d2.storage_id
            WHERE d2.id = g2.department_id
              AND s2.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
          ))
          AND (
            g2.category_id IS NULL OR (
              EXISTS (
                SELECT 1 FROM categories c2
                JOIN storages s2 ON s2.id = c2.storage_id
                WHERE c2.id = g2.category_id
                  AND s2.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
              )
              OR EXISTS (
                SELECT 1 FROM categories c2
                JOIN departments d2 ON d2.id = c2.department_id
                JOIN storages s2 ON s2.id = d2.storage_id
                WHERE c2.id = g2.category_id
                  AND s2.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
              )
            )
          )
          AND (g2.department_id IS NOT NULL OR g2.category_id IS NOT NULL)
        )
    )
  )
  AND (
    $3 IS NULL OR EXISTS (
      SELECT 1 FROM ingredients i
      WHERE i.id = $3
        AND i.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
    )
  )
  AND (
    $4 IS NULL OR EXISTS (
      SELECT 1 FROM compounds c
      JOIN departments d ON d.id = c.department_id
      JOIN storages s ON s.id = d.storage_id
      WHERE c.id = $4
        AND s.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
    )
  )
RETURNING goods_details.id, goods_details.good_id, goods_details.ingredient_id, goods_details.compound_id, goods_details.measurement, goods_details.quantity, goods_details.created_at, goods_details.updated_at, goods_details.deleted_at;

-- name: UpdateGoodDetailQuantity :one
UPDATE goods_details
SET quantity = $2,
    updated_at = NOW()
WHERE goods_details.id = $1 AND deleted_at = 0
  AND EXISTS (
    SELECT 1 FROM goods g
    WHERE g.id = goods_details.good_id
      AND g.deleted_at = 0
      AND (
        (g.department_id IS NULL OR EXISTS (
          SELECT 1 FROM departments d
          JOIN storages s ON s.id = d.storage_id
          WHERE d.id = g.department_id
            AND s.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
        ))
        AND (
          g.category_id IS NULL OR (
            EXISTS (
              SELECT 1 FROM categories c
              JOIN storages s ON s.id = c.storage_id
              WHERE c.id = g.category_id
                AND s.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
            )
            OR EXISTS (
              SELECT 1 FROM categories c
              JOIN departments d ON d.id = c.department_id
              JOIN storages s ON s.id = d.storage_id
              WHERE c.id = g.category_id
                AND s.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
            )
          )
        )
        AND (g.department_id IS NOT NULL OR g.category_id IS NOT NULL)
      )
  )
RETURNING goods_details.id, goods_details.good_id, goods_details.ingredient_id, goods_details.compound_id, goods_details.measurement, goods_details.quantity, goods_details.created_at, goods_details.updated_at, goods_details.deleted_at;

-- name: DeleteGoodDetail :exec
UPDATE goods_details
SET deleted_at = EXTRACT(EPOCH FROM NOW())::BIGINT
WHERE goods_details.id = $1 AND deleted_at = 0
  AND EXISTS (
    SELECT 1 FROM goods g
    WHERE g.id = goods_details.good_id
      AND g.deleted_at = 0
      AND (
        (g.department_id IS NULL OR EXISTS (
          SELECT 1 FROM departments d
          JOIN storages s ON s.id = d.storage_id
          WHERE d.id = g.department_id
            AND s.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
        ))
        AND (
          g.category_id IS NULL OR (
            EXISTS (
              SELECT 1 FROM categories c
              JOIN storages s ON s.id = c.storage_id
              WHERE c.id = g.category_id
                AND s.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
            )
            OR EXISTS (
              SELECT 1 FROM categories c
              JOIN departments d ON d.id = c.department_id
              JOIN storages s ON s.id = d.storage_id
              WHERE c.id = g.category_id
                AND s.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
            )
          )
        )
        AND (g.department_id IS NOT NULL OR g.category_id IS NOT NULL)
      )
  );

-- name: RestoreGoodDetail :exec
UPDATE goods_details
SET deleted_at = 0
WHERE goods_details.id = $1 AND deleted_at != 0
  AND EXISTS (
    SELECT 1 FROM goods g
    WHERE g.id = goods_details.good_id
      AND g.deleted_at = 0
      AND (
        (g.department_id IS NULL OR EXISTS (
          SELECT 1 FROM departments d
          JOIN storages s ON s.id = d.storage_id
          WHERE d.id = g.department_id
            AND s.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
        ))
        AND (
          g.category_id IS NULL OR (
            EXISTS (
              SELECT 1 FROM categories c
              JOIN storages s ON s.id = c.storage_id
              WHERE c.id = g.category_id
                AND s.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
            )
            OR EXISTS (
              SELECT 1 FROM categories c
              JOIN departments d ON d.id = c.department_id
              JOIN storages s ON s.id = d.storage_id
              WHERE c.id = g.category_id
                AND s.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
            )
          )
        )
        AND (g.department_id IS NOT NULL OR g.category_id IS NOT NULL)
      )
  );

-- name: DeleteGoodDetailsByGoodID :exec
UPDATE goods_details
SET deleted_at = EXTRACT(EPOCH FROM NOW())::BIGINT
WHERE goods_details.good_id = $1 AND deleted_at = 0
  AND EXISTS (
    SELECT 1 FROM goods g
    WHERE g.id = $1
      AND g.deleted_at = 0
      AND (
        (g.department_id IS NULL OR EXISTS (
          SELECT 1 FROM departments d
          JOIN storages s ON s.id = d.storage_id
          WHERE d.id = g.department_id
            AND s.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
        ))
        AND (
          g.category_id IS NULL OR (
            EXISTS (
              SELECT 1 FROM categories c
              JOIN storages s ON s.id = c.storage_id
              WHERE c.id = g.category_id
                AND s.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
            )
            OR EXISTS (
              SELECT 1 FROM categories c
              JOIN departments d ON d.id = c.department_id
              JOIN storages s ON s.id = d.storage_id
              WHERE c.id = g.category_id
                AND s.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
            )
          )
        )
        AND (g.department_id IS NOT NULL OR g.category_id IS NOT NULL)
      )
  );

-- name: CountGoodDetails :one
SELECT COUNT(*) FROM goods_details
WHERE deleted_at = 0
  AND EXISTS (
    SELECT 1 FROM goods g
    WHERE g.id = goods_details.good_id
      AND g.deleted_at = 0
      AND (
        (g.department_id IS NULL OR EXISTS (
          SELECT 1 FROM departments d
          JOIN storages s ON s.id = d.storage_id
          WHERE d.id = g.department_id
            AND s.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
        ))
        AND (
          g.category_id IS NULL OR (
            EXISTS (
              SELECT 1 FROM categories c
              JOIN storages s ON s.id = c.storage_id
              WHERE c.id = g.category_id
                AND s.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
            )
            OR EXISTS (
              SELECT 1 FROM categories c
              JOIN departments d ON d.id = c.department_id
              JOIN storages s ON s.id = d.storage_id
              WHERE c.id = g.category_id
                AND s.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
            )
          )
        )
        AND (g.department_id IS NOT NULL OR g.category_id IS NOT NULL)
      )
  );

-- name: CountGoodDetailsByGood :one
SELECT COUNT(*) FROM goods_details
WHERE goods_details.good_id = $1 AND deleted_at = 0
  AND EXISTS (
    SELECT 1 FROM goods g
    WHERE g.id = $1
      AND g.deleted_at = 0
      AND (
        (g.department_id IS NULL OR EXISTS (
          SELECT 1 FROM departments d
          JOIN storages s ON s.id = d.storage_id
          WHERE d.id = g.department_id
            AND s.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
        ))
        AND (
          g.category_id IS NULL OR (
            EXISTS (
              SELECT 1 FROM categories c
              JOIN storages s ON s.id = c.storage_id
              WHERE c.id = g.category_id
                AND s.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
            )
            OR EXISTS (
              SELECT 1 FROM categories c
              JOIN departments d ON d.id = c.department_id
              JOIN storages s ON s.id = d.storage_id
              WHERE c.id = g.category_id
                AND s.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
            )
          )
        )
        AND (g.department_id IS NOT NULL OR g.category_id IS NOT NULL)
      )
  );

-- name: GetGoodByIDWithLanguage :one
SELECT 
    g.id,
    COALESCE(CASE 
        WHEN $2::text = 'uz' THEN tn.uz
        WHEN $2::text = 'ru' THEN tn.ru
        WHEN $2::text = 'en' THEN tn.en
        ELSE g.name
    END, g.name) as name,
    COALESCE(CASE 
        WHEN $2::text = 'uz' THEN td.uz
        WHEN $2::text = 'ru' THEN td.ru
        WHEN $2::text = 'en' THEN td.en
        ELSE g.description
    END, g.description) as description,
    g.name_i18n,
    g.description_i18n,
    g.category_id,
    g.department_id,
    g.picture_url,
    g.color_code,
    g.price,
    g.cook_time,
    g.cost_price,
    g.profit,
    g.profit_margin,
    g.created_at,
    g.updated_at,
    g.deleted_at
FROM goods g
LEFT JOIN translations tn ON g.name_i18n = tn.id AND tn.deleted_at = 0
LEFT JOIN translations td ON g.description_i18n = td.id AND td.deleted_at = 0
WHERE g.id = $1 AND g.deleted_at = 0
  AND (
    (g.department_id IS NULL OR EXISTS (
      SELECT 1 FROM departments d
      JOIN storages s ON s.id = d.storage_id
      WHERE d.id = g.department_id
        AND s.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
    ))
    AND (
      g.category_id IS NULL OR (
        EXISTS (
          SELECT 1 FROM categories c
          JOIN storages s ON s.id = c.storage_id
          WHERE c.id = g.category_id
            AND s.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
        )
        OR EXISTS (
          SELECT 1 FROM categories c
          JOIN departments d ON d.id = c.department_id
          JOIN storages s ON s.id = d.storage_id
          WHERE c.id = g.category_id
            AND s.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
        )
      )
    )
    AND (g.department_id IS NOT NULL OR g.category_id IS NOT NULL)
  );

-- name: GetAllGoodsWithLanguage :many
SELECT 
    g.id,
    COALESCE(CASE 
        WHEN $1::text = 'uz' THEN tn.uz
        WHEN $1::text = 'ru' THEN tn.ru
        WHEN $1::text = 'en' THEN tn.en
        ELSE g.name
    END, g.name) as name,
    COALESCE(CASE 
        WHEN $1::text = 'uz' THEN td.uz
        WHEN $1::text = 'ru' THEN td.ru
        WHEN $1::text = 'en' THEN td.en
        ELSE g.description
    END, g.description) as description,
    g.name_i18n,
    g.description_i18n,
    g.category_id,
    g.department_id,
    g.picture_url,
    g.color_code,
    g.price,
    g.cook_time,
    g.cost_price,
    g.profit,
    g.profit_margin,
    g.created_at,
    g.updated_at,
    g.deleted_at
FROM goods g
LEFT JOIN translations tn ON g.name_i18n = tn.id AND tn.deleted_at = 0
LEFT JOIN translations td ON g.description_i18n = td.id AND td.deleted_at = 0
WHERE g.deleted_at = 0
  AND (
    (g.department_id IS NULL OR EXISTS (
      SELECT 1 FROM departments d
      JOIN storages s ON s.id = d.storage_id
      WHERE d.id = g.department_id
        AND s.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
    ))
    AND (
      g.category_id IS NULL OR (
        EXISTS (
          SELECT 1 FROM categories c
          JOIN storages s ON s.id = c.storage_id
          WHERE c.id = g.category_id
            AND s.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
        )
        OR EXISTS (
          SELECT 1 FROM categories c
          JOIN departments d ON d.id = c.department_id
          JOIN storages s ON s.id = d.storage_id
          WHERE c.id = g.category_id
            AND s.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
        )
      )
    )
    AND (g.department_id IS NOT NULL OR g.category_id IS NOT NULL)
  )
ORDER BY g.created_at DESC
LIMIT $2 OFFSET $3;


-- -- ==================== RECIPE & INGREDIENT TRACKING ====================

-- -- name: GetGoodRecipeWithIngredients :many
-- SELECT 
--     gd.id,
--     gd.good_id,
--     gd.ingredient_id,
--     gd.compound_id,
--     gd.quantity,
--     gd.measurement,
--     CASE 
--         WHEN gd.ingredient_id IS NOT NULL THEN i.name
--         WHEN gd.compound_id IS NOT NULL THEN c.name
--     END as item_name,
--     CASE 
--         WHEN gd.ingredient_id IS NOT NULL THEN 'ingredient'
--         WHEN gd.compound_id IS NOT NULL THEN 'compound'
--     END as item_type,
--     i.picture_url as ingredient_picture,
--     c.price as compound_price
-- FROM goods_details gd
-- LEFT JOIN ingredients i ON gd.ingredient_id = i.id AND i.deleted_at = 0
-- LEFT JOIN compounds c ON gd.compound_id = c.id AND c.deleted_at = 0
-- WHERE gd.good_id = $1 AND gd.deleted_at = 0
-- ORDER BY gd.created_at ASC;
