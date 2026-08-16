package model

import "time"

type InventoryStatus string

const (
	InventoryStatusActive  InventoryStatus = "active"
	InventoryStatusDraft   InventoryStatus = "draft"
	InventoryStatusDeleted InventoryStatus = "deleted"
)

type InventoryResponse struct {
	ID              string          `json:"id" example:"c0f18a64-7f5c-4425-9414-1b01cddee9d9"`
	Number          int64           `json:"number" example:"1"`
	Date            *time.Time      `json:"date,omitempty"`
	CountedAt       *time.Time      `json:"counted_at,omitempty"`
	StorageID       string          `json:"storage_id" example:"d1f29b75-8g6d-5536-0525-2c12deeef0e0"`
	Description     *string         `json:"description,omitempty" example:"Monthly inventory"`
	DescriptionI18n *string         `json:"description_i18n,omitempty" example:"c0f18a64-7f5c-4425-9414-1b01cddee9d9"`
	Status          InventoryStatus `json:"status" example:"active"`
	SurplusAmount   string          `json:"surplus_amount" example:"0"`
	ShortageAmount  string          `json:"shortage_amount" example:"0"`
	RemainingAmount string          `json:"remaining_amount" example:"0"`
	CreatedAt       *time.Time      `json:"created_at,omitempty"`
	UpdatedAt       *time.Time      `json:"updated_at,omitempty"`
}

type CreateInventoryRequest struct {
	Date            string  `json:"date" validate:"required" example:"2024-01-01"`
	CountedAt       string  `json:"counted_at" validate:"required" example:"2024-01-01T14:30:00+05:00"`
	StorageID       string  `json:"storage_id" validate:"required" example:"d1f29b75-8g6d-5536-0525-2c12deeef0e0"`
	Description     *string `json:"description,omitempty" example:"Monthly inventory"`
	DescriptionI18n *string `json:"description_i18n,omitempty" example:"c0f18a64-7f5c-4425-9414-1b01cddee9d9"`
	Status          *string `json:"status,omitempty" example:"active"`
}

type UpdateInventoryRequest struct {
	Date            *string `json:"date,omitempty" example:"2024-01-01"`
	CountedAt       *string `json:"counted_at,omitempty" example:"2024-01-01T14:30:00+05:00"`
	StorageID       *string `json:"storage_id,omitempty" example:"d1f29b75-8g6d-5536-0525-2c12deeef0e0"`
	Description     *string `json:"description,omitempty" example:"Monthly inventory"`
	DescriptionI18n *string `json:"description_i18n,omitempty" example:"c0f18a64-7f5c-4425-9414-1b01cddee9d9"`
	Status          *string `json:"status,omitempty" example:"active"`
}

type UpsertInventoryItemRequest struct {
	IngredientID    string `json:"ingredient_id" validate:"required" example:"123e4567-e89b-12d3-a456-426614174000"`
	CountedQuantity string `json:"counted_quantity" example:"10"`
}

type UpsertInventoryItemsRequest struct {
	Items []UpsertInventoryItemRequest `json:"items" validate:"required,min=1,dive"`
}

type CreateInventoryBatchRequest struct {
	Date            string                       `json:"date" validate:"required" example:"2024-01-01"`
	CountedAt       string                       `json:"counted_at" validate:"required" example:"2024-01-01T14:30:00+05:00"`
	StorageID       string                       `json:"storage_id" validate:"required" example:"d1f29b75-8g6d-5536-0525-2c12deeef0e0"`
	Description     *string                      `json:"description,omitempty" example:"Monthly inventory"`
	DescriptionI18n *string                      `json:"description_i18n,omitempty"`
	Status          *string                      `json:"status,omitempty" example:"active"`
	Items           []UpsertInventoryItemRequest `json:"items" validate:"required,min=1,dive"`
}

type CreateInventoryBatchResponse struct {
	Inventory *InventoryResponse `json:"inventory"`
}

type InventoryItemComputedResponse struct {
	InventoryItemID       *string `json:"inventory_item_id,omitempty" example:"123e4567-e89b-12d3-a456-426614174000"`
	InventoryID           string  `json:"inventory_id" example:"123e4567-e89b-12d3-a456-426614174000"`
	IngredientID          string  `json:"ingredient_id" example:"123e4567-e89b-12d3-a456-426614174000"`
	IngredientName        string  `json:"ingredient_name" example:"Tomato"`
	IngredientMeasurement *string `json:"ingredient_measurement,omitempty" example:"kg"`
	IngredientPictureUrl  *string `json:"ingredient_picture_url,omitempty" example:"https://example.com/tomato.jpg"`
	IngredientColorCode   *string `json:"ingredient_color_code,omitempty" example:"#FF5733"`
	SystemQuantity        string  `json:"system_quantity" example:"6"`
	CountedQuantity       string  `json:"counted_quantity" example:"3"`
	DifferenceQuantity    string  `json:"difference_quantity" example:"-3"`

	PricePerUnit    string `json:"price_per_unit" example:"10000"`
	SurplusAmount   string `json:"surplus_amount" example:"0"`
	ShortageAmount  string `json:"shortage_amount" example:"30000"`
	RemainingAmount string `json:"remaining_amount" example:"30000"`
}

type InventoryItemResponse struct {
	ID              string     `json:"id" example:"123e4567-e89b-12d3-a456-426614174000"`
	InventoryID     string     `json:"inventory_id" example:"123e4567-e89b-12d3-a456-426614174000"`
	IngredientID    string     `json:"ingredient_id" example:"123e4567-e89b-12d3-a456-426614174000"`
	CountedQuantity string     `json:"counted_quantity" example:"10"`
	CreatedAt       *time.Time `json:"created_at,omitempty"`
	UpdatedAt       *time.Time `json:"updated_at,omitempty"`
}

type UpdateInventoryItemRequest struct {
	CountedQuantity string `json:"counted_quantity" validate:"required" example:"10"`
}

type DeleteInventoriesBatchRequest struct {
	IDs []string `json:"ids" validate:"required,min=1"`
}

type DeleteInventoryItemsBatchRequest struct {
	IDs []string `json:"ids" validate:"required,min=1"`
}

type PaginationMeta struct {
	Total      int32 `json:"total"`
	Limit      int32 `json:"limit"`
	Offset     int32 `json:"offset"`
	Page       int32 `json:"page"`
	TotalPages int32 `json:"total_pages"`
}

type PaginatedInventoriesResponse struct {
	Data       []*InventoryResponse `json:"data"`
	Pagination PaginationMeta       `json:"pagination"`
}
