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

type shipmentTouchedKey struct {
	StorageID    uuid.UUID
	IngredientID uuid.UUID
}

func shipmentEffectiveAt(ts pgtype.Timestamptz) *pgtype.Timestamptz {
	if !ts.Valid {
		return nil
	}
	effective := pgtype.Timestamptz{
		Time:  ts.Time.In(time.UTC),
		Valid: true,
	}
	return &effective
}

func shipmentFreezeDate(ts pgtype.Timestamp, entityName string) (time.Time, error) {
	if !ts.Valid {
		return time.Time{}, fmt.Errorf("%s date is required for inventory freeze check", entityName)
	}
	return ts.Time, nil
}

func assertCanMutateShipmentCurrent(ctx context.Context, q *pg.Queries, sh pg.Shipment, entityName string) error {
	if !sh.StorageID.Valid {
		return nil
	}

	effectiveAt, err := shipmentFreezeDate(sh.Date, entityName)
	if err != nil {
		return err
	}

	return assertCanMutateAfterInventory(ctx, q, sh.StorageID.Bytes, effectiveAt, entityName)
}

func assertCanMutateShipmentTarget(ctx context.Context, q *pg.Queries, storageID pgtype.UUID, shipmentDate pgtype.Timestamp, entityName string) error {
	if !storageID.Valid {
		return nil
	}

	effectiveAt, err := shipmentFreezeDate(shipmentDate, entityName)
	if err != nil {
		return err
	}

	return assertCanMutateAfterInventory(ctx, q, storageID.Bytes, effectiveAt, entityName)
}

func assertCanMutateShipmentChange(ctx context.Context, q *pg.Queries, current pg.Shipment, targetStorage pgtype.UUID, targetDate pgtype.Timestamp, entityName string) error {
	if err := assertCanMutateShipmentCurrent(ctx, q, current, entityName); err != nil {
		return err
	}

	if err := assertCanMutateShipmentTarget(ctx, q, targetStorage, targetDate, entityName); err != nil {
		return err
	}

	return nil
}

