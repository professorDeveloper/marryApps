package service

import (
	"context"
	"fmt"
	"log"
	"math/big"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
	"gitlab.yurtal.tech/company/maryai/back/internal/model"
	"gitlab.yurtal.tech/company/maryai/back/internal/repository"
	pg "gitlab.yurtal.tech/company/maryai/back/internal/repository/pg/tenantsdb"
)

type TransferS struct {
	repo *repository.Repository
}

func NewTransferS(repo *repository.Repository) *TransferS {
	return &TransferS{repo: repo}
}

// resolveTransferStatus resolves the requested status string to a pg.TransferStatus.
// Defaults to active if nil. Returns error if "deleted" is requested (use DELETE endpoint).
func resolveTransferStatus(s *string, defaultStatus pg.TransferStatus) (pg.TransferStatus, error) {
	if s == nil {
		return defaultStatus, nil
	}
	switch *s {
	case "draft":
		return pg.TransferStatusDraft, nil
	case "active":
		return pg.TransferStatusActive, nil
	case "deleted":
		return "", fmt.Errorf("cannot set status to 'deleted' via this endpoint; use DELETE instead")
	default:
		return "", fmt.Errorf("invalid status %q: must be 'draft' or 'active'", *s)
	}
}

// CreateTransferBatch creates a transfer with items in one call.
// Status defaults to active; pass "draft" to save without moving stock.
func (s *TransferS) CreateTransferBatch(ctx context.Context, req model.CreateTransferBatchRequest) (*model.TransferResponse, error) {
	if req.FromBranchID == "" || req.ToBranchID == "" {
		return nil, fmt.Errorf("from_branch_id and to_branch_id are required")
	}
	if req.FromStorageID == "" || req.ToStorageID == "" {
		return nil, fmt.Errorf("from_storage_id and to_storage_id are required")
	}
	if len(req.Items) == 0 {
		return nil, fmt.Errorf("at least one item is required")
	}

	status, err := resolveTransferStatus(req.Status, pg.TransferStatusActive)
	if err != nil {
		return nil, err
	}

	fromBranchID, err := uuid.Parse(req.FromBranchID)
	if err != nil {
		return nil, fmt.Errorf("invalid from_branch_id: %w", err)
	}
	toBranchID, err := uuid.Parse(req.ToBranchID)
	if err != nil {
		return nil, fmt.Errorf("invalid to_branch_id: %w", err)
	}
	fromStorageID, err := uuid.Parse(req.FromStorageID)
	if err != nil {
		return nil, fmt.Errorf("invalid from_storage_id: %w", err)
	}
	toStorageID, err := uuid.Parse(req.ToStorageID)
	if err != nil {
		return nil, fmt.Errorf("invalid to_storage_id: %w", err)
	}

	actGroupID := pgtype.UUID{}
	if req.ActGroupID != nil && *req.ActGroupID != "" {
		id, err := uuid.Parse(*req.ActGroupID)
		if err != nil {
			return nil, fmt.Errorf("invalid act_group_id: %w", err)
		}
		actGroupID = pgtype.UUID{Bytes: id, Valid: true}
	}

	q := s.repo.Tenant(ctx)

	transfer, err := q.CreateTransfer(ctx, pg.CreateTransferParams{
		ID:            uuid.New(),
		FromBranchID:  fromBranchID,
		ToBranchID:    toBranchID,
		FromStorageID: fromStorageID,
		ToStorageID:   toStorageID,
		ActGroupID:    actGroupID,
		Description:   req.Description,
		Status:        status,
		Date:          pgtype.Timestamptz{Time: time.Now(), Valid: true},
		TotalAmount:   pgtype.Numeric{Int: big.NewInt(0), Exp: 0, Valid: true},
	})
	if err != nil {
		return nil, fmt.Errorf("failed to create transfer: %w", err)
	}

	applyStock := status == pg.TransferStatusActive
	items, err := s.processTransferItems(ctx, q, transfer.ID, fromStorageID, toStorageID, fromBranchID, toBranchID, req.Items, applyStock)
	if err != nil {
		return nil, err
	}

	if applyStock {
		if err := q.RecalculateTransferTotal(ctx, transfer.ID); err != nil {
			log.Printf("failed to recalculate transfer total: %v", err)
		}
		transfer, err = q.GetTransferByID(ctx, transfer.ID)
		if err != nil {
			return nil, fmt.Errorf("failed to fetch transfer: %w", err)
		}
	}

	resp := toTransferResponse(transfer)
	resp.Items = items
	return resp, nil
}

