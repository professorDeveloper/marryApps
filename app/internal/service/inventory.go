package service

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"gitlab.yurtal.tech/company/maryai/back/internal/model"
	"gitlab.yurtal.tech/company/maryai/back/internal/repository"
	pg "gitlab.yurtal.tech/company/maryai/back/internal/repository/pg/tenantsdb"
)

// Inventory delete errors
var (
	ErrInventoryNotFound          = errors.New("inventory not found")
	ErrInventoryAlreadyDeleted    = errors.New("inventory is already deleted")
	ErrInventoryDeleteOnlyLatest  = errors.New("only the latest inventory can be deleted")
	ErrInventoryLatestCheckFailed = errors.New("failed to check latest inventory")
	ErrInventoryDeleteFailed      = errors.New("failed to delete inventory")
)

type InventoryS struct {
	repo *repository.Repository
}

func NewInventoryS(repo *repository.Repository) *InventoryS {
	return &InventoryS{repo: repo}
}

// getTenantMutationQueries returns tenant queries within a transaction for mutation operations.
// If a transaction already exists in context, it reuses it. Otherwise, it creates a new one.
// Returns: queries, enriched context, transaction, ownsTx (whether we created the tx), error
func (s *InventoryS) getTenantMutationQueries(ctx context.Context) (*pg.Queries, context.Context, pgx.Tx, bool, error) {
	if existingTx, ok := repository.TenantTxFromContext(ctx); ok && existingTx != nil {
		// Reuse existing transaction - get queries from context or create from tx
		if q, ok := repository.TenantQueriesFromContext(ctx); ok && q != nil {
			return q, ctx, existingTx, false, nil
		}
		q := pg.New(existingTx)
		txCtx := repository.WithTenantQueries(ctx, q)
		return q, txCtx, existingTx, false, nil
	}

	tx, err := s.repo.PgRepo.TenantPool.Begin(ctx)
	if err != nil {
		return nil, nil, nil, false, fmt.Errorf("failed to begin transaction: %w", err)
	}

	brandID, _ := ctx.Value("brand_id").(string)
	brandID = strings.TrimSpace(brandID)
	if brandID == "" {
		tx.Rollback(ctx)
		return nil, nil, nil, false, fmt.Errorf("brand_id is missing in context")
	}

	schemaName := fmt.Sprintf("tenant_%s", brandID)
	if _, err := tx.Exec(ctx, fmt.Sprintf(`SET LOCAL search_path TO "%s", public`, schemaName)); err != nil {
		tx.Rollback(ctx)
		return nil, nil, nil, false, fmt.Errorf("failed to set tenant search_path: %w", err)
	}

	if _, err := tx.Exec(ctx, "SET LOCAL app.brand_id = $1", brandID); err != nil {
		tx.Rollback(ctx)
		return nil, nil, nil, false, fmt.Errorf("failed to set app.brand_id: %w", err)
	}

	if branchID, _ := ctx.Value("branch_id").(string); strings.TrimSpace(branchID) != "" {
		if _, err := tx.Exec(ctx, "SET LOCAL app.branch_id = $1", strings.TrimSpace(branchID)); err != nil {
			tx.Rollback(ctx)
			return nil, nil, nil, false, fmt.Errorf("failed to set app.branch_id: %w", err)
		}
	}

	q := pg.New(tx)
	txCtx := repository.WithTenantQueries(ctx, q)

	return q, txCtx, tx, true, nil
}

// getTenantReadQueries returns tenant queries for read-only operations.
// If a transaction exists in context, it reuses it. Otherwise, it creates a connection.
// Returns: queries, enriched context, connection (nil if reusing tx), ownsConn (whether we created the conn), error
func (s *InventoryS) getTenantReadQueries(ctx context.Context) (*pg.Queries, context.Context, pgx.Tx, bool, error) {
	if existingTx, ok := repository.TenantTxFromContext(ctx); ok && existingTx != nil {
		// Reuse existing transaction - get queries from context or create from tx
		if q, ok := repository.TenantQueriesFromContext(ctx); ok && q != nil {
			return q, ctx, existingTx, false, nil
		}
		q := pg.New(existingTx)
		txCtx := repository.WithTenantQueries(ctx, q)
		return q, txCtx, existingTx, false, nil
	}

	// For read-only operations without an existing transaction, acquire a connection
	conn, err := s.repo.PgRepo.TenantPool.Acquire(ctx)
	if err != nil {
		return nil, nil, nil, false, fmt.Errorf("failed to acquire connection: %w", err)
	}
	defer conn.Release()

	brandID, _ := ctx.Value("brand_id").(string)
	brandID = strings.TrimSpace(brandID)
	if brandID == "" {
		return nil, nil, nil, false, fmt.Errorf("brand_id is missing in context")
	}

	schemaName := fmt.Sprintf("tenant_%s", brandID)
	if _, err := conn.Exec(ctx, fmt.Sprintf(`SET search_path TO "%s", public`, schemaName)); err != nil {
		return nil, nil, nil, false, fmt.Errorf("failed to set tenant search_path: %w", err)
	}

	if _, err := conn.Exec(ctx, "SET app.brand_id = $1", brandID); err != nil {
		return nil, nil, nil, false, fmt.Errorf("failed to set app.brand_id: %w", err)
	}

	if branchID, _ := ctx.Value("branch_id").(string); strings.TrimSpace(branchID) != "" {
		if _, err := conn.Exec(ctx, "SET app.branch_id = $1", strings.TrimSpace(branchID)); err != nil {
			return nil, nil, nil, false, fmt.Errorf("failed to set app.branch_id: %w", err)
		}
	}

	q := pg.New(conn.Conn())
	txCtx := repository.WithTenantQueries(ctx, q)

	return q, txCtx, nil, true, nil
}

// ─────────────────────────────────────────────
//  Create
// ─────────────────────────────────────────────

