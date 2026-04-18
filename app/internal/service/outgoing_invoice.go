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

type OutgoingInvoiceI interface {
	CreateOutgoingInvoice(ctx context.Context, req *model.CreateOutgoingInvoiceRequest) (*model.OutgoingInvoiceResponse, error)
	CreateOutgoingInvoiceBatch(ctx context.Context, req *model.CreateOutgoingInvoiceBatchRequest) (*model.OutgoingInvoiceWithItemsResponse, error)
	GetOutgoingInvoice(ctx context.Context, id string) (*model.OutgoingInvoiceWithItemsResponse, error)
	ListOutgoingInvoices(ctx context.Context, storageID, groupID, status *string, startDate, endDate *string, limit, offset int32) (*model.OutgoingInvoiceListResponse, error)
	UpdateOutgoingInvoice(ctx context.Context, id string, req *model.UpdateOutgoingInvoiceRequest) (*model.OutgoingInvoiceResponse, error)
	ConfirmOutgoingInvoice(ctx context.Context, id string) (*model.OutgoingInvoiceResponse, error)
	CancelOutgoingInvoice(ctx context.Context, id string) (*model.OutgoingInvoiceResponse, error)
	DeleteOutgoingInvoice(ctx context.Context, id string) error
	UpsertOutgoingInvoiceItems(ctx context.Context, invoiceID string, req *model.UpsertOutgoingInvoiceItemsRequest) ([]model.OutgoingInvoiceItemResponse, error)
	DeleteOutgoingInvoiceItem(ctx context.Context, itemID string) error
}

type OutgoingInvoiceS struct {
	repo *repository.Repository
}

func NewOutgoingInvoiceS(repo *repository.Repository) *OutgoingInvoiceS {
	return &OutgoingInvoiceS{repo: repo}
}

func (s *OutgoingInvoiceS) CreateOutgoingInvoice(ctx context.Context, req *model.CreateOutgoingInvoiceRequest) (*model.OutgoingInvoiceResponse, error) {
	params := pg.CreateOutgoingInvoiceParams{
		Date: pgtype.Timestamp{Time: time.Now(), Valid: true},
	}

	if req.Date != nil && *req.Date != "" {
		t, err := time.Parse(time.RFC3339, *req.Date)
		if err != nil {
			return nil, fmt.Errorf("invalid date: %w", err)
		}
		params.Date = pgtype.Timestamp{Time: t, Valid: true}
	}

	if req.StorageID != nil && *req.StorageID != "" {
		id, err := uuid.Parse(*req.StorageID)
		if err != nil {
			return nil, fmt.Errorf("invalid storage_id: %w", err)
		}
		params.StorageID = pgtype.UUID{Bytes: id, Valid: true}
	}

	if req.GroupID != nil && *req.GroupID != "" {
		id, err := uuid.Parse(*req.GroupID)
		if err != nil {
			return nil, fmt.Errorf("invalid group_id: %w", err)
		}
		params.GroupID = pgtype.UUID{Bytes: id, Valid: true}
	}

	params.Description = req.Description

	row, err := s.repo.Tenant(ctx).CreateOutgoingInvoice(ctx, params)
	if err != nil {
		return nil, fmt.Errorf("failed to create outgoing invoice: %w", err)
	}

	return outgoingInvoiceToResponse(row), nil
}

