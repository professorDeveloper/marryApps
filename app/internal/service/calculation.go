package service

import (
	"context"
	"fmt"
	"log"
	"strconv"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"gitlab.yurtal.tech/company/maryai/back/internal/model"
	"gitlab.yurtal.tech/company/maryai/back/internal/repository"
	pg "gitlab.yurtal.tech/company/maryai/back/internal/repository/pg/tenantsdb"
)

type CalculationS struct {
	repo *repository.Repository
}

func NewCalculationS(repo *repository.Repository) *CalculationS {
	return &CalculationS{repo: repo}
}

// Helper to convert string to pgtype.Numeric
func stringToNumeric(s string) pgtype.Numeric {
	num := pgtype.Numeric{}
	if err := num.Scan(s); err != nil {
		return pgtype.Numeric{}
	}
	return num
}

// Helper to convert pgtype.Numeric to string
func numericToStr(n pgtype.Numeric) string {
	return numericToString(n)
}

func anyNumericToStr(v any) string {
	switch t := v.(type) {
	case nil:
		return "0"
	case string:
		if t == "" {
			return "0"
		}
		return t
	case []byte:
		if len(t) == 0 {
			return "0"
		}
		return string(t)
	case pgtype.Numeric:
		return numericToStr(t)
	case *pgtype.Numeric:
		if t == nil {
			return "0"
		}
		return numericToStr(*t)
	case int32:
		return fmt.Sprintf("%d", t)
	case int64:
		return fmt.Sprintf("%d", t)
	case float64:
		return fmt.Sprintf("%.2f", t)
	default:
		return fmt.Sprintf("%v", t)
	}
}

// Helper to convert *uuid.UUID to pgtype.UUID
func uuidToPgType(u *uuid.UUID) pgtype.UUID {
	if u == nil {
		return pgtype.UUID{Valid: false}
	}
	return pgtype.UUID{Bytes: *u, Valid: true}
}

// Helper to convert pgtype.UUID to *string
func pgTypeUUIDToString(u pgtype.UUID) *string {
	if !u.Valid {
		return nil
	}
	s := u.String()
	return &s
}

func (c *CalculationS) updateCompoundPriceFromCalculations(ctx context.Context, compoundID string) error {
	// Compound price is treated as total component cost: SUM(calculation.total_cost)
	totalCostStr, err := c.GetTotalCostByCompoundID(ctx, compoundID)
	if err != nil {
		return err
	}

	totalCostFloat, err := strconv.ParseFloat(totalCostStr, 64)
	if err != nil {
		return fmt.Errorf("invalid compound total cost: %w", err)
	}

	compoundUUID, err := uuid.Parse(compoundID)
	if err != nil {
		return fmt.Errorf("invalid compound_id: %w", err)
	}

	_, err = c.repo.Tenant(ctx).UpdateCompoundPrice(ctx, pg.UpdateCompoundPriceParams{
		ID:    compoundUUID,
		Price: stringToNumeric(fmt.Sprintf("%.2f", totalCostFloat)),
	})
	if err != nil {
		log.Printf("updateCompoundPriceFromCalculations failed: %v", err)
		return fmt.Errorf("failed to update compound price: %w", err)
	}

	// Also update the compound's cost_price, profit, profit_margin fields
	return c.UpdateCompoundCostFields(ctx, compoundID)
}

// UpdateGoodCostFields recalculates and stores cost_price, profit, profit_margin for a good
// Should be called after any calculation is created/updated/deleted for a good
func (c *CalculationS) UpdateGoodCostFields(ctx context.Context, goodID string) error {
	goodUUID, err := uuid.Parse(goodID)
	if err != nil {
		return fmt.Errorf("invalid good_id: %w", err)
	}

	// Get the good to get its selling price
	good, err := c.repo.Tenant(ctx).GetGoodByID(ctx, goodUUID)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil // Good doesn't exist, nothing to update
		}
		return fmt.Errorf("failed to fetch good: %w", err)
	}

	// Calculate total cost from calculations
	totalCostStr, err := c.GetTotalCostByGoodID(ctx, goodID)
	if err != nil {
		return fmt.Errorf("failed to get total cost: %w", err)
	}

	sellingPrice, _ := strconv.ParseFloat(numericToStr(good.Price), 64)
	totalCost, _ := strconv.ParseFloat(totalCostStr, 64)

	// Calculate profit and profit margin
	profit := sellingPrice - totalCost
	var profitMargin float64
	if totalCost > 0 {
		profitMargin = (profit / totalCost) * 100
	}

	// Update the good's cost fields in DB
	_, err = c.repo.Tenant(ctx).UpdateGoodCostFields(ctx, pg.UpdateGoodCostFieldsParams{
		ID:           goodUUID,
		CostPrice:    stringToNumeric(fmt.Sprintf("%.2f", totalCost)),
		Profit:       stringToNumeric(fmt.Sprintf("%.2f", profit)),
		ProfitMargin: stringToNumeric(fmt.Sprintf("%.4f", profitMargin)),
	})
	if err != nil {
		log.Printf("UpdateGoodCostFields failed: %v", err)
		return fmt.Errorf("failed to update good cost fields: %w", err)
	}

	return nil
}

