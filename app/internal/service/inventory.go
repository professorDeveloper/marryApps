package service

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
	"gitlab.yurtal.tech/company/maryai/back/internal/model"
	"gitlab.yurtal.tech/company/maryai/back/internal/repository"
	pg "gitlab.yurtal.tech/company/maryai/back/internal/repository/pg/tenantsdb"
)

type InventoryS struct {
	repo *repository.Repository
}

func NewInventoryS(repo *repository.Repository) *InventoryS {
	return &InventoryS{repo: repo}
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

	created, err := s.repo.Tenant(ctx).CreateInventory(ctx, pg.CreateInventoryParams{
		ID:              id,
		Date:            pgtype.Date{Time: date, Valid: true},
		StorageID:       storageID,
		Description:     req.Description,
		DescriptionI18n: descriptionI18n,
		Status:          status,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to create inventory: %w", err)
	}

	return toInventoryResponse(created), nil
}

func (s *InventoryS) CreateInventoryBatch(ctx context.Context, req *model.CreateInventoryBatchRequest) (*model.CreateInventoryBatchResponse, error) {
	inv, err := s.CreateInventory(ctx, &model.CreateInventoryRequest{
		Date:            req.Date,
		StorageID:       req.StorageID,
		Description:     req.Description,
		DescriptionI18n: req.DescriptionI18n,
		Status:          req.Status,
	})
	if err != nil {
		return nil, err
	}

	items, err := s.ReplaceInventoryItems(ctx, inv.ID, &model.UpsertInventoryItemsRequest{
		Items: req.Items,
	})
	if err != nil {
		return nil, err
	}

	return &model.CreateInventoryBatchResponse{
		Inventory: inv,
		Items:     items,
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

	inv, err := s.repo.Tenant(ctx).GetInventoryByID(ctx, inventoryID)
	if err != nil {
		return nil, fmt.Errorf("failed to get inventory: %w", err)
	}

	return toInventoryResponse(inv), nil
}

func (s *InventoryS) GetAllInventories(ctx context.Context, limit, offset int32) ([]*model.InventoryResponse, error) {
	invs, err := s.repo.Tenant(ctx).GetAllInventories(ctx, pg.GetAllInventoriesParams{Limit: limit, Offset: offset})
	if err != nil {
		return nil, fmt.Errorf("failed to get inventories: %w", err)
	}

	resp := make([]*model.InventoryResponse, 0, len(invs))
	for _, inv := range invs {
		resp = append(resp, toInventoryResponse(inv))
	}
	return resp, nil
}

func (s *InventoryS) GetInventoriesFiltered(ctx context.Context, dateFrom, dateTo *time.Time, storageID, ingredientID, status *string, limit, offset int32) (*model.PaginatedInventoriesResponse, error) {
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

	countParams := pg.CountInventoriesFilteredParams{
		DateFrom:     fromDate,
		DateTo:       toDate,
		StorageID:    uuid.UUID(storageUUID.Bytes),
		Status:       statusText,
		IngredientID: uuid.UUID(ingredientUUID.Bytes),
	}
	total, err := s.repo.Tenant(ctx).CountInventoriesFiltered(ctx, countParams)
	if err != nil {
		return nil, fmt.Errorf("failed to count inventories: %w", err)
	}

	invs, err := s.repo.Tenant(ctx).GetInventoriesFiltered(ctx, pg.GetInventoriesFilteredParams{
		Column1: fromDate,
		Column2: toDate,
		Column3: storageUUID.Bytes,
		Column4: statusText,
		Column5: ingredientUUID.Bytes,
		Limit:   limit,
		Offset:  offset,
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
			Total:      int32(total),
			Limit:      limit,
			Offset:     offset,
			TotalPages: totalPages,
		},
	}, nil
}

func (s *InventoryS) GetAllInventoryItems(ctx context.Context, inventoryID *string, limit, offset int32) ([]*model.InventoryItemResponse, error) {
	if inventoryID != nil && *inventoryID != "" {
		invID, err := uuid.Parse(*inventoryID)
		if err != nil {
			return nil, fmt.Errorf("invalid inventory id: %w", err)
		}
		items, err := s.repo.Tenant(ctx).GetInventoryItemsByInventoryID(ctx, pg.GetInventoryItemsByInventoryIDParams{
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

	items, err := s.repo.Tenant(ctx).GetAllInventoryItems(ctx, pg.GetAllInventoryItemsParams{Limit: limit, Offset: offset})
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

	rows, err := s.repo.Tenant(ctx).GetInventoryItemsComputedAll(ctx, invID)
	if err != nil {
		return nil, fmt.Errorf("failed to get inventory items: %w", err)
	}

	resp := make([]*model.InventoryItemComputedResponse, 0, len(rows))
	for _, row := range rows {
		resp = append(resp, toInventoryItemComputedResponse(row))
	}
	return resp, nil
}

func (s *InventoryS) SearchInventories(ctx context.Context, query string, limit, offset int32) ([]*model.InventoryResponse, error) {
	q := query
	invs, err := s.repo.Tenant(ctx).SearchInventories(ctx, pg.SearchInventoriesParams{Column1: &q, Limit: limit, Offset: offset})
	if err != nil {
		return nil, fmt.Errorf("failed to search inventories: %w", err)
	}

	resp := make([]*model.InventoryResponse, 0, len(invs))
	for _, inv := range invs {
		resp = append(resp, toInventoryResponse(inv))
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

	// Lock the inventory row and read current status
	inv, err := s.repo.Tenant(ctx).GetInventoryForApply(ctx, inventoryID)
	if err != nil {
		return nil, fmt.Errorf("inventory not found: %w", err)
	}

	if inv.Status == "deleted" {
		return nil, fmt.Errorf("cannot update a deleted inventory")
	}

	// Block changing status to "deleted" via update
	if req.Status != nil && *req.Status == "deleted" {
		return nil, fmt.Errorf("cannot set status to 'deleted'; use the DELETE endpoint instead")
	}

	// Handle status transition with stock effects
	if req.Status != nil && *req.Status != "" && *req.Status != inv.Status {
		newStatus := *req.Status
		storagePg := pgtype.UUID{Bytes: inv.StorageID, Valid: true}

		items, err := s.repo.Tenant(ctx).GetInventoryItemsByInventoryIDAll(ctx, inventoryID)
		if err != nil {
			return nil, fmt.Errorf("failed to get inventory items: %w", err)
		}

		switch {
		case inv.Status == "draft" && newStatus == "active":
			if err := s.applyStockForItems(ctx, inventoryID, inv.StorageID, storagePg, items, "draft_to_active"); err != nil {
				return nil, err
			}
		case inv.Status == "active" && newStatus == "draft":
			if err := s.reverseStockForItems(ctx, inventoryID, inv.StorageID, storagePg, items, "active_to_draft"); err != nil {
				return nil, err
			}
		default:
			return nil, fmt.Errorf("invalid status transition: %s → %s", inv.Status, newStatus)
		}
	}

	existing, err := s.repo.Tenant(ctx).GetInventoryByID(ctx, inventoryID)
	if err != nil {
		return nil, fmt.Errorf("failed to get inventory: %w", err)
	}

	finalDate := existing.Date
	if req.Date != nil && *req.Date != "" {
		d, err := parseDateYYYYMMDD(*req.Date)
		if err != nil {
			return nil, fmt.Errorf("invalid date: %w", err)
		}
		finalDate = pgtype.Date{Time: d, Valid: true}
	}

	finalStorageID := existing.StorageID
	if req.StorageID != nil && *req.StorageID != "" {
		sid, err := uuid.Parse(*req.StorageID)
		if err != nil {
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
				return nil, fmt.Errorf("invalid description_i18n: %w", err)
			}
			finalDescriptionI18n = pgtype.UUID{Bytes: i18nID, Valid: true}
		}
	}

	finalStatus := existing.Status
	if req.Status != nil && *req.Status != "" {
		finalStatus = *req.Status
	}

	updated, err := s.repo.Tenant(ctx).UpdateInventory(ctx, pg.UpdateInventoryParams{
		ID:              inventoryID,
		Date:            finalDate,
		StorageID:       finalStorageID,
		Description:     finalDescription,
		DescriptionI18n: finalDescriptionI18n,
		Status:          finalStatus,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to update inventory: %w", err)
	}

	return toInventoryResponse(updated), nil
}

func (s *InventoryS) UpdateInventoryItem(ctx context.Context, inventoryItemID string, req *model.UpdateInventoryItemRequest) (*model.InventoryItemResponse, error) {
	itemID, err := uuid.Parse(inventoryItemID)
	if err != nil {
		return nil, fmt.Errorf("invalid inventory item id: %w", err)
	}

	qty := pgtype.Numeric{}
	if err := qty.Scan(req.CountedQuantity); err != nil {
		return nil, fmt.Errorf("invalid counted_quantity: %w", err)
	}

	updated, err := s.repo.Tenant(ctx).UpdateInventoryItem(ctx, pg.UpdateInventoryItemParams{
		ID:              itemID,
		CountedQuantity: qty,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to update inventory item: %w", err)
	}

	totals, err := s.repo.Tenant(ctx).CalculateInventoryTotals(ctx, updated.InventoryID)
	if err != nil {
		return nil, fmt.Errorf("failed to calculate inventory totals: %w", err)
	}

	if _, err := s.repo.Tenant(ctx).UpdateInventoryAmounts(ctx, pg.UpdateInventoryAmountsParams{
		ID:              updated.InventoryID,
		SurplusAmount:   totals.SurplusAmount,
		ShortageAmount:  totals.ShortageAmount,
		RemainingAmount: totals.RemainingAmount,
	}); err != nil {
		return nil, fmt.Errorf("failed to update inventory amounts: %w", err)
	}

	return toInventoryItemResponse(updated), nil
}

// ─────────────────────────────────────────────
//  Items batch replace
// ─────────────────────────────────────────────

// ReplaceInventoryItems is a full-replace batch: items in the request are upserted,
// items currently in the inventory but absent from the request are deleted.
// Stock is applied/reversed depending on the inventory's current status.
func (s *InventoryS) ReplaceInventoryItems(ctx context.Context, inventoryID string, req *model.UpsertInventoryItemsRequest) ([]*model.InventoryItemComputedResponse, error) {
	invID, err := uuid.Parse(inventoryID)
	if err != nil {
		return nil, fmt.Errorf("invalid inventory id: %w", err)
	}

	inv, err := s.repo.Tenant(ctx).GetInventoryForApply(ctx, invID)
	if err != nil {
		return nil, fmt.Errorf("inventory not found: %w", err)
	}
	if inv.Status == "deleted" {
		return nil, fmt.Errorf("cannot edit a deleted inventory")
	}

	// Determine old/new status for stock transition
	oldStatus := inv.Status
	newStatus := oldStatus
	if req.Status != nil && *req.Status != "" {
		if *req.Status == "deleted" {
			return nil, fmt.Errorf("cannot set status to 'deleted'; use the DELETE endpoint")
		}
		if *req.Status != oldStatus {
			if !((oldStatus == "draft" && *req.Status == "active") || (oldStatus == "active" && *req.Status == "draft")) {
				return nil, fmt.Errorf("invalid status transition: %s → %s", oldStatus, *req.Status)
			}
			newStatus = *req.Status
		}
	}

	storagePg := pgtype.UUID{Bytes: inv.StorageID, Valid: true}
	if req.StorageID != nil && *req.StorageID != "" {
		sid, err := uuid.Parse(*req.StorageID)
		if err != nil {
			return nil, fmt.Errorf("invalid storage_id: %w", err)
		}
		storagePg = pgtype.UUID{Bytes: sid, Valid: true}
	}

	zero := pgtype.Numeric{}
	_ = zero.Scan("0")
	sourceType := "inventory"

	// Build map of currently existing items keyed by ingredient_id
	existingItems, err := s.repo.Tenant(ctx).GetInventoryItemsByInventoryIDAll(ctx, invID)
	if err != nil {
		return nil, fmt.Errorf("failed to load existing items: %w", err)
	}
	existingMap := make(map[uuid.UUID]pg.InventoryItemForProcess, len(existingItems))
	for _, item := range existingItems {
		existingMap[item.IngredientID] = item
	}

	// If transitioning active→draft, reverse all existing items' stock before processing
	if oldStatus == "active" && newStatus == "draft" {
		if err := s.reverseStockForItems(ctx, invID, inv.StorageID, pgtype.UUID{Bytes: inv.StorageID, Valid: true}, existingItems, "active_to_draft"); err != nil {
			return nil, err
		}
	}

	// Update inventory-level fields if any are provided (status, date, storage_id, description)
	if req.Status != nil || req.Date != nil || req.StorageID != nil || req.Description != nil || req.DescriptionI18n != nil {
		existing, err := s.repo.Tenant(ctx).GetInventoryByID(ctx, invID)
		if err != nil {
			return nil, fmt.Errorf("failed to get inventory: %w", err)
		}
		finalDate := existing.Date
		if req.Date != nil && *req.Date != "" {
			d, err := parseDateYYYYMMDD(*req.Date)
			if err != nil {
				return nil, fmt.Errorf("invalid date: %w", err)
			}
			finalDate = pgtype.Date{Time: d, Valid: true}
		}
		finalStorageID := existing.StorageID
		if req.StorageID != nil && *req.StorageID != "" {
			sid, err := uuid.Parse(*req.StorageID)
			if err != nil {
				return nil, fmt.Errorf("invalid storage_id: %w", err)
			}
			finalStorageID = sid
		}
		finalDescription := existing.Description
		if req.Description != nil {
			finalDescription = req.Description
		}
		finalDescI18n := existing.DescriptionI18n
		if req.DescriptionI18n != nil {
			if *req.DescriptionI18n == "" {
				finalDescI18n = pgtype.UUID{Valid: false}
			} else {
				i18nID, err := uuid.Parse(*req.DescriptionI18n)
				if err != nil {
					return nil, fmt.Errorf("invalid description_i18n: %w", err)
				}
				finalDescI18n = pgtype.UUID{Bytes: i18nID, Valid: true}
			}
		}
		if _, err := s.repo.Tenant(ctx).UpdateInventory(ctx, pg.UpdateInventoryParams{
			ID:              invID,
			Date:            finalDate,
			StorageID:       finalStorageID,
			Description:     finalDescription,
			DescriptionI18n: finalDescI18n,
			Status:          newStatus,
		}); err != nil {
			return nil, fmt.Errorf("failed to update inventory: %w", err)
		}
		// Refresh storagePg in case storage changed
		storagePg = pgtype.UUID{Bytes: finalStorageID, Valid: true}
	}

	isActive := newStatus == "active"

	// Build set of ingredient IDs present in the request
	requestSet := make(map[uuid.UUID]bool, len(req.Items))
	for _, item := range req.Items {
		ingID, err := uuid.Parse(item.IngredientID)
		if err != nil {
			return nil, fmt.Errorf("invalid ingredient_id: %w", err)
		}
		requestSet[ingID] = true
	}

	// ── Upsert items present in request ──────────────────────────
	for _, item := range req.Items {
		ingID, _ := uuid.Parse(item.IngredientID)
		newQty := pgtype.Numeric{}
		if err := newQty.Scan(item.CountedQuantity); err != nil {
			return nil, fmt.Errorf("invalid counted_quantity for ingredient %s: %w", ingID, err)
		}

		existing, exists := existingMap[ingID]

		if isActive {
			// Ensure a stock row exists
			_, _ = s.repo.Tenant(ctx).EnsureIngredientStockByStorage(ctx, pg.EnsureIngredientStockByStorageParams{
				ID:           uuid.New(),
				IngredientID: ingID,
				StorageID:    storagePg,
			})

			locked, err := s.repo.Tenant(ctx).GetStockByIngredientAndStorageForUpdate(ctx, pg.GetStockByIngredientAndStorageForUpdateParams{
				IngredientID: ingID,
				StorageID:    storagePg,
			})
			if err != nil {
				return nil, fmt.Errorf("failed to lock stock for ingredient %s: %w", ingID, err)
			}

			if !exists {
				// New item on active inventory:
				// system_quantity = current stock (locked), set stock to counted
				systemQty := locked.Quantity
				if _, err := s.repo.Tenant(ctx).InsertInventoryItemWithSystemQty(ctx, uuid.New(), invID, ingID, newQty, systemQty); err != nil {
					return nil, fmt.Errorf("failed to insert inventory item: %w", err)
				}
				// Apply delta: stock = counted (absolute set)
				if numericToString(locked.Quantity) != item.CountedQuantity {
					updated, err := s.repo.Tenant(ctx).UpdateIngredientStock(ctx, pg.UpdateIngredientStockParams{
						ID:       locked.ID,
						Quantity: newQty,
					})
					if err != nil {
						return nil, fmt.Errorf("failed to update stock: %w", err)
					}
					eventType := "inventory_in"
					if numericToFloat(newQty) < numericToFloat(locked.Quantity) {
						eventType = "inventory_out"
					}
					srcID := invID
					_ = s.repo.Tenant(ctx).InsertIngredientStockMovement(ctx, pg.InsertIngredientStockMovementParams{
						ID: uuid.New(), StorageID: inv.StorageID, IngredientID: ingID,
						EventType: eventType, QtyIn: zero, QtyOut: zero,
						StockBefore: locked.Quantity, StockAfter: updated.Quantity,
						PricePerUnit: zero, SourceType: &sourceType, SourceID: &srcID,
					})
				}
			} else {
				// Existing item on active inventory:
				// Adjust stock by (new_counted - old_counted)
				oldQty := existing.CountedQuantity
				adjustment := numericToFloat(newQty) - numericToFloat(oldQty)
				if adjustment != 0 {
					newStockFloat := numericToFloat(locked.Quantity) + adjustment
					newStockQty := pgtype.Numeric{}
					_ = newStockQty.Scan(fmt.Sprintf("%.6f", newStockFloat))
					updated, err := s.repo.Tenant(ctx).UpdateIngredientStock(ctx, pg.UpdateIngredientStockParams{
						ID:       locked.ID,
						Quantity: newStockQty,
					})
					if err != nil {
						return nil, fmt.Errorf("failed to update stock: %w", err)
					}
					eventType := "inventory_in"
					if adjustment < 0 {
						eventType = "inventory_out"
					}
					srcID := invID
					_ = s.repo.Tenant(ctx).InsertIngredientStockMovement(ctx, pg.InsertIngredientStockMovementParams{
						ID: uuid.New(), StorageID: inv.StorageID, IngredientID: ingID,
						EventType: eventType, QtyIn: zero, QtyOut: zero,
						StockBefore: locked.Quantity, StockAfter: updated.Quantity,
						PricePerUnit: zero, SourceType: &sourceType, SourceID: &srcID,
					})
				}
				// Update counted_quantity, keep system_quantity
				if _, err := s.repo.Tenant(ctx).UpdateInventoryItemCountedQuantity(ctx, existing.ID, newQty); err != nil {
					return nil, fmt.Errorf("failed to update inventory item: %w", err)
				}
			}
		} else {
			// Draft: just upsert items, no stock changes
			if _, err := s.repo.Tenant(ctx).UpsertInventoryItem(ctx, pg.UpsertInventoryItemParams{
				ID:              uuid.New(),
				InventoryID:     invID,
				IngredientID:    ingID,
				CountedQuantity: newQty,
			}); err != nil {
				return nil, fmt.Errorf("failed to upsert inventory item: %w", err)
			}
		}
	}

	// ── Delete items absent from request ─────────────────────────
	for ingID, item := range existingMap {
		if requestSet[ingID] {
			continue
		}

		if isActive {
			// Reverse the delta that was applied when this item was activated
			_, _ = s.repo.Tenant(ctx).EnsureIngredientStockByStorage(ctx, pg.EnsureIngredientStockByStorageParams{
				ID:           uuid.New(),
				IngredientID: ingID,
				StorageID:    storagePg,
			})
			locked, err := s.repo.Tenant(ctx).GetStockByIngredientAndStorageForUpdate(ctx, pg.GetStockByIngredientAndStorageForUpdateParams{
				IngredientID: ingID,
				StorageID:    storagePg,
			})
			if err != nil {
				return nil, fmt.Errorf("failed to lock stock for removal: %w", err)
			}
			delta := numericToFloat(item.CountedQuantity) - numericToFloat(item.SystemQuantity)
			if delta != 0 {
				reversedFloat := numericToFloat(locked.Quantity) - delta
				reversedQty := pgtype.Numeric{}
				_ = reversedQty.Scan(fmt.Sprintf("%.6f", reversedFloat))
				updated, err := s.repo.Tenant(ctx).UpdateIngredientStock(ctx, pg.UpdateIngredientStockParams{
					ID:       locked.ID,
					Quantity: reversedQty,
				})
				if err != nil {
					return nil, fmt.Errorf("failed to reverse stock: %w", err)
				}
				srcID := invID
				_ = s.repo.Tenant(ctx).InsertIngredientStockMovement(ctx, pg.InsertIngredientStockMovementParams{
					ID: uuid.New(), StorageID: inv.StorageID, IngredientID: ingID,
					EventType: "inventory_item_removed", QtyIn: zero, QtyOut: zero,
					StockBefore: locked.Quantity, StockAfter: updated.Quantity,
					PricePerUnit: zero, SourceType: &sourceType, SourceID: &srcID,
				})
			}
		}

		if err := s.repo.Tenant(ctx).DeleteInventoryItemByID(ctx, item.ID); err != nil {
			return nil, fmt.Errorf("failed to delete inventory item: %w", err)
		}
	}

	// Recalculate totals
	totals, err := s.repo.Tenant(ctx).CalculateInventoryTotals(ctx, invID)
	if err != nil {
		return nil, fmt.Errorf("failed to calculate totals: %w", err)
	}
	if _, err := s.repo.Tenant(ctx).UpdateInventoryAmounts(ctx, pg.UpdateInventoryAmountsParams{
		ID:              invID,
		SurplusAmount:   totals.SurplusAmount,
		ShortageAmount:  totals.ShortageAmount,
		RemainingAmount: totals.RemainingAmount,
	}); err != nil {
		return nil, fmt.Errorf("failed to update inventory amounts: %w", err)
	}

	rows, err := s.repo.Tenant(ctx).GetInventoryItemsComputedAll(ctx, invID)
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
//  Delete
// ─────────────────────────────────────────────

func (s *InventoryS) DeleteInventory(ctx context.Context, id string) error {
	inventoryID, err := uuid.Parse(id)
	if err != nil {
		return fmt.Errorf("invalid inventory id: %w", err)
	}

	inv, err := s.repo.Tenant(ctx).GetInventoryForApply(ctx, inventoryID)
	if err != nil {
		return fmt.Errorf("inventory not found: %w", err)
	}
	if inv.Status == "deleted" {
		return fmt.Errorf("inventory is already deleted")
	}

	// If active, reverse stock before deleting
	if inv.Status == "active" {
		storagePg := pgtype.UUID{Bytes: inv.StorageID, Valid: true}
		items, err := s.repo.Tenant(ctx).GetInventoryItemsByInventoryIDAll(ctx, inventoryID)
		if err != nil {
			return fmt.Errorf("failed to get inventory items: %w", err)
		}
		if err := s.reverseStockForItems(ctx, inventoryID, inv.StorageID, storagePg, items, "inventory_deleted"); err != nil {
			return err
		}
	}

	if err := s.repo.Tenant(ctx).DeleteInventory(ctx, inventoryID); err != nil {
		return fmt.Errorf("failed to delete inventory: %w", err)
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

	item, err := s.repo.Tenant(ctx).GetInventoryItemByID(ctx, itemID)
	if err != nil {
		return fmt.Errorf("failed to get inventory item: %w", err)
	}

	inv, err := s.repo.Tenant(ctx).GetInventoryForApply(ctx, item.InventoryID)
	if err != nil {
		return fmt.Errorf("failed to get inventory: %w", err)
	}

	if inv.Status == "deleted" {
		return fmt.Errorf("cannot modify items of a deleted inventory")
	}

	zero := pgtype.Numeric{}
	_ = zero.Scan("0")
	sourceType := "inventory"

	if inv.Status == "active" {
		storagePg := pgtype.UUID{Bytes: inv.StorageID, Valid: true}
		_, _ = s.repo.Tenant(ctx).EnsureIngredientStockByStorage(ctx, pg.EnsureIngredientStockByStorageParams{
			ID:           uuid.New(),
			IngredientID: item.IngredientID,
			StorageID:    storagePg,
		})
		locked, err := s.repo.Tenant(ctx).GetStockByIngredientAndStorageForUpdate(ctx, pg.GetStockByIngredientAndStorageForUpdateParams{
			IngredientID: item.IngredientID,
			StorageID:    storagePg,
		})
		if err != nil {
			return fmt.Errorf("failed to lock stock: %w", err)
		}
		delta := numericToFloat(item.CountedQuantity) - numericToFloat(item.SystemQuantity)
		if delta != 0 {
			reversedFloat := numericToFloat(locked.Quantity) - delta
			reversedQty := pgtype.Numeric{}
			_ = reversedQty.Scan(fmt.Sprintf("%.6f", reversedFloat))
			restored, err := s.repo.Tenant(ctx).UpdateIngredientStock(ctx, pg.UpdateIngredientStockParams{
				ID:       locked.ID,
				Quantity: reversedQty,
			})
			if err != nil {
				return fmt.Errorf("failed to restore stock: %w", err)
			}
			srcID := inv.ID
			_ = s.repo.Tenant(ctx).InsertIngredientStockMovement(ctx, pg.InsertIngredientStockMovementParams{
				ID: uuid.New(), StorageID: inv.StorageID, IngredientID: item.IngredientID,
				EventType: "inventory_item_deleted", QtyIn: zero, QtyOut: zero,
				StockBefore: locked.Quantity, StockAfter: restored.Quantity,
				PricePerUnit: zero, SourceType: &sourceType, SourceID: &srcID,
			})
		}
	}

	if err := s.repo.Tenant(ctx).DeleteInventoryItem(ctx, itemID); err != nil {
		return fmt.Errorf("failed to delete inventory item: %w", err)
	}

	totals, err := s.repo.Tenant(ctx).CalculateInventoryTotals(ctx, item.InventoryID)
	if err != nil {
		return fmt.Errorf("failed to calculate inventory totals: %w", err)
	}
	if _, err := s.repo.Tenant(ctx).UpdateInventoryAmounts(ctx, pg.UpdateInventoryAmountsParams{
		ID:              item.InventoryID,
		SurplusAmount:   totals.SurplusAmount,
		ShortageAmount:  totals.ShortageAmount,
		RemainingAmount: totals.RemainingAmount,
	}); err != nil {
		return fmt.Errorf("failed to update inventory amounts: %w", err)
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

	totals, err := s.repo.Tenant(ctx).CalculateInventoryTotals(ctx, invID)
	if err != nil {
		return nil, fmt.Errorf("failed to calculate inventory totals: %w", err)
	}

	updated, err := s.repo.Tenant(ctx).UpdateInventoryAmounts(ctx, pg.UpdateInventoryAmountsParams{
		ID:              invID,
		SurplusAmount:   totals.SurplusAmount,
		ShortageAmount:  totals.ShortageAmount,
		RemainingAmount: totals.RemainingAmount,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to update inventory amounts: %w", err)
	}

	return toInventoryResponse(updated), nil
}

func (s *InventoryS) RestoreInventory(ctx context.Context, id string) (*model.InventoryResponse, error) {
	inventoryID, err := uuid.Parse(id)
	if err != nil {
		return nil, fmt.Errorf("invalid inventory id: %w", err)
	}

	inv, err := s.repo.Tenant(ctx).RestoreInventory(ctx, inventoryID)
	if err != nil {
		return nil, fmt.Errorf("failed to restore inventory: %w", err)
	}
	return toInventoryResponse(inv), nil
}

// UpsertInventoryItems is kept for backwards compatibility; delegates to ReplaceInventoryItems.
func (s *InventoryS) UpsertInventoryItems(ctx context.Context, inventoryID string, req *model.UpsertInventoryItemsRequest) ([]*model.InventoryItemComputedResponse, error) {
	return s.ReplaceInventoryItems(ctx, inventoryID, req)
}

// ─────────────────────────────────────────────
//  Stock helpers
// ─────────────────────────────────────────────

// applyStockForItems refreshes each item's system_quantity to current stock then sets stock = counted.
// Used when transitioning draft → active.
func (s *InventoryS) applyStockForItems(ctx context.Context, invID uuid.UUID, storageID uuid.UUID, storagePg pgtype.UUID, items []pg.InventoryItemForProcess, eventType string) error {
	zero := pgtype.Numeric{}
	_ = zero.Scan("0")
	sourceType := "inventory"

	for _, item := range items {
		// Refresh system_quantity to current stock
		refreshed, err := s.repo.Tenant(ctx).UpdateInventoryItemSystemQuantityFromStock(ctx, item.ID)
		if err != nil {
			return fmt.Errorf("failed to refresh system_quantity: %w", err)
		}

		_, _ = s.repo.Tenant(ctx).EnsureIngredientStockByStorage(ctx, pg.EnsureIngredientStockByStorageParams{
			ID:           uuid.New(),
			IngredientID: item.IngredientID,
			StorageID:    storagePg,
		})
		locked, err := s.repo.Tenant(ctx).GetStockByIngredientAndStorageForUpdate(ctx, pg.GetStockByIngredientAndStorageForUpdateParams{
			IngredientID: item.IngredientID,
			StorageID:    storagePg,
		})
		if err != nil {
			return fmt.Errorf("failed to lock stock: %w", err)
		}

		if numericToString(locked.Quantity) != numericToString(refreshed.CountedQuantity) {
			updated, err := s.repo.Tenant(ctx).UpdateIngredientStock(ctx, pg.UpdateIngredientStockParams{
				ID:       locked.ID,
				Quantity: refreshed.CountedQuantity,
			})
			if err != nil {
				return fmt.Errorf("failed to apply stock: %w", err)
			}
			ev := "inventory_in"
			if numericToFloat(refreshed.CountedQuantity) < numericToFloat(locked.Quantity) {
				ev = "inventory_out"
			}
			srcID := invID
			_ = s.repo.Tenant(ctx).InsertIngredientStockMovement(ctx, pg.InsertIngredientStockMovementParams{
				ID: uuid.New(), StorageID: storageID, IngredientID: item.IngredientID,
				EventType: ev, QtyIn: zero, QtyOut: zero,
				StockBefore: locked.Quantity, StockAfter: updated.Quantity,
				PricePerUnit: zero, SourceType: &sourceType, SourceID: &srcID,
			})
		}
	}
	return nil
}

// reverseStockForItems reverses the delta (counted - system_quantity) for each item.
// Used when transitioning active → draft or deleting an active inventory.
func (s *InventoryS) reverseStockForItems(ctx context.Context, invID uuid.UUID, storageID uuid.UUID, storagePg pgtype.UUID, items []pg.InventoryItemForProcess, eventType string) error {
	zero := pgtype.Numeric{}
	_ = zero.Scan("0")
	sourceType := "inventory"

	for _, item := range items {
		delta := numericToFloat(item.CountedQuantity) - numericToFloat(item.SystemQuantity)
		if delta == 0 {
			continue
		}

		_, _ = s.repo.Tenant(ctx).EnsureIngredientStockByStorage(ctx, pg.EnsureIngredientStockByStorageParams{
			ID:           uuid.New(),
			IngredientID: item.IngredientID,
			StorageID:    storagePg,
		})
		locked, err := s.repo.Tenant(ctx).GetStockByIngredientAndStorageForUpdate(ctx, pg.GetStockByIngredientAndStorageForUpdateParams{
			IngredientID: item.IngredientID,
			StorageID:    storagePg,
		})
		if err != nil {
			return fmt.Errorf("failed to lock stock: %w", err)
		}

		reversedFloat := numericToFloat(locked.Quantity) - delta
		reversedQty := pgtype.Numeric{}
		_ = reversedQty.Scan(fmt.Sprintf("%.6f", reversedFloat))

		updated, err := s.repo.Tenant(ctx).UpdateIngredientStock(ctx, pg.UpdateIngredientStockParams{
			ID:       locked.ID,
			Quantity: reversedQty,
		})
		if err != nil {
			return fmt.Errorf("failed to reverse stock: %w", err)
		}

		srcID := invID
		_ = s.repo.Tenant(ctx).InsertIngredientStockMovement(ctx, pg.InsertIngredientStockMovementParams{
			ID: uuid.New(), StorageID: storageID, IngredientID: item.IngredientID,
			EventType: eventType, QtyIn: zero, QtyOut: zero,
			StockBefore: locked.Quantity, StockAfter: updated.Quantity,
			PricePerUnit: zero, SourceType: &sourceType, SourceID: &srcID,
		})
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

func toInventoryResponse(inv any) *model.InventoryResponse {
	var (
		id              uuid.UUID
		number          int64
		date            pgtype.Date
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
		id, number, date, storageID = row.ID, row.Number, row.Date, row.StorageID
		description, descriptionI18n, status = row.Description, row.DescriptionI18n, row.Status
		surplusAmount, shortageAmount, remainingAmount = row.SurplusAmount, row.ShortageAmount, row.RemainingAmount
		createdAt, updatedAt, deletedAt = row.CreatedAt, row.UpdatedAt, row.DeletedAt
	case pg.CreateInventoryRow:
		id, number, date, storageID = row.ID, row.Number, row.Date, row.StorageID
		description, descriptionI18n, status = row.Description, row.DescriptionI18n, row.Status
		surplusAmount, shortageAmount, remainingAmount = row.SurplusAmount, row.ShortageAmount, row.RemainingAmount
		createdAt, updatedAt = row.CreatedAt, row.UpdatedAt
	case pg.GetInventoryByIDRow:
		id, number, date, storageID = row.ID, row.Number, row.Date, row.StorageID
		description, descriptionI18n, status = row.Description, row.DescriptionI18n, row.Status
		surplusAmount, shortageAmount, remainingAmount = row.SurplusAmount, row.ShortageAmount, row.RemainingAmount
		createdAt, updatedAt = row.CreatedAt, row.UpdatedAt
	case pg.GetAllInventoriesRow:
		id, number, date, storageID = row.ID, row.Number, row.Date, row.StorageID
		description, descriptionI18n, status = row.Description, row.DescriptionI18n, row.Status
		surplusAmount, shortageAmount, remainingAmount = row.SurplusAmount, row.ShortageAmount, row.RemainingAmount
		createdAt, updatedAt, deletedAt = row.CreatedAt, row.UpdatedAt, row.DeletedAt
	case pg.GetInventoriesFilteredRow:
		id, number, date, storageID = row.ID, row.Number, row.Date, row.StorageID
		description, descriptionI18n, status = row.Description, row.DescriptionI18n, row.Status
		surplusAmount, shortageAmount, remainingAmount = row.SurplusAmount, row.ShortageAmount, row.RemainingAmount
		createdAt, updatedAt, deletedAt = row.CreatedAt, row.UpdatedAt, row.DeletedAt
	case pg.UpdateInventoryRow:
		id, number, date, storageID = row.ID, row.Number, row.Date, row.StorageID
		description, descriptionI18n, status = row.Description, row.DescriptionI18n, row.Status
		surplusAmount, shortageAmount, remainingAmount = row.SurplusAmount, row.ShortageAmount, row.RemainingAmount
		createdAt, updatedAt = row.CreatedAt, row.UpdatedAt
	case pg.UpdateInventoryAmountsRow:
		id, number, date, storageID = row.ID, row.Number, row.Date, row.StorageID
		description, descriptionI18n, status = row.Description, row.DescriptionI18n, row.Status
		surplusAmount, shortageAmount, remainingAmount = row.SurplusAmount, row.ShortageAmount, row.RemainingAmount
		createdAt, updatedAt = row.CreatedAt, row.UpdatedAt
	case pg.RestoreInventoryRow:
		id, number, date, storageID = row.ID, row.Number, row.Date, row.StorageID
		description, descriptionI18n, status = row.Description, row.DescriptionI18n, row.Status
		surplusAmount, shortageAmount, remainingAmount = row.SurplusAmount, row.ShortageAmount, row.RemainingAmount
		createdAt, updatedAt = row.CreatedAt, row.UpdatedAt
	case pg.SearchInventoriesRow:
		id, number, date, storageID = row.ID, row.Number, row.Date, row.StorageID
		description, descriptionI18n, status = row.Description, row.DescriptionI18n, row.Status
		surplusAmount, shortageAmount, remainingAmount = row.SurplusAmount, row.ShortageAmount, row.RemainingAmount
		createdAt, updatedAt, deletedAt = row.CreatedAt, row.UpdatedAt, row.DeletedAt
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
