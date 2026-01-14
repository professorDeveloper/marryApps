package model

import "time"

type CreateGoodRequest struct {
	Name            string  `json:"name" binding:"required" example:"Pizza Margherita"`
	Description     *string `json:"description,omitempty" example:"Classic Italian pizza with tomatoes and mozzarella"`
	NameI18n        *string `json:"name_i18n,omitempty" example:"123e4567-e89b-12d3-a456-426614174000"`
	DescriptionI18n *string `json:"description_i18n,omitempty" example:"123e4567-e89b-12d3-a456-426614174000"`
	CategoryID      *string `json:"category_id,omitempty" example:"123e4567-e89b-12d3-a456-426614174000"`
	DepartmentID    *string `json:"department_id,omitempty" example:"123e4567-e89b-12d3-a456-426614174000"`
	PictureUrl      *string `json:"picture_url,omitempty" example:"https://example.com/pizza-margherita.jpg"`
	ColorCode       *string `json:"color_code,omitempty" example:"#FF5733"`
	Price           string  `json:"price" binding:"required" example:"15000.00"`
	CookTime        *int32  `json:"cook_time,omitempty" example:"30"`
}

type UpdateGoodRequest struct {
	Name            *string `json:"name,omitempty" example:"Pizza Margherita"`
	Description     *string `json:"description,omitempty" example:"Classic Italian pizza with tomatoes and mozzarella"`
	NameI18n        *string `json:"name_i18n,omitempty" example:"123e4567-e89b-12d3-a456-426614174000"`
	DescriptionI18n *string `json:"description_i18n,omitempty" example:"123e4567-e89b-12d3-a456-426614174000"`
	CategoryID      *string `json:"category_id,omitempty" example:"123e4567-e89b-12d3-a456-426614174000"`
	DepartmentID    *string `json:"department_id,omitempty" example:"123e4567-e89b-12d3-a456-426614174000"`
	PictureUrl      *string `json:"picture_url,omitempty" example:"https://example.com/pizza-margherita.jpg"`
	ColorCode       *string `json:"color_code,omitempty" example:"#FF5733"`
	Price           *string `json:"price,omitempty" example:"15000.00"`
	CookTime        *int32  `json:"cook_time,omitempty" example:"30"`
}

type UpdateGoodPriceRequest struct {
	Price string `json:"price" binding:"required" example:"15000.00"`
}

type GoodResponse struct {
	ID              string     `json:"id" example:"123e4567-e89b-12d3-a456-426614174000"`
	Name            string     `json:"name" example:"Pizza Margherita"`
	Description     *string    `json:"description,omitempty" example:"Classic Italian pizza with tomatoes and mozzarella"`
	NameI18n        *string    `json:"name_i18n,omitempty" example:"123e4567-e89b-12d3-a456-426614174000"`
	DescriptionI18n *string    `json:"description_i18n,omitempty" example:"123e4567-e89b-12d3-a456-426614174000"`
	CategoryID      *string    `json:"category_id,omitempty" example:"123e4567-e89b-12d3-a456-426614174000"`
	DepartmentID    *string    `json:"department_id,omitempty" example:"123e4567-e89b-12d3-a456-426614174000"`
	PictureUrl      *string    `json:"picture_url,omitempty" example:"https://example.com/pizza-margherita.jpg"`
	ColorCode       *string    `json:"color_code,omitempty" example:"#FF5733"`
	Price           string     `json:"price" example:"15000.00"`
	CookTime        *int32     `json:"cook_time,omitempty" example:"30"`
	CreatedAt       *time.Time `json:"created_at,omitempty" example:"2022-01-01T00:00:00Z"`
	UpdatedAt       *time.Time `json:"updated_at,omitempty" example:"2022-01-01T00:00:00Z"`
}

type CreateGoodDetailRequest struct {
	GoodID       string  `json:"good_id" binding:"required" example:"123e4567-e89b-12d3-a456-426614174000"`
	IngredientID *string `json:"ingredient_id,omitempty" example:"123e4567-e89b-12d3-a456-426614174000"`
	CompoundID   *string `json:"compound_id,omitempty" example:"123e4567-e89b-12d3-a456-426614174000"`
	Measurement  *string `json:"measurement,omitempty" example:"kg"`
	Quantity     int64   `json:"quantity" binding:"required" example:"250"`
}

type UpdateGoodDetailRequest struct {
	GoodID       *string `json:"good_id,omitempty" example:"123e4567-e89b-12d3-a456-426614174000"`
	IngredientID *string `json:"ingredient_id,omitempty" example:"123e4567-e89b-12d3-a456-426614174000"`
	CompoundID   *string `json:"compound_id,omitempty" example:"123e4567-e89b-12d3-a456-426614174000"`
	Measurement  *string `json:"measurement,omitempty" example:"kg"`
	Quantity     *int64  `json:"quantity,omitempty" example:"250"`
}

type UpdateGoodDetailQuantityRequest struct {
	Quantity int64 `json:"quantity" binding:"required" example:"250"`
}