// UpdateCompoundCostFields recalculates and stores cost_price for a compound
// For compounds: price = total_cost (auto-calculated), no profit/profit_margin
// Compounds are intermediate products, not sold directly to customers
func (c *CalculationS) UpdateCompoundCostFields(ctx context.Context, compoundID string) error {
	compoundUUID, err := uuid.Parse(compoundID)
	if err != nil {
		return fmt.Errorf("invalid compound_id: %w", err)
	}

	// Calculate total cost from calculations
	totalCostStr, err := c.GetTotalCostByCompoundID(ctx, compoundID)
	if err != nil {
		return fmt.Errorf("failed to get total cost: %w", err)
	}

	totalCost, _ := strconv.ParseFloat(totalCostStr, 64)

	// For compounds: price = cost_price = total_cost, profit = 0, profit_margin = 0
	// Compounds are intermediate products, they don't have a separate selling price
	_, err = c.repo.Tenant(ctx).UpdateCompoundCostFields(ctx, pg.UpdateCompoundCostFieldsParams{
		ID:           compoundUUID,
		CostPrice:    stringToNumeric(fmt.Sprintf("%.2f", totalCost)),
		Profit:       stringToNumeric("0"),
		ProfitMargin: stringToNumeric("0"),
	})
	if err != nil {
		log.Printf("UpdateCompoundCostFields failed: %v", err)
		return fmt.Errorf("failed to update compound cost fields: %w", err)
	}

	return nil
}

// CreateCalculation creates a new calculation record for a good
// Auto-fetches ingredient price from latest invoice
func (c *CalculationS) CreateCalculation(ctx context.Context, goodID, ingredientID, quantity string) (*model.CalculationResponse, error) {
	return c.createCalculationInternal(ctx, &goodID, nil, ingredientID, quantity)
}

// CreateCalculationForCompound creates a new calculation record for a compound
// Auto-fetches ingredient price from latest invoice
func (c *CalculationS) CreateCalculationForCompound(ctx context.Context, compoundID, ingredientID, quantity string) (*model.CalculationResponse, error) {
	return c.createCalculationInternal(ctx, nil, &compoundID, ingredientID, quantity)
}

// CreateCalculationWithCompound adds a compound to a good as a component
// Uses the compound's price field which is auto-calculated from its ingredients
func (c *CalculationS) CreateCalculationWithCompound(ctx context.Context, goodID, compoundID, quantity string) (*model.CalculationResponse, error) {
	// Parse UUIDs
	goodUUID, err := uuid.Parse(goodID)
	if err != nil {
		return nil, fmt.Errorf("invalid good_id: %w", err)
	}

	// Validate parent good exists (avoid FK violation)
	if _, err := c.repo.Tenant(ctx).GetGoodByID(ctx, goodUUID); err != nil {
		if err == pgx.ErrNoRows {
			return nil, fmt.Errorf("good not found")
		}
		return nil, fmt.Errorf("failed to fetch good: %w", err)
	}

	compoundUUID, err := uuid.Parse(compoundID)
	if err != nil {
		return nil, fmt.Errorf("invalid compound_id: %w", err)
	}

	// Validate quantity
	quantityFloat, err := strconv.ParseFloat(quantity, 64)
	if err != nil {
		return nil, fmt.Errorf("invalid quantity: %w", err)
	}

	// Fetch compound to get its price (auto-calculated from ingredients)
	compound, err := c.repo.Tenant(ctx).GetCompoundByID(ctx, compoundUUID)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, fmt.Errorf("compound not found")
		}
		log.Printf("CreateCalculationWithCompound: failed to fetch compound: %v", err)
		return nil, fmt.Errorf("failed to fetch compound: %w", err)
	}

	// Get the compound's price (which is auto-calculated from its ingredients)
	compoundPrice := numericToStr(compound.Price)
	compoundPriceFloat, err := strconv.ParseFloat(compoundPrice, 64)
	if err != nil {
		return nil, fmt.Errorf("invalid compound price: %w", err)
	}

	if compoundPriceFloat == 0 {
		return nil, fmt.Errorf("compound has no price - please add ingredients first")
	}

	// Calculate total cost: quantity × compound.price
	totalCostCalc := compoundPriceFloat * quantityFloat

	// Create calculation record linking good to compound
	calculation, err := c.repo.Tenant(ctx).CreateCalculation(ctx, pg.CreateCalculationParams{
		ID:                  uuid.New(),
		GoodID:              pgtype.UUID{Bytes: goodUUID, Valid: true},
		CompoundID:          pgtype.UUID{Valid: false},
		IngredientID:        pgtype.UUID{Valid: false},
		ComponentCompoundID: pgtype.UUID{Bytes: compoundUUID, Valid: true},
		Quantity:            stringToNumeric(quantity),
		MeasurementUnit:     "compound", // Marker for compound component
		PricePerUnit:        stringToNumeric(fmt.Sprintf("%.2f", compoundPriceFloat)),
		TotalCost:           stringToNumeric(fmt.Sprintf("%.2f", totalCostCalc)),
	})
	if err != nil {
		log.Printf("CreateCalculationWithCompound failed: %v", err)
		return nil, fmt.Errorf("failed to create calculation: %w", err)
	}

	// Update good's cost fields (cost_price, profit, profit_margin)
	if err := c.UpdateGoodCostFields(ctx, goodID); err != nil {
		log.Printf("CreateCalculationWithCompound: failed to update good cost fields: %v", err)
	}

	return toCalculationResponseAny(calculation), nil
}

