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

	status := "active"
	if req.Status != nil && *req.Status != "" {
		status = *req.Status
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

func (s *InventoryS) GetInventoriesFiltered(ctx context.Context, dateFrom, dateTo *time.Time, storageID, ingredientID, status *string, limit, offset int32) ([]*model.InventoryResponse, error) {
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

	var statusVal *string
	if status != nil && strings.TrimSpace(*status) != "" {
		s := strings.TrimSpace(*status)
		statusVal = &s
	}

	statusText := ""
	if statusVal != nil {
		statusText = *statusVal
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

	resp := make([]*model.InventoryResponse, 0, len(invs))
	for _, inv := range invs {
		resp = append(resp, toInventoryResponse(inv))
	}
	return resp, nil
}

func (s *InventoryS) GetAllInventoryItems(ctx context.Context, inventoryID *string, limit, offset int32) ([]*model.InventoryItemResponse, error) {
	var (
		items []pg.InventoryItem
		err   error
	)

	if inventoryID != nil && *inventoryID != "" {
		invID, err := uuid.Parse(*inventoryID)
		if err != nil {
			return nil, fmt.Errorf("invalid inventory id: %w", err)
		}
		items, err = s.repo.Tenant(ctx).GetInventoryItemsByInventoryID(ctx, pg.GetInventoryItemsByInventoryIDParams{
			InventoryID: invID,
			Limit:       limit,
			Offset:      offset,
		})
		if err != nil {
			return nil, fmt.Errorf("failed to get inventory items: %w", err)
		}
	} else {
		items, err = s.repo.Tenant(ctx).GetAllInventoryItems(ctx, pg.GetAllInventoryItemsParams{Limit: limit, Offset: offset})
		if err != nil {
			return nil, fmt.Errorf("failed to get inventory items: %w", err)
		}
	}

	resp := make([]*model.InventoryItemResponse, 0, len(items))
	for _, item := range items {
		resp = append(resp, toInventoryItemResponse(item))
	}
	return resp, nil
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

func (s *InventoryS) DeleteInventoryItem(ctx context.Context, inventoryItemID string) error {
	itemID, err := uuid.Parse(inventoryItemID)
	if err != nil {
		return fmt.Errorf("invalid inventory item id: %w", err)
	}

	item, err := s.repo.Tenant(ctx).GetInventoryItemByID(ctx, itemID)
	if err != nil {
		return fmt.Errorf("failed to get inventory item: %w", err)
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

func (s *InventoryS) UpsertInventoryItems(ctx context.Context, inventoryID string, req *model.UpsertInventoryItemsRequest) ([]*model.InventoryItemComputedResponse, error) {
	invID, err := uuid.Parse(inventoryID)
	if err != nil {
		return nil, fmt.Errorf("invalid inventory id: %w", err)
	}

	if _, err := s.repo.Tenant(ctx).GetInventoryByID(ctx, invID); err != nil {
		return nil, fmt.Errorf("failed to get inventory: %w", err)
	}

	for _, item := range req.Items {
		ingID, err := uuid.Parse(item.IngredientID)
		if err != nil {
			return nil, fmt.Errorf("invalid ingredient_id: %w", err)
		}

		_, err = s.repo.Tenant(ctx).UpsertInventoryItem(ctx, pg.UpsertInventoryItemParams{
			ID:           uuid.New(),
			InventoryID:  invID,
			IngredientID: ingID,
			CountedQuantity: func() pgtype.Numeric {
				n := pgtype.Numeric{}
				_ = n.Scan(item.CountedQuantity)
				return n
			}(),
		})
		if err != nil {
			return nil, fmt.Errorf("failed to upsert inventory item: %w", err)
		}
	}

	rows, err := s.repo.Tenant(ctx).GetInventoryItemsComputedAll(ctx, invID)
	if err != nil {
		return nil, fmt.Errorf("failed to get inventory items: %w", err)
	}

	totals, err := s.repo.Tenant(ctx).CalculateInventoryTotals(ctx, invID)
	if err != nil {
		return nil, fmt.Errorf("failed to calculate inventory totals: %w", err)
	}

	if _, err := s.repo.Tenant(ctx).UpdateInventoryAmounts(ctx, pg.UpdateInventoryAmountsParams{
		ID:              invID,
		SurplusAmount:   totals.SurplusAmount,
		ShortageAmount:  totals.ShortageAmount,
		RemainingAmount: totals.RemainingAmount,
	}); err != nil {
		return nil, fmt.Errorf("failed to update inventory amounts: %w", err)
	}

	resp := make([]*model.InventoryItemComputedResponse, 0, len(rows))
	for _, row := range rows {
		resp = append(resp, toInventoryItemComputedResponse(row))
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

func (s *InventoryS) ApplyInventory(ctx context.Context, inventoryID string) (*model.InventoryResponse, error) {
	invID, err := uuid.Parse(inventoryID)
	if err != nil {
		return nil, fmt.Errorf("invalid inventory id: %w", err)
	}

	inv, err := s.repo.Tenant(ctx).GetInventoryForApply(ctx, invID)
	if err != nil {
		return nil, fmt.Errorf("failed to get inventory: %w", err)
	}
	if inv.AppliedAt.Valid {
		return nil, fmt.Errorf("inventory already applied")
	}

	items, err := s.repo.Tenant(ctx).GetInventoryItemsComputedAll(ctx, invID)
	if err != nil {
		return nil, fmt.Errorf("failed to get inventory items: %w", err)
	}

	zero := pgtype.Numeric{}
	_ = zero.Scan("0")

	storagePg := pgtype.UUID{Bytes: inv.StorageID, Valid: true}
	sourceType := "inventory"

	for _, it := range items {
		diffStr := numericToString(it.DifferenceQuantity)
		if diffStr == "0" {
			continue
		}

		isShortage := strings.HasPrefix(diffStr, "-")
		absStr := strings.TrimPrefix(diffStr, "-")
		absQty := pgtype.Numeric{}
		if err := absQty.Scan(absStr); err != nil {
			return nil, fmt.Errorf("invalid difference quantity: %w", err)
		}

		if !it.PricePerUnit.Valid {
			it.PricePerUnit = zero
		}

		_, _ = s.repo.Tenant(ctx).EnsureIngredientStockByStorage(ctx, pg.EnsureIngredientStockByStorageParams{
			ID:           uuid.New(),
			IngredientID: it.IngredientID,
			StorageID:    storagePg,
		})

		locked, err := s.repo.Tenant(ctx).GetStockByIngredientAndStorageForUpdate(ctx, pg.GetStockByIngredientAndStorageForUpdateParams{
			IngredientID: it.IngredientID,
			StorageID:    storagePg,
		})
		if err != nil {
			return nil, fmt.Errorf("failed to lock stock: %w", err)
		}

		updated, err := s.repo.Tenant(ctx).UpdateIngredientStock(ctx, pg.UpdateIngredientStockParams{
			ID:       locked.ID,
			Quantity: it.CountedQuantity,
		})
		if err != nil {
			return nil, fmt.Errorf("failed to update ingredient stock: %w", err)
		}

		qtyIn := zero
		qtyOut := zero
		eventType := "inventory_surplus_in"
		if isShortage {
			qtyOut = absQty
			eventType = "inventory_shortage_out"
		} else {
			qtyIn = absQty
		}

		srcID := invID
		if err := s.repo.Tenant(ctx).InsertIngredientStockMovement(ctx, pg.InsertIngredientStockMovementParams{
			ID:           uuid.New(),
			StorageID:    inv.StorageID,
			IngredientID: it.IngredientID,
			EventType:    eventType,
			QtyIn:        qtyIn,
			QtyOut:       qtyOut,
			StockBefore:  locked.Quantity,
			StockAfter:   updated.Quantity,
			PricePerUnit: it.PricePerUnit,
			SourceType:   &sourceType,
			SourceID:     &srcID,
		}); err != nil {
			return nil, fmt.Errorf("failed to insert stock movement: %w", err)
		}
	}

	if err := s.repo.Tenant(ctx).MarkInventoryApplied(ctx, invID); err != nil {
		return nil, fmt.Errorf("failed to mark inventory applied: %w", err)
	}

	fresh, err := s.repo.Tenant(ctx).GetInventoryByID(ctx, invID)
	if err != nil {
		return nil, fmt.Errorf("failed to get inventory: %w", err)
	}

	return toInventoryResponse(fresh), nil
}

func (s *InventoryS) UpdateInventory(ctx context.Context, id string, req *model.UpdateInventoryRequest) (*model.InventoryResponse, error) {
	inventoryID, err := uuid.Parse(id)
	if err != nil {
		return nil, fmt.Errorf("invalid inventory id: %w", err)
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

func (s *InventoryS) DeleteInventory(ctx context.Context, id string) error {
	inventoryID, err := uuid.Parse(id)
	if err != nil {
		return fmt.Errorf("invalid inventory id: %w", err)
	}
	// Block deletion if stock adjustments have already been applied
	if inv, err := s.repo.Tenant(ctx).GetInventoryForApply(ctx, inventoryID); err == nil && inv.AppliedAt.Valid {
		return fmt.Errorf("cannot delete an applied inventory")
	}
	if err := s.repo.Tenant(ctx).DeleteInventory(ctx, inventoryID); err != nil {
		return fmt.Errorf("failed to delete inventory: %w", err)
	}
	return nil
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
		id = row.ID
		number = row.Number
		date = row.Date
		storageID = row.StorageID
		description = row.Description
		descriptionI18n = row.DescriptionI18n
		status = row.Status
		surplusAmount = row.SurplusAmount
		shortageAmount = row.ShortageAmount
		remainingAmount = row.RemainingAmount
		createdAt = row.CreatedAt
		updatedAt = row.UpdatedAt
		deletedAt = row.DeletedAt
	case pg.CreateInventoryRow:
		id = row.ID
		number = row.Number
		date = row.Date
		storageID = row.StorageID
		description = row.Description
		descriptionI18n = row.DescriptionI18n
		status = row.Status
		surplusAmount = row.SurplusAmount
		shortageAmount = row.ShortageAmount
		remainingAmount = row.RemainingAmount
		createdAt = row.CreatedAt
		updatedAt = row.UpdatedAt
	case pg.GetInventoryByIDRow:
		id = row.ID
		number = row.Number
		date = row.Date
		storageID = row.StorageID
		description = row.Description
		descriptionI18n = row.DescriptionI18n
		status = row.Status
		surplusAmount = row.SurplusAmount
		shortageAmount = row.ShortageAmount
		remainingAmount = row.RemainingAmount
		createdAt = row.CreatedAt
		updatedAt = row.UpdatedAt
	case pg.GetAllInventoriesRow:
		id = row.ID
		number = row.Number
		date = row.Date
		storageID = row.StorageID
		description = row.Description
		descriptionI18n = row.DescriptionI18n
		status = row.Status
		surplusAmount = row.SurplusAmount
		shortageAmount = row.ShortageAmount
		remainingAmount = row.RemainingAmount
		createdAt = row.CreatedAt
		updatedAt = row.UpdatedAt
		deletedAt = row.DeletedAt
	case pg.GetInventoriesFilteredRow:
		id = row.ID
		number = row.Number
		date = row.Date
		storageID = row.StorageID
		description = row.Description
		descriptionI18n = row.DescriptionI18n
		status = row.Status
		surplusAmount = row.SurplusAmount
		shortageAmount = row.ShortageAmount
		remainingAmount = row.RemainingAmount
		createdAt = row.CreatedAt
		updatedAt = row.UpdatedAt
		deletedAt = row.DeletedAt
	case pg.UpdateInventoryRow:
		id = row.ID
		number = row.Number
		date = row.Date
		storageID = row.StorageID
		description = row.Description
		descriptionI18n = row.DescriptionI18n
		status = row.Status
		surplusAmount = row.SurplusAmount
		shortageAmount = row.ShortageAmount
		remainingAmount = row.RemainingAmount
		createdAt = row.CreatedAt
		updatedAt = row.UpdatedAt
	case pg.UpdateInventoryAmountsRow:
		id = row.ID
		number = row.Number
		date = row.Date
		storageID = row.StorageID
		description = row.Description
		descriptionI18n = row.DescriptionI18n
		status = row.Status
		surplusAmount = row.SurplusAmount
		shortageAmount = row.ShortageAmount
		remainingAmount = row.RemainingAmount
		createdAt = row.CreatedAt
		updatedAt = row.UpdatedAt
	case pg.RestoreInventoryRow:
		id = row.ID
		number = row.Number
		date = row.Date
		storageID = row.StorageID
		description = row.Description
		descriptionI18n = row.DescriptionI18n
		status = row.Status
		surplusAmount = row.SurplusAmount
		shortageAmount = row.ShortageAmount
		remainingAmount = row.RemainingAmount
		createdAt = row.CreatedAt
		updatedAt = row.UpdatedAt
	case pg.SearchInventoriesRow:
		id = row.ID
		number = row.Number
		date = row.Date
		storageID = row.StorageID
		description = row.Description
		descriptionI18n = row.DescriptionI18n
		status = row.Status
		surplusAmount = row.SurplusAmount
		shortageAmount = row.ShortageAmount
		remainingAmount = row.RemainingAmount
		createdAt = row.CreatedAt
		updatedAt = row.UpdatedAt
		deletedAt = row.DeletedAt
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

func toInventoryItemResponse(item pg.InventoryItem) *model.InventoryItemResponse {
	resp := &model.InventoryItemResponse{
		ID:              item.ID.String(),
		InventoryID:     item.InventoryID.String(),
		IngredientID:    item.IngredientID.String(),
		CountedQuantity: numericToString(item.CountedQuantity),
	}

	resp.CreatedAt = timestampToTime(item.CreatedAt)
	resp.UpdatedAt = timestampToTime(item.UpdatedAt)

	return resp
}
