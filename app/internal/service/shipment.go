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

type ShipmentI interface {
	CreateShipment(ctx context.Context, req *model.CreateShipmentRequest) (*model.ShipmentResponse, error)
	CreateShipmentBatch(ctx context.Context, req *model.CreateShipmentBatchRequest) (*model.ShipmentWithItemsResponse, error)
	UpdateShipmentBatch(ctx context.Context, id string, req *model.UpdateShipmentBatchRequest) (*model.ShipmentWithItemsResponse, error)
	GetShipment(ctx context.Context, id string) (*model.ShipmentWithItemsResponse, error)
	ListShipments(ctx context.Context, storageID, supplierID, status *string, startDate, endDate *string, limit, offset int32) ([]*model.ShipmentResponse, int64, string, error)
	UpdateShipment(ctx context.Context, id string, req *model.UpdateShipmentRequest) (*model.ShipmentResponse, error)
	DeleteShipment(ctx context.Context, id string) error
	UpsertShipmentItems(ctx context.Context, shipmentID string, req *model.UpsertShipmentItemsRequest) ([]model.ShipmentItemResponse, error)
	DeleteShipmentItem(ctx context.Context, itemID string) error
}

type ShipmentS struct {
	repo *repository.Repository
}

func NewShipmentS(repo *repository.Repository) *ShipmentS {
	return &ShipmentS{repo: repo}
}

func (s *ShipmentS) CreateShipment(ctx context.Context, req *model.CreateShipmentRequest) (*model.ShipmentResponse, error) {
	params := pg.CreateShipmentParams{
		Date:    pgtype.Timestamp{Time: time.Now(), Valid: true},
		Column5: pg.ShipmentStatusDraft,
	}
	if req.Date != nil {
		if t, err := time.Parse(time.RFC3339, *req.Date); err == nil {
			params.Date = pgtype.Timestamp{Time: t, Valid: true}
		}
	}
	if req.StorageID != nil {
		if id, err := uuid.Parse(*req.StorageID); err == nil {
			params.StorageID = pgtype.UUID{Bytes: id, Valid: true}
		}
	}
	if req.SupplierID != nil {
		if id, err := uuid.Parse(*req.SupplierID); err == nil {
			params.SupplierID = pgtype.UUID{Bytes: id, Valid: true}
		}
	}
	if req.Description != nil {
		params.Description = req.Description
	}
	if req.Status != nil {
		st := pg.ShipmentStatus(*req.Status)
		if st == pg.ShipmentStatusActive || st == pg.ShipmentStatusDraft {
			params.Column5 = st
		}
	}

	row, err := s.repo.Tenant(ctx).CreateShipment(ctx, params)
	if err != nil {
		return nil, fmt.Errorf("failed to create shipment: %w", err)
	}

	// If created as active, immediately deduct stock
	if row.Status == pg.ShipmentStatusActive && row.StorageID.Valid {
		shipmentDate := pgtype.Timestamptz{}
		if row.Date.Valid {
			shipmentDate = pgtype.Timestamptz{Time: row.Date.Time.In(time.UTC), Valid: true}
		}
		if err := s.deductStock(ctx, row.ID, row.StorageID, string(pg.ShipmentOut), shipmentDate); err != nil {
			return nil, err
		}
	}

	return shipmentToResponse(row), nil
}

