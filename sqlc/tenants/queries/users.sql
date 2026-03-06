-- name: CreateUser :one
INSERT INTO users (
    id,
    full_name,
    username,
    role,
    email,
    shift_id,
    pincode,
    hash_password,
    brand_id,
    phone_number,
    is_active,
    branch_id,
    cash_register_id
)
VALUES (
    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11,
    COALESCE((SELECT branch_id FROM shifts WHERE id = $6), sqlc.arg(branch_id)),
    sqlc.narg('cash_register_id')::uuid
)
RETURNING *;

-- name: UpdateUser :one
UPDATE users SET
    full_name = COALESCE($2, full_name),
    username = COALESCE($3, username),
    role = COALESCE($4, role),
    email = COALESCE($5, email),
    shift_id = COALESCE($6, shift_id),
    pincode = COALESCE($7, pincode),
    hash_password = COALESCE($8, hash_password),
    brand_id = COALESCE($9, brand_id),
    phone_number = COALESCE($10, phone_number),
    is_active = COALESCE($11, is_active),
    branch_id = COALESCE(
        (SELECT branch_id FROM shifts WHERE id = COALESCE($6, shift_id)),
        branch_id
    )
WHERE users.id = $1 AND deleted_at = 0
  AND branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
RETURNING *;

-- name: UpdateUserIsActive :one
UPDATE users SET
    is_active = $2
WHERE users.id = $1 AND deleted_at = 0
  AND branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
RETURNING *;

-- name: UpdateUserPassword :one
UPDATE users SET
    hash_password = $2
WHERE users.id = $1 AND deleted_at = 0
  AND branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
RETURNING *;

-- name: UpdateUserShift :one
UPDATE users SET
    shift_id = $2,
    branch_id = (SELECT branch_id FROM shifts WHERE id = $2)
WHERE users.id = $1 AND deleted_at = 0
  AND branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
RETURNING *;

-- name: UpdateUserFCMToken :one
UPDATE users SET
    fcm_token = $2
WHERE users.id = $1 AND deleted_at = 0
  AND branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
RETURNING *;

-- name: SoftDeleteUser :one
UPDATE users SET
    deleted_at = EXTRACT(EPOCH FROM CURRENT_TIMESTAMP)::bigint
WHERE users.id = $1 AND deleted_at = 0
  AND branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
RETURNING *;

-- name: RestoreUser :one
UPDATE users SET
    deleted_at = 0
WHERE id = $1 AND deleted_at != 0
  AND branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
RETURNING *;



-- name: GetUserByID :one
SELECT * FROM users 
WHERE id = $1 AND deleted_at = 0
  AND branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid;

-- name: GetUserByUsername :one
SELECT * FROM users 
WHERE username = $1 AND deleted_at = 0;

-- name: GetUserByEmail :one
SELECT * FROM users
WHERE email = $1 AND deleted_at = 0
  AND (NULLIF(current_setting('app.branch_id', true), '') IS NULL OR branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid);

-- name: GetUserByPhoneNumber :one
SELECT * FROM users
WHERE phone_number = $1 AND deleted_at = 0
  AND (NULLIF(current_setting('app.branch_id', true), '') IS NULL OR branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid);

-- name: GetUserByPincode :one
SELECT * FROM users
WHERE pincode = $1 AND deleted_at = 0
  AND (NULLIF(current_setting('app.branch_id', true), '') IS NULL OR branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid);


-- name: GetUserWithShift :one
SELECT 
    u.id,
    u.full_name,
    u.username,
    u.role,
    u.email,
    u.pincode,
    u.brand_id,
    u.branch_id,
    u.phone_number,
    u.created_at,
    u.updated_at,
    s.id as shift_id,
    s.name as shift_name,
    s.role as shift_role,
    s.working_days as shift_working_days,
    s.open_time as shift_open_time,
    s.close_time as shift_close_time,
    s.branch_id as shift_branch_id
FROM users u
LEFT JOIN shifts s ON u.shift_id = s.id AND s.deleted_at = 0
WHERE u.id = $1 AND u.deleted_at = 0
  AND u.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid;

-- name: GetUserWithShiftAndBranch :one
SELECT 
    u.id,
    u.full_name,
    u.username,
    u.role,
    u.email,
    u.pincode,
    u.brand_id,
    u.branch_id,
    u.phone_number,
    u.created_at,
    u.updated_at,
    s.id as shift_id,
    s.name as shift_name,
    s.role as shift_role,
    s.working_days as shift_working_days,
    s.open_time as shift_open_time,
    s.close_time as shift_close_time,
    b.id as branch_id,
    b.name as branch_name,
    b.address as branch_address,
    b.phone as branch_phone
FROM users u
LEFT JOIN shifts s ON u.shift_id = s.id AND s.deleted_at = 0
LEFT JOIN branches b ON s.branch_id = b.id AND b.deleted_at = 0
WHERE u.id = $1 AND u.deleted_at = 0
  AND u.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid;

