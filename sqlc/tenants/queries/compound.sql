-- name: CreateCompound :one
INSERT INTO compounds (id, name, name_i18n, description, description_i18n, quantity, picture_url, color_code, measurement, price, department_id)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
RETURNING id, name, name_i18n, description, description_i18n, quantity, picture_url, color_code, measurement, price, department_id, cost_price, profit, profit_margin, created_at, updated_at, deleted_at;

-- name: GetCompoundByID :one
SELECT id, name, name_i18n, description, description_i18n, quantity, picture_url, color_code, measurement, price, department_id, cost_price, profit, profit_margin, created_at, updated_at, deleted_at
FROM compounds
WHERE id = $1 AND deleted_at = 0;

-- name: GetAllCompounds :many
SELECT id, name, name_i18n, description, description_i18n, quantity, picture_url, color_code, measurement, price, department_id, cost_price, profit, profit_margin, created_at, updated_at, deleted_at
FROM compounds
WHERE deleted_at = 0
ORDER BY created_at DESC
LIMIT $1 OFFSET $2;

-- name: GetCompoundsByDepartmentID :many
SELECT id, name, name_i18n, description, description_i18n, quantity, picture_url, color_code, measurement, price, department_id, cost_price, profit, profit_margin, created_at, updated_at, deleted_at
FROM compounds
WHERE department_id = $1 AND deleted_at = 0
ORDER BY created_at DESC
LIMIT $2 OFFSET $3;

-- name: UpdateCompound :one
UPDATE compounds
SET name = COALESCE($2, name),
    name_i18n = COALESCE($3, name_i18n),
    description = COALESCE($4, description),
    description_i18n = COALESCE($5, description_i18n),
    quantity = COALESCE($6, quantity),
    picture_url = COALESCE($7, picture_url),
    color_code = COALESCE($8, color_code),
    measurement = COALESCE($9, measurement),
    price = COALESCE($10, price),
    department_id = COALESCE($11, department_id),
    updated_at = NOW()
WHERE id = $1 AND deleted_at = 0
RETURNING id, name, name_i18n, description, description_i18n, quantity, picture_url, color_code, measurement, price, department_id, cost_price, profit, profit_margin, created_at, updated_at, deleted_at;

-- name: UpdateCompoundPrice :one
UPDATE compounds
SET price = $2,
    updated_at = NOW()
WHERE id = $1 AND deleted_at = 0
RETURNING id, name, name_i18n, description, description_i18n, quantity, picture_url, color_code, measurement, price, department_id, cost_price, profit, profit_margin, created_at, updated_at, deleted_at;

-- name: UpdateCompoundCostFields :one
UPDATE compounds
SET cost_price = $2,
    profit = $3,
    profit_margin = $4,
    updated_at = NOW()
WHERE id = $1 AND deleted_at = 0
RETURNING id, name, name_i18n, description, description_i18n, quantity, picture_url, color_code, measurement, price, department_id, cost_price, profit, profit_margin, created_at, updated_at, deleted_at;

-- name: DeleteCompound :exec
UPDATE compounds
SET deleted_at = EXTRACT(EPOCH FROM NOW())::BIGINT
WHERE id = $1 AND deleted_at = 0;

-- name: RestoreCompound :exec
UPDATE compounds
SET deleted_at = 0
WHERE id = $1 AND deleted_at != 0;

-- name: SearchCompounds :many
SELECT id, name, name_i18n, description, description_i18n, quantity, picture_url, color_code, measurement, price, department_id, cost_price, profit, profit_margin, created_at, updated_at, deleted_at
FROM compounds
WHERE deleted_at = 0 
AND (name ILIKE '%' || $1 || '%' OR description ILIKE '%' || $1 || '%')
ORDER BY created_at DESC
LIMIT $2 OFFSET $3;

-- name: CountCompounds :one
SELECT COUNT(*) FROM compounds WHERE deleted_at = 0;

