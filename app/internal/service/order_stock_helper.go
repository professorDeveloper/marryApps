package service

import (
	"context"
	"fmt"
	"strconv"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"

	"gitlab.yurtal.tech/company/maryai/back/internal/repository"
	pg "gitlab.yurtal.tech/company/maryai/back/internal/repository/pg/tenantsdb"
)

type orderTouchedKey struct {
	StorageID    uuid.UUID
	IngredientID uuid.UUID
}

func orderMutationEffectiveAt(order pg.GetOrderByIDRow) *pgtype.Timestamptz {
	if order.ClientCreatedAt.Valid {
		t := pgtype.Timestamptz{
			Time:  order.ClientCreatedAt.Time.UTC(),
			Valid: true,
		}
		return &t
	}
	if order.CreatedAt.Valid {
		t := pgtype.Timestamptz{
			Time:  order.CreatedAt.Time.UTC(),
			Valid: true,
		}
		return &t
	}
	t := pgtype.Timestamptz{
		Time:  time.Now().UTC(),
		Valid: true,
	}
	return &t
}

func assertOrderStorageMutationAllowed(
	ctx context.Context,
	repo *repository.Repository,
	order pg.GetOrderByIDRow,
	storageID uuid.UUID,
	entityName string,
) error {
	effectiveAt := orderMutationEffectiveAt(order)
	if effectiveAt == nil || !effectiveAt.Valid {
		return nil
	}
	return assertCanMutateAfterInventory(ctx, repo, storageID, effectiveAt.Time, entityName)
}

func (s *OrderS) rebalanceOrderIngredientLedger(
	ctx context.Context,
	q *pg.Queries,
	storageID pgtype.UUID,
	ingredientID uuid.UUID,
) error {
	if !storageID.Valid {
		return fmt.Errorf("storage_id is required for order ledger rebalance")
	}

	_, _ = q.EnsureIngredientStockByStorage(ctx, pg.EnsureIngredientStockByStorageParams{
		ID:           uuid.New(),
		IngredientID: ingredientID,
		StorageID:    storageID,
	})

	rows, err := q.ListIngredientStockMovementsForRebalance(ctx, storageID.Bytes, ingredientID)
	if err != nil {
		return fmt.Errorf("failed to list order stock movements for rebalance: %w", err)
	}

	running := inventoryZeroNumeric()

	for _, row := range rows {
		before := running
		after, err := applyMovementDelta(before, row.QtyIn, row.QtyOut, 6)
		if err != nil {
			return fmt.Errorf("failed to calculate order movement balance for movement %s: %w", row.ID, err)
		}

		if err := q.UpdateIngredientStockMovementBalances(ctx, pg.UpdateIngredientStockMovementBalancesParams{
			ID:          row.ID,
			StockBefore: before,
			StockAfter:  after,
		}); err != nil {
			return fmt.Errorf("failed to update order movement balances for movement %s: %w", row.ID, err)
		}

		running = after
	}

	stockRow, err := q.GetStockByIngredientAndStorageForUpdate(ctx, pg.GetStockByIngredientAndStorageForUpdateParams{
		IngredientID: ingredientID,
		StorageID:    storageID,
	})
	if err != nil {
		return fmt.Errorf("failed to lock ingredient stock for order final sync: %w", err)
	}

	if _, err := q.UpdateIngredientStock(ctx, pg.UpdateIngredientStockParams{
		ID:       stockRow.ID,
		Quantity: running,
	}); err != nil {
		return fmt.Errorf("failed to sync ingredient_stock quantity after order rebalance: %w", err)
	}

	return nil
}

func (s *OrderS) restoreIngredientUsageToStock(
	ctx context.Context,
	q *pg.Queries,
	storageID pgtype.UUID,
	orderID uuid.UUID,
	effectiveAt *pgtype.Timestamptz,
	eventType string,
	ingredientID uuid.UUID,
	quantity pgtype.Numeric,
) error {
	stockID, err := q.EnsureIngredientStockByStorage(ctx, pg.EnsureIngredientStockByStorageParams{
		ID:           uuid.New(),
		IngredientID: ingredientID,
		StorageID:    storageID,
	})
	if err != nil {
		return fmt.Errorf("failed to ensure ingredient stock row: %w", err)
	}

	locked, err := q.GetStockByIngredientAndStorageForUpdate(ctx, pg.GetStockByIngredientAndStorageForUpdateParams{
		IngredientID: ingredientID,
		StorageID:    storageID,
	})
	if err != nil {
		return fmt.Errorf("failed to lock ingredient stock row: %w", err)
	}

	ing, err := q.GetIngredientByID(ctx, ingredientID)
	if err != nil {
		return fmt.Errorf("failed to get ingredient: %w", err)
	}

	price := ing.PricePerUnit
	if !price.Valid {
		_ = price.Scan("0")
	}

	updated, err := q.AddToIngredientStock(ctx, pg.AddToIngredientStockParams{
		ID:       stockID,
		Quantity: quantity,
	})
	if err != nil {
		return fmt.Errorf("failed to restore ingredient stock: %w", err)
	}

	zero := inventoryZeroNumeric()
	if shouldSkipStockMovement(quantity, zero) {
		return nil
	}

	sourceType := "order"
	srcID := orderID

	if err := q.InsertIngredientStockMovement(ctx, pg.InsertIngredientStockMovementParams{
		ID:           uuid.New(),
		StorageID:    uuid.UUID(storageID.Bytes),
		IngredientID: ingredientID,
		EventType:    eventType,
		QtyIn:        quantity,
		QtyOut:       zero,
		StockBefore:  locked.Quantity,
		StockAfter:   updated.Quantity,
		PricePerUnit: price,
		SourceType:   &sourceType,
		SourceID:     &srcID,
		EffectiveAt:  effectiveAt,
	}); err != nil {
		return fmt.Errorf("failed to insert restore stock movement: %w", err)
	}

	return nil
}