func (s *OutgoingInvoiceS) GetOutgoingInvoice(ctx context.Context, id string) (*model.OutgoingInvoiceWithItemsResponse, error) {
	invoiceID, err := uuid.Parse(id)
	if err != nil {
		return nil, fmt.Errorf("invalid invoice id: %w", err)
	}
	row, err := s.repo.Tenant(ctx).GetOutgoingInvoiceByID(ctx, invoiceID)
	if err != nil {
		return nil, fmt.Errorf("outgoing invoice not found: %w", err)
	}
	items, err := s.repo.Tenant(ctx).GetOutgoingInvoiceItemsByInvoiceID(ctx, invoiceID)
	if err != nil {
		return nil, fmt.Errorf("failed to get invoice items: %w", err)
	}

	itemResponses := make([]model.OutgoingInvoiceItemResponse, 0, len(items))
	for _, it := range items {
		resp := outgoingInvoiceItemToResponse(it)

		if row.Status == "draft" {
			itemResponses = append(itemResponses, hideOutgoingDraftStockSnapshot(resp, row.Status))
			continue
		}
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
	return &model.OutgoingInvoiceWithItemsResponse{
		Invoice: *outgoingInvoiceToResponse(row),
		Items:   itemResponses,
	}, nil
}

func (s *OutgoingInvoiceS) CreateOutgoingInvoiceBatch(ctx context.Context, req *model.CreateOutgoingInvoiceBatchRequest) (*model.OutgoingInvoiceWithItemsResponse, error) {
	invoiceResp, err := s.CreateOutgoingInvoice(ctx, &model.CreateOutgoingInvoiceRequest{
		Date:        req.Date,
		StorageID:   req.StorageID,
		GroupID:     req.GroupID,
		Description: req.Description,
	})
	if err != nil {
		return nil, err
	}
	if _, err := s.UpsertOutgoingInvoiceItems(ctx, invoiceResp.ID, &model.UpsertOutgoingInvoiceItemsRequest{Items: req.Items}); err != nil {
		return nil, err
	}
	return s.GetOutgoingInvoice(ctx, invoiceResp.ID)
}

func (s *OutgoingInvoiceS) ListOutgoingInvoices(ctx context.Context, storageID, groupID, status *string, startDate, endDate *string, limit, offset int32) (*model.OutgoingInvoiceListResponse, error) {
	listParams := pg.ListOutgoingInvoicesParams{Limit: limit, Offset: offset}
	countParams := pg.CountOutgoingInvoicesParams{}
	sumParams := pg.SumOutgoingInvoicesParams{}

	if storageID != nil {
		listParams.Column1 = *storageID
		countParams.Column1 = *storageID
		sumParams.Column1 = *storageID
	}
	if groupID != nil {
		listParams.Column2 = *groupID
		countParams.Column2 = *groupID
		sumParams.Column2 = *groupID
	}
	if status != nil {
		listParams.Column3 = *status
		countParams.Column3 = *status
		sumParams.Column3 = *status
	}
	if startDate != nil {
		if t, err := time.Parse(time.RFC3339, *startDate); err == nil {
			listParams.Column4 = pgtype.Timestamp{Time: t, Valid: true}
			countParams.Column4 = pgtype.Timestamp{Time: t, Valid: true}
			sumParams.Column4 = pgtype.Timestamp{Time: t, Valid: true}
		}
	}
	if endDate != nil {
		if t, err := time.Parse(time.RFC3339, *endDate); err == nil {
			listParams.Column5 = pgtype.Timestamp{Time: t, Valid: true}
			countParams.Column5 = pgtype.Timestamp{Time: t, Valid: true}
			sumParams.Column5 = pgtype.Timestamp{Time: t, Valid: true}
		}
	}

	rows, err := s.repo.Tenant(ctx).ListOutgoingInvoices(ctx, listParams)
	if err != nil {
		return nil, fmt.Errorf("failed to list outgoing invoices: %w", err)
	}
	total, err := s.repo.Tenant(ctx).CountOutgoingInvoices(ctx, countParams)
	if err != nil {
		return nil, fmt.Errorf("failed to count outgoing invoices: %w", err)
	}
	totalSum, err := s.repo.Tenant(ctx).SumOutgoingInvoices(ctx, sumParams)
	if err != nil {
		return nil, fmt.Errorf("failed to sum outgoing invoices: %w", err)
	}

	data := make([]*model.OutgoingInvoiceResponse, 0, len(rows))
	for _, row := range rows {
		data = append(data, outgoingInvoiceToResponse(row))
	}
	return &model.OutgoingInvoiceListResponse{
		Data:     data,
		Total:    total,
		TotalSum: pgNumericToStr(totalSum),
		Limit:    limit,
		Offset:   offset,
	}, nil
}

func (s *OutgoingInvoiceS) UpdateOutgoingInvoice(ctx context.Context, id string, req *model.UpdateOutgoingInvoiceRequest) (*model.OutgoingInvoiceResponse, error) {
	invoiceID, err := uuid.Parse(id)
	if err != nil {
		return nil, fmt.Errorf("invalid invoice id: %w", err)
	}
	params := pg.UpdateOutgoingInvoiceParams{ID: invoiceID}
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

	row, err := s.repo.Tenant(ctx).UpdateOutgoingInvoice(ctx, params)
	if err != nil {
		return nil, fmt.Errorf("failed to update outgoing invoice: %w", err)
	}
	return outgoingInvoiceToResponse(row), nil
}

func (s *OutgoingInvoiceS) ConfirmOutgoingInvoice(ctx context.Context, id string) (*model.OutgoingInvoiceResponse, error) {
	invoiceID, err := uuid.Parse(id)
	if err != nil {
		return nil, fmt.Errorf("invalid invoice id: %w", err)
	}

	invoice, err := s.repo.Tenant(ctx).GetOutgoingInvoiceByID(ctx, invoiceID)
	if err != nil {
		return nil, fmt.Errorf("outgoing invoice not found: %w", err)
	}
	if invoice.Status != "draft" {
		return nil, fmt.Errorf("only draft invoices can be confirmed")
	}
	if !invoice.StorageID.Valid {
		return nil, fmt.Errorf("invoice must have a storage selected before confirming")
	}

	items, err := s.repo.Tenant(ctx).GetOutgoingInvoiceItemsByInvoiceID(ctx, invoiceID)
	if err != nil {
		return nil, fmt.Errorf("failed to get invoice items: %w", err)
	}
	if len(items) == 0 {
		return nil, fmt.Errorf("invoice has no items")
	}

	storageID := invoice.StorageID
	effectiveAt := outgoingInvoiceEffectiveAt(invoice.Date)

	touched := make(map[outgoingTouchedKey]struct{})
	srcType := "outgoing_invoice"
	srcID := invoiceID
	zero := inventoryZeroNumeric()

	for _, item := range items {
		stockID, err := s.repo.Tenant(ctx).EnsureIngredientStockByStorage(ctx, pg.EnsureIngredientStockByStorageParams{
			ID:           uuid.New(),
			IngredientID: item.IngredientID,
			StorageID:    storageID,
		})
		if err != nil {
			return nil, fmt.Errorf("failed to ensure stock row: %w", err)
		}

		locked, err := s.repo.Tenant(ctx).GetStockByIngredientAndStorageForUpdate(ctx, pg.GetStockByIngredientAndStorageForUpdateParams{
			IngredientID: item.IngredientID,
			StorageID:    storageID,
		})
		if err != nil {
			return nil, fmt.Errorf("failed to lock stock row: %w", err)
		}

		updated, err := s.repo.Tenant(ctx).RemoveFromIngredientStock(ctx, pg.RemoveFromIngredientStockParams{
			ID:       stockID,
			Quantity: item.Quantity,
		})
		if err != nil {
			return nil, fmt.Errorf("failed to deduct stock: %w", err)
		}

		if _, err := s.repo.Tenant(ctx).UpdateOutgoingInvoiceItemStockSnapshot(ctx, pg.UpdateOutgoingInvoiceItemStockSnapshotParams{
			ID:          item.ID,
			StockBefore: locked.Quantity,
			StockAfter:  updated.Quantity,
		}); err != nil {
			return nil, fmt.Errorf("failed to save stock snapshot: %w", err)
		}

		if shouldSkipStockMovement(zero, item.Quantity) {
			continue
		}

		if err := s.repo.Tenant(ctx).InsertIngredientStockMovement(ctx, pg.InsertIngredientStockMovementParams{
			ID:           uuid.New(),
			StorageID:    uuid.UUID(storageID.Bytes),
			IngredientID: item.IngredientID,
			EventType:    "outgoing_invoice_out",
			QtyIn:        zero,
			QtyOut:       item.Quantity,
			StockBefore:  locked.Quantity,
			StockAfter:   updated.Quantity,
			PricePerUnit: item.PricePerUnit,
			SourceType:   &srcType,
			SourceID:     &srcID,
			EffectiveAt:  effectiveAt,
		}); err != nil {
			return nil, fmt.Errorf("failed to log stock movement: %w", err)
		}

		touched[outgoingTouchedKey{
			StorageID:    storageID.Bytes,
			IngredientID: item.IngredientID,
		}] = struct{}{}
	}

	for key := range touched {
		if err := s.rebalanceOutgoingIngredientLedger(ctx, pgtype.UUID{Bytes: key.StorageID, Valid: true}, key.IngredientID); err != nil {
			return nil, fmt.Errorf("failed to rebalance outgoing invoice ledger: %w", err)
		}
	}

	confirmed, err := s.repo.Tenant(ctx).ConfirmOutgoingInvoice(ctx, invoiceID)
	if err != nil {
		return nil, fmt.Errorf("failed to confirm invoice: %w", err)
	}
	return outgoingInvoiceToResponse(confirmed), nil
}

func (s *OutgoingInvoiceS) CancelOutgoingInvoice(ctx context.Context, id string) (*model.OutgoingInvoiceResponse, error) {
	invoiceID, err := uuid.Parse(id)
	if err != nil {
		return nil, fmt.Errorf("invalid invoice id: %w", err)
	}

	row, err := s.repo.Tenant(ctx).CancelOutgoingInvoice(ctx, invoiceID)
	if err != nil {
		return nil, fmt.Errorf("failed to cancel outgoing invoice: %w", err)
	}

	return outgoingInvoiceToResponse(row), nil
}
func (s *OutgoingInvoiceS) DeleteOutgoingInvoice(ctx context.Context, id string) error {
	invoiceID, err := uuid.Parse(id)
	if err != nil {
		return fmt.Errorf("invalid invoice id: %w", err)
	}

	invoice, err := s.repo.Tenant(ctx).GetOutgoingInvoiceByID(ctx, invoiceID)
	if err != nil {
		return fmt.Errorf("failed to get outgoing invoice: %w", err)
	}

	if invoice.Status == "active" && invoice.StorageID.Valid {
		items, err := s.repo.Tenant(ctx).GetOutgoingInvoiceItemsByInvoiceID(ctx, invoiceID)
		if err != nil {
			return fmt.Errorf("failed to get outgoing invoice items: %w", err)
		}

		storageID := invoice.StorageID
		srcType := "outgoing_invoice_deleted"
		zero := inventoryZeroNumeric()
		effectiveAt := outgoingInvoiceEffectiveAt(invoice.Date)

		touched := make(map[outgoingTouchedKey]struct{})

		for _, item := range items {
			if !item.StockBefore.Valid {
				return fmt.Errorf("cannot reverse outgoing invoice item %s: stock snapshot is missing", item.ID.String())
			}

			stockID, err := s.repo.Tenant(ctx).EnsureIngredientStockByStorage(ctx, pg.EnsureIngredientStockByStorageParams{
				ID:           uuid.New(),
				IngredientID: item.IngredientID,
				StorageID:    storageID,
			})
			if err != nil {
				return fmt.Errorf("failed to ensure stock row during outgoing invoice delete: %w", err)
			}

			locked, err := s.repo.Tenant(ctx).GetStockByIngredientAndStorageForUpdate(ctx, pg.GetStockByIngredientAndStorageForUpdateParams{
				IngredientID: item.IngredientID,
				StorageID:    storageID,
			})
			if err != nil {
				return fmt.Errorf("failed to lock stock row during outgoing invoice delete: %w", err)
			}

			updated, err := s.repo.Tenant(ctx).AddToIngredientStock(ctx, pg.AddToIngredientStockParams{
				ID:       stockID,
				Quantity: item.Quantity,
			})
			if err != nil {
				return fmt.Errorf("failed to restore stock during outgoing invoice delete: %w", err)
			}

			if shouldSkipStockMovement(item.Quantity, zero) {
				continue
			}

			if err := s.repo.Tenant(ctx).InsertIngredientStockMovement(ctx, pg.InsertIngredientStockMovementParams{
				ID:           uuid.New(),
				StorageID:    uuid.UUID(storageID.Bytes),
				IngredientID: item.IngredientID,
				EventType:    "outgoing_invoice_deleted_in",
				QtyIn:        item.Quantity,
				QtyOut:       zero,
				StockBefore:  locked.Quantity,
				StockAfter:   updated.Quantity,
				PricePerUnit: item.PricePerUnit,
				SourceType:   &srcType,
				SourceID:     &invoiceID,
				EffectiveAt:  effectiveAt,
			}); err != nil {
				return fmt.Errorf("failed to log reverse stock movement during outgoing invoice delete: %w", err)
			}

			touched[outgoingTouchedKey{
				StorageID:    storageID.Bytes,
				IngredientID: item.IngredientID,
			}] = struct{}{}
		}

		for key := range touched {
			if err := s.rebalanceOutgoingIngredientLedger(ctx, pgtype.UUID{Bytes: key.StorageID, Valid: true}, key.IngredientID); err != nil {
				return fmt.Errorf("failed to rebalance outgoing invoice delete ledger: %w", err)
			}
		}
	}

	return s.repo.Tenant(ctx).DeleteOutgoingInvoice(ctx, invoiceID)
}

func (s *OutgoingInvoiceS) UpsertOutgoingInvoiceItems(ctx context.Context, invoiceID string, req *model.UpsertOutgoingInvoiceItemsRequest) ([]model.OutgoingInvoiceItemResponse, error) {
	iID, err := uuid.Parse(invoiceID)
	if err != nil {
		return nil, fmt.Errorf("invalid invoice id: %w", err)
	}

	invoice, err := s.repo.Tenant(ctx).GetOutgoingInvoiceByID(ctx, iID)
	if err != nil {
		return nil, fmt.Errorf("outgoing invoice not found: %w", err)
	}

	if invoice.Status != "draft" {
		return nil, fmt.Errorf("can only modify items of a draft invoice")
	}

	results := make([]model.OutgoingInvoiceItemResponse, 0, len(req.Items))
	for _, r := range req.Items {
		resp, err := s.upsertOneInvoiceItem(ctx, iID, invoice, &r)
		if err != nil {
			return nil, err
		}
		results = append(results, *resp)
	}

	if err := s.recalcInvoiceTotal(ctx, iID); err != nil {
		return nil, err
	}

	return results, nil
}

func (s *OutgoingInvoiceS) upsertOneInvoiceItem(ctx context.Context, iID uuid.UUID, invoice pg.OutgoingInvoice, req *model.UpsertOutgoingInvoiceItemRequest) (*model.OutgoingInvoiceItemResponse, error) {
	ingID, err := uuid.Parse(req.IngredientID)
	if err != nil {
		return nil, fmt.Errorf("invalid ingredient id: %w", err)
	}
	qty := pgtype.Numeric{}
	if err := qty.Scan(req.Quantity); err != nil {
		return nil, fmt.Errorf("invalid quantity: %w", err)
	}
	ing, err := s.repo.Tenant(ctx).GetIngredientByID(ctx, ingID)
	if err != nil {
		return nil, fmt.Errorf("ingredient not found: %w", err)
	}
	price := pgtype.Numeric{}
	if ing.PricePerUnit.Valid {
		price = ing.PricePerUnit
	} else {
		_ = price.Scan("0")
	}

	item, err := s.repo.Tenant(ctx).UpsertOutgoingInvoiceItem(ctx, pg.UpsertOutgoingInvoiceItemParams{
		OutgoingInvoiceID: iID,
		IngredientID:      ingID,
		Quantity:          qty,
		PricePerUnit:      price,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to upsert invoice item: %w", err)
	}

	resp := outgoingInvoiceItemToResponse(item)

	if invoice.Status == "draft" {
		resp = hideOutgoingDraftStockSnapshot(resp, invoice.Status)
		return &resp, nil
	}

	// Draft bo'lmasa fallback preview / snapshot ko'rsatish mumkin.
	if invoice.StorageID.Valid {
		stock, err := s.repo.Tenant(ctx).GetStockByIngredientAndStorage(ctx, pg.GetStockByIngredientAndStorageParams{
			IngredientID: ingID,
			StorageID:    invoice.StorageID,
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

func (s *OutgoingInvoiceS) DeleteOutgoingInvoiceItem(ctx context.Context, itemID string) error {
	id, err := uuid.Parse(itemID)
	if err != nil {
		return fmt.Errorf("invalid item id: %w", err)
	}

	item, err := s.repo.Tenant(ctx).GetOutgoingInvoiceItemByID(ctx, id)
	if err != nil {
		return fmt.Errorf("item not found: %w", err)
	}

	invoice, err := s.repo.Tenant(ctx).GetOutgoingInvoiceByID(ctx, item.OutgoingInvoiceID)
	if err != nil {
		return fmt.Errorf("outgoing invoice not found: %w", err)
	}

	if invoice.Status != "draft" {
		return fmt.Errorf("can only delete items from a draft invoice")
	}

	if err := s.repo.Tenant(ctx).DeleteOutgoingInvoiceItem(ctx, id); err != nil {
		return fmt.Errorf("failed to delete invoice item: %w", err)
	}

	return s.recalcInvoiceTotal(ctx, item.OutgoingInvoiceID)
}

func (s *OutgoingInvoiceS) recalcInvoiceTotal(ctx context.Context, invoiceID uuid.UUID) error {
	items, err := s.repo.Tenant(ctx).GetOutgoingInvoiceItemsByInvoiceID(ctx, invoiceID)
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
	_, err = s.repo.Tenant(ctx).UpdateOutgoingInvoiceTotalAmount(ctx, pg.UpdateOutgoingInvoiceTotalAmountParams{
		ID:          invoiceID,
		TotalAmount: totalN,
	})
	return err
}

// ── helpers ──────────────────────────────────────────────────────────────────

func outgoingInvoiceToResponse(row pg.OutgoingInvoice) *model.OutgoingInvoiceResponse {
	outStatus := model.OutgoingInvoiceStatus(row.Status)
	if row.DeletedAt != nil && *row.DeletedAt > 0 {
		outStatus = "deleted"
	}
	r := &model.OutgoingInvoiceResponse{
		ID:          row.ID.String(),
		Number:      row.Number,
		Status:      outStatus,
		TotalAmount: pgNumericToStr(row.TotalAmount),
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

func hideOutgoingDraftStockSnapshot(resp model.OutgoingInvoiceItemResponse, invoiceStatus pg.OutgoingInvoiceStatus) model.OutgoingInvoiceItemResponse {
	if invoiceStatus == pg.OutgoingInvoiceStatus("draft") {
		resp.StockBefore = ""
		resp.StockAfter = ""
	}
	return resp
}

func outgoingInvoiceItemToResponse(row pg.OutgoingInvoiceItem) model.OutgoingInvoiceItemResponse {
	r := model.OutgoingInvoiceItemResponse{
		ID:                row.ID.String(),
		OutgoingInvoiceID: row.OutgoingInvoiceID.String(),
		IngredientID:      row.IngredientID.String(),
		Quantity:          pgNumericToStr(row.Quantity),
		PricePerUnit:      pgNumericToStr(row.PricePerUnit),
		TotalAmount:       pgNumericToStr(row.TotalAmount),
		StockBefore:       pgNumericToStr(row.StockBefore),
		StockAfter:        pgNumericToStr(row.StockAfter),
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
