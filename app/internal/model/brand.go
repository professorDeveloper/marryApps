package model

import (
	"time"

	"github.com/google/uuid"
)

type BrandResponse struct {
	ID        uuid.UUID `json:"id" example:"550e8400-e29b-41d4-a716-446655440000"`
	Name      string    `json:"name" example:"My Restaurant"`
	BrandID   string    `json:"brand_id" example:"my_restaurant"`
	CreatedAt time.Time `json:"created_at" example:"2022-01-01T00:00:00Z"`
	UpdatedAt time.Time `json:"updated_at" example:"2022-01-01T00:00:00Z"`
}

type CreateBrandRequest struct {
	Name string `json:"name" validate:"required,min=1,max=255" example:"My Restaurant"`
}

type UpdateBrandRequest struct {
	Name *string `json:"name" validate:"min=1,max=255" example:"Updated Restaurant Name"`
}

type ListBrandsResponse struct {
	Brands []BrandResponse `json:"brands"`
	Total  int32           `json:"total"`
	Limit  int32           `json:"limit"`
	Offset int32           `json:"offset"`
}
