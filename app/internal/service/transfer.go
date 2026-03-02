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

// CreateTransferBatch creates a transfer with items and applies stock changes in one call.
func (s *TransferS) CreateTransferBatch(ctx context.Context, req model.CreateTransferBatchRequest) (*model.TransferResponse, error) {
	if req.FromBranchID == "" || req.ToBranchID == "" {
		return nil, fmt.Errorf("from_branch_id and to_branch_id are required")
	}
	if req.FromStorageID == "" || req.ToStorageID == "" {
		return nil, fmt.Errorf("from_storage_id and to_storage_id are required")
	}
	if req.FromBranchID == req.ToBranchID {
		return nil, fmt.Errorf("from_branch_id and to_branch_id must be different")
	}
	if len(req.Items) == 0 {
		return nil, fmt.Errorf("at least one item is required")
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

	// Create the transfer header
	transfer, err := q.CreateTransfer(ctx, pg.CreateTransferParams{
		ID:            uuid.New(),
		FromBranchID:  fromBranchID,
		ToBranchID:    toBranchID,
		FromStorageID: fromStorageID,
		ToStorageID:   toStorageID,
		ActGroupID:    actGroupID,
		Description:   req.Description,
		Status:        pg.TransferStatusActive,
		Date:          pgtype.Timestamptz{Time: time.Now(), Valid: true},
		TotalAmount:   pgtype.Numeric{Int: big.NewInt(0), Exp: 0, Valid: true},
	})
	if err != nil {
		return nil, fmt.Errorf("failed to create transfer: %w", err)
	}

	// Process each item
	items, err := s.processTransferItems(ctx, q, transfer.ID, fromStorageID, toStorageID, toBranchID, req.Items)
	if err != nil {
		return nil, err
	}

	// Recalculate total
	if err := q.RecalculateTransferTotal(ctx, transfer.ID); err != nil {
		log.Printf("failed to recalculate transfer total: %v", err)
	}

	// Re-fetch transfer to get updated total
	transfer, err = q.GetTransferByID(ctx, transfer.ID)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch transfer: %w", err)
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
	if req.FromBranchID == req.ToBranchID {
		return nil, fmt.Errorf("from_branch_id and to_branch_id must be different")
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
		Status:        pg.TransferStatusActive,
		Date:          pgtype.Timestamptz{Time: time.Now(), Valid: true},
		TotalAmount:   pgtype.Numeric{Int: big.NewInt(0), Exp: 0, Valid: true},
	})
	if err != nil {
		return nil, fmt.Errorf("failed to create transfer: %w", err)
	}

	return toTransferResponse(transfer), nil
}

// AddTransferItems adds items to an existing transfer and applies stock changes.
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

	// Fetch the transfer
	transfer, err := q.GetTransferByID(ctx, transferID)
	if err != nil {
		return nil, fmt.Errorf("transfer not found: %w", err)
	}
	if transfer.Status != pg.TransferStatusActive {
		return nil, fmt.Errorf("can only add items to active transfers")
	}

	// Process items
	items, err := s.processTransferItems(ctx, q, transfer.ID, transfer.FromStorageID, transfer.ToStorageID, transfer.ToBranchID, req.Items)
	if err != nil {
		return nil, err
	}

	// Recalculate total
	if err := q.RecalculateTransferTotal(ctx, transfer.ID); err != nil {
		log.Printf("failed to recalculate transfer total: %v", err)
	}

	// Re-fetch
	transfer, err = q.GetTransferByID(ctx, transfer.ID)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch transfer: %w", err)
	}

	// Get all items for this transfer
	allItems, err := q.GetTransferItemsByTransferID(ctx, transfer.ID)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch transfer items: %w", err)
	}

	resp := toTransferResponse(transfer)
	resp.Items = make([]model.TransferItemResponse, 0, len(allItems))
	for _, item := range allItems {
		resp.Items = append(resp.Items, *toTransferItemResponse(item))
	}
	_ = items // items were already included in allItems
	return resp, nil
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

