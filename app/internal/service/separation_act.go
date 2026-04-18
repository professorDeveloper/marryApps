package service

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"

	"gitlab.yurtal.tech/company/maryai/back/internal/model"
	"gitlab.yurtal.tech/company/maryai/back/internal/repository"
	pg "gitlab.yurtal.tech/company/maryai/back/internal/repository/pg/tenantsdb"
)

type SeparationActI interface {
	CreateSeparationAct(ctx context.Context, req *model.CreateSeparationActRequest) (*model.SeparationActResponse, error)
	CreateSeparationActBatch(ctx context.Context, req *model.CreateSeparationActBatchRequest) (*model.SeparationActWithItemsResponse, error)
	GetSeparationAct(ctx context.Context, id string) (*model.SeparationActWithItemsResponse, error)
	ListSeparationActs(ctx context.Context, storageID, groupID, ingredientID, status *string, startDate, endDate *string, limit, offset int32) (*model.SeparationActListResponse, error)
	UpdateSeparationAct(ctx context.Context, id string, req *model.UpdateSeparationActRequest) (*model.SeparationActResponse, error)
	ConfirmSeparationAct(ctx context.Context, id string) (*model.SeparationActResponse, error)
	CancelSeparationAct(ctx context.Context, id string) (*model.SeparationActResponse, error)
	DeleteSeparationAct(ctx context.Context, id string) error
	UpsertSeparationActItems(ctx context.Context, actID string, req *model.UpsertSeparationActItemsRequest) ([]model.SeparationActItemResponse, error)
	DeleteSeparationActItem(ctx context.Context, itemID string) error
}

type SeparationActS struct {
	repo *repository.Repository
}

func NewSeparationActS(repo *repository.Repository) *SeparationActS {
	return &SeparationActS{repo: repo}
}

