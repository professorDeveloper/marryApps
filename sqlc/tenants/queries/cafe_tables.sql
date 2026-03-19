-- name: CreateCafeTable :one
INSERT INTO cafe_tables (id, hall_id, number, capacity, status, pos_x, pos_y, width, height, rotation, price_per_hour)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
RETURNING id, hall_id, number, capacity, status, pos_x, pos_y, width, height, rotation, price_per_hour, created_at, updated_at, deleted_at;

-- name: GetCafeTableByID :one
SELECT id, hall_id, number, capacity, status, pos_x, pos_y, width, height, rotation, price_per_hour, created_at, updated_at, deleted_at
FROM cafe_tables
WHERE cafe_tables.id = $1 AND cafe_tables.deleted_at = 0
  AND EXISTS (
    SELECT 1 FROM halls h
    WHERE h.id = cafe_tables.hall_id
      AND h.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
  );

-- name: GetCafeTableByNumber :one
SELECT id, hall_id, number, capacity, status, pos_x, pos_y, width, height, rotation, price_per_hour, created_at, updated_at, deleted_at
FROM cafe_tables
WHERE cafe_tables.hall_id = $1 AND cafe_tables.number = $2 AND cafe_tables.deleted_at = 0
  AND EXISTS (
    SELECT 1 FROM halls h
    WHERE h.id = cafe_tables.hall_id
      AND h.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
  );

-- name: GetAllCafeTables :many
SELECT id, hall_id, number, capacity, status, pos_x, pos_y, width, height, rotation, price_per_hour, created_at, updated_at, deleted_at
FROM cafe_tables
WHERE cafe_tables.deleted_at = 0
  AND EXISTS (
    SELECT 1 FROM halls h
    WHERE h.id = cafe_tables.hall_id
      AND h.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
  )
ORDER BY hall_id ASC, number ASC
LIMIT $1 OFFSET $2;

-- name: GetCafeTablesByHallID :many
SELECT id, hall_id, number, capacity, status, pos_x, pos_y, width, height, rotation, price_per_hour, created_at, updated_at, deleted_at
FROM cafe_tables
WHERE cafe_tables.hall_id = $1 AND cafe_tables.deleted_at = 0
  AND EXISTS (
    SELECT 1 FROM halls h
    WHERE h.id = cafe_tables.hall_id
      AND h.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
  )
ORDER BY number ASC;

-- name: GetCafeTablesByStatus :many
SELECT id, hall_id, number, capacity, status, pos_x, pos_y, width, height, rotation, price_per_hour, created_at, updated_at, deleted_at
FROM cafe_tables
WHERE cafe_tables.status = $1 AND cafe_tables.deleted_at = 0
  AND EXISTS (
    SELECT 1 FROM halls h
    WHERE h.id = cafe_tables.hall_id
      AND h.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
  )
ORDER BY hall_id ASC, number ASC
LIMIT $2 OFFSET $3;

-- name: GetCafeTablesByHallAndStatus :many
SELECT id, hall_id, number, capacity, status, pos_x, pos_y, width, height, rotation, price_per_hour, created_at, updated_at, deleted_at
FROM cafe_tables
WHERE cafe_tables.hall_id = $1 AND cafe_tables.status = $2 AND cafe_tables.deleted_at = 0
  AND EXISTS (
    SELECT 1 FROM halls h
    WHERE h.id = cafe_tables.hall_id
      AND h.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
  )
ORDER BY number ASC;

-- name: GetCafeTablesByCapacity :many
SELECT id, hall_id, number, capacity, status, pos_x, pos_y, width, height, rotation, price_per_hour, created_at, updated_at, deleted_at
FROM cafe_tables
WHERE cafe_tables.capacity >= $1 AND cafe_tables.deleted_at = 0
  AND EXISTS (
    SELECT 1 FROM halls h
    WHERE h.id = cafe_tables.hall_id
      AND h.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
  )