// GetAllTransfers retrieves all transfers with pagination.
func (s *TransferS) GetAllTransfers(ctx context.Context, limit, offset int32) ([]model.TransferResponse, error) {
	transfers, err := s.repo.Tenant(ctx).GetAllTransfers(ctx, pg.GetAllTransfersParams{
		Limit:  limit,
		Offset: offset,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to get transfers: %w", err)
	}

	var responses []model.TransferResponse
	for _, t := range transfers {
		responses = append(responses, *toTransferResponse(t))
	}
	return responses, nil
}

// DeleteTransfer soft deletes a transfer and reverses all stock changes.
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

	// If transfer was active, reverse stock changes
	if transfer.Status == pg.TransferStatusActive {
		items, err := q.GetTransferItemsByTransferID(ctx, id)
		if err != nil {
			return fmt.Errorf("failed to fetch items: %w", err)
		}

		fromStorageUUID := pgtype.UUID{Bytes: transfer.FromStorageID, Valid: true}
		toStorageUUID := pgtype.UUID{Bytes: transfer.ToStorageID, Valid: true}

		for _, item := range items {
			// Add back to sender's stock
			_, err := q.AddStockByID(ctx, pg.AddStockByIDParams{
				ID:       s.getStockID(ctx, q, item.IngredientID, fromStorageUUID),
				Quantity: item.Quantity,
			})
			if err != nil {
				log.Printf("failed to reverse sender stock for ingredient %s: %v", item.IngredientID, err)
			}

			// Deduct from receiver's stock
			receiverStockID := s.getStockID(ctx, q, item.IngredientID, toStorageUUID)
			if receiverStockID != uuid.Nil {
				_, err := q.DeductStockByID(ctx, pg.DeductStockByIDParams{
					ID:       receiverStockID,
					Quantity: item.Quantity,
				})
				if err != nil {
					log.Printf("failed to reverse receiver stock for ingredient %s: %v", item.IngredientID, err)
				}
			}
		}
	}

	// Soft delete items
	if err := q.DeleteTransferItemsByTransferID(ctx, id); err != nil {
		return fmt.Errorf("failed to delete items: %w", err)
	}

	// Soft delete transfer
	if err := q.DeleteTransfer(ctx, id); err != nil {
		return fmt.Errorf("failed to delete transfer: %w", err)
	}

	return nil
}

// DeleteTransferItem removes a single item and reverses its stock change.
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

	// Reverse stock if transfer is active
	if transfer.Status == pg.TransferStatusActive {
		fromStorageUUID := pgtype.UUID{Bytes: transfer.FromStorageID, Valid: true}
		toStorageUUID := pgtype.UUID{Bytes: transfer.ToStorageID, Valid: true}

		// Add back to sender
		senderStockID := s.getStockID(ctx, q, item.IngredientID, fromStorageUUID)
		if senderStockID != uuid.Nil {
			_, _ = q.AddStockByID(ctx, pg.AddStockByIDParams{
				ID:       senderStockID,
				Quantity: item.Quantity,
			})
		}

		// Deduct from receiver
		receiverStockID := s.getStockID(ctx, q, item.IngredientID, toStorageUUID)
		if receiverStockID != uuid.Nil {
			_, _ = q.DeductStockByID(ctx, pg.DeductStockByIDParams{
				ID:       receiverStockID,
				Quantity: item.Quantity,
			})
		}
	}

	// Soft delete item
	if err := q.DeleteTransferItem(ctx, id); err != nil {
		return fmt.Errorf("failed to delete item: %w", err)
	}

	// Recalculate total
	_ = q.RecalculateTransferTotal(ctx, item.TransferID)

	return nil
}