func (s *SeparationActS) CreateSeparationAct(ctx context.Context, req *model.CreateSeparationActRequest) (*model.SeparationActResponse, error) {
	srcID, err := uuid.Parse(req.SourceIngredientID)
	if err != nil {
		return nil, fmt.Errorf("invalid source_ingredient_id: %w", err)
	}
	qty := pgtype.Numeric{}
	if err := qty.Scan(req.SourceQuantity); err != nil {
		return nil, fmt.Errorf("invalid source_quantity: %w", err)
	}

	params := pg.CreateSeparationActParams{
		Date:               pgtype.Timestamp{Time: time.Now(), Valid: true},
		SourceIngredientID: srcID,
		SourceQuantity:     qty,
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
	if req.GroupID != nil {
		if id, err := uuid.Parse(*req.GroupID); err == nil {
			params.GroupID = pgtype.UUID{Bytes: id, Valid: true}
		}
	}
	params.Description = req.Description

	row, err := s.repo.Tenant(ctx).CreateSeparationAct(ctx, params)
	if err != nil {
		return nil, fmt.Errorf("failed to create separation act: %w", err)
	}
	return separationActToResponse(row), nil
}

func (s *SeparationActS) CreateSeparationActBatch(ctx context.Context, req *model.CreateSeparationActBatchRequest) (*model.SeparationActWithItemsResponse, error) {
	actResp, err := s.CreateSeparationAct(ctx, &model.CreateSeparationActRequest{
		Date:               req.Date,
		StorageID:          req.StorageID,
		SourceIngredientID: req.SourceIngredientID,
		SourceQuantity:     req.SourceQuantity,
		GroupID:            req.GroupID,
		Description:        req.Description,
	})
	if err != nil {
		return nil, err
	}
	if len(req.Items) > 0 {
		if _, err := s.UpsertSeparationActItems(ctx, actResp.ID, &model.UpsertSeparationActItemsRequest{Items: req.Items}); err != nil {
			return nil, err
		}
	}
	return s.GetSeparationAct(ctx, actResp.ID)
}

func (s *SeparationActS) GetSeparationAct(ctx context.Context, id string) (*model.SeparationActWithItemsResponse, error) {
	actID, err := uuid.Parse(id)
	if err != nil {
		return nil, fmt.Errorf("invalid separation act id: %w", err)
	}
	row, err := s.repo.Tenant(ctx).GetSeparationActByID(ctx, actID)
	if err != nil {
		return nil, fmt.Errorf("separation act not found: %w", err)
	}
	items, err := s.repo.Tenant(ctx).GetSeparationActItemsByActID(ctx, actID)
	if err != nil {
		return nil, fmt.Errorf("failed to get act items: %w", err)
	}

	itemResponses := make([]model.SeparationActItemResponse, 0, len(items))
	for _, it := range items {
		resp := separationActItemToResponse(it)
		// Live stock preview for output items if snapshots not yet saved
		snapshotSaved := it.StockBefore.Valid && it.StockAfter.Valid &&
			!(resp.StockBefore == "0" && resp.StockAfter == "0")
		if !snapshotSaved {
			itemStorage := row.StorageID
			if it.StorageID.Valid {
				itemStorage = it.StorageID
			}
			if itemStorage.Valid {
				stock, err := s.repo.Tenant(ctx).GetStockByIngredientAndStorage(ctx, pg.GetStockByIngredientAndStorageParams{
					IngredientID: it.IngredientID,
					StorageID:    itemStorage,
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
				projected := currentQty + itemQty.Float64 // ADD for output items
				projN := pgtype.Numeric{}
				_ = projN.Scan(fmt.Sprintf("%g", projected))
				resp.StockAfter = pgNumericToStr(projN)
			}
		}
		itemResponses = append(itemResponses, resp)
	}

	actResp := separationActToResponse(row)
	return &model.SeparationActWithItemsResponse{
		Act:   *actResp,
		Items: itemResponses,
	}, nil
}

func (s *SeparationActS) ListSeparationActs(ctx context.Context, storageID, groupID, ingredientID, status *string, startDate, endDate *string, limit, offset int32) (*model.SeparationActListResponse, error) {
	listParams := pg.ListSeparationActsParams{Limit: limit, Offset: offset}
	countParams := pg.CountSeparationActsParams{}
	sumAmountParams := pg.SumSeparationActsTotalAmountParams{}
	sumQtyParams := pg.SumSeparationActsSourceQtyParams{}

	if storageID != nil {
		listParams.Column1 = *storageID
		countParams.Column1 = *storageID
		sumAmountParams.Column1 = *storageID
		sumQtyParams.Column1 = *storageID
	}
	if groupID != nil {
		listParams.Column2 = *groupID
		countParams.Column2 = *groupID
		sumAmountParams.Column2 = *groupID
		sumQtyParams.Column2 = *groupID
	}
	if ingredientID != nil {
		listParams.Column3 = *ingredientID
		countParams.Column3 = *ingredientID
		sumAmountParams.Column3 = *ingredientID
		sumQtyParams.Column3 = *ingredientID
	}
	if status != nil {
		listParams.Column4 = *status
		countParams.Column4 = *status
		sumAmountParams.Column4 = *status
		sumQtyParams.Column4 = *status
	}
	if startDate != nil {
		if t, err := time.Parse(time.RFC3339, *startDate); err == nil {
			listParams.Column5 = pgtype.Timestamp{Time: t, Valid: true}
			countParams.Column5 = pgtype.Timestamp{Time: t, Valid: true}
			sumAmountParams.Column5 = pgtype.Timestamp{Time: t, Valid: true}
			sumQtyParams.Column5 = pgtype.Timestamp{Time: t, Valid: true}
		}
	}
	if endDate != nil {
		if t, err := time.Parse(time.RFC3339, *endDate); err == nil {
			listParams.Column6 = pgtype.Timestamp{Time: t, Valid: true}
			countParams.Column6 = pgtype.Timestamp{Time: t, Valid: true}
			sumAmountParams.Column6 = pgtype.Timestamp{Time: t, Valid: true}
			sumQtyParams.Column6 = pgtype.Timestamp{Time: t, Valid: true}
		}
	}

	rows, err := s.repo.Tenant(ctx).ListSeparationActs(ctx, listParams)
	if err != nil {
		return nil, fmt.Errorf("failed to list separation acts: %w", err)
	}
	total, err := s.repo.Tenant(ctx).CountSeparationActs(ctx, countParams)
	if err != nil {
		return nil, fmt.Errorf("failed to count separation acts: %w", err)
	}
	totalAmount, err := s.repo.Tenant(ctx).SumSeparationActsTotalAmount(ctx, sumAmountParams)
	if err != nil {
		return nil, fmt.Errorf("failed to sum separation acts amount: %w", err)
	}
	totalSourceQty, err := s.repo.Tenant(ctx).SumSeparationActsSourceQty(ctx, sumQtyParams)
	if err != nil {
		return nil, fmt.Errorf("failed to sum separation acts source qty: %w", err)
	}

	data := make([]*model.SeparationActResponse, 0, len(rows))
	for _, row := range rows {
		r := separationActRowToResponse(row)
		data = append(data, r)
	}
	return &model.SeparationActListResponse{
		Data:           data,
		Total:          total,
		TotalAmount:    pgNumericToStr(totalAmount),
		TotalSourceQty: pgNumericToStr(totalSourceQty),
		Limit:          limit,
		Offset:         offset,
	}, nil
}

func (s *SeparationActS) UpdateSeparationAct(ctx context.Context, id string, req *model.UpdateSeparationActRequest) (*model.SeparationActResponse, error) {
	actID, err := uuid.Parse(id)
	if err != nil {
		return nil, fmt.Errorf("invalid separation act id: %w", err)
	}
	params := pg.UpdateSeparationActParams{ID: actID}
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
	if req.GroupID != nil {
		if id2, err := uuid.Parse(*req.GroupID); err == nil {
			params.GroupID = pgtype.UUID{Bytes: id2, Valid: true}
		}
	}
	params.Description = req.Description

	row, err := s.repo.Tenant(ctx).UpdateSeparationAct(ctx, params)
	if err != nil {
		return nil, fmt.Errorf("failed to update separation act: %w", err)
	}
	return separationActToResponse(row), nil
}

func (s *SeparationActS) ConfirmSeparationAct(ctx context.Context, id string) (*model.SeparationActResponse, error) {
	actID, err := uuid.Parse(id)
	if err != nil {
		return nil, fmt.Errorf("invalid separation act id: %w", err)
	}

	act, err := s.repo.Tenant(ctx).GetSeparationActByID(ctx, actID)
	if err != nil {
		return nil, fmt.Errorf("separation act not found: %w", err)
	}
	if act.Status != "draft" {
		return nil, fmt.Errorf("only draft separation acts can be confirmed")
	}
	if !act.StorageID.Valid {
		return nil, fmt.Errorf("separation act must have a storage before confirming")
	}

	items, err := s.repo.Tenant(ctx).GetSeparationActItemsByActID(ctx, actID)
	if err != nil {
		return nil, fmt.Errorf("failed to get act items: %w", err)
	}
	if len(items) == 0 {
		return nil, fmt.Errorf("separation act has no output items")
	}

	zero := pgtype.Numeric{}
	_ = zero.Scan("0")
	srcType := string(pg.SeparationActOut)

	// Convert act date to timestamptz for effective_at
	var actDate pgtype.Timestamptz
	if act.Date.Valid {
		actDate = pgtype.Timestamptz{Time: act.Date.Time.In(time.UTC), Valid: true}
	}

	// 1. Remove source ingredient from source storage
	srcStockID, err := s.repo.Tenant(ctx).EnsureIngredientStockByStorage(ctx, pg.EnsureIngredientStockByStorageParams{
		ID:           uuid.New(),
		IngredientID: act.SourceIngredientID,
		StorageID:    act.StorageID,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to ensure source stock row: %w", err)
	}
	srcLocked, err := s.repo.Tenant(ctx).GetStockByIngredientAndStorageForUpdate(ctx, pg.GetStockByIngredientAndStorageForUpdateParams{
		IngredientID: act.SourceIngredientID,
		StorageID:    act.StorageID,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to lock source stock: %w", err)
	}
	srcUpdated, err := s.repo.Tenant(ctx).RemoveFromIngredientStock(ctx, pg.RemoveFromIngredientStockParams{
		ID:       srcStockID,
		Quantity: act.SourceQuantity,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to deduct source stock: %w", err)
	}
	var effectiveAt *pgtype.Timestamptz
	if actDate.Valid && !actDate.Time.After(time.Now()) {
		effectiveAt = &actDate
	}
	if err := s.repo.Tenant(ctx).InsertIngredientStockMovement(ctx, pg.InsertIngredientStockMovementParams{
		ID:           uuid.New(),
		StorageID:    uuid.UUID(act.StorageID.Bytes),
		IngredientID: act.SourceIngredientID,
		EventType:    string(pg.SeparationActOut),
		QtyIn:        zero,
		QtyOut:       act.SourceQuantity,
		StockBefore:  srcLocked.Quantity,
		StockAfter:   srcUpdated.Quantity,
		PricePerUnit: zero,
		SourceType:   &srcType,
		SourceID:     &actID,
		EffectiveAt:  effectiveAt,
	}); err != nil {
		return nil, fmt.Errorf("failed to log source stock movement: %w", err)
	}

	// 2. Add each output item to its storage
	for _, item := range items {
		itemStorage := act.StorageID
		if item.StorageID.Valid {
			itemStorage = item.StorageID
		}

		itemStockID, err := s.repo.Tenant(ctx).EnsureIngredientStockByStorage(ctx, pg.EnsureIngredientStockByStorageParams{
			ID:           uuid.New(),
			IngredientID: item.IngredientID,
			StorageID:    itemStorage,
		})
		if err != nil {
			return nil, fmt.Errorf("failed to ensure item stock row: %w", err)
		}
		locked, err := s.repo.Tenant(ctx).GetStockByIngredientAndStorageForUpdate(ctx, pg.GetStockByIngredientAndStorageForUpdateParams{
			IngredientID: item.IngredientID,
			StorageID:    itemStorage,
		})
		if err != nil {
			return nil, fmt.Errorf("failed to lock item stock: %w", err)
		}
		updated, err := s.repo.Tenant(ctx).AddToIngredientStock(ctx, pg.AddToIngredientStockParams{
			ID:       itemStockID,
			Quantity: item.Quantity,
		})
		if err != nil {
			return nil, fmt.Errorf("failed to add item stock: %w", err)
		}
		if _, err := s.repo.Tenant(ctx).UpdateSeparationActItemStockSnapshot(ctx, pg.UpdateSeparationActItemStockSnapshotParams{
			ID:          item.ID,
			StockBefore: locked.Quantity,
			StockAfter:  updated.Quantity,
		}); err != nil {
			return nil, fmt.Errorf("failed to save item stock snapshot: %w", err)
		}
		if err := s.repo.Tenant(ctx).InsertIngredientStockMovement(ctx, pg.InsertIngredientStockMovementParams{
			ID:           uuid.New(),
			StorageID:    uuid.UUID(itemStorage.Bytes),
			IngredientID: item.IngredientID,
			EventType:    string(pg.SeparationActIn),
			QtyIn:        item.Quantity,
			QtyOut:       zero,
			StockBefore:  locked.Quantity,
			StockAfter:   updated.Quantity,
			PricePerUnit: item.PricePerUnit,
			SourceType:   &srcType,
			SourceID:     &actID,
			EffectiveAt:  effectiveAt,
		}); err != nil {
			return nil, fmt.Errorf("failed to log item stock movement: %w", err)
		}
	}

	// 3. Mark as active and save source snapshots
	confirmed, err := s.repo.Tenant(ctx).ConfirmSeparationAct(ctx, pg.ConfirmSeparationActParams{
		ID:                actID,
		SourceStockBefore: srcLocked.Quantity,
		SourceStockAfter:  srcUpdated.Quantity,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to confirm separation act: %w", err)
	}
	return separationActToResponse(confirmed), nil
}

func (s *SeparationActS) CancelSeparationAct(ctx context.Context, id string) (*model.SeparationActResponse, error) {
	actID, err := uuid.Parse(id)
	if err != nil {
		return nil, fmt.Errorf("invalid separation act id: %w", err)
	}
	row, err := s.repo.Tenant(ctx).CancelSeparationAct(ctx, actID)
	if err != nil {
		return nil, fmt.Errorf("failed to cancel separation act: %w", err)
	}
	return separationActToResponse(row), nil
}

func (s *SeparationActS) DeleteSeparationAct(ctx context.Context, id string) error {
	actID, err := uuid.Parse(id)
	if err != nil {
		return fmt.Errorf("invalid separation act id: %w", err)
	}

	act, err := s.repo.Tenant(ctx).GetSeparationActByID(ctx, actID)
	if err != nil {
		return fmt.Errorf("separation act not found: %w", err)
	}

	// If confirmed (active), reverse stock changes
	if act.Status == "active" {
		items, err := s.repo.Tenant(ctx).GetSeparationActItemsByActID(ctx, actID)
		if err != nil {
			return fmt.Errorf("failed to get act items: %w", err)
		}

		zero := pgtype.Numeric{}
		_ = zero.Scan("0")
		srcType := string(pg.SeparationActOut)

		// Convert act date to timestamptz for effective_at
		var actDate pgtype.Timestamptz
		if act.Date.Valid {
			actDate = pgtype.Timestamptz{Time: act.Date.Time.In(time.UTC), Valid: true}
		}

		var effectiveAt *pgtype.Timestamptz
		if actDate.Valid && !actDate.Time.After(time.Now()) {
			effectiveAt = &actDate
		}

		// Reverse output items: remove what was added
		for _, item := range items {
			itemStorage := act.StorageID
			if item.StorageID.Valid {
				itemStorage = item.StorageID
			}
			if !itemStorage.Valid {
				continue
			}
			stockID, err := s.repo.Tenant(ctx).EnsureIngredientStockByStorage(ctx, pg.EnsureIngredientStockByStorageParams{
				ID:           uuid.New(),
				IngredientID: item.IngredientID,
				StorageID:    itemStorage,
			})
			if err != nil {
				return fmt.Errorf("failed to ensure item stock row: %w", err)
			}
			locked, err := s.repo.Tenant(ctx).GetStockByIngredientAndStorageForUpdate(ctx, pg.GetStockByIngredientAndStorageForUpdateParams{
				IngredientID: item.IngredientID,
				StorageID:    itemStorage,
			})
			if err != nil {
				return fmt.Errorf("failed to lock item stock: %w", err)
			}
			updated, err := s.repo.Tenant(ctx).RemoveFromIngredientStock(ctx, pg.RemoveFromIngredientStockParams{
				ID:       stockID,
				Quantity: item.Quantity,
			})
			if err != nil {
				return fmt.Errorf("failed to reverse item stock: %w", err)
			}
			_ = s.repo.Tenant(ctx).InsertIngredientStockMovement(ctx, pg.InsertIngredientStockMovementParams{
				ID:           uuid.New(),
				StorageID:    uuid.UUID(itemStorage.Bytes),
				IngredientID: item.IngredientID,
				EventType:    string(pg.SeparationActInReversed),
				QtyIn:        zero,
				QtyOut:       item.Quantity,
				StockBefore:  locked.Quantity,
				StockAfter:   updated.Quantity,
				PricePerUnit: zero,
				SourceType:   &srcType,
				SourceID:     &actID,
				EffectiveAt:  effectiveAt,
			})
		}

		// Reverse source ingredient: add back what was removed
		if act.StorageID.Valid {
			stockID, err := s.repo.Tenant(ctx).EnsureIngredientStockByStorage(ctx, pg.EnsureIngredientStockByStorageParams{
				ID:           uuid.New(),
				IngredientID: act.SourceIngredientID,
				StorageID:    act.StorageID,
			})
			if err != nil {
				return fmt.Errorf("failed to ensure source stock row: %w", err)
			}
			locked, err := s.repo.Tenant(ctx).GetStockByIngredientAndStorageForUpdate(ctx, pg.GetStockByIngredientAndStorageForUpdateParams{
				IngredientID: act.SourceIngredientID,
				StorageID:    act.StorageID,
			})
			if err != nil {
				return fmt.Errorf("failed to lock source stock: %w", err)
			}
			updated, err := s.repo.Tenant(ctx).AddToIngredientStock(ctx, pg.AddToIngredientStockParams{
				ID:       stockID,
				Quantity: act.SourceQuantity,
			})
			if err != nil {
				return fmt.Errorf("failed to restore source stock: %w", err)
			}
			_ = s.repo.Tenant(ctx).InsertIngredientStockMovement(ctx, pg.InsertIngredientStockMovementParams{
				ID:           uuid.New(),
				StorageID:    uuid.UUID(act.StorageID.Bytes),
				IngredientID: act.SourceIngredientID,
				EventType:    string(pg.SeparationActOutReversed),
				QtyIn:        act.SourceQuantity,
				QtyOut:       zero,
				StockBefore:  locked.Quantity,
				StockAfter:   updated.Quantity,
				PricePerUnit: zero,
				SourceType:   &srcType,
				SourceID:     &actID,
			})
		}
	}

	return s.repo.Tenant(ctx).DeleteSeparationAct(ctx, actID)
}

func (s *SeparationActS) UpsertSeparationActItems(ctx context.Context, actID string, req *model.UpsertSeparationActItemsRequest) ([]model.SeparationActItemResponse, error) {
	aID, err := uuid.Parse(actID)
	if err != nil {
		return nil, fmt.Errorf("invalid separation act id: %w", err)
	}
	act, err := s.repo.Tenant(ctx).GetSeparationActByID(ctx, aID)
	if err != nil {
		return nil, fmt.Errorf("separation act not found: %w", err)
	}
	if act.Status != "draft" {
		return nil, fmt.Errorf("can only modify items of a draft separation act")
	}

	results := make([]model.SeparationActItemResponse, 0, len(req.Items))
	for _, r := range req.Items {
		resp, err := s.upsertOneActItem(ctx, aID, act, &r)
		if err != nil {
			return nil, err
		}
		results = append(results, *resp)
	}

	if err := s.recalcActTotal(ctx, aID); err != nil {
		return nil, err
	}
	return results, nil
}

func (s *SeparationActS) upsertOneActItem(ctx context.Context, aID uuid.UUID, act pg.SeparationAct, req *model.UpsertSeparationActItemRequest) (*model.SeparationActItemResponse, error) {
	ingID, err := uuid.Parse(req.IngredientID)
	if err != nil {
		return nil, fmt.Errorf("invalid ingredient id: %w", err)
	}
	qty := pgtype.Numeric{}
	if err := qty.Scan(req.Quantity); err != nil {
		return nil, fmt.Errorf("invalid quantity: %w", err)
	}

	price := pgtype.Numeric{}
	if req.Price != nil {
		if err := price.Scan(*req.Price); err != nil {
			return nil, fmt.Errorf("invalid price: %w", err)
		}
	} else {
		ing, err := s.repo.Tenant(ctx).GetIngredientByID(ctx, ingID)
		if err == nil && ing.PricePerUnit.Valid {
			price = ing.PricePerUnit
		} else {
			_ = price.Scan("0")
		}
	}

	params := pg.UpsertSeparationActItemParams{
		SeparationActID: aID,
		IngredientID:    ingID,
		Quantity:        qty,
		PricePerUnit:    price,
	}
	if req.StorageID != nil {
		if id, err := uuid.Parse(*req.StorageID); err == nil {
			params.StorageID = pgtype.UUID{Bytes: id, Valid: true}
		}
	}

	item, err := s.repo.Tenant(ctx).UpsertSeparationActItem(ctx, params)
	if err != nil {
		return nil, fmt.Errorf("failed to upsert separation act item: %w", err)
	}

	resp := separationActItemToResponse(item)
	// Live stock preview for output item
	itemStorage := act.StorageID
	if item.StorageID.Valid {
		itemStorage = item.StorageID
	}
	if itemStorage.Valid {
		stock, err := s.repo.Tenant(ctx).GetStockByIngredientAndStorage(ctx, pg.GetStockByIngredientAndStorageParams{
			IngredientID: ingID,
			StorageID:    itemStorage,
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
		projected := currentQty + itemQty.Float64 // ADD for output items
		projN := pgtype.Numeric{}
		_ = projN.Scan(fmt.Sprintf("%g", projected))
		resp.StockAfter = pgNumericToStr(projN)
	}
	return &resp, nil
}

func (s *SeparationActS) DeleteSeparationActItem(ctx context.Context, itemID string) error {
	id, err := uuid.Parse(itemID)
	if err != nil {
		return fmt.Errorf("invalid item id: %w", err)
	}
	item, err := s.repo.Tenant(ctx).GetSeparationActItemByID(ctx, id)
	if err != nil {
		return fmt.Errorf("item not found: %w", err)
	}
	if err := s.repo.Tenant(ctx).DeleteSeparationActItem(ctx, id); err != nil {
		return fmt.Errorf("failed to delete item: %w", err)
	}
	return s.recalcActTotal(ctx, item.SeparationActID)
}

func (s *SeparationActS) recalcActTotal(ctx context.Context, actID uuid.UUID) error {
	items, err := s.repo.Tenant(ctx).GetSeparationActItemsByActID(ctx, actID)
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
	_, err = s.repo.Tenant(ctx).UpdateSeparationActTotalAmount(ctx, pg.UpdateSeparationActTotalAmountParams{
		ID:          actID,
		TotalAmount: totalN,
	})
	return err
}

// ── helpers ───────────────────────────────────────────────────────────────────

func separationActToResponse(row pg.SeparationAct) *model.SeparationActResponse {
	r := &model.SeparationActResponse{
		ID:                 row.ID.String(),
		Number:             row.Number,
		SourceIngredientID: row.SourceIngredientID.String(),
		SourceQuantity:     pgNumericToStr(row.SourceQuantity),
		SourceStockBefore:  pgNumericToStr(row.SourceStockBefore),
		SourceStockAfter:   pgNumericToStr(row.SourceStockAfter),
		Status:             model.SeparationActStatus(row.Status),
		TotalAmount:        pgNumericToStr(row.TotalAmount),
	}
	if row.Date.Valid {
		t := row.Date.Time
		r.Date = &t
	}
	if row.StorageID.Valid {
		s := uuid.UUID(row.StorageID.Bytes).String()
		r.StorageID = &s
	}
	if row.GroupID.Valid {
		s := uuid.UUID(row.GroupID.Bytes).String()
		r.GroupID = &s
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

func separationActRowToResponse(row pg.ListSeparationActsRow) *model.SeparationActResponse {
	actStatus := model.SeparationActStatus(row.Status)
	if row.DeletedAt != nil && *row.DeletedAt > 0 {
		actStatus = "deleted"
	}
	r := &model.SeparationActResponse{
		ID:                 row.ID.String(),
		Number:             row.Number,
		SourceIngredientID: row.SourceIngredientID.String(),
		SourceQuantity:     pgNumericToStr(row.SourceQuantity),
		SourceStockBefore:  pgNumericToStr(row.SourceStockBefore),
		SourceStockAfter:   pgNumericToStr(row.SourceStockAfter),
		Status:             actStatus,
		TotalAmount:        pgNumericToStr(row.TotalAmount),
	}
	waste := pgNumericToStr(row.WasteQuantity)
	r.WasteQuantity = &waste
	if row.Date.Valid {
		t := row.Date.Time
		r.Date = &t
	}
	if row.StorageID.Valid {
		s := uuid.UUID(row.StorageID.Bytes).String()
		r.StorageID = &s
	}
	if row.GroupID.Valid {
		s := uuid.UUID(row.GroupID.Bytes).String()
		r.GroupID = &s
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

func separationActItemToResponse(row pg.SeparationActItem) model.SeparationActItemResponse {
	r := model.SeparationActItemResponse{
		ID:              row.ID.String(),
		SeparationActID: row.SeparationActID.String(),
		IngredientID:    row.IngredientID.String(),
		Quantity:        pgNumericToStr(row.Quantity),
		PricePerUnit:    pgNumericToStr(row.PricePerUnit),
		TotalAmount:     pgNumericToStr(row.TotalAmount),
		StockBefore:     pgNumericToStr(row.StockBefore),
		StockAfter:      pgNumericToStr(row.StockAfter),
	}
	if row.StorageID.Valid {
		s := uuid.UUID(row.StorageID.Bytes).String()
		r.StorageID = &s
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