func (s *ShipmentS) GetShipment(ctx context.Context, id string) (*model.ShipmentWithItemsResponse, error) {
	shipmentID, err := uuid.Parse(id)
	if err != nil {
		return nil, fmt.Errorf("invalid shipment id: %w", err)
	}
	row, err := s.repo.Tenant(ctx).GetShipmentByID(ctx, shipmentID)
	if err != nil {
		return nil, fmt.Errorf("shipment not found: %w", err)
	}
	items, err := s.repo.Tenant(ctx).GetShipmentItemsByShipmentID(ctx, shipmentID)
	if err != nil {
		return nil, fmt.Errorf("failed to get shipment items: %w", err)
	}
	itemResponses := make([]model.ShipmentItemResponse, 0, len(items))
	for _, it := range items {
		resp := shipmentItemToResponse(it)
		// If snapshots are saved (from activation), use them as-is.
		// Otherwise show live stock preview.
		snapshotSaved := it.StockBefore.Valid && it.StockAfter.Valid &&
			!(resp.StockBefore == "0" && resp.StockAfter == "0")
		if !snapshotSaved && row.StorageID.Valid {
			stock, err := s.repo.Tenant(ctx).GetStockByIngredientAndStorage(ctx, pg.GetStockByIngredientAndStorageParams{
				IngredientID: it.IngredientID,
				StorageID:    row.StorageID,
			})
			currentQty := 0.0
			if err == nil {
				resp.StockBefore = pgNumericToStr(stock.Quantity)
				v, _ := stock.Quantity.Float64Value()
				currentQty = v.Float64
			} else {
				resp.StockBefore = "0"
			}
			itemQty, _ := it.Quantity.Float64Value()
			projected := currentQty - itemQty.Float64
			projN := pgtype.Numeric{}
			_ = projN.Scan(fmt.Sprintf("%g", projected))
			resp.StockAfter = pgNumericToStr(projN)
		}
		itemResponses = append(itemResponses, resp)
	}
	return &model.ShipmentWithItemsResponse{
		Shipment: *shipmentToResponse(row),
		Items:    itemResponses,
	}, nil
}

func (s *ShipmentS) CreateShipmentBatch(ctx context.Context, req *model.CreateShipmentBatchRequest) (*model.ShipmentWithItemsResponse, error) {
	// Always create header as draft so items exist before any stock deduction
	shipmentResp, err := s.CreateShipment(ctx, &model.CreateShipmentRequest{
		Date:        req.Date,
		StorageID:   req.StorageID,
		SupplierID:  req.SupplierID,
		Description: req.Description,
	})
	if err != nil {
		return nil, err
	}
	if _, err := s.UpsertShipmentItems(ctx, shipmentResp.ID, &model.UpsertShipmentItemsRequest{Items: req.Items}); err != nil {
		return nil, err
	}
	// If caller requested active, activate now — items exist so stock deduction is correct
	if req.Status != nil && *req.Status == string(pg.ShipmentStatusActive) {
		active := string(pg.ShipmentStatusActive)
		if _, err := s.UpdateShipment(ctx, shipmentResp.ID, &model.UpdateShipmentRequest{Status: &active}); err != nil {
			return nil, err
		}
	}
	return s.GetShipment(ctx, shipmentResp.ID)
}

func (s *ShipmentS) UpdateShipmentBatch(ctx context.Context, id string, req *model.UpdateShipmentBatchRequest) (*model.ShipmentWithItemsResponse, error) {
	// Update header
	if _, err := s.UpdateShipment(ctx, id, &model.UpdateShipmentRequest{
		Date:        req.Date,
		StorageID:   req.StorageID,
		SupplierID:  req.SupplierID,
		Description: req.Description,
	}); err != nil {
		return nil, err
	}
	// Upsert items
	if _, err := s.UpsertShipmentItems(ctx, id, &model.UpsertShipmentItemsRequest{Items: req.Items}); err != nil {
		return nil, err
	}
	return s.GetShipment(ctx, id)
}