// CreateCalculationCompoundToCompound adds a compound to another compound as a component
// Uses the child compound's price field which is auto-calculated from its ingredients
func (c *CalculationS) CreateCalculationCompoundToCompound(ctx context.Context, parentCompoundID, childCompoundID, quantity string) (*model.CalculationResponse, error) {
	// Parse UUIDs
	parentUUID, err := uuid.Parse(parentCompoundID)
	if err != nil {
		return nil, fmt.Errorf("invalid parent compound_id: %w", err)
	}

	// Validate parent compound exists (avoid FK violation)
	if _, err := c.repo.Tenant(ctx).GetCompoundByID(ctx, parentUUID); err != nil {
		if err == pgx.ErrNoRows {
			return nil, fmt.Errorf("parent compound not found")
		}
		return nil, fmt.Errorf("failed to fetch parent compound: %w", err)
	}

	childUUID, err := uuid.Parse(childCompoundID)
	if err != nil {
		return nil, fmt.Errorf("invalid child compound_id: %w", err)
	}

	// Validate quantity
	quantityFloat, err := strconv.ParseFloat(quantity, 64)
	if err != nil {
		return nil, fmt.Errorf("invalid quantity: %w", err)
	}

	// Fetch child compound to get its price (auto-calculated from ingredients)
	childCompound, err := c.repo.Tenant(ctx).GetCompoundByID(ctx, childUUID)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, fmt.Errorf("child compound not found")
		}
		log.Printf("CreateCalculationCompoundToCompound: failed to fetch child compound: %v", err)
		return nil, fmt.Errorf("failed to fetch child compound: %w", err)
	}

	// Get the child compound's price (which is auto-calculated from its ingredients)
	childPrice := numericToStr(childCompound.Price)
	childPriceFloat, err := strconv.ParseFloat(childPrice, 64)
	if err != nil {
		return nil, fmt.Errorf("invalid child compound price: %w", err)
	}

	if childPriceFloat == 0 {
		return nil, fmt.Errorf("child compound has no price - please add ingredients first")
	}

	// Calculate total cost: quantity × child_compound.price
	totalCostCalc := childPriceFloat * quantityFloat

	// Create calculation record linking parent compound to child compound
	calculation, err := c.repo.Tenant(ctx).CreateCalculation(ctx, pg.CreateCalculationParams{
		ID:                  uuid.New(),
		GoodID:              pgtype.UUID{Valid: false},                   // NULL for compound-to-compound
		CompoundID:          pgtype.UUID{Bytes: parentUUID, Valid: true}, // Parent compound
		IngredientID:        pgtype.UUID{Valid: false},                   // NULL - no direct ingredient
		ComponentCompoundID: pgtype.UUID{Bytes: childUUID, Valid: true},
		Quantity:            stringToNumeric(quantity),
		MeasurementUnit:     "compound",                                            // Marker for compound component
		PricePerUnit:        stringToNumeric(fmt.Sprintf("%.2f", childPriceFloat)), // Child compound's price per unit
		TotalCost:           stringToNumeric(fmt.Sprintf("%.2f", totalCostCalc)),   // Total component cost
	})
	if err != nil {
		log.Printf("CreateCalculationCompoundToCompound failed: %v", err)
		return nil, fmt.Errorf("failed to create calculation: %w", err)
	}

	// Note: Parent compound's price will be auto-updated by trigger after this calculation is inserted
	if err := c.updateCompoundPriceFromCalculations(ctx, parentCompoundID); err != nil {
		log.Printf("CreateCalculationCompoundToCompound: failed to update parent compound price: %v", err)
	}
	return toCalculationResponseAny(calculation), nil
}

