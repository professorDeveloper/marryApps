package service

import (
	"context"
	"fmt"
	"log"
	"math/big"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
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

func (s *TransferS) getTenantMutationQueries(ctx context.Context) (*pg.Queries, context.Context, pgx.Tx, bool, error) {
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

	q := pg.New(tx)
	txCtx := repository.WithTenantQueries(ctx, q)
	return q, txCtx, tx, true, nil
}

type transferTouchedKey struct {
	StorageID    uuid.UUID
	IngredientID uuid.UUID
}

func transferEffectiveAt(ts pgtype.Timestamptz) *pgtype.Timestamptz {
	if !ts.Valid {
		return nil
	}
	effective := pgtype.Timestamptz{
		Time:  ts.Time.In(time.UTC),
		Valid: true,
	}
	return &effective
}

func transferFreezeDate(ts pgtype.Timestamptz, entityName string) (time.Time, error) {
	if !ts.Valid {
		return time.Time{}, fmt.Errorf("%s date is required for inventory freeze check", entityName)
	}
	return ts.Time, nil
}

func assertCanMutateTransferCurrent(
	ctx context.Context,
	q *pg.Queries,
	tr pg.Transfer,
	entityName string,
) error {
	effectiveAt, err := transferFreezeDate(tr.Date, entityName)
	if err != nil {
		return err
	}

	if err := assertCanMutateAfterInventory(ctx, q, tr.FromStorageID, effectiveAt, entityName); err != nil {
		return err
	}
	if err := assertCanMutateAfterInventory(ctx, q, tr.ToStorageID, effectiveAt, entityName); err != nil {
		return err
	}
	return nil
}

func assertCanMutateTransferTarget(
	ctx context.Context,
	q *pg.Queries,
	fromStorageID pgtype.UUID,
	toStorageID pgtype.UUID,
	transferDate pgtype.Timestamptz,
	entityName string,
) error {
	effectiveAt, err := transferFreezeDate(transferDate, entityName)
	if err != nil {
		return err
	}

	if fromStorageID.Valid {
		if err := assertCanMutateAfterInventory(ctx, q, fromStorageID.Bytes, effectiveAt, entityName); err != nil {
			return err
		}
	}
	if toStorageID.Valid {
		if err := assertCanMutateAfterInventory(ctx, q, toStorageID.Bytes, effectiveAt, entityName); err != nil {
			return err
		}
	}

	return nil
}

func assertCanMutateTransferChange(
	ctx context.Context,
	q *pg.Queries,
	current pg.Transfer,
	targetFromStorageID pgtype.UUID,
	targetToStorageID pgtype.UUID,
	targetDate pgtype.Timestamptz,
	entityName string,
) error {
	if err := assertCanMutateTransferCurrent(ctx, q, current, entityName); err != nil {
		return err
	}
	if err := assertCanMutateTransferTarget(ctx, q, targetFromStorageID, targetToStorageID, targetDate, entityName); err != nil {
		return err
	}
	return nil
}

func (s *TransferS) rebalanceTransferIngredientLedger(
	ctx context.Context,
	q *pg.Queries,
	storageID pgtype.UUID,
	ingredientID uuid.UUID,
) error {
	return rebalanceIngredientStockLedger(ctx, q, storageID, ingredientID, "transfer")
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

	transferDate := pgtype.Timestamptz{Time: time.Now(), Valid: true}
	if err := assertCanMutateTransferTarget(
		ctx,
		s.repo.Tenant(ctx),
		pgtype.UUID{Bytes: fromStorageID, Valid: true},
		pgtype.UUID{Bytes: toStorageID, Valid: true},
		transferDate,
		"transfer",
	); err != nil {
		return nil, err
	}

	q, txCtx, tx, ownsTx, err := s.getTenantMutationQueries(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to get tenant queries: %w", err)
	}
	if ownsTx {
		defer tx.Rollback(ctx)
	}

	transfer, err := q.CreateTransfer(txCtx, pg.CreateTransferParams{
		ID:            uuid.New(),
		FromBranchID:  fromBranchID,
		ToBranchID:    toBranchID,
		FromStorageID: fromStorageID,
		ToStorageID:   toStorageID,
		ActGroupID:    actGroupID,
		Description:   req.Description,
		Status:        status,
		Date:          transferDate,
		TotalAmount:   pgtype.Numeric{Int: big.NewInt(0), Exp: 0, Valid: true},
	})
	if err != nil {
		return nil, fmt.Errorf("failed to create transfer: %w", err)
	}

	applyStock := status == pg.TransferStatusActive
	items, err := s.processTransferItems(txCtx, q, transfer.ID, fromStorageID, toStorageID, fromBranchID, toBranchID, req.Items, applyStock, transfer.Date)
	if err != nil {
		return nil, err
	}

	if applyStock {
		if err := q.RecalculateTransferTotal(txCtx, transfer.ID); err != nil {
			log.Printf("failed to recalculate transfer total: %v", err)
		}
		transfer, err = q.GetTransferByID(txCtx, transfer.ID)
		if err != nil {
			return nil, fmt.Errorf("failed to fetch transfer: %w", err)
		}
	}

	if ownsTx {
		if err := tx.Commit(ctx); err != nil {
			return nil, fmt.Errorf("failed to commit transaction: %w", err)
		}
	}

	for i := range items {
		hideTransferDraftStockSnapshot(&items[i], transfer.Status)
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

	transferDate := pgtype.Timestamptz{Time: time.Now(), Valid: true}
	if err := assertCanMutateTransferTarget(
		ctx,
		s.repo.Tenant(ctx),
		pgtype.UUID{Bytes: fromStorageID, Valid: true},
		pgtype.UUID{Bytes: toStorageID, Valid: true},
		transferDate,
		"transfer",
	); err != nil {
		return nil, err
	}

	q, txCtx, tx, ownsTx, err := s.getTenantMutationQueries(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to get tenant queries: %w", err)
	}
	if ownsTx {
		defer tx.Rollback(ctx)
	}

	transfer, err := q.CreateTransfer(txCtx, pg.CreateTransferParams{
		ID:            uuid.New(),
		FromBranchID:  fromBranchID,
		ToBranchID:    toBranchID,
		FromStorageID: fromStorageID,
		ToStorageID:   toStorageID,
		ActGroupID:    actGroupID,
		Description:   req.Description,
		Status:        status,
		Date:          transferDate,
		TotalAmount:   pgtype.Numeric{Int: big.NewInt(0), Exp: 0, Valid: true},
	})
	if err != nil {
		return nil, fmt.Errorf("failed to create transfer: %w", err)
	}

	if ownsTx {
		if err := tx.Commit(ctx); err != nil {
			return nil, fmt.Errorf("failed to commit transaction: %w", err)
		}
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

	q, txCtx, tx, ownsTx, err := s.getTenantMutationQueries(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to get tenant queries: %w", err)
	}
	if ownsTx {
		defer tx.Rollback(ctx)
	}

	transfer, err := q.GetTransferByID(txCtx, transferID)
	if err != nil {
		return nil, fmt.Errorf("transfer not found: %w", err)
	}
	if transfer.Status == pg.TransferStatusDeleted {
		return nil, fmt.Errorf("cannot add items to a deleted transfer")
	}

	if err := assertCanMutateTransferCurrent(txCtx, q, transfer, "transfer items"); err != nil {
		return nil, err
	}

	applyStock := transfer.Status == pg.TransferStatusActive
	_, err = s.processTransferItems(txCtx, q, transfer.ID, transfer.FromStorageID, transfer.ToStorageID, transfer.FromBranchID, transfer.ToBranchID, req.Items, applyStock, transfer.Date)
	if err != nil {
		return nil, err
	}

	if applyStock {
		if err := q.RecalculateTransferTotal(txCtx, transfer.ID); err != nil {
			log.Printf("failed to recalculate transfer total: %v", err)
		}
	}

	if ownsTx {
		if err := tx.Commit(ctx); err != nil {
			return nil, fmt.Errorf("failed to commit transaction: %w", err)
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
		itemResp := toTransferItemResponse(item)
		itemResp = hideTransferDraftStockSnapshot(itemResp, transfer.Status)
		if itemResp != nil {
			resp.Items = append(resp.Items, *itemResp)
		}
	}
	return resp, nil
}

// GetAllTransfers retrieves transfers with filters and pagination.
func (s *TransferS) GetAllTransfers(ctx context.Context, filter model.TransferFilter, expand bool, limit, offset int32) (*model.PaginatedTransfersResponse, error) {
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
	if filter.FromBranchID != nil {
		if id, err := uuid.Parse(*filter.FromBranchID); err == nil {
			params.FromBranchID = id
			countParams.FromBranchID = id
		}
	}
	if filter.ToBranchID != nil {
		if id, err := uuid.Parse(*filter.ToBranchID); err == nil {
			params.ToBranchID = id
			countParams.ToBranchID = id
		}
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

	sumNumeric, err := q.SumTransfersFiltered(ctx, countParams)
	if err != nil {
		return nil, fmt.Errorf("failed to sum transfers: %w", err)
	}

	transfers, err := q.GetTransfersFiltered(ctx, params)
	if err != nil {
		return nil, fmt.Errorf("failed to get transfers: %w", err)
	}

	data := make([]*model.TransferResponse, 0, len(transfers))
	for i := range transfers {
		resp := toTransferResponse(transfers[i])
		if expand {
			items, _ := q.GetTransferItemsByTransferID(ctx, transfers[i].ID)
			resp.Items = make([]model.TransferItemResponse, 0, len(items))
			for _, item := range items {
				resp.Items = append(resp.Items, *toTransferItemResponse(item))
			}
		}
		data = append(data, resp)
	}

	totalPages := int32(1)
	if limit > 0 {
		totalPages = int32((total + int64(limit) - 1) / int64(limit))
	}

	return &model.PaginatedTransfersResponse{
		Data:        data,
		TotalAmount: numericToStr(sumNumeric),
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

	q, txCtx, tx, ownsTx, err := s.getTenantMutationQueries(ctx)
	if err != nil {
		return fmt.Errorf("failed to get tenant queries: %w", err)
	}
	if ownsTx {
		defer tx.Rollback(ctx)
	}

	transfer, err := q.GetTransferByID(txCtx, id)
	if err != nil {
		return fmt.Errorf("transfer not found: %w", err)
	}

	if err := assertCanMutateTransferCurrent(txCtx, q, transfer, "transfer"); err != nil {
		return err
	}

	if transfer.Status == pg.TransferStatusActive {
		items, err := q.GetTransferItemsByTransferID(txCtx, id)
		if err != nil {
			return fmt.Errorf("failed to fetch items: %w", err)
		}
		if err := s.reverseTransferItemsStock(txCtx, q, transfer.ID, items, transfer.FromStorageID, transfer.ToStorageID, transfer.Date); err != nil {
			return fmt.Errorf("failed to reverse transfer stock before delete: %w", err)
		}
	}

	if err := q.DeleteTransferItemsByTransferID(txCtx, id); err != nil {
		return fmt.Errorf("failed to delete items: %w", err)
	}

	if err := q.DeleteTransfer(txCtx, id); err != nil {
		return fmt.Errorf("failed to delete transfer: %w", err)
	}

	if ownsTx {
		if err := tx.Commit(ctx); err != nil {
			return fmt.Errorf("failed to commit transaction: %w", err)
		}
	}

	return nil
}

// DeleteTransferItem removes a single item; reverses stock only if transfer was active.
func (s *TransferS) DeleteTransferItem(ctx context.Context, itemID string) error {
	id, err := uuid.Parse(itemID)
	if err != nil {
		return fmt.Errorf("invalid item_id: %w", err)
	}

	q, txCtx, tx, ownsTx, err := s.getTenantMutationQueries(ctx)
	if err != nil {
		return fmt.Errorf("failed to get tenant queries: %w", err)
	}
	if ownsTx {
		defer tx.Rollback(ctx)
	}

	item, err := q.GetTransferItemByID(txCtx, id)
	if err != nil {
		return fmt.Errorf("transfer item not found: %w", err)
	}

	transfer, err := q.GetTransferByID(txCtx, item.TransferID)
	if err != nil {
		return fmt.Errorf("transfer not found: %w", err)
	}

	if err := assertCanMutateTransferCurrent(txCtx, q, transfer, "transfer item"); err != nil {
		return err
	}

	if transfer.Status == pg.TransferStatusActive {
		if err := s.reverseTransferItemsStock(txCtx, q, transfer.ID, []pg.TransferItem{item}, transfer.FromStorageID, transfer.ToStorageID, transfer.Date); err != nil {
			return fmt.Errorf("failed to reverse transfer item stock before delete: %w", err)
		}
	}

	if err := q.DeleteTransferItem(txCtx, id); err != nil {
		return fmt.Errorf("failed to delete item: %w", err)
	}

	_ = q.RecalculateTransferTotal(txCtx, item.TransferID)

	if ownsTx {
		if err := tx.Commit(ctx); err != nil {
			return fmt.Errorf("failed to commit transaction: %w", err)
		}
	}

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

	q, txCtx, tx, ownsTx, err := s.getTenantMutationQueries(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to get tenant queries: %w", err)
	}
	if ownsTx {
		defer tx.Rollback(ctx)
	}

	current, err := q.GetTransferByID(txCtx, id)
	if err != nil {
		return nil, fmt.Errorf("transfer not found: %w", err)
	}
	if current.Status == pg.TransferStatusDeleted {
		return nil, fmt.Errorf("cannot update a deleted transfer")
	}

	oldStatus := current.Status

	newStatus := oldStatus
	if req.Status != nil {
		ns, err := resolveTransferStatus(req.Status, oldStatus)
		if err != nil {
			return nil, err
		}
		if ns != oldStatus {
			if !((oldStatus == pg.TransferStatusDraft && ns == pg.TransferStatusActive) ||
				(oldStatus == pg.TransferStatusActive && ns == pg.TransferStatusDraft)) {
				return nil, fmt.Errorf("invalid status transition: %s -> %s", oldStatus, ns)
			}
		}
		newStatus = ns
	}

	newFromStorageID := current.FromStorageID
	newToStorageID := current.ToStorageID

	if req.FromStorageID != nil && *req.FromStorageID != "" {
		parsed, err := uuid.Parse(*req.FromStorageID)
		if err != nil {
			return nil, fmt.Errorf("invalid from_storage_id: %w", err)
		}
		newFromStorageID = parsed
	}

	if req.ToStorageID != nil && *req.ToStorageID != "" {
		parsed, err := uuid.Parse(*req.ToStorageID)
		if err != nil {
			return nil, fmt.Errorf("invalid to_storage_id: %w", err)
		}
		newToStorageID = parsed
	}

	newDate := current.Date
	if req.Date != nil && *req.Date != "" {
		t, err := time.Parse("2006-01-02", *req.Date)
		if err != nil {
			return nil, fmt.Errorf("invalid date: %w", err)
		}
		newDate = pgtype.Timestamptz{Time: t, Valid: true}
	}

	if err := assertCanMutateTransferChange(
		ctx,
		s.repo.Tenant(ctx),
		current,
		pgtype.UUID{Bytes: newFromStorageID, Valid: true},
		pgtype.UUID{Bytes: newToStorageID, Valid: true},
		newDate,
		"transfer",
	); err != nil {
		return nil, err
	}

	// IMPORTANT:
	// reverse OLD active state BEFORE updating header/date/storage
	if oldStatus == pg.TransferStatusActive {
		existing, err := q.GetTransferItemsByTransferID(txCtx, id)
		if err != nil {
			return nil, fmt.Errorf("failed to fetch existing items: %w", err)
		}

		if len(existing) > 0 {
			if err := s.reverseTransferItemsStock(
				txCtx,
				q,
				current.ID,
				existing,
				current.FromStorageID,
				current.ToStorageID,
				current.Date,
			); err != nil {
				return nil, fmt.Errorf("failed to reverse old transfer stock: %w", err)
			}
		}
	}

	updateParams := pg.UpdateTransferParams{
		ID:            id,
		FromBranchID:  current.FromBranchID,
		ToBranchID:    current.ToBranchID,
		FromStorageID: newFromStorageID,
		ToStorageID:   newToStorageID,
		ActGroupID:    current.ActGroupID,
		Description:   current.Description,
		Status:        newStatus,
		Date:          newDate,
		TotalAmount:   current.TotalAmount,
	}

	if req.ActGroupID != nil {
		if *req.ActGroupID == "" {
			updateParams.ActGroupID = pgtype.UUID{}
		} else {
			parsed, err := uuid.Parse(*req.ActGroupID)
			if err != nil {
				return nil, fmt.Errorf("invalid act_group_id: %w", err)
			}
			updateParams.ActGroupID = pgtype.UUID{Bytes: parsed, Valid: true}
		}
	}

	if req.Description != nil {
		updateParams.Description = req.Description
	}

	updated, err := q.UpdateTransfer(txCtx, updateParams)
	if err != nil {
		return nil, fmt.Errorf("failed to update transfer: %w", err)
	}

	if err := q.DeleteTransferItemsByTransferID(txCtx, id); err != nil {
		return nil, fmt.Errorf("failed to delete existing items: %w", err)
	}

	applyStock := newStatus == pg.TransferStatusActive
	if _, err := s.processTransferItems(
		txCtx,
		q,
		id,
		newFromStorageID,
		newToStorageID,
		updated.FromBranchID,
		updated.ToBranchID,
		req.Items,
		applyStock,
		updated.Date,
	); err != nil {
		return nil, err
	}

	_ = q.RecalculateTransferTotal(txCtx, id)

	if ownsTx {
		if err := tx.Commit(ctx); err != nil {
			return nil, fmt.Errorf("failed to commit transaction: %w", err)
		}
	}

	return s.GetTransferByID(ctx, transferID)
}

// ==================== HELPERS ====================

func (s *TransferS) reverseTransferItemsStock(ctx context.Context, q *pg.Queries, transferID uuid.UUID, items []pg.TransferItem, fromStorageID, toStorageID uuid.UUID, transferDate pgtype.Timestamptz) error {
	fromStorageUUID := pgtype.UUID{Bytes: fromStorageID, Valid: true}
	toStorageUUID := pgtype.UUID{Bytes: toStorageID, Valid: true}

	zero := inventoryZeroNumeric()
	effectiveAt := transferEffectiveAt(transferDate)
	sourceType := "transfer"

	touched := make(map[transferTouchedKey]struct{})

	for _, item := range items {
		// 1) SOURCE storage rollback:
		// old transfer_out ni qaytarish => source storagega IN
		senderStockID := s.getStockID(ctx, q, item.IngredientID, fromStorageUUID)
		if senderStockID == uuid.Nil {
			ensuredID, err := q.EnsureIngredientStockByStorage(ctx, pg.EnsureIngredientStockByStorageParams{
				ID:           uuid.New(),
				IngredientID: item.IngredientID,
				StorageID:    fromStorageUUID,
			})
			if err != nil {
				return fmt.Errorf("failed to ensure sender stock during transfer reverse: %w", err)
			}
			senderStockID = ensuredID
		}

		senderLocked, err := q.GetStockByIngredientAndStorageExplicit(ctx, pg.GetStockByIngredientAndStorageExplicitParams{
			IngredientID: item.IngredientID,
			StorageID:    fromStorageUUID,
		})
		if err != nil {
			return fmt.Errorf("failed to lock sender stock during transfer reverse: %w", err)
		}

		senderUpdated, err := q.AddStockByID(ctx, pg.AddStockByIDParams{
			ID:       senderStockID,
			Quantity: item.Quantity,
		})
		if err != nil {
			return fmt.Errorf("failed to restore sender stock during transfer reverse: %w", err)
		}

		if !shouldSkipStockMovement(item.Quantity, zero) {
			if err := q.InsertIngredientStockMovement(ctx, pg.InsertIngredientStockMovementParams{
				ID:           uuid.New(),
				StorageID:    fromStorageID,
				IngredientID: item.IngredientID,
				EventType:    "transfer_reverted_from_in",
				QtyIn:        item.Quantity,
				QtyOut:       zero,
				StockBefore:  senderLocked.Quantity,
				StockAfter:   senderUpdated.Quantity,
				PricePerUnit: item.Price,
				SourceType:   &sourceType,
				SourceID:     &transferID,
				EffectiveAt:  effectiveAt,
			}); err != nil {
				return fmt.Errorf("failed to insert sender reverse movement: %w", err)
			}
		}

		touched[transferTouchedKey{
			StorageID:    fromStorageID,
			IngredientID: item.IngredientID,
		}] = struct{}{}

		// 2) DESTINATION storage rollback:
		// old transfer_in ni qaytarish => destination storagedan OUT
		receiverStockID := s.getStockID(ctx, q, item.IngredientID, toStorageUUID)
		if receiverStockID == uuid.Nil {
			ensuredID, err := q.EnsureIngredientStockByStorage(ctx, pg.EnsureIngredientStockByStorageParams{
				ID:           uuid.New(),
				IngredientID: item.IngredientID,
				StorageID:    toStorageUUID,
			})
			if err != nil {
				return fmt.Errorf("failed to ensure receiver stock during transfer reverse: %w", err)
			}
			receiverStockID = ensuredID
		}

		receiverLocked, err := q.GetStockByIngredientAndStorageExplicit(ctx, pg.GetStockByIngredientAndStorageExplicitParams{
			IngredientID: item.IngredientID,
			StorageID:    toStorageUUID,
		})
		if err != nil {
			return fmt.Errorf("failed to lock receiver stock during transfer reverse: %w", err)
		}

		receiverUpdated, err := q.DeductStockAllowNegative(ctx, receiverStockID, item.Quantity)
		if err != nil {
			return fmt.Errorf("failed to deduct receiver stock during transfer reverse: %w", err)
		}

		if !shouldSkipStockMovement(zero, item.Quantity) {
			if err := q.InsertIngredientStockMovement(ctx, pg.InsertIngredientStockMovementParams{
				ID:           uuid.New(),
				StorageID:    toStorageID,
				IngredientID: item.IngredientID,
				EventType:    "transfer_reverted_to_out",
				QtyIn:        zero,
				QtyOut:       item.Quantity,
				StockBefore:  receiverLocked.Quantity,
				StockAfter:   receiverUpdated.Quantity,
				PricePerUnit: item.Price,
				SourceType:   &sourceType,
				SourceID:     &transferID,
				EffectiveAt:  effectiveAt,
			}); err != nil {
				return fmt.Errorf("failed to insert receiver reverse movement: %w", err)
			}
		}

		touched[transferTouchedKey{
			StorageID:    toStorageID,
			IngredientID: item.IngredientID,
		}] = struct{}{}
	}

	for key := range touched {
		if err := s.rebalanceTransferIngredientLedger(
			ctx,
			q,
			pgtype.UUID{Bytes: key.StorageID, Valid: true},
			key.IngredientID,
		); err != nil {
			return fmt.Errorf("failed to rebalance transfer reverse ledger: %w", err)
		}
	}

	return nil
}

// processTransferItems creates item records; applies stock changes only when applyStock == true.
func (s *TransferS) processTransferItems(ctx context.Context, q *pg.Queries, transferID uuid.UUID, fromStorageID, toStorageID, fromBranchID, toBranchID uuid.UUID, entries []model.CreateTransferItemEntry, applyStock bool, transferDate pgtype.Timestamptz) ([]model.TransferItemResponse, error) {
	fromStorageUUID := pgtype.UUID{Bytes: fromStorageID, Valid: true}
	toStorageUUID := pgtype.UUID{Bytes: toStorageID, Valid: true}
	fromBranchUUID := pgtype.UUID{Bytes: fromBranchID, Valid: true}
	toBranchUUID := pgtype.UUID{Bytes: toBranchID, Valid: true}

	zero := inventoryZeroNumeric()
	effectiveAt := transferEffectiveAt(transferDate)
	sourceType := "transfer"

	touched := make(map[transferTouchedKey]struct{})
	responses := make([]model.TransferItemResponse, 0, len(entries))

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

		ingredient, err := q.GetIngredientByID(ctx, ingredientID)
		if err != nil {
			log.Printf("items[%d]: failed to fetch ingredient price, using 0: %v", i, err)
		}
		price := ingredient.PricePerUnit
		totalAmount := multiplyNumeric(price, qty)

		var stockBefore, stockAfter pgtype.Numeric

		if applyStock {
			// 1) SOURCE storage => OUT
			senderStock, err := q.EnsureIngredientStockByStorageWithBranch(ctx, pg.EnsureIngredientStockByStorageWithBranchParams{
				ID:           uuid.New(),
				IngredientID: ingredientID,
				StorageID:    fromStorageUUID,
				BranchID:     fromBranchUUID,
			})
			if err != nil {
				return nil, fmt.Errorf("items[%d]: failed to ensure sender stock: %w", i, err)
			}

			senderLocked, err := q.GetStockByIngredientAndStorageExplicit(ctx, pg.GetStockByIngredientAndStorageExplicitParams{
				IngredientID: ingredientID,
				StorageID:    fromStorageUUID,
			})
			if err != nil {
				return nil, fmt.Errorf("items[%d]: failed to lock sender stock: %w", i, err)
			}

			updatedSender, err := q.DeductStockAllowNegative(ctx, senderStock.ID, qty)
			if err != nil {
				return nil, fmt.Errorf("items[%d]: failed to deduct sender stock for ingredient %s: %w", i, ingredientID, err)
			}

			// Transfer item response snapshot sifatida source storage holatini saqlaymiz
			stockBefore = senderLocked.Quantity
			stockAfter = updatedSender.Quantity

			// 2) DESTINATION storage => IN
			receiverStock, err := q.EnsureIngredientStockByStorageWithBranch(ctx, pg.EnsureIngredientStockByStorageWithBranchParams{
				ID:           uuid.New(),
				IngredientID: ingredientID,
				StorageID:    toStorageUUID,
				BranchID:     toBranchUUID,
			})
			if err != nil {
				return nil, fmt.Errorf("items[%d]: failed to ensure receiver stock: %w", i, err)
			}

			receiverLocked, err := q.GetStockByIngredientAndStorageExplicit(ctx, pg.GetStockByIngredientAndStorageExplicitParams{
				IngredientID: ingredientID,
				StorageID:    toStorageUUID,
			})
			if err != nil {
				return nil, fmt.Errorf("items[%d]: failed to lock receiver stock: %w", i, err)
			}

			updatedReceiver, err := q.AddStockByID(ctx, pg.AddStockByIDParams{
				ID:       receiverStock.ID,
				Quantity: qty,
			})
			if err != nil {
				return nil, fmt.Errorf("items[%d]: failed to add to receiver stock: %w", i, err)
			}

			_ = q.EnsureIngredientVisibility(ctx, pg.EnsureIngredientVisibilityParams{
				IngredientID: ingredientID,
				BranchID:     toBranchID,
			})

			// SOURCE movement => transfer_out
			if !shouldSkipStockMovement(zero, qty) {
				if err := q.InsertIngredientStockMovement(ctx, pg.InsertIngredientStockMovementParams{
					ID:           uuid.New(),
					StorageID:    fromStorageID,
					IngredientID: ingredientID,
					EventType:    "transfer_out",
					QtyIn:        zero,
					QtyOut:       qty,
					StockBefore:  senderLocked.Quantity,
					StockAfter:   updatedSender.Quantity,
					PricePerUnit: price,
					SourceType:   &sourceType,
					SourceID:     &transferID,
					EffectiveAt:  effectiveAt,
				}); err != nil {
					return nil, fmt.Errorf("items[%d]: failed to insert sender transfer movement: %w", i, err)
				}
			}

			// DESTINATION movement => transfer_in
			if !shouldSkipStockMovement(qty, zero) {
				if err := q.InsertIngredientStockMovement(ctx, pg.InsertIngredientStockMovementParams{
					ID:           uuid.New(),
					StorageID:    toStorageID,
					IngredientID: ingredientID,
					EventType:    "transfer_in",
					QtyIn:        qty,
					QtyOut:       zero,
					StockBefore:  receiverLocked.Quantity,
					StockAfter:   updatedReceiver.Quantity,
					PricePerUnit: price,
					SourceType:   &sourceType,
					SourceID:     &transferID,
					EffectiveAt:  effectiveAt,
				}); err != nil {
					return nil, fmt.Errorf("items[%d]: failed to insert receiver transfer movement: %w", i, err)
				}
			}

			touched[transferTouchedKey{
				StorageID:    fromStorageID,
				IngredientID: ingredientID,
			}] = struct{}{}
			touched[transferTouchedKey{
				StorageID:    toStorageID,
				IngredientID: ingredientID,
			}] = struct{}{}
		} else {
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

		resp := toTransferItemResponse(item)
		if resp != nil {
			responses = append(responses, *resp)
		}
	}

	for key := range touched {
		if err := s.rebalanceTransferIngredientLedger(
			ctx,
			q,
			pgtype.UUID{Bytes: key.StorageID, Valid: true},
			key.IngredientID,
		); err != nil {
			return nil, fmt.Errorf("failed to rebalance transfer ledger: %w", err)
		}
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

func hideTransferDraftStockSnapshot(resp *model.TransferItemResponse, transferStatus any) *model.TransferItemResponse {
	if resp == nil {
		return nil
	}
	if fmt.Sprint(transferStatus) == "draft" {
		resp.StockQtyBefore = ""
		resp.StockQtyAfter = ""
	}
	return resp
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