func (s *InventoryS) CreateInventory(ctx context.Context, req *model.CreateInventoryRequest) (*model.InventoryResponse, error) {
	id := uuid.New()

	storageID, err := uuid.Parse(req.StorageID)
	if err != nil {
		return nil, fmt.Errorf("invalid storage_id: %w", err)
	}

	date, err := parseDateYYYYMMDD(req.Date)
	if err != nil {
		return nil, fmt.Errorf("invalid date: %w", err)
	}

	countedAt, err := time.Parse(time.RFC3339, req.CountedAt)
	if err != nil {
		return nil, fmt.Errorf("invalid counted_at: %w", err)
	}

	descriptionI18n := pgtype.UUID{Valid: false}
	if req.DescriptionI18n != nil && *req.DescriptionI18n != "" {
		i18nID, err := uuid.Parse(*req.DescriptionI18n)
		if err != nil {
			return nil, fmt.Errorf("invalid description_i18n: %w", err)
		}
		descriptionI18n = pgtype.UUID{Bytes: i18nID, Valid: true}
	}

	status := "draft"
	if req.Status != nil && *req.Status != "" {
		status = *req.Status
	}
	if status == "deleted" {
		return nil, fmt.Errorf("cannot create inventory with status 'deleted'")
	}

	q, txCtx, tx, ownsTx, err := s.getTenantMutationQueries(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to get tenant queries: %w", err)
	}
	if ownsTx {
		defer tx.Rollback(ctx)
	}

	created, err := q.CreateInventory(txCtx, pg.CreateInventoryParams{
		ID:              id,
		Date:            pgtype.Date{Time: date, Valid: true},
		StorageID:       storageID,
		Description:     req.Description,
		DescriptionI18n: descriptionI18n,
		Status:          status,
		CountedAt:       countedAt,
	})
	if err != nil {
		if ownsTx {
			tx.Rollback(ctx)
		}
		return nil, fmt.Errorf("failed to create inventory: %w", err)
	}

	if ownsTx {
		if err := tx.Commit(ctx); err != nil {
			return nil, fmt.Errorf("failed to commit transaction: %w", err)
		}
	}

	return toInventoryResponse(created), nil
}
func (s *InventoryS) CreateInventoryBatch(ctx context.Context, req *model.CreateInventoryBatchRequest) (*model.CreateInventoryBatchResponse, error) {
	inv, err := s.CreateInventory(ctx, &model.CreateInventoryRequest{
		Date:            req.Date,
		CountedAt:       req.CountedAt,
		StorageID:       req.StorageID,
		Description:     req.Description,
		DescriptionI18n: req.DescriptionI18n,
		Status:          req.Status,
	})
	if err != nil {
		return nil, err
	}

	finalInv := inv

	if len(req.Items) > 0 {
		finalInv, err = s.ReplaceInventoryItems(ctx, inv.ID, &model.UpsertInventoryItemsRequest{
			Items: req.Items,
		})
		if err != nil {
			return nil, err
		}
	}

	return &model.CreateInventoryBatchResponse{
		Inventory: finalInv,
	}, nil
}

// ─────────────────────────────────────────────
//  Read
// ─────────────────────────────────────────────

func (s *InventoryS) GetInventoryByID(ctx context.Context, id string) (*model.InventoryResponse, error) {
	inventoryID, err := uuid.Parse(id)
	if err != nil {
		return nil, fmt.Errorf("invalid inventory id: %w", err)
	}

	q, txCtx, _, _, err := s.getTenantReadQueries(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to get tenant queries: %w", err)
	}

	inv, err := q.GetInventoryByID(txCtx, inventoryID)
	if err != nil {
		return nil, fmt.Errorf("failed to get inventory: %w", err)
	}

	return toInventoryResponse(inv), nil
}