func (c *CalculationS) PreviewCalculations(ctx context.Context, req *model.PreviewCalculationsRequest) (*model.PreviewCalculationsResponse, error) {
	if req == nil {
		return nil, fmt.Errorf("request is required")
	}

	var items []model.CalculationPreviewItem
	var totalCost float64

	for _, calc := range req.IngredientCalculations {
		ingredientUUID, err := uuid.Parse(calc.IngredientID)
		if err != nil {
			return nil, fmt.Errorf("invalid ingredient_id: %w", err)
		}

		qtyFloat, err := strconv.ParseFloat(calc.Quantity, 64)
		if err != nil {
			return nil, fmt.Errorf("invalid quantity: %w", err)
		}

		ingredient, err := c.repo.Tenant(ctx).GetIngredientByID(ctx, ingredientUUID)
		if err != nil {
			if err == pgx.ErrNoRows {
				return nil, fmt.Errorf("ingredient not found")
			}
			return nil, fmt.Errorf("failed to fetch ingredient: %w", err)
		}

		var priceFloat float64
		if ingredient.PricePerUnit.Valid {
			priceStr := numericToStr(ingredient.PricePerUnit)
			priceFloat, err = strconv.ParseFloat(priceStr, 64)
			if err != nil {
				return nil, fmt.Errorf("invalid ingredient price: %w", err)
			}
		}

		lineTotal := qtyFloat * priceFloat
		totalCost += lineTotal

		measurementUnit := ""
		if ingredient.Measurement.Valid {
			measurementUnit = string(ingredient.Measurement.MeasurementType)
		}

		idStr := calc.IngredientID
		items = append(items, model.CalculationPreviewItem{
			Name:                ingredient.Name,
			IngredientID:        &idStr,
			ComponentCompoundID: nil,
			Quantity:            calc.Quantity,
			MeasurementUnit:     measurementUnit,
			PricePerUnit:        fmt.Sprintf("%.2f", priceFloat),
			TotalCost:           fmt.Sprintf("%.2f", lineTotal),
		})
	}

	for _, calc := range req.CompoundCalculations {
		compoundUUID, err := uuid.Parse(calc.CompoundID)
		if err != nil {
			return nil, fmt.Errorf("invalid compound_id: %w", err)
		}

		qtyFloat, err := strconv.ParseFloat(calc.Quantity, 64)
		if err != nil {
			return nil, fmt.Errorf("invalid quantity: %w", err)
		}

		compound, err := c.repo.Tenant(ctx).GetCompoundByID(ctx, compoundUUID)
		if err != nil {
			if err == pgx.ErrNoRows {
				return nil, fmt.Errorf("compound not found")
			}
			return nil, fmt.Errorf("failed to fetch compound: %w", err)
		}

		priceStr := numericToStr(compound.Price)
		priceFloat, err := strconv.ParseFloat(priceStr, 64)
		if err != nil {
			return nil, fmt.Errorf("invalid compound price: %w", err)
		}
		if priceFloat == 0 {
			return nil, fmt.Errorf("compound has no price - please add ingredients first")
		}

		lineTotal := qtyFloat * priceFloat
		totalCost += lineTotal

		idStr := calc.CompoundID
		items = append(items, model.CalculationPreviewItem{
			Name:                compound.Name,
			IngredientID:        nil,
			ComponentCompoundID: &idStr,
			Quantity:            calc.Quantity,
			MeasurementUnit:     "compound",
			PricePerUnit:        fmt.Sprintf("%.2f", priceFloat),
			TotalCost:           fmt.Sprintf("%.2f", lineTotal),
		})
	}

	_ = totalCost
	return &model.PreviewCalculationsResponse{Calculations: items}, nil
}