-- name: CountCompoundsByDepartment :one
SELECT COUNT(*) FROM compounds WHERE department_id = $1 AND deleted_at = 0;

-- name: GetCompoundWithDepartment :one
SELECT 
    c.id,
    c.name,
    c.name_i18n,
    c.description,
    c.description_i18n,
    c.quantity,
    c.picture_url,
    c.measurement,
    c.price,
    c.department_id,
    c.cost_price,
    c.profit,
    c.profit_margin,
    c.created_at,
    c.updated_at,
    d.name as department_name
FROM compounds c
LEFT JOIN departments d ON c.department_id = d.id AND d.deleted_at = 0
WHERE c.id = $1 AND c.deleted_at = 0;



-- Compound details queries -----------------------------------------------------------

-- name: CreateCompoundDetail :one
INSERT INTO compounds_details (id, compound_id, ingredient_id, quantity)
VALUES ($1, $2, $3, $4)
RETURNING id, compound_id, ingredient_id, quantity, created_at, updated_at, deleted_at;

-- name: GetCompoundDetailByID :one
SELECT id, compound_id, ingredient_id, quantity, created_at, updated_at, deleted_at
FROM compounds_details
WHERE id = $1 AND deleted_at = 0;

-- name: GetAllCompoundDetails :many
SELECT id, compound_id, ingredient_id, quantity, created_at, updated_at, deleted_at
FROM compounds_details
WHERE deleted_at = 0
ORDER BY created_at DESC
LIMIT $1 OFFSET $2;

-- name: GetCompoundDetailsByCompoundID :many
SELECT id, compound_id, ingredient_id, quantity, created_at, updated_at, deleted_at
FROM compounds_details
WHERE compound_id = $1 AND deleted_at = 0
ORDER BY created_at DESC;

-- name: GetCompoundDetailsByIngredientID :many
SELECT id, compound_id, ingredient_id, quantity, created_at, updated_at, deleted_at
FROM compounds_details
WHERE ingredient_id = $1 AND deleted_at = 0
ORDER BY created_at DESC
LIMIT $2 OFFSET $3;

-- name: UpdateCompoundDetail :one
UPDATE compounds_details
SET compound_id = COALESCE($2, compound_id),
    ingredient_id = COALESCE($3, ingredient_id),
    quantity = COALESCE($4, quantity),
    updated_at = NOW()
WHERE id = $1 AND deleted_at = 0
RETURNING id, compound_id, ingredient_id, quantity, created_at, updated_at, deleted_at;

-- name: DeleteCompoundDetail :exec
UPDATE compounds_details
SET deleted_at = EXTRACT(EPOCH FROM NOW())::BIGINT
WHERE id = $1 AND deleted_at = 0;

-- name: RestoreCompoundDetail :exec
UPDATE compounds_details
SET deleted_at = 0
WHERE id = $1 AND deleted_at != 0;

-- name: DeleteCompoundDetailsByCompoundID :exec
UPDATE compounds_details
SET deleted_at = EXTRACT(EPOCH FROM NOW())::BIGINT
WHERE compound_id = $1 AND deleted_at = 0;

-- name: CountCompoundDetails :one
SELECT COUNT(*) FROM compounds_details WHERE deleted_at = 0;

-- name: CountCompoundDetailsByCompound :one
SELECT COUNT(*) FROM compounds_details WHERE compound_id = $1 AND deleted_at = 0;

-- name: GetCompoundDetailWithIngredient :one
SELECT 
    cd.id,
    cd.compound_id,
    cd.ingredient_id,
    cd.quantity,
    cd.created_at,
    cd.updated_at,
    i.name as ingredient_name,
    i.measurement as ingredient_measurement
FROM compounds_details cd
LEFT JOIN ingredients i ON cd.ingredient_id = i.id AND i.deleted_at = 0
WHERE cd.id = $1 AND cd.deleted_at = 0;

