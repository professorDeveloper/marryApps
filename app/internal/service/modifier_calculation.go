package service

import (
	"context"
	"fmt"
	"log"
	"strconv"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"gitlab.yurtal.tech/company/maryai/back/internal/model"
	pg "gitlab.yurtal.tech/company/maryai/back/internal/repository/pg/tenantsdb"
)

func toModifierCalculationResponse(m pg.ModifierCalculation) *model.ModifierCalculationResponse {
	var ing *string
	if m.IngredientID.Valid {
		s := m.IngredientID.String()
		ing = &s
	}
	var comp *string
	if m.ComponentCompoundID.Valid {
		s := m.ComponentCompoundID.String()
		comp = &s
	}
	var createdAt, updatedAt *time.Time
	if m.CreatedAt.Valid {
		t := m.CreatedAt.Time
		createdAt = &t
	}
	if m.UpdatedAt.Valid {
		t := m.UpdatedAt.Time
		updatedAt = &t
	}
	return &model.ModifierCalculationResponse{
		ID:                  m.ID.String(),
		ModifierID:          m.ModifierID.String(),
		IngredientID:        ing,
		ComponentCompoundID: comp,
		Quantity:            numericToStr(m.Quantity),
		MeasurementUnit:     m.MeasurementUnit,
		PricePerUnit:        numericToStr(m.PricePerUnit),
		TotalCost:           numericToStr(m.TotalCost),
		CreatedAt:           createdAt,
		UpdatedAt:           updatedAt,
	}
}

// CreateModifierCalculationForIngredient adds an ingredient line to a modifier tech card.
func (c *CalculationS) CreateModifierCalculationForIngredient(ctx context.Context, modifierID, ingredientID, quantity string) (*model.ModifierCalculationResponse, error) {
	modifierUUID, err := uuid.Parse(modifierID)
	if err != nil {
		return nil, fmt.Errorf("invalid modifier_id: %w", err)
	}
	if _, err := c.repo.Tenant(ctx).GetModifierByID(ctx, modifierUUID); err != nil {
		if err == pgx.ErrNoRows {
			return nil, fmt.Errorf("modifier not found")
		}
		return nil, fmt.Errorf("failed to fetch modifier: %w", err)
	}

	ingredientUUID, err := uuid.Parse(ingredientID)
	if err != nil {
		return nil, fmt.Errorf("invalid ingredient_id: %w", err)
	}

	quantityFloat, err := strconv.ParseFloat(quantity, 64)
	if err != nil {
		return nil, fmt.Errorf("invalid quantity: %w", err)
	}

	if quantityFloat <= 0 {
		return nil, fmt.Errorf("quantity must be greater than 0")
	}

	ingredient, err := c.repo.Tenant(ctx).GetIngredientByID(ctx, ingredientUUID)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, fmt.Errorf("ingredient not found")
		}
		return nil, fmt.Errorf("failed to fetch ingredient: %w", err)
	}

	var ingredientPriceFloat float64
	if ingredient.PricePerUnit.Valid {
		ingredientPrice := numericToStr(ingredient.PricePerUnit)
		ingredientPriceFloat, err = strconv.ParseFloat(ingredientPrice, 64)
		if err != nil {
			return nil, fmt.Errorf("invalid ingredient price: %w", err)
		}
	}
	totalCostCalc := quantityFloat * ingredientPriceFloat

	measurementUnit := ""
	if ingredient.Measurement.Valid {
		measurementUnit = string(ingredient.Measurement.MeasurementType)
	}

	row, err := c.repo.Tenant(ctx).CreateModifierCalculation(ctx, pg.CreateModifierCalculationParams{
		ID:                  uuid.New(),
		ModifierID:          modifierUUID,
		IngredientID:        pgtype.UUID{Bytes: ingredientUUID, Valid: true},
		ComponentCompoundID: pgtype.UUID{Valid: false},
		Quantity:            stringToNumeric(quantity),
		MeasurementUnit:     measurementUnit,
		PricePerUnit:        stringToNumeric(fmt.Sprintf("%.2f", ingredientPriceFloat)),
		TotalCost:           stringToNumeric(fmt.Sprintf("%.2f", totalCostCalc)),
	})
	if err != nil {
		log.Printf("CreateModifierCalculationForIngredient failed: %v", err)
		return nil, fmt.Errorf("failed to create modifier calculation: %w", err)
	}

	return toModifierCalculationResponse(row), nil
}