// CreateTransfer creates just the transfer header (no items).
func (s *TransferS) CreateTransfer(ctx context.Context, req model.CreateTransferRequest) (*model.TransferResponse, error) {
	if req.FromBranchID == "" || req.ToBranchID == "" {
		return nil, fmt.Errorf("from_branch_id and to_branch_id are required")
	}
	if req.FromStorageID == "" || req.ToStorageID == "" {
		return nil, fmt.Errorf("from_storage_id and to_storage_id are required")
	}

	status, err := resolveTransferStatus(req.Status, pg.TransferStatusActive)
	if err != nil {
		return nil, err
	}

	fromBranchID, err := uuid.Parse(req.FromBranchID)
	if err != nil {
		return nil, fmt.Errorf("invalid from_branch_id: %w", err)
	}
	toBranchID, err := uuid.Parse(req.ToBranchID)
	if err != nil {
		return nil, fmt.Errorf("invalid to_branch_id: %w", err)
	}
	fromStorageID, err := uuid.Parse(req.FromStorageID)
	if err != nil {
		return nil, fmt.Errorf("invalid from_storage_id: %w", err)
	}
	toStorageID, err := uuid.Parse(req.ToStorageID)
	if err != nil {
		return nil, fmt.Errorf("invalid to_storage_id: %w", err)
	}

	actGroupID := pgtype.UUID{}
	if req.ActGroupID != nil && *req.ActGroupID != "" {
		id, err := uuid.Parse(*req.ActGroupID)
		if err != nil {
			return nil, fmt.Errorf("invalid act_group_id: %w", err)
		}
		actGroupID = pgtype.UUID{Bytes: id, Valid: true}
	}

	transfer, err := s.repo.Tenant(ctx).CreateTransfer(ctx, pg.CreateTransferParams{
		ID:            uuid.New(),
		FromBranchID:  fromBranchID,
		ToBranchID:    toBranchID,
		FromStorageID: fromStorageID,
		ToStorageID:   toStorageID,
		ActGroupID:    actGroupID,
		Description:   req.Description,
		Status:        status,
		Date:          pgtype.Timestamptz{Time: time.Now(), Valid: true},
		TotalAmount:   pgtype.Numeric{Int: big.NewInt(0), Exp: 0, Valid: true},
	})
	if err != nil {
		return nil, fmt.Errorf("failed to create transfer: %w", err)
	}

	return toTransferResponse(transfer), nil
}

// AddTransferItems adds items to an existing transfer; stock is applied only if transfer is active.
func (s *TransferS) AddTransferItems(ctx context.Context, req model.CreateTransferItemsRequest) (*model.TransferResponse, error) {
	if req.TransferID == "" {
		return nil, fmt.Errorf("transfer_id is required")
	}
	if len(req.Items) == 0 {
		return nil, fmt.Errorf("at least one item is required")
	}

	transferID, err := uuid.Parse(req.TransferID)
	if err != nil {
		return nil, fmt.Errorf("invalid transfer_id: %w", err)
	}

	q := s.repo.Tenant(ctx)

	transfer, err := q.GetTransferByID(ctx, transferID)
	if err != nil {
		return nil, fmt.Errorf("transfer not found: %w", err)
	}
	if transfer.Status == pg.TransferStatusDeleted {
		return nil, fmt.Errorf("cannot add items to a deleted transfer")
	}

	applyStock := transfer.Status == pg.TransferStatusActive
	_, err = s.processTransferItems(ctx, q, transfer.ID, transfer.FromStorageID, transfer.ToStorageID, transfer.FromBranchID, transfer.ToBranchID, req.Items, applyStock)
	if err != nil {
		return nil, err
	}

	if applyStock {
		if err := q.RecalculateTransferTotal(ctx, transfer.ID); err != nil {
			log.Printf("failed to recalculate transfer total: %v", err)
		}
	}

	return s.GetTransferByID(ctx, req.TransferID)
}

