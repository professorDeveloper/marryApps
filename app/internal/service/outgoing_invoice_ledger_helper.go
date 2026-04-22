package service

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"

	pg "gitlab.yurtal.tech/company/maryai/back/internal/repository/pg/tenantsdb"
)

func outgoingInvoiceZeroNumeric() pgtype.Numeric {
	n := pgtype.Numeric{}
	_ = n.Scan("0")
	return n
}

func outgoingInvoiceEffectiveAt(ts pgtype.Timestamp) *pgtype.Timestamptz {
	if !ts.Valid {
		return nil
	}

	effective := pgtype.Timestamptz{
		Time:  ts.Time.In(time.UTC),
		Valid: true,
	}

	return &effective
}

type outgoingTouchedKey struct {
	StorageID    uuid.UUID
	IngredientID uuid.UUID
}

func (s *OutgoingInvoiceS) applyOutgoingInvoiceMovement(
	ctx context.Context,
	invoiceID uuid.UUID,
	storageID uuid.UUID,
	ingredientID uuid.UUID,
	qtyOut pgtype.Numeric,
	pricePerUnit pgtype.Numeric,
	effectiveAt *pgtype.Timestamptz,
) error {
	zero := outgoingInvoiceZeroNumeric()

	if shouldSkipStockMovement(zero, qtyOut) {
		return nil
	}

	sourceType := "outgoing_invoice"
	sourceID := invoiceID

	if err := s.repo.Tenant(ctx).InsertIngredientStockMovement(ctx, pg.InsertIngredientStockMovementParams{
		ID:           uuid.New(),
		StorageID:    storageID,
		IngredientID: ingredientID,
		EventType:    string(pg.OutgoingInvoiceOut),
		QtyIn:        zero,
		QtyOut:       qtyOut,
		StockBefore:  zero,
		StockAfter:   zero,
		PricePerUnit: pricePerUnit,
		SourceType:   &sourceType,
		SourceID:     &sourceID,
		EffectiveAt:  effectiveAt,
	}); err != nil {
		return fmt.Errorf("failed to insert outgoing invoice stock movement: %w", err)
	}

	if err := s.rebalanceOutgoingIngredientLedger(
		ctx,
		pgtype.UUID{Bytes: storageID, Valid: true},
		ingredientID,
	); err != nil {
		return fmt.Errorf("failed to rebalance outgoing invoice stock ledger: %w", err)
	}

	return nil
}

func (s *OutgoingInvoiceS) rebalanceOutgoingInvoiceIngredientLedger(
	ctx context.Context,
	storageID pgtype.UUID,
	ingredientID uuid.UUID,
) error {
	return s.rebalanceOutgoingIngredientLedger(ctx, storageID, ingredientID)
}

func (s *OutgoingInvoiceS) rebalanceOutgoingIngredientLedger(
	ctx context.Context,
	storageID pgtype.UUID,
	ingredientID uuid.UUID,
) error {
	if !storageID.Valid {
		return fmt.Errorf("storage_id is required for outgoing invoice ledger rebalance")
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
			return fmt.Errorf("failed to calculate outgoing invoice movement balance for movement %s: %w", row.ID, err)
		}

		if err := q.UpdateIngredientStockMovementBalances(ctx, pg.UpdateIngredientStockMovementBalancesParams{
			ID:          row.ID,
			StockBefore: before,
			StockAfter:  after,
		}); err != nil {
			return fmt.Errorf("failed to update outgoing invoice movement balances for movement %s: %w", row.ID, err)
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
		return fmt.Errorf("failed to sync ingredient_stock quantity after outgoing invoice rebalance: %w", err)
	}

	return nil
}

