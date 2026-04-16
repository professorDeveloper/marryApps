package service

import (
	"context"
	"fmt"
	"math/big"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
	"gitlab.yurtal.tech/company/maryai/back/internal/model"
	"gitlab.yurtal.tech/company/maryai/back/internal/repository"
	pg "gitlab.yurtal.tech/company/maryai/back/internal/repository/pg/tenantsdb"
)

type InvoiceS struct {
	repo *repository.Repository
}

func NewInvoiceS(repo *repository.Repository) *InvoiceS {
	return &InvoiceS{
		repo: repo,
	}
}

// CreateInvoice creates a new invoice
func (s *InvoiceS) CreateInvoice(ctx context.Context, req *model.CreateInvoiceRequest) (*model.InvoiceResponse, error) {
	id := uuid.New()

	// Parse supplier ID
	supplierID, err := uuid.Parse(req.SupplierID)
	if err != nil {
		return nil, fmt.Errorf("invalid supplier id: %w", err)
	}

	// Parse storage ID (optional)
	storageID := pgtype.UUID{Valid: false}
	if req.StorageID != nil && *req.StorageID != "" {
		sid, err := uuid.Parse(*req.StorageID)
		if err != nil {
			return nil, fmt.Errorf("invalid storage_id: %w", err)
		}
		storageID = pgtype.UUID{Bytes: sid, Valid: true}
	}

	// Parse total amount
	totalAmount := pgtype.Numeric{}
	if err := totalAmount.Scan(req.TotalAmount); err != nil {
		return nil, fmt.Errorf("invalid total amount: %w", err)
	}

	// Parse status
	status := pg.NullInvoiceStatus{}
	if req.Status != "" {
		status.InvoiceStatus = pg.InvoiceStatus(req.Status)
		status.Valid = true
	}

	date := pgtype.Timestamp{Time: time.Now(), Valid: true}
	if req.Date != nil && *req.Date != "" {
		parsed, err := time.Parse(time.RFC3339, *req.Date)
		if err != nil {
			parsed, err = time.Parse(time.RFC3339Nano, *req.Date)
			if err != nil {
				return nil, fmt.Errorf("invalid date: %w", err)
			}
		}
		date = pgtype.Timestamp{Time: parsed, Valid: true}
	}

	params := pg.CreateInvoiceParams{
		ID:          id,
		SupplierID:  supplierID,
		StorageID:   storageID,
		TotalAmount: totalAmount,
		Status:      status,
		Date:        date,
	}

	invoice, err := s.repo.Tenant(ctx).CreateInvoice(ctx, params)
	if err != nil {
		return nil, fmt.Errorf("failed to create invoice: %w", err)
	}

	return toInvoiceResponse(invoice), nil
}

// GetInvoiceByID retrieves an invoice by ID
func (s *InvoiceS) GetInvoiceByID(ctx context.Context, id string) (*model.InvoiceResponse, error) {
	invoiceID, err := uuid.Parse(id)
	if err != nil {
		return nil, fmt.Errorf("invalid invoice id: %w", err)
	}

	invoice, err := s.repo.Tenant(ctx).GetInvoiceByID(ctx, invoiceID)
	if err != nil {
		return nil, fmt.Errorf("failed to get invoice: %w", err)
	}

	return toInvoiceResponse(invoice), nil
}

func (s *InvoiceS) GetAllInvoices(ctx context.Context, filter model.InvoiceFilter, limit, offset int32) ([]*model.InvoiceResponse, int64, error) {
	if filter.SortBy == "" {
		filter.SortBy = "date"
	}
	if filter.SortOrder == "" {
		filter.SortOrder = "desc"
	}

	params := pg.GetFilteredInvoicesParams{
		Limit:        limit,
		Offset:       offset,
		StorageID:    filter.StorageID,
		SupplierID:   filter.SupplierID,
		Status:       filter.Status,
		IngredientID: filter.IngredientID,
		Search:       filter.Search,
		SortBy:       filter.SortBy,
		SortOrder:    filter.SortOrder,
	}

	if filter.DateFrom != nil && *filter.DateFrom != "" {
		t, err := time.Parse("2006-01-02", *filter.DateFrom)
		if err != nil {
			t, err = time.Parse(time.RFC3339, *filter.DateFrom)
			if err != nil {
				return nil, 0, fmt.Errorf("invalid date_from: %w", err)
			}
		}
		params.DateFrom = pgtype.Timestamp{Time: t, Valid: true}
	}

	if filter.DateTo != nil && *filter.DateTo != "" {
		t, err := time.Parse("2006-01-02", *filter.DateTo)
		if err != nil {
			t, err = time.Parse(time.RFC3339, *filter.DateTo)
			if err != nil {
				return nil, 0, fmt.Errorf("invalid date_to: %w", err)
			}
		}
		t = t.Add(24*time.Hour - time.Second)
		params.DateTo = pgtype.Timestamp{Time: t, Valid: true}
	}

	countParams := pg.CountFilteredInvoicesParams{
		DateFrom:     params.DateFrom,
		DateTo:       params.DateTo,
		StorageID:    params.StorageID,
		SupplierID:   params.SupplierID,
		Status:       params.Status,
		IngredientID: params.IngredientID,
		Search:       params.Search,
	}

	total, err := s.repo.Tenant(ctx).CountFilteredInvoices(ctx, countParams)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to count invoices: %w", err)
	}

	invoices, err := s.repo.Tenant(ctx).GetFilteredInvoices(ctx, params)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to get invoices: %w", err)
	}

	responses := make([]*model.InvoiceResponse, 0, len(invoices))
	for _, invoice := range invoices {
		responses = append(responses, toInvoiceResponse(invoice))
	}

	return responses, total, nil
}

