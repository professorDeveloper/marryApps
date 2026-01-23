package service

import (
	"context"
	"fmt"
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
		ID:            id,
		SupplierName:  &req.SupplierName,
		SupplierPhone: req.SupplierPhone,
		SupplierEmail: req.SupplierEmail,
		TotalAmount:   totalAmount,
		Status:        status,
		Date:          date,
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

	params := pg.UpdateInvoiceParams{
		ID:            invoiceID,
		SupplierName:  req.SupplierName,
		SupplierPhone: req.SupplierPhone,
		SupplierEmail: req.SupplierEmail,
		TotalAmount:   totalAmount,
		Status:        status,
		Date:          date,
	}

	invoice, err := s.repo.Tenant(ctx).UpdateInvoice(ctx, params)
	if err != nil {
		return nil, fmt.Errorf("failed to update invoice: %w", err)
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
func (s *InvoiceS) GetInvoiceWithDetails(ctx context.Context, id string) (*model.InvoiceWithDetailsResponse, error) {
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
			SupplierName:     *stat.SupplierName,
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

	params := pg.CreateInvoiceDetailParams{
		ID:           id,
		InvoiceID:    invoiceUUID,
		IngredientID: ingredientUUID,
		Quantity:     req.Quantity,
		Price:        price,
		PricePerUnit: pricePerUnit,
	}

	detail, err := s.repo.Tenant(ctx).CreateInvoiceDetail(ctx, params)
	if err != nil {
		return nil, fmt.Errorf("failed to create invoice detail: %w", err)
	}

	_, err = s.repo.Tenant(ctx).AddIngredientQuantity(ctx, pg.AddIngredientQuantityParams{
		ID:           ingredientUUID,
		PricePerUnit: pricePerUnit,
		Quantity:     &req.Quantity,
	})
	if err != nil {
		// Log error but don't fail the operation - the invoice detail was created successfully
		fmt.Printf("Warning: failed to add ingredient quantity: %v\n", err)
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
			response.Errors = append(response.Errors, fmt.Sprintf("Item %d: invalid price_per_unit: %v", i+1, err))
			continue
		}

		// Create invoice detail
		id := uuid.New()
		params := pg.CreateInvoiceDetailParams{
			ID:           id,
			InvoiceID:    invoiceUUID,
			IngredientID: ingredientUUID,
			Quantity:     detail.Quantity,
			Price:        price,
			PricePerUnit: pricePerUnit,
		}

		invoiceDetail, err := s.repo.Tenant(ctx).CreateInvoiceDetail(ctx, params)
		if err != nil {
			response.Failed++
			response.Errors = append(response.Errors, fmt.Sprintf("Item %d: failed to create invoice detail: %v", i+1, err))
			continue
		}

		// Update ingredient quantity and price
		_, err = s.repo.Tenant(ctx).AddIngredientQuantity(ctx, pg.AddIngredientQuantityParams{
			ID:           ingredientUUID,
			PricePerUnit: pricePerUnit,
			Quantity:     &detail.Quantity,
		})
		if err != nil {
			// Log warning but don't fail - the invoice detail was created successfully
			fmt.Printf("Warning: failed to add ingredient quantity for item %d: %v\n", i+1, err)
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

	var quantity int64
	if req.Quantity != nil {
		quantity = *req.Quantity
	}

	params := pg.UpdateInvoiceDetailParams{
		ID:           detailID,
		InvoiceID:    uuid.UUID{},
		IngredientID: ingredientID,
		Quantity:     quantity,
		Price:        price,
		PricePerUnit: pricePerUnit,
	}

	detail, err := s.repo.Tenant(ctx).UpdateInvoiceDetail(ctx, params)
	if err != nil {
		return nil, fmt.Errorf("failed to update invoice detail: %w", err)
	}

	return toInvoiceDetailResponse(detail), nil
}

// UpdateInvoiceDetailQuantity updates invoice detail quantity and recalculates price
func (s *InvoiceS) UpdateInvoiceDetailQuantity(ctx context.Context, id string, quantity int64) (*model.InvoiceDetailResponse, error) {
	detailID, err := uuid.Parse(id)
	if err != nil {
		return nil, fmt.Errorf("invalid detail id: %w", err)
	}

	detail, err := s.repo.Tenant(ctx).UpdateInvoiceDetailQuantity(ctx, pg.UpdateInvoiceDetailQuantityParams{
		ID:       detailID,
		Quantity: quantity,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to update invoice detail quantity: %w", err)
	}

	return toInvoiceDetailResponse(detail), nil
}

// DeleteInvoiceDetail soft deletes an invoice detail
func (s *InvoiceS) DeleteInvoiceDetail(ctx context.Context, id string) error {
	detailID, err := uuid.Parse(id)
	if err != nil {
		return fmt.Errorf("invalid detail id: %w", err)
	}

	if err := s.repo.Tenant(ctx).DeleteInvoiceDetail(ctx, detailID); err != nil {
		return fmt.Errorf("failed to delete invoice detail: %w", err)
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

	return nil
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

func toInvoiceResponse(invoice pg.Invoice) *model.InvoiceResponse {
	response := &model.InvoiceResponse{
		ID:            invoice.ID.String(),
		SupplierName:  *invoice.SupplierName,
		SupplierPhone: invoice.SupplierPhone,
		SupplierEmail: invoice.SupplierEmail,
		TotalAmount:   numericToString(invoice.TotalAmount),
		Status:        model.InvoiceStatus(invoice.Status.InvoiceStatus),
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

func toInvoiceWithDetailsResponse(invoice pg.GetInvoiceWithDetailsRow) *model.InvoiceWithDetailsResponse {
	response := &model.InvoiceWithDetailsResponse{
		ID:            invoice.ID.String(),
		SupplierName:  *invoice.SupplierName,
		SupplierPhone: invoice.SupplierPhone,
		SupplierEmail: invoice.SupplierEmail,
		TotalAmount:   numericToString(invoice.TotalAmount),
		Status:        model.InvoiceStatus(invoice.Status.InvoiceStatus),
		ItemCount:     invoice.ItemCount,
		TotalQuantity: invoice.TotalQuantity,
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
		Quantity:     detail.Quantity,
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
		Quantity:          detail.Quantity,
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

	return str
}
