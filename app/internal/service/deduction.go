package service

import (
	"context"
	"fmt"
	"math/big"
	"strconv"

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

	row, err := s.repo.Tenant(ctx).CreateDeductionActGroup(ctx, pg.CreateDeductionActGroupParams{
		ID:   uuid.New(),
		Name: req.Name,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to create deduction act group: %w", err)
	}

	return &model.DeductionActGroupResponse{
		ID:        row.ID.String(),
		Name:      row.Name,
		CreatedAt: timestampToTime(row.CreatedAt),
		UpdatedAt: timestampToTime(row.UpdatedAt),
	}, nil
}

func (s *DeductionS) GetAllDeductionActGroups(ctx context.Context, limit, offset int32) ([]*model.DeductionActGroupResponse, error) {
	rows, err := s.repo.Tenant(ctx).GetAllDeductionActGroups(ctx, pg.GetAllDeductionActGroupsParams{Limit: limit, Offset: offset})
	if err != nil {
		return nil, fmt.Errorf("failed to get deduction act groups: %w", err)
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

	row, err := s.repo.Tenant(ctx).GetDeductionActGroupByID(ctx, u)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to get deduction act group: %w", err)
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

	existing, err := s.repo.Tenant(ctx).GetDeductionActGroupByID(ctx, u)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to get deduction act group: %w", err)
	}

	name := existing.Name
	if req.Name != nil && *req.Name != "" {
		name = *req.Name
	}

	row, err := s.repo.Tenant(ctx).UpdateDeductionActGroup(ctx, pg.UpdateDeductionActGroupParams{ID: u, Name: name})
	if err != nil {
		return nil, fmt.Errorf("failed to update deduction act group: %w", err)
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
	if err := s.repo.Tenant(ctx).DeleteDeductionActGroup(ctx, u); err != nil {
		return fmt.Errorf("failed to delete deduction act group: %w", err)
	}
	return nil
}

func (s *DeductionS) RestoreDeductionActGroup(ctx context.Context, id string) (*model.DeductionActGroupResponse, error) {
	u, err := uuid.Parse(id)
	if err != nil {
		return nil, fmt.Errorf("invalid id: %w", err)
	}

	row, err := s.repo.Tenant(ctx).RestoreDeductionActGroup(ctx, u)
	if err != nil {
		return nil, fmt.Errorf("failed to restore deduction act group: %w", err)
	}

	return &model.DeductionActGroupResponse{
		ID:        row.ID.String(),
		Name:      row.Name,
		CreatedAt: timestampToTime(row.CreatedAt),
		UpdatedAt: timestampToTime(row.UpdatedAt),
	}, nil
}

func (s *DeductionS) expandCompoundToIngredients(ctx context.Context, compoundID uuid.UUID, multiplier pgtype.Numeric, visited map[uuid.UUID]bool) ([]ingredientUsage, error) {
	if visited[compoundID] {
		return nil, fmt.Errorf("compound cycle detected")
	}
	visited[compoundID] = true
	defer func() { visited[compoundID] = false }()

	calcs, err := s.repo.Tenant(ctx).GetCalculationsByCompoundID(ctx, pgtype.UUID{Bytes: compoundID, Valid: true})
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
			sub, err := s.expandCompoundToIngredients(ctx, child, childMultiplier, visited)
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

func (s *DeductionS) expandCompoundToDirectCompounds(ctx context.Context, compoundID uuid.UUID, multiplier pgtype.Numeric) ([]compoundUsage, error) {
	calcs, err := s.repo.Tenant(ctx).GetCalculationsByCompoundID(ctx, pgtype.UUID{Bytes: compoundID, Valid: true})
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

func (s *DeductionS) expandGoodToIngredients(ctx context.Context, goodID uuid.UUID, multiplier pgtype.Numeric) ([]ingredientUsage, error) {
	calcs, err := s.repo.Tenant(ctx).GetCalculationsByGoodID(ctx, pgtype.UUID{Bytes: goodID, Valid: true})
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
			sub, err := s.expandCompoundToIngredients(ctx, child, childMultiplier, visited)
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

func (s *DeductionS) expandGoodToDirectCompounds(ctx context.Context, goodID uuid.UUID, multiplier pgtype.Numeric) ([]compoundUsage, error) {
	calcs, err := s.repo.Tenant(ctx).GetCalculationsByGoodID(ctx, pgtype.UUID{Bytes: goodID, Valid: true})
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

	deductionID := uuid.New()
	deduction, err := s.repo.Tenant(ctx).CreateDeduction(ctx, pg.CreateDeductionParams{
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

	warnings := make([]string, 0)
	itemResponses := make([]model.DeductionItemResponse, 0, len(req.Items))
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

		row, err := s.repo.Tenant(ctx).CreateDeductionItem(ctx, pg.CreateDeductionItemParams{
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

		var usages []ingredientUsage
		switch {
		case row.IngredientID.Valid:
			usages = []ingredientUsage{{ingredientID: row.IngredientID.Bytes, quantity: row.Quantity}}
		case row.GoodID.Valid:
			usages, err = s.expandGoodToIngredients(ctx, row.GoodID.Bytes, row.Quantity)
		case row.CompoundID.Valid:
			usages, err = s.expandCompoundToIngredients(ctx, row.CompoundID.Bytes, row.Quantity, map[uuid.UUID]bool{})
		default:
			err = fmt.Errorf("deduction item must reference ingredient or good or compound")
		}
		if err != nil {
			return nil, err
		}

		ingBreakdowns := make([]model.DeductionItemIngredientResponse, 0)
		for _, u := range usages {
			requestedQty := u.quantity
			_, err := s.repo.Tenant(ctx).EnsureIngredientStockByStorage(ctx, pg.EnsureIngredientStockByStorageParams{
				ID:           uuid.New(),
				IngredientID: u.ingredientID,
				StorageID:    storagePg,
			})
			if err != nil {
				return nil, fmt.Errorf("failed to ensure ingredient stock: %w", err)
			}

			stock, err := s.repo.Tenant(ctx).GetStockByIngredientAndStorageForUpdate(ctx, pg.GetStockByIngredientAndStorageForUpdateParams{
				IngredientID: u.ingredientID,
				StorageID:    storagePg,
			})
			if err != nil {
				return nil, fmt.Errorf("failed to lock ingredient stock: %w", err)
			}

			ingredient, err := s.repo.Tenant(ctx).GetIngredientByID(ctx, u.ingredientID)
			if err != nil {
				if err == pgx.ErrNoRows {
					return nil, fmt.Errorf("ingredient not found")
				}
				return nil, fmt.Errorf("failed to fetch ingredient: %w", err)
			}
			if !ingredient.PricePerUnit.Valid {
				return nil, fmt.Errorf("ingredient has no price")
			}

			stockBefore := stock.Quantity
			available := stockBefore
			// subNumericClampZero(requested, available) gives max(requested-available,0). We need min(requested, available).
			// Compute missing := max(requested-available,0) and actual := requested-missing
			missing, err := subNumericClampZero(requestedQty, available, 6)
			if err != nil {
				return nil, err
			}
			actualDeduct, err := subNumericClampZero(requestedQty, missing, 6)
			if err != nil {
				return nil, err
			}

			// If actualDeduct is 0, do not change stock and do not calculate amount
			updatedQty := stockBefore
			var updatedStock *pg.RemoveFromIngredientStockRow
			if numericToString(actualDeduct) != "0" {
				updated, err := s.repo.Tenant(ctx).RemoveFromIngredientStock(ctx, pg.RemoveFromIngredientStockParams{
					ID:       stock.ID,
					Quantity: actualDeduct,
				})
				if err != nil {
					return nil, fmt.Errorf("failed to remove from ingredient stock: %w", err)
				}
				updatedQty = updated.Quantity
				updatedStock = &updated
			}

			// warning if missing > 0
			if numericToString(missing) != "0" {
				warnings = append(warnings, fmt.Sprintf("insufficient stock for ingredient %s: requested %s, available %s", u.ingredientID.String(), numericToString(requestedQty), numericToString(available)))
			}

			price := ingredient.PricePerUnit
			if numericToString(actualDeduct) == "0" {
				price = pgtype.Numeric{}
				_ = price.Scan("0")
			}

			breakdown, err := s.repo.Tenant(ctx).CreateDeductionItemIngredient(ctx, pg.CreateDeductionItemIngredientParams{
				ID:              uuid.New(),
				DeductionItemID: row.ID,
				IngredientID:    u.ingredientID,
				Quantity:        actualDeduct,
				StockBefore:     stockBefore,
				StockAfter:      updatedQty,
				PricePerUnit:    price,
			})
			if err != nil {
				return nil, fmt.Errorf("failed to create deduction item ingredient breakdown: %w", err)
			}

			if updatedStock != nil {
				zero := pgtype.Numeric{}
				_ = zero.Scan("0")
				sourceType := "deduction"
				srcID := deductionID
				if err := s.repo.Tenant(ctx).InsertIngredientStockMovement(ctx, pg.InsertIngredientStockMovementParams{
					ID:           uuid.New(),
					StorageID:    uuid.UUID(storagePg.Bytes),
					IngredientID: u.ingredientID,
					EventType:    "deduction_out",
					QtyIn:        zero,
					QtyOut:       actualDeduct,
					StockBefore:  stockBefore,
					StockAfter:   updatedStock.Quantity,
					PricePerUnit: price,
					SourceType:   &sourceType,
					SourceID:     &srcID,
				}); err != nil {
					return nil, fmt.Errorf("failed to insert stock movement: %w", err)
				}
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

		compBreakdowns := make([]model.DeductionItemCompoundResponse, 0)
		if row.CompoundID.Valid {
			comps, err := s.expandCompoundToDirectCompounds(ctx, row.CompoundID.Bytes, row.Quantity)
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
		if row.GoodID.Valid {
			comps, err := s.expandGoodToDirectCompounds(ctx, row.GoodID.Bytes, row.Quantity)
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

		var ingredientIDStr, goodIDStr, compoundIDStr *string
		if row.IngredientID.Valid {
			s := row.IngredientID.String()
			ingredientIDStr = &s
		}
		if row.GoodID.Valid {
			s := row.GoodID.String()
			goodIDStr = &s
		}
		if row.CompoundID.Valid {
			s := row.CompoundID.String()
			compoundIDStr = &s
		}

		itemResponses = append(itemResponses, model.DeductionItemResponse{
			ID:           row.ID.String(),
			DeductionID:  row.DeductionID.String(),
			IngredientID: ingredientIDStr,
			GoodID:       goodIDStr,
			CompoundID:   compoundIDStr,
			Quantity:     numericToStr(row.Quantity),
			Compounds:    compBreakdowns,
			Ingredients:  ingBreakdowns,
			CreatedAt:    timestampToTime(row.CreatedAt),
			UpdatedAt:    timestampToTime(row.UpdatedAt),
		})
	}

	updatedDeduction, err := s.repo.Tenant(ctx).UpdateDeductionBalanceFromItems(ctx, deductionID)
	if err != nil {
		return nil, fmt.Errorf("failed to update deduction balance: %w", err)
	}

	var actGroupIDStr *string
	if updatedDeduction.ActGroupID.Valid {
		s := updatedDeduction.ActGroupID.String()
		actGroupIDStr = &s
	}
	var descI18nStr *string
	if updatedDeduction.DescriptionI18n.Valid {
		s := updatedDeduction.DescriptionI18n.String()
		descI18nStr = &s
	}

	resp := &model.DeductionResponse{
		ID:              updatedDeduction.ID.String(),
		Number:          updatedDeduction.Number,
		Date:            dateToTime(updatedDeduction.Date),
		ActGroupID:      actGroupIDStr,
		StorageID:       updatedDeduction.StorageID.String(),
		Description:     updatedDeduction.Description,
		DescriptionI18n: descI18nStr,
		Status:          model.DeductionStatus(updatedDeduction.Status),
		Balance:         numericToString(updatedDeduction.Balance),
		Warnings:        warnings,
		Items:           itemResponses,
		CreatedAt:       timestampToTime(updatedDeduction.CreatedAt),
		UpdatedAt:       timestampToTime(updatedDeduction.UpdatedAt),
	}

	_ = deduction
	return resp, nil
}

func (s *DeductionS) GetDeductionByID(ctx context.Context, id string) (*model.DeductionResponse, error) {
	u, err := uuid.Parse(id)
	if err != nil {
		return nil, fmt.Errorf("invalid id: %w", err)
	}

	d, err := s.repo.Tenant(ctx).GetDeductionByID(ctx, u)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to get deduction: %w", err)
	}

	items, err := s.repo.Tenant(ctx).GetDeductionItemsByDeductionID(ctx, u)
	if err != nil {
		return nil, fmt.Errorf("failed to get deduction items: %w", err)
	}

	itemResp := make([]model.DeductionItemResponse, 0, len(items))
	for _, it := range items {
		breakdowns, err := s.repo.Tenant(ctx).GetDeductionItemIngredientsByDeductionItemID(ctx, it.ID)
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

		compBreakdowns := make([]model.DeductionItemCompoundResponse, 0)
		if it.CompoundID.Valid {
			comps, err := s.expandCompoundToDirectCompounds(ctx, it.CompoundID.Bytes, it.Quantity)
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
			comps, err := s.expandGoodToDirectCompounds(ctx, it.GoodID.Bytes, it.Quantity)
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

func (s *DeductionS) GetAllDeductions(ctx context.Context, limit, offset int32) ([]*model.DeductionResponse, error) {
	rows, err := s.repo.Tenant(ctx).GetAllDeductions(ctx, pg.GetAllDeductionsParams{Limit: limit, Offset: offset})
	if err != nil {
		return nil, fmt.Errorf("failed to get deductions: %w", err)
	}

	resp := make([]*model.DeductionResponse, 0, len(rows))
	for _, d := range rows {
		dd := d
		var actGroupIDStr *string
		if dd.ActGroupID.Valid {
			s := dd.ActGroupID.String()
			actGroupIDStr = &s
		}
		var descI18nStr *string
		if dd.DescriptionI18n.Valid {
			s := dd.DescriptionI18n.String()
			descI18nStr = &s
		}
		resp = append(resp, &model.DeductionResponse{
			ID:              dd.ID.String(),
			Number:          dd.Number,
			Date:            dateToTime(dd.Date),
			ActGroupID:      actGroupIDStr,
			StorageID:       dd.StorageID.String(),
			Description:     dd.Description,
			DescriptionI18n: descI18nStr,
			Status:          model.DeductionStatus(dd.Status),
			Balance:         numericToString(dd.Balance),
			CreatedAt:       timestampToTime(dd.CreatedAt),
			UpdatedAt:       timestampToTime(dd.UpdatedAt),
		})
	}
	return resp, nil
}

func (s *DeductionS) UpdateDeduction(ctx context.Context, id string, req *model.UpdateDeductionRequest) (*model.DeductionResponse, error) {
	if req == nil {
		return nil, fmt.Errorf("request is required")
	}

	deductionID, err := uuid.Parse(id)
	if err != nil {
		return nil, fmt.Errorf("invalid id: %w", err)
	}

	current, err := s.repo.Tenant(ctx).GetDeductionByID(ctx, deductionID)
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
			items, err := s.repo.Tenant(ctx).GetDeductionItemsByDeductionID(ctx, deductionID)
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

	statusVal := current.Status
	if req.Status != nil && *req.Status != "" {
		statusVal = *req.Status
	}

	_, err = s.repo.Tenant(ctx).UpdateDeduction(ctx, pg.UpdateDeductionParams{
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

	return s.GetDeductionByID(ctx, id)
}

func (s *DeductionS) DeleteDeduction(ctx context.Context, id string) error {
	deductionID, err := uuid.Parse(id)
	if err != nil {
		return fmt.Errorf("invalid id: %w", err)
	}

	if err := s.repo.Tenant(ctx).DeleteDeduction(ctx, deductionID); err != nil {
		return fmt.Errorf("failed to delete deduction: %w", err)
	}
	return nil
}

func (s *DeductionS) RestoreDeduction(ctx context.Context, id string) (*model.DeductionResponse, error) {
	deductionID, err := uuid.Parse(id)
	if err != nil {
		return nil, fmt.Errorf("invalid id: %w", err)
	}

	_, err = s.repo.Tenant(ctx).RestoreDeduction(ctx, deductionID)
	if err != nil {
		return nil, fmt.Errorf("failed to restore deduction: %w", err)
	}

	return s.GetDeductionByID(ctx, id)
}

func (s *DeductionS) PreviewDeductionCost(ctx context.Context, req *model.CreateDeductionRequest) (string, error) {
	if req == nil {
		return "", fmt.Errorf("request is required")
	}
	if len(req.Items) == 0 {
		return "0", nil
	}

	var total *big.Rat = big.NewRat(0, 1)
	for _, it := range req.Items {
		qtyNum := pgtype.Numeric{}
		if err := qtyNum.Scan(it.Quantity); err != nil {
			return "", fmt.Errorf("invalid item quantity: %w", err)
		}

		var usages []ingredientUsage
		var err error
		switch {
		case it.IngredientID != nil && *it.IngredientID != "":
			u, err := uuid.Parse(*it.IngredientID)
			if err != nil {
				return "", fmt.Errorf("invalid ingredient_id: %w", err)
			}
			usages = []ingredientUsage{{ingredientID: u, quantity: qtyNum}}
		case it.GoodID != nil && *it.GoodID != "":
			u, err := uuid.Parse(*it.GoodID)
			if err != nil {
				return "", fmt.Errorf("invalid good_id: %w", err)
			}
			usages, err = s.expandGoodToIngredients(ctx, u, qtyNum)
		case it.CompoundID != nil && *it.CompoundID != "":
			u, err := uuid.Parse(*it.CompoundID)
			if err != nil {
				return "", fmt.Errorf("invalid compound_id: %w", err)
			}
			usages, err = s.expandCompoundToIngredients(ctx, u, qtyNum, map[uuid.UUID]bool{})
		default:
			return "", fmt.Errorf("each item must have ingredient_id or good_id or compound_id")
		}
		if err != nil {
			return "", err
		}

		for _, u := range usages {
			ing, err := s.repo.Tenant(ctx).GetIngredientByID(ctx, u.ingredientID)
			if err != nil {
				if err == pgx.ErrNoRows {
					return "", fmt.Errorf("ingredient not found")
				}
				return "", fmt.Errorf("failed to fetch ingredient: %w", err)
			}
			if !ing.PricePerUnit.Valid {
				return "", fmt.Errorf("ingredient has no price")
			}

			qRat, err := numericToRat(u.quantity)
			if err != nil {
				return "", err
			}
			pRat, err := numericToRat(ing.PricePerUnit)
			if err != nil {
				return "", err
			}

			line := new(big.Rat).Mul(qRat, pRat)
			total = new(big.Rat).Add(total, line)
		}
	}

	return total.FloatString(2), nil
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