func (c *CalculationS) createCalculationInternal(ctx context.Context, goodID, compoundID *string, ingredientID, quantity string) (*model.CalculationResponse, error) {
	// Validate that at least one of goodID or compoundID is provided
	if (goodID == nil || *goodID == "") && (compoundID == nil || *compoundID == "") {
		return nil, fmt.Errorf("either good_id or compound_id must be provided")
	}

	// Parse UUIDs
	var goodUUID, compoundUUID *uuid.UUID

	if goodID != nil && *goodID != "" {
		id, err := uuid.Parse(*goodID)
		if err != nil {
			return nil, fmt.Errorf("invalid good_id: %w", err)
		}
		goodUUID = &id

		// Validate parent good exists (avoid FK violation)
		if _, err := c.repo.Tenant(ctx).GetGoodByID(ctx, id); err != nil {
			if err == pgx.ErrNoRows {
				return nil, fmt.Errorf("good not found")
			}
			return nil, fmt.Errorf("failed to fetch good: %w", err)
		}
	}

	if compoundID != nil && *compoundID != "" {
		id, err := uuid.Parse(*compoundID)
		if err != nil {
			return nil, fmt.Errorf("invalid compound_id: %w", err)
		}
		compoundUUID = &id

		// Validate parent compound exists (avoid FK violation)
		if _, err := c.repo.Tenant(ctx).GetCompoundByID(ctx, id); err != nil {
			if err == pgx.ErrNoRows {
				return nil, fmt.Errorf("compound not found")
			}
			return nil, fmt.Errorf("failed to fetch compound: %w", err)
		}
	}

	ingredientUUID, err := uuid.Parse(ingredientID)
	if err != nil {
		return nil, fmt.Errorf("invalid ingredient_id: %w", err)
	}

	// Validate quantity
	quantityFloat, err := strconv.ParseFloat(quantity, 64)
	if err != nil {
		return nil, fmt.Errorf("invalid quantity: %w", err)
	}

	// Fetch ingredient from database
	ingredient, err := c.repo.Tenant(ctx).GetIngredientByID(ctx, ingredientUUID)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, fmt.Errorf("ingredient not found")
		}
		return nil, fmt.Errorf("failed to fetch ingredient: %w", err)
	}

	// Get price_per_unit from ingredient (0 if not yet set via invoice)
	var ingredientPriceFloat float64
	if ingredient.PricePerUnit.Valid {
		ingredientPrice := numericToStr(ingredient.PricePerUnit)
		ingredientPriceFloat, err = strconv.ParseFloat(ingredientPrice, 64)
		if err != nil {
			return nil, fmt.Errorf("invalid ingredient price: %w", err)
		}
	}

	// Calculate total cost: quantity * price_per_unit
	// price_per_unit is already normalized to the measurement unit from invoice
	// (e.g., price per 1 kg, price per 1 L, price per 1 piece, etc.)
	totalCostCalc := quantityFloat * ingredientPriceFloat

	// Get measurement unit string
	measurementUnit := ""
	if ingredient.Measurement.Valid {
		measurementUnit = string(ingredient.Measurement.MeasurementType)
	}

	// Create calculation record
	calculation, err := c.repo.Tenant(ctx).CreateCalculation(ctx, pg.CreateCalculationParams{
		ID:                  uuid.New(),
		GoodID:              uuidToPgType(goodUUID),
		CompoundID:          uuidToPgType(compoundUUID),
		IngredientID:        pgtype.UUID{Bytes: ingredientUUID, Valid: true},
		ComponentCompoundID: pgtype.UUID{Valid: false},
		Quantity:            stringToNumeric(quantity),
		MeasurementUnit:     measurementUnit,
		PricePerUnit:        stringToNumeric(fmt.Sprintf("%.2f", ingredientPriceFloat)),
		TotalCost:           stringToNumeric(fmt.Sprintf("%.2f", totalCostCalc)),
	})
	if err != nil {
		log.Printf("CreateCalculation failed: %v", err)
		return nil, fmt.Errorf("failed to create calculation: %w", err)
	}

	// If this calculation is for a compound, update its price (total component cost)
	if compoundID != nil && *compoundID != "" {
		if err := c.updateCompoundPriceFromCalculations(ctx, *compoundID); err != nil {
			log.Printf("CreateCalculationForCompound: failed to update compound price: %v", err)
		}
	}

	// If this calculation is for a good, update its cost fields (cost_price, profit, profit_margin)
	if goodID != nil && *goodID != "" {
		if err := c.UpdateGoodCostFields(ctx, *goodID); err != nil {
			log.Printf("CreateCalculation: failed to update good cost fields: %v", err)
		}
	}

	return toCalculationResponseAny(calculation), nil
}

// GetCalculationByID retrieves a calculation by ID
func (c *CalculationS) GetCalculationByID(ctx context.Context, calculationID string) (*model.CalculationResponse, error) {
	id, err := uuid.Parse(calculationID)
	if err != nil {
		return nil, fmt.Errorf("invalid calculation ID: %w", err)
	}

	calculation, err := c.repo.Tenant(ctx).GetCalculationByID(ctx, id)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, fmt.Errorf("calculation not found")
		}
		log.Printf("GetCalculationByID failed: %v", err)
		return nil, fmt.Errorf("failed to retrieve calculation: %w", err)
	}

	return toCalculationResponseAny(calculation), nil
}

// GetCalculationsByGoodID retrieves all calculations for a good
func (c *CalculationS) GetCalculationsByGoodID(ctx context.Context, goodID string) ([]*model.CalculationResponse, error) {
	id, err := uuid.Parse(goodID)
	if err != nil {
		return nil, fmt.Errorf("invalid good_id: %w", err)
	}

	calculations, err := c.repo.Tenant(ctx).GetCalculationsByGoodID(ctx, uuidToPgType(&id))
	if err != nil {
		log.Printf("GetCalculationsByGoodID failed: %v", err)
		return nil, fmt.Errorf("failed to retrieve calculations: %w", err)
	}

	var responses []*model.CalculationResponse
	for _, calc := range calculations {
		responses = append(responses, toCalculationResponseAny(calc))
	}
	return responses, nil
}