func (s *InventoryS) GetInventoriesFiltered(ctx context.Context, dateFrom, dateTo *time.Time, storageID, ingredientID, status *string, search, sortBy, sortOrder string, limit, offset int32) (*model.PaginatedInventoriesResponse, error) {
	var fromDate pgtype.Date
	if dateFrom != nil {
		fromDate = pgtype.Date{Time: *dateFrom, Valid: true}
	}

	var toDate pgtype.Date
	if dateTo != nil {
		toDate = pgtype.Date{Time: *dateTo, Valid: true}
	}

	var storageUUID pgtype.UUID
	if storageID != nil && strings.TrimSpace(*storageID) != "" {
		id, err := uuid.Parse(*storageID)
		if err != nil {
			return nil, fmt.Errorf("invalid storage_id: %w", err)
		}
		storageUUID = pgtype.UUID{Bytes: id, Valid: true}
	}

	var ingredientUUID pgtype.UUID
	if ingredientID != nil && strings.TrimSpace(*ingredientID) != "" {
		id, err := uuid.Parse(*ingredientID)
		if err != nil {
			return nil, fmt.Errorf("invalid ingredient_id: %w", err)
		}
		ingredientUUID = pgtype.UUID{Bytes: id, Valid: true}
	}

	statusText := ""
	if status != nil {
		statusText = strings.TrimSpace(*status)
	}

	if sortBy == "" {
		sortBy = "date"
	}
	if sortOrder == "" {
		sortOrder = "desc"
	}

	q, txCtx, _, _, err := s.getTenantReadQueries(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to get tenant queries: %w", err)
	}

	total, err := q.CountInventoriesFiltered(txCtx, pg.CountInventoriesFilteredParams{
		DateFrom:     fromDate,
		DateTo:       toDate,
		StorageID:    storageUUID,
		Status:       statusText,
		IngredientID: ingredientUUID,
		Search:       search,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to count inventories: %w", err)
	}

	invs, err := q.GetInventoriesFiltered(txCtx, pg.GetInventoriesFilteredParams{
		DateFrom:     fromDate,
		DateTo:       toDate,
		StorageID:    storageUUID,
		Status:       statusText,
		IngredientID: ingredientUUID,
		Search:       search,
		SortBy:       sortBy,
		SortOrder:    sortOrder,
		Limit:        limit,
		Offset:       offset,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to get inventories: %w", err)
	}

	data := make([]*model.InventoryResponse, 0, len(invs))
	for _, inv := range invs {
		data = append(data, toInventoryResponse(inv))
	}

	totalPages := int32(0)
	if limit > 0 {
		totalPages = (int32(total) + limit - 1) / limit
	}

	return &model.PaginatedInventoriesResponse{
		Data: data,
		Pagination: model.PaginationMeta{
			Total:  int32(total),
			Limit:  limit,
			Offset: offset,
			Page: func() int32 {
				if limit > 0 {
					return (offset / limit) + 1
				}
				return 1
			}(),
			TotalPages: totalPages,
		},
	}, nil
}

func (s *InventoryS) GetAllInventoryItems(ctx context.Context, inventoryID *string, limit, offset int32) ([]*model.InventoryItemResponse, error) {
	q, txCtx, _, _, err := s.getTenantReadQueries(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to get tenant queries: %w", err)
	}

	if inventoryID != nil && *inventoryID != "" {
		invID, err := uuid.Parse(*inventoryID)
		if err != nil {
			return nil, fmt.Errorf("invalid inventory id: %w", err)
		}
		items, err := q.GetInventoryItemsByInventoryID(txCtx, pg.GetInventoryItemsByInventoryIDParams{
			InventoryID: invID,
			Limit:       limit,
			Offset:      offset,
		})
		if err != nil {
			return nil, fmt.Errorf("failed to get inventory items: %w", err)
		}
		resp := make([]*model.InventoryItemResponse, 0, len(items))
		for _, item := range items {
			resp = append(resp, toInventoryItemResponse(item))
		}
		return resp, nil
	}

	items, err := q.GetAllInventoryItems(txCtx, pg.GetAllInventoryItemsParams{Limit: limit, Offset: offset})
	if err != nil {
		return nil, fmt.Errorf("failed to get inventory items: %w", err)
	}
	resp := make([]*model.InventoryItemResponse, 0, len(items))
	for _, item := range items {
		resp = append(resp, toInventoryItemResponse(item))
	}
	return resp, nil
}

func (s *InventoryS) GetInventoryItems(ctx context.Context, inventoryID string) ([]*model.InventoryItemComputedResponse, error) {
	invID, err := uuid.Parse(inventoryID)
	if err != nil {
		return nil, fmt.Errorf("invalid inventory id: %w", err)
	}

	q, txCtx, _, _, err := s.getTenantReadQueries(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to get tenant queries: %w", err)
	}

	rows, err := q.GetInventoryItemsComputedAll(txCtx, invID)
	if err != nil {
		return nil, fmt.Errorf("failed to get inventory items: %w", err)
	}

	resp := make([]*model.InventoryItemComputedResponse, 0, len(rows))
	for _, row := range rows {
		resp = append(resp, toInventoryItemComputedResponse(row))
	}
	return resp, nil
}

// ─────────────────────────────────────────────
//  Update
// ─────────────────────────────────────────────

func (s *InventoryS) UpdateInventory(ctx context.Context, id string, req *model.UpdateInventoryRequest) (*model.InventoryResponse, error) {
	inventoryID, err := uuid.Parse(id)
	if err != nil {
		return nil, fmt.Errorf("invalid inventory id: %w", err)
	}

	q, txCtx, tx, ownsTx, err := s.getTenantMutationQueries(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to get tenant queries: %w", err)
	}
	if ownsTx {
		defer tx.Rollback(ctx)
	}

	// Lock the inventory row and read current status
	invForApply, err := q.GetInventoryForApply(txCtx, inventoryID)
	if err != nil {
		if ownsTx {
			tx.Rollback(ctx)
		}
		return nil, fmt.Errorf("inventory not found: %w", err)
	}

	if invForApply.Status == "deleted" {
		if ownsTx {
			tx.Rollback(ctx)
		}
		return nil, fmt.Errorf("cannot update a deleted inventory")
	}

	// Block changing status to "deleted" via update
	if req.Status != nil && *req.Status == "deleted" {
		if ownsTx {
			tx.Rollback(ctx)
		}
		return nil, fmt.Errorf("cannot set status to 'deleted'; use the DELETE endpoint instead")
	}

	// Get full inventory record for counted_at information
	invFull, err := q.GetInventoryByID(txCtx, inventoryID)
	if err != nil {
		if ownsTx {
			tx.Rollback(ctx)
		}
		return nil, fmt.Errorf("failed to get inventory: %w", err)
	}
	if err := assertCanMutateInventorySnapshot(txCtx, q, invFull.StorageID, inventoryID, invFull.CountedAt, "inventory"); err != nil {
		if ownsTx {
			tx.Rollback(ctx)
		}
		return nil, err
	}

	// Compute final counted_at BEFORE status transition to ensure consistency
	finalCountedAt := invFull.CountedAt
	if req.CountedAt != nil && *req.CountedAt != "" {
		ca, err := time.Parse(time.RFC3339, *req.CountedAt)
		if err != nil {
			if ownsTx {
				tx.Rollback(ctx)
			}
			return nil, fmt.Errorf("invalid counted_at: %w", err)
		}
		finalCountedAt = ca
	}

	// Validate counted_at change: active inventory cannot change counted_at
	if invForApply.Status == "active" && !isSameTime(invFull.CountedAt, finalCountedAt) {
		if ownsTx {
			tx.Rollback(ctx)
		}
		return nil, fmt.Errorf("cannot change counted_at for active inventory")
	}

	// Handle status transition with stock effects using FINAL counted_at
	if req.Status != nil && *req.Status != "" && *req.Status != invForApply.Status {
		newStatus := *req.Status
		storagePg := pgtype.UUID{Bytes: invForApply.StorageID, Valid: true}

		items, err := q.GetInventoryItemsByInventoryIDAll(txCtx, inventoryID)
		if err != nil {
			if ownsTx {
				tx.Rollback(ctx)
			}
			return nil, fmt.Errorf("failed to get inventory items: %w", err)
		}

		effectiveAt := pgtype.Timestamptz{Time: finalCountedAt, Valid: true}

		switch {
		case invForApply.Status == "draft" && newStatus == "active":
			if err := s.applyStockForItems(txCtx, inventoryID, invForApply.StorageID, storagePg, items, "draft_to_active", &effectiveAt); err != nil {
				if ownsTx {
					tx.Rollback(ctx)
				}
				return nil, err
			}
		case invForApply.Status == "active" && newStatus == "draft":
			if err := s.reverseStockForItems(txCtx, q, inventoryID, invForApply.StorageID, storagePg, items, "active_to_draft", &effectiveAt); err != nil {
				if ownsTx {
					tx.Rollback(ctx)
				}
				return nil, err
			}
		default:
			if ownsTx {
				tx.Rollback(ctx)
			}
			return nil, fmt.Errorf("invalid status transition: %s → %s", invForApply.Status, newStatus)
		}
	}

	existing, err := q.GetInventoryByID(txCtx, inventoryID)
	if err != nil {
		if ownsTx {
			tx.Rollback(ctx)
		}
		return nil, fmt.Errorf("failed to get inventory: %w", err)
	}

	finalDate := existing.Date
	if req.Date != nil && *req.Date != "" {
		d, err := parseDateYYYYMMDD(*req.Date)
		if err != nil {
			if ownsTx {
				tx.Rollback(ctx)
			}
			return nil, fmt.Errorf("invalid date: %w", err)
		}
		finalDate = pgtype.Date{Time: d, Valid: true}
	}

	finalStorageID := existing.StorageID
	if req.StorageID != nil && *req.StorageID != "" {
		sid, err := uuid.Parse(*req.StorageID)
		if err != nil {
			if ownsTx {
				tx.Rollback(ctx)
			}
			return nil, fmt.Errorf("invalid storage_id: %w", err)
		}
		finalStorageID = sid
	}

	finalDescription := existing.Description
	if req.Description != nil {
		finalDescription = req.Description
	}

	finalDescriptionI18n := existing.DescriptionI18n
	if req.DescriptionI18n != nil {
		if *req.DescriptionI18n == "" {
			finalDescriptionI18n = pgtype.UUID{Valid: false}
		} else {
			i18nID, err := uuid.Parse(*req.DescriptionI18n)
			if err != nil {
				if ownsTx {
					tx.Rollback(ctx)
				}
				return nil, fmt.Errorf("invalid description_i18n: %w", err)
			}
			finalDescriptionI18n = pgtype.UUID{Bytes: i18nID, Valid: true}
		}
	}

	finalStatus := existing.Status
	if req.Status != nil && *req.Status != "" {
		finalStatus = *req.Status
	}

	updated, err := q.UpdateInventory(txCtx, pg.UpdateInventoryParams{
		ID:              inventoryID,
		Date:            finalDate,
		StorageID:       finalStorageID,
		Description:     finalDescription,
		DescriptionI18n: finalDescriptionI18n,
		Status:          finalStatus,
		CountedAt:       finalCountedAt,
	})
	if err != nil {
		if ownsTx {
			tx.Rollback(ctx)
		}
		return nil, fmt.Errorf("failed to update inventory: %w", err)
	}

	if ownsTx {
		if err := tx.Commit(ctx); err != nil {
			return nil, fmt.Errorf("failed to commit transaction: %w", err)
		}
	}

	return toInventoryResponse(updated), nil
}

func (s *InventoryS) UpdateInventoryItem(ctx context.Context, inventoryItemID string, req *model.UpdateInventoryItemRequest) (*model.InventoryItemResponse, error) {
	itemID, err := uuid.Parse(inventoryItemID)
	if err != nil {
		return nil, fmt.Errorf("invalid inventory item id: %w", err)
	}

	q, txCtx, tx, ownsTx, err := s.getTenantMutationQueries(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to get tenant queries: %w", err)
	}
	if ownsTx {
		defer tx.Rollback(ctx)
	}

	item, err := q.GetInventoryItemByID(txCtx, itemID)
	if err != nil {
		if ownsTx {
			tx.Rollback(ctx)
		}
		return nil, fmt.Errorf("failed to get inventory item: %w", err)
	}

	invFull, err := q.GetInventoryByID(txCtx, item.InventoryID)
	if err != nil {
		if ownsTx {
			tx.Rollback(ctx)
		}
		return nil, fmt.Errorf("failed to get inventory details: %w", err)
	}

	if err := assertCanMutateInventorySnapshot(txCtx, q, invFull.StorageID, invFull.ID, invFull.CountedAt, "inventory item"); err != nil {
		if ownsTx {
			tx.Rollback(ctx)
		}
		return nil, err
	}

	qty := pgtype.Numeric{}
	if err := qty.Scan(req.CountedQuantity); err != nil {
		if ownsTx {
			tx.Rollback(ctx)
		}
		return nil, fmt.Errorf("invalid counted_quantity: %w", err)
	}

	updated, err := q.UpdateInventoryItem(txCtx, pg.UpdateInventoryItemParams{
		ID:              itemID,
		CountedQuantity: qty,
	})
	if err != nil {
		if ownsTx {
			tx.Rollback(ctx)
		}
		return nil, fmt.Errorf("failed to update inventory item: %w", err)
	}

	totals, err := q.CalculateInventoryTotals(txCtx, updated.InventoryID)
	if err != nil {
		if ownsTx {
			tx.Rollback(ctx)
		}
		return nil, fmt.Errorf("failed to calculate inventory totals: %w", err)
	}

	if _, err := q.UpdateInventoryAmounts(txCtx, pg.UpdateInventoryAmountsParams{
		ID:              updated.InventoryID,
		SurplusAmount:   totals.SurplusAmount,
		ShortageAmount:  totals.ShortageAmount,
		RemainingAmount: totals.RemainingAmount,
	}); err != nil {
		if ownsTx {
			tx.Rollback(ctx)
		}
		return nil, fmt.Errorf("failed to update inventory amounts: %w", err)
	}

	if ownsTx {
		if err := tx.Commit(ctx); err != nil {
			return nil, fmt.Errorf("failed to commit transaction: %w", err)
		}
	}

	return toInventoryItemResponse(updated), nil
}

// ─────────────────────────────────────────────
//  Items batch replace
// ─────────────────────────────────────────────

// ReplaceInventoryItems is a full-replace batch: items in the request are upserted,
// items currently in the inventory but absent from the request are deleted.
// Stock is applied/reversed depending on the inventory's current status.
func (s *InventoryS) ReplaceInventoryItems(ctx context.Context, inventoryID string, req *model.UpsertInventoryItemsRequest) (*model.InventoryResponse, error) {
	if inventoryID == "" {
		return nil, fmt.Errorf("inventory_id is required")
	}

	invID, err := uuid.Parse(inventoryID)
	if err != nil {
		return nil, fmt.Errorf("invalid inventory_id: %w", err)
	}

	q, txCtx, tx, ownsTx, err := s.getTenantMutationQueries(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to get tenant queries: %w", err)
	}
	if ownsTx {
		defer tx.Rollback(ctx)
	}

	inv, err := q.GetInventoryByID(txCtx, invID)
	if err != nil {
		if ownsTx {
			tx.Rollback(ctx)
		}
		if err == pgx.ErrNoRows {
			return nil, fmt.Errorf("inventory not found")
		}
		return nil, fmt.Errorf("failed to get inventory: %w", err)
	}
	if err := assertCanMutateInventorySnapshot(txCtx, q, inv.StorageID, invID, inv.CountedAt, "inventory items"); err != nil {
		if ownsTx {
			tx.Rollback(ctx)
		}
		return nil, err
	}

	// Replace endpoint uchun items authoritative list hisoblanadi.
	// Yangi listda yo'q itemlar delete qilinadi.
	items, err := q.GetInventoryItemsForProcessByInventoryID(txCtx, invID)
	if err != nil {
		if ownsTx {
			tx.Rollback(ctx)
		}
		return nil, fmt.Errorf("failed to get inventory items: %w", err)
	}

	existingByIngredient := make(map[uuid.UUID]pg.InventoryItemForProcess, len(items))
	for _, item := range items {
		existingByIngredient[item.IngredientID] = item
	}

	seen := make(map[uuid.UUID]struct{}, len(req.Items))
	isActive := inv.Status == "active"
	effectiveAt := pgtype.Timestamptz{Time: inv.CountedAt, Valid: true}
	zero := inventoryZeroNumeric()

	for i, input := range req.Items {
		if strings.TrimSpace(input.IngredientID) == "" {
			return nil, fmt.Errorf("items[%d]: ingredient_id is required", i)
		}

		ingID, err := uuid.Parse(strings.TrimSpace(input.IngredientID))
		if err != nil {
			return nil, fmt.Errorf("items[%d]: invalid ingredient_id: %w", i, err)
		}

		if _, ok := seen[ingID]; ok {
			return nil, fmt.Errorf("items[%d]: duplicate ingredient_id: %s", i, ingID.String())
		}
		seen[ingID] = struct{}{}

		newQty := pgtype.Numeric{}
		newQty.Valid = true

		if strings.TrimSpace(input.CountedQuantity) == "" {
			return nil, fmt.Errorf("items[%d]: counted_quantity is required", i)
		}

		if err := newQty.Scan(strings.TrimSpace(input.CountedQuantity)); err != nil {
			return nil, fmt.Errorf("items[%d]: invalid counted_quantity: %w", i, err)
		}
		existing, exists := existingByIngredient[ingID]

		// 1) Yangi item
		if !exists {
			inserted, err := q.InsertInventoryItemWithSystemQty(
				txCtx,
				uuid.New(),
				invID,
				ingID,
				newQty,
				zero,
			)
			if err != nil {
				if ownsTx {
					tx.Rollback(ctx)
				}
				return nil, fmt.Errorf("items[%d]: failed to insert inventory item: %w", i, err)
			}

			if !isActive {
				continue
			}

			refreshed, err := q.UpdateInventoryItemSystemQuantityFromMovements(txCtx, inserted.ID)
			if err != nil {
				if ownsTx {
					tx.Rollback(ctx)
				}
				return nil, fmt.Errorf("items[%d]: failed to refresh system_quantity: %w", i, err)
			}

			plan, err := buildInventoryTransitionPlan(
				refreshed.SystemQuantity,
				refreshed.CountedQuantity,
			)
			if err != nil {
				if ownsTx {
					tx.Rollback(ctx)
				}
				return nil, fmt.Errorf("items[%d]: failed to build inventory movement plan: %w", i, err)
			}

			if err := s.applyInventoryMovementPlan(
				txCtx,
				q,
				invID,
				inv.StorageID,
				ingID,
				plan,
				&effectiveAt,
			); err != nil {
				if ownsTx {
					tx.Rollback(ctx)
				}
				return nil, fmt.Errorf("items[%d]: failed to apply inventory movement plan: %w", i, err)
			}

			continue
		}

		// 2) Mavjud item update
		oldQty := existing.CountedQuantity

		if _, err := q.UpdateInventoryItemCountedQuantity(txCtx, existing.ID, newQty); err != nil {
			if ownsTx {
				tx.Rollback(ctx)
			}
			return nil, fmt.Errorf("items[%d]: failed to update counted quantity: %w", i, err)
		}

		// Draft inventory bo'lsa stockka tegmaymiz.
		if !isActive {
			continue
		}

		// Active inventory oldin ham apply bo'lgan.
		// Endi old counted -> new counted orasidagi farqni movement sifatida yozamiz.
		plan, err := buildInventoryTransitionPlan(oldQty, newQty)
		if err != nil {
			if ownsTx {
				tx.Rollback(ctx)
			}
			return nil, fmt.Errorf("items[%d]: failed to build inventory adjustment plan: %w", i, err)
		}

		if err := s.applyInventoryMovementPlan(
			txCtx,
			q,
			invID,
			inv.StorageID,
			ingID,
			plan,
			&effectiveAt,
		); err != nil {
			if ownsTx {
				tx.Rollback(ctx)
			}
			return nil, fmt.Errorf("items[%d]: failed to apply inventory adjustment plan: %w", i, err)
		}
	}

	// 3) Requestda yo'q bo'lib qolgan eski itemlar delete qilinadi.
	for _, item := range items {
		if _, ok := seen[item.IngredientID]; ok {
			continue
		}

		if isActive {
			// Active inventoryda delete bo'lsa old apply qilingan ta'sirni qaytaramiz:
			// counted -> system
			plan, err := buildInventoryTransitionPlan(item.CountedQuantity, item.SystemQuantity)
			if err != nil {
				if ownsTx {
					tx.Rollback(ctx)
				}
				return nil, fmt.Errorf("failed to build inventory delete reversal plan for ingredient %s: %w", item.IngredientID.String(), err)
			}

			if err := s.applyInventoryMovementPlan(
				txCtx,
				q,
				invID,
				inv.StorageID,
				item.IngredientID,
				plan,
				&effectiveAt,
			); err != nil {
				if ownsTx {
					tx.Rollback(ctx)
				}
				return nil, fmt.Errorf("failed to apply inventory delete reversal for ingredient %s: %w", item.IngredientID.String(), err)
			}
		}

		if err := q.DeleteInventoryItem(txCtx, item.ID); err != nil {
			if ownsTx {
				tx.Rollback(ctx)
			}
			return nil, fmt.Errorf("failed to delete inventory item %s: %w", item.ID.String(), err)
		}
	}

	if ownsTx {
		if err := tx.Commit(ctx); err != nil {
			return nil, fmt.Errorf("failed to commit transaction: %w", err)
		}
	}

	return s.GetInventoryByID(ctx, inventoryID)
}

// ─────────────────────────────────────────────
//  Delete
// ─────────────────────────────────────────────

// isLatestInventory checks if the given inventory is the latest (most recent) for its storage.
// Latest is determined by: date DESC, counted_at DESC, number DESC
func (s *InventoryS) isLatestInventory(ctx context.Context, q *pg.Queries, inventoryID uuid.UUID, storageID uuid.UUID) (bool, error) {
	// Get the latest inventory for this storage
	latestInventories, err := q.GetInventoriesByStorageID(ctx, pg.GetInventoriesByStorageIDParams{
		StorageID: storageID,
		Limit:     1,
		Offset:    0,
	})
	if err != nil {
		return false, fmt.Errorf("failed to get latest inventory: %w", err)
	}

	// If no inventories exist, this is trivially the latest
	if len(latestInventories) == 0 {
		return true, nil
	}

	// Check if the given inventory matches the latest
	return latestInventories[0].ID == inventoryID, nil
}

func (s *InventoryS) DeleteInventory(ctx context.Context, id string) error {
	inventoryID, err := uuid.Parse(id)
	if err != nil {
		return fmt.Errorf("%w: %v", ErrInventoryDeleteFailed, err)
	}

	q, txCtx, tx, ownsTx, err := s.getTenantMutationQueries(ctx)
	if err != nil {
		return fmt.Errorf("%w: %v", ErrInventoryDeleteFailed, err)
	}
	if ownsTx {
		defer tx.Rollback(ctx)
	}

	inv, err := q.GetInventoryForApply(txCtx, inventoryID)
	if err != nil {
		if ownsTx {
			tx.Rollback(ctx)
		}
		return fmt.Errorf("%w: %v", ErrInventoryNotFound, err)
	}
	if inv.Status == "deleted" {
		if ownsTx {
			tx.Rollback(ctx)
		}
		return ErrInventoryAlreadyDeleted
	}

	// Get full inventory record for date information
	invFull, err := q.GetInventoryByID(txCtx, inventoryID)
	if err != nil {
		if ownsTx {
			tx.Rollback(ctx)
		}
		return fmt.Errorf("%w: %v", ErrInventoryDeleteFailed, err)
	}
	if err := assertCanMutateInventorySnapshot(txCtx, q, inv.StorageID, inventoryID, invFull.CountedAt, "inventory"); err != nil {
		if ownsTx {
			tx.Rollback(ctx)
		}
		return fmt.Errorf("%w: %v", ErrInventoryDeleteFailed, err)
	}

	// Business rule: Only latest inventory can be deleted
	// Draft inventories can always be deleted (no stock impact)
	// Active/applied inventories must be the latest for their storage
	if inv.Status == "active" || inv.Status == "applied" {
		isLatest, err := s.isLatestInventory(txCtx, q, inventoryID, inv.StorageID)
		if err != nil {
			if ownsTx {
				tx.Rollback(ctx)
			}
			return fmt.Errorf("%w: %v", ErrInventoryLatestCheckFailed, err)
		}
		if !isLatest {
			if ownsTx {
				tx.Rollback(ctx)
			}
			return ErrInventoryDeleteOnlyLatest
		}
	}

	// If active or applied, reverse stock before deleting
	// Both statuses have stock impact and require rollback
	if inv.Status == "active" || inv.Status == "applied" {
		storagePg := pgtype.UUID{Bytes: inv.StorageID, Valid: true}
		items, err := q.GetInventoryItemsByInventoryIDAll(txCtx, inventoryID)
		if err != nil {
			if ownsTx {
				tx.Rollback(ctx)
			}
			return fmt.Errorf("%w: %v", ErrInventoryDeleteFailed, err)
		}
		effectiveAt := pgtype.Timestamptz{Time: invFull.CountedAt, Valid: true}
		if err := s.reverseStockForItems(txCtx, q, inventoryID, inv.StorageID, storagePg, items, "inventory_deleted", &effectiveAt); err != nil {
			if ownsTx {
				tx.Rollback(ctx)
			}
			return fmt.Errorf("%w: %v", ErrInventoryDeleteFailed, err)
		}
	}

	if err := q.DeleteInventory(txCtx, inventoryID); err != nil {
		if ownsTx {
			tx.Rollback(ctx)
		}
		return fmt.Errorf("%w: %v", ErrInventoryDeleteFailed, err)
	}

	if ownsTx {
		if err := tx.Commit(ctx); err != nil {
			return fmt.Errorf("%w: %v", ErrInventoryDeleteFailed, err)
		}
	}
	return nil
}

func (s *InventoryS) DeleteInventoriesBatch(ctx context.Context, ids []string) error {
	uuids := make([]uuid.UUID, 0, len(ids))
	for _, id := range ids {
		uid, err := uuid.Parse(id)
		if err != nil {
			return fmt.Errorf("invalid id %s: %w", id, err)
		}
		uuids = append(uuids, uid)
	}

	// Process each inventory individually to handle stock reversals
	for _, uid := range uuids {
		if err := s.DeleteInventory(ctx, uid.String()); err != nil {
			return fmt.Errorf("failed to delete inventory %s: %w", uid, err)
		}
	}
	return nil
}

func (s *InventoryS) DeleteInventoryItemsBatch(ctx context.Context, itemIDs []string) error {
	for _, id := range itemIDs {
		if err := s.DeleteInventoryItem(ctx, id); err != nil {
			return fmt.Errorf("failed to delete item %s: %w", id, err)
		}
	}
	return nil
}

func (s *InventoryS) DeleteInventoryItem(ctx context.Context, inventoryItemID string) error {
	itemID, err := uuid.Parse(inventoryItemID)
	if err != nil {
		return fmt.Errorf("invalid inventory item id: %w", err)
	}

	q, txCtx, tx, ownsTx, err := s.getTenantMutationQueries(ctx)
	if err != nil {
		return fmt.Errorf("failed to get tenant queries: %w", err)
	}
	if ownsTx {
		defer tx.Rollback(ctx)
	}

	item, err := q.GetInventoryItemByID(txCtx, itemID)
	if err != nil {
		if ownsTx {
			tx.Rollback(ctx)
		}
		return fmt.Errorf("failed to get inventory item: %w", err)
	}

	inv, err := q.GetInventoryForApply(txCtx, item.InventoryID)
	if err != nil {
		if ownsTx {
			tx.Rollback(ctx)
		}
		return fmt.Errorf("failed to get inventory: %w", err)
	}

	if inv.Status == "deleted" {
		if ownsTx {
			tx.Rollback(ctx)
		}
		return fmt.Errorf("cannot modify items of a deleted inventory")
	}

	// Get full inventory record for date information
	invFull, err := q.GetInventoryByID(txCtx, item.InventoryID)
	if err != nil {
		if ownsTx {
			tx.Rollback(ctx)
		}
		return fmt.Errorf("failed to get inventory details: %w", err)
	}

	if err := assertCanMutateInventorySnapshot(txCtx, q, inv.StorageID, item.InventoryID, invFull.CountedAt, "inventory item"); err != nil {
		if ownsTx {
			tx.Rollback(ctx)
		}
		return err
	}

	// Use counted_at for effective_at
	var invDate pgtype.Timestamptz
	if !invFull.CountedAt.IsZero() {
		invDate = pgtype.Timestamptz{Time: invFull.CountedAt, Valid: true}
	} else if invFull.Date.Valid {
		invDate = pgtype.Timestamptz{Time: invFull.Date.Time.In(time.UTC), Valid: true}
	}

	zero := pgtype.Numeric{}
	_ = zero.Scan("0")
	sourceType := "inventory"

	if inv.Status == "active" {
		storagePg := pgtype.UUID{Bytes: inv.StorageID, Valid: true}
		_, _ = q.EnsureIngredientStockByStorage(txCtx, pg.EnsureIngredientStockByStorageParams{
			ID:           uuid.New(),
			IngredientID: item.IngredientID,
			StorageID:    storagePg,
		})
		locked, err := q.GetStockByIngredientAndStorageForUpdate(txCtx, pg.GetStockByIngredientAndStorageForUpdateParams{
			IngredientID: item.IngredientID,
			StorageID:    storagePg,
		})
		if err != nil {
			if ownsTx {
				tx.Rollback(ctx)
			}
			return fmt.Errorf("failed to lock stock: %w", err)
		}
		delta := numericToFloat(item.CountedQuantity) - numericToFloat(item.SystemQuantity)
		if delta != 0 {
			reversedFloat := numericToFloat(locked.Quantity) - delta
			reversedQty := pgtype.Numeric{}
			_ = reversedQty.Scan(fmt.Sprintf("%.6f", reversedFloat))
			restored, err := q.UpdateIngredientStock(txCtx, pg.UpdateIngredientStockParams{
				ID:       locked.ID,
				Quantity: reversedQty,
			})
			if err != nil {
				if ownsTx {
					tx.Rollback(ctx)
				}
				return fmt.Errorf("failed to restore stock: %w", err)
			}
			srcID := inv.ID
			_ = q.InsertIngredientStockMovement(txCtx, pg.InsertIngredientStockMovementParams{
				ID: uuid.New(), StorageID: inv.StorageID, IngredientID: item.IngredientID,
				EventType: string(pg.InventoryItemDeleted), QtyIn: zero, QtyOut: zero,
				StockBefore: locked.Quantity, StockAfter: restored.Quantity,
				PricePerUnit: zero, SourceType: &sourceType, SourceID: &srcID,
				EffectiveAt: &invDate,
			})
		}
	}

	if err := q.DeleteInventoryItem(txCtx, itemID); err != nil {
		if ownsTx {
			tx.Rollback(ctx)
		}
		return fmt.Errorf("failed to delete inventory item: %w", err)
	}

	totals, err := q.CalculateInventoryTotals(txCtx, item.InventoryID)
	if err != nil {
		if ownsTx {
			tx.Rollback(ctx)
		}
		return fmt.Errorf("failed to calculate inventory totals: %w", err)
	}
	if _, err := q.UpdateInventoryAmounts(txCtx, pg.UpdateInventoryAmountsParams{
		ID:              item.InventoryID,
		SurplusAmount:   totals.SurplusAmount,
		ShortageAmount:  totals.ShortageAmount,
		RemainingAmount: totals.RemainingAmount,
	}); err != nil {
		if ownsTx {
			tx.Rollback(ctx)
		}
		return fmt.Errorf("failed to update inventory amounts: %w", err)
	}

	if ownsTx {
		if err := tx.Commit(ctx); err != nil {
			return fmt.Errorf("failed to commit transaction: %w", err)
		}
	}

	return nil
}

// ─────────────────────────────────────────────
//  Misc
// ─────────────────────────────────────────────

func (s *InventoryS) CalculateInventory(ctx context.Context, inventoryID string) (*model.InventoryResponse, error) {
	invID, err := uuid.Parse(inventoryID)
	if err != nil {
		return nil, fmt.Errorf("invalid inventory id: %w", err)
	}

	q, txCtx, tx, ownsTx, err := s.getTenantMutationQueries(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to get tenant queries: %w", err)
	}
	if ownsTx {
		defer tx.Rollback(ctx)
	}

	totals, err := q.CalculateInventoryTotals(txCtx, invID)
	if err != nil {
		if ownsTx {
			tx.Rollback(ctx)
		}
		return nil, fmt.Errorf("failed to calculate inventory totals: %w", err)
	}

	updated, err := q.UpdateInventoryAmounts(txCtx, pg.UpdateInventoryAmountsParams{
		ID:              invID,
		SurplusAmount:   totals.SurplusAmount,
		ShortageAmount:  totals.ShortageAmount,
		RemainingAmount: totals.RemainingAmount,
	})
	if err != nil {
		if ownsTx {
			tx.Rollback(ctx)
		}
		return nil, fmt.Errorf("failed to update inventory amounts: %w", err)
	}

	if ownsTx {
		if err := tx.Commit(ctx); err != nil {
			return nil, fmt.Errorf("failed to commit transaction: %w", err)
		}
	}

	return toInventoryResponse(updated), nil
}

func (s *InventoryS) RestoreInventory(ctx context.Context, id string) (*model.InventoryResponse, error) {
	inventoryID, err := uuid.Parse(id)
	if err != nil {
		return nil, fmt.Errorf("invalid inventory id: %w", err)
	}

	q, txCtx, tx, ownsTx, err := s.getTenantMutationQueries(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to get tenant queries: %w", err)
	}
	if ownsTx {
		defer tx.Rollback(ctx)
	}

	inv, err := q.RestoreInventory(txCtx, inventoryID)
	if err != nil {
		if ownsTx {
			tx.Rollback(ctx)
		}
		return nil, fmt.Errorf("failed to restore inventory: %w", err)
	}

	if ownsTx {
		if err := tx.Commit(ctx); err != nil {
			return nil, fmt.Errorf("failed to commit transaction: %w", err)
		}
	}

	return toInventoryResponse(inv), nil
}

// UpsertInventoryItems is kept for backwards compatibility; delegates to ReplaceInventoryItems.
func (s *InventoryS) UpsertInventoryItems(ctx context.Context, inventoryID string, req *model.UpsertInventoryItemsRequest) (*model.InventoryResponse, error) {
	return s.ReplaceInventoryItems(ctx, inventoryID, req)
}

// ─────────────────────────────────────────────
//  Stock helpers
// ─────────────────────────────────────────────

// applyStockForItems refreshes each item's system_quantity to current stock then sets stock = counted.
// Used when transitioning draft → active.
func (s *InventoryS) applyStockForItems(ctx context.Context, invID uuid.UUID, storageID uuid.UUID, storagePg pgtype.UUID, items []pg.InventoryItemForProcess, eventType string, effectiveAt *pgtype.Timestamptz) error {
	q, txCtx, tx, ownsTx, err := s.getTenantMutationQueries(ctx)
	if err != nil {
		return fmt.Errorf("failed to get tenant queries: %w", err)
	}
	if ownsTx {
		defer tx.Rollback(ctx)
	}

	zero := pgtype.Numeric{}
	_ = zero.Scan("0")
	sourceType := "inventory"

	for _, item := range items {
		// Refresh system_quantity to point-in-time stock at inventory date
		refreshed, err := q.UpdateInventoryItemSystemQuantityFromMovements(txCtx, item.ID)
		if err != nil {
			if ownsTx {
				tx.Rollback(ctx)
			}
			return fmt.Errorf("failed to refresh system_quantity: %w", err)
		}

		_, _ = q.EnsureIngredientStockByStorage(txCtx, pg.EnsureIngredientStockByStorageParams{
			ID:           uuid.New(),
			IngredientID: item.IngredientID,
			StorageID:    storagePg,
		})
		locked, err := q.GetStockByIngredientAndStorageForUpdate(txCtx, pg.GetStockByIngredientAndStorageForUpdateParams{
			IngredientID: item.IngredientID,
			StorageID:    storagePg,
		})
		if err != nil {
			if ownsTx {
				tx.Rollback(ctx)
			}
			return fmt.Errorf("failed to lock stock: %w", err)
		}

		delta := numericToFloat(refreshed.CountedQuantity) - numericToFloat(refreshed.SystemQuantity)
		if delta != 0 {
			updated, err := q.UpdateIngredientStock(txCtx, pg.UpdateIngredientStockParams{
				ID:       locked.ID,
				Quantity: refreshed.CountedQuantity,
			})
			if err != nil {
				if ownsTx {
					tx.Rollback(ctx)
				}
				return fmt.Errorf("failed to apply stock: %w", err)
			}
			ev := pg.InventorySurplusIn
			deltaQty := pgtype.Numeric{}
			srcID := invID
			if delta > 0 {
				_ = deltaQty.Scan(fmt.Sprintf("%.6f", delta))
				_ = q.InsertIngredientStockMovement(txCtx, pg.InsertIngredientStockMovementParams{
					ID: uuid.New(), StorageID: storageID, IngredientID: item.IngredientID,
					EventType: string(ev), QtyIn: deltaQty, QtyOut: zero,
					StockBefore: locked.Quantity, StockAfter: updated.Quantity,
					PricePerUnit: zero, SourceType: &sourceType, SourceID: &srcID,
					EffectiveAt: effectiveAt,
				})
			} else {
				ev = pg.InventoryShortageOut
				_ = deltaQty.Scan(fmt.Sprintf("%.6f", -delta))
				_ = q.InsertIngredientStockMovement(txCtx, pg.InsertIngredientStockMovementParams{
					ID: uuid.New(), StorageID: storageID, IngredientID: item.IngredientID,
					EventType: string(ev), QtyIn: zero, QtyOut: deltaQty,
					StockBefore: locked.Quantity, StockAfter: updated.Quantity,
					PricePerUnit: zero, SourceType: &sourceType, SourceID: &srcID,
					EffectiveAt: effectiveAt,
				})
			}
		}
	}

	if ownsTx {
		if err := tx.Commit(ctx); err != nil {
			return fmt.Errorf("failed to commit transaction: %w", err)
		}
	}
	return nil
}

// reverseStockForItems reverses the delta (counted - system_quantity) for each item.
// Used when transitioning active → draft or deleting an active inventory.
// This function expects to be called within an existing transaction context.
// It accepts the tenant queries and transaction context from the caller to ensure
// atomicity with the parent operation.
func (s *InventoryS) reverseStockForItems(txCtx context.Context, q *pg.Queries, invID uuid.UUID, storageID uuid.UUID, storagePg pgtype.UUID, items []pg.InventoryItemForProcess, eventType string, effectiveAt *pgtype.Timestamptz) error {
	for _, item := range items {
		plan, err := buildInventoryTransitionPlan(item.CountedQuantity, item.SystemQuantity)
		if err != nil {
			return fmt.Errorf("failed to build inventory reverse plan: %w", err)
		}

		if err := s.applyInventoryMovementPlan(txCtx, q, invID, storageID, item.IngredientID, plan, effectiveAt); err != nil {
			return err
		}
	}

	return nil
}

// ─────────────────────────────────────────────
//  Helpers / converters
// ─────────────────────────────────────────────

func numericToFloat(n pgtype.Numeric) float64 {
	if !n.Valid {
		return 0
	}
	f, _ := n.Float64Value()
	return f.Float64
}

func parseDateYYYYMMDD(s string) (time.Time, error) {
	return time.Parse("2006-01-02", s)
}

func dateToTime(d pgtype.Date) *time.Time {
	if !d.Valid {
		return nil
	}
	t := d.Time
	return &t
}

// isSameTime compares two time.Time values for equality with UTC normalization
func isSameTime(a, b time.Time) bool {
	return a.UTC().Equal(b.UTC())
}

func toInventoryResponse(inv any) *model.InventoryResponse {
	var (
		id              uuid.UUID
		number          int64
		date            pgtype.Date
		countedAt       time.Time
		storageID       uuid.UUID
		description     *string
		descriptionI18n pgtype.UUID
		status          string
		surplusAmount   pgtype.Numeric
		shortageAmount  pgtype.Numeric
		remainingAmount pgtype.Numeric
		createdAt       pgtype.Timestamptz
		updatedAt       pgtype.Timestamptz
		deletedAt       int64
	)

	switch row := inv.(type) {
	case pg.Inventory:
		id, number, date, countedAt, storageID = row.ID, row.Number, row.Date, row.CountedAt, row.StorageID
		description, descriptionI18n, status = row.Description, row.DescriptionI18n, row.Status
		surplusAmount, shortageAmount, remainingAmount = row.SurplusAmount, row.ShortageAmount, row.RemainingAmount
		createdAt, updatedAt, deletedAt = row.CreatedAt, row.UpdatedAt, row.DeletedAt
	case pg.CreateInventoryRow:
		id, number, date, countedAt, storageID = row.ID, row.Number, row.Date, row.CountedAt, row.StorageID
		description, descriptionI18n, status = row.Description, row.DescriptionI18n, row.Status
		surplusAmount, shortageAmount, remainingAmount = row.SurplusAmount, row.ShortageAmount, row.RemainingAmount
		createdAt, updatedAt = row.CreatedAt, row.UpdatedAt
	case pg.GetInventoryByIDRow:
		id, number, date, countedAt, storageID = row.ID, row.Number, row.Date, row.CountedAt, row.StorageID
		description, descriptionI18n, status = row.Description, row.DescriptionI18n, row.Status
		surplusAmount, shortageAmount, remainingAmount = row.SurplusAmount, row.ShortageAmount, row.RemainingAmount
		createdAt, updatedAt = row.CreatedAt, row.UpdatedAt
	case pg.GetAllInventoriesRow:
		id, number, date, countedAt, storageID = row.ID, row.Number, row.Date, row.CountedAt, row.StorageID
		description, descriptionI18n, status = row.Description, row.DescriptionI18n, row.Status
		surplusAmount, shortageAmount, remainingAmount = row.SurplusAmount, row.ShortageAmount, row.RemainingAmount
		createdAt, updatedAt, deletedAt = row.CreatedAt, row.UpdatedAt, row.DeletedAt
	case pg.GetInventoriesFilteredRow:
		id, number, date, countedAt, storageID = row.ID, row.Number, row.Date, row.CountedAt, row.StorageID
		description, descriptionI18n, status = row.Description, row.DescriptionI18n, row.Status
		surplusAmount, shortageAmount, remainingAmount = row.SurplusAmount, row.ShortageAmount, row.RemainingAmount
		createdAt, updatedAt, deletedAt = row.CreatedAt, row.UpdatedAt, row.DeletedAt
	case pg.UpdateInventoryRow:
		id, number, date, countedAt, storageID = row.ID, row.Number, row.Date, row.CountedAt, row.StorageID
		description, descriptionI18n, status = row.Description, row.DescriptionI18n, row.Status
		surplusAmount, shortageAmount, remainingAmount = row.SurplusAmount, row.ShortageAmount, row.RemainingAmount
		createdAt, updatedAt = row.CreatedAt, row.UpdatedAt
	case pg.UpdateInventoryAmountsRow:
		id, number, date, countedAt, storageID = row.ID, row.Number, row.Date, row.CountedAt, row.StorageID
		description, descriptionI18n, status = row.Description, row.DescriptionI18n, row.Status
		surplusAmount, shortageAmount, remainingAmount = row.SurplusAmount, row.ShortageAmount, row.RemainingAmount
		createdAt, updatedAt = row.CreatedAt, row.UpdatedAt
	case pg.RestoreInventoryRow:
		id, number, date, countedAt, storageID = row.ID, row.Number, row.Date, row.CountedAt, row.StorageID
		description, descriptionI18n, status = row.Description, row.DescriptionI18n, row.Status
		surplusAmount, shortageAmount, remainingAmount = row.SurplusAmount, row.ShortageAmount, row.RemainingAmount
		createdAt, updatedAt = row.CreatedAt, row.UpdatedAt
	default:
		return nil
	}

	if deletedAt > 0 {
		status = "deleted"
	}

	resp := &model.InventoryResponse{
		ID:              id.String(),
		Number:          number,
		StorageID:       storageID.String(),
		Description:     description,
		Status:          model.InventoryStatus(status),
		SurplusAmount:   numericToString(surplusAmount),
		ShortageAmount:  numericToString(shortageAmount),
		RemainingAmount: numericToString(remainingAmount),
	}
	resp.Date = dateToTime(date)
	if !countedAt.IsZero() {
		resp.CountedAt = &countedAt
	}
	resp.CreatedAt = timestampToTime(createdAt)
	resp.UpdatedAt = timestampToTime(updatedAt)

	if descriptionI18n.Valid {
		str := descriptionI18n.String()
		resp.DescriptionI18n = &str
	}

	return resp
}

func toInventoryItemComputedResponse(row pg.GetInventoryItemsComputedAllRow) *model.InventoryItemComputedResponse {
	var inventoryItemID *string
	if row.InventoryItemID != uuid.Nil {
		id := row.InventoryItemID.String()
		inventoryItemID = &id
	}
	return &model.InventoryItemComputedResponse{
		InventoryItemID:       inventoryItemID,
		InventoryID:           row.InventoryID.String(),
		IngredientID:          row.IngredientID.String(),
		IngredientName:        row.IngredientName,
		IngredientMeasurement: toMeasurementTypeString(row.IngredientMeasurement),
		IngredientPictureUrl:  row.IngredientPictureUrl,
		IngredientColorCode:   row.IngredientColorCode,
		SystemQuantity:        anyNumericToStr(row.SystemQuantity),
		CountedQuantity:       anyNumericToStr(row.CountedQuantity),
		DifferenceQuantity:    anyNumericToStr(row.DifferenceQuantity),
		PricePerUnit:          numericToString(row.PricePerUnit),
		SurplusAmount:         numericToString(row.SurplusAmount),
		ShortageAmount:        numericToString(row.ShortageAmount),
		RemainingAmount:       numericToString(row.RemainingAmount),
	}
}

func toInventoryItemResponse(row any) *model.InventoryItemResponse {
	var (
		id              uuid.UUID
		inventoryID     uuid.UUID
		ingredientID    uuid.UUID
		countedQuantity pgtype.Numeric
		createdAt       pgtype.Timestamptz
		updatedAt       pgtype.Timestamptz
	)

	switch r := row.(type) {
	case pg.InventoryItem:
		id, inventoryID, ingredientID = r.ID, r.InventoryID, r.IngredientID
		countedQuantity, createdAt, updatedAt = r.CountedQuantity, r.CreatedAt, r.UpdatedAt
	case pg.GetAllInventoryItemsRow:
		id, inventoryID, ingredientID = r.ID, r.InventoryID, r.IngredientID
		countedQuantity, createdAt, updatedAt = r.CountedQuantity, r.CreatedAt, r.UpdatedAt
	case pg.GetInventoryItemsByInventoryIDRow:
		id, inventoryID, ingredientID = r.ID, r.InventoryID, r.IngredientID
		countedQuantity, createdAt, updatedAt = r.CountedQuantity, r.CreatedAt, r.UpdatedAt
	case pg.UpdateInventoryItemRow:
		id, inventoryID, ingredientID = r.ID, r.InventoryID, r.IngredientID
		countedQuantity, createdAt, updatedAt = r.CountedQuantity, r.CreatedAt, r.UpdatedAt
	default:
		return nil
	}

	resp := &model.InventoryItemResponse{
		ID:              id.String(),
		InventoryID:     inventoryID.String(),
		IngredientID:    ingredientID.String(),
		CountedQuantity: numericToString(countedQuantity),
	}
	resp.CreatedAt = timestampToTime(createdAt)
	resp.UpdatedAt = timestampToTime(updatedAt)
	return resp
}