func (s *ShipmentS) ListShipments(ctx context.Context, storageID, supplierID, status *string, startDate, endDate *string, limit, offset int32) ([]*model.ShipmentResponse, int64, string, error) {
	listParams := pg.ListShipmentsParams{Limit: limit, Offset: offset}
	countParams := pg.CountShipmentsParams{}
	sumParams := pg.SumShipmentsTotalAmountParams{}

	if storageID != nil {
		listParams.Column1 = *storageID
		countParams.Column1 = *storageID
		sumParams.Column1 = *storageID
	}
	if supplierID != nil {
		listParams.Column2 = *supplierID
		countParams.Column2 = *supplierID
		sumParams.Column2 = *supplierID
	}
	if status != nil {
		listParams.Column3 = *status
		countParams.Column3 = *status
		sumParams.Column3 = *status
	}
	if startDate != nil {
		if t, err := time.Parse(time.RFC3339, *startDate); err == nil {
			ts := pgtype.Timestamp{Time: t, Valid: true}
			listParams.Column4 = ts
			countParams.Column4 = ts
			sumParams.Column4 = ts
		}
	}
	if endDate != nil {
		if t, err := time.Parse(time.RFC3339, *endDate); err == nil {
			ts := pgtype.Timestamp{Time: t, Valid: true}
			listParams.Column5 = ts
			countParams.Column5 = ts
			sumParams.Column5 = ts
		}
	}

	rows, err := s.repo.Tenant(ctx).ListShipments(ctx, listParams)
	if err != nil {
		return nil, 0, "0", fmt.Errorf("failed to list shipments: %w", err)
	}
	total, err := s.repo.Tenant(ctx).CountShipments(ctx, countParams)
	if err != nil {
		return nil, 0, "0", fmt.Errorf("failed to count shipments: %w", err)
	}
	sumN, err := s.repo.Tenant(ctx).SumShipmentsTotalAmount(ctx, sumParams)
	totalAmountSum := "0"
	if err == nil {
		totalAmountSum = pgNumericToStr(sumN)
	}

	result := make([]*model.ShipmentResponse, 0, len(rows))
	for _, row := range rows {
		result = append(result, shipmentToResponse(row))
	}
	return result, total, totalAmountSum, nil
}

func (s *ShipmentS) UpdateShipment(ctx context.Context, id string, req *model.UpdateShipmentRequest) (*model.ShipmentResponse, error) {
	shipmentID, err := uuid.Parse(id)
	if err != nil {
		return nil, fmt.Errorf("invalid shipment id: %w", err)
	}

	// Load current state to detect status transitions
	current, err := s.repo.Tenant(ctx).GetShipmentByID(ctx, shipmentID)
	if err != nil {
		return nil, fmt.Errorf("shipment not found: %w", err)
	}

	// Update header fields
	params := pg.UpdateShipmentParams{ID: shipmentID}
	if req.Date != nil {
		if t, err := time.Parse(time.RFC3339, *req.Date); err == nil {
			params.Date = pgtype.Timestamp{Time: t, Valid: true}
		}
	}
	if req.StorageID != nil {
		if id2, err := uuid.Parse(*req.StorageID); err == nil {
			params.StorageID = pgtype.UUID{Bytes: id2, Valid: true}
		}
	}
	if req.SupplierID != nil {
		if id2, err := uuid.Parse(*req.SupplierID); err == nil {
			params.SupplierID = pgtype.UUID{Bytes: id2, Valid: true}
		}
	}
	if req.Description != nil {
		params.Description = req.Description
	}
	row, err := s.repo.Tenant(ctx).UpdateShipment(ctx, params)
	if err != nil {
		return nil, fmt.Errorf("failed to update shipment: %w", err)
	}

	// If active and storage changed (no status transition), reverse old stock and deduct from new
	if current.Status == pg.ShipmentStatusActive && req.Status == nil && req.StorageID != nil &&
		current.StorageID.Valid && row.StorageID.Valid &&
		current.StorageID.Bytes != row.StorageID.Bytes {
		shipmentDate := pgtype.Timestamptz{}
		if row.Date.Valid {
			shipmentDate = pgtype.Timestamptz{Time: row.Date.Time.In(time.UTC), Valid: true}
		}
		if err := s.reverseStock(ctx, shipmentID, current.StorageID, string(pg.ShipmentStorageChangeOut), shipmentDate); err != nil {
			return nil, err
		}
		if err := s.deductStock(ctx, shipmentID, row.StorageID, "shipment_storage_change_out", shipmentDate); err != nil {
			return nil, err
		}
	}

	// Handle status transitions
	if req.Status != nil {
		newStatus := pg.ShipmentStatus(*req.Status)
		if current.Status == pg.ShipmentStatusDraft && newStatus == pg.ShipmentStatusActive {
			// draft → active: validate and deduct stock
			if !row.StorageID.Valid {
				return nil, fmt.Errorf("shipment must have a storage selected before activating")
			}
			items, err := s.repo.Tenant(ctx).GetShipmentItemsByShipmentID(ctx, shipmentID)
			if err != nil || len(items) == 0 {
				return nil, fmt.Errorf("shipment has no items")
			}
			shipmentDate := pgtype.Timestamptz{}
			if row.Date.Valid {
				shipmentDate = pgtype.Timestamptz{Time: row.Date.Time.In(time.UTC), Valid: true}
			}
			if err := s.deductStock(ctx, shipmentID, row.StorageID, "shipment_out", shipmentDate); err != nil {
				return nil, err
			}
			activated, err := s.repo.Tenant(ctx).ActivateShipment(ctx, shipmentID)
			if err != nil {
				return nil, fmt.Errorf("failed to activate shipment: %w", err)
			}
			row = activated
		} else if current.Status == pg.ShipmentStatusActive && newStatus == pg.ShipmentStatusDraft {
			// active → draft: reverse stock
			if row.StorageID.Valid {
				shipmentDate := pgtype.Timestamptz{}
				if row.Date.Valid {
					shipmentDate = pgtype.Timestamptz{Time: row.Date.Time.In(time.UTC), Valid: true}
				}
				if err := s.reverseStock(ctx, shipmentID, row.StorageID, string(pg.ShipmentDeactivatedIn), shipmentDate); err != nil {
					return nil, err
				}
			}
			deactivated, err := s.repo.Tenant(ctx).DeactivateShipment(ctx, shipmentID)
			if err != nil {
				return nil, fmt.Errorf("failed to deactivate shipment: %w", err)
			}
			row = deactivated
		}
	}

	return shipmentToResponse(row), nil
}