// UpdateInvoice updates an invoice
func (s *InvoiceS) UpdateInvoice(ctx context.Context, id string, req *model.UpdateInvoiceRequest) (*model.InvoiceResponse, error) {
	invoiceID, err := uuid.Parse(id)
	if err != nil {
		return nil, fmt.Errorf("invalid invoice id: %w", err)
	}

	currentInvoice, err := s.repo.Tenant(ctx).GetInvoiceByID(ctx, invoiceID)
	if err != nil {
		return nil, fmt.Errorf("failed to get invoice: %w", err)
	}

	// Enforce status transition rules
	if req.Status != nil && *req.Status != "" {
		oldStatus := pg.InvoiceStatusPending
		if currentInvoice.Status.Valid {
			oldStatus = currentInvoice.Status.InvoiceStatus
		}
		newStatus := pg.InvoiceStatus(*req.Status)

		if oldStatus == pg.InvoiceStatusCancelled || oldStatus == pg.InvoiceStatusDeleted {
			return nil, fmt.Errorf("cannot change status of a %s invoice", oldStatus)
		}

		if invoiceStatusAppliesStock(oldStatus) && (newStatus == pg.InvoiceStatusCancelled || newStatus == pg.InvoiceStatusDeleted) {
			return nil, fmt.Errorf("cannot cancel or delete a received invoice via update; use DELETE endpoint")
		}
	}

	// Parse storage ID if provided
	storageID := pgtype.UUID{Valid: false}
	if req.StorageID != nil {
		if *req.StorageID != "" {
			sid, err := uuid.Parse(*req.StorageID)
			if err != nil {
				return nil, fmt.Errorf("invalid storage_id: %w", err)
			}
			storageID = pgtype.UUID{Bytes: sid, Valid: true}
		}
	}

	// Parse total amount if provided
	var totalAmount pgtype.Numeric
	if req.TotalAmount != nil {
		if err := totalAmount.Scan(*req.TotalAmount); err != nil {
			return nil, fmt.Errorf("invalid total amount: %w", err)
		}
	} else {
		totalAmount.Valid = false
	}

	// Parse status
	status := pg.NullInvoiceStatus{}
	if req.Status != nil {
		status.InvoiceStatus = pg.InvoiceStatus(*req.Status)
		status.Valid = true
	}

	date := pgtype.Timestamp{Valid: false}
	if req.Date != nil && *req.Date != "" {
		parsed, err := time.Parse(time.RFC3339, *req.Date)
		if err != nil {
			parsed, err = time.Parse(time.RFC3339Nano, *req.Date)
			if err != nil {
				return nil, fmt.Errorf("invalid date: %w", err)
			}
		}
		date = pgtype.Timestamp{Time: parsed, Valid: true}
	}

	// Parse supplier ID if provided
	var supplierID uuid.UUID
	if req.SupplierID != nil {
		sid, err := uuid.Parse(*req.SupplierID)
		if err != nil {
			return nil, fmt.Errorf("invalid supplier id: %w", err)
		}
		supplierID = sid
	}

	params := pg.UpdateInvoiceParams{
		ID:          invoiceID,
		SupplierID:  supplierID,
		StorageID:   storageID,
		TotalAmount: totalAmount,
		Status:      status,
		Date:        date,
	}

	invoice, err := s.repo.Tenant(ctx).UpdateInvoice(ctx, params)
	if err != nil {
		return nil, fmt.Errorf("failed to update invoice: %w", err)
	}

	// Handle status transition stock effects
	if req.Status != nil && *req.Status != "" {
		oldStatus := pg.InvoiceStatusPending
		if currentInvoice.Status.Valid {
			oldStatus = currentInvoice.Status.InvoiceStatus
		}
		newStatus := pg.InvoiceStatus(*req.Status)

		effectiveStorage := currentInvoice.StorageID
		if storageID.Valid {
			effectiveStorage = storageID
		}

		oldAppliesStock := invoiceStatusAppliesStock(oldStatus)
		newAppliesStock := invoiceStatusAppliesStock(newStatus)

		if oldStatus != newStatus {
			details, err := s.repo.Tenant(ctx).GetInvoiceDetailsByInvoiceID(ctx, pg.GetInvoiceDetailsByInvoiceIDParams{
				InvoiceID: invoiceID,
				Limit:     10000,
				Offset:    0,
			})
			if err != nil {
				return nil, fmt.Errorf("failed to get invoice details: %w", err)
			}

			if oldAppliesStock {
				if !currentInvoice.StorageID.Valid {
					return nil, fmt.Errorf("invoice storage_id is required to reverse stock")
				}
				for _, d := range details {
					if err := s.applyInvoiceStockMovement(ctx, currentInvoice.StorageID, d.IngredientID, zeroNumeric(), d.Quantity, "invoice_status_revert_out", d.PricePerUnit, invoiceID, currentInvoice.Date); err != nil {
						return nil, err
					}
				}
			}

			if newAppliesStock {
				if !effectiveStorage.Valid {
					return nil, fmt.Errorf("invoice storage_id is required to apply stock")
				}
				for _, d := range details {
					_, _ = s.repo.Tenant(ctx).UpdateIngredientPriceAndQuantity(ctx, pg.UpdateIngredientPriceAndQuantityParams{
						ID:           d.IngredientID,
						PricePerUnit: d.PricePerUnit,
					})
					triggerPriceRecalculation(ctx, s.repo, d.IngredientID)
					_ = s.repo.Tenant(ctx).EnsureIngredientVisibilityForCurrentBranch(ctx, d.IngredientID)

					if err := s.applyInvoiceStockMovement(ctx, effectiveStorage, d.IngredientID, d.Quantity, zeroNumeric(), "invoice_status_received_in", d.PricePerUnit, invoiceID, currentInvoice.Date); err != nil {
						return nil, err
					}
				}
			}
		}
	}

	// Handle storage change for received invoices (move stock between storages)
	if storageID.Valid && currentInvoice.StorageID.Valid && storageID.Bytes != currentInvoice.StorageID.Bytes {
		oldStatus := pg.InvoiceStatusPending
		if currentInvoice.Status.Valid {
			oldStatus = currentInvoice.Status.InvoiceStatus
		}

		newStatus := oldStatus
		if req.Status != nil && *req.Status != "" {
			newStatus = pg.InvoiceStatus(*req.Status)
		}

		if invoiceStatusAppliesStock(oldStatus) && invoiceStatusAppliesStock(newStatus) {
			details, err := s.repo.Tenant(ctx).GetInvoiceDetailsByInvoiceID(ctx, pg.GetInvoiceDetailsByInvoiceIDParams{
				InvoiceID: invoiceID,
				Limit:     10000,
				Offset:    0,
			})
			if err != nil {
				return nil, fmt.Errorf("failed to get invoice details: %w", err)
			}

			for _, d := range details {
				if err := s.applyInvoiceStockMovement(ctx, currentInvoice.StorageID, d.IngredientID, zeroNumeric(), d.Quantity, "invoice_storage_move_out", d.PricePerUnit, invoiceID, currentInvoice.Date); err != nil {
					return nil, err
				}
				if err := s.applyInvoiceStockMovement(ctx, storageID, d.IngredientID, d.Quantity, zeroNumeric(), "invoice_storage_move_in", d.PricePerUnit, invoiceID, currentInvoice.Date); err != nil {
					return nil, err
				}
			}
		}
	}

	return toInvoiceResponse(invoice), nil
}

func (s *InvoiceS) UpdateInvoiceStatus(ctx context.Context, id string, status string) (*model.InvoiceResponse, error) {
	return s.UpdateInvoice(ctx, id, &model.UpdateInvoiceRequest{
		Status: &status,
	})
}

// DeleteInvoice sets status to 'deleted' for a received invoice and reverses its stock.
// Only received invoices can be deleted. To cancel a pending invoice, use CancelInvoice.
func (s *InvoiceS) DeleteInvoice(ctx context.Context, id string) error {
	invoiceID, err := uuid.Parse(id)
	if err != nil {
		return fmt.Errorf("invalid invoice id: %w", err)
	}

	inv, err := s.repo.Tenant(ctx).GetInvoiceByID(ctx, invoiceID)
	if err != nil {
		return fmt.Errorf("failed to get invoice: %w", err)
	}

	if !invoiceAppliesStock(inv) {
		return fmt.Errorf("only received invoices can be deleted")
	}

	if !inv.StorageID.Valid {
		return fmt.Errorf("invoice storage_id is required to reverse stock")
	}

	details, err := s.repo.Tenant(ctx).GetInvoiceDetailsByInvoiceID(ctx, pg.GetInvoiceDetailsByInvoiceIDParams{
		InvoiceID: invoiceID,
		Limit:     10000,
		Offset:    0,
	})
	if err != nil {
		return fmt.Errorf("failed to get invoice details: %w", err)
	}

	for _, d := range details {
		if err := s.applyInvoiceStockMovement(
			ctx,
			inv.StorageID,
			d.IngredientID,
			zeroNumeric(),
			d.Quantity,
			"invoice_deleted_out",
			d.PricePerUnit,
			invoiceID,
			inv.Date,
		); err != nil {
			return fmt.Errorf("failed to reverse stock for ingredient %s: %w", d.IngredientID, err)
		}
	}

	if _, err := s.repo.Tenant(ctx).MarkInvoiceDeleted(ctx, invoiceID); err != nil {
		return fmt.Errorf("failed to mark invoice as deleted: %w", err)
	}

	return nil
}

// DeleteInvoicesBatch deletes arrived invoices (reversing stock) or cancels pending invoices.
func (s *InvoiceS) DeleteInvoicesBatch(ctx context.Context, req *model.DeleteInvoicesBatchRequest) error {
	if req == nil || len(req.IDs) == 0 {
		return fmt.Errorf("ids are required")
	}
	for _, id := range req.IDs {
		invoiceID, err := uuid.Parse(id)
		if err != nil {
			return fmt.Errorf("invalid invoice id %s: %w", id, err)
		}
		inv, err := s.repo.Tenant(ctx).GetInvoiceByID(ctx, invoiceID)
		if err != nil {
			return fmt.Errorf("invoice %s not found: %w", id, err)
		}
		if !inv.Status.Valid {
			return fmt.Errorf("invoice %s has no status", id)
		}
		switch inv.Status.InvoiceStatus {
		case pg.InvoiceStatusReceived:
			if err := s.DeleteInvoice(ctx, id); err != nil {
				return err
			}
		case pg.InvoiceStatusPending:
			if _, err := s.CancelInvoice(ctx, id); err != nil {
				return err
			}
		default:
			return fmt.Errorf("invoice %s has status %s: only received or pending invoices can be deleted", id, inv.Status.InvoiceStatus)
		}
	}
	return nil
}

// DeleteInvoiceDetailsBatch deletes multiple invoice details by ID, reversing stock for each.
func (s *InvoiceS) DeleteInvoiceDetailsBatch(ctx context.Context, req *model.DeleteInvoiceDetailsBatchRequest) error {
	if req == nil || len(req.IDs) == 0 {
		return fmt.Errorf("ids are required")
	}
	for _, id := range req.IDs {
		if err := s.DeleteInvoiceDetail(ctx, id); err != nil {
			return err
		}
	}
	return nil
}

// CancelInvoice cancels a pending invoice (no stock changes).
func (s *InvoiceS) CancelInvoice(ctx context.Context, id string) (*model.InvoiceResponse, error) {
	invoiceID, err := uuid.Parse(id)
	if err != nil {
		return nil, fmt.Errorf("invalid invoice id: %w", err)
	}

	inv, err := s.repo.Tenant(ctx).GetInvoiceByID(ctx, invoiceID)
	if err != nil {
		return nil, fmt.Errorf("failed to get invoice: %w", err)
	}

	if !inv.Status.Valid || inv.Status.InvoiceStatus != pg.InvoiceStatusPending {
		return nil, fmt.Errorf("only pending invoices can be cancelled")
	}

	result, err := s.repo.Tenant(ctx).CancelInvoice(ctx, invoiceID)
	if err != nil {
		return nil, fmt.Errorf("failed to cancel invoice: %w", err)
	}

	return toInvoiceResponse(result), nil
}

