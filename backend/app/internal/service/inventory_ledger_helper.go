package service

import (
	"context"
	"fmt"
	"math/big"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
	pg "gitlab.yurtal.tech/company/maryai/back/internal/repository/pg/tenantsdb"
)

type inventoryMovementPlan struct {
	EventType   string
	QtyIn       pgtype.Numeric
	QtyOut      pgtype.Numeric
	HasMovement bool
}

func inventoryEffectiveAt(countedAt pgtype.Timestamptz) *pgtype.Timestamptz {
	if !countedAt.Valid {
		return nil
	}
	return &countedAt
}

func buildInventoryTransitionPlan(fromQty, toQty pgtype.Numeric) (inventoryMovementPlan, error) {
	zero := inventoryZeroNumeric()

	delta, err := subNumeric(toQty, fromQty, 6)
	if err != nil {
		return inventoryMovementPlan{}, fmt.Errorf("failed to calculate inventory delta: %w", err)
	}

	r, err := ratFromNumeric(delta)
	if err != nil {
		return inventoryMovementPlan{}, fmt.Errorf("failed to parse inventory delta: %w", err)
	}

	switch r.Cmp(big.NewRat(0, 1)) {
	case 0:
		return inventoryMovementPlan{
			EventType:   "",
			QtyIn:       zero,
			QtyOut:      zero,
			HasMovement: false,
		}, nil
	case 1:
		return inventoryMovementPlan{
			EventType:   string(pg.InventorySurplusIn),
			QtyIn:       delta,
			QtyOut:      zero,
			HasMovement: true,
		}, nil
	default:
		absDelta, err := subNumeric(zero, delta, 6)
		if err != nil {
			return inventoryMovementPlan{}, fmt.Errorf("failed to build absolute inventory delta: %w", err)
		}
		return inventoryMovementPlan{
			EventType:   string(pg.InventoryShortageOut),
			QtyIn:       zero,
			QtyOut:      absDelta,
			HasMovement: true,
		}, nil
	}
}

// applyInventoryMovementPlan inserts a stock movement and rebalances the ledger.
// This function expects to be called within an existing transaction context.
// It accepts the tenant queries and transaction context from the caller to ensure
// atomicity with the parent operation.
func (s *InventoryS) applyInventoryMovementPlan(txCtx context.Context, q *pg.Queries, inventoryID uuid.UUID, storageID uuid.UUID, ingredientID uuid.UUID, plan inventoryMovementPlan, effectiveAt *pgtype.Timestamptz) error {
	if !plan.HasMovement || shouldSkipStockMovement(plan.QtyIn, plan.QtyOut) {
		return nil
	}

	zero := inventoryZeroNumeric()
	sourceType := "inventory"
	srcID := inventoryID

	if err := q.InsertIngredientStockMovement(txCtx, pg.InsertIngredientStockMovementParams{
		ID:           uuid.New(),
		StorageID:    storageID,
		IngredientID: ingredientID,
		EventType:    plan.EventType,
		QtyIn:        plan.QtyIn,
		QtyOut:       plan.QtyOut,
		StockBefore:  zero,
		StockAfter:   zero,
		PricePerUnit: zero,
		SourceType:   &sourceType,
		SourceID:     &srcID,
		EffectiveAt:  effectiveAt,
	}); err != nil {
		return fmt.Errorf("failed to insert inventory stock movement: %w", err)
	}

	if err := s.rebalanceInventoryIngredientLedger(txCtx, pgtype.UUID{Bytes: storageID, Valid: true}, ingredientID, q); err != nil {
		return fmt.Errorf("failed to rebalance inventory stock ledger: %w", err)
	}

	return nil
}

func (s *InventoryS) rebalanceInventoryIngredientLedger(ctx context.Context, storageID pgtype.UUID, ingredientID uuid.UUID, q *pg.Queries) error {
	return rebalanceIngredientStockLedger(ctx, q, storageID, ingredientID, "inventory")
}