func (s *ShipmentS) DeleteShipment(ctx context.Context, id string) error {
	shipmentID, err := uuid.Parse(id)
	if err != nil {
		return fmt.Errorf("invalid shipment id: %w", err)
	}

	shipment, err := s.repo.Tenant(ctx).GetShipmentByID(ctx, shipmentID)
	if err != nil {
		return fmt.Errorf("shipment not found: %w", err)
	}

	// Reverse stock if active
	if shipment.Status == pg.ShipmentStatusActive && shipment.StorageID.Valid {
		shipmentDate := pgtype.Timestamptz{}
		if shipment.Date.Valid {
			shipmentDate = pgtype.Timestamptz{Time: shipment.Date.Time.In(time.UTC), Valid: true}
		}
		_ = s.reverseStock(ctx, shipmentID, shipment.StorageID, string(pg.ShipmentDeletedIn), shipmentDate)
	}

	return s.repo.Tenant(ctx).DeleteShipment(ctx, shipmentID)
}

func (s *ShipmentS) UpsertShipmentItems(ctx context.Context, shipmentID string, req *model.UpsertShipmentItemsRequest) ([]model.ShipmentItemResponse, error) {
	sID, err := uuid.Parse(shipmentID)
	if err != nil {
		return nil, fmt.Errorf("invalid shipment id: %w", err)
	}
	shipment, err := s.repo.Tenant(ctx).GetShipmentByID(ctx, sID)
	if err != nil {
		return nil, fmt.Errorf("shipment not found: %w", err)
	}

	// Build a map of existing items (ingredient_id → old quantity) for active shipments
	oldQtyMap := make(map[uuid.UUID]pgtype.Numeric)
	if shipment.Status == pg.ShipmentStatusActive {
		existing, _ := s.repo.Tenant(ctx).GetShipmentItemsByShipmentID(ctx, sID)
		for _, ex := range existing {
			oldQtyMap[ex.IngredientID] = ex.Quantity
		}
	}

	results := make([]model.ShipmentItemResponse, 0, len(req.Items))
	for _, r := range req.Items {
		resp, err := s.upsertOneItem(ctx, sID, shipment, &r, oldQtyMap)
		if err != nil {
			return nil, err
		}
		results = append(results, *resp)
	}

	if err := s.recalcShipmentTotal(ctx, sID); err != nil {
		return nil, err
	}
	return results, nil
}

