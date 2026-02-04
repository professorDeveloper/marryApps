package model

import "time"

type DeductionStatus string

const (
	DeductionStatusActive  DeductionStatus = "active"
	DeductionStatusDraft   DeductionStatus = "draft"
	DeductionStatusDeleted DeductionStatus = "deleted"
)

type DeductionActGroupResponse struct {
	ID        string     `json:"id" example:"123e4567-e89b-12d3-a456-426614174000"`
	Name      string     `json:"name" example:"Spoiled"`
	CreatedAt *time.Time `json:"created_at,omitempty"`
	UpdatedAt *time.Time `json:"updated_at,omitempty"`
}

type CreateDeductionActGroupRequest struct {
	Name string `json:"name" validate:"required" example:"Spoiled"`
}

type UpdateDeductionActGroupRequest struct {
	Name *string `json:"name,omitempty" example:"Spoiled"`
}

type CreateDeductionItemRequest struct {
	IngredientID *string `json:"ingredient_id,omitempty"`
	GoodID       *string `json:"good_id,omitempty" example:"123e4567-e89b-12d3-a456-426614174000"`
	CompoundID   *string `json:"compound_id,omitempty"`
	Quantity     string  `json:"quantity" validate:"required" example:"2"`
}

type CreateDeductionRequest struct {
	Date            string                       `json:"date" validate:"required" example:"2024-01-01"`
	ActGroupID      *string                      `json:"act_group_id,omitempty" example:"123e4567-e89b-12d3-a456-426614174000"`
	StorageID       string                       `json:"storage_id" validate:"required" example:"123e4567-e89b-12d3-a456-426614174000"`
	Description     *string                      `json:"description,omitempty" example:"spoiled items"`
	DescriptionI18n *string                      `json:"description_i18n,omitempty" example:"123e4567-e89b-12d3-a456-426614174000"`
	Status          *string                      `json:"status,omitempty" example:"active"`
	Items           []CreateDeductionItemRequest `json:"items" validate:"required,min=1,dive"`
}

type UpdateDeductionRequest struct {
	Date            *string `json:"date,omitempty" example:"2024-01-01"`
	ActGroupID      *string `json:"act_group_id,omitempty" example:"123e4567-e89b-12d3-a456-426614174000"`
	StorageID       *string `json:"storage_id,omitempty" example:"123e4567-e89b-12d3-a456-426614174000"`
	Description     *string `json:"description,omitempty" example:"spoiled items"`
	DescriptionI18n *string `json:"description_i18n,omitempty" example:"123e4567-e89b-12d3-a456-426614174000"`
	Status          *string `json:"status,omitempty" example:"active"`
}

type DeductionItemIngredientResponse struct {
	ID              string     `json:"id" example:"123e4567-e89b-12d3-a456-426614174000"`
	DeductionItemID string     `json:"deduction_item_id" example:"123e4567-e89b-12d3-a456-426614174000"`
	IngredientID    string     `json:"ingredient_id" example:"123e4567-e89b-12d3-a456-426614174000"`
	Quantity        string     `json:"quantity" example:"0.12"`
	StockBefore     string     `json:"stock_before" example:"1.90"`
	StockAfter      string     `json:"stock_after" example:"1.78"`
	PricePerUnit    string     `json:"price_per_unit" example:"62500"`
	Amount          string     `json:"amount" example:"7500"`
	CreatedAt       *time.Time `json:"created_at,omitempty"`
	UpdatedAt       *time.Time `json:"updated_at,omitempty"`
}

type DeductionItemCompoundResponse struct {
	CompoundID string `json:"compound_id" example:"123e4567-e89b-12d3-a456-426614174000"`
	Quantity   string `json:"quantity" example:"2"`
}

type DeductionItemResponse struct {
	ID           string                            `json:"id" example:"123e4567-e89b-12d3-a456-426614174000"`
	DeductionID  string                            `json:"deduction_id" example:"123e4567-e89b-12d3-a456-426614174000"`
	IngredientID *string                           `json:"ingredient_id,omitempty" example:"123e4567-e89b-12d3-a456-426614174000"`
	GoodID       *string                           `json:"good_id,omitempty" example:"123e4567-e89b-12d3-a456-426614174000"`
	CompoundID   *string                           `json:"compound_id,omitempty" example:"123e4567-e89b-12d3-a456-426614174000"`
	Quantity     string                            `json:"quantity" example:"2"`
	Compounds    []DeductionItemCompoundResponse   `json:"compounds,omitempty"`
	Ingredients  []DeductionItemIngredientResponse `json:"ingredients,omitempty"`
	CreatedAt    *time.Time                        `json:"created_at,omitempty"`
	UpdatedAt    *time.Time                        `json:"updated_at,omitempty"`
}

type DeductionResponse struct {
	ID              string                  `json:"id" example:"123e4567-e89b-12d3-a456-426614174000"`
	Number          int64                   `json:"number" example:"1"`
	Date            *time.Time              `json:"date,omitempty"`
	ActGroupID      *string                 `json:"act_group_id,omitempty" example:"123e4567-e89b-12d3-a456-426614174000"`
	StorageID       string                  `json:"storage_id" example:"123e4567-e89b-12d3-a456-426614174000"`
	Description     *string                 `json:"description,omitempty"`
	DescriptionI18n *string                 `json:"description_i18n,omitempty"`
	Status          DeductionStatus         `json:"status" example:"active"`
	Balance         string                  `json:"balance" example:"7500"`
	Warnings        []string                `json:"warnings,omitempty"`
	Items           []DeductionItemResponse `json:"items,omitempty"`
	CreatedAt       *time.Time              `json:"created_at,omitempty"`
	UpdatedAt       *time.Time              `json:"updated_at,omitempty"`
}
