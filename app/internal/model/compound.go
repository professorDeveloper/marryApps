package model

import "time"

type CreateCompoundRequest struct {
	Name            string  `json:"name" binding:"required" example:"Pizza Dough"`
	NameI18n        *string `json:"name_i18n,omitempty" example:"123e4567-e89b-12d3-a456-426614174000"`
	Description     *string `json:"description,omitempty" example:"Base dough for all pizzas"`
	DescriptionI18n *string `json:"description_i18n,omitempty" example:"123e4567-e89b-12d3-a456-426614174000"`
	Quantity        int64   `json:"quantity" example:"10"`
	Measurement     *string `json:"measurement,omitempty" example:"kg"`
	PictureUrl      *string `json:"picture_url,omitempty" example:"https://example.com/pizza-dough.jpg"`
	ColorCode       *string `json:"color_code,omitempty" example:"#FF5733"`
	DepartmentID    *string `json:"department_id,omitempty" example:"123e4567-e89b-12d3-a456-426614174000"`
}

type UpdateCompoundRequest struct {
	Name            *string `json:"name,omitempty" example:"Pizza Dough"`
	NameI18n        *string `json:"name_i18n,omitempty" example:"123e4567-e89b-12d3-a456-426614174000"`
	Description     *string `json:"description,omitempty" example:"Base dough for all pizzas"`
	DescriptionI18n *string `json:"description_i18n,omitempty" example:"123e4567-e89b-12d3-a456-426614174000"`
	Quantity        *int64  `json:"quantity,omitempty" example:"10"`
	Measurement     *string `json:"measurement,omitempty" example:"kg"`
	PictureUrl      *string `json:"picture_url,omitempty" example:"https://example.com/pizza-dough.jpg"`
	ColorCode       *string `json:"color_code,omitempty" example:"#FF5733"`
	DepartmentID    *string `json:"department_id,omitempty" example:"123e4567-e89b-12d3-a456-426614174000"`
}

type CompoundResponse struct {
	ID              string  `json:"id" example:"123e4567-e89b-12d3-a456-426614174000"`
	Name            string  `json:"name" example:"Pizza Dough"`
	NameI18n        *string `json:"name_i18n,omitempty" example:"123e4567-e89b-12d3-a456-426614174000"`
	Description     *string `json:"description,omitempty" example:"Base dough for all pizzas"`
	DescriptionI18n *string `json:"description_i18n,omitempty" example:"123e4567-e89b-12d3-a456-426614174000"`
	Quantity        int64   `json:"quantity" example:"10"`
	Measurement     *string `json:"measurement,omitempty" example:"kg"`
	PictureUrl      *string `json:"picture_url,omitempty" example:"https://example.com/pizza-dough.jpg"`
	ColorCode       *string `json:"color_code,omitempty" example:"#FF5733"`
	// Price - total component cost (auto-calculated from calculations)
	Price        *string    `json:"price,omitempty" example:"500.50"`
	DepartmentID *string    `json:"department_id,omitempty" example:"123e4567-e89b-12d3-a456-426614174000"`
	CreatedAt    *time.Time `json:"created_at,omitempty" example:"2022-01-01T00:00:00Z"`
	UpdatedAt    *time.Time `json:"updated_at,omitempty" example:"2022-01-01T00:00:00Z"`
}

type CreateCompoundDetailRequest struct {
	CompoundID   string `json:"compound_id" binding:"required" example:"123e4567-e89b-12d3-a456-426614174000"`
	IngredientID string `json:"ingredient_id" binding:"required" example:"123e4567-e89b-12d3-a456-426614174000"`
	Quantity     int64  `json:"quantity" example:"500"`
}

type UpdateCompoundDetailRequest struct {
	CompoundID   *string `json:"compound_id,omitempty" example:"123e4567-e89b-12d3-a456-426614174000"`
	IngredientID *string `json:"ingredient_id,omitempty" example:"123e4567-e89b-12d3-a456-426614174000"`
	Quantity     *int64  `json:"quantity,omitempty" example:"500"`
}

type CompoundDetailResponse struct {
	ID           string     `json:"id" example:"123e4567-e89b-12d3-a456-426614174000"`
	CompoundID   string     `json:"compound_id" example:"123e4567-e89b-12d3-a456-426614174000"`
	IngredientID string     `json:"ingredient_id" example:"123e4567-e89b-12d3-a456-426614174000"`
	Quantity     int64      `json:"quantity" example:"500"`
	CreatedAt    *time.Time `json:"created_at,omitempty" example:"2022-01-01T00:00:00Z"`
	UpdatedAt    *time.Time `json:"updated_at,omitempty" example:"2022-01-01T00:00:00Z"`
}

// ==================== COMPOUND STOCK ====================

type CreateCompoundStockRequest struct {
	CompoundID string `json:"compound_id" binding:"required" example:"123e4567-e89b-12d3-a456-426614174000"`
	Quantity   int64  `json:"quantity" example:"100"`
	BranchID   string `json:"branch_id" binding:"required" example:"123e4567-e89b-12d3-a456-426614174000"`
}

type UpdateCompoundStockRequest struct {
	Quantity *int64 `json:"quantity,omitempty" example:"100"`
}

type AddToCompoundStockRequest struct {
	Quantity int64 `json:"quantity" binding:"required,gt=0" example:"50"`
}

type RemoveFromCompoundStockRequest struct {
	Quantity int64 `json:"quantity" binding:"required,gt=0" example:"50"`
}

type CompoundStockResponse struct {
	ID         string     `json:"id" example:"123e4567-e89b-12d3-a456-426614174000"`
	CompoundID string     `json:"compound_id" example:"123e4567-e89b-12d3-a456-426614174000"`
	Quantity   int64      `json:"quantity" example:"100"`
	BranchID   string     `json:"branch_id" example:"123e4567-e89b-12d3-a456-426614174000"`
	CreatedAt  *time.Time `json:"created_at,omitempty" example:"2022-01-01T00:00:00Z"`
	UpdatedAt  *time.Time `json:"updated_at,omitempty" example:"2022-01-01T00:00:00Z"`
}
