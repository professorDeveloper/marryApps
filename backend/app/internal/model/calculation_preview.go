package model

type PreviewCalculationsRequest struct {
	IngredientCalculations []IngredientCalculationItem `json:"ingredient_calculations"`
	CompoundCalculations   []CompoundCalculationItem   `json:"compound_calculations"`
}

type CalculationPreviewItem struct {
	Name                string  `json:"name"`
	IngredientID        *string `json:"ingredient_id,omitempty"`
	ComponentCompoundID *string `json:"component_compound_id,omitempty"`
	Quantity            string  `json:"quantity"`
	MeasurementUnit     string  `json:"measurement_unit"`
	PricePerUnit        string  `json:"price_per_unit"`
	TotalCost           string  `json:"total_cost"`
}

type PreviewCalculationsResponse struct {
	Calculations []CalculationPreviewItem `json:"calculations"`
}
