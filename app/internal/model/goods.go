package model

import "time"

type CreateGoodRequest struct {
	Name            string  `json:"name" binding:"required" example:"Pizza Margherita"`
	Description     *string `json:"description,omitempty" example:"Classic Italian pizza with tomatoes and mozzarella"`
	NameI18n        *string `json:"name_i18n,omitempty" example:"123e4567-e89b-12d3-a456-426614174000"`
	DescriptionI18n *string `json:"description_i18n,omitempty" example:"123e4567-e89b-12d3-a456-426614174000"`
	CategoryID      *string `json:"category_id,omitempty" example:"123e4567-e89b-12d3-a456-426614174000"`
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
	PictureUrl      *string `json:"picture_url,omitempty" example:"https://example.com/pizza-margherita.jpg"`
	ColorCode       *string `json:"color_code,omitempty" example:"#FF5733"`
	Price           *string `json:"price,omitempty" example:"15000.00"`
	CookTime        *int32  `json:"cook_time,omitempty" example:"30"`
}

type UpdateGoodPriceRequest struct {
	Price string `json:"price" binding:"required" example:"15000.00"`
}

type GoodResponse struct {
	ID              string  `json:"id" example:"123e4567-e89b-12d3-a456-426614174000"`
	Name            string  `json:"name" example:"Pizza Margherita"`
	Description     *string `json:"description,omitempty" example:"Classic Italian pizza with tomatoes and mozzarella"`
	NameI18n        *string `json:"name_i18n,omitempty" example:"123e4567-e89b-12d3-a456-426614174000"`
	DescriptionI18n *string `json:"description_i18n,omitempty" example:"123e4567-e89b-12d3-a456-426614174000"`
	CategoryID      *string `json:"category_id,omitempty" example:"123e4567-e89b-12d3-a456-426614174000"`
	BranchID        *string `json:"branch_id,omitempty" example:"123e4567-e89b-12d3-a456-426614174000"`
	PictureUrl      *string `json:"picture_url,omitempty" example:"https://example.com/pizza-margherita.jpg"`
	ColorCode       *string `json:"color_code,omitempty" example:"#FF5733"`
	Price           string  `json:"price" example:"15000.00"`
	CookTime        *int32  `json:"cook_time,omitempty" example:"30"`
	// CostPrice - total preparation cost (auto-calculated from calculations)
	CostPrice string `json:"cost_price" example:"10500.00"`
	// Profit - selling price minus cost (auto-calculated)
	Profit string `json:"profit" example:"4500.00"`
	// ProfitMargin - profit percentage relative to cost (auto-calculated) = (profit/cost)*100
	ProfitMargin string     `json:"profit_margin" example:"42.86"`
	CreatedAt    *time.Time `json:"created_at,omitempty" example:"2022-01-01T00:00:00Z"`
	UpdatedAt    *time.Time `json:"updated_at,omitempty" example:"2022-01-01T00:00:00Z"`
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

// ==================== ONE SAVE: Good + Calculations ====================

// IngredientCalculationItem represents an ingredient to add with its quantity.
// Price is automatically fetched from the latest invoice_detail for this ingredient.
// total_cost = quantity × price_per_unit (from invoice)
type IngredientCalculationItem struct {
	// IngredientID - UUID of the ingredient to add
	IngredientID string `json:"ingredient_id" binding:"required" example:"522e5a6a-f5c2-4280-b33b-6f466adabe23"`

	// Quantity - amount to add (e.g., "2.5" for 2.5 kg)
	Quantity string `json:"quantity" binding:"required" example:"2.5"`
}

// CompoundCalculationItem represents a compound to add with its quantity.
// Price is automatically fetched from the compound's price field.
// total_cost = quantity × compound.price
type CompoundCalculationItem struct {
	// CompoundID - UUID of the compound to add
	CompoundID string `json:"compound_id" binding:"required" example:"a1b2c3d4-e5f6-7890-abcd-ef1234567890"`

	// Quantity - amount to add (e.g., "3" for 3 units)
	Quantity string `json:"quantity" binding:"required" example:"3"`
}

// CreateGoodWithCalculationsRequest creates a good with multiple ingredients and compounds in one atomic transaction.
// All calculations are created together - if any fails, the entire operation is rolled back.
//
// Example: Creating "Osh" with 2 ingredients and 2 compounds:
//
//	{
//	  "good": { "name": "Osh", "price": "85000.00" },
//	  "ingredient_calculations": [
//	    { "ingredient_id": "sabzi-uuid", "quantity": "2.5" },   // 8000 × 2.5 = 20000
//	    { "ingredient_id": "guruch-uuid", "quantity": "0.5" }   // 20000 × 0.5 = 10000
//	  ],
//	  "compound_calculations": [
//	    { "compound_id": "salad-uuid", "quantity": "3" },       // 10000 × 3 = 30000
//	    { "compound_id": "xamir-uuid", "quantity": "1" }        // 25000 × 1 = 25000
//	  ]
//	}
type CreateGoodWithCalculationsRequest struct {
	// Good - the good/menu item to create
	Good CreateGoodRequest `json:"good" binding:"required"`

	// IngredientCalculations - array of ingredients to add (price from invoice_detail)
	IngredientCalculations []IngredientCalculationItem `json:"ingredient_calculations"`

	// CompoundCalculations - array of compounds to add (price from compound.price)
	CompoundCalculations []CompoundCalculationItem `json:"compound_calculations"`
}

// GoodWithCalculationsResponse - response containing created good and all its calculations
type GoodWithCalculationsResponse struct {
	// Good - the created good/menu item
	Good *GoodResponse `json:"good"`

	// Calculations - all calculation records created for this good
	Calculations []CalculationResponse `json:"calculations"`
}

// UpdateGoodWithCalculationsRequest updates a good and replaces all its calculations in one atomic operation.
// If any calculation fails, the entire operation is rolled back.
type UpdateGoodWithCalculationsRequest struct {
	// Good - the good/menu item fields to update
	Good UpdateGoodRequest `json:"good" binding:"required"`

	// IngredientCalculations - replacement array of ingredients to add (price from invoice_detail)
	IngredientCalculations []IngredientCalculationItem `json:"ingredient_calculations"`

	// CompoundCalculations - replacement array of compounds to add (price from compound.price)
	CompoundCalculations []CompoundCalculationItem `json:"compound_calculations"`
}

// UpdateCompoundWithCalculationsRequest updates a compound and replaces all its calculations in one atomic operation.
// If any calculation fails, the entire operation is rolled back.
type UpdateCompoundWithCalculationsRequest struct {
	// Compound - the compound fields to update
	Compound UpdateCompoundRequest `json:"compound" binding:"required"`

	// IngredientCalculations - replacement array of ingredients to add (price from invoice_detail)
	IngredientCalculations []IngredientCalculationItem `json:"ingredient_calculations"`

	// CompoundCalculations - replacement array of child compounds to add (price from compound.price)
	CompoundCalculations []CompoundCalculationItem `json:"compound_calculations"`
}

// CreateCompoundWithCalculationsRequest creates a compound with multiple ingredients and child compounds in one atomic transaction.
// All calculations are created together - if any fails, the entire operation is rolled back.
// The compound's price will be auto-calculated as the sum of all calculation total_costs.
//
// Example: Creating "Pizza Dough" compound:
//
//	{
//	  "compound": { "name": "Pizza Dough", "quantity": 1, "measurement": "kg" },
//	  "ingredient_calculations": [
//	    { "ingredient_id": "flour-uuid", "quantity": "0.5" },
//	    { "ingredient_id": "water-uuid", "quantity": "0.3" }
//	  ],
//	  "compound_calculations": [
//	    { "compound_id": "yeast-mix-uuid", "quantity": "1" }
//	  ]
//	}
type CreateCompoundWithCalculationsRequest struct {
	// Compound - the compound to create
	Compound CreateCompoundRequest `json:"compound" binding:"required"`

	// IngredientCalculations - array of ingredients to add (price from invoice_detail)
	IngredientCalculations []IngredientCalculationItem `json:"ingredient_calculations"`

	// CompoundCalculations - array of child compounds to add (price from compound.price)
	CompoundCalculations []CompoundCalculationItem `json:"compound_calculations"`
}

// CompoundWithCalculationsResponse - response containing created compound and all its calculations
type CompoundWithCalculationsResponse struct {
	// Compound - the created compound (price will be auto-calculated)
	Compound *CompoundResponse `json:"compound"`

	// Calculations - all calculation records created for this compound
	Calculations []CalculationResponse `json:"calculations"`
}