// GetTransferByID retrieves a transfer with its items.
func (s *TransferS) GetTransferByID(ctx context.Context, transferID string) (*model.TransferResponse, error) {
	id, err := uuid.Parse(transferID)
	if err != nil {
		return nil, fmt.Errorf("invalid transfer_id: %w", err)
	}

	q := s.repo.Tenant(ctx)

	transfer, err := q.GetTransferByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("transfer not found: %w", err)
	}

	items, err := q.GetTransferItemsByTransferID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch items: %w", err)
	}

	resp := toTransferResponse(transfer)
	resp.Items = make([]model.TransferItemResponse, 0, len(items))
	for _, item := range items {
		resp.Items = append(resp.Items, *toTransferItemResponse(item))
	}
	return resp, nil
}

// GetAllTransfers retrieves transfers with filters and pagination.
func (s *TransferS) GetAllTransfers(ctx context.Context, filter model.TransferFilter, limit, offset int32) (*model.PaginatedTransfersResponse, error) {
	q := s.repo.Tenant(ctx)

	params := pg.GetTransfersFilteredParams{Limit: limit, Offset: offset}
	countParams := pg.CountTransfersFilteredParams{}

	if filter.DateFrom != nil {
		_ = params.DateFrom.Scan(*filter.DateFrom)
		_ = countParams.DateFrom.Scan(*filter.DateFrom)
	}
	if filter.DateTo != nil {
		_ = params.DateTo.Scan(*filter.DateTo)
		_ = countParams.DateTo.Scan(*filter.DateTo)
	}
	if filter.Status != nil {
		params.Status = *filter.Status
		countParams.Status = *filter.Status
	}
	if filter.FromStorageID != nil {
		if id, err := uuid.Parse(*filter.FromStorageID); err == nil {
			params.FromStorageID = id
			countParams.FromStorageID = id
		}
	}
	if filter.ToStorageID != nil {
		if id, err := uuid.Parse(*filter.ToStorageID); err == nil {
			params.ToStorageID = id
			countParams.ToStorageID = id
		}
	}
	if filter.ActGroupID != nil {
		if id, err := uuid.Parse(*filter.ActGroupID); err == nil {
			params.ActGroupID = id
			countParams.ActGroupID = id
		}
	}
	if filter.IngredientID != nil {
		if id, err := uuid.Parse(*filter.IngredientID); err == nil {
			params.IngredientID = id
			countParams.IngredientID = id
		}
	}

	total, err := q.CountTransfersFiltered(ctx, countParams)
	if err != nil {
		return nil, fmt.Errorf("failed to count transfers: %w", err)
	}

	transfers, err := q.GetTransfersFiltered(ctx, params)
	if err != nil {
		return nil, fmt.Errorf("failed to get transfers: %w", err)
	}

	data := make([]*model.TransferResponse, 0, len(transfers))
	for i := range transfers {
		data = append(data, toTransferResponse(transfers[i]))
	}

	totalPages := int32(1)
	if limit > 0 {
		totalPages = int32((total + int64(limit) - 1) / int64(limit))
	}

	return &model.PaginatedTransfersResponse{
		Data: data,
		Pagination: model.PaginationMeta{
			Total:      int32(total),
			Limit:      limit,
			Offset:     offset,
			TotalPages: totalPages,
		},
	}, nil
}

// DeleteTransfersBatch soft deletes multiple transfers and reverses their stock changes.
func (s *TransferS) DeleteTransfersBatch(ctx context.Context, req *model.DeleteTransfersBatchRequest) error {
	for _, id := range req.IDs {
		if err := s.DeleteTransfer(ctx, id); err != nil {
			return fmt.Errorf("failed to delete transfer %s: %w", id, err)
		}
	}
	return nil
}

// DeleteTransfer soft deletes a transfer; reverses stock only if it was active.
func (s *TransferS) DeleteTransfer(ctx context.Context, transferID string) error {
	id, err := uuid.Parse(transferID)
	if err != nil {
		return fmt.Errorf("invalid transfer_id: %w", err)
	}

	q := s.repo.Tenant(ctx)

	transfer, err := q.GetTransferByID(ctx, id)
	if err != nil {
		return fmt.Errorf("transfer not found: %w", err)
	}

	// Only reverse stock if the transfer was active
	if transfer.Status == pg.TransferStatusActive {
		items, err := q.GetTransferItemsByTransferID(ctx, id)
		if err != nil {
			return fmt.Errorf("failed to fetch items: %w", err)
		}
		s.reverseTransferItemsStock(ctx, q, items, transfer.FromStorageID, transfer.ToStorageID)
	}

	if err := q.DeleteTransferItemsByTransferID(ctx, id); err != nil {
		return fmt.Errorf("failed to delete items: %w", err)
	}

	if err := q.DeleteTransfer(ctx, id); err != nil {
		return fmt.Errorf("failed to delete transfer: %w", err)
	}

	return nil
}