-- name: GetUserWithAttendanceStats :one
SELECT 
    u.*,
    COUNT(a.id) as total_attendances,
    SUM(a.working_hours) as total_hours_worked,
    AVG(a.working_hours) as avg_hours_per_day,
    MAX(a.open_date) as last_attendance_date
FROM users u
LEFT JOIN attendances a ON u.id = a.user_id AND a.deleted_at = 0
WHERE u.id = $1 AND u.deleted_at = 0
  AND u.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
GROUP BY u.id;



-- name: GetAllUsers :many
SELECT * FROM users 
WHERE deleted_at = 0
  AND branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
ORDER BY created_at DESC;

-- name: GetAllUsersPaginated :many
SELECT * FROM users
WHERE deleted_at = 0
  AND branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
ORDER BY created_at DESC
LIMIT $1 OFFSET $2;

-- name: GetStaffUsers :many
SELECT * FROM users
WHERE deleted_at = 0
  AND role NOT IN ('admin', 'superadmin')
  AND branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
ORDER BY full_name ASC;

-- name: GetUsersByRole :many
SELECT * FROM users 
WHERE role = $1 AND deleted_at = 0
  AND branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
ORDER BY full_name ASC;

-- name: GetUsersByRolePaginated :many
SELECT * FROM users 
WHERE role = $1 AND deleted_at = 0
  AND branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
ORDER BY full_name ASC
LIMIT $2 OFFSET $3;

-- name: GetUsersByShiftID :many
SELECT u.*
FROM users u
WHERE u.shift_id = $1 AND u.deleted_at = 0
  AND u.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
ORDER BY u.full_name ASC;

-- name: GetUsersByBrandID :many
SELECT * FROM users 
WHERE brand_id = $1 AND deleted_at = 0
  AND branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
ORDER BY full_name ASC;

-- name: CountUsers :one
SELECT COUNT(*) FROM users 
WHERE deleted_at = 0
  AND branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid;

-- name: CountUsersByRole :one
SELECT COUNT(*) FROM users 
WHERE role = $1 AND deleted_at = 0
  AND branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid;

-- name: CountUsersByShift :one
SELECT COUNT(*) FROM users 
WHERE shift_id = $1 AND deleted_at = 0
  AND branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid;



-- name: SearchUsers :many
SELECT * FROM users 
WHERE deleted_at = 0
  AND branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
AND (
    full_name ILIKE '%' || $1 || '%' OR
    username ILIKE '%' || $1 || '%' OR
    email ILIKE '%' || $1 || '%' OR
    phone_number ILIKE '%' || $1 || '%'
)
ORDER BY full_name ASC
LIMIT $2 OFFSET $3;

-- name: SearchUsersByRole :many
SELECT * FROM users 
WHERE role = $1 AND deleted_at = 0
  AND branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
AND (
    full_name ILIKE '%' || $2 || '%' OR
    username ILIKE '%' || $2 || '%' OR
    email ILIKE '%' || $2 || '%'
)
ORDER BY full_name ASC
LIMIT $3 OFFSET $4;



-- name: CreateShift :one
INSERT INTO shifts (
    id,
    name,
    role,
    working_days,
    open_time,
    close_time,
    branch_id
)
VALUES (
    $1, $2, $3, $4, $5, $6, $7
)
RETURNING *;

-- name: UpdateShift :one
UPDATE shifts SET
    name = COALESCE($2, name),
    role = COALESCE($3, role),
    working_days = COALESCE($4, working_days),
    open_time = COALESCE($5, open_time),
    close_time = COALESCE($6, close_time),
    branch_id = COALESCE($7, branch_id)
WHERE shifts.id = $1 AND deleted_at = 0
  AND branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
RETURNING *;

-- name: SoftDeleteShift :one
UPDATE shifts SET
    deleted_at = EXTRACT(EPOCH FROM CURRENT_TIMESTAMP)::bigint
WHERE shifts.id = $1 AND deleted_at = 0
  AND branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
RETURNING *;

-- name: RestoreShift :one
UPDATE shifts SET
    deleted_at = 0
WHERE shifts.id = $1 AND deleted_at != 0
  AND branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
RETURNING *;



-- name: GetShiftByID :one
SELECT * FROM shifts 
WHERE id = $1 AND deleted_at = 0
  AND branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid;

-- name: GetAllShifts :many
SELECT * FROM shifts 
WHERE deleted_at = 0
  AND branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
ORDER BY name ASC;

-- name: GetShiftsByBranchID :many
SELECT * FROM shifts 
WHERE branch_id = $1 AND deleted_at = 0
  AND branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
ORDER BY name ASC;

-- name: GetShiftsByRole :many
SELECT * FROM shifts 
WHERE role = $1 AND deleted_at = 0
  AND branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
ORDER BY name ASC;

-- name: GetShiftWithUsers :one
SELECT 
    s.*,
    COUNT(u.id) as user_count
FROM shifts s
LEFT JOIN users u ON s.id = u.shift_id AND u.deleted_at = 0
WHERE s.id = $1 AND s.deleted_at = 0
  AND s.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