// upsertOneItem saves a single item. For active shipments, immediately adjusts stock.
func (s *ShipmentS) upsertOneItem(ctx context.Context, sID uuid.UUID, shipment pg.Shipment, req *model.UpsertShipmentItemRequest, oldQtyMap map[uuid.UUID]pgtype.Numeric) (*model.ShipmentItemResponse, error) {
	// Convert shipment date to timestamptz for effective_at
	var shipmentDate pgtype.Timestamptz
	if shipment.Date.Valid {
		shipmentDate = pgtype.Timestamptz{Time: shipment.Date.Time.In(time.UTC), Valid: true}
	}

	iID, err := uuid.Parse(req.IngredientID)
	if err != nil {
		return nil, fmt.Errorf("invalid ingredient id: %w", err)
	}
	qty := pgtype.Numeric{}
	if err := qty.Scan(req.Quantity); err != nil {
		return nil, fmt.Errorf("invalid quantity: %w", err)
	}
	ing, err := s.repo.Tenant(ctx).GetIngredientByID(ctx, iID)
	if err != nil {
		return nil, fmt.Errorf("ingredient not found: %w", err)
	}
	price := pgtype.Numeric{}
	if ing.PricePerUnit.Valid {
		price = ing.PricePerUnit
	} else {
		_ = price.Scan("0")
	}
	item, err := s.repo.Tenant(ctx).UpsertShipmentItem(ctx, pg.UpsertShipmentItemParams{
		ShipmentID:   sID,
		IngredientID: iID,
		Quantity:     qty,
		PricePerUnit: price,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to upsert shipment item: %w", err)
	}

	resp := shipmentItemToResponse(item)

	if shipment.Status == pg.ShipmentStatusActive && shipment.StorageID.Valid {
		// Ensure stock row exists
		stockID, err := s.repo.Tenant(ctx).EnsureIngredientStockByStorage(ctx, pg.EnsureIngredientStockByStorageParams{
			ID:           uuid.New(),
			IngredientID: iID,
			StorageID:    shipment.StorageID,
		})
		if err != nil {
			return nil, fmt.Errorf("failed to ensure stock row: %w", err)
		}

		zero := pgtype.Numeric{}
		_ = zero.Scan("0")
		srcType := "shipment_item_upsert"
		srcID := sID

		// If item previously existed, reverse its old deduction first
		if oldQty, existed := oldQtyMap[iID]; existed {
			locked, err := s.repo.Tenant(ctx).GetStockByIngredientAndStorageForUpdate(ctx, pg.GetStockByIngredientAndStorageForUpdateParams{
				IngredientID: iID,
				StorageID:    shipment.StorageID,
			})
			if err != nil {
				return nil, fmt.Errorf("failed to lock stock row: %w", err)
			}
			restored, err := s.repo.Tenant(ctx).AddToIngredientStock(ctx, pg.AddToIngredientStockParams{
				ID:       stockID,
				Quantity: oldQty,
			})
			if err != nil {
				return nil, fmt.Errorf("failed to restore old stock: %w", err)
			}
			var effectiveAt *pgtype.Timestamptz
			if shipmentDate.Valid && !shipmentDate.Time.After(time.Now()) {
				effectiveAt = &shipmentDate
			}
			_ = s.repo.Tenant(ctx).InsertIngredientStockMovement(ctx, pg.InsertIngredientStockMovementParams{
				ID:           uuid.New(),
				StorageID:    uuid.UUID(shipment.StorageID.Bytes),
				IngredientID: iID,
				EventType:    string(pg.ShipmentItemUpdateReverse),
				QtyIn:        oldQty,
				QtyOut:       zero,
				StockBefore:  locked.Quantity,
				StockAfter:   restored.Quantity,
				PricePerUnit: price,
				SourceType:   &srcType,
				SourceID:     &srcID,
				EffectiveAt:  effectiveAt,
			})
		}

		// Deduct new quantity
		locked, err := s.repo.Tenant(ctx).GetStockByIngredientAndStorageForUpdate(ctx, pg.GetStockByIngredientAndStorageForUpdateParams{
			IngredientID: iID,
			StorageID:    shipment.StorageID,
		})
		if err != nil {
			return nil, fmt.Errorf("failed to lock stock row: %w", err)
		}
		updated, err := s.repo.Tenant(ctx).RemoveFromIngredientStock(ctx, pg.RemoveFromIngredientStockParams{
			ID:       stockID,
			Quantity: qty,
		})
		if err != nil {
			return nil, fmt.Errorf("failed to deduct stock: %w", err)
		}
		if _, err := s.repo.Tenant(ctx).UpdateShipmentItemStockSnapshot(ctx, pg.UpdateShipmentItemStockSnapshotParams{
			ID:          item.ID,
			StockBefore: locked.Quantity,
			StockAfter:  updated.Quantity,
		}); err != nil {
			return nil, fmt.Errorf("failed to save stock snapshot: %w", err)
		}
		_ = s.repo.Tenant(ctx).InsertIngredientStockMovement(ctx, pg.InsertIngredientStockMovementParams{
			ID:           uuid.New(),
			StorageID:    uuid.UUID(shipment.StorageID.Bytes),
			IngredientID: iID,
			EventType:    string(pg.ShipmentOut),
			QtyIn:        zero,
			QtyOut:       qty,
			StockBefore:  locked.Quantity,
			StockAfter:   updated.Quantity,
			PricePerUnit: price,
			SourceType:   &srcType,
			SourceID:     &srcID,
		})
		resp.StockBefore = pgNumericToStr(locked.Quantity)
		resp.StockAfter = pgNumericToStr(updated.Quantity)
	} else if shipment.StorageID.Valid {
		// Draft: show live preview only
		stock, err := s.repo.Tenant(ctx).GetStockByIngredientAndStorage(ctx, pg.GetStockByIngredientAndStorageParams{
			IngredientID: iID,
			StorageID:    shipment.StorageID,
		})
		currentQty := 0.0
		if err == nil {
			resp.StockBefore = pgNumericToStr(stock.Quantity)
			v, _ := stock.Quantity.Float64Value()
			currentQty = v.Float64
		} else {
			resp.StockBefore = "0"
		}
		itemQty, _ := item.Quantity.Float64Value()
		projected := currentQty - itemQty.Float64
		projN := pgtype.Numeric{}
		_ = projN.Scan(fmt.Sprintf("%g", projected))
		resp.StockAfter = pgNumericToStr(projN)
	}
	return &resp, nil
}

func (s *ShipmentS) DeleteShipmentItem(ctx context.Context, itemID string) error {
	id, err := uuid.Parse(itemID)
	if err != nil {
		return fmt.Errorf("invalid item id: %w", err)
	}
	item, err := s.repo.Tenant(ctx).GetShipmentItemByID(ctx, id)
	if err != nil {
		return fmt.Errorf("item not found: %w", err)
	}

	// If the shipment is active, reverse this item's stock contribution
	shipment, err := s.repo.Tenant(ctx).GetShipmentByID(ctx, item.ShipmentID)
	if err == nil && shipment.Status == pg.ShipmentStatusActive && shipment.StorageID.Valid {
		// Convert shipment date to timestamptz for effective_at
		var shipmentDate pgtype.Timestamptz
		if shipment.Date.Valid {
			shipmentDate = pgtype.Timestamptz{Time: shipment.Date.Time.In(time.UTC), Valid: true}
		}

		stockID, err := s.repo.Tenant(ctx).EnsureIngredientStockByStorage(ctx, pg.EnsureIngredientStockByStorageParams{
			ID:           uuid.New(),
			IngredientID: item.IngredientID,
			StorageID:    shipment.StorageID,
		})
		if err == nil {
			locked, err := s.repo.Tenant(ctx).GetStockByIngredientAndStorageForUpdate(ctx, pg.GetStockByIngredientAndStorageForUpdateParams{
				IngredientID: item.IngredientID,
				StorageID:    shipment.StorageID,
			})
			if err == nil {
				updated, err := s.repo.Tenant(ctx).AddToIngredientStock(ctx, pg.AddToIngredientStockParams{
					ID:       stockID,
					Quantity: item.Quantity,
				})
				if err == nil {
					zero := pgtype.Numeric{}
					_ = zero.Scan("0")
					srcType := "shipment_item_deleted"
					srcID := item.ShipmentID
					var effectiveAt *pgtype.Timestamptz
					if shipmentDate.Valid && !shipmentDate.Time.After(time.Now()) {
						effectiveAt = &shipmentDate
					}
					_ = s.repo.Tenant(ctx).InsertIngredientStockMovement(ctx, pg.InsertIngredientStockMovementParams{
						ID:           uuid.New(),
						StorageID:    uuid.UUID(shipment.StorageID.Bytes),
						IngredientID: item.IngredientID,
						EventType:    string(pg.ShipmentItemDeletedIn),
						QtyIn:        item.Quantity,
						QtyOut:       zero,
						StockBefore:  locked.Quantity,
						StockAfter:   updated.Quantity,
						PricePerUnit: item.PricePerUnit,
						SourceType:   &srcType,
						SourceID:     &srcID,
						EffectiveAt:  effectiveAt,
					})
				}
			}
		}
	}

	if err := s.repo.Tenant(ctx).DeleteShipmentItem(ctx, id); err != nil {
		return fmt.Errorf("failed to delete shipment item: %w", err)
	}
	return s.recalcShipmentTotal(ctx, item.ShipmentID)
}

func (s *ShipmentS) recalcShipmentTotal(ctx context.Context, shipmentID uuid.UUID) error {
	items, err := s.repo.Tenant(ctx).GetShipmentItemsByShipmentID(ctx, shipmentID)
	if err != nil {
		return fmt.Errorf("failed to get items for total recalc: %w", err)
	}
	var total float64
	for _, item := range items {
		f, _ := item.TotalAmount.Float64Value()
		total += f.Float64
	}
	totalN := pgtype.Numeric{}
	if err := totalN.Scan(fmt.Sprintf("%.2f", total)); err != nil {
		return err
	}
	_, err = s.repo.Tenant(ctx).UpdateShipmentTotalAmount(ctx, pg.UpdateShipmentTotalAmountParams{
		ID:          shipmentID,
		TotalAmount: totalN,
	})
	return err
}

// deductStock removes ingredient quantities from stock for an active shipment.
func (s *ShipmentS) deductStock(ctx context.Context, shipmentID uuid.UUID, storageID pgtype.UUID, eventType string, shipmentDate pgtype.Timestamptz) error {
	items, err := s.repo.Tenant(ctx).GetShipmentItemsByShipmentID(ctx, shipmentID)
	if err != nil {
		return fmt.Errorf("failed to get shipment items: %w", err)
	}
	zero := pgtype.Numeric{}
	_ = zero.Scan("0")
	srcType := string(pg.ShipmentOut)

	var effectiveAt *pgtype.Timestamptz
	if shipmentDate.Valid && !shipmentDate.Time.After(time.Now()) {
		effectiveAt = &shipmentDate
	}

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

		if _, err := s.repo.Tenant(ctx).UpdateShipmentItemStockSnapshot(ctx, pg.UpdateShipmentItemStockSnapshotParams{
			ID:          item.ID,
			StockBefore: locked.Quantity,
			StockAfter:  updated.Quantity,
		}); err != nil {
			return fmt.Errorf("failed to save stock snapshot: %w", err)
		}

		_ = s.repo.Tenant(ctx).InsertIngredientStockMovement(ctx, pg.InsertIngredientStockMovementParams{
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
			SourceID:     &shipmentID,
			EffectiveAt:  effectiveAt,
		})
	}
	return nil
}

