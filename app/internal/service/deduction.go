package service

import (
	"context"
	"fmt"
	"math/big"
	"strconv"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"gitlab.yurtal.tech/company/maryai/back/internal/model"
	"gitlab.yurtal.tech/company/maryai/back/internal/repository"
	pg "gitlab.yurtal.tech/company/maryai/back/internal/repository/pg/tenantsdb"
)

type DeductionS struct {
	repo *repository.Repository
}

func NewDeductionS(repo *repository.Repository) *DeductionS {
	return &DeductionS{repo: repo}
}

func (s *DeductionS) getTenantMutationQueries(ctx context.Context) (*pg.Queries, context.Context, pgx.Tx, bool, error) {
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

type deductionTouchedKey struct {
	StorageID    uuid.UUID
	IngredientID uuid.UUID
}

func deductionEffectiveAt(ts pgtype.Timestamptz) *pgtype.Timestamptz {
	if !ts.Valid {
		return nil
	}
	effective := pgtype.Timestamptz{
		Time:  ts.Time.In(time.UTC),
		Valid: true,
	}
	return &effective
}

func deductionFreezeDate(d pgtype.Date, entityName string) (time.Time, error) {
	if !d.Valid {
		return time.Time{}, fmt.Errorf("%s date is required for inventory freeze check", entityName)
	}
	return d.Time, nil
}

func assertCanMutateDeductionCurrent(ctx context.Context, q *pg.Queries, d pg.Deduction, entityName string) error {
	effectiveAt, err := deductionFreezeDate(d.Date, entityName)
	if err != nil {
		return err
	}
	return assertCanMutateAfterInventory(ctx, q, d.StorageID, effectiveAt, entityName)
}

func assertCanMutateDeductionTarget(ctx context.Context, q *pg.Queries, storageID uuid.UUID, date pgtype.Date, entityName string) error {
	effectiveAt, err := deductionFreezeDate(date, entityName)
	if err != nil {
		return err
	}
	return assertCanMutateAfterInventory(ctx, q, storageID, effectiveAt, entityName)
}

func assertCanMutateDeductionChange(ctx context.Context, q *pg.Queries, current pg.Deduction, targetStorage uuid.UUID, targetDate pgtype.Date, entityName string) error {
	if err := assertCanMutateDeductionCurrent(ctx, q, current, entityName); err != nil {
		return err
	}
	if err := assertCanMutateDeductionTarget(ctx, q, targetStorage, targetDate, entityName); err != nil {
		return err
	}
	return nil
}

func (s *DeductionS) rebalanceDeductionIngredientLedger(
	ctx context.Context,
	q *pg.Queries,
	storageID pgtype.UUID,
	ingredientID uuid.UUID,
) error {
	return rebalanceIngredientStockLedger(ctx, q, storageID, ingredientID, "deduction")
}

type ingredientUsage struct {
	ingredientID uuid.UUID
	quantity     pgtype.Numeric
}

type compoundUsage struct {
	compoundID uuid.UUID
	quantity   pgtype.Numeric
}

func numericToRat(n pgtype.Numeric) (*big.Rat, error) {
	if !n.Valid {
		return big.NewRat(0, 1), nil
	}
	v, err := n.Value()
	if err != nil {
		return nil, err
	}
	var s string
	switch t := v.(type) {
	case string:
		s = t
	case []byte:
		s = string(t)
	default:
		s = fmt.Sprintf("%v", v)
	}
	if s == "" {
		return big.NewRat(0, 1), nil
	}
	r := new(big.Rat)
	if _, ok := r.SetString(s); !ok {
		return nil, fmt.Errorf("invalid numeric: %s", s)
	}
	return r, nil
}

func ratToNumeric(r *big.Rat, scale int) (pgtype.Numeric, error) {
	if r == nil {
		return pgtype.Numeric{}, nil
	}
	s := r.FloatString(scale)
	n := pgtype.Numeric{}
	if err := n.Scan(s); err != nil {
		return pgtype.Numeric{}, err
	}
	return n, nil
}

func mulNumeric(a, b pgtype.Numeric, scale int) (pgtype.Numeric, error) {
	ra, err := numericToRat(a)
	if err != nil {
		return pgtype.Numeric{}, err
	}
	rb, err := numericToRat(b)
	if err != nil {
		return pgtype.Numeric{}, err
	}
	out := new(big.Rat).Mul(ra, rb)
	return ratToNumeric(out, scale)
}

func subNumericClampZero(a, b pgtype.Numeric, scale int) (pgtype.Numeric, error) {
	ra, err := numericToRat(a)
	if err != nil {
		return pgtype.Numeric{}, err
	}
	rb, err := numericToRat(b)
	if err != nil {
		return pgtype.Numeric{}, err
	}
	out := new(big.Rat).Sub(ra, rb)
	if out.Sign() < 0 {
		out = big.NewRat(0, 1)
	}
	return ratToNumeric(out, scale)
}

func (s *DeductionS) CreateDeductionActGroup(ctx context.Context, req *model.CreateDeductionActGroupRequest) (*model.DeductionActGroupResponse, error) {
	if req == nil {
		return nil, fmt.Errorf("request is required")
	}
	if req.Name == "" {
		return nil, fmt.Errorf("name is required")
	}

	q, txCtx, tx, shouldCommit, err := s.getTenantMutationQueries(ctx)
	if err != nil {
		return nil, err
	}
	if shouldCommit {
		defer tx.Rollback(ctx)
	}

	row, err := q.CreateDeductionActGroup(txCtx, pg.CreateDeductionActGroupParams{
		ID:   uuid.New(),
		Name: req.Name,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to create deduction act group: %w", err)
	}

	if shouldCommit {
		if err := tx.Commit(ctx); err != nil {
			return nil, fmt.Errorf("failed to commit transaction: %w", err)
		}
	}

	return &model.DeductionActGroupResponse{
		ID:        row.ID.String(),
		Name:      row.Name,
		CreatedAt: timestampToTime(row.CreatedAt),
		UpdatedAt: timestampToTime(row.UpdatedAt),
	}, nil
}

func (s *DeductionS) GetAllDeductionActGroups(ctx context.Context, limit, offset int32) ([]*model.DeductionActGroupResponse, error) {
	var rows []pg.DeductionActGroup
	err := withTenantRead(ctx, s.repo, func(ctx context.Context, q *pg.Queries) error {
		var err error
		rows, err = q.GetAllDeductionActGroups(ctx, pg.GetAllDeductionActGroupsParams{Limit: limit, Offset: offset})
		if err != nil {
			return fmt.Errorf("failed to get deduction act groups: %w", err)
		}
		return nil
	})
	if err != nil {
		return nil, err
	}

	resp := make([]*model.DeductionActGroupResponse, 0, len(rows))
	for _, r := range rows {
		rr := r
		resp = append(resp, &model.DeductionActGroupResponse{
			ID:        rr.ID.String(),
			Name:      rr.Name,
			CreatedAt: timestampToTime(rr.CreatedAt),
			UpdatedAt: timestampToTime(rr.UpdatedAt),
		})
	}
	return resp, nil
}

func (s *DeductionS) GetDeductionActGroupByID(ctx context.Context, id string) (*model.DeductionActGroupResponse, error) {
	u, err := uuid.Parse(id)
	if err != nil {
		return nil, fmt.Errorf("invalid id: %w", err)
	}

	var row pg.DeductionActGroup
	err = withTenantRead(ctx, s.repo, func(ctx context.Context, q *pg.Queries) error {
		var err error
		row, err = q.GetDeductionActGroupByID(ctx, u)
		if err != nil {
			if err == pgx.ErrNoRows {
				return nil
			}
			return fmt.Errorf("failed to get deduction act group: %w", err)
		}
		return nil
	})
	if err != nil {
		return nil, err
	}

	return &model.DeductionActGroupResponse{
		ID:        row.ID.String(),
		Name:      row.Name,
		CreatedAt: timestampToTime(row.CreatedAt),
		UpdatedAt: timestampToTime(row.UpdatedAt),
	}, nil
}

func (s *DeductionS) UpdateDeductionActGroup(ctx context.Context, id string, req *model.UpdateDeductionActGroupRequest) (*model.DeductionActGroupResponse, error) {
	if req == nil {
		return nil, fmt.Errorf("request is required")
	}
	u, err := uuid.Parse(id)
	if err != nil {
		return nil, fmt.Errorf("invalid id: %w", err)
	}

	var existing pg.DeductionActGroup
	err = withTenantRead(ctx, s.repo, func(ctx context.Context, q *pg.Queries) error {
		var err error
		existing, err = q.GetDeductionActGroupByID(ctx, u)
		if err != nil {
			if err == pgx.ErrNoRows {
				return nil
			}
			return fmt.Errorf("failed to get deduction act group: %w", err)
		}
		return nil
	})
	if err != nil {
		return nil, err
	}

	name := existing.Name
	if req.Name != nil && *req.Name != "" {
		name = *req.Name
	}

	q, txCtx, tx, shouldCommit, err := s.getTenantMutationQueries(ctx)
	if err != nil {
		return nil, err
	}
	if shouldCommit {
		defer tx.Rollback(ctx)
	}

	row, err := q.UpdateDeductionActGroup(txCtx, pg.UpdateDeductionActGroupParams{ID: u, Name: name})
	if err != nil {
		return nil, fmt.Errorf("failed to update deduction act group: %w", err)
	}

	if shouldCommit {
		if err := tx.Commit(ctx); err != nil {
			return nil, fmt.Errorf("failed to commit transaction: %w", err)
		}
	}

	return &model.DeductionActGroupResponse{
		ID:        row.ID.String(),
		Name:      row.Name,
		CreatedAt: timestampToTime(row.CreatedAt),
		UpdatedAt: timestampToTime(row.UpdatedAt),
	}, nil
}

func (s *DeductionS) DeleteDeductionActGroup(ctx context.Context, id string) error {
	u, err := uuid.Parse(id)
	if err != nil {
		return fmt.Errorf("invalid id: %w", err)
	}

	q, txCtx, tx, shouldCommit, err := s.getTenantMutationQueries(ctx)
	if err != nil {
		return err
	}
	if shouldCommit {
		defer tx.Rollback(ctx)
	}

	if err := q.DeleteDeductionActGroup(txCtx, u); err != nil {
		return fmt.Errorf("failed to delete deduction act group: %w", err)
	}

	if shouldCommit {
		if err := tx.Commit(ctx); err != nil {
			return fmt.Errorf("failed to commit transaction: %w", err)
		}
	}

	return nil
}

func (s *DeductionS) RestoreDeductionActGroup(ctx context.Context, id string) (*model.DeductionActGroupResponse, error) {
	u, err := uuid.Parse(id)
	if err != nil {
		return nil, fmt.Errorf("invalid id: %w", err)
	}

	q, txCtx, tx, shouldCommit, err := s.getTenantMutationQueries(ctx)
	if err != nil {
		return nil, err
	}
	if shouldCommit {
		defer tx.Rollback(ctx)
	}

	row, err := q.RestoreDeductionActGroup(txCtx, u)
	if err != nil {
		return nil, fmt.Errorf("failed to restore deduction act group: %w", err)
	}

	if shouldCommit {
		if err := tx.Commit(ctx); err != nil {
			return nil, fmt.Errorf("failed to commit transaction: %w", err)
		}
	}

	return &model.DeductionActGroupResponse{
		ID:        row.ID.String(),
		Name:      row.Name,
		CreatedAt: timestampToTime(row.CreatedAt),
		UpdatedAt: timestampToTime(row.UpdatedAt),
	}, nil
}

func (s *DeductionS) expandCompoundToIngredients(ctx context.Context, q *pg.Queries, compoundID uuid.UUID, multiplier pgtype.Numeric, visited map[uuid.UUID]bool) ([]ingredientUsage, error) {
	if visited[compoundID] {
		return nil, fmt.Errorf("compound cycle detected")
	}
	visited[compoundID] = true
	defer func() { visited[compoundID] = false }()

	calcs, err := q.GetCalculationsByCompoundID(ctx, pgtype.UUID{Bytes: compoundID, Valid: true})
	if err != nil {
		return nil, fmt.Errorf("failed to get compound calculations: %w", err)
	}

	var out []ingredientUsage
	for _, c := range calcs {
		if c.ComponentCompoundID.Valid {
			child := c.ComponentCompoundID.Bytes
			childMultiplier, err := mulNumeric(multiplier, c.Quantity, 6)
			if err != nil {
				return nil, err
			}
			sub, err := s.expandCompoundToIngredients(ctx, q, child, childMultiplier, visited)
			if err != nil {
				return nil, err
			}
			out = append(out, sub...)
			continue
		}
		if !c.IngredientID.Valid {
			continue
		}
		usedQty, err := mulNumeric(multiplier, c.Quantity, 6)
		if err != nil {
			return nil, err
		}
		out = append(out, ingredientUsage{ingredientID: c.IngredientID.Bytes, quantity: usedQty})
	}
	return out, nil
}

func (s *DeductionS) expandCompoundToDirectCompounds(ctx context.Context, q *pg.Queries, compoundID uuid.UUID, multiplier pgtype.Numeric) ([]compoundUsage, error) {
	calcs, err := q.GetCalculationsByCompoundID(ctx, pgtype.UUID{Bytes: compoundID, Valid: true})
	if err != nil {
		return nil, fmt.Errorf("failed to get compound calculations: %w", err)
	}

	out := make([]compoundUsage, 0)
	for _, c := range calcs {
		if !c.ComponentCompoundID.Valid {
			continue
		}
		usedQty, err := mulNumeric(multiplier, c.Quantity, 6)
		if err != nil {
			return nil, err
		}
		out = append(out, compoundUsage{compoundID: c.ComponentCompoundID.Bytes, quantity: usedQty})
	}
	return out, nil
}

func (s *DeductionS) expandGoodToIngredients(ctx context.Context, q *pg.Queries, goodID uuid.UUID, multiplier pgtype.Numeric) ([]ingredientUsage, error) {
	calcs, err := q.GetCalculationsByGoodID(ctx, pgtype.UUID{Bytes: goodID, Valid: true})
	if err != nil {
		return nil, fmt.Errorf("failed to get good calculations: %w", err)
	}

	visited := map[uuid.UUID]bool{}
	var out []ingredientUsage
	for _, c := range calcs {
		if c.ComponentCompoundID.Valid {
			child := c.ComponentCompoundID.Bytes
			childMultiplier, err := mulNumeric(multiplier, c.Quantity, 6)
			if err != nil {
				return nil, err
			}
			sub, err := s.expandCompoundToIngredients(ctx, q, child, childMultiplier, visited)
			if err != nil {
				return nil, err
			}
			out = append(out, sub...)
			continue
		}
		if !c.IngredientID.Valid {
			continue
		}
		usedQty, err := mulNumeric(multiplier, c.Quantity, 6)
		if err != nil {
			return nil, err
		}
		out = append(out, ingredientUsage{ingredientID: c.IngredientID.Bytes, quantity: usedQty})
	}
	return out, nil
}

func (s *DeductionS) expandGoodToDirectCompounds(ctx context.Context, q *pg.Queries, goodID uuid.UUID, multiplier pgtype.Numeric) ([]compoundUsage, error) {
	calcs, err := q.GetCalculationsByGoodID(ctx, pgtype.UUID{Bytes: goodID, Valid: true})
	if err != nil {
		return nil, fmt.Errorf("failed to get good calculations: %w", err)
	}

	out := make([]compoundUsage, 0)
	for _, c := range calcs {
		if !c.ComponentCompoundID.Valid {
			continue
		}
		usedQty, err := mulNumeric(multiplier, c.Quantity, 6)
		if err != nil {
			return nil, err
		}
		out = append(out, compoundUsage{compoundID: c.ComponentCompoundID.Bytes, quantity: usedQty})
	}

	return out, nil
}

// reverseAllDeductionStock adds back all stock deducted by this deduction (via deduction_item_ingredients).
// Soft-deletes breakdown records after reversal.
func (s *DeductionS) reverseAllDeductionStock(ctx context.Context, q *pg.Queries, deductionID uuid.UUID, storageID uuid.UUID, eventType string, deductionDate pgtype.Timestamptz) error {
	storagePg := pgtype.UUID{Bytes: storageID, Valid: true}
	zero := inventoryZeroNumeric()
	sourceType := "deduction"
	effectiveAt := deductionEffectiveAt(deductionDate)

	items, err := q.GetDeductionItemsByDeductionID(ctx, deductionID)
	if err != nil {
		return fmt.Errorf("failed to get deduction items for reverse: %w", err)
	}

	touched := make(map[deductionTouchedKey]struct{})

	for _, item := range items {
		breakdowns, err := q.GetDeductionItemIngredientsByDeductionItemID(ctx, item.ID)
		if err != nil {
			return fmt.Errorf("failed to get deduction item ingredients for reverse: %w", err)
		}

		for _, b := range breakdowns {
			if shouldSkipStockMovement(b.Quantity, zero) {
				continue
			}

			_, err := q.EnsureIngredientStockByStorage(ctx, pg.EnsureIngredientStockByStorageParams{
				ID:           uuid.New(),
				IngredientID: b.IngredientID,
				StorageID:    storagePg,
			})
			if err != nil {
				return fmt.Errorf("failed to ensure stock row during deduction reverse: %w", err)
			}

			locked, err := q.GetStockByIngredientAndStorageForUpdate(ctx, pg.GetStockByIngredientAndStorageForUpdateParams{
				IngredientID: b.IngredientID,
				StorageID:    storagePg,
			})
			if err != nil {
				return fmt.Errorf("failed to lock stock row during deduction reverse: %w", err)
			}

			updated, err := q.AddToIngredientStock(ctx, pg.AddToIngredientStockParams{
				ID:       locked.ID,
				Quantity: b.Quantity,
			})
			if err != nil {
				return fmt.Errorf("failed to restore stock during deduction reverse: %w", err)
			}

			if err := q.InsertIngredientStockMovement(ctx, pg.InsertIngredientStockMovementParams{
				ID:           uuid.New(),
				StorageID:    storageID,
				IngredientID: b.IngredientID,
				EventType:    eventType,
				QtyIn:        b.Quantity,
				QtyOut:       zero,
				StockBefore:  locked.Quantity,
				StockAfter:   updated.Quantity,
				PricePerUnit: b.PricePerUnit,
				SourceType:   &sourceType,
				SourceID:     &deductionID,
				EffectiveAt:  effectiveAt,
			}); err != nil {
				return fmt.Errorf("failed to insert deduction reverse movement: %w", err)
			}

			touched[deductionTouchedKey{
				StorageID:    storageID,
				IngredientID: b.IngredientID,
			}] = struct{}{}
		}

		if err := q.DeleteDeductionItemIngredientsByItemID(ctx, item.ID); err != nil {
			return fmt.Errorf("failed to delete deduction item ingredient breakdowns: %w", err)
		}
	}

	for key := range touched {
		if err := s.rebalanceDeductionIngredientLedger(ctx, q, pgtype.UUID{Bytes: key.StorageID, Valid: true}, key.IngredientID); err != nil {
			return fmt.Errorf("failed to rebalance deduction reverse ledger: %w", err)
		}
	}

	return nil
}

// reverseDeductionItemStock reverses stock for a single deduction item and soft-deletes its breakdown records.
func (s *DeductionS) reverseDeductionItemStock(ctx context.Context, q *pg.Queries, deductionID uuid.UUID, itemID uuid.UUID, storageID uuid.UUID, eventType string, deductionDate pgtype.Timestamptz) error {
	storagePg := pgtype.UUID{Bytes: storageID, Valid: true}
	zero := inventoryZeroNumeric()
	sourceType := "deduction"
	effectiveAt := deductionEffectiveAt(deductionDate)

	breakdowns, err := q.GetDeductionItemIngredientsByDeductionItemID(ctx, itemID)
	if err != nil {
		return fmt.Errorf("failed to get deduction item ingredients for reverse: %w", err)
	}

	touched := make(map[deductionTouchedKey]struct{})

	for _, b := range breakdowns {
		if shouldSkipStockMovement(b.Quantity, zero) {
			continue
		}

		_, err := q.EnsureIngredientStockByStorage(ctx, pg.EnsureIngredientStockByStorageParams{
			ID:           uuid.New(),
			IngredientID: b.IngredientID,
			StorageID:    storagePg,
		})
		if err != nil {
			return fmt.Errorf("failed to ensure stock row during deduction item reverse: %w", err)
		}

		locked, err := q.GetStockByIngredientAndStorageForUpdate(ctx, pg.GetStockByIngredientAndStorageForUpdateParams{
			IngredientID: b.IngredientID,
			StorageID:    storagePg,
		})
		if err != nil {
			return fmt.Errorf("failed to lock stock row during deduction item reverse: %w", err)
		}

		updated, err := q.AddToIngredientStock(ctx, pg.AddToIngredientStockParams{
			ID:       locked.ID,
			Quantity: b.Quantity,
		})
		if err != nil {
			return fmt.Errorf("failed to restore stock during deduction item reverse: %w", err)
		}

		if err := q.InsertIngredientStockMovement(ctx, pg.InsertIngredientStockMovementParams{
			ID:           uuid.New(),
			StorageID:    storageID,
			IngredientID: b.IngredientID,
			EventType:    eventType,
			QtyIn:        b.Quantity,
			QtyOut:       zero,
			StockBefore:  locked.Quantity,
			StockAfter:   updated.Quantity,
			PricePerUnit: b.PricePerUnit,
			SourceType:   &sourceType,
			SourceID:     &deductionID,
			EffectiveAt:  effectiveAt,
		}); err != nil {
			return fmt.Errorf("failed to insert deduction item reverse movement: %w", err)
		}

		touched[deductionTouchedKey{
			StorageID:    storageID,
			IngredientID: b.IngredientID,
		}] = struct{}{}
	}

	if err := q.DeleteDeductionItemIngredientsByItemID(ctx, itemID); err != nil {
		return fmt.Errorf("failed to delete deduction item ingredient breakdowns: %w", err)
	}

	for key := range touched {
		if err := s.rebalanceDeductionIngredientLedger(ctx, q, pgtype.UUID{Bytes: key.StorageID, Valid: true}, key.IngredientID); err != nil {
			return fmt.Errorf("failed to rebalance deduction item reverse ledger: %w", err)
		}
	}

	return nil
}

// applyDeductionItemStock expands one deduction item to ingredients, deducts stock, creates breakdowns.
func (s *DeductionS) applyDeductionItemStock(ctx context.Context, q *pg.Queries, deductionID uuid.UUID, storagePg pgtype.UUID, item pg.DeductionItem, deductionDate pgtype.Timestamptz) ([]model.DeductionItemIngredientResponse, []string, error) {
	zero := inventoryZeroNumeric()
	sourceType := "deduction"
	effectiveAt := deductionEffectiveAt(deductionDate)

	var usages []ingredientUsage
	var err error
	switch {
	case item.IngredientID.Valid:
		usages = []ingredientUsage{{ingredientID: item.IngredientID.Bytes, quantity: item.Quantity}}
	case item.GoodID.Valid:
		usages, err = s.expandGoodToIngredients(ctx, q, item.GoodID.Bytes, item.Quantity)
	case item.CompoundID.Valid:
		usages, err = s.expandCompoundToIngredients(ctx, q, item.CompoundID.Bytes, item.Quantity, map[uuid.UUID]bool{})
	default:
		err = fmt.Errorf("deduction item must reference ingredient or good or compound")
	}
	if err != nil {
		return nil, nil, err
	}

	var ingBreakdowns []model.DeductionItemIngredientResponse
	var warnings []string
	touched := make(map[deductionTouchedKey]struct{})

	for _, u := range usages {
		requestedQty := u.quantity

		_, err := q.EnsureIngredientStockByStorage(ctx, pg.EnsureIngredientStockByStorageParams{
			ID:           uuid.New(),
			IngredientID: u.ingredientID,
			StorageID:    storagePg,
		})
		if err != nil {
			return nil, nil, fmt.Errorf("failed to ensure ingredient stock row: %w", err)
		}

		stock, err := q.GetStockByIngredientAndStorageForUpdate(ctx, pg.GetStockByIngredientAndStorageForUpdateParams{
			IngredientID: u.ingredientID,
			StorageID:    storagePg,
		})
		if err != nil {
			return nil, nil, fmt.Errorf("failed to lock ingredient stock: %w", err)
		}

		ingredient, err := q.GetIngredientByID(ctx, u.ingredientID)
		if err != nil {
			return nil, nil, fmt.Errorf("failed to fetch ingredient: %w", err)
		}
		if !ingredient.PricePerUnit.Valid {
			return nil, nil, fmt.Errorf("ingredient has no price")
		}

		stockBefore := stock.Quantity

		updated, err := q.RemoveFromIngredientStock(ctx, pg.RemoveFromIngredientStockParams{
			ID:       stock.ID,
			Quantity: requestedQty,
		})
		if err != nil {
			return nil, nil, fmt.Errorf("failed to remove from ingredient stock: %w", err)
		}

		price := ingredient.PricePerUnit

		breakdown, err := q.CreateDeductionItemIngredient(ctx, pg.CreateDeductionItemIngredientParams{
			ID:              uuid.New(),
			DeductionItemID: item.ID,
			IngredientID:    u.ingredientID,
			Quantity:        requestedQty,
			StockBefore:     stockBefore,
			StockAfter:      updated.Quantity,
			PricePerUnit:    price,
		})
		if err != nil {
			return nil, nil, fmt.Errorf("failed to create deduction item ingredient: %w", err)
		}

		if !shouldSkipStockMovement(zero, requestedQty) {
			if err := q.InsertIngredientStockMovement(ctx, pg.InsertIngredientStockMovementParams{
				ID:           uuid.New(),
				StorageID:    uuid.UUID(storagePg.Bytes),
				IngredientID: u.ingredientID,
				EventType:    string(pg.DeductionOut),
				QtyIn:        zero,
				QtyOut:       requestedQty,
				StockBefore:  stockBefore,
				StockAfter:   updated.Quantity,
				PricePerUnit: price,
				SourceType:   &sourceType,
				SourceID:     &deductionID,
				EffectiveAt:  effectiveAt,
			}); err != nil {
				return nil, nil, fmt.Errorf("failed to insert deduction movement: %w", err)
			}

			touched[deductionTouchedKey{
				StorageID:    storagePg.Bytes,
				IngredientID: u.ingredientID,
			}] = struct{}{}
		}

		ingBreakdowns = append(ingBreakdowns, model.DeductionItemIngredientResponse{
			ID:              breakdown.ID.String(),
			DeductionItemID: breakdown.DeductionItemID.String(),
			IngredientID:    breakdown.IngredientID.String(),
			Quantity:        numericToStr(breakdown.Quantity),
			StockBefore:     numericToStr(breakdown.StockBefore),
			StockAfter:      numericToStr(breakdown.StockAfter),
			PricePerUnit:    numericToStr(breakdown.PricePerUnit),
			Amount:          numericToStr(breakdown.Amount),
			CreatedAt:       timestampToTime(breakdown.CreatedAt),
			UpdatedAt:       timestampToTime(breakdown.UpdatedAt),
		})
	}

	for key := range touched {
		if err := s.rebalanceDeductionIngredientLedger(ctx, q, pgtype.UUID{Bytes: key.StorageID, Valid: true}, key.IngredientID); err != nil {
			return nil, nil, fmt.Errorf("failed to rebalance deduction ledger: %w", err)
		}
	}

	return ingBreakdowns, warnings, nil
}

func (s *DeductionS) CreateDeduction(ctx context.Context, req *model.CreateDeductionRequest) (*model.DeductionResponse, error) {
	if req == nil {
		return nil, fmt.Errorf("request is required")
	}
	if req.StorageID == "" {
		return nil, fmt.Errorf("storage_id is required")
	}
	if len(req.Items) == 0 {
		return nil, fmt.Errorf("items are required")
	}

	date, err := parseDateYYYYMMDD(req.Date)
	if err != nil {
		return nil, fmt.Errorf("invalid date: %w", err)
	}

	storageUUID, err := uuid.Parse(req.StorageID)
	if err != nil {
		return nil, fmt.Errorf("invalid storage_id: %w", err)
	}
	storagePg := pgtype.UUID{Bytes: storageUUID, Valid: true}

	err = withTenantRead(ctx, s.repo, func(ctx context.Context, q *pg.Queries) error {
		return assertCanMutateDeductionTarget(ctx, q, storageUUID, pgtype.Date{Time: date, Valid: true}, "deduction")
	})
	if err != nil {
		return nil, err
	}

	actGroupPg := pgtype.UUID{Valid: false}
	if req.ActGroupID != nil && *req.ActGroupID != "" {
		u, err := uuid.Parse(*req.ActGroupID)
		if err != nil {
			return nil, fmt.Errorf("invalid act_group_id: %w", err)
		}
		actGroupPg = pgtype.UUID{Bytes: u, Valid: true}
	}

	descI18nPg := pgtype.UUID{Valid: false}
	if req.DescriptionI18n != nil && *req.DescriptionI18n != "" {
		u, err := uuid.Parse(*req.DescriptionI18n)
		if err != nil {
			return nil, fmt.Errorf("invalid description_i18n: %w", err)
		}
		descI18nPg = pgtype.UUID{Bytes: u, Valid: true}
	}

	status := "active"
	if req.Status != nil && *req.Status != "" {
		status = *req.Status
	}

	q, txCtx, tx, ownsTx, err := s.getTenantMutationQueries(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to get tenant queries: %w", err)
	}
	if ownsTx {
		defer tx.Rollback(ctx)
	}

	deductionID := uuid.New()
	deduction, err := q.CreateDeduction(txCtx, pg.CreateDeductionParams{
		ID:              deductionID,
		Date:            pgtype.Date{Time: date, Valid: true},
		ActGroupID:      actGroupPg,
		StorageID:       storageUUID,
		Description:     req.Description,
		DescriptionI18n: descI18nPg,
		Status:          status,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to create deduction: %w", err)
	}

	deductionDate := pgtype.Timestamptz{}
	if deduction.Date.Valid {
		deductionDate = pgtype.Timestamptz{Time: deduction.Date.Time.In(time.UTC), Valid: true}
	}

	warnings := make([]string, 0)
	for _, it := range req.Items {
		qtyNum := pgtype.Numeric{}
		if err := qtyNum.Scan(it.Quantity); err != nil {
			return nil, fmt.Errorf("invalid item quantity: %w", err)
		}

		refs := 0
		if it.IngredientID != nil && *it.IngredientID != "" {
			refs++
		}
		if it.GoodID != nil && *it.GoodID != "" {
			refs++
		}
		if it.CompoundID != nil && *it.CompoundID != "" {
			refs++
		}
		if refs != 1 {
			return nil, fmt.Errorf("each item must have exactly one of ingredient_id or good_id or compound_id")
		}

		var ingID, goodID, compID pgtype.UUID
		if it.IngredientID != nil && *it.IngredientID != "" {
			u, err := uuid.Parse(*it.IngredientID)
			if err != nil {
				return nil, fmt.Errorf("invalid ingredient_id: %w", err)
			}
			ingID = pgtype.UUID{Bytes: u, Valid: true}
		}
		if it.GoodID != nil && *it.GoodID != "" {
			u, err := uuid.Parse(*it.GoodID)
			if err != nil {
				return nil, fmt.Errorf("invalid good_id: %w", err)
			}
			goodID = pgtype.UUID{Bytes: u, Valid: true}
		}
		if it.CompoundID != nil && *it.CompoundID != "" {
			u, err := uuid.Parse(*it.CompoundID)
			if err != nil {
				return nil, fmt.Errorf("invalid compound_id: %w", err)
			}
			compID = pgtype.UUID{Bytes: u, Valid: true}
		}

		row, err := q.CreateDeductionItem(txCtx, pg.CreateDeductionItemParams{
			ID:           uuid.New(),
			DeductionID:  deductionID,
			IngredientID: ingID,
			GoodID:       goodID,
			CompoundID:   compID,
			Quantity:     qtyNum,
		})
		if err != nil {
			return nil, fmt.Errorf("failed to create deduction item: %w", err)
		}

		// Only apply stock when active
		if status == "active" {
			ingBreakdowns, itemWarnings, err := s.applyDeductionItemStock(txCtx, q, deductionID, storagePg, row, deductionDate)
			if err != nil {
				return nil, err
			}
			warnings = append(warnings, itemWarnings...)
			_ = ingBreakdowns
		}
	}

	_, _ = q.UpdateDeductionBalanceFromItems(txCtx, deductionID)

	if ownsTx {
		if err := tx.Commit(ctx); err != nil {
			return nil, fmt.Errorf("failed to commit transaction: %w", err)
		}
	}

	resp, err := s.GetDeductionByID(ctx, deductionID.String())
	if err != nil {
		return nil, err
	}
	resp.Warnings = warnings
	_ = deduction
	return resp, nil
}

func (s *DeductionS) GetDeductionByID(ctx context.Context, id string) (*model.DeductionResponse, error) {
	u, err := uuid.Parse(id)
	if err != nil {
		return nil, fmt.Errorf("invalid id: %w", err)
	}

	var d pg.Deduction
	var items []pg.DeductionItem
	err = withTenantRead(ctx, s.repo, func(ctx context.Context, q *pg.Queries) error {
		var err error
		d, err = q.GetDeductionByID(ctx, u)
		if err != nil {
			if err == pgx.ErrNoRows {
				return nil
			}
			return fmt.Errorf("failed to get deduction: %w", err)
		}

		items, err = q.GetDeductionItemsByDeductionID(ctx, u)
		if err != nil {
			return fmt.Errorf("failed to get deduction items: %w", err)
		}
		return nil
	})
	if err != nil {
		return nil, err
	}

	itemResp := make([]model.DeductionItemResponse, 0, len(items))
	for _, it := range items {
		var breakdowns []pg.DeductionItemIngredient
		err = withTenantRead(ctx, s.repo, func(ctx context.Context, q *pg.Queries) error {
			var err error
			breakdowns, err = q.GetDeductionItemIngredientsByDeductionItemID(ctx, it.ID)
			return err
		})
		if err != nil {
			return nil, fmt.Errorf("failed to get deduction item ingredients: %w", err)
		}

		bresp := make([]model.DeductionItemIngredientResponse, 0, len(breakdowns))
		for _, b := range breakdowns {
			bresp = append(bresp, model.DeductionItemIngredientResponse{
				ID:              b.ID.String(),
				DeductionItemID: b.DeductionItemID.String(),
				IngredientID:    b.IngredientID.String(),
				Quantity:        numericToStr(b.Quantity),
				StockBefore:     numericToStr(b.StockBefore),
				StockAfter:      numericToStr(b.StockAfter),
				PricePerUnit:    numericToStr(b.PricePerUnit),
				Amount:          numericToStr(b.Amount),
				CreatedAt:       timestampToTime(b.CreatedAt),
				UpdatedAt:       timestampToTime(b.UpdatedAt),
			})
		}

		var ingredientIDStr, goodIDStr, compoundIDStr *string
		if it.IngredientID.Valid {
			s := it.IngredientID.String()
			ingredientIDStr = &s
		}
		if it.GoodID.Valid {
			s := it.GoodID.String()
			goodIDStr = &s
		}
		if it.CompoundID.Valid {
			s := it.CompoundID.String()
			compoundIDStr = &s
		}

		var compBreakdowns []model.DeductionItemCompoundResponse
		if it.CompoundID.Valid {
			var comps []compoundUsage
			err = withTenantRead(ctx, s.repo, func(ctx context.Context, q *pg.Queries) error {
				var err error
				comps, err = s.expandCompoundToDirectCompounds(ctx, q, it.CompoundID.Bytes, it.Quantity)
				return err
			})
			if err != nil {
				return nil, err
			}
			for _, cu := range comps {
				compBreakdowns = append(compBreakdowns, model.DeductionItemCompoundResponse{
					CompoundID: cu.compoundID.String(),
					Quantity:   numericToStr(cu.quantity),
				})
			}
		}
		if it.GoodID.Valid {
			var comps []compoundUsage
			err = withTenantRead(ctx, s.repo, func(ctx context.Context, q *pg.Queries) error {
				var err error
				comps, err = s.expandGoodToDirectCompounds(ctx, q, it.GoodID.Bytes, it.Quantity)
				return err
			})
			if err != nil {
				return nil, err
			}
			for _, cu := range comps {
				compBreakdowns = append(compBreakdowns, model.DeductionItemCompoundResponse{
					CompoundID: cu.compoundID.String(),
					Quantity:   numericToStr(cu.quantity),
				})
			}
		}

		itemResp = append(itemResp, model.DeductionItemResponse{
			ID:           it.ID.String(),
			DeductionID:  it.DeductionID.String(),
			IngredientID: ingredientIDStr,
			GoodID:       goodIDStr,
			CompoundID:   compoundIDStr,
			Quantity:     numericToStr(it.Quantity),
			Compounds:    compBreakdowns,
			Ingredients:  bresp,
			CreatedAt:    timestampToTime(it.CreatedAt),
			UpdatedAt:    timestampToTime(it.UpdatedAt),
		})
	}

	var actGroupIDStr *string
	if d.ActGroupID.Valid {
		s := d.ActGroupID.String()
		actGroupIDStr = &s
	}
	var descI18nStr *string
	if d.DescriptionI18n.Valid {
		s := d.DescriptionI18n.String()
		descI18nStr = &s
	}

	return &model.DeductionResponse{
		ID:              d.ID.String(),
		Number:          d.Number,
		Date:            dateToTime(d.Date),
		ActGroupID:      actGroupIDStr,
		StorageID:       d.StorageID.String(),
		Description:     d.Description,
		DescriptionI18n: descI18nStr,
		Status:          model.DeductionStatus(d.Status),
		Balance:         numericToString(d.Balance),
		Items:           itemResp,
		CreatedAt:       timestampToTime(d.CreatedAt),
		UpdatedAt:       timestampToTime(d.UpdatedAt),
	}, nil
}

func (s *DeductionS) GetAllDeductions(ctx context.Context, filter model.DeductionFilter, limit, offset int32) (*model.PaginatedDeductionsResponse, error) {
	// Parse filter fields into DB types
	var dateFrom, dateTo pgtype.Date
	if filter.DateFrom != nil && *filter.DateFrom != "" {
		dt, err := parseDateYYYYMMDD(*filter.DateFrom)
		if err == nil {
			dateFrom = pgtype.Date{Time: dt, Valid: true}
		}
	}
	if filter.DateTo != nil && *filter.DateTo != "" {
		dt, err := parseDateYYYYMMDD(*filter.DateTo)
		if err == nil {
			dateTo = pgtype.Date{Time: dt, Valid: true}
		}
	}
	statusStr := ""
	if filter.Status != nil {
		statusStr = *filter.Status
	}
	var storageUUID, actGroupUUID, ingredientUUID uuid.UUID
	if filter.StorageID != nil && *filter.StorageID != "" {
		storageUUID, _ = uuid.Parse(*filter.StorageID)
	}
	if filter.ActGroupID != nil && *filter.ActGroupID != "" {
		actGroupUUID, _ = uuid.Parse(*filter.ActGroupID)
	}
	if filter.IngredientID != nil && *filter.IngredientID != "" {
		ingredientUUID, _ = uuid.Parse(*filter.IngredientID)
	}

	countParams := pg.CountDeductionsFilteredParams{
		DateFrom: dateFrom, DateTo: dateTo, Status: statusStr,
		StorageID: storageUUID, ActGroupID: actGroupUUID, IngredientID: ingredientUUID,
	}
	var total int64
	var rows []pg.Deduction
	err := withTenantRead(ctx, s.repo, func(ctx context.Context, q *pg.Queries) error {
		var err error
		total, err = q.CountDeductionsFiltered(ctx, countParams)
		if err != nil {
			return fmt.Errorf("failed to count deductions: %w", err)
		}

		rows, err = q.GetDeductionsFiltered(ctx, pg.GetDeductionsFilteredParams{
			DateFrom: dateFrom, DateTo: dateTo, Status: statusStr,
			StorageID: storageUUID, ActGroupID: actGroupUUID, IngredientID: ingredientUUID,
			Limit: limit, Offset: offset,
		})
		if err != nil {
			return fmt.Errorf("failed to get deductions: %w", err)
		}
		return nil
	})
	if err != nil {
		return nil, err
	}

	data := make([]*model.DeductionResponse, 0, len(rows))
	for _, d := range rows {
		dd := d
		var actGroupIDStr *string
		if dd.ActGroupID.Valid {
			sv := dd.ActGroupID.String()
			actGroupIDStr = &sv
		}
		var descI18nStr *string
		if dd.DescriptionI18n.Valid {
			sv := dd.DescriptionI18n.String()
			descI18nStr = &sv
		}
		deductStatus := model.DeductionStatus(dd.Status)
		if dd.DeletedAt > 0 {
			deductStatus = "deleted"
		}
		data = append(data, &model.DeductionResponse{
			ID:              dd.ID.String(),
			Number:          dd.Number,
			Date:            dateToTime(dd.Date),
			ActGroupID:      actGroupIDStr,
			StorageID:       dd.StorageID.String(),
			Description:     dd.Description,
			DescriptionI18n: descI18nStr,
			Status:          deductStatus,
			Balance:         numericToString(dd.Balance),
			CreatedAt:       timestampToTime(dd.CreatedAt),
			UpdatedAt:       timestampToTime(dd.UpdatedAt),
		})
	}

	totalPages := int32(0)
	if limit > 0 {
		totalPages = int32((total + int64(limit) - 1) / int64(limit))
	}
	return &model.PaginatedDeductionsResponse{
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

func (s *DeductionS) DeleteDeductionsBatch(ctx context.Context, req *model.DeleteDeductionsBatchRequest) error {
	if req == nil || len(req.IDs) == 0 {
		return fmt.Errorf("ids are required")
	}
	for _, id := range req.IDs {
		if err := s.DeleteDeduction(ctx, id); err != nil {
			return err
		}
	}
	return nil
}

func (s *DeductionS) DeleteDeductionItemsBatch(ctx context.Context, deductionID string, req *model.DeleteDeductionItemsBatchRequest) (*model.DeductionResponse, error) {
	if req == nil || len(req.IDs) == 0 {
		return nil, fmt.Errorf("ids are required")
	}
	var lastResp *model.DeductionResponse
	for _, itemID := range req.IDs {
		resp, err := s.DeleteDeductionItem(ctx, deductionID, itemID)
		if err != nil {
			return nil, err
		}
		lastResp = resp
	}
	return lastResp, nil
}

func (s *DeductionS) UpdateDeduction(ctx context.Context, id string, req *model.UpdateDeductionRequest) (*model.DeductionResponse, error) {
	if req == nil {
		return nil, fmt.Errorf("request is required")
	}

	deductionID, err := uuid.Parse(id)
	if err != nil {
		return nil, fmt.Errorf("invalid id: %w", err)
	}

	q, txCtx, tx, ownsTx, err := s.getTenantMutationQueries(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to get tenant queries: %w", err)
	}
	if ownsTx {
		defer tx.Rollback(ctx)
	}

	current, err := q.GetDeductionByID(txCtx, deductionID)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to get deduction: %w", err)
	}

	dateVal := current.Date
	if req.Date != nil && *req.Date != "" {
		dt, err := parseDateYYYYMMDD(*req.Date)
		if err != nil {
			return nil, fmt.Errorf("invalid date: %w", err)
		}
		dateVal = pgtype.Date{Time: dt, Valid: true}
	}

	actGroupVal := current.ActGroupID
	if req.ActGroupID != nil {
		if *req.ActGroupID == "" {
			actGroupVal = pgtype.UUID{Valid: false}
		} else {
			u, err := uuid.Parse(*req.ActGroupID)
			if err != nil {
				return nil, fmt.Errorf("invalid act_group_id: %w", err)
			}
			actGroupVal = pgtype.UUID{Bytes: u, Valid: true}
		}
	}

	storageVal := current.StorageID
	if req.StorageID != nil {
		if *req.StorageID == "" {
			return nil, fmt.Errorf("storage_id cannot be empty")
		}
		u, err := uuid.Parse(*req.StorageID)
		if err != nil {
			return nil, fmt.Errorf("invalid storage_id: %w", err)
		}
		if u != storageVal {
			items, err := q.GetDeductionItemsByDeductionID(txCtx, deductionID)
			if err != nil {
				return nil, fmt.Errorf("failed to check deduction items: %w", err)
			}
			if len(items) > 0 {
				return nil, fmt.Errorf("cannot change storage_id for a deduction that already has items")
			}
			storageVal = u
		}
	}

	descriptionVal := current.Description
	if req.Description != nil {
		descriptionVal = req.Description
	}

	descI18nVal := current.DescriptionI18n
	if req.DescriptionI18n != nil {
		if *req.DescriptionI18n == "" {
			descI18nVal = pgtype.UUID{Valid: false}
		} else {
			u, err := uuid.Parse(*req.DescriptionI18n)
			if err != nil {
				return nil, fmt.Errorf("invalid description_i18n: %w", err)
			}
			descI18nVal = pgtype.UUID{Bytes: u, Valid: true}
		}
	}

	if err := assertCanMutateDeductionChange(txCtx, q, current, storageVal, dateVal, "deduction"); err != nil {
		return nil, err
	}
	statusVal := current.Status
	if req.Status != nil && *req.Status != "" {
		newStatus := *req.Status
		if newStatus == "deleted" {
			return nil, fmt.Errorf("cannot change status to deleted: use DELETE endpoint")
		}
		if current.Status == "deleted" {
			return nil, fmt.Errorf("cannot update a deleted deduction")
		}
		statusVal = newStatus
	}

	dateChanged := current.Date.Valid && dateVal.Valid && !current.Date.Time.Equal(dateVal.Time)
	oldActive := current.Status == "active"
	newActive := statusVal == "active"

	// If old state affected stock, reverse using OLD date/storage.
	if oldActive && (statusVal == "draft" || dateChanged) {
		deductionDate := pgtype.Timestamptz{}
		if current.Date.Valid {
			deductionDate = pgtype.Timestamptz{Time: current.Date.Time.In(time.UTC), Valid: true}
		}
		if err := s.reverseAllDeductionStock(txCtx, q, deductionID, current.StorageID, "deduction_updated_in", deductionDate); err != nil {
			return nil, fmt.Errorf("failed to reverse stock: %w", err)
		}
	}

	// If new state should affect stock, apply using NEW date/storage.
	if newActive && (current.Status == "draft" || dateChanged) {
		items, err := q.GetDeductionItemsByDeductionID(txCtx, deductionID)
		if err != nil {
			return nil, fmt.Errorf("failed to get deduction items: %w", err)
		}

		newDeductionDate := pgtype.Timestamptz{}
		if dateVal.Valid {
			newDeductionDate = pgtype.Timestamptz{Time: dateVal.Time.In(time.UTC), Valid: true}
		}

		sPg := pgtype.UUID{Bytes: storageVal, Valid: true}
		for _, item := range items {
			if _, _, err := s.applyDeductionItemStock(txCtx, q, deductionID, sPg, item, newDeductionDate); err != nil {
				return nil, fmt.Errorf("failed to apply stock: %w", err)
			}
		}
	}

	_, err = q.UpdateDeduction(txCtx, pg.UpdateDeductionParams{
		ID:              deductionID,
		Date:            dateVal,
		ActGroupID:      actGroupVal,
		StorageID:       storageVal,
		Description:     descriptionVal,
		DescriptionI18n: descI18nVal,
		Status:          statusVal,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to update deduction: %w", err)
	}

	_, _ = q.UpdateDeductionBalanceFromItems(txCtx, deductionID)

	if ownsTx {
		if err := tx.Commit(ctx); err != nil {
			return nil, fmt.Errorf("failed to commit transaction: %w", err)
		}
	}

	return s.GetDeductionByID(ctx, id)
}

func (s *DeductionS) DeleteDeduction(ctx context.Context, id string) error {
	deductionID, err := uuid.Parse(id)
	if err != nil {
		return fmt.Errorf("invalid id: %w", err)
	}

	q, txCtx, tx, ownsTx, err := s.getTenantMutationQueries(ctx)
	if err != nil {
		return fmt.Errorf("failed to get tenant queries: %w", err)
	}
	if ownsTx {
		defer tx.Rollback(ctx)
	}

	deduction, err := q.GetDeductionByID(txCtx, deductionID)
	if err != nil {
		return fmt.Errorf("deduction not found: %w", err)
	}
	if deduction.DeletedAt > 0 {
		return fmt.Errorf("deduction already deleted")
	}
	if err := assertCanMutateDeductionCurrent(txCtx, q, deduction, "deduction"); err != nil {
		return err
	}

	if deduction.Status == "active" {
		deductionDate := pgtype.Timestamptz{}
		if deduction.Date.Valid {
			deductionDate = pgtype.Timestamptz{Time: deduction.Date.Time.In(time.UTC), Valid: true}
		}
		if err := s.reverseAllDeductionStock(txCtx, q, deductionID, deduction.StorageID, "deduction_deleted_in", deductionDate); err != nil {
			return fmt.Errorf("failed to reverse stock: %w", err)
		}
	}

	if err := q.DeleteDeduction(txCtx, deductionID); err != nil {
		return fmt.Errorf("failed to delete deduction: %w", err)
	}

	if ownsTx {
		if err := tx.Commit(ctx); err != nil {
			return fmt.Errorf("failed to commit transaction: %w", err)
		}
	}

	return nil
}

func (s *DeductionS) RestoreDeduction(ctx context.Context, id string) (*model.DeductionResponse, error) {
	deductionID, err := uuid.Parse(id)
	if err != nil {
		return nil, fmt.Errorf("invalid id: %w", err)
	}

	q, txCtx, tx, shouldCommit, err := s.getTenantMutationQueries(ctx)
	if err != nil {
		return nil, err
	}
	if shouldCommit {
		defer tx.Rollback(ctx)
	}

	_, err = q.RestoreDeduction(txCtx, deductionID)
	if err != nil {
		return nil, fmt.Errorf("failed to restore deduction: %w", err)
	}

	if shouldCommit {
		if err := tx.Commit(ctx); err != nil {
			return nil, fmt.Errorf("failed to commit transaction: %w", err)
		}
	}

	return s.GetDeductionByID(ctx, id)
}

func (s *DeductionS) UpsertDeductionItems(ctx context.Context, id string, req *model.UpsertDeductionItemsRequest) (*model.DeductionResponse, error) {
	deductionID, err := uuid.Parse(id)
	if err != nil {
		return nil, fmt.Errorf("invalid id: %w", err)
	}

	q, txCtx, tx, ownsTx, err := s.getTenantMutationQueries(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to get tenant queries: %w", err)
	}
	if ownsTx {
		defer tx.Rollback(ctx)
	}

	deduction, err := q.GetDeductionByID(txCtx, deductionID)
	if err != nil {
		return nil, fmt.Errorf("deduction not found: %w", err)
	}
	if deduction.DeletedAt > 0 {
		return nil, fmt.Errorf("cannot update items of a deleted deduction")
	}

	// Determine old/new status for stock transition
	oldStatus := deduction.Status
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

	storageID := deduction.StorageID
	if req.StorageID != nil && *req.StorageID != "" {
		sid, err := uuid.Parse(*req.StorageID)
		if err != nil {
			return nil, fmt.Errorf("invalid storage_id: %w", err)
		}
		storageID = sid
	}
	storagePg := pgtype.UUID{Bytes: storageID, Valid: true}

	finalDate := deduction.Date
	if req.Date != nil && *req.Date != "" {
		dt, err := parseDateYYYYMMDD(*req.Date)
		if err != nil {
			return nil, fmt.Errorf("invalid date: %w", err)
		}
		finalDate = pgtype.Date{Time: dt, Valid: true}
	}
	if err := assertCanMutateDeductionChange(txCtx, q, deduction, storageID, finalDate, "deduction"); err != nil {
		return nil, err
	}

	// Step 1: Reverse stock if was active (using OLD storage)
	if oldStatus == "active" {
		deductionDate := pgtype.Timestamptz{}
		if finalDate.Valid {
			deductionDate = pgtype.Timestamptz{Time: finalDate.Time.In(time.UTC), Valid: true}
		}
		if err := s.reverseAllDeductionStock(txCtx, q, deductionID, deduction.StorageID, "deduction_updated_in", deductionDate); err != nil {
			return nil, fmt.Errorf("failed to reverse stock: %w", err)
		}
	}

	// Update deduction-level fields if any provided
	if req.Date != nil || req.ActGroupID != nil || req.StorageID != nil || req.Description != nil || req.DescriptionI18n != nil || req.Status != nil {
		finalDate := deduction.Date
		if req.Date != nil && *req.Date != "" {
			dt, err := parseDateYYYYMMDD(*req.Date)
			if err != nil {
				return nil, fmt.Errorf("invalid date: %w", err)
			}
			finalDate = pgtype.Date{Time: dt, Valid: true}
		}
		finalActGroup := deduction.ActGroupID
		if req.ActGroupID != nil {
			if *req.ActGroupID == "" {
				finalActGroup = pgtype.UUID{Valid: false}
			} else {
				u, err := uuid.Parse(*req.ActGroupID)
				if err != nil {
					return nil, fmt.Errorf("invalid act_group_id: %w", err)
				}
				finalActGroup = pgtype.UUID{Bytes: u, Valid: true}
			}
		}
		finalDescription := deduction.Description
		if req.Description != nil {
			finalDescription = req.Description
		}
		finalDescI18n := deduction.DescriptionI18n
		if req.DescriptionI18n != nil {
			if *req.DescriptionI18n == "" {
				finalDescI18n = pgtype.UUID{Valid: false}
			} else {
				u, err := uuid.Parse(*req.DescriptionI18n)
				if err != nil {
					return nil, fmt.Errorf("invalid description_i18n: %w", err)
				}
				finalDescI18n = pgtype.UUID{Bytes: u, Valid: true}
			}
		}
		if _, err := q.UpdateDeduction(txCtx, pg.UpdateDeductionParams{
			ID:              deductionID,
			Date:            finalDate,
			ActGroupID:      finalActGroup,
			StorageID:       storageID,
			Description:     finalDescription,
			DescriptionI18n: finalDescI18n,
			Status:          newStatus,
		}); err != nil {
			return nil, fmt.Errorf("failed to update deduction: %w", err)
		}
	}

	// Step 2: Soft-delete all existing items and their ingredient breakdowns
	_ = q.DeleteDeductionItemIngredientsByDeductionID(txCtx, deductionID)
	_ = q.DeleteDeductionItemsByDeductionID(txCtx, deductionID)

	// Step 3: Create new items
	deductionDate := pgtype.Timestamptz{}
	if deduction.Date.Valid {
		deductionDate = pgtype.Timestamptz{Time: deduction.Date.Time.In(time.UTC), Valid: true}
	}
	warnings := make([]string, 0)
	for _, it := range req.Items {
		qtyNum := pgtype.Numeric{}
		if err := qtyNum.Scan(it.Quantity); err != nil {
			return nil, fmt.Errorf("invalid item quantity: %w", err)
		}

		refs := 0
		if it.IngredientID != nil && *it.IngredientID != "" {
			refs++
		}
		if it.GoodID != nil && *it.GoodID != "" {
			refs++
		}
		if it.CompoundID != nil && *it.CompoundID != "" {
			refs++
		}
		if refs != 1 {
			return nil, fmt.Errorf("each item must have exactly one of ingredient_id or good_id or compound_id")
		}

		var ingID, goodID, compID pgtype.UUID
		if it.IngredientID != nil && *it.IngredientID != "" {
			u, err := uuid.Parse(*it.IngredientID)
			if err != nil {
				return nil, fmt.Errorf("invalid ingredient_id: %w", err)
			}
			ingID = pgtype.UUID{Bytes: u, Valid: true}
		}
		if it.GoodID != nil && *it.GoodID != "" {
			u, err := uuid.Parse(*it.GoodID)
			if err != nil {
				return nil, fmt.Errorf("invalid good_id: %w", err)
			}
			goodID = pgtype.UUID{Bytes: u, Valid: true}
		}
		if it.CompoundID != nil && *it.CompoundID != "" {
			u, err := uuid.Parse(*it.CompoundID)
			if err != nil {
				return nil, fmt.Errorf("invalid compound_id: %w", err)
			}
			compID = pgtype.UUID{Bytes: u, Valid: true}
		}

		row, err := q.CreateDeductionItem(txCtx, pg.CreateDeductionItemParams{
			ID:           uuid.New(),
			DeductionID:  deductionID,
			IngredientID: ingID,
			GoodID:       goodID,
			CompoundID:   compID,
			Quantity:     qtyNum,
		})
		if err != nil {
			return nil, fmt.Errorf("failed to create deduction item: %w", err)
		}

		// Step 4: Apply stock if new status is active
		if newStatus == "active" {
			_, itemWarnings, err := s.applyDeductionItemStock(txCtx, q, deductionID, storagePg, row, deductionDate)
			if err != nil {
				return nil, err
			}
			warnings = append(warnings, itemWarnings...)
		}
	}

	// Step 5: Recalculate balance
	_, _ = q.UpdateDeductionBalanceFromItems(txCtx, deductionID)

	if ownsTx {
		if err := tx.Commit(ctx); err != nil {
			return nil, fmt.Errorf("failed to commit transaction: %w", err)
		}
	}

	resp, err := s.GetDeductionByID(ctx, id)
	if err != nil {
		return nil, err
	}
	resp.Warnings = warnings
	return resp, nil
}

func (s *DeductionS) PreviewDeductionCost(ctx context.Context, req *model.CreateDeductionRequest) (string, error) {
	if req == nil {
		return "", fmt.Errorf("request is required")
	}
	if len(req.Items) == 0 {
		return "0", nil
	}

	var total *big.Rat = big.NewRat(0, 1)
	var err error
	err = withTenantRead(ctx, s.repo, func(ctx context.Context, q *pg.Queries) error {
		for _, it := range req.Items {
			qtyNum := pgtype.Numeric{}
			if e := qtyNum.Scan(it.Quantity); e != nil {
				return fmt.Errorf("invalid item quantity: %w", e)
			}

			var usages []ingredientUsage
			switch {
			case it.IngredientID != nil && *it.IngredientID != "":
				u, e := uuid.Parse(*it.IngredientID)
				if e != nil {
					return fmt.Errorf("invalid ingredient_id: %w", e)
				}
				usages = []ingredientUsage{{ingredientID: u, quantity: qtyNum}}
			case it.GoodID != nil && *it.GoodID != "":
				u, e := uuid.Parse(*it.GoodID)
				if e != nil {
					return fmt.Errorf("invalid good_id: %w", e)
				}
				usages, e = s.expandGoodToIngredients(ctx, q, u, qtyNum)
				if e != nil {
					return e
				}
			case it.CompoundID != nil && *it.CompoundID != "":
				u, e := uuid.Parse(*it.CompoundID)
				if e != nil {
					return fmt.Errorf("invalid compound_id: %w", e)
				}
				usages, e = s.expandCompoundToIngredients(ctx, q, u, qtyNum, map[uuid.UUID]bool{})
				if e != nil {
					return e
				}
			default:
				return fmt.Errorf("each item must have ingredient_id or good_id or compound_id")
			}

			for _, u := range usages {
				ing, e := q.GetIngredientByID(ctx, u.ingredientID)
				if e != nil {
					if e == pgx.ErrNoRows {
						return fmt.Errorf("ingredient not found")
					}
					return fmt.Errorf("failed to fetch ingredient: %w", e)
				}
				if !ing.PricePerUnit.Valid {
					return fmt.Errorf("ingredient has no price")
				}

				qRat, e := numericToRat(u.quantity)
				if e != nil {
					return e
				}
				pRat, e := numericToRat(ing.PricePerUnit)
				if e != nil {
					return e
				}

				line := new(big.Rat).Mul(qRat, pRat)
				total = new(big.Rat).Add(total, line)
			}
		}
		return nil
	})
	if err != nil {
		return "", err
	}

	return total.FloatString(2), nil
}

func (s *DeductionS) DeleteDeductionItem(ctx context.Context, deductionID, itemID string) (*model.DeductionResponse, error) {
	dedID, err := uuid.Parse(deductionID)
	if err != nil {
		return nil, fmt.Errorf("invalid deduction id: %w", err)
	}
	itemUUID, err := uuid.Parse(itemID)
	if err != nil {
		return nil, fmt.Errorf("invalid item id: %w", err)
	}

	q, txCtx, tx, ownsTx, err := s.getTenantMutationQueries(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to get tenant queries: %w", err)
	}
	if ownsTx {
		defer tx.Rollback(ctx)
	}

	deduction, err := q.GetDeductionByID(txCtx, dedID)
	if err != nil {
		return nil, fmt.Errorf("deduction not found: %w", err)
	}
	if err := assertCanMutateDeductionCurrent(txCtx, q, deduction, "deduction item"); err != nil {
		return nil, err
	}

	item, err := q.GetDeductionItemByID(txCtx, itemUUID)
	if err != nil {
		return nil, fmt.Errorf("deduction item not found: %w", err)
	}
	if item.DeductionID != dedID {
		return nil, fmt.Errorf("item does not belong to this deduction")
	}

	// Reverse stock only when deduction is active
	if deduction.Status == "active" {
		deductionDate := pgtype.Timestamptz{}
		if deduction.Date.Valid {
			deductionDate = pgtype.Timestamptz{Time: deduction.Date.Time.In(time.UTC), Valid: true}
		}
		if err := s.reverseDeductionItemStock(txCtx, q, dedID, itemUUID, deduction.StorageID, "deduction_item_deleted_in", deductionDate); err != nil {
			return nil, fmt.Errorf("failed to reverse item stock: %w", err)
		}
	}

	// Soft-delete ingredient breakdowns then the item itself
	_ = q.DeleteDeductionItemIngredientsByItemID(txCtx, itemUUID)
	if err := q.DeleteDeductionItemByID(txCtx, itemUUID); err != nil {
		return nil, fmt.Errorf("failed to delete deduction item: %w", err)
	}

	// Recalculate balance
	if _, err := q.UpdateDeductionBalanceFromItems(txCtx, dedID); err != nil {
		return nil, fmt.Errorf("failed to update balance: %w", err)
	}

	if ownsTx {
		if err := tx.Commit(ctx); err != nil {
			return nil, fmt.Errorf("failed to commit transaction: %w", err)
		}
	}

	return s.GetDeductionByID(ctx, deductionID)
}

func parseLimitOffset(limitStr, offsetStr string) (int32, int32) {
	limit := int32(20)
	offset := int32(0)
	if limitStr != "" {
		if l, err := strconv.ParseInt(limitStr, 10, 32); err == nil && l > 0 {
			limit = int32(l)
		}
	}
	if offsetStr != "" {
		if o, err := strconv.ParseInt(offsetStr, 10, 32); err == nil && o >= 0 {
			offset = int32(o)
		}
	}
	return limit, offset
}