GROUP BY s.id;

-- name: GetShiftsWithUserCounts :many
SELECT 
    s.*,
    COUNT(u.id) as user_count
FROM shifts s
LEFT JOIN users u ON s.id = u.shift_id AND u.deleted_at = 0
WHERE s.deleted_at = 0
  AND s.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
GROUP BY s.id
ORDER BY s.name ASC;



-- name: CreateAttendance :one
INSERT INTO attendances (
    id,
    user_id,
    open_date,
    close_date,
    difference,
    working_hours,
    branch_id
)
VALUES (
    $1, $2, $3, $4, $5, $6,
    (SELECT branch_id FROM users WHERE id = $2)
)
RETURNING *;

-- name: UpdateAttendance :one
UPDATE attendances SET
    open_date = COALESCE($2, open_date),
    close_date = COALESCE($3, close_date),
    difference = COALESCE($4, difference),
    working_hours = COALESCE($5, working_hours)
WHERE id = $1 AND deleted_at = 0
  AND branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
RETURNING *;

-- name: CloseAttendance :one
UPDATE attendances SET
    close_date = $2,
    difference = $3,
    working_hours = $4
WHERE id = $1 AND deleted_at = 0
  AND branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
RETURNING *;

-- name: SoftDeleteAttendance :one
UPDATE attendances SET
    deleted_at = EXTRACT(EPOCH FROM CURRENT_TIMESTAMP)::bigint
WHERE id = $1 AND deleted_at = 0
  AND branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
RETURNING *;



-- name: GetAttendanceByID :one
SELECT * FROM attendances 
WHERE id = $1 AND deleted_at = 0
  AND branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid;

-- name: GetAttendancesByUserID :many
SELECT * FROM attendances 
WHERE user_id = $1 AND deleted_at = 0
  AND branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
ORDER BY open_date DESC;

-- name: GetAttendancesByUserIDPaginated :many
SELECT * FROM attendances 
WHERE user_id = $1 AND deleted_at = 0
  AND branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
ORDER BY open_date DESC
LIMIT $2 OFFSET $3;

-- name: GetAttendancesByDateRange :many
SELECT a.*, u.full_name, u.username, u.role
FROM attendances a
JOIN users u ON a.user_id = u.id AND u.deleted_at = 0
WHERE a.open_date >= $1 
AND a.open_date <= $2 
AND a.deleted_at = 0
AND a.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
ORDER BY a.open_date DESC;

-- name: GetOpenAttendancesByUserID :one
SELECT * FROM attendances 
WHERE user_id = $1 
AND close_date IS NULL 
AND deleted_at = 0
AND branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
ORDER BY open_date DESC
LIMIT 1;

-- name: GetAttendancesForToday :many
SELECT a.*, u.full_name, u.username, u.role
FROM attendances a
JOIN users u ON a.user_id = u.id AND u.deleted_at = 0
WHERE a.open_date = CURRENT_DATE 
AND a.deleted_at = 0
AND a.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
ORDER BY a.open_date DESC;



-- name: GetUserAttendanceStats :one
SELECT 
    user_id,
    COUNT(*) as total_days,
    SUM(working_hours) as total_hours,
    AVG(working_hours) as avg_hours_per_day,
    MIN(open_date) as first_attendance,
    MAX(open_date) as last_attendance
FROM attendances
WHERE user_id = $1 AND deleted_at = 0
  AND branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
GROUP BY user_id;

-- name: GetUserAttendanceStatsByDateRange :one
SELECT 
    user_id,
    COUNT(*) as total_days,
    SUM(working_hours) as total_hours,
    AVG(working_hours) as avg_hours_per_day,
    MIN(open_date) as first_attendance,
    MAX(open_date) as last_attendance
FROM attendances
WHERE user_id = $1 
AND open_date >= $2 
AND open_date <= $3 
AND deleted_at = 0
AND branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
GROUP BY user_id;

-- name: GetAttendanceStatsByRole :many
SELECT 
    u.role,
    COUNT(a.id) as total_attendances,
    SUM(a.working_hours) as total_hours,
    AVG(a.working_hours) as avg_hours_per_day,
    COUNT(DISTINCT a.user_id) as unique_users
FROM attendances a
JOIN users u ON a.user_id = u.id AND u.deleted_at = 0
WHERE a.open_date >= $1 
AND a.open_date <= $2 
AND a.deleted_at = 0
AND a.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
GROUP BY u.role
ORDER BY total_hours DESC;

-- name: GetDailyAttendanceSummary :many
SELECT 
    a.open_date,
    COUNT(a.id) as total_attendances,
    SUM(a.working_hours) as total_hours,
    AVG(a.working_hours) as avg_hours,
    COUNT(DISTINCT a.user_id) as unique_users
FROM attendances a
WHERE a.open_date >= $1 
AND a.open_date <= $2 
AND a.deleted_at = 0
AND a.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
GROUP BY a.open_date
ORDER BY a.open_date DESC;