// reverseStock adds back ingredient quantities when an active shipment is deactivated or deleted.
func (s *ShipmentS) reverseStock(ctx context.Context, shipmentID uuid.UUID, storageID pgtype.UUID, eventType string, shipmentDate pgtype.Timestamptz) error {
	items, err := s.repo.Tenant(ctx).GetShipmentItemsByShipmentID(ctx, shipmentID)
	if err != nil {
		return fmt.Errorf("failed to get shipment items: %w", err)
	}
	zero := pgtype.Numeric{}
	_ = zero.Scan("0")
	srcType := eventType

	for _, item := range items {
		stockID, err := s.repo.Tenant(ctx).EnsureIngredientStockByStorage(ctx, pg.EnsureIngredientStockByStorageParams{
			ID:           uuid.New(),
			IngredientID: item.IngredientID,
			StorageID:    storageID,
		})
		if err != nil {
			continue
		}
		locked, err := s.repo.Tenant(ctx).GetStockByIngredientAndStorageForUpdate(ctx, pg.GetStockByIngredientAndStorageForUpdateParams{
			IngredientID: item.IngredientID,
			StorageID:    storageID,
		})
		if err != nil {
			continue
		}
		updated, err := s.repo.Tenant(ctx).AddToIngredientStock(ctx, pg.AddToIngredientStockParams{
			ID:       stockID,
			Quantity: item.Quantity,
		})
		if err != nil {
			continue
		}
		_ = s.repo.Tenant(ctx).InsertIngredientStockMovement(ctx, pg.InsertIngredientStockMovementParams{
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
			SourceID:     &shipmentID,
		})
	}
	return nil
}

