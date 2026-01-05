package model

import "time"

// ==================== GOODS ====================

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

// ==================== GOODS DETAILS ====================

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