// GetCalculationsByCompoundID retrieves all calculations for a compound
func (c *CalculationS) GetCalculationsByCompoundID(ctx context.Context, compoundID string) ([]*model.CalculationResponse, error) {
	id, err := uuid.Parse(compoundID)
	if err != nil {
		return nil, fmt.Errorf("invalid compound_id: %w", err)
	}

	calculations, err := c.repo.Tenant(ctx).GetCalculationsByCompoundID(ctx, uuidToPgType(&id))
	if err != nil {
		log.Printf("GetCalculationsByCompoundID failed: %v", err)
		return nil, fmt.Errorf("failed to retrieve calculations: %w", err)
	}

	var responses []*model.CalculationResponse
	for _, calc := range calculations {
		responses = append(responses, toCalculationResponseAny(calc))
	}
	return responses, nil
}

// GetTotalCostByGoodID calculates total cost for a good
func (c *CalculationS) GetTotalCostByGoodID(ctx context.Context, goodID string) (string, error) {
	id, err := uuid.Parse(goodID)
	if err != nil {
		return "0", fmt.Errorf("invalid good_id: %w", err)
	}

	result, err := c.repo.Tenant(ctx).GetTotalCostByGoodID(ctx, uuidToPgType(&id))
	if err != nil {
		log.Printf("GetTotalCostByGoodID failed: %v", err)
		return "0", fmt.Errorf("failed to calculate total cost: %w", err)
	}

	return anyNumericToStr(result), nil
}

// GetTotalCostByCompoundID calculates total cost for a compound
func (c *CalculationS) GetTotalCostByCompoundID(ctx context.Context, compoundID string) (string, error) {
	id, err := uuid.Parse(compoundID)
	if err != nil {
		return "0", fmt.Errorf("invalid compound_id: %w", err)
	}

	result, err := c.repo.Tenant(ctx).GetTotalCostByCompoundID(ctx, uuidToPgType(&id))
	if err != nil {
		log.Printf("GetTotalCostByCompoundID failed: %v", err)
		return "0", fmt.Errorf("failed to calculate total cost: %w", err)
	}

	return anyNumericToStr(result), nil
}

// UpdateCalculation updates only the quantity of a calculation
// Also recalculates total_cost automatically: total_cost = quantity × price_per_unit
// If ingredient or compound is wrong, user should DELETE and CREATE a new one
func (c *CalculationS) UpdateCalculation(ctx context.Context, calculationID string, quantity *string) (*model.CalculationResponse, error) {
	id, err := uuid.Parse(calculationID)
	if err != nil {
		return nil, fmt.Errorf("invalid calculation ID: %w", err)
	}

	// Quantity is required
	if quantity == nil || *quantity == "" {
		return nil, fmt.Errorf("quantity is required")
	}

	// Validate quantity is a valid number
	quantityFloat, err := strconv.ParseFloat(*quantity, 64)
	if err != nil {
		return nil, fmt.Errorf("invalid quantity: %w", err)
	}

	if quantityFloat <= 0 {
		return nil, fmt.Errorf("quantity must be greater than 0")
	}

	// Fetch current calculation to get price_per_unit for recalculation
	currentCalc, err := c.repo.Tenant(ctx).GetCalculationByID(ctx, id)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, fmt.Errorf("calculation not found")
		}
		return nil, fmt.Errorf("failed to fetch calculation: %w", err)
	}

	// Get price_per_unit as float
	pricePerUnitStr := numericToStr(currentCalc.PricePerUnit)
	pricePerUnitFloat, err := strconv.ParseFloat(pricePerUnitStr, 64)
	if err != nil {
		return nil, fmt.Errorf("invalid price_per_unit: %w", err)
	}

	// Recalculate total_cost: quantity × price_per_unit
	newTotalCost := quantityFloat * pricePerUnitFloat

	// Update quantity and recalculated total_cost
	params := pg.UpdateCalculationParams{
		ID:        id,
		Quantity:  stringToNumeric(*quantity),
		TotalCost: stringToNumeric(fmt.Sprintf("%.2f", newTotalCost)),
	}

	calculation, err := c.repo.Tenant(ctx).UpdateCalculation(ctx, params)
	if err != nil {
		log.Printf("UpdateCalculation failed: %v", err)
		return nil, fmt.Errorf("failed to update calculation: %w", err)
	}

	if calculation.CompoundID.Valid {
		if err := c.updateCompoundPriceFromCalculations(ctx, calculation.CompoundID.String()); err != nil {
			log.Printf("UpdateCalculation: failed to update compound price: %v", err)
		}
	}

	// Update good's cost fields if this calculation is for a good
	if calculation.GoodID.Valid {
		if err := c.UpdateGoodCostFields(ctx, calculation.GoodID.String()); err != nil {
			log.Printf("UpdateCalculation: failed to update good cost fields: %v", err)
		}
	}

	return toCalculationResponseAny(calculation), nil
}