// DeleteTransferItem removes a single item; reverses stock only if transfer was active.
func (s *TransferS) DeleteTransferItem(ctx context.Context, itemID string) error {
	id, err := uuid.Parse(itemID)
	if err != nil {
		return fmt.Errorf("invalid item_id: %w", err)
	}

	q := s.repo.Tenant(ctx)

	item, err := q.GetTransferItemByID(ctx, id)
	if err != nil {
		return fmt.Errorf("transfer item not found: %w", err)
	}

	transfer, err := q.GetTransferByID(ctx, item.TransferID)
	if err != nil {
		return fmt.Errorf("transfer not found: %w", err)
	}

	if transfer.Status == pg.TransferStatusActive {
		s.reverseTransferItemsStock(ctx, q, []pg.TransferItem{item}, transfer.FromStorageID, transfer.ToStorageID)
	}

	if err := q.DeleteTransferItem(ctx, id); err != nil {
		return fmt.Errorf("failed to delete item: %w", err)
	}

	_ = q.RecalculateTransferTotal(ctx, item.TransferID)

	return nil
}

// UpsertTransferItems replaces all items and optionally updates transfer-level fields in one call.
// Status transitions: draft→active (apply stock), active→draft (reverse stock). Cannot set deleted.
func (s *TransferS) UpsertTransferItems(ctx context.Context, transferID string, req model.UpsertTransferItemsRequest) (*model.TransferResponse, error) {
	id, err := uuid.Parse(transferID)
	if err != nil {
		return nil, fmt.Errorf("invalid transfer_id: %w", err)
	}
	if len(req.Items) == 0 {
		return nil, fmt.Errorf("at least one item is required")
	}

	q := s.repo.Tenant(ctx)

	transfer, err := q.GetTransferByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("transfer not found: %w", err)
	}
	if transfer.Status == pg.TransferStatusDeleted {
		return nil, fmt.Errorf("cannot update a deleted transfer")
	}

	oldStatus := transfer.Status

	// Validate + resolve new status
	newStatus := oldStatus
	if req.Status != nil {
		ns, err := resolveTransferStatus(req.Status, oldStatus)
		if err != nil {
			return nil, err
		}
		if ns != oldStatus {
			// Only draft↔active transitions are allowed
			if !((oldStatus == pg.TransferStatusDraft && ns == pg.TransferStatusActive) ||
				(oldStatus == pg.TransferStatusActive && ns == pg.TransferStatusDraft)) {
				return nil, fmt.Errorf("invalid status transition: %s → %s", oldStatus, ns)
			}
		}
		newStatus = ns
	}

	// Step 1: Reverse stock if transfer was active
	if oldStatus == pg.TransferStatusActive {
		existing, err := q.GetTransferItemsByTransferID(ctx, id)
		if err != nil {
			return nil, fmt.Errorf("failed to fetch existing items: %w", err)
		}
		s.reverseTransferItemsStock(ctx, q, existing, transfer.FromStorageID, transfer.ToStorageID)
	}

	// Step 2: Resolve storages to use for new items (may be overridden by request)
	newFromStorageID := transfer.FromStorageID
	newToStorageID := transfer.ToStorageID

	if req.FromStorageID != nil {
		if parsed, err := uuid.Parse(*req.FromStorageID); err == nil {
			newFromStorageID = parsed
		}
	}
	if req.ToStorageID != nil {
		if parsed, err := uuid.Parse(*req.ToStorageID); err == nil {
			newToStorageID = parsed
		}
	}

	// Step 3: Update transfer-level fields in DB
	updateParams := pg.UpdateTransferParams{
		ID:            id,
		FromBranchID:  transfer.FromBranchID,
		ToBranchID:    transfer.ToBranchID,
		FromStorageID: newFromStorageID,
		ToStorageID:   newToStorageID,
		ActGroupID:    transfer.ActGroupID,
		Description:   transfer.Description,
		Status:        newStatus,
		Date:          transfer.Date,
		TotalAmount:   transfer.TotalAmount,
	}
	if req.ActGroupID != nil {
		if *req.ActGroupID == "" {
			updateParams.ActGroupID = pgtype.UUID{}
		} else if parsed, err := uuid.Parse(*req.ActGroupID); err == nil {
			updateParams.ActGroupID = pgtype.UUID{Bytes: parsed, Valid: true}
		}
	}
	if req.Description != nil {
		updateParams.Description = req.Description
	}
	if req.Date != nil {
		t, err := time.Parse("2006-01-02", *req.Date)
		if err == nil {
			updateParams.Date = pgtype.Timestamptz{Time: t, Valid: true}
		}
	}

	transfer, err = q.UpdateTransfer(ctx, updateParams)
	if err != nil {
		return nil, fmt.Errorf("failed to update transfer: %w", err)
	}

	// Step 4: Delete existing items
	if err := q.DeleteTransferItemsByTransferID(ctx, id); err != nil {
		return nil, fmt.Errorf("failed to delete existing items: %w", err)
	}

	// Step 5: Create new items; apply stock only if newStatus == active
	applyStock := newStatus == pg.TransferStatusActive
	if _, err := s.processTransferItems(ctx, q, id, newFromStorageID, newToStorageID, transfer.FromBranchID, transfer.ToBranchID, req.Items, applyStock); err != nil {
		return nil, err
	}

	_ = q.RecalculateTransferTotal(ctx, id)

	return s.GetTransferByID(ctx, transferID)
}