// ── helpers ──────────────────────────────────────────────────────────────────

func shipmentToResponse(row pg.Shipment) *model.ShipmentResponse {
	shipStatus := model.ShipmentStatus(row.Status)
	if row.DeletedAt != nil && *row.DeletedAt > 0 {
		shipStatus = "deleted"
	}
	r := &model.ShipmentResponse{
		ID:          row.ID.String(),
		Number:      row.Number,
		Status:      shipStatus,
		TotalAmount: pgNumericToStr(row.TotalAmount),
		PaidAmount:  pgNumericToStr(row.PaidAmount),
	}
	if row.Date.Valid {
		t := row.Date.Time
		r.Date = &t
	}
	if row.StorageID.Valid {
		s := uuid.UUID(row.StorageID.Bytes).String()
		r.StorageID = &s
	}
	if row.SupplierID.Valid {
		s := uuid.UUID(row.SupplierID.Bytes).String()
		r.SupplierID = &s
	}
	if row.BranchID.Valid {
		s := uuid.UUID(row.BranchID.Bytes).String()
		r.BranchID = &s
	}
	r.Description = row.Description
	if row.CreatedAt.Valid {
		t := row.CreatedAt.Time
		r.CreatedAt = &t
	}
	if row.UpdatedAt.Valid {
		t := row.UpdatedAt.Time
		r.UpdatedAt = &t
	}
	return r
}