// DeleteCalculation soft deletes a calculation
func (c *CalculationS) DeleteCalculation(ctx context.Context, calculationID string) error {
	id, err := uuid.Parse(calculationID)
	if err != nil {
		return fmt.Errorf("invalid calculation ID: %w", err)
	}

	// Fetch before delete so we can update related prices after deletion
	calc, err := c.repo.Tenant(ctx).GetCalculationByID(ctx, id)
	if err != nil {
		if err != pgx.ErrNoRows {
			log.Printf("DeleteCalculation: failed to fetch calculation: %v", err)
		}
		return fmt.Errorf("failed to fetch calculation: %w", err)
	}

	if err := c.repo.Tenant(ctx).DeleteCalculation(ctx, id); err != nil {
		log.Printf("DeleteCalculation failed: %v", err)
		return fmt.Errorf("failed to delete calculation: %w", err)
	}

	if calc.CompoundID.Valid {
		if err := c.updateCompoundPriceFromCalculations(ctx, calc.CompoundID.String()); err != nil {
			log.Printf("DeleteCalculation: failed to update compound price: %v", err)
		}
	}

	// Update good's cost fields if this calculation was for a good
	if calc.GoodID.Valid {
		if err := c.UpdateGoodCostFields(ctx, calc.GoodID.String()); err != nil {
			log.Printf("DeleteCalculation: failed to update good cost fields: %v", err)
		}
	}

	return nil
}

// DeleteCalculationsByGoodID deletes all calculations for a good
func (c *CalculationS) DeleteCalculationsByGoodID(ctx context.Context, goodID string) error {
	id, err := uuid.Parse(goodID)
	if err != nil {
		return fmt.Errorf("invalid good_id: %w", err)
	}

	if err := c.repo.Tenant(ctx).DeleteCalculationsByGoodID(ctx, uuidToPgType(&id)); err != nil {
		log.Printf("DeleteCalculationsByGoodID failed: %v", err)
		return fmt.Errorf("failed to delete calculations: %w", err)
	}

	// Update good's cost fields (will set to 0 since no calculations)
	if err := c.UpdateGoodCostFields(ctx, goodID); err != nil {
		log.Printf("DeleteCalculationsByGoodID: failed to update good cost fields: %v", err)
	}

	return nil
}

// DeleteCalculationsByCompoundID deletes all calculations for a compound
func (c *CalculationS) DeleteCalculationsByCompoundID(ctx context.Context, compoundID string) error {
	id, err := uuid.Parse(compoundID)
	if err != nil {
		return fmt.Errorf("invalid compound_id: %w", err)
	}

	if err := c.repo.Tenant(ctx).DeleteCalculationsByCompoundID(ctx, uuidToPgType(&id)); err != nil {
		log.Printf("DeleteCalculationsByCompoundID failed: %v", err)
		return fmt.Errorf("failed to delete calculations: %w", err)
	}

	if err := c.updateCompoundPriceFromCalculations(ctx, compoundID); err != nil {
		log.Printf("DeleteCalculationsByCompoundID: failed to update compound price: %v", err)
	}

	return nil
}

// GetGoodWithCalculations retrieves a good with all its calculations and profit info
func (c *CalculationS) GetGoodWithCalculations(ctx context.Context, goodID string) (*model.GoodCalculationResponse, error) {
	id, err := uuid.Parse(goodID)
	if err != nil {
		return nil, fmt.Errorf("invalid good_id: %w", err)
	}

	// Get the good
	good, err := c.repo.Tenant(ctx).GetGoodByID(ctx, id)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, fmt.Errorf("good not found")
		}
		log.Printf("GetGoodByID failed: %v", err)
		return nil, fmt.Errorf("failed to retrieve good: %w", err)
	}

	calcPtrs, err := c.GetCalculationsByGoodID(ctx, goodID)
	if err != nil {
		log.Printf("GetCalculationsByGoodID failed: %v", err)
		return nil, fmt.Errorf("failed to retrieve calculations: %w", err)
	}

	var calculations []model.CalculationResponse
	for _, calc := range calcPtrs {
		if calc != nil {
			calculations = append(calculations, *calc)
		}
	}

	totalCostStr, err := c.GetTotalCostByGoodID(ctx, goodID)
	if err != nil {
		log.Printf("GetTotalCostByGoodID failed: %v", err)
		totalCostStr = "0"
	}

	sellingPrice, _ := strconv.ParseFloat(numericToStr(good.Price), 64)
	totalCost, _ := strconv.ParseFloat(totalCostStr, 64)
	profit := sellingPrice - totalCost

	// Calculate profit margin as: (profit / total_cost) × 100
	// This shows markup percentage - how much profit relative to cost
	var profitMargin string
	if totalCost > 0 {
		margin := (profit / totalCost) * 100
		profitMargin = fmt.Sprintf("%.2f%%", margin)
	} else {
		profitMargin = "0%"
	}

	return &model.GoodCalculationResponse{
		ID:           good.ID.String(),
		Name:         good.Name,
		Price:        numericToStr(good.Price),
		Calculations: calculations,
		TotalCost:    totalCostStr,
		Profit:       fmt.Sprintf("%.2f", profit),
		ProfitMargin: profitMargin,
	}, nil
}