type GoodDetailResponse struct {
	ID           string     `json:"id" example:"123e4567-e89b-12d3-a456-426614174000"`
	GoodID       string     `json:"good_id" example:"123e4567-e89b-12d3-a456-426614174000"`
	IngredientID *string    `json:"ingredient_id,omitempty" example:"123e4567-e89b-12d3-a456-426614174000"`
	CompoundID   *string    `json:"compound_id,omitempty" example:"123e4567-e89b-12d3-a456-426614174000"`
	Measurement  *string    `json:"measurement,omitempty" example:"kg"`
	Quantity     int64      `json:"quantity" example:"250"`
	CreatedAt    *time.Time `json:"created_at,omitempty" example:"2022-01-01T00:00:00Z"`
	UpdatedAt    *time.Time `json:"updated_at,omitempty" example:"2022-01-01T00:00:00Z"`
}

// Calculation models for ingredient composition and cost
type CreateCalculationRequest struct {
	GoodID          *string `json:"good_id,omitempty" example:"123e4567-e89b-12d3-a456-426614174000"`
	CompoundID      *string `json:"compound_id,omitempty" example:"123e4567-e89b-12d3-a456-426614174000"`
	IngredientID    *string `json:"ingredient_id,omitempty" example:"123e4567-e89b-12d3-a456-426614174000"`
	CompoundToAddID *string `json:"compound_to_add_id,omitempty" example:"123e4567-e89b-12d3-a456-426614174000"`
	Quantity        string  `json:"quantity" binding:"required" example:"900"`
}

// CreateGoodCalculationRequest - add ingredient or compound to a good
type CreateGoodCalculationRequest struct {
	GoodID          string  `json:"good_id" binding:"required" example:"123e4567-e89b-12d3-a456-426614174000"`
	IngredientID    *string `json:"ingredient_id,omitempty" example:"123e4567-e89b-12d3-a456-426614174000"`
	CompoundToAddID *string `json:"compound_to_add_id,omitempty" example:"123e4567-e89b-12d3-a456-426614174000"`
	Quantity        string  `json:"quantity" binding:"required" example:"900"`
}

// CreateCompoundCalculationRequest - add ingredient or child compound to a compound
type CreateCompoundCalculationRequest struct {
	CompoundID      string  `json:"compound_id" binding:"required" example:"123e4567-e89b-12d3-a456-426614174000"`
	IngredientID    *string `json:"ingredient_id,omitempty" example:"123e4567-e89b-12d3-a456-426614174000"`
	CompoundToAddID *string `json:"compound_to_add_id,omitempty" example:"123e4567-e89b-12d3-a456-426614174000"`
	Quantity        string  `json:"quantity" binding:"required" example:"900"`
}

type GetCalculationsRequest struct {
	GoodID     string `json:"good_id,omitempty" example:"123e4567-e89b-12d3-a456-426614174000"`
	CompoundID string `json:"compound_id,omitempty" example:"123e4567-e89b-12d3-a456-426614174000"`
}

type UpdateCalculationRequest struct {
	Quantity *string `json:"quantity,omitempty" binding:"required" example:"2.5"`
}

type CalculationResponse struct {
	ID                  string     `json:"id" example:"123e4567-e89b-12d3-a456-426614174000"`
	GoodID              *string    `json:"good_id,omitempty" example:"123e4567-e89b-12d3-a456-426614174000"`
	CompoundID          *string    `json:"compound_id,omitempty" example:"123e4567-e89b-12d3-a456-426614174000"`
	IngredientID        string     `json:"ingredient_id" example:"123e4567-e89b-12d3-a456-426614174000"`
	ComponentCompoundID *string    `json:"component_compound_id,omitempty" example:"123e4567-e89b-12d3-a456-426614174000"`
	Quantity            string     `json:"quantity" example:"0.2"`
	MeasurementUnit     string     `json:"measurement_unit" example:"kg"`
	PricePerUnit        string     `json:"price_per_unit" example:"20000"`
	TotalCost           string     `json:"total_cost" example:"4000"`
	CreatedAt           *time.Time `json:"created_at,omitempty" example:"2022-01-01T00:00:00Z"`
	UpdatedAt           *time.Time `json:"updated_at,omitempty" example:"2022-01-01T00:00:00Z"`
}

type GoodCalculationResponse struct {
	ID           string                `json:"id" example:"123e4567-e89b-12d3-a456-426614174000"`
	Name         string                `json:"name" example:"Pizza Margherita"`
	Price        string                `json:"price" example:"15000.00"`
	Calculations []CalculationResponse `json:"calculations"`
	TotalCost    string                `json:"total_cost" example:"10500"`
	Profit       string                `json:"profit" example:"4500"`
	ProfitMargin string                `json:"profit_margin" example:"30%"`
}

type CompoundCalculationResponse struct {
	ID           string                `json:"id" example:"123e4567-e89b-12d3-a456-426614174000"`
	Name         string                `json:"name" example:"Tomato Sauce"`
	Price        string                `json:"price" example:"5000.00"`
	Calculations []CalculationResponse `json:"calculations"`
	TotalCost    string                `json:"total_cost" example:"3000"`
	Profit       string                `json:"profit" example:"2000"`
	ProfitMargin string                `json:"profit_margin" example:"40%"`
}
