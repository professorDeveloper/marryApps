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

func inventoryZeroNumeric() pgtype.Numeric {
	n := pgtype.Numeric{}
	_ = n.Scan("0")
	return n
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

func (s *InventoryS) applyInventoryMovementPlan(ctx context.Context, inventoryID uuid.UUID, storageID uuid.UUID, ingredientID uuid.UUID, plan inventoryMovementPlan, effectiveAt *pgtype.Timestamptz) error {
	if !plan.HasMovement || shouldSkipStockMovement(plan.QtyIn, plan.QtyOut) {
		return nil
	}

	zero := inventoryZeroNumeric()
	sourceType := "inventory"
	srcID := inventoryID

	if err := s.repo.Tenant(ctx).InsertIngredientStockMovement(ctx, pg.InsertIngredientStockMovementParams{
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

	if err := s.rebalanceInventoryIngredientLedger(ctx, pgtype.UUID{Bytes: storageID, Valid: true}, ingredientID); err != nil {
		return fmt.Errorf("failed to rebalance inventory stock ledger: %w", err)
	}

	return nil
}

func (s *InventoryS) rebalanceInventoryIngredientLedger(ctx context.Context, storageID pgtype.UUID, ingredientID uuid.UUID) error {
	if !storageID.Valid {
		return fmt.Errorf("storage_id is required for inventory ledger rebalance")
	}

	q := s.repo.Tenant(ctx)

	_, _ = q.EnsureIngredientStockByStorage(ctx, pg.EnsureIngredientStockByStorageParams{
		ID:           uuid.New(),
		IngredientID: ingredientID,
		StorageID:    storageID,
	})

	rows, err := q.ListIngredientStockMovementsForRebalance(ctx, storageID.Bytes, ingredientID)
	if err != nil {
		return fmt.Errorf("failed to list stock movements for rebalance: %w", err)
	}

	running := inventoryZeroNumeric()

	for _, row := range rows {
		before := running

		after, err := applyMovementDelta(before, row.QtyIn, row.QtyOut, 6)
		if err != nil {
			return fmt.Errorf("failed to calculate inventory movement balance for movement %s: %w", row.ID, err)
		}

		if err := q.UpdateIngredientStockMovementBalances(ctx, pg.UpdateIngredientStockMovementBalancesParams{
			ID:          row.ID,
			StockBefore: before,
			StockAfter:  after,
		}); err != nil {
			return fmt.Errorf("failed to update inventory movement balances for movement %s: %w", row.ID, err)
		}

		running = after
	}

	stockRow, err := q.GetStockByIngredientAndStorageForUpdate(ctx, pg.GetStockByIngredientAndStorageForUpdateParams{
		IngredientID: ingredientID,
		StorageID:    storageID,
	})
	if err != nil {
		return fmt.Errorf("failed to lock ingredient stock for final sync: %w", err)
	}

	if _, err := q.UpdateIngredientStock(ctx, pg.UpdateIngredientStockParams{
		ID:       stockRow.ID,
		Quantity: running,
	}); err != nil {
		return fmt.Errorf("failed to sync ingredient_stock quantity after inventory rebalance: %w", err)
	}

	return nil
}
