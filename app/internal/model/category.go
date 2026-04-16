package model

import "time"

type CreateCategoryRequest struct {
	Name         string  `json:"name" example:"Appetizers"`
	NameI18n     *string `json:"name_i18n,omitempty" example:"123e4567-e89b-12d3-a456-426614174000"`
	PictureUrl   *string `json:"picture_url,omitempty" example:"https://example.com/image.jpg"`
	ColorCode    *string `json:"color_code,omitempty" example:"#FF5733"`
	DepartmentID *string `json:"department_id,omitempty" example:"123e4567-e89b-12d3-a456-426614174000"`
	Parent       *string `json:"parent,omitempty" example:"123e4567-e89b-12d3-a456-426614174000"`
}

type UpdateCategoryRequest struct {
	Name         *string `json:"name,omitempty" example:"Appetizers"`
	NameI18n     *string `json:"name_i18n,omitempty" example:"123e4567-e89b-12d3-a456-426614174000"`
	PictureUrl   *string `json:"picture_url,omitempty" example:"https://example.com/image.jpg"`
	ColorCode    *string `json:"color_code,omitempty" example:"#FF5733"`
	DepartmentID *string `json:"department_id,omitempty" example:"123e4567-e89b-12d3-a456-426614174000"`
	Parent       *string `json:"parent,omitempty" example:"123e4567-e89b-12d3-a456-426614174000"`
}

type CategoryResponse struct {
	ID           string     `json:"id" example:"123e4567-e89b-12d3-a456-426614174000"`
	Name         string     `json:"name" example:"Appetizers"`
	NameI18n     *string    `json:"name_i18n,omitempty" example:"123e4567-e89b-12d3-a456-426614174000"`
	PictureUrl   *string    `json:"picture_url,omitempty" example:"https://example.com/image.jpg"`
	ColorCode    *string    `json:"color_code,omitempty" example:"#FF5733"`
	DepartmentID *string    `json:"department_id,omitempty" example:"123e4567-e89b-12d3-a456-426614174000"`
	StorageID    *string    `json:"storage_id,omitempty" example:"123e4567-e89b-12d3-a456-426614174000"`
	Parent       *string    `json:"parent,omitempty" example:"123e4567-e89b-12d3-a456-426614174000"`
	CreatedAt    *time.Time `json:"created_at,omitempty" example:"2022-01-01T00:00:00Z"`
	UpdatedAt    *time.Time `json:"updated_at,omitempty" example:"2022-01-01T00:00:00Z"`
}

type CategoryListFilter struct {
	Search       string
	DepartmentID string
	StorageID    string
	SortBy       string
	SortOrder    string
}

type PaginatedCategoriesResponse struct {
	Status     string             `json:"status" example:"success"`
	Message    string             `json:"message" example:"Categories retrieved successfully"`
	Data       []CategoryResponse `json:"data"`
	Pagination PaginationMeta     `json:"pagination"`
	Code       int                `json:"code" example:"200"`
}