// processTransferItems handles stock deduction/addition for each item.
func (s *TransferS) processTransferItems(ctx context.Context, q *pg.Queries, transferID uuid.UUID, fromStorageID, toStorageID, toBranchID uuid.UUID, entries []model.CreateTransferItemEntry) ([]model.TransferItemResponse, error) {
	fromStorageUUID := pgtype.UUID{Bytes: fromStorageID, Valid: true}
	toStorageUUID := pgtype.UUID{Bytes: toStorageID, Valid: true}
	toBranchUUID := pgtype.UUID{Bytes: toBranchID, Valid: true}

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

		// 1. Lock and get sender's stock
		senderStock, err := q.GetStockByIngredientAndStorageExplicit(ctx, pg.GetStockByIngredientAndStorageExplicitParams{
			IngredientID: ingredientID,
			StorageID:    fromStorageUUID,
		})
		if err != nil {
			return nil, fmt.Errorf("items[%d]: ingredient not found in sender storage: %w", i, err)
		}

		stockBefore := senderStock.Quantity

		// 2. Deduct from sender (fails if insufficient)
		_, err = q.DeductStockByID(ctx, pg.DeductStockByIDParams{
			ID:       senderStock.ID,
			Quantity: qty,
		})
		if err != nil {
			return nil, fmt.Errorf("items[%d]: insufficient stock for ingredient %s (available: %s, requested: %s)", i, ingredientID, numericToStr(stockBefore), entry.Quantity)
		}

		stockAfter := subtractNumeric(stockBefore, qty)

		// 3. Ensure receiver stock row exists
		receiverStock, err := q.EnsureIngredientStockByStorageWithBranch(ctx, pg.EnsureIngredientStockByStorageWithBranchParams{
			ID:           uuid.New(),
			IngredientID: ingredientID,
			StorageID:    toStorageUUID,
			BranchID:     toBranchUUID,
		})
		if err != nil {
			return nil, fmt.Errorf("items[%d]: failed to ensure receiver stock: %w", i, err)
		}

		// 4. Add to receiver's stock
		_, err = q.AddStockByID(ctx, pg.AddStockByIDParams{
			ID:       receiverStock.ID,
			Quantity: qty,
		})
		if err != nil {
			return nil, fmt.Errorf("items[%d]: failed to add to receiver stock: %w", i, err)
		}

		// 4.5 Auto-set visibility for receiver branch on transfer receive
		_ = q.EnsureIngredientVisibility(ctx, pg.EnsureIngredientVisibilityParams{
			IngredientID: ingredientID,
			BranchID:     toBranchID,
		})

		// 5. Get ingredient price
		ingredient, err := q.GetIngredientByID(ctx, ingredientID)
		if err != nil {
			log.Printf("items[%d]: failed to fetch ingredient price, using 0: %v", i, err)
		}
		price := ingredient.PricePerUnit
		totalAmount := multiplyNumeric(price, qty)

		// 6. Record stock movements for both sides
		sourceType := "transfer"
		_ = q.InsertIngredientStockMovement(ctx, pg.InsertIngredientStockMovementParams{
			ID:           uuid.New(),
			StorageID:    fromStorageID,
			IngredientID: ingredientID,
			EventType:    "transfer_out",
			QtyIn:        pgtype.Numeric{Int: big.NewInt(0), Exp: 0, Valid: true},
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
			QtyOut:       pgtype.Numeric{Int: big.NewInt(0), Exp: 0, Valid: true},
			StockBefore:  receiverStock.Quantity,
			StockAfter:   addNumeric(receiverStock.Quantity, qty),
			PricePerUnit: price,
			SourceType:   &sourceType,
			SourceID:     &transferID,
		})

		// 7. Create transfer item record
		item, err := q.CreateTransferItem(ctx, pg.CreateTransferItemParams{
			ID:             uuid.New(),
			TransferID:     transferID,
			IngredientID:   ingredientID,
			Quantity:        qty,
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

// ==================== HELPERS ====================

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
		Quantity:        numericToStr(item.Quantity),
		StockQtyBefore: numericToStr(item.StockQtyBefore),
		StockQtyAfter:  numericToStr(item.StockQtyAfter),
		Price:          numericToStr(item.Price),
		TotalAmount:    numericToStr(item.TotalAmount),
		CreatedAt:      createdAt,
		UpdatedAt:      updatedAt,
	}
}

func subtractNumeric(a, b pgtype.Numeric) pgtype.Numeric {
	if !a.Valid || !b.Valid {
		return pgtype.Numeric{Int: big.NewInt(0), Exp: 0, Valid: true}
	}
	aVal := numericToBigFloat(a)
	bVal := numericToBigFloat(b)
	result := new(big.Float).Sub(aVal, bVal)
	return bigFloatToNumeric(result)
}

func addNumeric(a, b pgtype.Numeric) pgtype.Numeric {
	if !a.Valid || !b.Valid {
		return pgtype.Numeric{Int: big.NewInt(0), Exp: 0, Valid: true}
	}
	aVal := numericToBigFloat(a)
	bVal := numericToBigFloat(b)
	result := new(big.Float).Add(aVal, bVal)
	return bigFloatToNumeric(result)
}

func multiplyNumeric(a, b pgtype.Numeric) pgtype.Numeric {
	if !a.Valid || !b.Valid {
		return pgtype.Numeric{Int: big.NewInt(0), Exp: 0, Valid: true}
	}
	aVal := numericToBigFloat(a)
	bVal := numericToBigFloat(b)
	result := new(big.Float).Mul(aVal, bVal)
	return bigFloatToNumeric(result)
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
	// Convert to 6 decimal precision
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
