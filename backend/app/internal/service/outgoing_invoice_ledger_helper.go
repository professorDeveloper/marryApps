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
	q *pg.Queries,
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

	if err := q.InsertIngredientStockMovement(ctx, pg.InsertIngredientStockMovementParams{
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
		q,
		pgtype.UUID{Bytes: storageID, Valid: true},
		ingredientID,
	); err != nil {
		return fmt.Errorf("failed to rebalance outgoing invoice stock ledger: %w", err)
	}

	return nil
}

func (s *OutgoingInvoiceS) rebalanceOutgoingInvoiceIngredientLedger(
	ctx context.Context,
	q *pg.Queries,
	storageID pgtype.UUID,
	ingredientID uuid.UUID,
) error {
	return s.rebalanceOutgoingIngredientLedger(ctx, q, storageID, ingredientID)
}

func (s *OutgoingInvoiceS) rebalanceOutgoingIngredientLedger(
	ctx context.Context,
	q *pg.Queries,
	storageID pgtype.UUID,
	ingredientID uuid.UUID,
) error {
	return rebalanceIngredientStockLedger(ctx, q, storageID, ingredientID, "outgoing_invoice")
}

func (s *OutgoingInvoiceS) applyOutgoingInvoiceActiveStock(
	ctx context.Context,
	q *pg.Queries,
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
		stockID, err := q.EnsureIngredientStockByStorage(ctx, pg.EnsureIngredientStockByStorageParams{
			ID:           uuid.New(),
			IngredientID: item.IngredientID,
			StorageID:    storageID,
		})
		if err != nil {
			return fmt.Errorf("failed to ensure stock row: %w", err)
		}

		locked, err := q.GetStockByIngredientAndStorageForUpdate(ctx, pg.GetStockByIngredientAndStorageForUpdateParams{
			IngredientID: item.IngredientID,
			StorageID:    storageID,
		})
		if err != nil {
			return fmt.Errorf("failed to lock stock row: %w", err)
		}

		updated, err := q.RemoveFromIngredientStock(ctx, pg.RemoveFromIngredientStockParams{
			ID:       stockID,
			Quantity: item.Quantity,
		})
		if err != nil {
			return fmt.Errorf("failed to deduct stock: %w", err)
		}

		if saveSnapshots {
			if _, err := q.UpdateOutgoingInvoiceItemStockSnapshot(ctx, pg.UpdateOutgoingInvoiceItemStockSnapshotParams{
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

		if err := q.InsertIngredientStockMovement(ctx, pg.InsertIngredientStockMovementParams{
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
		if err := s.rebalanceOutgoingIngredientLedger(ctx, q, pgtype.UUID{Bytes: key.StorageID, Valid: true}, key.IngredientID); err != nil {
			return fmt.Errorf("failed to rebalance outgoing invoice ledger: %w", err)
		}
	}

	return nil
}

// Active outgoing invoice uchun stockni qaytarish helperi.
// cancel/delete/update move paytida ishlatiladi.
func (s *OutgoingInvoiceS) reverseOutgoingInvoiceActiveStock(
	ctx context.Context,
	q *pg.Queries,
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
		stockID, err := q.EnsureIngredientStockByStorage(ctx, pg.EnsureIngredientStockByStorageParams{
			ID:           uuid.New(),
			IngredientID: item.IngredientID,
			StorageID:    storageID,
		})
		if err != nil {
			return fmt.Errorf("failed to ensure stock row during reverse: %w", err)
		}

		locked, err := q.GetStockByIngredientAndStorageForUpdate(ctx, pg.GetStockByIngredientAndStorageForUpdateParams{
			IngredientID: item.IngredientID,
			StorageID:    storageID,
		})
		if err != nil {
			return fmt.Errorf("failed to lock stock row during reverse: %w", err)
		}

		updated, err := q.AddToIngredientStock(ctx, pg.AddToIngredientStockParams{
			ID:       stockID,
			Quantity: item.Quantity,
		})
		if err != nil {
			return fmt.Errorf("failed to restore stock during reverse: %w", err)
		}

		if shouldSkipStockMovement(item.Quantity, zero) {
			continue
		}

		if err := q.InsertIngredientStockMovement(ctx, pg.InsertIngredientStockMovementParams{
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
		if err := s.rebalanceOutgoingIngredientLedger(ctx, q, pgtype.UUID{Bytes: key.StorageID, Valid: true}, key.IngredientID); err != nil {
			return fmt.Errorf("failed to rebalance outgoing invoice reverse ledger: %w", err)
		}
	}

	return nil
}