// CreateModifierCalculationForCompound adds a child compound line to a modifier tech card.
func (c *CalculationS) CreateModifierCalculationForCompound(ctx context.Context, modifierID, childCompoundID, quantity string) (*model.ModifierCalculationResponse, error) {
	modifierUUID, err := uuid.Parse(modifierID)
	if err != nil {
		return nil, fmt.Errorf("invalid modifier_id: %w", err)
	}
	if _, err := c.repo.Tenant(ctx).GetModifierByID(ctx, modifierUUID); err != nil {
		if err == pgx.ErrNoRows {
			return nil, fmt.Errorf("modifier not found")
		}
		return nil, fmt.Errorf("failed to fetch modifier: %w", err)
	}

	childUUID, err := uuid.Parse(childCompoundID)
	if err != nil {
		return nil, fmt.Errorf("invalid compound_to_add_id: %w", err)
	}

	quantityFloat, err := strconv.ParseFloat(quantity, 64)
	if err != nil {
		return nil, fmt.Errorf("invalid quantity: %w", err)
	}
	if quantityFloat <= 0 {
		return nil, fmt.Errorf("quantity must be greater than 0")
	}

	childCompound, err := c.repo.Tenant(ctx).GetCompoundByID(ctx, childUUID)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, fmt.Errorf("compound not found")
		}
		return nil, fmt.Errorf("failed to fetch compound: %w", err)
	}

	childPrice := numericToStr(childCompound.Price)
	childPriceFloat, _ := strconv.ParseFloat(childPrice, 64)
	totalCostCalc := childPriceFloat * quantityFloat

	row, err := c.repo.Tenant(ctx).CreateModifierCalculation(ctx, pg.CreateModifierCalculationParams{
		ID:                  uuid.New(),
		ModifierID:          modifierUUID,
		IngredientID:        pgtype.UUID{Valid: false},
		ComponentCompoundID: pgtype.UUID{Bytes: childUUID, Valid: true},
		Quantity:            stringToNumeric(quantity),
		MeasurementUnit:     "compound",
		PricePerUnit:        stringToNumeric(fmt.Sprintf("%.2f", childPriceFloat)),
		TotalCost:           stringToNumeric(fmt.Sprintf("%.2f", totalCostCalc)),
	})
	if err != nil {
		log.Printf("CreateModifierCalculationForCompound failed: %v", err)
		return nil, fmt.Errorf("failed to create modifier calculation: %w", err)
	}

	return toModifierCalculationResponse(row), nil
}

// GetModifierCalculationByID returns a modifier calculation row by id.
func (c *CalculationS) GetModifierCalculationByID(ctx context.Context, calculationID string) (*model.ModifierCalculationResponse, error) {
	id, err := uuid.Parse(calculationID)
	if err != nil {
		return nil, fmt.Errorf("invalid calculation id: %w", err)
	}

	var row pg.ModifierCalculation
	err = withTenantRead(ctx, c.repo, func(ctx context.Context, q *pg.Queries) error {
		var err error
		row, err = q.GetModifierCalculationByID(ctx, id)
		if err != nil {
			if err == pgx.ErrNoRows {
				return fmt.Errorf("modifier calculation not found")
			}
			return fmt.Errorf("failed to get modifier calculation: %w", err)
		}
		return nil
	})
	if err != nil {
		return nil, err
	}

	return toModifierCalculationResponse(row), nil
}