// ArriveInvoice transitions a pending invoice to arrived.
// No stock is applied at this stage; stock is applied only when status becomes received.
func (s *InvoiceS) ArriveInvoice(ctx context.Context, id string) (*model.InvoiceResponse, error) {
	invoiceID, err := uuid.Parse(id)
	if err != nil {
		return nil, fmt.Errorf("invalid invoice id: %w", err)
	}

	inv, err := s.repo.Tenant(ctx).GetInvoiceByID(ctx, invoiceID)
	if err != nil {
		return nil, fmt.Errorf("failed to get invoice: %w", err)
	}

	if !inv.Status.Valid || inv.Status.InvoiceStatus != pg.InvoiceStatusPending {
		return nil, fmt.Errorf("only pending invoices can be arrived")
	}

	status := string(pg.InvoiceStatusArrived)
	return s.UpdateInvoiceStatus(ctx, id, status)
}

// RestoreInvoice restores a deleted invoice
func (s *InvoiceS) RestoreInvoice(ctx context.Context, id string) error {
	invoiceID, err := uuid.Parse(id)
	if err != nil {
		return fmt.Errorf("invalid invoice id: %w", err)
	}

	if err := s.repo.Tenant(ctx).RestoreInvoice(ctx, invoiceID); err != nil {
		return fmt.Errorf("failed to restore invoice: %w", err)
	}

	return nil
}

// GetInvoiceWithDetails retrieves an invoice with details count
func (s *InvoiceS) GetInvoiceWithDetails(ctx context.Context, id string) (*model.InvoiceGetWithDetailsResponse, error) {
	invoiceID, err := uuid.Parse(id)
	if err != nil {
		return nil, fmt.Errorf("invalid invoice id: %w", err)
	}

	invoice, err := s.repo.Tenant(ctx).GetInvoiceWithDetails(ctx, invoiceID)
	if err != nil {
		return nil, fmt.Errorf("failed to get invoice with details: %w", err)
	}

	return toInvoiceWithDetailsResponse(invoice), nil
}

// ==================== INVOICE DETAIL METHODS ====================

// CreateInvoiceDetail creates a new invoice detail and updates ingredient's price_per_unit and quantity
func (s *InvoiceS) CreateInvoiceDetail(ctx context.Context, invoiceID string, req *model.CreateInvoiceDetailRequest) (*model.InvoiceDetailResponse, error) {
	id := uuid.New()
	invoiceUUID, err := uuid.Parse(invoiceID)
	if err != nil {
		return nil, fmt.Errorf("invalid invoice id: %w", err)
	}

	invoice, err := s.repo.Tenant(ctx).GetInvoiceByID(ctx, invoiceUUID)
	if err != nil {
		return nil, fmt.Errorf("failed to get invoice: %w", err)
	}

	appliesStock := invoiceAppliesStock(invoice)
	if appliesStock && !invoice.StorageID.Valid {
		return nil, fmt.Errorf("invoice storage_id is required to update stock")
	}

	ingredientUUID, err := uuid.Parse(req.IngredientID)
	if err != nil {
		return nil, fmt.Errorf("invalid ingredient id: %w", err)
	}

	price := pgtype.Numeric{}
	if err := price.Scan(req.Price); err != nil {
		return nil, fmt.Errorf("invalid price: %w", err)
	}

	pricePerUnit := pgtype.Numeric{}
	if err := pricePerUnit.Scan(req.PricePerUnit); err != nil {
		return nil, fmt.Errorf("invalid price per unit: %w", err)
	}

	qty := pgtype.Numeric{}
	if err := qty.Scan(req.Quantity); err != nil {
		return nil, fmt.Errorf("invalid quantity: %w", err)
	}

	detail, err := s.repo.Tenant(ctx).CreateInvoiceDetail(ctx, pg.CreateInvoiceDetailParams{
		ID:           id,
		InvoiceID:    invoiceUUID,
		IngredientID: ingredientUUID,
		Quantity:     qty,
		Price:        price,
		PricePerUnit: pricePerUnit,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to create invoice detail: %w", err)
	}

	if appliesStock {
		if _, err := s.repo.Tenant(ctx).UpdateIngredientPriceAndQuantity(ctx, pg.UpdateIngredientPriceAndQuantityParams{
			ID:           ingredientUUID,
			PricePerUnit: pricePerUnit,
		}); err != nil {
			return nil, fmt.Errorf("failed to update ingredient price_per_unit: %w", err)
		}

		triggerPriceRecalculation(ctx, s.repo, ingredientUUID)

		if err := s.repo.Tenant(ctx).EnsureIngredientVisibilityForCurrentBranch(ctx, ingredientUUID); err != nil {
			return nil, fmt.Errorf("failed to ensure ingredient visibility: %w", err)
		}

		if err := s.applyInvoiceStockMovement(
			ctx,
			invoice.StorageID,
			ingredientUUID,
			qty,
			zeroNumeric(),
			"invoice_in",
			pricePerUnit,
			invoiceUUID,
			invoice.Date,
		); err != nil {
			return nil, err
		}
	}

	return toInvoiceDetailResponse(detail), nil
}

// CreateInvoiceDetailsBatch creates multiple invoice details in a single operation
func (s *InvoiceS) CreateInvoiceDetailsBatch(ctx context.Context, invoiceID string, req *model.CreateInvoiceDetailBatchRequest) (*model.InvoiceDetailBatchResponse, error) {
	invoiceUUID, err := uuid.Parse(invoiceID)
	if err != nil {
		return nil, fmt.Errorf("invalid invoice id: %w", err)
	}

	invoice, err := s.repo.Tenant(ctx).GetInvoiceByID(ctx, invoiceUUID)
	if err != nil {
		return nil, fmt.Errorf("invoice not found: %w", err)
	}

	if invoice.ID == uuid.Nil {
		return nil, fmt.Errorf("invoice not found")
	}

	batchAppliesStock := invoiceAppliesStock(invoice)
	if batchAppliesStock && !invoice.StorageID.Valid {
		return nil, fmt.Errorf("invoice storage_id is required to update stock")
	}

	response := &model.InvoiceDetailBatchResponse{
		Success: 0,
		Failed:  0,
		Details: make([]model.InvoiceDetailResponse, 0, len(req.Details)),
		Errors:  make([]string, 0),
	}

	for i, item := range req.Details {
		ingredientUUID, err := uuid.Parse(item.IngredientID)
		if err != nil {
			response.Failed++
			response.Errors = append(response.Errors, fmt.Sprintf("item %d: invalid ingredient id: %v", i+1, err))
			continue
		}

		ingredient, err := s.repo.Tenant(ctx).GetIngredientByID(ctx, ingredientUUID)
		if err != nil {
			response.Failed++
			response.Errors = append(response.Errors, fmt.Sprintf("item %d: ingredient not found: %v", i+1, err))
			continue
		}
		if ingredient.ID == uuid.Nil {
			response.Failed++
			response.Errors = append(response.Errors, fmt.Sprintf("item %d: ingredient not found", i+1))
			continue
		}

		price := pgtype.Numeric{}
		if err := price.Scan(item.Price); err != nil {
			response.Failed++
			response.Errors = append(response.Errors, fmt.Sprintf("item %d: invalid price: %v", i+1, err))
			continue
		}

		pricePerUnit := pgtype.Numeric{}
		if err := pricePerUnit.Scan(item.PricePerUnit); err != nil {
			response.Failed++
			response.Errors = append(response.Errors, fmt.Sprintf("item %d: invalid price per unit: %v", i+1, err))
			continue
		}

		qty := pgtype.Numeric{}
		if err := qty.Scan(item.Quantity); err != nil {
			response.Failed++
			response.Errors = append(response.Errors, fmt.Sprintf("item %d: invalid quantity: %v", i+1, err))
			continue
		}

		invoiceDetail, err := s.repo.Tenant(ctx).CreateInvoiceDetail(ctx, pg.CreateInvoiceDetailParams{
			ID:           uuid.New(),
			InvoiceID:    invoiceUUID,
			IngredientID: ingredientUUID,
			Quantity:     qty,
			Price:        price,
			PricePerUnit: pricePerUnit,
		})
		if err != nil {
			response.Failed++
			response.Errors = append(response.Errors, fmt.Sprintf("item %d: failed to create invoice detail: %v", i+1, err))
			continue
		}

		if batchAppliesStock {
			if _, err := s.repo.Tenant(ctx).UpdateIngredientPriceAndQuantity(ctx, pg.UpdateIngredientPriceAndQuantityParams{
				ID:           ingredientUUID,
				PricePerUnit: pricePerUnit,
			}); err != nil {
				return nil, fmt.Errorf("item %d: failed to update ingredient price_per_unit: %w", i+1, err)
			}

			triggerPriceRecalculation(ctx, s.repo, ingredientUUID)

			if err := s.repo.Tenant(ctx).EnsureIngredientVisibilityForCurrentBranch(ctx, ingredientUUID); err != nil {
				return nil, fmt.Errorf("item %d: failed to ensure ingredient visibility: %w", i+1, err)
			}

			if err := s.applyInvoiceStockMovement(
				ctx,
				invoice.StorageID,
				ingredientUUID,
				qty,
				zeroNumeric(),
				"invoice_in",
				pricePerUnit,
				invoiceUUID,
				invoice.Date,
			); err != nil {
				return nil, fmt.Errorf("item %d: failed to add stock: %w", i+1, err)
			}
		}

		response.Success++
		response.Details = append(response.Details, *toInvoiceDetailResponse(invoiceDetail))
	}

	return response, nil
}

// GetInvoiceDetailByID retrieves an invoice detail by ID
func (s *InvoiceS) GetInvoiceDetailByID(ctx context.Context, id string) (*model.InvoiceDetailResponse, error) {
	detailID, err := uuid.Parse(id)
	if err != nil {
		return nil, fmt.Errorf("invalid detail id: %w", err)
	}

	detail, err := s.repo.Tenant(ctx).GetInvoiceDetailByID(ctx, detailID)
	if err != nil {
		return nil, fmt.Errorf("failed to get invoice detail: %w", err)
	}

	return toInvoiceDetailResponse(detail), nil
}

// GetAllInvoiceDetails retrieves all invoice details with pagination
func (s *InvoiceS) GetAllInvoiceDetails(ctx context.Context, limit, offset int32) ([]*model.InvoiceDetailResponse, int64, error) {
	total, err := s.repo.Tenant(ctx).CountInvoiceDetails(ctx)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to count invoice details: %w", err)
	}

	details, err := s.repo.Tenant(ctx).GetAllInvoiceDetails(ctx, pg.GetAllInvoiceDetailsParams{
		Limit:  limit,
		Offset: offset,
	})
	if err != nil {
		return nil, 0, fmt.Errorf("failed to get invoice details: %w", err)
	}

	var responses []*model.InvoiceDetailResponse
	for _, detail := range details {
		responses = append(responses, toInvoiceDetailResponse(detail))
	}

	return responses, total, nil
}