-- name: GetCompoundDetailsWithIngredients :many
SELECT 
    cd.id,
    cd.compound_id,
    cd.ingredient_id,
    cd.quantity,
    cd.created_at,
    cd.updated_at,
    i.name as ingredient_name,
    i.measurement as ingredient_measurement,
    i.picture_url as ingredient_picture
FROM compounds_details cd
LEFT JOIN ingredients i ON cd.ingredient_id = i.id AND i.deleted_at = 0
WHERE cd.compound_id = $1 AND cd.deleted_at = 0
ORDER BY cd.created_at DESC;


--    compound stock queries ----------------------------------------------------

-- name: CreateCompoundStock :one
INSERT INTO compound_stock (id, compound_id, quantity, branch_id)
VALUES ($1, $2, $3, $4)
RETURNING id, compound_id, quantity, branch_id, created_at, updated_at, deleted_at;

-- name: GetCompoundStockByID :one
SELECT id, compound_id, quantity, branch_id, created_at, updated_at, deleted_at
FROM compound_stock
WHERE id = $1 AND deleted_at = 0;

-- name: GetStockByCompoundAndBranch :one
SELECT id, compound_id, quantity, branch_id, created_at, updated_at, deleted_at
FROM compound_stock
WHERE compound_id = $1 AND branch_id = $2 AND deleted_at = 0;

-- name: GetAllCompoundStock :many
SELECT id, compound_id, quantity, branch_id, created_at, updated_at, deleted_at
FROM compound_stock
WHERE deleted_at = 0
ORDER BY created_at DESC
LIMIT $1 OFFSET $2;

-- name: GetCompoundStockByBranchID :many
SELECT id, compound_id, quantity, branch_id, created_at, updated_at, deleted_at
FROM compound_stock
WHERE branch_id = $1 AND deleted_at = 0
ORDER BY created_at DESC
LIMIT $2 OFFSET $3;

-- name: GetCompoundStockByCompoundID :many
SELECT id, compound_id, quantity, branch_id, created_at, updated_at, deleted_at
FROM compound_stock
WHERE compound_id = $1 AND deleted_at = 0
ORDER BY created_at DESC
LIMIT $2 OFFSET $3;

-- name: UpdateCompoundStock :one
UPDATE compound_stock
SET quantity = COALESCE($2, quantity),
    updated_at = NOW()
WHERE id = $1 AND deleted_at = 0
RETURNING id, compound_id, quantity, branch_id, created_at, updated_at, deleted_at;

-- name: AddToCompoundStock :one
UPDATE compound_stock
SET quantity = quantity + $2,
    updated_at = NOW()
WHERE id = $1 AND deleted_at = 0
RETURNING id, compound_id, quantity, branch_id, created_at, updated_at, deleted_at;

-- name: RemoveFromCompoundStock :one
UPDATE compound_stock
SET quantity = CASE 
    WHEN quantity - $2 < 0 THEN 0 
    ELSE quantity - $2 
END,
    updated_at = NOW()
WHERE id = $1 AND deleted_at = 0
RETURNING id, compound_id, quantity, branch_id, created_at, updated_at, deleted_at;

-- name: DeleteCompoundStock :exec
UPDATE compound_stock
SET deleted_at = EXTRACT(EPOCH FROM NOW())::BIGINT
WHERE id = $1 AND deleted_at = 0;

-- name: RestoreCompoundStock :exec
UPDATE compound_stock
SET deleted_at = 0
WHERE id = $1 AND deleted_at != 0;

-- name: CountCompoundStock :one
SELECT COUNT(*) FROM compound_stock WHERE deleted_at = 0;

-- name: CountCompoundStockByBranch :one
SELECT COUNT(*) FROM compound_stock WHERE branch_id = $1 AND deleted_at = 0;

-- name: CountCompoundStockByCompound :one
SELECT COUNT(*) FROM compound_stock WHERE compound_id = $1 AND deleted_at = 0;


-- joined queries  -----------------------------------------------------