// ==================== HELPERS ====================

// reverseTransferItemsStock adds qty back to sender and deducts from receiver (allowing negatives).
func (s *TransferS) reverseTransferItemsStock(ctx context.Context, q *pg.Queries, items []pg.TransferItem, fromStorageID, toStorageID uuid.UUID) {
	fromStorageUUID := pgtype.UUID{Bytes: fromStorageID, Valid: true}
	toStorageUUID := pgtype.UUID{Bytes: toStorageID, Valid: true}

	for _, item := range items {
		senderStockID := s.getStockID(ctx, q, item.IngredientID, fromStorageUUID)
		if senderStockID != uuid.Nil {
			_, _ = q.AddStockByID(ctx, pg.AddStockByIDParams{
				ID:       senderStockID,
				Quantity: item.Quantity,
			})
		}
		receiverStockID := s.getStockID(ctx, q, item.IngredientID, toStorageUUID)
		if receiverStockID != uuid.Nil {
			_, _ = q.DeductStockAllowNegative(ctx, receiverStockID, item.Quantity)
		}
	}
}

// processTransferItems creates item records; applies stock changes only when applyStock == true.
func (s *TransferS) processTransferItems(ctx context.Context, q *pg.Queries, transferID uuid.UUID, fromStorageID, toStorageID, fromBranchID, toBranchID uuid.UUID, entries []model.CreateTransferItemEntry, applyStock bool) ([]model.TransferItemResponse, error) {
	fromStorageUUID := pgtype.UUID{Bytes: fromStorageID, Valid: true}
	toStorageUUID := pgtype.UUID{Bytes: toStorageID, Valid: true}
	fromBranchUUID := pgtype.UUID{Bytes: fromBranchID, Valid: true}
	toBranchUUID := pgtype.UUID{Bytes: toBranchID, Valid: true}

	zero := pgtype.Numeric{Int: big.NewInt(0), Exp: 0, Valid: true}

	var responses []model.TransferItemResponse

	for i, entry := range entries {
		if entry.IngredientID == "" {
			return nil, fmt.Errorf("items[%d]: ingredient_id is required", i)
		}
		if entry.Quantity == "" {
			return nil, fmt.Errorf("items[%d]: quantity is required", i)
		}

		ingredientID, err := uuid.Parse(entry.IngredientID)
		if err != nil {
			return nil, fmt.Errorf("items[%d]: invalid ingredient_id: %w", i, err)
		}

		qty := pgtype.Numeric{}
		if err := qty.Scan(entry.Quantity); err != nil {
			return nil, fmt.Errorf("items[%d]: invalid quantity: %w", i, err)
		}

		// Get ingredient price
		ingredient, err := q.GetIngredientByID(ctx, ingredientID)
		if err != nil {
			log.Printf("items[%d]: failed to fetch ingredient price, using 0: %v", i, err)
		}
		price := ingredient.PricePerUnit
		totalAmount := multiplyNumeric(price, qty)

		var stockBefore, stockAfter pgtype.Numeric

		if applyStock {
			// Ensure sender stock row (creates with 0 if missing)
			senderStock, err := q.EnsureIngredientStockByStorageWithBranch(ctx, pg.EnsureIngredientStockByStorageWithBranchParams{
				ID:           uuid.New(),
				IngredientID: ingredientID,
				StorageID:    fromStorageUUID,
				BranchID:     fromBranchUUID,
			})
			if err != nil {
				return nil, fmt.Errorf("items[%d]: failed to ensure sender stock: %w", i, err)
			}

			stockBefore = senderStock.Quantity

			// Deduct from sender (stock may go negative)
			if _, err = q.DeductStockAllowNegative(ctx, senderStock.ID, qty); err != nil {
				return nil, fmt.Errorf("items[%d]: failed to deduct sender stock for ingredient %s: %w", i, ingredientID, err)
			}

			stockAfter = subtractNumeric(stockBefore, qty)

			// Ensure receiver stock row and add
			receiverStock, err := q.EnsureIngredientStockByStorageWithBranch(ctx, pg.EnsureIngredientStockByStorageWithBranchParams{
				ID:           uuid.New(),
				IngredientID: ingredientID,
				StorageID:    toStorageUUID,
				BranchID:     toBranchUUID,
			})
			if err != nil {
				return nil, fmt.Errorf("items[%d]: failed to ensure receiver stock: %w", i, err)
			}

			if _, err = q.AddStockByID(ctx, pg.AddStockByIDParams{
				ID:       receiverStock.ID,
				Quantity: qty,
			}); err != nil {
				return nil, fmt.Errorf("items[%d]: failed to add to receiver stock: %w", i, err)
			}

			// Auto-set visibility for receiver branch
			_ = q.EnsureIngredientVisibility(ctx, pg.EnsureIngredientVisibilityParams{
				IngredientID: ingredientID,
				BranchID:     toBranchID,
			})

			// Record stock movements
			sourceType := "transfer"
			_ = q.InsertIngredientStockMovement(ctx, pg.InsertIngredientStockMovementParams{
				ID:           uuid.New(),
				StorageID:    fromStorageID,
				IngredientID: ingredientID,
				EventType:    "transfer_out",
				QtyIn:        zero,
				QtyOut:       qty,
				StockBefore:  stockBefore,
				StockAfter:   stockAfter,
				PricePerUnit: price,
				SourceType:   &sourceType,
				SourceID:     &transferID,
			})
			_ = q.InsertIngredientStockMovement(ctx, pg.InsertIngredientStockMovementParams{
				ID:           uuid.New(),
				StorageID:    toStorageID,
				IngredientID: ingredientID,
				EventType:    "transfer_in",
				QtyIn:        qty,
				QtyOut:       zero,
				StockBefore:  receiverStock.Quantity,
				StockAfter:   addNumeric(receiverStock.Quantity, qty),
				PricePerUnit: price,
				SourceType:   &sourceType,
				SourceID:     &transferID,
			})
		} else {
			// Draft: no stock movement; record zeros
			stockBefore = zero
			stockAfter = zero
		}

		item, err := q.CreateTransferItem(ctx, pg.CreateTransferItemParams{
			ID:             uuid.New(),
			TransferID:     transferID,
			IngredientID:   ingredientID,
			Quantity:       qty,
			StockQtyBefore: stockBefore,
			StockQtyAfter:  stockAfter,
			Price:          price,
			TotalAmount:    totalAmount,
		})
		if err != nil {
			return nil, fmt.Errorf("items[%d]: failed to create transfer item: %w", i, err)
		}

		responses = append(responses, *toTransferItemResponse(item))
	}

	return responses, nil
}

