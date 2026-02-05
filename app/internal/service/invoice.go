package service

import (
	"context"
	"fmt"
	"math/big"
	"strconv"
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

// GetAllInvoices retrieves all invoices with pagination
func (s *InvoiceS) GetAllInvoices(ctx context.Context, limit, offset int32) ([]*model.InvoiceResponse, error) {
	invoices, err := s.repo.Tenant(ctx).GetAllInvoices(ctx, pg.GetAllInvoicesParams{
		Limit:  limit,
		Offset: offset,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to get invoices: %w", err)
	}

	var responses []*model.InvoiceResponse
	for _, invoice := range invoices {
		responses = append(responses, toInvoiceResponse(invoice))
	}

	return responses, nil
}

// GetInvoicesByStatus retrieves invoices by status
func (s *InvoiceS) GetInvoicesByStatus(ctx context.Context, status string, limit, offset int32) ([]*model.InvoiceResponse, error) {
	invoiceStatus := pg.NullInvoiceStatus{
		InvoiceStatus: pg.InvoiceStatus(status),
		Valid:         true,
	}

	invoices, err := s.repo.Tenant(ctx).GetInvoicesByStatus(ctx, pg.GetInvoicesByStatusParams{
		Status: invoiceStatus,
		Limit:  limit,
		Offset: offset,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to get invoices by status: %w", err)
	}

	var responses []*model.InvoiceResponse
	for _, invoice := range invoices {
		responses = append(responses, toInvoiceResponse(invoice))
	}

	return responses, nil
}

// GetInvoicesBySupplier retrieves invoices by supplier name
func (s *InvoiceS) GetInvoicesBySupplier(ctx context.Context, supplierName string, limit, offset int32) ([]*model.InvoiceResponse, error) {
	invoices, err := s.repo.Tenant(ctx).GetInvoicesBySupplier(ctx, pg.GetInvoicesBySupplierParams{
		Column1: &supplierName,
		Limit:   limit,
		Offset:  offset,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to get invoices by supplier: %w", err)
	}

	var responses []*model.InvoiceResponse
	for _, invoice := range invoices {
		responses = append(responses, toInvoiceResponse(invoice))
	}

	return responses, nil
}

// GetInvoicesByDateRange retrieves invoices within a date range
func (s *InvoiceS) GetInvoicesByDateRange(ctx context.Context, startDate, endDate time.Time, limit, offset int32) ([]*model.InvoiceResponse, error) {
	startTS := pgtype.Timestamp{
		Time:  startDate,
		Valid: true,
	}
	endTS := pgtype.Timestamp{
		Time:  endDate,
		Valid: true,
	}

	invoices, err := s.repo.Tenant(ctx).GetInvoicesByDateRange(ctx, pg.GetInvoicesByDateRangeParams{
		Date:   startTS,
		Date_2: endTS,
		Limit:  limit,
		Offset: offset,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to get invoices by date range: %w", err)
	}

	var responses []*model.InvoiceResponse
	for _, invoice := range invoices {
		responses = append(responses, toInvoiceResponse(invoice))
	}

	return responses, nil
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

	if storageID.Valid && currentInvoice.StorageID.Valid && storageID.Bytes != currentInvoice.StorageID.Bytes {
		details, err := s.repo.Tenant(ctx).GetInvoiceDetailsByInvoiceID(ctx, invoiceID)
		if err != nil {
			return nil, fmt.Errorf("failed to get invoice details: %w", err)
		}
		for _, d := range details {
			if err := s.applyInvoiceStockMovement(ctx, currentInvoice.StorageID, d.IngredientID, zeroNumeric(), d.Quantity, "invoice_storage_move_out", d.PricePerUnit, invoiceID); err != nil {
				return nil, err
			}
			if err := s.applyInvoiceStockMovement(ctx, storageID, d.IngredientID, d.Quantity, zeroNumeric(), "invoice_storage_move_in", d.PricePerUnit, invoiceID); err != nil {
				return nil, err
			}
		}
	}

	return toInvoiceResponse(invoice), nil
}

// UpdateInvoiceStatus updates invoice status
func (s *InvoiceS) UpdateInvoiceStatus(ctx context.Context, id string, status string) (*model.InvoiceResponse, error) {
	invoiceID, err := uuid.Parse(id)
	if err != nil {
		return nil, fmt.Errorf("invalid invoice id: %w", err)
	}

	invoiceStatus := pg.NullInvoiceStatus{
		InvoiceStatus: pg.InvoiceStatus(status),
		Valid:         true,
	}

	invoice, err := s.repo.Tenant(ctx).UpdateInvoiceStatus(ctx, pg.UpdateInvoiceStatusParams{
		ID:     invoiceID,
		Status: invoiceStatus,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to update invoice status: %w", err)
	}

	return toInvoiceResponse(invoice), nil
}

// MarkInvoiceArrived marks an invoice as arrived
func (s *InvoiceS) MarkInvoiceArrived(ctx context.Context, id string) (*model.InvoiceResponse, error) {
	invoiceID, err := uuid.Parse(id)
	if err != nil {
		return nil, fmt.Errorf("invalid invoice id: %w", err)
	}

	invoice, err := s.repo.Tenant(ctx).MarkInvoiceArrived(ctx, invoiceID)
	if err != nil {
		return nil, fmt.Errorf("failed to mark invoice as arrived: %w", err)
	}

	return toInvoiceResponse(invoice), nil
}

// MarkInvoiceReceived marks an invoice as received
func (s *InvoiceS) MarkInvoiceReceived(ctx context.Context, id string) (*model.InvoiceResponse, error) {
	invoiceID, err := uuid.Parse(id)
	if err != nil {
		return nil, fmt.Errorf("invalid invoice id: %w", err)
	}

	invoice, err := s.repo.Tenant(ctx).MarkInvoiceReceived(ctx, invoiceID)
	if err != nil {
		return nil, fmt.Errorf("failed to mark invoice as received: %w", err)
	}

	return toInvoiceResponse(invoice), nil
}

// CancelInvoice cancels an invoice
func (s *InvoiceS) CancelInvoice(ctx context.Context, id string) (*model.InvoiceResponse, error) {
	invoiceID, err := uuid.Parse(id)
	if err != nil {
		return nil, fmt.Errorf("invalid invoice id: %w", err)
	}

	invoice, err := s.repo.Tenant(ctx).CancelInvoice(ctx, invoiceID)
	if err != nil {
		return nil, fmt.Errorf("failed to cancel invoice: %w", err)
	}

	return toInvoiceResponse(invoice), nil
}

// DeleteInvoice soft deletes an invoice
func (s *InvoiceS) DeleteInvoice(ctx context.Context, id string) error {
	invoiceID, err := uuid.Parse(id)
	if err != nil {
		return fmt.Errorf("invalid invoice id: %w", err)
	}

	if err := s.repo.Tenant(ctx).DeleteInvoice(ctx, invoiceID); err != nil {
		return fmt.Errorf("failed to delete invoice: %w", err)
	}

	return nil
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

// CountInvoices counts all invoices
func (s *InvoiceS) CountInvoices(ctx context.Context) (int64, error) {
	count, err := s.repo.Tenant(ctx).CountInvoices(ctx)
	if err != nil {
		return 0, fmt.Errorf("failed to count invoices: %w", err)
	}

	return count, nil
}

// CountInvoicesByStatus counts invoices by status
func (s *InvoiceS) CountInvoicesByStatus(ctx context.Context, status string) (int64, error) {
	invoiceStatus := pg.NullInvoiceStatus{
		InvoiceStatus: pg.InvoiceStatus(status),
		Valid:         true,
	}

	count, err := s.repo.Tenant(ctx).CountInvoicesByStatus(ctx, invoiceStatus)
	if err != nil {
		return 0, fmt.Errorf("failed to count invoices by status: %w", err)
	}

	return count, nil
}

// SearchInvoices searches invoices
func (s *InvoiceS) SearchInvoices(ctx context.Context, query string, limit, offset int32) ([]*model.InvoiceResponse, error) {
	invoices, err := s.repo.Tenant(ctx).SearchInvoices(ctx, pg.SearchInvoicesParams{
		Column1: &query,
		Limit:   limit,
		Offset:  offset,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to search invoices: %w", err)
	}

	var responses []*model.InvoiceResponse
	for _, invoice := range invoices {
		responses = append(responses, toInvoiceResponse(invoice))
	}

	return responses, nil
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

// GetInvoiceStatsBySupplier retrieves statistics by supplier
func (s *InvoiceS) GetInvoiceStatsBySupplier(ctx context.Context, limit, offset int32) ([]*model.InvoiceStatsBySupplierResponse, error) {
	stats, err := s.repo.Tenant(ctx).GetInvoiceStatsBySupplier(ctx, pg.GetInvoiceStatsBySupplierParams{
		Limit:  limit,
		Offset: offset,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to get invoice stats by supplier: %w", err)
	}

	var responses []*model.InvoiceStatsBySupplierResponse
	for _, stat := range stats {
		response := &model.InvoiceStatsBySupplierResponse{
			SupplierName:     stat.SupplierName,
			InvoiceCount:     stat.InvoiceCount,
			TotalSpent:       strconv.FormatInt(stat.TotalSpent, 10),
			AvgInvoiceAmount: strconv.FormatFloat(stat.AvgInvoiceAmount, 'f', 2, 64),
		}

		// LastOrderDate is interface{}, need to convert it
		if stat.LastOrderDate != nil {
			if ts, ok := stat.LastOrderDate.(time.Time); ok {
				response.LastOrderDate = &ts
			}
		}

		responses = append(responses, response)
	}

	return responses, nil
}

// GetInvoiceStatsByDateRange retrieves statistics for a date range
func (s *InvoiceS) GetInvoiceStatsByDateRange(ctx context.Context, startDate, endDate time.Time) (*model.InvoiceStatsByDateRangeResponse, error) {
	startTS := pgtype.Timestamp{
		Time:  startDate,
		Valid: true,
	}
	endTS := pgtype.Timestamp{
		Time:  endDate,
		Valid: true,
	}

	stats, err := s.repo.Tenant(ctx).GetInvoiceStatsByDateRange(ctx, pg.GetInvoiceStatsByDateRangeParams{
		Date:   startTS,
		Date_2: endTS,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to get invoice stats by date range: %w", err)
	}

	response := &model.InvoiceStatsByDateRangeResponse{
		InvoiceCount:     stats.InvoiceCount,
		TotalSpent:       strconv.FormatInt(stats.TotalSpent, 10),
		AvgInvoiceAmount: strconv.FormatFloat(stats.AvgInvoiceAmount, 'f', 2, 64),
		PendingCount:     stats.PendingCount,
		ArrivedCount:     stats.ArrivedCount,
		ReceivedCount:    stats.ReceivedCount,
		CancelledCount:   stats.CancelledCount,
	}

	return response, nil
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
	if !invoice.StorageID.Valid {
		return nil, fmt.Errorf("invoice storage_id is required to update stock")
	}

	ingredientUUID, err := uuid.Parse(req.IngredientID)
	if err != nil {
		return nil, fmt.Errorf("invalid ingredient id: %w", err)
	}

	// Parse amounts
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

	params := pg.CreateInvoiceDetailParams{
		ID:           id,
		InvoiceID:    invoiceUUID,
		IngredientID: ingredientUUID,
		Quantity:     qty,
		Price:        price,
		PricePerUnit: pricePerUnit,
	}

	detail, err := s.repo.Tenant(ctx).CreateInvoiceDetail(ctx, params)
	if err != nil {
		return nil, fmt.Errorf("failed to create invoice detail: %w", err)
	}

	_, err = s.repo.Tenant(ctx).UpdateIngredientPriceAndQuantity(ctx, pg.UpdateIngredientPriceAndQuantityParams{
		ID:           ingredientUUID,
		PricePerUnit: pricePerUnit,
	})
	if err != nil {
		fmt.Printf("Warning: failed to update ingredient price_per_unit: %v\n", err)
	}

	_, _ = s.repo.Tenant(ctx).EnsureIngredientStockByStorage(ctx, pg.EnsureIngredientStockByStorageParams{
		ID:           uuid.New(),
		IngredientID: ingredientUUID,
		StorageID:    invoice.StorageID,
	})

	locked, err := s.repo.Tenant(ctx).GetStockByIngredientAndStorageForUpdate(ctx, pg.GetStockByIngredientAndStorageForUpdateParams{
		IngredientID: ingredientUUID,
		StorageID:    invoice.StorageID,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to lock ingredient stock: %w", err)
	}

	updated, err := s.repo.Tenant(ctx).UpsertAddIngredientStockByStorage(ctx, pg.UpsertAddIngredientStockByStorageParams{
		ID:           uuid.New(),
		IngredientID: ingredientUUID,
		StorageID:    invoice.StorageID,
		Quantity:     qty,
	})
	if err != nil {
		fmt.Printf("Warning: failed to update ingredient stock: %v\n", err)
	} else {
		zero := pgtype.Numeric{}
		_ = zero.Scan("0")
		sourceType := "invoice"
		srcID := invoiceUUID
		_ = s.repo.Tenant(ctx).InsertIngredientStockMovement(ctx, pg.InsertIngredientStockMovementParams{
			ID:           uuid.New(),
			StorageID:    uuid.UUID(invoice.StorageID.Bytes),
			IngredientID: ingredientUUID,
			EventType:    "invoice_in",
			QtyIn:        qty,
			QtyOut:       zero,
			StockBefore:  locked.Quantity,
			StockAfter:   updated.Quantity,
			PricePerUnit: pricePerUnit,
			SourceType:   &sourceType,
			SourceID:     &srcID,
		})
	}

	return toInvoiceDetailResponse(detail), nil
}

// CreateInvoiceDetailsBatch creates multiple invoice details in a single operation
func (s *InvoiceS) CreateInvoiceDetailsBatch(ctx context.Context, invoiceID string, req *model.CreateInvoiceDetailBatchRequest) (*model.InvoiceDetailBatchResponse, error) {
	// Validate invoice ID
	invoiceUUID, err := uuid.Parse(invoiceID)
	if err != nil {
		return nil, fmt.Errorf("invalid invoice id: %w", err)
	}

	// Validate that invoice exists
	invoice, err := s.repo.Tenant(ctx).GetInvoiceByID(ctx, invoiceUUID)
	if err != nil {
		return nil, fmt.Errorf("invoice not found: %w", err)
	}

	if invoice.ID == uuid.Nil {
		return nil, fmt.Errorf("invoice not found")
	}
	if !invoice.StorageID.Valid {
		return nil, fmt.Errorf("invoice storage_id is required to update stock")
	}

	response := &model.InvoiceDetailBatchResponse{
		Success: 0,
		Failed:  0,
		Details: make([]model.InvoiceDetailResponse, 0, len(req.Details)),
		Errors:  make([]string, 0),
	}

	// Process each detail
	for i, detail := range req.Details {
		// Validate ingredient ID
		ingredientUUID, err := uuid.Parse(detail.IngredientID)
		if err != nil {
			response.Failed++
			response.Errors = append(response.Errors, fmt.Sprintf("Item %d: invalid ingredient id: %v", i+1, err))
			continue
		}

		// Verify ingredient exists
		ingredient, err := s.repo.Tenant(ctx).GetIngredientByID(ctx, ingredientUUID)
		if err != nil {
			response.Failed++
			response.Errors = append(response.Errors, fmt.Sprintf("Item %d: ingredient not found: %v", i+1, err))
			continue
		}

		if ingredient.ID == uuid.Nil {
			response.Failed++
			response.Errors = append(response.Errors, fmt.Sprintf("Item %d: ingredient not found", i+1))
			continue
		}

		// Parse price
		price := pgtype.Numeric{}
		if err := price.Scan(detail.Price); err != nil {
			response.Failed++
			response.Errors = append(response.Errors, fmt.Sprintf("Item %d: invalid price: %v", i+1, err))
			continue
		}

		// Parse price per unit
		pricePerUnit := pgtype.Numeric{}
		if err := pricePerUnit.Scan(detail.PricePerUnit); err != nil {
			response.Failed++
			response.Errors = append(response.Errors, fmt.Sprintf("Item %d: invalid price per unit: %v", i+1, err))
			continue
		}

		qty := pgtype.Numeric{}
		if err := qty.Scan(detail.Quantity); err != nil {
			response.Failed++
			response.Errors = append(response.Errors, fmt.Sprintf("Item %d: invalid quantity: %v", i+1, err))
			continue
		}

		// Create invoice detail
		id := uuid.New()
		params := pg.CreateInvoiceDetailParams{
			ID:           id,
			InvoiceID:    invoiceUUID,
			IngredientID: ingredientUUID,
			Quantity:     qty,
			Price:        price,
			PricePerUnit: pricePerUnit,
		}

		invoiceDetail, err := s.repo.Tenant(ctx).CreateInvoiceDetail(ctx, params)
		if err != nil {
			response.Failed++
			response.Errors = append(response.Errors, fmt.Sprintf("Item %d: failed to create invoice detail: %v", i+1, err))
			continue
		}

		_, err = s.repo.Tenant(ctx).UpdateIngredientPriceAndQuantity(ctx, pg.UpdateIngredientPriceAndQuantityParams{
			ID:           ingredientUUID,
			PricePerUnit: pricePerUnit,
		})
		if err != nil {
			fmt.Printf("Warning: failed to update ingredient price_per_unit for item %d: %v\n", i+1, err)
		}

		_, _ = s.repo.Tenant(ctx).EnsureIngredientStockByStorage(ctx, pg.EnsureIngredientStockByStorageParams{
			ID:           uuid.New(),
			IngredientID: ingredientUUID,
			StorageID:    invoice.StorageID,
		})

		locked, err := s.repo.Tenant(ctx).GetStockByIngredientAndStorageForUpdate(ctx, pg.GetStockByIngredientAndStorageForUpdateParams{
			IngredientID: ingredientUUID,
			StorageID:    invoice.StorageID,
		})
		if err != nil {
			response.Failed++
			response.Errors = append(response.Errors, fmt.Sprintf("Item %d: failed to lock ingredient stock: %v", i+1, err))
			continue
		}

		updated, err := s.repo.Tenant(ctx).UpsertAddIngredientStockByStorage(ctx, pg.UpsertAddIngredientStockByStorageParams{
			ID:           uuid.New(),
			IngredientID: ingredientUUID,
			StorageID:    invoice.StorageID,
			Quantity:     qty,
		})
		if err != nil {
			fmt.Printf("Warning: failed to update ingredient stock for item %d: %v\n", i+1, err)
		} else {
			zero := pgtype.Numeric{}
			_ = zero.Scan("0")
			sourceType := "invoice"
			srcID := invoiceUUID
			_ = s.repo.Tenant(ctx).InsertIngredientStockMovement(ctx, pg.InsertIngredientStockMovementParams{
				ID:           uuid.New(),
				StorageID:    uuid.UUID(invoice.StorageID.Bytes),
				IngredientID: ingredientUUID,
				EventType:    "invoice_in",
				QtyIn:        qty,
				QtyOut:       zero,
				StockBefore:  locked.Quantity,
				StockAfter:   updated.Quantity,
				PricePerUnit: pricePerUnit,
				SourceType:   &sourceType,
				SourceID:     &srcID,
			})
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
func (s *InvoiceS) GetAllInvoiceDetails(ctx context.Context, limit, offset int32) ([]*model.InvoiceDetailResponse, error) {
	details, err := s.repo.Tenant(ctx).GetAllInvoiceDetails(ctx, pg.GetAllInvoiceDetailsParams{
		Limit:  limit,
		Offset: offset,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to get invoice details: %w", err)
	}

	var responses []*model.InvoiceDetailResponse
	for _, detail := range details {
		responses = append(responses, toInvoiceDetailResponse(detail))
	}

	return responses, nil
}

// GetInvoiceDetailsByInvoiceID retrieves details for a specific invoice
func (s *InvoiceS) GetInvoiceDetailsByInvoiceID(ctx context.Context, invoiceID string) ([]*model.InvoiceDetailResponse, error) {
	invUUID, err := uuid.Parse(invoiceID)
	if err != nil {
		return nil, fmt.Errorf("invalid invoice id: %w", err)
	}

	details, err := s.repo.Tenant(ctx).GetInvoiceDetailsByInvoiceID(ctx, invUUID)
	if err != nil {
		return nil, fmt.Errorf("failed to get invoice details by invoice id: %w", err)
	}

	var responses []*model.InvoiceDetailResponse
	for _, detail := range details {
		responses = append(responses, toInvoiceDetailResponse(detail))
	}

	return responses, nil
}

// GetInvoiceDetailsByIngredientID retrieves details for a specific ingredient
func (s *InvoiceS) GetInvoiceDetailsByIngredientID(ctx context.Context, ingredientID string, limit, offset int32) ([]*model.InvoiceDetailResponse, error) {
	ingUUID, err := uuid.Parse(ingredientID)
	if err != nil {
		return nil, fmt.Errorf("invalid ingredient id: %w", err)
	}

	details, err := s.repo.Tenant(ctx).GetInvoiceDetailsByIngredientID(ctx, pg.GetInvoiceDetailsByIngredientIDParams{
		IngredientID: ingUUID,
		Limit:        limit,
		Offset:       offset,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to get invoice details by ingredient id: %w", err)
	}

	var responses []*model.InvoiceDetailResponse
	for _, detail := range details {
		responses = append(responses, toInvoiceDetailResponse(detail))
	}

	return responses, nil
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
	if !inv.StorageID.Valid {
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

	if updatePricePerUnit.Valid {
		_, _ = s.repo.Tenant(ctx).UpdateIngredientPriceAndQuantity(ctx, pg.UpdateIngredientPriceAndQuantityParams{
			ID:           updateIngredientID,
			PricePerUnit: updatePricePerUnit,
		})
	}

	sourceID := currentDetail.InvoiceID
	if currentDetail.IngredientID != updateIngredientID {
		if err := s.applyInvoiceStockMovement(ctx, inv.StorageID, currentDetail.IngredientID, zeroNumeric(), currentDetail.Quantity, "invoice_update_out", currentDetail.PricePerUnit, sourceID); err != nil {
			return nil, err
		}
		if err := s.applyInvoiceStockMovement(ctx, inv.StorageID, updateIngredientID, updateQuantity, zeroNumeric(), "invoice_update_in", updatePricePerUnit, sourceID); err != nil {
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
			if err := s.applyInvoiceStockMovement(ctx, inv.StorageID, updateIngredientID, diff, zeroNumeric(), "invoice_update_in", updatePricePerUnit, sourceID); err != nil {
				return nil, err
			}
		} else if cmp < 0 {
			diff, err := subAbsNumeric(updateQuantity, currentDetail.Quantity, 6)
			if err != nil {
				return nil, err
			}
			if err := s.applyInvoiceStockMovement(ctx, inv.StorageID, updateIngredientID, zeroNumeric(), diff, "invoice_update_out", currentDetail.PricePerUnit, sourceID); err != nil {
				return nil, err
			}
		} else {
			if numericToString(updatePricePerUnit) != numericToString(currentDetail.PricePerUnit) {
				if err := s.applyInvoiceStockMovement(ctx, inv.StorageID, updateIngredientID, zeroNumeric(), zeroNumeric(), "invoice_price_update", updatePricePerUnit, sourceID); err != nil {
					return nil, err
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
	if !inv.StorageID.Valid {
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

	cmp, err := cmpNumeric(detail.Quantity, currentDetail.Quantity)
	if err != nil {
		return nil, err
	}
	if cmp > 0 {
		diff, err := subAbsNumeric(detail.Quantity, currentDetail.Quantity, 6)
		if err != nil {
			return nil, err
		}
		if err := s.applyInvoiceStockMovement(ctx, inv.StorageID, currentDetail.IngredientID, diff, zeroNumeric(), "invoice_update_in", currentDetail.PricePerUnit, currentDetail.InvoiceID); err != nil {
			return nil, err
		}
	} else if cmp < 0 {
		diff, err := subAbsNumeric(detail.Quantity, currentDetail.Quantity, 6)
		if err != nil {
			return nil, err
		}
		if err := s.applyInvoiceStockMovement(ctx, inv.StorageID, currentDetail.IngredientID, zeroNumeric(), diff, "invoice_update_out", currentDetail.PricePerUnit, currentDetail.InvoiceID); err != nil {
			return nil, err
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
	if !inv.StorageID.Valid {
		return fmt.Errorf("invoice storage_id is required to update stock")
	}

	if err := s.repo.Tenant(ctx).DeleteInvoiceDetail(ctx, detailID); err != nil {
		return fmt.Errorf("failed to delete invoice detail: %w", err)
	}

	if err := s.applyInvoiceStockMovement(ctx, inv.StorageID, currentDetail.IngredientID, zeroNumeric(), currentDetail.Quantity, "invoice_delete_out", currentDetail.PricePerUnit, currentDetail.InvoiceID); err != nil {
		return err
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
	if !inv.StorageID.Valid {
		return fmt.Errorf("invoice storage_id is required to update stock")
	}
	if err := s.applyInvoiceStockMovement(ctx, inv.StorageID, detail.IngredientID, detail.Quantity, zeroNumeric(), "invoice_restore_in", detail.PricePerUnit, detail.InvoiceID); err != nil {
		return err
	}

	return nil
}

func (s *InvoiceS) applyInvoiceStockMovement(ctx context.Context, storageID pgtype.UUID, ingredientID uuid.UUID, qtyIn, qtyOut pgtype.Numeric, eventType string, pricePerUnit pgtype.Numeric, invoiceID uuid.UUID) error {
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

func toInvoiceResponse(inv any) *model.InvoiceResponse {
	var (
		id          uuid.UUID
		supplierID  uuid.UUID
		storageID   pgtype.UUID
		totalAmount pgtype.Numeric
		status      pg.NullInvoiceStatus
		date        pgtype.Timestamp
		createdAt   pgtype.Timestamptz
		updatedAt   pgtype.Timestamptz
	)

	switch invoice := inv.(type) {
	case pg.CreateInvoiceRow:
		id, supplierID, storageID, totalAmount, status, date, createdAt, updatedAt = invoice.ID, invoice.SupplierID, invoice.StorageID, invoice.TotalAmount, invoice.Status, invoice.Date, invoice.CreatedAt, invoice.UpdatedAt
	case pg.GetInvoiceByIDRow:
		id, supplierID, storageID, totalAmount, status, date, createdAt, updatedAt = invoice.ID, invoice.SupplierID, invoice.StorageID, invoice.TotalAmount, invoice.Status, invoice.Date, invoice.CreatedAt, invoice.UpdatedAt
	case pg.GetAllInvoicesRow:
		id, supplierID, storageID, totalAmount, status, date, createdAt, updatedAt = invoice.ID, invoice.SupplierID, invoice.StorageID, invoice.TotalAmount, invoice.Status, invoice.Date, invoice.CreatedAt, invoice.UpdatedAt
	case pg.GetInvoicesByStatusRow:
		id, supplierID, storageID, totalAmount, status, date, createdAt, updatedAt = invoice.ID, invoice.SupplierID, invoice.StorageID, invoice.TotalAmount, invoice.Status, invoice.Date, invoice.CreatedAt, invoice.UpdatedAt
	case pg.GetInvoicesBySupplierRow:
		id, supplierID, storageID, totalAmount, status, date, createdAt, updatedAt = invoice.ID, invoice.SupplierID, invoice.StorageID, invoice.TotalAmount, invoice.Status, invoice.Date, invoice.CreatedAt, invoice.UpdatedAt
	case pg.GetInvoicesByDateRangeRow:
		id, supplierID, storageID, totalAmount, status, date, createdAt, updatedAt = invoice.ID, invoice.SupplierID, invoice.StorageID, invoice.TotalAmount, invoice.Status, invoice.Date, invoice.CreatedAt, invoice.UpdatedAt
	case pg.UpdateInvoiceRow:
		id, supplierID, storageID, totalAmount, status, date, createdAt, updatedAt = invoice.ID, invoice.SupplierID, invoice.StorageID, invoice.TotalAmount, invoice.Status, invoice.Date, invoice.CreatedAt, invoice.UpdatedAt
	case pg.UpdateInvoiceStatusRow:
		id, supplierID, storageID, totalAmount, status, date, createdAt, updatedAt = invoice.ID, invoice.SupplierID, invoice.StorageID, invoice.TotalAmount, invoice.Status, invoice.Date, invoice.CreatedAt, invoice.UpdatedAt
	case pg.MarkInvoiceArrivedRow:
		id, supplierID, storageID, totalAmount, status, date, createdAt, updatedAt = invoice.ID, invoice.SupplierID, invoice.StorageID, invoice.TotalAmount, invoice.Status, invoice.Date, invoice.CreatedAt, invoice.UpdatedAt
	case pg.MarkInvoiceReceivedRow:
		id, supplierID, storageID, totalAmount, status, date, createdAt, updatedAt = invoice.ID, invoice.SupplierID, invoice.StorageID, invoice.TotalAmount, invoice.Status, invoice.Date, invoice.CreatedAt, invoice.UpdatedAt
	case pg.CancelInvoiceRow:
		id, supplierID, storageID, totalAmount, status, date, createdAt, updatedAt = invoice.ID, invoice.SupplierID, invoice.StorageID, invoice.TotalAmount, invoice.Status, invoice.Date, invoice.CreatedAt, invoice.UpdatedAt
	case pg.SearchInvoicesRow:
		id, supplierID, storageID, totalAmount, status, date, createdAt, updatedAt = invoice.ID, invoice.SupplierID, invoice.StorageID, invoice.TotalAmount, invoice.Status, invoice.Date, invoice.CreatedAt, invoice.UpdatedAt
	default:
		return nil
	}

	response := &model.InvoiceResponse{
		ID:          id.String(),
		SupplierID:  supplierID.String(),
		TotalAmount: numericToString(totalAmount),
		Status:      model.InvoiceStatus(status.InvoiceStatus),
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

// CreateInvoiceWithDetails creates a new invoice with its details in a single atomic operation
func (s *InvoiceS) CreateInvoiceWithDetails(ctx context.Context, req *model.CreateInvoiceWithDetailsRequest) (*model.CreateInvoiceWithDetailsResponse, error) {
	// Validate that details array is not empty
	if len(req.Details) == 0 {
		return nil, fmt.Errorf("at least one invoice detail is required")
	}

	// Step 1: Create the invoice
	invoiceResp, err := s.CreateInvoice(ctx, &req.Invoice)
	if err != nil {
		return nil, fmt.Errorf("failed to create invoice: %w", err)
	}

	// Step 2: Parse invoice ID from response
	invoiceID, err := uuid.Parse(invoiceResp.ID)
	if err != nil {
		return nil, fmt.Errorf("invalid invoice id in response: %w", err)
	}

	if invoiceResp.StorageID == nil || *invoiceResp.StorageID == "" {
		return nil, fmt.Errorf("invoice storage_id is required to update stock")
	}
	invoiceStorageUUID, err := uuid.Parse(*invoiceResp.StorageID)
	if err != nil {
		return nil, fmt.Errorf("invalid invoice storage_id: %w", err)
	}

	// Step 3: Create all invoice details
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

	// Process each detail
	for i, detail := range req.Details {
		// Validate ingredient ID
		ingredientUUID, err := uuid.Parse(detail.IngredientID)
		if err != nil {
			return nil, fmt.Errorf("item %d: invalid ingredient id: %w", i+1, err)
		}

		// Verify ingredient exists
		ingredient, err := s.repo.Tenant(ctx).GetIngredientByID(ctx, ingredientUUID)
		if err != nil {
			return nil, fmt.Errorf("item %d: ingredient not found: %w", i+1, err)
		}

		if ingredient.ID == uuid.Nil {
			return nil, fmt.Errorf("item %d: ingredient not found", i+1)
		}

		// Parse price
		price := pgtype.Numeric{}
		if err := price.Scan(detail.Price); err != nil {
			return nil, fmt.Errorf("item %d: invalid price: %w", i+1, err)
		}

		// Parse price per unit
		pricePerUnit := pgtype.Numeric{}
		if err := pricePerUnit.Scan(detail.PricePerUnit); err != nil {
			return nil, fmt.Errorf("item %d: invalid price_per_unit: %w", i+1, err)
		}

		qty := pgtype.Numeric{}
		if err := qty.Scan(detail.Quantity); err != nil {
			return nil, fmt.Errorf("item %d: invalid quantity: %w", i+1, err)
		}

		// Create invoice detail
		id := uuid.New()
		params := pg.CreateInvoiceDetailParams{
			ID:           id,
			InvoiceID:    invoiceID,
			IngredientID: ingredientUUID,
			Quantity:     qty,
			Price:        price,
			PricePerUnit: pricePerUnit,
		}

		invoiceDetail, err := s.repo.Tenant(ctx).CreateInvoiceDetail(ctx, params)
		if err != nil {
			return nil, fmt.Errorf("item %d: failed to create invoice detail: %w", i+1, err)
		}

		_, err = s.repo.Tenant(ctx).UpdateIngredientPriceAndQuantity(ctx, pg.UpdateIngredientPriceAndQuantityParams{
			ID:           ingredientUUID,
			PricePerUnit: pricePerUnit,
		})
		if err != nil {
			return nil, fmt.Errorf("item %d: failed to update ingredient price_per_unit: %w", i+1, err)
		}

		storagePg := pgtype.UUID{Bytes: invoiceStorageUUID, Valid: true}
		_, _ = s.repo.Tenant(ctx).EnsureIngredientStockByStorage(ctx, pg.EnsureIngredientStockByStorageParams{
			ID:           uuid.New(),
			IngredientID: ingredientUUID,
			StorageID:    storagePg,
		})

		locked, err := s.repo.Tenant(ctx).GetStockByIngredientAndStorageForUpdate(ctx, pg.GetStockByIngredientAndStorageForUpdateParams{
			IngredientID: ingredientUUID,
			StorageID:    storagePg,
		})
		if err != nil {
			return nil, fmt.Errorf("item %d: failed to lock ingredient stock: %w", i+1, err)
		}

		updated, err := s.repo.Tenant(ctx).UpsertAddIngredientStockByStorage(ctx, pg.UpsertAddIngredientStockByStorageParams{
			ID:           uuid.New(),
			IngredientID: ingredientUUID,
			StorageID:    storagePg,
			Quantity:     qty,
		})
		if err != nil {
			return nil, fmt.Errorf("item %d: failed to update ingredient stock: %w", i+1, err)
		}

		zero := pgtype.Numeric{}
		_ = zero.Scan("0")
		sourceType := "invoice"
		srcID := invoiceID
		if err := s.repo.Tenant(ctx).InsertIngredientStockMovement(ctx, pg.InsertIngredientStockMovementParams{
			ID:           uuid.New(),
			StorageID:    invoiceStorageUUID,
			IngredientID: ingredientUUID,
			EventType:    "invoice_in",
			QtyIn:        qty,
			QtyOut:       zero,
			StockBefore:  locked.Quantity,
			StockAfter:   updated.Quantity,
			PricePerUnit: pricePerUnit,
			SourceType:   &sourceType,
			SourceID:     &srcID,
		}); err != nil {
			return nil, fmt.Errorf("item %d: failed to insert stock movement: %w", i+1, err)
		}

		// Add to response
		response.Details = append(response.Details, *toInvoiceDetailResponse(invoiceDetail))
		response.Summary.CreatedCount++

		// Accumulate total amount as string
		totalAmountStr = detail.Price
	}

	// Set the calculated total amount in summary
	response.Summary.TotalAmount = totalAmountStr

	return response, nil
}