ORDER BY capacity ASC, number ASC
LIMIT $2 OFFSET $3;

-- name: UpdateCafeTable :one
UPDATE cafe_tables
SET hall_id = COALESCE($2, hall_id),
    number = COALESCE($3, number),
    capacity = COALESCE($4, capacity),
    status = COALESCE($5, status),
    pos_x = COALESCE($6, pos_x),
    pos_y = COALESCE($7, pos_y),
    width = COALESCE($8, width),
    height = COALESCE($9, height),
    rotation = COALESCE($10, rotation),
    price_per_hour = COALESCE($11, price_per_hour),
    updated_at = NOW()
WHERE cafe_tables.id = $1 AND cafe_tables.deleted_at = 0
  AND EXISTS (
    SELECT 1 FROM halls h
    WHERE h.id = cafe_tables.hall_id
      AND h.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
  )
RETURNING id, hall_id, number, capacity, status, pos_x, pos_y, width, height, rotation, price_per_hour, created_at, updated_at, deleted_at;

-- name: UpdateCafeTableStatus :one
UPDATE cafe_tables
SET status = $2,
    updated_at = NOW()
WHERE cafe_tables.id = $1 AND cafe_tables.deleted_at = 0
  AND EXISTS (
    SELECT 1 FROM halls h
    WHERE h.id = cafe_tables.hall_id
      AND h.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
  )
RETURNING id, hall_id, number, capacity, status, pos_x, pos_y, width, height, rotation, price_per_hour, created_at, updated_at, deleted_at;

-- name: SetTableFree :one
UPDATE cafe_tables
SET status = 'free',
    updated_at = NOW()
WHERE cafe_tables.id = $1 AND cafe_tables.deleted_at = 0
  AND EXISTS (
    SELECT 1 FROM halls h
    WHERE h.id = cafe_tables.hall_id
      AND h.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
  )
RETURNING id, hall_id, number, capacity, status, pos_x, pos_y, width, height, rotation, price_per_hour, created_at, updated_at, deleted_at;

-- name: SetTableBusy :one
UPDATE cafe_tables
SET status = 'busy',
    updated_at = NOW()
WHERE cafe_tables.id = $1 AND cafe_tables.deleted_at = 0
  AND EXISTS (
    SELECT 1 FROM halls h
    WHERE h.id = cafe_tables.hall_id
      AND h.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
  )
RETURNING id, hall_id, number, capacity, status, pos_x, pos_y, width, height, rotation, price_per_hour, created_at, updated_at, deleted_at;

-- name: DeleteCafeTable :exec
UPDATE cafe_tables
SET deleted_at = EXTRACT(EPOCH FROM NOW())::BIGINT
WHERE cafe_tables.id = $1 AND cafe_tables.deleted_at = 0
  AND EXISTS (
    SELECT 1 FROM halls h
    WHERE h.id = cafe_tables.hall_id
      AND h.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
  );

-- name: RestoreCafeTable :exec
UPDATE cafe_tables
SET deleted_at = 0
WHERE cafe_tables.id = $1 AND cafe_tables.deleted_at != 0
  AND EXISTS (
    SELECT 1 FROM halls h
    WHERE h.id = cafe_tables.hall_id
      AND h.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
  );

-- name: CountCafeTables :one
SELECT COUNT(*) FROM cafe_tables
WHERE cafe_tables.deleted_at = 0
  AND EXISTS (
    SELECT 1 FROM halls h
    WHERE h.id = cafe_tables.hall_id
      AND h.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
  );

-- name: CountCafeTablesByHall :one
SELECT COUNT(*) FROM cafe_tables
WHERE cafe_tables.hall_id = $1 AND cafe_tables.deleted_at = 0
  AND EXISTS (
    SELECT 1 FROM halls h
    WHERE h.id = cafe_tables.hall_id
      AND h.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
  );