func (s *ShipmentS) rebalanceShipmentIngredientLedger(
	ctx context.Context,
	storageID pgtype.UUID,
	ingredientID uuid.UUID,
) error {
	q := s.repo.Tenant(ctx)
	return rebalanceIngredientStockLedger(ctx, q, storageID, ingredientID, "shipment")
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

	if err := assertCanMutateShipmentTarget(ctx, s.repo.Tenant(ctx), params.StorageID, params.Date, "shipment"); err != nil {
		return nil, err
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

		// draft bo'lsa stock preview / snapshot ko'rsatmaymiz
		if row.Status == pg.ShipmentStatusDraft {
			itemResponses = append(itemResponses, hideShipmentDraftStockSnapshot(resp, row.Status))
			continue
		}

		// snapshot save qilingan bo'lsa o'shani ko'rsatamiz, bo'lmasa fallback preview
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

	current, err := s.repo.Tenant(ctx).GetShipmentByID(ctx, shipmentID)
	if err != nil {
		return nil, fmt.Errorf("shipment not found: %w", err)
	}

	// Build effective target values first.
	effectiveDate := current.Date
	if req.Date != nil && strings.TrimSpace(*req.Date) != "" {
		t, err := time.Parse(time.RFC3339, strings.TrimSpace(*req.Date))
		if err != nil {
			return nil, fmt.Errorf("invalid date: %w", err)
		}
		effectiveDate = pgtype.Timestamp{Time: t, Valid: true}
	}

	effectiveStorage := current.StorageID
	if req.StorageID != nil && strings.TrimSpace(*req.StorageID) != "" {
		stID, err := uuid.Parse(strings.TrimSpace(*req.StorageID))
		if err != nil {
			return nil, fmt.Errorf("invalid storage_id: %w", err)
		}
		effectiveStorage = pgtype.UUID{Bytes: stID, Valid: true}
	}

	targetStatus := current.Status
	if req.Status != nil && strings.TrimSpace(*req.Status) != "" {
		targetStatus = pg.ShipmentStatus(strings.TrimSpace(*req.Status))
	}

	// Validate requested transition before any DB write.
	if req.Status != nil && strings.TrimSpace(*req.Status) != "" {
		switch {
		case current.Status == pg.ShipmentStatusDraft && targetStatus == pg.ShipmentStatusActive:
			// allowed
		case current.Status == pg.ShipmentStatusActive && targetStatus == pg.ShipmentStatusDraft:
			// allowed
		case current.Status == targetStatus:
			// no-op status update, allowed
		default:
			return nil, fmt.Errorf("invalid shipment status transition: %s -> %s", current.Status, targetStatus)
		}
	}

	// Historical lock check for both current and target state.
	if err := assertCanMutateShipmentChange(ctx, s.repo.Tenant(ctx), current, effectiveStorage, effectiveDate, "shipment"); err != nil {
		return nil, err
	}

	// Build update params for header fields only.
	params := pg.UpdateShipmentParams{ID: shipmentID}
	if effectiveDate.Valid {
		params.Date = effectiveDate
	}
	if effectiveStorage.Valid {
		params.StorageID = effectiveStorage
	}

	if req.SupplierID != nil && strings.TrimSpace(*req.SupplierID) != "" {
		supplierID, err := uuid.Parse(strings.TrimSpace(*req.SupplierID))
		if err != nil {
			return nil, fmt.Errorf("invalid supplier_id: %w", err)
		}
		params.SupplierID = pgtype.UUID{Bytes: supplierID, Valid: true}
	}

	if req.Description != nil {
		params.Description = req.Description
	}

	row, err := s.repo.Tenant(ctx).UpdateShipment(ctx, params)
	if err != nil {
		return nil, fmt.Errorf("failed to update shipment: %w", err)
	}

	sameStorage := current.StorageID.Valid == row.StorageID.Valid &&
		(!current.StorageID.Valid || current.StorageID.Bytes == row.StorageID.Bytes)

	dateChanged := current.Date.Valid &&
		row.Date.Valid &&
		!current.Date.Time.Equal(row.Date.Time)

	switch {
	// draft -> active
	case current.Status == pg.ShipmentStatusDraft && targetStatus == pg.ShipmentStatusActive:
		if !row.StorageID.Valid {
			return nil, fmt.Errorf("shipment must have a storage selected before activating")
		}

		items, err := s.repo.Tenant(ctx).GetShipmentItemsByShipmentID(ctx, shipmentID)
		if err != nil {
			return nil, fmt.Errorf("failed to get shipment items: %w", err)
		}
		if len(items) == 0 {
			return nil, fmt.Errorf("shipment has no items")
		}

		shipmentDate := pgtype.Timestamptz{}
		if row.Date.Valid {
			shipmentDate = pgtype.Timestamptz{
				Time:  row.Date.Time.In(time.UTC),
				Valid: true,
			}
		}

		if err := s.deductStock(ctx, shipmentID, row.StorageID, "shipment_out", shipmentDate); err != nil {
			return nil, fmt.Errorf("failed to deduct stock on shipment activation: %w", err)
		}

		activated, err := s.repo.Tenant(ctx).ActivateShipment(ctx, shipmentID)
		if err != nil {
			return nil, fmt.Errorf("failed to activate shipment: %w", err)
		}
		row = activated

	// active -> draft
	case current.Status == pg.ShipmentStatusActive && targetStatus == pg.ShipmentStatusDraft:
		if current.StorageID.Valid {
			oldShipmentDate := pgtype.Timestamptz{}
			if current.Date.Valid {
				oldShipmentDate = pgtype.Timestamptz{
					Time:  current.Date.Time.In(time.UTC),
					Valid: true,
				}
			}

			if err := s.reverseStock(ctx, shipmentID, current.StorageID, "shipment_deactivated", oldShipmentDate); err != nil {
				return nil, fmt.Errorf("failed to reverse stock on shipment deactivation: %w", err)
			}
		}

		deactivated, err := s.repo.Tenant(ctx).DeactivateShipment(ctx, shipmentID)
		if err != nil {
			return nil, fmt.Errorf("failed to deactivate shipment: %w", err)
		}
		row = deactivated

	// active -> active with storage change
	case current.Status == pg.ShipmentStatusActive && targetStatus == pg.ShipmentStatusActive && !sameStorage:
		if !current.StorageID.Valid {
			return nil, fmt.Errorf("current active shipment has no storage_id")
		}
		if !row.StorageID.Valid {
			return nil, fmt.Errorf("updated active shipment has no storage_id")
		}

		oldShipmentDate := pgtype.Timestamptz{}
		if current.Date.Valid {
			oldShipmentDate = pgtype.Timestamptz{
				Time:  current.Date.Time.In(time.UTC),
				Valid: true,
			}
		}

		newShipmentDate := pgtype.Timestamptz{}
		if row.Date.Valid {
			newShipmentDate = pgtype.Timestamptz{
				Time:  row.Date.Time.In(time.UTC),
				Valid: true,
			}
		}

		if err := s.reverseStock(ctx, shipmentID, current.StorageID, "shipment_storage_change", oldShipmentDate); err != nil {
			return nil, fmt.Errorf("failed to reverse old storage on shipment storage change: %w", err)
		}

		if err := s.deductStock(ctx, shipmentID, row.StorageID, "shipment_storage_change_out", newShipmentDate); err != nil {
			return nil, fmt.Errorf("failed to deduct new storage on shipment storage change: %w", err)
		}

	// active -> active with same storage but date change
	case current.Status == pg.ShipmentStatusActive && targetStatus == pg.ShipmentStatusActive && sameStorage && dateChanged:
		if !current.StorageID.Valid {
			return nil, fmt.Errorf("current active shipment has no storage_id")
		}

		oldShipmentDate := pgtype.Timestamptz{}
		if current.Date.Valid {
			oldShipmentDate = pgtype.Timestamptz{
				Time:  current.Date.Time.In(time.UTC),
				Valid: true,
			}
		}

		newShipmentDate := pgtype.Timestamptz{}
		if row.Date.Valid {
			newShipmentDate = pgtype.Timestamptz{
				Time:  row.Date.Time.In(time.UTC),
				Valid: true,
			}
		}

		if err := s.reverseStock(ctx, shipmentID, current.StorageID, "shipment_date_change", oldShipmentDate); err != nil {
			return nil, fmt.Errorf("failed to reverse old shipment date contribution: %w", err)
		}

		if err := s.deductStock(ctx, shipmentID, row.StorageID, "shipment_date_change_out", newShipmentDate); err != nil {
			return nil, fmt.Errorf("failed to deduct shipment on new date: %w", err)
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
	if err := assertCanMutateShipmentCurrent(ctx, s.repo.Tenant(ctx), shipment, "shipment"); err != nil {
		return err
	}

	// Reverse stock if active
	if shipment.Status == pg.ShipmentStatusActive && shipment.StorageID.Valid {
		shipmentDate := pgtype.Timestamptz{}
		if shipment.Date.Valid {
			shipmentDate = pgtype.Timestamptz{Time: shipment.Date.Time.In(time.UTC), Valid: true}
		}
		if err := s.reverseStock(ctx, shipmentID, shipment.StorageID, "shipment_deleted", shipmentDate); err != nil {
			return fmt.Errorf("failed to reverse stock before deleting shipment: %w", err)
		}
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

	if err := assertCanMutateShipmentCurrent(ctx, s.repo.Tenant(ctx), shipment, "shipment items"); err != nil {
		return nil, err
	}

	// active shipment uchun old qty map kerak
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
func (s *ShipmentS) upsertOneItem(
	ctx context.Context,
	sID uuid.UUID,
	shipment pg.Shipment,
	req *model.UpsertShipmentItemRequest,
	oldQtyMap map[uuid.UUID]pgtype.Numeric,
) (*model.ShipmentItemResponse, error) {
	// Convert shipment date to timestamptz for effective_at
	var shipmentDate pgtype.Timestamptz
	if shipment.Date.Valid {
		shipmentDate = pgtype.Timestamptz{
			Time:  shipment.Date.Time.In(time.UTC),
			Valid: true,
		}
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
	_ = price.Scan("0")
	if ing.PricePerUnit.Valid {
		price = ing.PricePerUnit
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

	// draft bo'lsa stock preview / snapshotni umuman ko'rsatmaymiz
	if shipment.Status == pg.ShipmentStatusDraft {
		resp = hideShipmentDraftStockSnapshot(resp, shipment.Status)
		return &resp, nil
	}

	// Active shipment bo'lsa stockni real-time adjust qilamiz
	if shipment.Status == pg.ShipmentStatusActive && shipment.StorageID.Valid {
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

		// old item bo'lsa avval eski deductionni qaytaramiz
		if oldQty, ok := oldQtyMap[iID]; ok {
			locked, err := s.repo.Tenant(ctx).GetStockByIngredientAndStorageForUpdate(ctx, pg.GetStockByIngredientAndStorageForUpdateParams{
				IngredientID: iID,
				StorageID:    shipment.StorageID,
			})
			if err != nil {
				return nil, fmt.Errorf("failed to lock stock row for old qty reverse: %w", err)
			}

			restored, err := s.repo.Tenant(ctx).AddToIngredientStock(ctx, pg.AddToIngredientStockParams{
				ID:       stockID,
				Quantity: oldQty,
			})
			if err != nil {
				return nil, fmt.Errorf("failed to restore old shipment qty: %w", err)
			}

			if !shouldSkipStockMovement(oldQty, zero) {
				if err := s.repo.Tenant(ctx).InsertIngredientStockMovement(ctx, pg.InsertIngredientStockMovementParams{
					ID:           uuid.New(),
					StorageID:    uuid.UUID(shipment.StorageID.Bytes),
					IngredientID: iID,
					EventType:    "shipment_item_update_in",
					QtyIn:        oldQty,
					QtyOut:       zero,
					StockBefore:  locked.Quantity,
					StockAfter:   restored.Quantity,
					PricePerUnit: price,
					SourceType:   &srcType,
					SourceID:     &srcID,
					EffectiveAt:  shipmentEffectiveAt(shipmentDate),
				}); err != nil {
					return nil, fmt.Errorf("failed to insert old qty reverse movement: %w", err)
				}
			}
		}

		locked, err := s.repo.Tenant(ctx).GetStockByIngredientAndStorageForUpdate(ctx, pg.GetStockByIngredientAndStorageForUpdateParams{
			IngredientID: iID,
			StorageID:    shipment.StorageID,
		})
		if err != nil {
			return nil, fmt.Errorf("failed to lock stock row for new qty deduct: %w", err)
		}

		updated, err := s.repo.Tenant(ctx).RemoveFromIngredientStock(ctx, pg.RemoveFromIngredientStockParams{
			ID:       stockID,
			Quantity: qty,
		})
		if err != nil {
			return nil, fmt.Errorf("failed to deduct shipment qty: %w", err)
		}

		item, err = s.repo.Tenant(ctx).UpdateShipmentItemStockSnapshot(ctx, pg.UpdateShipmentItemStockSnapshotParams{
			ID:          item.ID,
			StockBefore: locked.Quantity,
			StockAfter:  updated.Quantity,
		})
		if err != nil {
			return nil, fmt.Errorf("failed to save shipment item stock snapshot: %w", err)
		}

		if !shouldSkipStockMovement(zero, qty) {
			if err := s.repo.Tenant(ctx).InsertIngredientStockMovement(ctx, pg.InsertIngredientStockMovementParams{
				ID:           uuid.New(),
				StorageID:    uuid.UUID(shipment.StorageID.Bytes),
				IngredientID: iID,
				EventType:    "shipment_item_update_out",
				QtyIn:        zero,
				QtyOut:       qty,
				StockBefore:  locked.Quantity,
				StockAfter:   updated.Quantity,
				PricePerUnit: price,
				SourceType:   &srcType,
				SourceID:     &srcID,
				EffectiveAt:  shipmentEffectiveAt(shipmentDate),
			}); err != nil {
				return nil, fmt.Errorf("failed to insert new qty deduct movement: %w", err)
			}
		}

		if err := s.rebalanceShipmentIngredientLedger(
			ctx,
			pgtype.UUID{Bytes: shipment.StorageID.Bytes, Valid: true},
			iID,
		); err != nil {
			return nil, fmt.Errorf("failed to rebalance shipment item upsert ledger: %w", err)
		}

		resp = shipmentItemToResponse(item)
		return &resp, nil
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

	shipment, err := s.repo.Tenant(ctx).GetShipmentByID(ctx, item.ShipmentID)
	if err != nil {
		return fmt.Errorf("failed to get shipment: %w", err)
	}

	if err := assertCanMutateShipmentCurrent(ctx, s.repo.Tenant(ctx), shipment, "shipment item"); err != nil {
		return err
	}

	// If shipment is active, reverse this item's stock contribution before deleting it.
	if shipment.Status == pg.ShipmentStatusActive && shipment.StorageID.Valid {
		storageID := shipment.StorageID
		effectiveAt := shipmentEffectiveAt(pgtype.Timestamptz{
			Time:  shipment.Date.Time.In(time.UTC),
			Valid: shipment.Date.Valid,
		})

		zero := inventoryZeroNumeric()
		srcType := "shipment_item_deleted"
		srcID := item.ShipmentID

		stockID, err := s.repo.Tenant(ctx).EnsureIngredientStockByStorage(ctx, pg.EnsureIngredientStockByStorageParams{
			ID:           uuid.New(),
			IngredientID: item.IngredientID,
			StorageID:    storageID,
		})
		if err != nil {
			return fmt.Errorf("failed to ensure stock row during shipment item delete: %w", err)
		}

		locked, err := s.repo.Tenant(ctx).GetStockByIngredientAndStorageForUpdate(ctx, pg.GetStockByIngredientAndStorageForUpdateParams{
			IngredientID: item.IngredientID,
			StorageID:    storageID,
		})
		if err != nil {
			return fmt.Errorf("failed to lock stock row during shipment item delete: %w", err)
		}

		updated, err := s.repo.Tenant(ctx).AddToIngredientStock(ctx, pg.AddToIngredientStockParams{
			ID:       stockID,
			Quantity: item.Quantity,
		})
		if err != nil {
			return fmt.Errorf("failed to restore stock during shipment item delete: %w", err)
		}

		if !shouldSkipStockMovement(item.Quantity, zero) {
			if err := s.repo.Tenant(ctx).InsertIngredientStockMovement(ctx, pg.InsertIngredientStockMovementParams{
				ID:           uuid.New(),
				StorageID:    uuid.UUID(storageID.Bytes),
				IngredientID: item.IngredientID,
				EventType:    "shipment_item_deleted_in",
				QtyIn:        item.Quantity,
				QtyOut:       zero,
				StockBefore:  locked.Quantity,
				StockAfter:   updated.Quantity,
				PricePerUnit: item.PricePerUnit,
				SourceType:   &srcType,
				SourceID:     &srcID,
				EffectiveAt:  effectiveAt,
			}); err != nil {
				return fmt.Errorf("failed to insert shipment item delete reverse movement: %w", err)
			}

			if err := s.rebalanceShipmentIngredientLedger(
				ctx,
				pgtype.UUID{Bytes: storageID.Bytes, Valid: true},
				item.IngredientID,
			); err != nil {
				return fmt.Errorf("failed to rebalance shipment item delete ledger: %w", err)
			}
		}
	}

	if err := s.repo.Tenant(ctx).DeleteShipmentItem(ctx, id); err != nil {
		return fmt.Errorf("failed to delete shipment item: %w", err)
	}

	if err := s.recalcShipmentTotal(ctx, item.ShipmentID); err != nil {
		return fmt.Errorf("failed to recalculate shipment total after item delete: %w", err)
	}

	return nil
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

	zero := inventoryZeroNumeric()
	srcType := "shipment"
	effectiveAt := shipmentEffectiveAt(shipmentDate)
	touched := make(map[shipmentTouchedKey]struct{})

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

		if shouldSkipStockMovement(zero, item.Quantity) {
			continue
		}

		if err := s.repo.Tenant(ctx).InsertIngredientStockMovement(ctx, pg.InsertIngredientStockMovementParams{
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
		}); err != nil {
			return fmt.Errorf("failed to insert shipment stock movement: %w", err)
		}

		touched[shipmentTouchedKey{
			StorageID:    storageID.Bytes,
			IngredientID: item.IngredientID,
		}] = struct{}{}
	}

	for key := range touched {
		if err := s.rebalanceShipmentIngredientLedger(ctx, pgtype.UUID{Bytes: key.StorageID, Valid: true}, key.IngredientID); err != nil {
			return fmt.Errorf("failed to rebalance shipment ledger: %w", err)
		}
	}

	return nil
}

// reverseStock adds back ingredient quantities when an active shipment is deactivated or deleted.
func (s *ShipmentS) reverseStock(ctx context.Context, shipmentID uuid.UUID, storageID pgtype.UUID, eventType string, shipmentDate pgtype.Timestamptz) error {
	items, err := s.repo.Tenant(ctx).GetShipmentItemsByShipmentID(ctx, shipmentID)
	if err != nil {
		return fmt.Errorf("failed to get shipment items: %w", err)
	}

	zero := inventoryZeroNumeric()
	srcType := eventType
	effectiveAt := shipmentEffectiveAt(shipmentDate)
	touched := make(map[shipmentTouchedKey]struct{})

	for _, item := range items {
		stockID, err := s.repo.Tenant(ctx).EnsureIngredientStockByStorage(ctx, pg.EnsureIngredientStockByStorageParams{
			ID:           uuid.New(),
			IngredientID: item.IngredientID,
			StorageID:    storageID,
		})
		if err != nil {
			return fmt.Errorf("failed to ensure stock row during shipment reverse: %w", err)
		}

		locked, err := s.repo.Tenant(ctx).GetStockByIngredientAndStorageForUpdate(ctx, pg.GetStockByIngredientAndStorageForUpdateParams{
			IngredientID: item.IngredientID,
			StorageID:    storageID,
		})
		if err != nil {
			return fmt.Errorf("failed to lock stock row during shipment reverse: %w", err)
		}

		updated, err := s.repo.Tenant(ctx).AddToIngredientStock(ctx, pg.AddToIngredientStockParams{
			ID:       stockID,
			Quantity: item.Quantity,
		})
		if err != nil {
			return fmt.Errorf("failed to restore stock during shipment reverse: %w", err)
		}

		if shouldSkipStockMovement(item.Quantity, zero) {
			continue
		}

		if err := s.repo.Tenant(ctx).InsertIngredientStockMovement(ctx, pg.InsertIngredientStockMovementParams{
			ID:           uuid.New(),
			StorageID:    uuid.UUID(storageID.Bytes),
			IngredientID: item.IngredientID,
			EventType:    eventType + "_in",
			QtyIn:        item.Quantity,
			QtyOut:       zero,
			StockBefore:  locked.Quantity,
			StockAfter:   updated.Quantity,
			PricePerUnit: item.PricePerUnit,
			SourceType:   &srcType,
			SourceID:     &shipmentID,
			EffectiveAt:  effectiveAt,
		}); err != nil {
			return fmt.Errorf("failed to insert shipment reverse movement: %w", err)
		}

		touched[shipmentTouchedKey{
			StorageID:    storageID.Bytes,
			IngredientID: item.IngredientID,
		}] = struct{}{}
	}

	for key := range touched {
		if err := s.rebalanceShipmentIngredientLedger(ctx, pgtype.UUID{Bytes: key.StorageID, Valid: true}, key.IngredientID); err != nil {
			return fmt.Errorf("failed to rebalance shipment reverse ledger: %w", err)
		}
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

func hideShipmentDraftStockSnapshot(resp model.ShipmentItemResponse, shipmentStatus pg.ShipmentStatus) model.ShipmentItemResponse {
	if shipmentStatus == pg.ShipmentStatus("draft") {
		resp.StockBefore = ""
		resp.StockAfter = ""
	}
	return resp
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