// GetModifierCalculationsByModifierID lists tech-card rows for a modifier.
func (c *CalculationS) GetModifierCalculationsByModifierID(ctx context.Context, modifierID string) ([]*model.ModifierCalculationResponse, error) {
	id, err := uuid.Parse(modifierID)
	if err != nil {
		return nil, fmt.Errorf("invalid modifier_id: %w", err)
	}

	var rows []pg.ModifierCalculation
	err = withTenantRead(ctx, c.repo, func(ctx context.Context, q *pg.Queries) error {
		_, err := q.GetModifierByID(ctx, id)
		if err != nil {
			if err == pgx.ErrNoRows {
				return fmt.Errorf("modifier not found")
			}
			return fmt.Errorf("failed to fetch modifier: %w", err)
		}

		rows, err = q.GetModifierCalculationsByModifierID(ctx, id)
		if err != nil {
			return fmt.Errorf("failed to list modifier calculations: %w", err)
		}
		return nil
	})
	if err != nil {
		return nil, err
	}

	out := make([]*model.ModifierCalculationResponse, 0, len(rows))
	for _, row := range rows {
		out = append(out, toModifierCalculationResponse(row))
	}
	return out, nil
}

// GetTotalCostByModifierID returns sum of total_cost for modifier calculations.
func (c *CalculationS) GetTotalCostByModifierID(ctx context.Context, modifierID string) (string, error) {
	id, err := uuid.Parse(modifierID)
	if err != nil {
		return "0", fmt.Errorf("invalid modifier_id: %w", err)
	}

	var raw pgtype.Numeric
	err = withTenantRead(ctx, c.repo, func(ctx context.Context, q *pg.Queries) error {
		var err error
		result, err := q.GetTotalCostByModifierID(ctx, id)
		if err != nil {
			return fmt.Errorf("failed to get total cost: %w", err)
		}
		// Type assertion from interface{} to pgtype.Numeric
		if result != nil {
			raw = result.(pgtype.Numeric)
		}
		return nil
	})
	if err != nil {
		return "0", err
	}

	return anyNumericToStr(raw), nil
}

// UpdateModifierCalculation updates quantity and recalculates total_cost from stored price_per_unit.
func (c *CalculationS) UpdateModifierCalculation(ctx context.Context, calculationID string, quantity *string) (*model.ModifierCalculationResponse, error) {
	id, err := uuid.Parse(calculationID)
	if err != nil {
		return nil, fmt.Errorf("invalid calculation id: %w", err)
	}
	if quantity == nil || *quantity == "" {
		return nil, fmt.Errorf("quantity is required")
	}
	quantityFloat, err := strconv.ParseFloat(*quantity, 64)
	if err != nil {
		return nil, fmt.Errorf("invalid quantity: %w", err)
	}
	if quantityFloat <= 0 {
		return nil, fmt.Errorf("quantity must be greater than 0")
	}

	current, err := c.repo.Tenant(ctx).GetModifierCalculationByID(ctx, id)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, fmt.Errorf("modifier calculation not found")
		}
		return nil, fmt.Errorf("failed to fetch modifier calculation: %w", err)
	}

	pricePerUnitStr := numericToStr(current.PricePerUnit)
	pricePerUnitFloat, err := strconv.ParseFloat(pricePerUnitStr, 64)
	if err != nil {
		return nil, fmt.Errorf("invalid price_per_unit: %w", err)
	}
	newTotalCost := quantityFloat * pricePerUnitFloat

	row, err := c.repo.Tenant(ctx).UpdateModifierCalculation(ctx, pg.UpdateModifierCalculationParams{
		ID:              id,
		Quantity:        stringToNumeric(*quantity),
		MeasurementUnit: current.MeasurementUnit,
		PricePerUnit:    current.PricePerUnit,
		TotalCost:       stringToNumeric(fmt.Sprintf("%.2f", newTotalCost)),
	})
	if err != nil {
		return nil, fmt.Errorf("failed to update modifier calculation: %w", err)
	}
	return toModifierCalculationResponse(row), nil
}

// DeleteModifierCalculation soft-deletes a modifier calculation row.
func (c *CalculationS) DeleteModifierCalculation(ctx context.Context, calculationID string) error {
	id, err := uuid.Parse(calculationID)
	if err != nil {
		return fmt.Errorf("invalid calculation id: %w", err)
	}
	if err := c.repo.Tenant(ctx).DeleteModifierCalculation(ctx, id); err != nil {
		return fmt.Errorf("failed to delete modifier calculation: %w", err)
	}
	return nil
}
