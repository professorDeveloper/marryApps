package model

import "time"

type CreateModifierRequest struct {
	Name        string  `json:"name" example:"Extra Cheese"`
	NameI18n    *string `json:"name_i18n,omitempty" example:"123e4567-e89b-12d3-a456-426614174000"`
	Description *string `json:"description,omitempty" example:"Add extra cheese to your pizza"`
	Code        *string `json:"code,omitempty" example:"EXTRA_CHEESE"`
	PriceDelta  *int64  `json:"price_delta,omitempty" example:"100"`
	CostDelta   *int64  `json:"cost_delta,omitempty" example:"50"`
	IsActive    bool    `json:"is_active,omitempty" example:"true"`
	PictureUrl  *string `json:"picture_url,omitempty" example:"https://example.com/image.jpg"`
}

type UpdateModifierRequest struct {
	Name        *string `json:"name,omitempty" example:"Extra Cheese"`
	NameI18n    *string `json:"name_i18n,omitempty" example:"123e4567-e89b-12d3-a456-426614174000"`
	Description *string `json:"description,omitempty" example:"Add extra cheese to your pizza"`
	Code        *string `json:"code,omitempty" example:"EXTRA_CHEESE"`
	PriceDelta  *int64  `json:"price_delta,omitempty" example:"100"`
	CostDelta   *int64  `json:"cost_delta,omitempty" example:"50"`
	IsActive    *bool   `json:"is_active,omitempty" example:"true"`
	PictureUrl  *string `json:"picture_url,omitempty" example:"https://example.com/image.jpg"`
}

type ModifierResponse struct {
	ID          string     `json:"id" example:"123e4567-e89b-12d3-a456-426614174000"`
	Name        string     `json:"name" example:"Extra Cheese"`
	NameI18n    *string    `json:"name_i18n,omitempty" example:"123e4567-e89b-12d3-a456-426614174000"`
	Description *string    `json:"description,omitempty" example:"Add extra cheese to your pizza"`
	Code        *string    `json:"code,omitempty" example:"EXTRA_CHEESE"`
	PriceDelta  *int64     `json:"price_delta,omitempty" example:"100"`
	CostDelta   *int64     `json:"cost_delta,omitempty" example:"50"`
	IsActive    bool       `json:"is_active,omitempty" example:"true"`
	PictureUrl  *string    `json:"picture_url,omitempty" example:"https://example.com/image.jpg"`
	CreatedAt   *time.Time `json:"created_at,omitempty" example:"2022-01-01T00:00:00Z"`
	UpdatedAt   *time.Time `json:"updated_at,omitempty" example:"2022-01-01T00:00:00Z"`
}