func shipmentItemToResponse(row pg.ShipmentItem) model.ShipmentItemResponse {
	r := model.ShipmentItemResponse{
		ID:           row.ID.String(),
		ShipmentID:   row.ShipmentID.String(),
		IngredientID: row.IngredientID.String(),
		Quantity:     pgNumericToStr(row.Quantity),
		PricePerUnit: pgNumericToStr(row.PricePerUnit),
		TotalAmount:  pgNumericToStr(row.TotalAmount),
		StockBefore:  pgNumericToStr(row.StockBefore),
		StockAfter:   pgNumericToStr(row.StockAfter),
	}
	if row.CreatedAt.Valid {
		t := row.CreatedAt.Time
		r.CreatedAt = &t
	}
	if row.UpdatedAt.Valid {
		t := row.UpdatedAt.Time
		r.UpdatedAt = &t
	}
	return r
}

func pgNumericToStr(n pgtype.Numeric) string {
	if !n.Valid {
		return "0"
	}
	if n.NaN {
		return "0"
	}
	if n.Int == nil {
		return "0"
	}
	// Use big.Rat for exact decimal representation (no scientific notation)
	rat := new(big.Rat).SetInt(n.Int)
	if n.Exp > 0 {
		mul := new(big.Int).Exp(big.NewInt(10), big.NewInt(int64(n.Exp)), nil)
		rat.Mul(rat, new(big.Rat).SetInt(mul))
	} else if n.Exp < 0 {
		div := new(big.Int).Exp(big.NewInt(10), big.NewInt(int64(-n.Exp)), nil)
		rat.Quo(rat, new(big.Rat).SetInt(div))
	}
	// Format as decimal string without scientific notation
	s := rat.FloatString(10) // up to 10 decimal places
	// Trim trailing zeros after decimal point
	if strings.Contains(s, ".") {
		s = strings.TrimRight(s, "0")
		s = strings.TrimRight(s, ".")
	}
	return s
}