// getStockID finds stock ID for an ingredient in a storage, returns uuid.Nil if not found.
func (s *TransferS) getStockID(ctx context.Context, q *pg.Queries, ingredientID uuid.UUID, storageID pgtype.UUID) uuid.UUID {
	stock, err := q.GetStockByIngredientAndStorageExplicit(ctx, pg.GetStockByIngredientAndStorageExplicitParams{
		IngredientID: ingredientID,
		StorageID:    storageID,
	})
	if err != nil {
		return uuid.Nil
	}
	return stock.ID
}

// ==================== RESPONSE MAPPERS ====================

func toTransferResponse(t pg.Transfer) *model.TransferResponse {
	var actGroupID *string
	if t.ActGroupID.Valid {
		s := uuid.UUID(t.ActGroupID.Bytes).String()
		actGroupID = &s
	}
	var date *time.Time
	if t.Date.Valid {
		date = &t.Date.Time
	}
	var createdAt *time.Time
	if t.CreatedAt.Valid {
		createdAt = &t.CreatedAt.Time
	}
	var updatedAt *time.Time
	if t.UpdatedAt.Valid {
		updatedAt = &t.UpdatedAt.Time
	}

	transferStatus := string(t.Status)
	if t.DeletedAt > 0 {
		transferStatus = "deleted"
	}

	return &model.TransferResponse{
		ID:            t.ID.String(),
		Number:        t.Number,
		FromBranchID:  t.FromBranchID.String(),
		ToBranchID:    t.ToBranchID.String(),
		FromStorageID: t.FromStorageID.String(),
		ToStorageID:   t.ToStorageID.String(),
		ActGroupID:    actGroupID,
		Description:   t.Description,
		Status:        transferStatus,
		Date:          date,
		TotalAmount:   numericToStr(t.TotalAmount),
		CreatedAt:     createdAt,
		UpdatedAt:     updatedAt,
	}
}