// GetCompoundWithCalculations retrieves a compound with all its calculations
// Note: Compounds are intermediate products, so profit = 0 and profit_margin = 0
// The compound's price = total cost of all components (auto-calculated)
func (c *CalculationS) GetCompoundWithCalculations(ctx context.Context, compoundID string) (*model.CompoundCalculationResponse, error) {
	id, err := uuid.Parse(compoundID)
	if err != nil {
		return nil, fmt.Errorf("invalid compound_id: %w", err)
	}

	// Get the compound
	compound, err := c.repo.Tenant(ctx).GetCompoundByID(ctx, id)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, fmt.Errorf("compound not found")
		}
		log.Printf("GetCompoundByID failed: %v", err)
		return nil, fmt.Errorf("failed to retrieve compound: %w", err)
	}

	calcPtrs, err := c.GetCalculationsByCompoundID(ctx, compoundID)
	if err != nil {
		log.Printf("GetCalculationsByCompoundID failed: %v", err)
		return nil, fmt.Errorf("failed to retrieve calculations: %w", err)
	}

	var calculations []model.CalculationResponse
	for _, calc := range calcPtrs {
		if calc != nil {
			calculations = append(calculations, *calc)
		}
	}

	// Get total cost (which equals compound's price for intermediate products)
	totalCostStr, err := c.GetTotalCostByCompoundID(ctx, compoundID)
	if err != nil {
		log.Printf("GetTotalCostByCompoundID failed: %v", err)
		totalCostStr = "0"
	}

	// Compounds are intermediate products - no profit margin
	// Price = TotalCost, Profit = 0, ProfitMargin = 0
	return &model.CompoundCalculationResponse{
		ID:           compound.ID.String(),
		Name:         compound.Name,
		Price:        numericToStr(compound.Price),
		Calculations: calculations,
		TotalCost:    totalCostStr,
		Profit:       "0",
		ProfitMargin: "0%",
	}, nil
}

// Helper function to convert to response
type calculationRowFields struct {
	ID                  uuid.UUID
	GoodID              pgtype.UUID
	CompoundID          pgtype.UUID
	IngredientID        pgtype.UUID
	ComponentCompoundID pgtype.UUID
	Quantity            pgtype.Numeric
	MeasurementUnit     string
	PricePerUnit        pgtype.Numeric
	TotalCost           pgtype.Numeric
	CreatedAt           pgtype.Timestamptz
	UpdatedAt           pgtype.Timestamptz
}

func toCalculationResponseAny(row any) *model.CalculationResponse {
	var f calculationRowFields

	switch v := row.(type) {
	case pg.Calculation:
		f = calculationRowFields{
			ID:                  v.ID,
			GoodID:              v.GoodID,
			CompoundID:          v.CompoundID,
			IngredientID:        v.IngredientID,
			ComponentCompoundID: v.ComponentCompoundID,
			Quantity:            v.Quantity,
			MeasurementUnit:     v.MeasurementUnit,
			PricePerUnit:        v.PricePerUnit,
			TotalCost:           v.TotalCost,
			CreatedAt:           v.CreatedAt,
			UpdatedAt:           v.UpdatedAt,
		}
	default:
		return nil
	}

	ingredientID := ""
	if f.IngredientID.Valid {
		ingredientID = f.IngredientID.String()
	}

	return &model.CalculationResponse{
		ID:                  f.ID.String(),
		GoodID:              pgTypeUUIDToString(f.GoodID),
		CompoundID:          pgTypeUUIDToString(f.CompoundID),
		IngredientID:        ingredientID,
		ComponentCompoundID: pgTypeUUIDToString(f.ComponentCompoundID),
		Quantity:            numericToStr(f.Quantity),
		MeasurementUnit:     f.MeasurementUnit,
		PricePerUnit:        numericToStr(f.PricePerUnit),
		TotalCost:           numericToStr(f.TotalCost),
		CreatedAt:           timestampToTime(f.CreatedAt),
		UpdatedAt:           timestampToTime(f.UpdatedAt),
	}
}
