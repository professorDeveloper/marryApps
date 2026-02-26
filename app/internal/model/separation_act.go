package model

import "time"

type SeparationActStatus string

const (
	SeparationActStatusDraft     SeparationActStatus = "draft"
	SeparationActStatusActive    SeparationActStatus = "active"
	SeparationActStatusCancelled SeparationActStatus = "cancelled"
)

type SeparationActResponse struct {
	ID                 string              `json:"id"`
	Number             int32               `json:"number"`
	Date               *time.Time          `json:"date,omitempty"`
	StorageID          *string             `json:"storage_id,omitempty"`
	SourceIngredientID string              `json:"source_ingredient_id"`
	SourceQuantity     string              `json:"source_quantity"`
	SourceStockBefore  string              `json:"source_stock_before"`
	SourceStockAfter   string              `json:"source_stock_after"`
	GroupID            *string             `json:"group_id,omitempty"`
	BranchID           *string             `json:"branch_id,omitempty"`
	Description        *string             `json:"description,omitempty"`
	Status             SeparationActStatus `json:"status"`
	TotalAmount        string              `json:"total_amount"`
	WasteQuantity      *string             `json:"waste_quantity,omitempty"`
	CreatedAt          *time.Time          `json:"created_at,omitempty"`
	UpdatedAt          *time.Time          `json:"updated_at,omitempty"`
}

type SeparationActItemResponse struct {
	ID               string     `json:"id"`
	SeparationActID  string     `json:"separation_act_id"`
	IngredientID     string     `json:"ingredient_id"`
	StorageID        *string    `json:"storage_id,omitempty"`
	Quantity         string     `json:"quantity"`
	PricePerUnit     string     `json:"price_per_unit"`
	TotalAmount      string     `json:"total_amount"`
	StockBefore      string     `json:"stock_before"`
	StockAfter       string     `json:"stock_after"`
	CreatedAt        *time.Time `json:"created_at,omitempty"`
	UpdatedAt        *time.Time `json:"updated_at,omitempty"`
}

type SeparationActWithItemsResponse struct {
	Act   SeparationActResponse       `json:"act"`
	Items []SeparationActItemResponse `json:"items"`
}

type SeparationActListResponse struct {
	Data           []*SeparationActResponse `json:"data"`
	Total          int64                    `json:"total"`
	TotalAmount    string                   `json:"total_amount"`
	TotalSourceQty string                   `json:"total_source_qty"`
	Limit          int32                    `json:"limit"`
	Offset         int32                    `json:"offset"`
}

type CreateSeparationActRequest struct {
	Date               *string `json:"date"                example:"2024-01-01T00:00:00Z"`
	StorageID          *string `json:"storage_id"          example:"uuid"`
	SourceIngredientID string  `json:"source_ingredient_id" validate:"required" example:"uuid"`
	SourceQuantity     string  `json:"source_quantity"     validate:"required"  example:"2"`
	GroupID            *string `json:"group_id"            example:"uuid"`
	Description        *string `json:"description"         example:"Description"`
}

type UpdateSeparationActRequest struct {
	Date        *string `json:"date"        example:"2024-01-01T00:00:00Z"`
	StorageID   *string `json:"storage_id"  example:"uuid"`
	GroupID     *string `json:"group_id"    example:"uuid"`
	Description *string `json:"description" example:"Description"`
}

type UpsertSeparationActItemRequest struct {
	IngredientID string  `json:"ingredient_id" validate:"required" example:"uuid"`
	StorageID    *string `json:"storage_id"    example:"uuid"`
	Quantity     string  `json:"quantity"      validate:"required" example:"12"`
	Price        *string `json:"price"         example:"10000"`
}

type UpsertSeparationActItemsRequest struct {
	Items []UpsertSeparationActItemRequest `json:"items" validate:"required"`
}

type CreateSeparationActBatchRequest struct {
	Date               *string                          `json:"date"                example:"2024-01-01T00:00:00Z"`
	StorageID          *string                          `json:"storage_id"          example:"uuid"`
	SourceIngredientID string                           `json:"source_ingredient_id" validate:"required" example:"uuid"`
	SourceQuantity     string                           `json:"source_quantity"     validate:"required"  example:"2"`
	GroupID            *string                          `json:"group_id"            example:"uuid"`
	Description        *string                          `json:"description"         example:"Description"`
	Items              []UpsertSeparationActItemRequest `json:"items"`
}