func (s *OrderS) reverseOrderItemStockWithModifiers(
	ctx context.Context,
	q *pg.Queries,
	orderItemID uuid.UUID,
	eventType string,
) error {
	item, err := q.GetOrderItemByID(ctx, orderItemID)
	if err != nil {
		return fmt.Errorf("failed to get order item: %w", err)
	}

	if item.Status.Valid && string(item.Status.OrderItemsStatus) == "cancelled" {
		return nil
	}

	order, err := q.GetOrderByID(ctx, item.OrderID)
	if err != nil {
		return fmt.Errorf("failed to get order: %w", err)
	}

	mult := pgtype.Numeric{}
	mult.Valid = true
	if err := mult.Scan(strconv.Itoa(int(item.Quantity))); err != nil {
		return fmt.Errorf("invalid item quantity: %w", err)
	}

	usages, err := s.expandGoodToIngredientsByCalculations(ctx, q, item.GoodID, mult)
	if err != nil {
		return err
	}

	// Collect all usages from base good and modifiers
	allUsages := make([]ingredientUsage, 0, len(usages))
	allUsages = append(allUsages, usages...)

	// Collect modifier usages
	modRows, err := q.ListOrderItemModifiersByOrderID(ctx, item.OrderID)
	if err != nil {
		return fmt.Errorf("failed to list order item modifiers: %w", err)
	}

	for _, om := range modRows {
		if om.OrderItemID != orderItemID {
			continue
		}

		comb := int64(item.Quantity) * int64(om.Units)
		modMult := pgtype.Numeric{}
		modMult.Valid = true
		if err := modMult.Scan(fmt.Sprintf("%d", comb)); err != nil {
			return fmt.Errorf("invalid modifier multiplier: %w", err)
		}

		modUsages, err := s.expandModifierToIngredientsByCalculations(ctx, q, om.ModifierID, modMult)
		if err != nil {
			return err
		}
		allUsages = append(allUsages, modUsages...)
	}

	// If no calculations at all, skip stock restoration silently
	if len(allUsages) == 0 {
		return nil
	}

	storageID, err := q.GetStorageByGoodID(ctx, item.GoodID)
	if err != nil {
		return fmt.Errorf("failed to get storage for good: %w", err)
	}
	if !storageID.Valid {
		return fmt.Errorf("no active storage configured for good %s", item.GoodID)
	}

	if err := assertOrderStorageMutationAllowed(ctx, s.repo, order, storageID.Bytes, "order item"); err != nil {
		return err
	}

	effectiveAt := orderMutationEffectiveAt(order)
	touched := make(map[orderTouchedKey]struct{})

	// Process all usages (base good + modifiers)
	for _, u := range allUsages {
		if err := s.restoreIngredientUsageToStock(ctx, q, storageID, item.OrderID, effectiveAt, eventType, u.ingredientID, u.quantity); err != nil {
			return err
		}
		touched[orderTouchedKey{
			StorageID:    storageID.Bytes,
			IngredientID: u.ingredientID,
		}] = struct{}{}
	}

	for key := range touched {
		if err := s.rebalanceOrderIngredientLedger(ctx, q, pgtype.UUID{Bytes: key.StorageID, Valid: true}, key.IngredientID); err != nil {
			return err
		}
	}

	return nil
}

func (s *OrderS) reverseOrderItemsStockByOrder(
	ctx context.Context,
	q *pg.Queries,
	orderID uuid.UUID,
	eventType string,
) error {
	items, err := q.GetOrderItemsByOrderID(ctx, orderID)
	if err != nil {
		return fmt.Errorf("failed to get order items: %w", err)
	}

	for _, item := range items {
		if item.Status.Valid && string(item.Status.OrderItemsStatus) == "cancelled" {
			continue
		}
		if err := s.reverseOrderItemStockWithModifiers(ctx, q, item.ID, eventType); err != nil {
			return err
		}
	}

	return nil
}