func (s *OutgoingInvoiceS) applyOutgoingInvoiceActiveStock(
	ctx context.Context,
	invoice pg.OutgoingInvoice,
	items []pg.OutgoingInvoiceItem,
	eventType string,
	saveSnapshots bool,
) error {
	if !invoice.StorageID.Valid {
		return fmt.Errorf("outgoing invoice storage_id is required")
	}

	storageID := invoice.StorageID
	effectiveAt := outgoingInvoiceEffectiveAt(invoice.Date)
	srcType := "outgoing_invoice"
	srcID := invoice.ID
	zero := inventoryZeroNumeric()

	touched := make(map[outgoingTouchedKey]struct{})

	for _, item := range items {
		stockID, err := s.repo.Tenant(ctx).EnsureIngredientStockByStorage(ctx, pg.EnsureIngredientStockByStorageParams{
			ID:           uuid.New(),
			IngredientID: item.IngredientID,
			StorageID:    storageID,
		})
		if err != nil {
			return fmt.Errorf("failed to ensure stock row: %w", err)
		}

		locked, err := s.repo.Tenant(ctx).GetStockByIngredientAndStorageForUpdate(ctx, pg.GetStockByIngredientAndStorageForUpdateParams{
			IngredientID: item.IngredientID,
			StorageID:    storageID,
		})
		if err != nil {
			return fmt.Errorf("failed to lock stock row: %w", err)
		}

		updated, err := s.repo.Tenant(ctx).RemoveFromIngredientStock(ctx, pg.RemoveFromIngredientStockParams{
			ID:       stockID,
			Quantity: item.Quantity,
		})
		if err != nil {
			return fmt.Errorf("failed to deduct stock: %w", err)
		}

		if saveSnapshots {
			if _, err := s.repo.Tenant(ctx).UpdateOutgoingInvoiceItemStockSnapshot(ctx, pg.UpdateOutgoingInvoiceItemStockSnapshotParams{
				ID:          item.ID,
				StockBefore: locked.Quantity,
				StockAfter:  updated.Quantity,
			}); err != nil {
				return fmt.Errorf("failed to update outgoing invoice item stock snapshot: %w", err)
			}
		}

		if shouldSkipStockMovement(zero, item.Quantity) {
			continue
		}

		if err := s.repo.Tenant(ctx).InsertIngredientStockMovement(ctx, pg.InsertIngredientStockMovementParams{
			ID:           uuid.New(),
			StorageID:    uuid.UUID(storageID.Bytes),
			IngredientID: item.IngredientID,
			EventType:    eventType,
			QtyIn:        zero,
			QtyOut:       item.Quantity,
			StockBefore:  locked.Quantity,
			StockAfter:   updated.Quantity,
			PricePerUnit: item.PricePerUnit,
			SourceType:   &srcType,
			SourceID:     &srcID,
			EffectiveAt:  effectiveAt,
		}); err != nil {
			return fmt.Errorf("failed to log outgoing invoice stock movement: %w", err)
		}

		touched[outgoingTouchedKey{
			StorageID:    storageID.Bytes,
			IngredientID: item.IngredientID,
		}] = struct{}{}
	}

	for key := range touched {
		if err := s.rebalanceOutgoingIngredientLedger(ctx, pgtype.UUID{Bytes: key.StorageID, Valid: true}, key.IngredientID); err != nil {
			return fmt.Errorf("failed to rebalance outgoing invoice ledger: %w", err)
		}
	}

	return nil
}

// Active outgoing invoice uchun stockni qaytarish helperi.
// cancel/delete/update move paytida ishlatiladi.
func (s *OutgoingInvoiceS) reverseOutgoingInvoiceActiveStock(
	ctx context.Context,
	invoice pg.OutgoingInvoice,
	items []pg.OutgoingInvoiceItem,
	eventType string,
) error {
	if !invoice.StorageID.Valid {
		return fmt.Errorf("outgoing invoice storage_id is required")
	}

	storageID := invoice.StorageID
	effectiveAt := outgoingInvoiceEffectiveAt(invoice.Date)
	srcType := "outgoing_invoice"
	srcID := invoice.ID
	zero := inventoryZeroNumeric()

	touched := make(map[outgoingTouchedKey]struct{})

	for _, item := range items {
		stockID, err := s.repo.Tenant(ctx).EnsureIngredientStockByStorage(ctx, pg.EnsureIngredientStockByStorageParams{
			ID:           uuid.New(),
			IngredientID: item.IngredientID,
			StorageID:    storageID,
		})
		if err != nil {
			return fmt.Errorf("failed to ensure stock row during reverse: %w", err)
		}

		locked, err := s.repo.Tenant(ctx).GetStockByIngredientAndStorageForUpdate(ctx, pg.GetStockByIngredientAndStorageForUpdateParams{
			IngredientID: item.IngredientID,
			StorageID:    storageID,
		})
		if err != nil {
			return fmt.Errorf("failed to lock stock row during reverse: %w", err)
		}

		updated, err := s.repo.Tenant(ctx).AddToIngredientStock(ctx, pg.AddToIngredientStockParams{
			ID:       stockID,
			Quantity: item.Quantity,
		})
		if err != nil {
			return fmt.Errorf("failed to restore stock during reverse: %w", err)
		}

		if shouldSkipStockMovement(item.Quantity, zero) {
			continue
		}

		if err := s.repo.Tenant(ctx).InsertIngredientStockMovement(ctx, pg.InsertIngredientStockMovementParams{
			ID:           uuid.New(),
			StorageID:    uuid.UUID(storageID.Bytes),
			IngredientID: item.IngredientID,
			EventType:    eventType,
			QtyIn:        item.Quantity,
			QtyOut:       zero,
			StockBefore:  locked.Quantity,
			StockAfter:   updated.Quantity,
			PricePerUnit: item.PricePerUnit,
			SourceType:   &srcType,
			SourceID:     &srcID,
			EffectiveAt:  effectiveAt,
		}); err != nil {
			return fmt.Errorf("failed to log reverse outgoing invoice stock movement: %w", err)
		}

		touched[outgoingTouchedKey{
			StorageID:    storageID.Bytes,
			IngredientID: item.IngredientID,
		}] = struct{}{}
	}

	for key := range touched {
		if err := s.rebalanceOutgoingIngredientLedger(ctx, pgtype.UUID{Bytes: key.StorageID, Valid: true}, key.IngredientID); err != nil {
			return fmt.Errorf("failed to rebalance outgoing invoice reverse ledger: %w", err)
		}
	}

	return nil
}