-- name: GetCompoundStockWithDetails :one
SELECT 
    cs.id,
    cs.compound_id,
    cs.quantity,
    cs.branch_id,
    cs.created_at,
    cs.updated_at,
    c.name as compound_name,
    c.measurement as compound_measurement,
    c.price as compound_price,
    b.name as branch_name
FROM compound_stock cs
LEFT JOIN compounds c ON cs.compound_id = c.id AND c.deleted_at = 0
LEFT JOIN branches b ON cs.branch_id = b.id AND b.deleted_at = 0
WHERE cs.id = $1 AND cs.deleted_at = 0;

-- name: GetCompoundStocksWithDetails :many
SELECT 
    cs.id,
    cs.compound_id,
    cs.quantity,
    cs.branch_id,
    cs.created_at,
    cs.updated_at,
    c.name as compound_name,
    c.measurement as compound_measurement,
    c.price as compound_price,
    b.name as branch_name
FROM compound_stock cs
LEFT JOIN compounds c ON cs.compound_id = c.id AND c.deleted_at = 0
LEFT JOIN branches b ON cs.branch_id = b.id AND b.deleted_at = 0
WHERE cs.branch_id = $1 AND cs.deleted_at = 0
ORDER BY cs.created_at DESC
LIMIT $2 OFFSET $3;

-- name: GetCompoundWithIngredients :one
SELECT 
    c.id,
    c.name,
    c.description,
    c.measurement,
    c.price,
    c.department_id,
    COUNT(cd.id) as ingredient_count,
    SUM(cd.quantity) as total_ingredient_quantity
FROM compounds c
LEFT JOIN compounds_details cd ON c.id = cd.compound_id AND cd.deleted_at = 0
WHERE c.id = $1 AND c.deleted_at = 0
GROUP BY c.id, c.name, c.description, c.measurement, c.price, c.department_id;

-- name: GetCompoundStockSummary :many
SELECT 
    c.id as compound_id,
    c.name as compound_name,
    c.measurement,
    c.price,
    SUM(cs.quantity) as total_quantity,
    COUNT(DISTINCT cs.branch_id) as branch_count,
    AVG(cs.quantity) as avg_quantity_per_branch
FROM compounds c
LEFT JOIN compound_stock cs ON c.id = cs.compound_id AND cs.deleted_at = 0
WHERE c.deleted_at = 0
GROUP BY c.id, c.name, c.measurement, c.price
ORDER BY total_quantity DESC
LIMIT $1 OFFSET $2;

-- name: GetLowStockCompounds :many
SELECT 
    cs.id,
    cs.compound_id,
    cs.quantity,
    cs.branch_id,
    c.name as compound_name,
    c.measurement,
    b.name as branch_name
FROM compound_stock cs
LEFT JOIN compounds c ON cs.compound_id = c.id AND c.deleted_at = 0
LEFT JOIN branches b ON cs.branch_id = b.id AND b.deleted_at = 0
WHERE cs.quantity < $1 AND cs.deleted_at = 0
ORDER BY cs.quantity ASC
LIMIT $2 OFFSET $3;

-- name: GetCompoundIngredientBreakdown :many
SELECT 
    cd.compound_id,
    c.name as compound_name,
    cd.ingredient_id,
    i.name as ingredient_name,
    cd.quantity as required_quantity,
    i.measurement,
    COALESCE(iss.quantity, 0) as available_quantity
FROM compounds_details cd
LEFT JOIN compounds c ON cd.compound_id = c.id AND c.deleted_at = 0
LEFT JOIN ingredients i ON cd.ingredient_id = i.id AND i.deleted_at = 0
LEFT JOIN ingredient_stock iss ON cd.ingredient_id = iss.ingredient_id 
    AND iss.branch_id = $2 
    AND iss.deleted_at = 0
WHERE cd.compound_id = $1 AND cd.deleted_at = 0
ORDER BY cd.created_at ASC;