func toTransferItemResponse(item pg.TransferItem) *model.TransferItemResponse {
	var createdAt *time.Time
	if item.CreatedAt.Valid {
		createdAt = &item.CreatedAt.Time
	}
	var updatedAt *time.Time
	if item.UpdatedAt.Valid {
		updatedAt = &item.UpdatedAt.Time
	}

	return &model.TransferItemResponse{
		ID:             item.ID.String(),
		TransferID:     item.TransferID.String(),
		IngredientID:   item.IngredientID.String(),
		Quantity:       numericToStr(item.Quantity),
		StockQtyBefore: numericToStr(item.StockQtyBefore),
		StockQtyAfter:  numericToStr(item.StockQtyAfter),
		Price:          numericToStr(item.Price),
		TotalAmount:    numericToStr(item.TotalAmount),
		CreatedAt:      createdAt,
		UpdatedAt:      updatedAt,
	}
}

// ==================== NUMERIC HELPERS ====================

func subtractNumeric(a, b pgtype.Numeric) pgtype.Numeric {
	if !a.Valid || !b.Valid {
		return pgtype.Numeric{Int: big.NewInt(0), Exp: 0, Valid: true}
	}
	return bigFloatToNumeric(new(big.Float).Sub(numericToBigFloat(a), numericToBigFloat(b)))
}

func addNumeric(a, b pgtype.Numeric) pgtype.Numeric {
	if !a.Valid || !b.Valid {
		return pgtype.Numeric{Int: big.NewInt(0), Exp: 0, Valid: true}
	}
	return bigFloatToNumeric(new(big.Float).Add(numericToBigFloat(a), numericToBigFloat(b)))
}

func multiplyNumeric(a, b pgtype.Numeric) pgtype.Numeric {
	if !a.Valid || !b.Valid {
		return pgtype.Numeric{Int: big.NewInt(0), Exp: 0, Valid: true}
	}
	return bigFloatToNumeric(new(big.Float).Mul(numericToBigFloat(a), numericToBigFloat(b)))
}

func numericToBigFloat(n pgtype.Numeric) *big.Float {
	if !n.Valid || n.Int == nil {
		return new(big.Float)
	}
	f := new(big.Float).SetInt(n.Int)
	if n.Exp != 0 {
		exp := new(big.Float).SetFloat64(1)
		for i := int32(0); i < abs32(n.Exp); i++ {
			exp.Mul(exp, new(big.Float).SetFloat64(10))
		}
		if n.Exp < 0 {
			f.Quo(f, exp)
		} else {
			f.Mul(f, exp)
		}
	}
	return f
}

func bigFloatToNumeric(f *big.Float) pgtype.Numeric {
	scale := new(big.Float).SetFloat64(1e6)
	scaled := new(big.Float).Mul(f, scale)
	intVal, _ := scaled.Int(nil)
	return pgtype.Numeric{Int: intVal, Exp: -6, Valid: true}
}

func abs32(v int32) int32 {
	if v < 0 {
		return -v
	}
	return v
}