// GetInvoiceDetailsByInvoiceID retrieves details for a specific invoice
func (s *InvoiceS) GetInvoiceDetailsByInvoiceID(ctx context.Context, invoiceID string, limit, offset int32) ([]*model.InvoiceDetailResponse, int64, error) {
	invUUID, err := uuid.Parse(invoiceID)
	if err != nil {
		return nil, 0, fmt.Errorf("invalid invoice id: %w", err)
	}

	total, err := s.repo.Tenant(ctx).CountInvoiceDetailsByInvoice(ctx, invUUID)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to count invoice details by invoice id: %w", err)
	}

	details, err := s.repo.Tenant(ctx).GetInvoiceDetailsByInvoiceID(ctx, pg.GetInvoiceDetailsByInvoiceIDParams{
		InvoiceID: invUUID,
		Limit:     limit,
		Offset:    offset,
	})
	if err != nil {
		return nil, 0, fmt.Errorf("failed to get invoice details by invoice id: %w", err)
	}

	var responses []*model.InvoiceDetailResponse
	for _, detail := range details {
		responses = append(responses, toInvoiceDetailResponse(detail))
	}

	return responses, total, nil
}

// GetInvoiceDetailsByIngredientID retrieves details for a specific ingredient
func (s *InvoiceS) GetInvoiceDetailsByIngredientID(ctx context.Context, ingredientID string, limit, offset int32) ([]*model.InvoiceDetailResponse, int64, error) {
	ingUUID, err := uuid.Parse(ingredientID)
	if err != nil {
		return nil, 0, fmt.Errorf("invalid ingredient id: %w", err)
	}

	total, err := s.repo.Tenant(ctx).CountInvoiceDetailsByIngredient(ctx, ingUUID)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to count invoice details by ingredient id: %w", err)
	}

	details, err := s.repo.Tenant(ctx).GetInvoiceDetailsByIngredientID(ctx, pg.GetInvoiceDetailsByIngredientIDParams{
		IngredientID: ingUUID,
		Limit:        limit,
		Offset:       offset,
	})
	if err != nil {
		return nil, 0, fmt.Errorf("failed to get invoice details by ingredient id: %w", err)
	}

	var responses []*model.InvoiceDetailResponse
	for _, detail := range details {
		responses = append(responses, toInvoiceDetailResponse(detail))
	}

	return responses, total, nil
}

// UpdateInvoiceDetail updates an invoice detail
func (s *InvoiceS) UpdateInvoiceDetail(ctx context.Context, id string, req *model.UpdateInvoiceDetailRequest) (*model.InvoiceDetailResponse, error) {
	detailID, err := uuid.Parse(id)
	if err != nil {
		return nil, fmt.Errorf("invalid detail id: %w", err)
	}

	var ingredientID uuid.UUID
	if req.IngredientID != nil {
		ingUUID, err := uuid.Parse(*req.IngredientID)
		if err != nil {
			return nil, fmt.Errorf("invalid ingredient id: %w", err)
		}
		ingredientID = ingUUID
	} else {
		ingredientID = uuid.UUID{}
	}

	// Parse amounts if provided
	var price pgtype.Numeric
	if req.Price != nil {
		if err := price.Scan(*req.Price); err != nil {
			return nil, fmt.Errorf("invalid price: %w", err)
		}
	} else {
		price.Valid = false
	}

	var pricePerUnit pgtype.Numeric
	if req.PricePerUnit != nil {
		if err := pricePerUnit.Scan(*req.PricePerUnit); err != nil {
			return nil, fmt.Errorf("invalid price per unit: %w", err)
		}
	} else {
		pricePerUnit.Valid = false
	}

	var quantity pgtype.Numeric
	if req.Quantity != nil {
		if err := quantity.Scan(*req.Quantity); err != nil {
			return nil, fmt.Errorf("invalid quantity: %w", err)
		}
	} else {
		quantity.Valid = false
	}

	// Build the update parameters - we need to get current values for fields we're not updating
	currentDetail, err := s.repo.Tenant(ctx).GetInvoiceDetailByID(ctx, detailID)
	if err != nil {
		return nil, fmt.Errorf("failed to get current invoice detail: %w", err)
	}

	inv, err := s.repo.Tenant(ctx).GetInvoiceByID(ctx, currentDetail.InvoiceID)
	if err != nil {
		return nil, fmt.Errorf("failed to get invoice: %w", err)
	}

	appliesStock := invoiceAppliesStock(inv)
	if appliesStock && !inv.StorageID.Valid {
		return nil, fmt.Errorf("invoice storage_id is required to update stock")
	}

	// Use new values if provided, otherwise keep current values
	updateIngredientID := ingredientID
	if ingredientID == (uuid.UUID{}) {
		updateIngredientID = currentDetail.IngredientID
	}

	updateQuantity := quantity
	if req.Quantity == nil {
		updateQuantity = currentDetail.Quantity
	}

	updatePrice := price
	if req.Price == nil {
		updatePrice = currentDetail.Price
	}

	updatePricePerUnit := pricePerUnit
	if req.PricePerUnit == nil {
		updatePricePerUnit = currentDetail.PricePerUnit
	}

	params := pg.UpdateInvoiceDetailParams{
		ID:           detailID,
		IngredientID: updateIngredientID,
		Quantity:     updateQuantity,
		Price:        updatePrice,
		PricePerUnit: updatePricePerUnit,
	}

	detail, err := s.repo.Tenant(ctx).UpdateInvoiceDetail(ctx, params)
	if err != nil {
		return nil, fmt.Errorf("failed to update invoice detail: %w", err)
	}

	if appliesStock && updatePricePerUnit.Valid {
		_, _ = s.repo.Tenant(ctx).UpdateIngredientPriceAndQuantity(ctx, pg.UpdateIngredientPriceAndQuantityParams{
			ID:           updateIngredientID,
			PricePerUnit: updatePricePerUnit,
		})
		triggerPriceRecalculation(ctx, s.repo, updateIngredientID)
	}

	if appliesStock {
		sourceID := currentDetail.InvoiceID
		if currentDetail.IngredientID != updateIngredientID {
			if err := s.applyInvoiceStockMovement(ctx, inv.StorageID, currentDetail.IngredientID, zeroNumeric(), currentDetail.Quantity, "invoice_update_out", currentDetail.PricePerUnit, sourceID, inv.Date); err != nil {
				return nil, err
			}
			if err := s.applyInvoiceStockMovement(ctx, inv.StorageID, updateIngredientID, updateQuantity, zeroNumeric(), "invoice_update_in", updatePricePerUnit, sourceID, inv.Date); err != nil {
				return nil, err
			}
		} else {
			cmp, err := cmpNumeric(updateQuantity, currentDetail.Quantity)
			if err != nil {
				return nil, err
			}
			if cmp > 0 {
				diff, err := subAbsNumeric(updateQuantity, currentDetail.Quantity, 6)
				if err != nil {
					return nil, err
				}
				if err := s.applyInvoiceStockMovement(ctx, inv.StorageID, updateIngredientID, diff, zeroNumeric(), "invoice_update_in", updatePricePerUnit, sourceID, inv.Date); err != nil {
					return nil, err
				}
			} else if cmp < 0 {
				diff, err := subAbsNumeric(updateQuantity, currentDetail.Quantity, 6)
				if err != nil {
					return nil, err
				}
				if err := s.applyInvoiceStockMovement(ctx, inv.StorageID, updateIngredientID, zeroNumeric(), diff, "invoice_update_out", currentDetail.PricePerUnit, sourceID, inv.Date); err != nil {
					return nil, err
				}
			} else {
				if numericToString(updatePricePerUnit) != numericToString(currentDetail.PricePerUnit) {
					if err := s.applyInvoiceStockMovement(ctx, inv.StorageID, updateIngredientID, zeroNumeric(), zeroNumeric(), "invoice_price_update", updatePricePerUnit, sourceID, inv.Date); err != nil {
						return nil, err
					}
				}
			}
		}
	}

	return toInvoiceDetailResponse(detail), nil
}