-- name: CountCafeTablesByStatus :one
SELECT COUNT(*) FROM cafe_tables
WHERE cafe_tables.status = $1 AND cafe_tables.deleted_at = 0
  AND EXISTS (
    SELECT 1 FROM halls h
    WHERE h.id = cafe_tables.hall_id
      AND h.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
  );

-- name: CountCafeTablesByHallAndStatus :one
SELECT COUNT(*) FROM cafe_tables
WHERE cafe_tables.hall_id = $1 AND cafe_tables.status = $2 AND cafe_tables.deleted_at = 0
  AND EXISTS (
    SELECT 1 FROM halls h
    WHERE h.id = cafe_tables.hall_id
      AND h.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
  );



-- name: GetCafeTableWithHall :one
SELECT 
    ct.id,
    ct.hall_id,
    ct.number,
    ct.capacity,
    ct.status,
    ct.pos_x,
    ct.pos_y,
    ct.width,
    ct.height,
    ct.rotation,
    ct.created_at,
    ct.updated_at,
    h.name as hall_name,
    h.branch_id as branch_id,
    b.name as branch_name
FROM cafe_tables ct
LEFT JOIN halls h ON ct.hall_id = h.id AND h.deleted_at = 0
LEFT JOIN branches b ON h.branch_id = b.id AND b.deleted_at = 0
WHERE ct.id = $1 AND ct.deleted_at = 0
  AND h.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid;



-- name: GetAvailableTablesByHall :many
SELECT id, hall_id, number, capacity, status, pos_x, pos_y, width, height, rotation, price_per_hour, created_at, updated_at, deleted_at
FROM cafe_tables
WHERE hall_id = $1 
AND status = 'free' 
AND cafe_tables.deleted_at = 0
AND EXISTS (
  SELECT 1 FROM halls h
  WHERE h.id = cafe_tables.hall_id
    AND h.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
)
ORDER BY number ASC;

-- name: GetAvailableTablesByCapacity :many
SELECT id, hall_id, number, capacity, status, pos_x, pos_y, width, height, rotation, price_per_hour, created_at, updated_at, deleted_at
FROM cafe_tables
WHERE capacity >= $1 
AND status = 'free' 
AND cafe_tables.deleted_at = 0
AND EXISTS (
  SELECT 1 FROM halls h
  WHERE h.id = cafe_tables.hall_id
    AND h.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
)
ORDER BY capacity ASC, number ASC
LIMIT $2 OFFSET $3;

-- name: GetAvailableTablesByHallAndCapacity :many
SELECT id, hall_id, number, capacity, status, pos_x, pos_y, width, height, rotation, price_per_hour, created_at, updated_at, deleted_at
FROM cafe_tables
WHERE hall_id = $1 
AND capacity >= $2 
AND status = 'free' 
AND cafe_tables.deleted_at = 0
AND EXISTS (
  SELECT 1 FROM halls h
  WHERE h.id = cafe_tables.hall_id
    AND h.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
)
ORDER BY capacity ASC, number ASC;

-- name: GetTableOccupancyStats :one
SELECT 
    COUNT(*) as total_tables,
    SUM(CASE WHEN status = 'free' THEN 1 ELSE 0 END) as free_tables,
    SUM(CASE WHEN status = 'busy' THEN 1 ELSE 0 END) as busy_tables,
    SUM(CASE WHEN status = 'free' THEN 1 ELSE 0 END)::FLOAT / NULLIF(COUNT(*), 0) * 100 as free_percentage,
    SUM(CASE WHEN status = 'busy' THEN 1 ELSE 0 END)::FLOAT / NULLIF(COUNT(*), 0) * 100 as busy_percentage,
    SUM(capacity) as total_capacity,
    SUM(CASE WHEN status = 'free' THEN capacity ELSE 0 END) as available_seats
FROM cafe_tables
WHERE cafe_tables.deleted_at = 0
  AND EXISTS (
    SELECT 1 FROM halls h
    WHERE h.id = cafe_tables.hall_id
      AND h.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
  );