// UpdateInvoiceDetailQuantity updates invoice detail quantity and recalculates price
func (s *InvoiceS) UpdateInvoiceDetailQuantity(ctx context.Context, id string, quantity string) (*model.InvoiceDetailResponse, error) {
	detailID, err := uuid.Parse(id)
	if err != nil {
		return nil, fmt.Errorf("invalid detail id: %w", err)
	}

	currentDetail, err := s.repo.Tenant(ctx).GetInvoiceDetailByID(ctx, detailID)
	if err != nil {
		return nil, fmt.Errorf("failed to get current invoice detail: %w", err)
	}
	inv, err := s.repo.Tenant(ctx).GetInvoiceByID(ctx, currentDetail.InvoiceID)
	if err != nil {
		return nil, fmt.Errorf("failed to get invoice: %w", err)
	}
	appliesStock := invoiceAppliesStock(inv)
	if appliesStock && !inv.StorageID.Valid {
		return nil, fmt.Errorf("invoice storage_id is required to update stock")
	}

	qty := pgtype.Numeric{}
	if err := qty.Scan(quantity); err != nil {
		return nil, fmt.Errorf("invalid quantity: %w", err)
	}

	detail, err := s.repo.Tenant(ctx).UpdateInvoiceDetailQuantity(ctx, pg.UpdateInvoiceDetailQuantityParams{
		ID:       detailID,
		Quantity: qty,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to update invoice detail quantity: %w", err)
	}

	if appliesStock {
		cmp, err := cmpNumeric(detail.Quantity, currentDetail.Quantity)
		if err != nil {
			return nil, err
		}
		if cmp > 0 {
			diff, err := subAbsNumeric(detail.Quantity, currentDetail.Quantity, 6)
			if err != nil {
				return nil, err
			}
			if err := s.applyInvoiceStockMovement(ctx, inv.StorageID, currentDetail.IngredientID, diff, zeroNumeric(), "invoice_update_in", currentDetail.PricePerUnit, currentDetail.InvoiceID, inv.Date); err != nil {
				return nil, err
			}
		} else if cmp < 0 {
			diff, err := subAbsNumeric(detail.Quantity, currentDetail.Quantity, 6)
			if err != nil {
				return nil, err
			}
			if err := s.applyInvoiceStockMovement(ctx, inv.StorageID, currentDetail.IngredientID, zeroNumeric(), diff, "invoice_update_out", currentDetail.PricePerUnit, currentDetail.InvoiceID, inv.Date); err != nil {
				return nil, err
			}
		}
	}

	return toInvoiceDetailResponse(detail), nil
}

// DeleteInvoiceDetail soft deletes an invoice detail
func (s *InvoiceS) DeleteInvoiceDetail(ctx context.Context, id string) error {
	detailID, err := uuid.Parse(id)
	if err != nil {
		return fmt.Errorf("invalid detail id: %w", err)
	}

	currentDetail, err := s.repo.Tenant(ctx).GetInvoiceDetailByID(ctx, detailID)
	if err != nil {
		return fmt.Errorf("failed to get invoice detail: %w", err)
	}
	inv, err := s.repo.Tenant(ctx).GetInvoiceByID(ctx, currentDetail.InvoiceID)
	if err != nil {
		return fmt.Errorf("failed to get invoice: %w", err)
	}
	appliesStock := invoiceAppliesStock(inv)
	if appliesStock && !inv.StorageID.Valid {
		return fmt.Errorf("invoice storage_id is required to update stock")
	}

	if err := s.repo.Tenant(ctx).DeleteInvoiceDetail(ctx, detailID); err != nil {
		return fmt.Errorf("failed to delete invoice detail: %w", err)
	}

	if appliesStock {
		if err := s.applyInvoiceStockMovement(ctx, inv.StorageID, currentDetail.IngredientID, zeroNumeric(), currentDetail.Quantity, "invoice_delete_out", currentDetail.PricePerUnit, currentDetail.InvoiceID, inv.Date); err != nil {
			return err
		}
	}

	return nil
}

// RestoreInvoiceDetail restores a deleted invoice detail
func (s *InvoiceS) RestoreInvoiceDetail(ctx context.Context, id string) error {
	detailID, err := uuid.Parse(id)
	if err != nil {
		return fmt.Errorf("invalid detail id: %w", err)
	}

	if err := s.repo.Tenant(ctx).RestoreInvoiceDetail(ctx, detailID); err != nil {
		return fmt.Errorf("failed to restore invoice detail: %w", err)
	}

	detail, err := s.repo.Tenant(ctx).GetInvoiceDetailByID(ctx, detailID)
	if err != nil {
		return fmt.Errorf("failed to get restored invoice detail: %w", err)
	}
	inv, err := s.repo.Tenant(ctx).GetInvoiceByID(ctx, detail.InvoiceID)
	if err != nil {
		return fmt.Errorf("failed to get invoice: %w", err)
	}
	appliesStock := invoiceAppliesStock(inv)
	if appliesStock && !inv.StorageID.Valid {
		return fmt.Errorf("invoice storage_id is required to update stock")
	}
	if appliesStock {
		if err := s.applyInvoiceStockMovement(ctx, inv.StorageID, detail.IngredientID, detail.Quantity, zeroNumeric(), "invoice_restore_in", detail.PricePerUnit, detail.InvoiceID, inv.Date); err != nil {
			return err
		}
	}

	return nil
}

func (s *InvoiceS) applyInvoiceStockMovement(ctx context.Context, storageID pgtype.UUID, ingredientID uuid.UUID, qtyIn, qtyOut pgtype.Numeric, eventType string, pricePerUnit pgtype.Numeric, invoiceID uuid.UUID, invoiceDate pgtype.Timestamp) error {
	if !storageID.Valid {
		return fmt.Errorf("invoice storage_id is required to update stock")
	}
	if numericToString(qtyIn) != "0" && numericToString(qtyOut) != "0" {
		return fmt.Errorf("invalid movement: both qty_in and qty_out set")
	}

	_, _ = s.repo.Tenant(ctx).EnsureIngredientStockByStorage(ctx, pg.EnsureIngredientStockByStorageParams{
		ID:           uuid.New(),
		IngredientID: ingredientID,
		StorageID:    storageID,
	})

	locked, err := s.repo.Tenant(ctx).GetStockByIngredientAndStorageForUpdate(ctx, pg.GetStockByIngredientAndStorageForUpdateParams{
		IngredientID: ingredientID,
		StorageID:    storageID,
	})
	if err != nil {
		return fmt.Errorf("failed to lock ingredient stock: %w", err)
	}
	stockBefore := locked.Quantity
	stockAfter := stockBefore

	if numericToString(qtyIn) != "0" {
		updated, err := s.repo.Tenant(ctx).UpsertAddIngredientStockByStorage(ctx, pg.UpsertAddIngredientStockByStorageParams{
			ID:           uuid.New(),
			IngredientID: ingredientID,
			StorageID:    storageID,
			Quantity:     qtyIn,
		})
		if err != nil {
			return fmt.Errorf("failed to add ingredient stock: %w", err)
		}
		stockAfter = updated.Quantity
	} else if numericToString(qtyOut) != "0" {
		updated, err := s.repo.Tenant(ctx).RemoveFromIngredientStock(ctx, pg.RemoveFromIngredientStockParams{
			ID:       locked.ID,
			Quantity: qtyOut,
		})
		if err != nil {
			return fmt.Errorf("failed to remove ingredient stock: %w", err)
		}
		stockAfter = updated.Quantity
	}

	zero := pgtype.Numeric{}
	_ = zero.Scan("0")
	if !pricePerUnit.Valid {
		pricePerUnit = zero
	}
	sourceType := "invoice"
	invID := invoiceID

	// Convert invoice date to TIMESTAMPTZ for effective_at
	var effectiveAt *pgtype.Timestamptz
	if invoiceDate.Valid {
		effectiveAt = &pgtype.Timestamptz{Time: invoiceDate.Time, Valid: true}
	}

	if err := s.repo.Tenant(ctx).InsertIngredientStockMovement(ctx, pg.InsertIngredientStockMovementParams{
		ID:           uuid.New(),
		StorageID:    uuid.UUID(storageID.Bytes),
		IngredientID: ingredientID,
		EventType:    eventType,
		QtyIn:        qtyIn,
		QtyOut:       qtyOut,
		StockBefore:  stockBefore,
		StockAfter:   stockAfter,
		PricePerUnit: pricePerUnit,
		SourceType:   &sourceType,
		SourceID:     &invID,
		EffectiveAt:  effectiveAt,
	}); err != nil {
		return fmt.Errorf("failed to insert stock movement: %w", err)
	}
	return nil
}

func ratFromNumeric(n pgtype.Numeric) (*big.Rat, error) {
	s := numericToString(n)
	r := new(big.Rat)
	if _, ok := r.SetString(s); !ok {
		return nil, fmt.Errorf("invalid numeric: %s", s)
	}
	return r, nil
}

func numericFromRat(r *big.Rat, scale int) (pgtype.Numeric, error) {
	n := pgtype.Numeric{}
	if err := n.Scan(r.FloatString(scale)); err != nil {
		return pgtype.Numeric{}, err
	}
	return n, nil
}

func cmpNumeric(a, b pgtype.Numeric) (int, error) {
	ra, err := ratFromNumeric(a)
	if err != nil {
		return 0, err
	}
	rb, err := ratFromNumeric(b)
	if err != nil {
		return 0, err
	}
	return ra.Cmp(rb), nil
}

func subAbsNumeric(a, b pgtype.Numeric, scale int) (pgtype.Numeric, error) {
	ra, err := ratFromNumeric(a)
	if err != nil {
		return pgtype.Numeric{}, err
	}
	rb, err := ratFromNumeric(b)
	if err != nil {
		return pgtype.Numeric{}, err
	}
	out := new(big.Rat).Sub(ra, rb)
	if out.Sign() < 0 {
		out.Neg(out)
	}
	return numericFromRat(out, scale)
}

func zeroNumeric() pgtype.Numeric {
	z := pgtype.Numeric{}
	_ = z.Scan("0")
	return z
}

func invoiceStatusAppliesStock(status pg.InvoiceStatus) bool {
	return status == pg.InvoiceStatusReceived
}

func invoiceAppliesStock(inv pg.Invoice) bool {
	return inv.Status.Valid && invoiceStatusAppliesStock(inv.Status.InvoiceStatus)
}

func validateInvoiceStatusChange(oldStatus, newStatus pg.InvoiceStatus) error {
	if oldStatus == pg.InvoiceStatusCancelled || oldStatus == pg.InvoiceStatusDeleted {
		return fmt.Errorf("cannot change status of a %s invoice", oldStatus)
	}

	if invoiceStatusAppliesStock(oldStatus) &&
		(newStatus == pg.InvoiceStatusCancelled || newStatus == pg.InvoiceStatusDeleted) {
		return fmt.Errorf("cannot cancel or delete a received invoice via update; use DELETE endpoint")
	}

	return nil
}

func addNumericStrings(a, b string) (string, error) {
	na := pgtype.Numeric{}
	if err := na.Scan(a); err != nil {
		return "", err
	}
	nb := pgtype.Numeric{}
	if err := nb.Scan(b); err != nil {
		return "", err
	}

	ra, err := ratFromNumeric(na)
	if err != nil {
		return "", err
	}
	rb, err := ratFromNumeric(nb)
	if err != nil {
		return "", err
	}

	sum := new(big.Rat).Add(ra, rb)
	n, err := numericFromRat(sum, 6)
	if err != nil {
		return "", err
	}
	return numericToString(n), nil
}

// UpsertInvoiceDetails replaces all details for an invoice and optionally updates invoice fields.
// Stock is applied only when the invoice is (or becomes) 'received'.
func (s *InvoiceS) UpsertInvoiceDetails(ctx context.Context, invoiceID string, req *model.UpsertInvoiceDetailsRequest) (*model.UpsertInvoiceDetailsResponse, error) {
	invoiceUUID, err := uuid.Parse(invoiceID)
	if err != nil {
		return nil, fmt.Errorf("invalid invoice id: %w", err)
	}

	invoice, err := s.repo.Tenant(ctx).GetInvoiceByID(ctx, invoiceUUID)
	if err != nil {
		return nil, fmt.Errorf("invoice not found: %w", err)
	}

	oldStatus := pg.InvoiceStatusPending
	if invoice.Status.Valid {
		oldStatus = invoice.Status.InvoiceStatus
	}

	newStatus := oldStatus
	if req.Status != nil && *req.Status != "" {
		newStatus = pg.InvoiceStatus(*req.Status)
		if err := validateInvoiceStatusChange(oldStatus, newStatus); err != nil {
			return nil, err
		}
	}

	oldAppliesStock := invoiceStatusAppliesStock(oldStatus)
	newAppliesStock := invoiceStatusAppliesStock(newStatus)

	effectiveStorage := invoice.StorageID
	if req.StorageID != nil {
		if *req.StorageID != "" {
			sid, err := uuid.Parse(*req.StorageID)
			if err != nil {
				return nil, fmt.Errorf("invalid storage_id: %w", err)
			}
			effectiveStorage = pgtype.UUID{Bytes: sid, Valid: true}
		} else {
			effectiveStorage = pgtype.UUID{Valid: false}
		}
	}

	if oldAppliesStock && !invoice.StorageID.Valid {
		return nil, fmt.Errorf("invoice storage_id is required to reverse stock")
	}
	if newAppliesStock && !effectiveStorage.Valid {
		return nil, fmt.Errorf("invoice storage_id is required to apply stock")
	}

	existing, err := s.repo.Tenant(ctx).GetInvoiceDetailsByInvoiceID(ctx, pg.GetInvoiceDetailsByInvoiceIDParams{
		InvoiceID: invoiceUUID,
		Limit:     10000,
		Offset:    0,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to get existing invoice details: %w", err)
	}

	if oldAppliesStock {
		for _, d := range existing {
			if err := s.applyInvoiceStockMovement(
				ctx,
				invoice.StorageID,
				d.IngredientID,
				zeroNumeric(),
				d.Quantity,
				"invoice_batch_update_out",
				d.PricePerUnit,
				invoiceUUID,
				invoice.Date,
			); err != nil {
				return nil, fmt.Errorf("failed to reverse stock for ingredient %s: %w", d.IngredientID, err)
			}
		}
	}

	if req.Status != nil || req.SupplierID != nil || req.StorageID != nil || req.TotalAmount != nil || req.Date != nil {
		storageID := pgtype.UUID{Valid: false}
		if req.StorageID != nil && *req.StorageID != "" {
			sid, err := uuid.Parse(*req.StorageID)
			if err != nil {
				return nil, fmt.Errorf("invalid storage_id: %w", err)
			}
			storageID = pgtype.UUID{Bytes: sid, Valid: true}
		}

		var totalAmount pgtype.Numeric
		if req.TotalAmount != nil {
			if err := totalAmount.Scan(*req.TotalAmount); err != nil {
				return nil, fmt.Errorf("invalid total amount: %w", err)
			}
		} else {
			totalAmount.Valid = false
		}

		status := pg.NullInvoiceStatus{}
		if req.Status != nil {
			status.InvoiceStatus = pg.InvoiceStatus(*req.Status)
			status.Valid = true
		}

		date := pgtype.Timestamp{Valid: false}
		if req.Date != nil && *req.Date != "" {
			parsed, err := time.Parse(time.RFC3339, *req.Date)
			if err != nil {
				parsed, err = time.Parse(time.RFC3339Nano, *req.Date)
				if err != nil {
					return nil, fmt.Errorf("invalid date: %w", err)
				}
			}
			date = pgtype.Timestamp{Time: parsed, Valid: true}
		}

		var supplierID uuid.UUID
		if req.SupplierID != nil {
			sid, err := uuid.Parse(*req.SupplierID)
			if err != nil {
				return nil, fmt.Errorf("invalid supplier id: %w", err)
			}
			supplierID = sid
		}

		if _, err := s.repo.Tenant(ctx).UpdateInvoice(ctx, pg.UpdateInvoiceParams{
			ID:          invoiceUUID,
			SupplierID:  supplierID,
			StorageID:   storageID,
			TotalAmount: totalAmount,
			Status:      status,
			Date:        date,
		}); err != nil {
			return nil, fmt.Errorf("failed to update invoice: %w", err)
		}
	}

	if err := s.repo.Tenant(ctx).DeleteInvoiceDetailsByInvoiceID(ctx, invoiceUUID); err != nil {
		return nil, fmt.Errorf("failed to delete existing invoice details: %w", err)
	}

	response := &model.UpsertInvoiceDetailsResponse{
		Details: make([]model.InvoiceDetailResponse, 0, len(req.Details)),
	}

	for i, item := range req.Details {
		ingredientUUID, err := uuid.Parse(item.IngredientID)
		if err != nil {
			return nil, fmt.Errorf("item %d: invalid ingredient_id: %w", i+1, err)
		}

		qty := pgtype.Numeric{}
		if err := qty.Scan(item.Quantity); err != nil {
			return nil, fmt.Errorf("item %d: invalid quantity: %w", i+1, err)
		}

		price := pgtype.Numeric{}
		if err := price.Scan(item.Price); err != nil {
			return nil, fmt.Errorf("item %d: invalid price: %w", i+1, err)
		}

		pricePerUnit := pgtype.Numeric{}
		if err := pricePerUnit.Scan(item.PricePerUnit); err != nil {
			return nil, fmt.Errorf("item %d: invalid price_per_unit: %w", i+1, err)
		}

		detail, err := s.repo.Tenant(ctx).CreateInvoiceDetail(ctx, pg.CreateInvoiceDetailParams{
			ID:           uuid.New(),
			InvoiceID:    invoiceUUID,
			IngredientID: ingredientUUID,
			Quantity:     qty,
			Price:        price,
			PricePerUnit: pricePerUnit,
		})
		if err != nil {
			return nil, fmt.Errorf("item %d: failed to create invoice detail: %w", i+1, err)
		}

		if newAppliesStock {
			if _, err := s.repo.Tenant(ctx).UpdateIngredientPriceAndQuantity(ctx, pg.UpdateIngredientPriceAndQuantityParams{
				ID:           ingredientUUID,
				PricePerUnit: pricePerUnit,
			}); err != nil {
				return nil, fmt.Errorf("item %d: failed to update ingredient price_per_unit: %w", i+1, err)
			}

			triggerPriceRecalculation(ctx, s.repo, ingredientUUID)

			if err := s.repo.Tenant(ctx).EnsureIngredientVisibilityForCurrentBranch(ctx, ingredientUUID); err != nil {
				return nil, fmt.Errorf("item %d: failed to ensure ingredient visibility: %w", i+1, err)
			}

			if err := s.applyInvoiceStockMovement(
				ctx,
				effectiveStorage,
				ingredientUUID,
				qty,
				zeroNumeric(),
				"invoice_batch_update_in",
				pricePerUnit,
				invoiceUUID,
				invoice.Date,
			); err != nil {
				return nil, fmt.Errorf("item %d: failed to add stock: %w", i+1, err)
			}
		}

		response.Details = append(response.Details, *toInvoiceDetailResponse(detail))
	}

	response.Success = len(response.Details)
	return response, nil
}

// DeleteInvoiceDetailsByInvoiceID deletes all details for an invoice
func (s *InvoiceS) DeleteInvoiceDetailsByInvoiceID(ctx context.Context, invoiceID string) error {
	invUUID, err := uuid.Parse(invoiceID)
	if err != nil {
		return fmt.Errorf("invalid invoice id: %w", err)
	}

	if err := s.repo.Tenant(ctx).DeleteInvoiceDetailsByInvoiceID(ctx, invUUID); err != nil {
		return fmt.Errorf("failed to delete invoice details by invoice id: %w", err)
	}

	return nil
}

// CountInvoiceDetails counts all invoice details
func (s *InvoiceS) CountInvoiceDetails(ctx context.Context) (int64, error) {
	count, err := s.repo.Tenant(ctx).CountInvoiceDetails(ctx)
	if err != nil {
		return 0, fmt.Errorf("failed to count invoice details: %w", err)
	}

	return count, nil
}

// CountInvoiceDetailsByInvoice counts details for a specific invoice
func (s *InvoiceS) CountInvoiceDetailsByInvoice(ctx context.Context, invoiceID string) (int64, error) {
	invUUID, err := uuid.Parse(invoiceID)
	if err != nil {
		return 0, fmt.Errorf("invalid invoice id: %w", err)
	}

	count, err := s.repo.Tenant(ctx).CountInvoiceDetailsByInvoice(ctx, invUUID)
	if err != nil {
		return 0, fmt.Errorf("failed to count invoice details by invoice: %w", err)
	}

	return count, nil
}

// GetInvoiceDetailWithIngredient retrieves detail with ingredient information
func (s *InvoiceS) GetInvoiceDetailWithIngredient(ctx context.Context, id string) (*model.InvoiceDetailWithIngredientResponse, error) {
	detailID, err := uuid.Parse(id)
	if err != nil {
		return nil, fmt.Errorf("invalid detail id: %w", err)
	}

	detail, err := s.repo.Tenant(ctx).GetInvoiceDetailWithIngredient(ctx, detailID)
	if err != nil {
		return nil, fmt.Errorf("failed to get invoice detail with ingredient: %w", err)
	}

	return toInvoiceDetailWithIngredientResponse(detail), nil
}

// GetInvoiceDetailsWithIngredients retrieves all details for an invoice with ingredient information

// ==================== HELPER FUNCTIONS ====================

func toInvoiceResponse(inv pg.Invoice) *model.InvoiceResponse {
	id := inv.ID
	supplierID := inv.SupplierID
	storageID := inv.StorageID
	totalAmount := inv.TotalAmount
	status := inv.Status
	date := inv.Date
	createdAt := inv.CreatedAt
	updatedAt := inv.UpdatedAt

	responseStatus := model.InvoiceStatus(status.InvoiceStatus)
	if inv.DeletedAt != nil && *inv.DeletedAt > 0 {
		responseStatus = "deleted"
	}

	response := &model.InvoiceResponse{
		ID:          id.String(),
		SupplierID:  supplierID.String(),
		TotalAmount: numericToString(totalAmount),
		Status:      responseStatus,
	}

	if storageID.Valid {
		sid := uuid.UUID(storageID.Bytes).String()
		response.StorageID = &sid
	}

	if date.Valid {
		response.Date = &date.Time
	}

	if createdAt.Valid {
		response.CreatedAt = &createdAt.Time
	}

	if updatedAt.Valid {
		response.UpdatedAt = &updatedAt.Time
	}

	return response
}

func toInvoiceWithDetailsResponse(invoice pg.GetInvoiceWithDetailsRow) *model.InvoiceGetWithDetailsResponse {
	response := &model.InvoiceGetWithDetailsResponse{
		ID:            invoice.ID.String(),
		SupplierID:    invoice.SupplierID.String(),
		TotalAmount:   numericToString(invoice.TotalAmount),
		Status:        model.InvoiceStatus(invoice.Status.InvoiceStatus),
		ItemCount:     invoice.ItemCount,
		TotalQuantity: numericToString(invoice.TotalQuantity),
	}

	if invoice.StorageID.Valid {
		sid := uuid.UUID(invoice.StorageID.Bytes).String()
		response.StorageID = &sid
	}

	if invoice.Date.Valid {
		response.Date = &invoice.Date.Time
	}

	if invoice.CreatedAt.Valid {
		response.CreatedAt = &invoice.CreatedAt.Time
	}

	if invoice.UpdatedAt.Valid {
		response.UpdatedAt = &invoice.UpdatedAt.Time
	}

	return response
}

func toInvoiceDetailResponse(detail pg.InvoiceDetailed) *model.InvoiceDetailResponse {
	response := &model.InvoiceDetailResponse{
		ID:           detail.ID.String(),
		InvoiceID:    detail.InvoiceID.String(),
		IngredientID: detail.IngredientID.String(),
		Quantity:     numericToString(detail.Quantity),
		Price:        numericToString(detail.Price),
		PricePerUnit: numericToString(detail.PricePerUnit),
	}

	if detail.CreatedAt.Valid {
		response.CreatedAt = &detail.CreatedAt.Time
	}

	if detail.UpdatedAt.Valid {
		response.UpdatedAt = &detail.UpdatedAt.Time
	}

	return response
}

func toInvoiceDetailWithIngredientResponse(detail pg.GetInvoiceDetailWithIngredientRow) *model.InvoiceDetailWithIngredientResponse {
	response := &model.InvoiceDetailWithIngredientResponse{
		ID:                detail.ID.String(),
		InvoiceID:         detail.InvoiceID.String(),
		IngredientID:      detail.IngredientID.String(),
		Quantity:          numericToString(detail.Quantity),
		Price:             numericToString(detail.Price),
		PricePerUnit:      numericToString(detail.PricePerUnit),
		IngredientName:    detail.IngredientName,
		IngredientMeasure: toMeasurementTypeString(detail.IngredientMeasurement),
		IngredientPicture: detail.IngredientPicture,
	}

	if detail.CreatedAt.Valid {
		response.CreatedAt = &detail.CreatedAt.Time
	}

	if detail.UpdatedAt.Valid {
		response.UpdatedAt = &detail.UpdatedAt.Time
	}

	return response
}

// func toInvoiceDetailWithIngredientsRowResponse(detail pg.GetInvoiceDetailsWithIngredientsRow) *model.InvoiceDetailWithIngredientResponse {
// 	response := &model.InvoiceDetailWithIngredientResponse{
// 		ID:                detail.ID.String(),
// 		InvoiceID:         detail.InvoiceID.String(),
// 		IngredientID:      detail.IngredientID.String(),
// 		Quantity:          detail.Quantity,
// 		Price:             numericToString(detail.Price),
// 		PricePerUnit:      numericToString(detail.PricePerUnit),
// 		IngredientName:    detail.IngredientName,
// 		IngredientMeasure: toMeasurementTypeString(detail.IngredientMeasurement),
// 		IngredientPicture: detail.IngredientPicture,
// 	}

// 	if detail.CreatedAt.Valid {
// 		response.CreatedAt = &detail.CreatedAt.Time
// 	}

// 	if detail.UpdatedAt.Valid {
// 		response.UpdatedAt = &detail.UpdatedAt.Time
// 	}

// 	return response
// }

func toMeasurementTypeString(mt pg.NullMeasurementType) *string {
	if mt.Valid {
		str := string(mt.MeasurementType)
		return &str
	}
	return nil
}

func numericToString(n pgtype.Numeric) string {
	if !n.Valid {
		return "0"
	}
	// Convert to Decimal string representation
	if n.NaN {
		return "NaN"
	}
	if n.InfinityModifier > 0 {
		return "Infinity"
	}
	if n.InfinityModifier < 0 {
		return "-Infinity"
	}

	// If Int is nil, return 0
	if n.Int == nil {
		return "0"
	}

	// Apply exponent to format the number
	str := n.Int.String()
	if n.Exp < 0 {
		// Need to add decimal point
		exp := -int(n.Exp)
		if exp >= len(str) {
			// Add leading zeros and decimal
			str = "0." + strings.Repeat("0", exp-len(str)) + str
		} else {
			// Insert decimal point
			str = str[:len(str)-exp] + "." + str[len(str)-exp:]
		}
	} else if n.Exp > 0 {
		// Add trailing zeros
		str = str + strings.Repeat("0", int(n.Exp))
	}
	if strings.Contains(str, ".") {
		str = strings.TrimRight(strings.TrimRight(str, "0"), ".")
	}
	if str == "" || str == "-0" {
		return "0"
	}
	return str
}

func derefNumeric(n *pgtype.Numeric) pgtype.Numeric {
	if n == nil {
		return pgtype.Numeric{}
	}
	return *n
}

func numericPtrToStringPtr(n *pgtype.Numeric) *string {
	if n == nil {
		return nil
	}
	s := numericToString(*n)
	return &s
}

// CreateInvoiceWithDetails creates a new invoice with its details in a single atomic operation
func (s *InvoiceS) CreateInvoiceWithDetails(ctx context.Context, req *model.CreateInvoiceWithDetailsRequest) (*model.CreateInvoiceWithDetailsResponse, error) {
	if len(req.Details) == 0 {
		return nil, fmt.Errorf("at least one invoice detail is required")
	}

	invoiceResp, err := s.CreateInvoice(ctx, &req.Invoice)
	if err != nil {
		return nil, fmt.Errorf("failed to create invoice: %w", err)
	}

	invoiceID, err := uuid.Parse(invoiceResp.ID)
	if err != nil {
		return nil, fmt.Errorf("invalid invoice id in response: %w", err)
	}

	// Get the full invoice for effective_at timestamp
	invoice, err := s.repo.Tenant(ctx).GetInvoiceByID(ctx, invoiceID)
	if err != nil {
		return nil, fmt.Errorf("failed to retrieve invoice for details: %w", err)
	}

	withDetailsAppliesStock := invoiceResp.Status == model.InvoiceStatusReceived

	var storagePg pgtype.UUID
	if withDetailsAppliesStock {
		if invoiceResp.StorageID == nil || *invoiceResp.StorageID == "" {
			return nil, fmt.Errorf("invoice storage_id is required to update stock")
		}
		storageUUID, err := uuid.Parse(*invoiceResp.StorageID)
		if err != nil {
			return nil, fmt.Errorf("invalid invoice storage_id: %w", err)
		}
		storagePg = pgtype.UUID{Bytes: storageUUID, Valid: true}
	}

	response := &model.CreateInvoiceWithDetailsResponse{
		Invoice: *invoiceResp,
		Details: make([]model.InvoiceDetailResponse, 0, len(req.Details)),
		Summary: model.InvoiceDetailsBatchSummary{
			TotalDetails: len(req.Details),
			CreatedCount: 0,
			TotalAmount:  "0",
		},
	}

	totalAmountStr := "0"

	for i, item := range req.Details {
		ingredientUUID, err := uuid.Parse(item.IngredientID)
		if err != nil {
			return nil, fmt.Errorf("item %d: invalid ingredient id: %w", i+1, err)
		}

		ingredient, err := s.repo.Tenant(ctx).GetIngredientByID(ctx, ingredientUUID)
		if err != nil {
			return nil, fmt.Errorf("item %d: ingredient not found: %w", i+1, err)
		}
		if ingredient.ID == uuid.Nil {
			return nil, fmt.Errorf("item %d: ingredient not found", i+1)
		}

		price := pgtype.Numeric{}
		if err := price.Scan(item.Price); err != nil {
			return nil, fmt.Errorf("item %d: invalid price: %w", i+1, err)
		}

		pricePerUnit := pgtype.Numeric{}
		if err := pricePerUnit.Scan(item.PricePerUnit); err != nil {
			return nil, fmt.Errorf("item %d: invalid price_per_unit: %w", i+1, err)
		}

		qty := pgtype.Numeric{}
		if err := qty.Scan(item.Quantity); err != nil {
			return nil, fmt.Errorf("item %d: invalid quantity: %w", i+1, err)
		}

		invoiceDetail, err := s.repo.Tenant(ctx).CreateInvoiceDetail(ctx, pg.CreateInvoiceDetailParams{
			ID:           uuid.New(),
			InvoiceID:    invoiceID,
			IngredientID: ingredientUUID,
			Quantity:     qty,
			Price:        price,
			PricePerUnit: pricePerUnit,
		})
		if err != nil {
			return nil, fmt.Errorf("item %d: failed to create invoice detail: %w", i+1, err)
		}

		if withDetailsAppliesStock {
			if _, err := s.repo.Tenant(ctx).UpdateIngredientPriceAndQuantity(ctx, pg.UpdateIngredientPriceAndQuantityParams{
				ID:           ingredientUUID,
				PricePerUnit: pricePerUnit,
			}); err != nil {
				return nil, fmt.Errorf("item %d: failed to update ingredient price_per_unit: %w", i+1, err)
			}

			triggerPriceRecalculation(ctx, s.repo, ingredientUUID)

			if err := s.repo.Tenant(ctx).EnsureIngredientVisibilityForCurrentBranch(ctx, ingredientUUID); err != nil {
				return nil, fmt.Errorf("item %d: failed to ensure ingredient visibility: %w", i+1, err)
			}

			if err := s.applyInvoiceStockMovement(
				ctx,
				storagePg,
				ingredientUUID,
				qty,
				zeroNumeric(),
				"invoice_in",
				pricePerUnit,
				invoiceID,
				invoice.Date,
			); err != nil {
				return nil, fmt.Errorf("item %d: failed to add stock: %w", i+1, err)
			}
		}

		response.Details = append(response.Details, *toInvoiceDetailResponse(invoiceDetail))
		response.Summary.CreatedCount++

		totalAmountStr, err = addNumericStrings(totalAmountStr, item.Price)
		if err != nil {
			return nil, fmt.Errorf("item %d: failed to accumulate total amount: %w", i+1, err)
		}
	}

	response.Summary.TotalAmount = totalAmountStr
	return response, nil
}
