package service

import (
	"context"
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

// Mapper functions for ingredient groups and ingredients
func mapIngredientGroupToResponse(id uuid.UUID, name string, nameI18n pgtype.UUID, pictureUrl *string, colorCode *string, createdAt, updatedAt pgtype.Timestamptz) *model.IngredientGroupResponse {
	return &model.IngredientGroupResponse{
		ID:         id.String(),
		Name:       &name,
		NameI18n:   uuidToStr(nameI18n),
		PictureUrl: pictureUrl,
		ColorCode:  colorCode,
		CreatedAt:  timestampToTime(createdAt),
		UpdatedAt:  timestampToTime(updatedAt),
	}
}

// mapIngredientToResponse converts a database ingredient to response model
func mapIngredientToResponse(row pg.Ingredient) *model.IngredientResponse {
	var measurementStr *string
	if row.Measurement.Valid {
		str := string(row.Measurement.MeasurementType)
		measurementStr = &str
	}

	var pricePerUnitStr *string
	if row.PricePerUnit.Valid {
		val, _ := row.PricePerUnit.Value()
		if str, ok := val.(string); ok {
			pricePerUnitStr = &str
		}
	}

	return &model.IngredientResponse{
		ID:           row.ID.String(),
		Name:         &row.Name,
		NameI18n:     uuidToStr(row.NameI18n),
		GroupID:      uuidToStr(row.GroupID),
		Measurement:  measurementStr,
		PictureUrl:   row.PictureUrl,
		ColorCode:    row.ColorCode,
		PricePerUnit: pricePerUnitStr,
		CreatedAt:    timestampToTime(row.CreatedAt),
		UpdatedAt:    timestampToTime(row.UpdatedAt),
	}
}

type IngredientS struct {
	repo *repository.Repository
}

func NewIngredientS(repo *repository.Repository) *IngredientS {
	return &IngredientS{repo: repo}
}

func (i *IngredientS) getTenantMutationQueries(ctx context.Context) (*pg.Queries, context.Context, pgx.Tx, bool, error) {
	if existingTx, ok := repository.TenantTxFromContext(ctx); ok && existingTx != nil {
		if q, ok := repository.TenantQueriesFromContext(ctx); ok && q != nil {
			return q, ctx, existingTx, false, nil
		}
		q := pg.New(existingTx)
		txCtx := repository.WithTenantQueries(ctx, q)
		return q, txCtx, existingTx, false, nil
	}

	tx, err := i.repo.PgRepo.TenantPool.Begin(ctx)
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

func (i *IngredientS) CreateIngredientGroup(ctx context.Context, name string, nameI18n *uuid.UUID, pictureUrl *string, colorCode *string) (*model.IngredientGroupResponse, error) {
	q, txCtx, tx, ownsTx, err := i.getTenantMutationQueries(ctx)
	if err != nil {
		return nil, err
	}
	if ownsTx {
		defer tx.Rollback(ctx)
	}

	if name == "" {
		return nil, fmt.Errorf("ingredient group name is required")
	}

	nameI18nUUID := pgtype.UUID{}
	if nameI18n != nil {
		nameI18nUUID = pgtype.UUID{Bytes: *nameI18n, Valid: true}
	}

	group, err := q.CreateIngredientGroup(txCtx, pg.CreateIngredientGroupParams{
		ID:         uuid.New(),
		Name:       name,
		NameI18n:   nameI18nUUID,
		PictureUrl: pictureUrl,
		ColorCode:  colorCode,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to create ingredient group: %w", err)
	}

	if ownsTx {
		if err := tx.Commit(ctx); err != nil {
			return nil, fmt.Errorf("failed to commit transaction: %w", err)
		}
	}

	return mapIngredientGroupToResponse(group.ID, group.Name, group.NameI18n, group.PictureUrl, group.ColorCode, group.CreatedAt, group.UpdatedAt), nil
}

// GetIngredientGroupByID retrieves an ingredient group by ID
func (i *IngredientS) GetIngredientGroupByID(ctx context.Context, groupID string) (*model.IngredientGroupResponse, error) {
	id, err := uuid.Parse(groupID)
	if err != nil {
		return nil, fmt.Errorf("invalid ingredient group ID: %w", err)
	}

	var group pg.IngredientGroup
	err = withTenantRead(ctx, i.repo, func(tenantCtx context.Context, q *pg.Queries) error {
		var err error
		group, err = q.GetIngredientGroupByID(tenantCtx, id)
		return err
	})
	if err != nil {
		return nil, fmt.Errorf("failed to get ingredient group: %w", err)
	}

	return mapIngredientGroupToResponse(group.ID, group.Name, group.NameI18n, group.PictureUrl, group.ColorCode, group.CreatedAt, group.UpdatedAt), nil
}

// GetAllIngredientGroups retrieves all ingredient groups
func (i *IngredientS) GetAllIngredientGroups(ctx context.Context, limit, offset int32) ([]model.IngredientGroupResponse, int64, error) {
	var total int64
	var groups []pg.IngredientGroup

	err := withTenantRead(ctx, i.repo, func(tenantCtx context.Context, q *pg.Queries) error {
		var err error
		total, err = q.CountIngredientGroups(tenantCtx)
		if err != nil {
			return fmt.Errorf("failed to count ingredient groups: %w", err)
		}

		groups, err = q.GetAllIngredientGroups(tenantCtx, pg.GetAllIngredientGroupsParams{
			Limit:  limit,
			Offset: offset,
		})
		return err
	})
	if err != nil {
		return nil, 0, err
	}

	var responses []model.IngredientGroupResponse
	for _, g := range groups {
		responses = append(responses, *mapIngredientGroupToResponse(g.ID, g.Name, g.NameI18n, g.PictureUrl, g.ColorCode, g.CreatedAt, g.UpdatedAt))
	}

	return responses, total, nil
}

// SearchIngredientGroups searches ingredient groups by name
func (i *IngredientS) SearchIngredientGroups(ctx context.Context, query string, limit, offset int32) ([]model.IngredientGroupResponse, error) {
	var groups []pg.IngredientGroup

	err := withTenantRead(ctx, i.repo, func(tenantCtx context.Context, q *pg.Queries) error {
		var err error
		groups, err = q.SearchIngredientGroups(tenantCtx, pg.SearchIngredientGroupsParams{
			Column1: &query,
			Limit:   limit,
			Offset:  offset,
		})
		return err
	})
	if err != nil {
		return nil, fmt.Errorf("failed to search ingredient groups: %w", err)
	}

	var responses []model.IngredientGroupResponse
	for _, g := range groups {
		responses = append(responses, *mapIngredientGroupToResponse(g.ID, g.Name, g.NameI18n, g.PictureUrl, g.ColorCode, g.CreatedAt, g.UpdatedAt))
	}
	return responses, nil
}

// UpdateIngredientGroup updates an ingredient group
func (i *IngredientS) UpdateIngredientGroup(ctx context.Context, groupID string, name *string, nameI18n *string, pictureUrl *string, colorCode *string) (*model.IngredientGroupResponse, error) {
	q, txCtx, tx, ownsTx, err := i.getTenantMutationQueries(ctx)
	if err != nil {
		return nil, err
	}
	if ownsTx {
		defer tx.Rollback(ctx)
	}

	id, err := uuid.Parse(groupID)
	if err != nil {
		return nil, fmt.Errorf("invalid ingredient group ID: %w", err)
	}

	// Use current values as defaults
	groupData, err := q.GetIngredientGroupByID(txCtx, id)
	if err != nil {
		return nil, fmt.Errorf("failed to get ingredient group: %w", err)
	}

	updatedName := groupData.Name
	if name != nil && *name != "" {
		updatedName = *name
	}

	updatedNameI18n := groupData.NameI18n
	if nameI18n != nil && *nameI18n != "" {
		uuid, err := uuid.Parse(*nameI18n)
		if err != nil {
			return nil, fmt.Errorf("invalid name_i18n UUID: %w", err)
		}
		updatedNameI18n = pgtype.UUID{Bytes: uuid, Valid: true}
	}

	updatedPictureUrl := groupData.PictureUrl
	if pictureUrl != nil {
		updatedPictureUrl = pictureUrl
	}

	updatedColorCode := groupData.ColorCode
	if colorCode != nil {
		updatedColorCode = colorCode
	}

	group, err := q.UpdateIngredientGroup(txCtx, pg.UpdateIngredientGroupParams{
		ID:         id,
		Name:       updatedName,
		NameI18n:   updatedNameI18n,
		PictureUrl: updatedPictureUrl,
		ColorCode:  updatedColorCode,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to update ingredient group: %w", err)
	}

	if ownsTx {
		if err := tx.Commit(ctx); err != nil {
			return nil, fmt.Errorf("failed to commit transaction: %w", err)
		}
	}

	return mapIngredientGroupToResponse(group.ID, group.Name, group.NameI18n, group.PictureUrl, group.ColorCode, group.CreatedAt, group.UpdatedAt), nil
}

// DeleteIngredientGroup soft deletes an ingredient group
func (i *IngredientS) DeleteIngredientGroup(ctx context.Context, groupID string) error {
	q, txCtx, tx, ownsTx, err := i.getTenantMutationQueries(ctx)
	if err != nil {
		return err
	}
	if ownsTx {
		defer tx.Rollback(ctx)
	}

	id, err := uuid.Parse(groupID)
	if err != nil {
		return fmt.Errorf("invalid ingredient group ID: %w", err)
	}

	if err := q.DeleteIngredientGroup(txCtx, id); err != nil {
		return fmt.Errorf("failed to delete ingredient group: %w", err)
	}

	if ownsTx {
		if err := tx.Commit(ctx); err != nil {
			return fmt.Errorf("failed to commit transaction: %w", err)
		}
	}

	return nil
}

func (i *IngredientS) GetIngredientReport(ctx context.Context, req model.GetIngredientReportRequest) (*model.IngredientReportResponse, error) {
	storageUUID, err := uuid.Parse(req.StorageID)
	if err != nil {
		return nil, fmt.Errorf("invalid storage_id: %w", err)
	}
	startTime := time.Time{}
	if req.Start != nil {
		startTime = *req.Start
	}
	endTime := time.Now()
	if req.End != nil {
		endTime = *req.End
	}
	start := pgtype.Timestamptz{Time: startTime, Valid: true}
	end := pgtype.Timestamptz{Time: endTime, Valid: true}

	var ingredientUUID *uuid.UUID
	if req.IngredientID != nil && *req.IngredientID != "" {
		u, err := uuid.Parse(*req.IngredientID)
		if err != nil {
			return nil, fmt.Errorf("invalid ingredient_id: %w", err)
		}
		ingredientUUID = &u
	}

	limit := req.Limit
	if limit <= 0 {
		limit = 20
	}

	measurement := ""
	if req.Measurement != nil {
		measurement = *req.Measurement
	}
	ingredientIDs := ""
	if req.IngredientIDs != nil {
		ingredientIDs = *req.IngredientIDs
	}
	sortBy := ""
	if req.SortBy != nil {
		sortBy = *req.SortBy
	}
	sortOrder := ""
	if req.SortOrder != nil {
		sortOrder = *req.SortOrder
	}

	params := pg.GetIngredientReportParams{
		StorageID:     storageUUID,
		Start:         start,
		End:           end,
		IngredientID:  ingredientUUID,
		Limit:         limit,
		Offset:        req.Offset,
		Measurement:   measurement,
		IngredientIDs: ingredientIDs,
		SortBy:        sortBy,
		SortOrder:     sortOrder,
	}

	totalsRow, err := i.repo.Tenant(ctx).GetIngredientReportTotals(ctx, params)
	if err != nil {
		return nil, fmt.Errorf("failed to get ingredient report totals: %w", err)
	}

	rows, err := i.repo.Tenant(ctx).GetIngredientReport(ctx, params)
	if err != nil {
		return nil, fmt.Errorf("failed to get ingredient report: %w", err)
	}

	items := make([]model.IngredientReportItem, 0, len(rows))
	for _, r := range rows {
		items = append(items, model.IngredientReportItem{
			IngredientID:   r.IngredientID.String(),
			IngredientName: r.IngredientName,
			Measurement:    r.Measurement,
			PictureUrl:     r.PictureUrl,
			ColorCode:      r.ColorCode,

			BeginQuantity: numericToStr(r.BeginQty),
			EndQuantity:   numericToStr(r.EndQty),
			In:            numericToStr(r.InQty),
			Out:           numericToStr(r.OutQty),
			Shortage:      numericToStr(r.ShortageQty),
			Surplus:       numericToStr(r.SurplusQty),
		})
	}

	return &model.IngredientReportResponse{
		Items: items,
		Totals: model.IngredientReportTotals{
			TotalCount:         totalsRow.TotalCount,
			TotalAddedAmount:   numericToStr(totalsRow.TotalAddedAmount),
			TotalRemovedAmount: numericToStr(totalsRow.TotalRemovedAmount),
		},
	}, nil
}

func (i *IngredientS) GetIngredientReportItem(ctx context.Context, req model.GetIngredientReportRequest) (*model.IngredientReportItem, error) {
	if req.IngredientID == nil || *req.IngredientID == "" {
		return nil, fmt.Errorf("ingredient_id is required")
	}
	req.Limit = 1
	resp, err := i.GetIngredientReport(ctx, req)
	if err != nil {
		return nil, err
	}
	if len(resp.Items) == 0 {
		return nil, nil
	}
	item := resp.Items[0]
	return &item, nil
}

func (i *IngredientS) GetIngredientReportMovements(ctx context.Context, req model.GetIngredientReportMovementsRequest) ([]model.IngredientStockMovementResponse, error) {
	storageUUID, err := uuid.Parse(req.StorageID)
	if err != nil {
		return nil, fmt.Errorf("invalid storage_id: %w", err)
	}
	ingredientUUID, err := uuid.Parse(req.IngredientID)
	if err != nil {
		return nil, fmt.Errorf("invalid ingredient_id: %w", err)
	}
	startTime := time.Time{}
	if req.Start != nil {
		startTime = *req.Start
	}
	endTime := time.Now()
	if req.End != nil {
		endTime = *req.End
	}
	start := pgtype.Timestamptz{Time: startTime, Valid: true}
	end := pgtype.Timestamptz{Time: endTime, Valid: true}

	limit := req.Limit
	if limit <= 0 {
		limit = 50
	}

	rows, err := i.repo.Tenant(ctx).GetIngredientStockMovements(ctx, pg.GetIngredientStockMovementsParams{
		StorageID:    storageUUID,
		IngredientID: ingredientUUID,
		Start:        start,
		End:          end,
		Limit:        limit,
		Offset:       req.Offset,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to get ingredient stock movements: %w", err)
	}

	out := make([]model.IngredientStockMovementResponse, 0, len(rows))
	for _, r := range rows {
		var sourceIDStr *string
		if r.SourceID != nil {
			s := r.SourceID.String()
			sourceIDStr = &s
		}
		out = append(out, model.IngredientStockMovementResponse{
			ID:           r.ID.String(),
			EventType:    r.EventType,
			QtyIn:        numericToStr(r.QtyIn),
			QtyOut:       numericToStr(r.QtyOut),
			StockBefore:  numericToStr(r.StockBefore),
			StockAfter:   numericToStr(r.StockAfter),
			PricePerUnit: numericToStr(r.PricePerUnit),
			SourceType:   r.SourceType,
			SourceID:     sourceIDStr,
			EffectiveAt:  timestampToTime(r.EffectiveAt),
			CreatedAt:    timestampToTime(r.CreatedAt),
		})
	}
	return out, nil
}

func (i *IngredientS) GetIngredientInventoryStatusReport(ctx context.Context, req model.GetIngredientInventoryStatusReportRequest) (*model.IngredientReportResponse, error) {
	storageUUID, err := uuid.Parse(req.StorageID)
	if err != nil {
		return nil, fmt.Errorf("invalid storage_id: %w", err)
	}

	endTime := time.Now()
	if req.End != nil {
		endTime = *req.End
	}
	end := pgtype.Timestamptz{Time: endTime, Valid: true}

	var ingredientUUID *uuid.UUID
	if req.IngredientID != nil && *req.IngredientID != "" {
		u, err := uuid.Parse(*req.IngredientID)
		if err != nil {
			return nil, fmt.Errorf("invalid ingredient_id: %w", err)
		}
		ingredientUUID = &u
	}

	limit := req.Limit
	if limit <= 0 {
		limit = 20
	}

	params := pg.GetIngredientInventoryStatusReportParams{
		StorageID:    storageUUID,
		End:          end,
		IngredientID: ingredientUUID,
		Limit:        limit,
		Offset:       req.Offset,
	}

	totalsRow, err := i.repo.Tenant(ctx).GetIngredientInventoryStatusReportTotals(ctx, params)
	if err != nil {
		return nil, fmt.Errorf("failed to get inventory status report totals: %w", err)
	}

	rows, err := i.repo.Tenant(ctx).GetIngredientInventoryStatusReport(ctx, params)
	if err != nil {
		return nil, fmt.Errorf("failed to get inventory status report: %w", err)
	}

	items := make([]model.IngredientReportItem, 0, len(rows))
	for _, r := range rows {
		items = append(items, model.IngredientReportItem{
			IngredientID:   r.IngredientID.String(),
			IngredientName: r.IngredientName,
			Measurement:    r.Measurement,
			PictureUrl:     r.PictureUrl,
			ColorCode:      r.ColorCode,

			BeginQuantity: numericToStr(r.BeginQty),
			EndQuantity:   numericToStr(r.EndQty),
			In:            numericToStr(r.InQty),
			Out:           numericToStr(r.OutQty),
			Shortage:      numericToStr(r.ShortageQty),
			Surplus:       numericToStr(r.SurplusQty),
		})
	}

	return &model.IngredientReportResponse{
		Items: items,
		Totals: model.IngredientReportTotals{
			TotalCount:         totalsRow.TotalCount,
			TotalAddedAmount:   numericToStr(totalsRow.TotalAddedAmount),
			TotalRemovedAmount: numericToStr(totalsRow.TotalRemovedAmount),
		},
	}, nil
}

// RestoreIngredientGroup restores a deleted ingredient group
func (i *IngredientS) RestoreIngredientGroup(ctx context.Context, groupID string) error {
	q, txCtx, tx, ownsTx, err := i.getTenantMutationQueries(ctx)
	if err != nil {
		return err
	}
	if ownsTx {
		defer tx.Rollback(ctx)
	}

	id, err := uuid.Parse(groupID)
	if err != nil {
		return fmt.Errorf("invalid ingredient group ID: %w", err)
	}

	if err := q.RestoreIngredientGroup(txCtx, id); err != nil {
		return fmt.Errorf("failed to restore ingredient group: %w", err)
	}

	if ownsTx {
		if err := tx.Commit(ctx); err != nil {
			return fmt.Errorf("failed to commit transaction: %w", err)
		}
	}

	return nil
}

// ==================== INGREDIENTS ====================

// CreateIngredient creates a new ingredient
func (i *IngredientS) CreateIngredient(ctx context.Context, name string, nameI18n *uuid.UUID, groupID *string, measurement *string, pictureUrl *string, colorCode *string) (*model.IngredientResponse, error) {
	q, txCtx, tx, ownsTx, err := i.getTenantMutationQueries(ctx)
	if err != nil {
		return nil, err
	}
	if ownsTx {
		defer tx.Rollback(ctx)
	}

	if name == "" {
		return nil, fmt.Errorf("ingredient name is required")
	}

	nameI18nUUID := pgtype.UUID{}
	if nameI18n != nil {
		nameI18nUUID = pgtype.UUID{Bytes: *nameI18n, Valid: true}
	}

	groupUUID := pgtype.UUID{}
	if groupID != nil && *groupID != "" {
		id, err := uuid.Parse(*groupID)
		if err != nil {
			return nil, fmt.Errorf("invalid group_id: %w", err)
		}
		groupUUID = pgtype.UUID{Bytes: id, Valid: true}
	}

	measurementNullable := pg.NullMeasurementType{}
	if measurement != nil && *measurement != "" {
		measurementNullable = pg.NullMeasurementType{MeasurementType: pg.MeasurementType(*measurement), Valid: true}
	}

	ingredient, err := q.CreateIngredient(txCtx, pg.CreateIngredientParams{
		ID:          uuid.New(),
		Name:        name,
		NameI18n:    nameI18nUUID,
		GroupID:     groupUUID,
		Measurement: measurementNullable,
		PictureUrl:  pictureUrl,
		ColorCode:   colorCode,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to create ingredient: %w", err)
	}

	// Auto-set visibility for the current branch
	_ = q.EnsureIngredientVisibilityForCurrentBranch(txCtx, ingredient.ID)

	if ownsTx {
		if err := tx.Commit(ctx); err != nil {
			return nil, fmt.Errorf("failed to commit transaction: %w", err)
		}
	}

	return mapIngredientToResponse(ingredient), nil
}

// GetIngredientByID retrieves an ingredient by ID
func (i *IngredientS) GetIngredientByID(ctx context.Context, ingredientID string) (*model.IngredientResponse, error) {
	id, err := uuid.Parse(ingredientID)
	if err != nil {
		return nil, fmt.Errorf("invalid ingredient ID: %w", err)
	}

	var ingredient pg.Ingredient
	err = withTenantRead(ctx, i.repo, func(tenantCtx context.Context, q *pg.Queries) error {
		var err error
		ingredient, err = q.GetIngredientByID(tenantCtx, id)
		return err
	})
	if err != nil {
		return nil, fmt.Errorf("failed to get ingredient: %w", err)
	}

	return mapIngredientToResponse(ingredient), nil
}

// GetAllIngredients retrieves all ingredients
func (i *IngredientS) GetAllIngredients(ctx context.Context, limit, offset int32) ([]model.IngredientResponse, int64, error) {
	var total int64
	var ingredients []pg.Ingredient

	err := withTenantRead(ctx, i.repo, func(tenantCtx context.Context, q *pg.Queries) error {
		var err error
		total, err = q.CountIngredients(tenantCtx)
		if err != nil {
			return fmt.Errorf("failed to count ingredients: %w", err)
		}

		ingredients, err = q.GetAllIngredients(tenantCtx, pg.GetAllIngredientsParams{
			Limit:  limit,
			Offset: offset,
		})
		return err
	})
	if err != nil {
		return nil, 0, err
	}

	var responses []model.IngredientResponse
	for _, ing := range ingredients {
		resp := mapIngredientToResponse(ing)
		if resp != nil {
			responses = append(responses, *resp)
		}
	}

	return responses, total, nil
}

// SearchIngredients searches ingredients by name
func (i *IngredientS) SearchIngredients(ctx context.Context, query string, limit, offset int32) ([]model.IngredientResponse, error) {
	var ingredients []pg.Ingredient

	err := withTenantRead(ctx, i.repo, func(tenantCtx context.Context, q *pg.Queries) error {
		var err error
		ingredients, err = q.SearchIngredients(tenantCtx, pg.SearchIngredientsParams{
			Column1: &query,
			Limit:   limit,
			Offset:  offset,
		})
		return err
	})
	if err != nil {
		return nil, fmt.Errorf("failed to search ingredients: %w", err)
	}

	var responses []model.IngredientResponse
	for _, ing := range ingredients {
		resp := mapIngredientToResponse(ing)
		if resp != nil {
			responses = append(responses, *resp)
		}
	}
	return responses, nil
}

// GetIngredientsByGroupID retrieves ingredients by group ID
func (i *IngredientS) GetIngredientsByGroupID(ctx context.Context, groupID string, limit, offset int32) ([]model.IngredientResponse, int64, error) {
	id, err := uuid.Parse(groupID)
	if err != nil {
		return nil, 0, fmt.Errorf("invalid group ID: %w", err)
	}

	var total int64
	var ingredients []pg.Ingredient

	err = withTenantRead(ctx, i.repo, func(tenantCtx context.Context, q *pg.Queries) error {
		var err error
		total, err = q.CountIngredientsByGroupID(tenantCtx, pgtype.UUID{Bytes: id, Valid: true})
		if err != nil {
			return fmt.Errorf("failed to count ingredients by group: %w", err)
		}

		ingredients, err = q.GetIngredientsByGroupID(tenantCtx, pg.GetIngredientsByGroupIDParams{
			GroupID: pgtype.UUID{Bytes: id, Valid: true},
			Limit:   limit,
			Offset:  offset,
		})
		return err
	})
	if err != nil {
		return nil, 0, err
	}

	var responses []model.IngredientResponse
	for _, ing := range ingredients {
		resp := mapIngredientToResponse(ing)
		if resp != nil {
			responses = append(responses, *resp)
		}
	}

	return responses, total, nil
}

// UpdateIngredient updates an ingredient
func (i *IngredientS) UpdateIngredient(ctx context.Context, ingredientID string, name *string, nameI18n *string, groupID *string, measurement *string, pictureUrl *string, brandID *string, colorCode *string, pricePerUnit *string) (*model.IngredientResponse, error) {
	q, txCtx, tx, ownsTx, err := i.getTenantMutationQueries(ctx)
	if err != nil {
		return nil, err
	}
	if ownsTx {
		defer tx.Rollback(ctx)
	}

	id, err := uuid.Parse(ingredientID)
	if err != nil {
		return nil, fmt.Errorf("invalid ingredient ID: %w", err)
	}

	existing, err := q.GetIngredientByID(txCtx, id)
	if err != nil {
		return nil, fmt.Errorf("failed to get ingredient: %w", err)
	}

	finalName := existing.Name
	if name != nil && *name != "" {
		finalName = *name
	}

	finalNameI18n := existing.NameI18n
	if nameI18n != nil && *nameI18n != "" {
		nameI18nUUID, err := uuid.Parse(*nameI18n)
		if err != nil {
			return nil, fmt.Errorf("invalid name_i18n UUID: %w", err)
		}
		finalNameI18n = pgtype.UUID{Bytes: nameI18nUUID, Valid: true}
	}

	finalGroupID := existing.GroupID
	if groupID != nil && *groupID != "" {
		groupUUID, err := uuid.Parse(*groupID)
		if err != nil {
			return nil, fmt.Errorf("invalid group_id: %w", err)
		}
		finalGroupID = pgtype.UUID{Bytes: groupUUID, Valid: true}
	}

	finalMeasurement := existing.Measurement
	if measurement != nil && *measurement != "" {
		finalMeasurement = pg.NullMeasurementType{MeasurementType: pg.MeasurementType(*measurement), Valid: true}
	}

	finalColorCode := existing.ColorCode
	if colorCode != nil {
		finalColorCode = colorCode
	}

	ingredient, err := q.UpdateIngredient(txCtx, pg.UpdateIngredientParams{
		ID:          id,
		Name:        finalName,
		NameI18n:    finalNameI18n,
		GroupID:     finalGroupID,
		Measurement: finalMeasurement,
		PictureUrl:  pictureUrl,
		ColorCode:   finalColorCode,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to update ingredient: %w", err)
	}

	if pricePerUnit != nil {
		price := pgtype.Numeric{}
		if pricePerUnit != nil {
			if err := price.Scan(*pricePerUnit); err != nil {
				return nil, fmt.Errorf("invalid price_per_unit: %w", err)
			}
		}

		priceUpdated, err := q.UpdateIngredientPriceAndQuantity(txCtx, pg.UpdateIngredientPriceAndQuantityParams{
			ID:           id,
			PricePerUnit: price,
		})
		if err != nil {
			return nil, fmt.Errorf("failed to update ingredient price/quantity: %w", err)
		}
		if ownsTx {
			if err := tx.Commit(ctx); err != nil {
				return nil, fmt.Errorf("failed to commit transaction: %w", err)
			}
		}
		return mapIngredientToResponse(priceUpdated), nil
	}

	if ownsTx {
		if err := tx.Commit(ctx); err != nil {
			return nil, fmt.Errorf("failed to commit transaction: %w", err)
		}
	}

	return mapIngredientToResponse(ingredient), nil
}

// DeleteIngredient soft deletes an ingredient
func (i *IngredientS) DeleteIngredient(ctx context.Context, ingredientID string) error {
	q, txCtx, tx, ownsTx, err := i.getTenantMutationQueries(ctx)
	if err != nil {
		return err
	}
	if ownsTx {
		defer tx.Rollback(ctx)
	}

	id, err := uuid.Parse(ingredientID)
	if err != nil {
		return fmt.Errorf("invalid ingredient ID: %w", err)
	}

	if err := q.DeleteIngredient(txCtx, id); err != nil {
		return fmt.Errorf("failed to delete ingredient: %w", err)
	}

	if ownsTx {
		if err := tx.Commit(ctx); err != nil {
			return fmt.Errorf("failed to commit transaction: %w", err)
		}
	}

	return nil
}

// RestoreIngredient restores a deleted ingredient
func (i *IngredientS) RestoreIngredient(ctx context.Context, ingredientID string) error {
	q, txCtx, tx, ownsTx, err := i.getTenantMutationQueries(ctx)
	if err != nil {
		return err
	}
	if ownsTx {
		defer tx.Rollback(ctx)
	}

	id, err := uuid.Parse(ingredientID)
	if err != nil {
		return fmt.Errorf("invalid ingredient ID: %w", err)
	}

	if err := q.RestoreIngredient(txCtx, id); err != nil {
		return fmt.Errorf("failed to restore ingredient: %w", err)
	}

	if ownsTx {
		if err := tx.Commit(ctx); err != nil {
			return fmt.Errorf("failed to commit transaction: %w", err)
		}
	}

	return nil
}

// ==================== INGREDIENT STOCK ====================

// CreateIngredientStock creates a new ingredient stock entry
func (i *IngredientS) CreateIngredientStock(ctx context.Context, ingredientID string, quantity string, branchID *string, storageID *string) (*model.IngredientStockResponse, error) {
	q, txCtx, tx, ownsTx, err := i.getTenantMutationQueries(ctx)
	if err != nil {
		return nil, err
	}
	if ownsTx {
		defer tx.Rollback(ctx)
	}

	if ingredientID == "" {
		return nil, fmt.Errorf("ingredient_id is required")
	}
	if (branchID == nil || *branchID == "") && (storageID == nil || *storageID == "") {
		return nil, fmt.Errorf("branch_id or storage_id is required")
	}

	quantityNum := pgtype.Numeric{}
	if err := quantityNum.Scan(quantity); err != nil {
		return nil, fmt.Errorf("invalid quantity: %w", err)
	}

	ingID, err := uuid.Parse(ingredientID)
	if err != nil {
		return nil, fmt.Errorf("invalid ingredient ID: %w", err)
	}

	branchUUID := pgtype.UUID{Valid: false}
	if branchID != nil && *branchID != "" {
		bID, err := uuid.Parse(*branchID)
		if err != nil {
			return nil, fmt.Errorf("invalid branch ID: %w", err)
		}
		branchUUID = pgtype.UUID{Bytes: bID, Valid: true}
	}

	storageUUID := pgtype.UUID{Valid: false}
	if storageID != nil && *storageID != "" {
		sID, err := uuid.Parse(*storageID)
		if err != nil {
			return nil, fmt.Errorf("invalid storage ID: %w", err)
		}
		storageUUID = pgtype.UUID{Bytes: sID, Valid: true}
	}

	stock, err := q.CreateIngredientStock(txCtx, pg.CreateIngredientStockParams{
		ID:           uuid.New(),
		IngredientID: ingID,
		Quantity:     quantityNum,
		BranchID:     branchUUID,
		StorageID:    storageUUID,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to create ingredient stock: %w", err)
	}

	if ownsTx {
		if err := tx.Commit(ctx); err != nil {
			return nil, fmt.Errorf("failed to commit transaction: %w", err)
		}
	}

	return toIngredientStockResponse(stock), nil
}

// GetIngredientStockByID retrieves ingredient stock by ID
func (i *IngredientS) GetIngredientStockByID(ctx context.Context, stockID string) (*model.IngredientStockResponse, error) {
	id, err := uuid.Parse(stockID)
	if err != nil {
		return nil, fmt.Errorf("invalid stock ID: %w", err)
	}

	var stock pg.IngredientStock
	err = withTenantRead(ctx, i.repo, func(tenantCtx context.Context, q *pg.Queries) error {
		var err error
		stock, err = q.GetIngredientStockByID(tenantCtx, id)
		return err
	})
	if err != nil {
		return nil, fmt.Errorf("failed to get ingredient stock: %w", err)
	}

	return toIngredientStockResponse(stock), nil
}

// GetStockByIngredientAndBranch retrieves stock for a specific ingredient and branch
func (i *IngredientS) GetStockByIngredientAndBranch(ctx context.Context, ingredientID, branchID string) (*model.IngredientStockResponse, error) {
	ingID, err := uuid.Parse(ingredientID)
	if err != nil {
		return nil, fmt.Errorf("invalid ingredient ID: %w", err)
	}

	bID, err := uuid.Parse(branchID)
	if err != nil {
		return nil, fmt.Errorf("invalid branch ID: %w", err)
	}

	var stock pg.IngredientStock
	err = withTenantRead(ctx, i.repo, func(tenantCtx context.Context, q *pg.Queries) error {
		var err error
		stock, err = q.GetStockByIngredientAndBranch(tenantCtx, pg.GetStockByIngredientAndBranchParams{
			IngredientID: ingID,
			BranchID:     pgtype.UUID{Bytes: bID, Valid: true},
		})
		return err
	})
	if err != nil {
		return nil, fmt.Errorf("failed to get ingredient stock: %w", err)
	}

	return toIngredientStockResponse(stock), nil
}

// GetAllIngredientStock retrieves all ingredient stock entries
func (i *IngredientS) GetAllIngredientStock(ctx context.Context, filter model.IngredientStockFilter, limit, offset int32) ([]model.IngredientStockResponse, int64, error) {
	var total int64
	var stocks []pg.IngredientStock

	err := withTenantRead(ctx, i.repo, func(tenantCtx context.Context, q *pg.Queries) error {
		params := pg.GetIngredientStockFilteredParams{
			Limit:  limit,
			Offset: offset,
		}
		countParams := pg.CountIngredientStockFilteredParams{}

		if filter.IngredientID != nil {
			if id, err := uuid.Parse(*filter.IngredientID); err == nil {
				params.IngredientID = id
				countParams.IngredientID = id
			}
		}
		if filter.IngredientName != nil {
			params.IngredientName = *filter.IngredientName
			countParams.IngredientName = *filter.IngredientName
		}
		if filter.Search != nil {
			params.Search = *filter.Search
			countParams.Search = *filter.Search
		}
		if filter.StorageID != nil {
			if id, err := uuid.Parse(*filter.StorageID); err == nil {
				params.StorageID = id
				countParams.StorageID = id
			}
		}
		if filter.Measurement != nil {
			params.Measurement = *filter.Measurement
			countParams.Measurement = *filter.Measurement
		}
		if filter.SortBy != nil {
			params.SortBy = *filter.SortBy
		}
		if filter.SortOrder != nil {
			params.SortOrder = *filter.SortOrder
		}

		var err error
		total, err = q.CountIngredientStockFiltered(tenantCtx, countParams)
		if err != nil {
			return fmt.Errorf("failed to count ingredient stock: %w", err)
		}

		stocks, err = q.GetIngredientStockFiltered(tenantCtx, params)
		return err
	})
	if err != nil {
		return nil, 0, err
	}

	var responses []model.IngredientStockResponse
	for _, s := range stocks {
		responses = append(responses, *toIngredientStockResponse(s))
	}

	return responses, total, nil
}

// GetStockByBranchID retrieves all stock for a branch
func (i *IngredientS) GetStockByBranchID(ctx context.Context, branchID string, limit, offset int32) ([]model.IngredientStockResponse, int64, error) {
	bID, err := uuid.Parse(branchID)
	if err != nil {
		return nil, 0, fmt.Errorf("invalid branch ID: %w", err)
	}

	var total int64
	var stocks []pg.IngredientStock

	err = withTenantRead(ctx, i.repo, func(tenantCtx context.Context, q *pg.Queries) error {
		var err error
		total, err = q.CountIngredientStockByBranchID(tenantCtx, pgtype.UUID{Bytes: bID, Valid: true})
		if err != nil {
			return fmt.Errorf("failed to count stock by branch: %w", err)
		}

		stocks, err = q.GetStockByBranchID(tenantCtx, pg.GetStockByBranchIDParams{
			BranchID: pgtype.UUID{Bytes: bID, Valid: true},
			Limit:    limit,
			Offset:   offset,
		})
		return err
	})
	if err != nil {
		return nil, 0, err
	}

	var responses []model.IngredientStockResponse
	for _, s := range stocks {
		responses = append(responses, *toIngredientStockResponse(s))
	}

	return responses, total, nil
}

// GetStockByIngredientID retrieves all stock for an ingredient
func (i *IngredientS) GetStockByIngredientID(ctx context.Context, ingredientID string, limit, offset int32) ([]model.IngredientStockResponse, int64, error) {
	ingID, err := uuid.Parse(ingredientID)
	if err != nil {
		return nil, 0, fmt.Errorf("invalid ingredient ID: %w", err)
	}

	var total int64
	var stocks []pg.IngredientStock

	err = withTenantRead(ctx, i.repo, func(tenantCtx context.Context, q *pg.Queries) error {
		var err error
		total, err = q.CountIngredientStockByIngredientID(tenantCtx, ingID)
		if err != nil {
			return fmt.Errorf("failed to count stock by ingredient: %w", err)
		}

		stocks, err = q.GetStockByIngredientID(tenantCtx, pg.GetStockByIngredientIDParams{
			IngredientID: ingID,
			Limit:        limit,
			Offset:       offset,
		})
		return err
	})
	if err != nil {
		return nil, 0, err
	}

	var responses []model.IngredientStockResponse
	for _, s := range stocks {
		responses = append(responses, *toIngredientStockResponse(s))
	}

	return responses, total, nil
}

// UpdateIngredientStock updates ingredient stock quantity
func (i *IngredientS) UpdateIngredientStock(ctx context.Context, stockID string, quantity string) (*model.IngredientStockResponse, error) {
	q, txCtx, tx, ownsTx, err := i.getTenantMutationQueries(ctx)
	if err != nil {
		return nil, err
	}
	if ownsTx {
		defer tx.Rollback(ctx)
	}

	id, err := uuid.Parse(stockID)
	if err != nil {
		return nil, fmt.Errorf("invalid stock ID: %w", err)
	}

	quantityNum := pgtype.Numeric{}
	if err := quantityNum.Scan(quantity); err != nil {
		return nil, fmt.Errorf("invalid quantity: %w", err)
	}

	locked, err := q.GetIngredientStockByIDForUpdate(txCtx, id)
	if err != nil {
		return nil, fmt.Errorf("failed to lock ingredient stock: %w", err)
	}
	stockBefore := locked.Quantity

	ing, err := q.GetIngredientByID(txCtx, locked.IngredientID)
	if err != nil {
		return nil, fmt.Errorf("failed to get ingredient: %w", err)
	}
	price := ing.PricePerUnit
	if !price.Valid {
		_ = price.Scan("0")
	}

	stock, err := q.UpdateIngredientStock(txCtx, pg.UpdateIngredientStockParams{
		ID:       id,
		Quantity: quantityNum,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to update ingredient stock: %w", err)
	}

	// Determine adjustment direction
	zero := pgtype.Numeric{}
	_ = zero.Scan("0")
	qtyIn := zero
	qtyOut := zero

	diff, err := subNumericClampZero(stock.Quantity, stockBefore, 6)
	if err != nil {
		return nil, err
	}
	if numericToString(diff) != "0" {
		qtyIn = diff
	}

	diff2, err := subNumericClampZero(stockBefore, stock.Quantity, 6)
	if err != nil {
		return nil, err
	}
	if numericToString(diff2) != "0" {
		qtyOut = diff2
	}

	eventType := "manual_adjustment"
	if err := q.InsertIngredientStockMovement(txCtx, pg.InsertIngredientStockMovementParams{
		ID:           uuid.New(),
		StorageID:    uuid.UUID(locked.StorageID.Bytes),
		IngredientID: locked.IngredientID,
		EventType:    eventType,
		QtyIn:        qtyIn,
		QtyOut:       qtyOut,
		StockBefore:  stockBefore,
		StockAfter:   stock.Quantity,
		PricePerUnit: price,
		SourceType:   nil,
		SourceID:     nil,
	}); err != nil {
		return nil, fmt.Errorf("failed to insert stock movement: %w", err)
	}

	if ownsTx {
		if err := tx.Commit(ctx); err != nil {
			return nil, fmt.Errorf("failed to commit transaction: %w", err)
		}
	}

	return toIngredientStockResponse(stock), nil
}

// AddToIngredientStock increases ingredient stock quantity
func (i *IngredientS) AddToIngredientStock(ctx context.Context, stockID string, quantity string) (*model.IngredientStockResponse, error) {
	q, txCtx, tx, ownsTx, err := i.getTenantMutationQueries(ctx)
	if err != nil {
		return nil, err
	}
	if ownsTx {
		defer tx.Rollback(ctx)
	}

	id, err := uuid.Parse(stockID)
	if err != nil {
		return nil, fmt.Errorf("invalid stock ID: %w", err)
	}

	quantityNum := pgtype.Numeric{}
	if err := quantityNum.Scan(quantity); err != nil {
		return nil, fmt.Errorf("invalid quantity: %w", err)
	}

	locked, err := q.GetIngredientStockByIDForUpdate(txCtx, id)
	if err != nil {
		return nil, fmt.Errorf("failed to lock ingredient stock: %w", err)
	}
	stockBefore := locked.Quantity

	ing, err := q.GetIngredientByID(txCtx, locked.IngredientID)
	if err != nil {
		return nil, fmt.Errorf("failed to get ingredient: %w", err)
	}
	price := ing.PricePerUnit
	if !price.Valid {
		_ = price.Scan("0")
	}

	stock, err := q.AddToIngredientStock(txCtx, pg.AddToIngredientStockParams{
		ID:       id,
		Quantity: quantityNum,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to add to ingredient stock: %w", err)
	}

	zero := pgtype.Numeric{}
	_ = zero.Scan("0")
	eventType := "manual_in"
	if err := q.InsertIngredientStockMovement(txCtx, pg.InsertIngredientStockMovementParams{
		ID:           uuid.New(),
		StorageID:    uuid.UUID(locked.StorageID.Bytes),
		IngredientID: locked.IngredientID,
		EventType:    eventType,
		QtyIn:        quantityNum,
		QtyOut:       zero,
		StockBefore:  stockBefore,
		StockAfter:   stock.Quantity,
		PricePerUnit: price,
		SourceType:   nil,
		SourceID:     nil,
	}); err != nil {
		return nil, fmt.Errorf("failed to insert stock movement: %w", err)
	}

	if ownsTx {
		if err := tx.Commit(ctx); err != nil {
			return nil, fmt.Errorf("failed to commit transaction: %w", err)
		}
	}

	return toIngredientStockResponse(stock), nil
}

// RemoveFromIngredientStock decreases ingredient stock quantity
func (i *IngredientS) RemoveFromIngredientStock(ctx context.Context, stockID string, quantity string) (*model.IngredientStockResponse, error) {
	q, txCtx, tx, ownsTx, err := i.getTenantMutationQueries(ctx)
	if err != nil {
		return nil, err
	}
	if ownsTx {
		defer tx.Rollback(ctx)
	}

	id, err := uuid.Parse(stockID)
	if err != nil {
		return nil, fmt.Errorf("invalid stock ID: %w", err)
	}

	quantityNum := pgtype.Numeric{}
	if err := quantityNum.Scan(quantity); err != nil {
		return nil, fmt.Errorf("invalid quantity: %w", err)
	}

	locked, err := q.GetIngredientStockByIDForUpdate(txCtx, id)
	if err != nil {
		return nil, fmt.Errorf("failed to lock ingredient stock: %w", err)
	}
	stockBefore := locked.Quantity

	ing, err := q.GetIngredientByID(txCtx, locked.IngredientID)
	if err != nil {
		return nil, fmt.Errorf("failed to get ingredient: %w", err)
	}
	price := ing.PricePerUnit
	if !price.Valid {
		_ = price.Scan("0")
	}

	stock, err := q.RemoveFromIngredientStock(txCtx, pg.RemoveFromIngredientStockParams{
		ID:       id,
		Quantity: quantityNum,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to remove from ingredient stock: %w", err)
	}

	zero := pgtype.Numeric{}
	_ = zero.Scan("0")
	eventType := "manual_out"
	if err := q.InsertIngredientStockMovement(txCtx, pg.InsertIngredientStockMovementParams{
		ID:           uuid.New(),
		StorageID:    uuid.UUID(locked.StorageID.Bytes),
		IngredientID: locked.IngredientID,
		EventType:    eventType,
		QtyIn:        zero,
		QtyOut:       quantityNum,
		StockBefore:  stockBefore,
		StockAfter:   stock.Quantity,
		PricePerUnit: price,
		SourceType:   nil,
		SourceID:     nil,
	}); err != nil {
		return nil, fmt.Errorf("failed to insert stock movement: %w", err)
	}

	if ownsTx {
		if err := tx.Commit(ctx); err != nil {
			return nil, fmt.Errorf("failed to commit transaction: %w", err)
		}
	}

	return toIngredientStockResponse(stock), nil
}

// DeleteIngredientStock soft deletes ingredient stock
func (i *IngredientS) DeleteIngredientStock(ctx context.Context, stockID string) error {
	q, txCtx, tx, ownsTx, err := i.getTenantMutationQueries(ctx)
	if err != nil {
		return err
	}
	if ownsTx {
		defer tx.Rollback(ctx)
	}

	id, err := uuid.Parse(stockID)
	if err != nil {
		return fmt.Errorf("invalid stock ID: %w", err)
	}

	if err := q.DeleteIngredientStock(txCtx, id); err != nil {
		return fmt.Errorf("failed to delete ingredient stock: %w", err)
	}

	if ownsTx {
		if err := tx.Commit(ctx); err != nil {
			return fmt.Errorf("failed to commit transaction: %w", err)
		}
	}

	return nil
}

// RestoreIngredientStock restores deleted ingredient stock
func (i *IngredientS) RestoreIngredientStock(ctx context.Context, stockID string) error {
	q, txCtx, tx, ownsTx, err := i.getTenantMutationQueries(ctx)
	if err != nil {
		return err
	}
	if ownsTx {
		defer tx.Rollback(ctx)
	}

	id, err := uuid.Parse(stockID)
	if err != nil {
		return fmt.Errorf("invalid stock ID: %w", err)
	}

	if err := q.RestoreIngredientStock(txCtx, id); err != nil {
		return fmt.Errorf("failed to restore ingredient stock: %w", err)
	}

	if ownsTx {
		if err := tx.Commit(ctx); err != nil {
			return fmt.Errorf("failed to commit transaction: %w", err)
		}
	}

	return nil
}

func toIngredientStockResponse(stock any) *model.IngredientStockResponse {
	var (
		id           uuid.UUID
		ingredientID uuid.UUID
		quantity     pgtype.Numeric
		branchID     pgtype.UUID
		storageID    pgtype.UUID
		createdAtDB  pgtype.Timestamptz
		updatedAtDB  pgtype.Timestamptz
	)

	switch s := stock.(type) {
	case pg.IngredientStock:
		id, ingredientID, quantity, branchID, storageID, createdAtDB, updatedAtDB = s.ID, s.IngredientID, s.Quantity, s.BranchID, s.StorageID, s.CreatedAt, s.UpdatedAt
	default:
		return nil
	}

	if id == uuid.Nil {
		return nil
	}

	var createdAt *time.Time
	if createdAtDB.Valid {
		createdAt = &createdAtDB.Time
	}

	var updatedAt *time.Time
	if updatedAtDB.Valid {
		updatedAt = &updatedAtDB.Time
	}

	var branchIDStr *string
	if branchID.Valid {
		b := uuid.UUID(branchID.Bytes).String()
		branchIDStr = &b
	}

	var storageIDStr *string
	if storageID.Valid {
		st := uuid.UUID(storageID.Bytes).String()
		storageIDStr = &st
	}

	return &model.IngredientStockResponse{
		ID:           id.String(),
		IngredientID: ingredientID.String(),
		Quantity:     numericToStr(quantity),
		BranchID:     branchIDStr,
		StorageID:    storageIDStr,
		CreatedAt:    createdAt,
		UpdatedAt:    updatedAt,
	}
}

// GetIngredientGroupByIDWithLang retrieves ingredient group by ID with language support
func (i *IngredientS) GetIngredientGroupByIDWithLang(ctx context.Context, groupID string, lang string) (*model.IngredientGroupResponse, error) {
	id, err := uuid.Parse(groupID)
	if err != nil {
		return nil, fmt.Errorf("invalid group ID: %w", err)
	}

	var group pg.IngredientGroup
	err = withTenantRead(ctx, i.repo, func(tenantCtx context.Context, q *pg.Queries) error {
		var err error
		group, err = q.GetIngredientGroupByIDWithLanguage(tenantCtx, pg.GetIngredientGroupByIDWithLanguageParams{
			ID:      id,
			Column2: lang,
		})
		return err
	})
	if err != nil {
		return nil, fmt.Errorf("failed to get ingredient group: %w", err)
	}

	return mapIngredientGroupToResponse(group.ID, group.Name, group.NameI18n, group.PictureUrl, group.ColorCode, group.CreatedAt, group.UpdatedAt), nil
}

// GetAllIngredientGroupsWithLang retrieves all ingredient groups with language support
func (i *IngredientS) GetAllIngredientGroupsWithLang(ctx context.Context, lang string, limit, offset int32) ([]model.IngredientGroupResponse, int64, error) {
	var total int64
	var groups []pg.IngredientGroup

	err := withTenantRead(ctx, i.repo, func(tenantCtx context.Context, q *pg.Queries) error {
		var err error
		total, err = q.CountIngredientGroups(tenantCtx)
		if err != nil {
			return fmt.Errorf("failed to count ingredient groups: %w", err)
		}

		groups, err = q.GetAllIngredientGroupsWithLanguage(tenantCtx, pg.GetAllIngredientGroupsWithLanguageParams{
			Column1: lang,
			Limit:   limit,
			Offset:  offset,
		})
		return err
	})
	if err != nil {
		return nil, 0, err
	}

	var responses []model.IngredientGroupResponse
	for _, group := range groups {
		responses = append(responses, *mapIngredientGroupToResponse(group.ID, group.Name, group.NameI18n, group.PictureUrl, group.ColorCode, group.CreatedAt, group.UpdatedAt))
	}
	return responses, total, nil
}

// GetIngredientByIDWithLang retrieves ingredient by ID with language support
func (i *IngredientS) GetIngredientByIDWithLang(ctx context.Context, ingredientID string, lang string) (*model.IngredientResponse, error) {
	id, err := uuid.Parse(ingredientID)
	if err != nil {
		return nil, fmt.Errorf("invalid ingredient ID: %w", err)
	}

	var ingredient pg.Ingredient
	err = withTenantRead(ctx, i.repo, func(tenantCtx context.Context, q *pg.Queries) error {
		var err error
		ingredient, err = q.GetIngredientByIDWithLanguage(tenantCtx, pg.GetIngredientByIDWithLanguageParams{
			ID:      id,
			Column2: lang,
		})
		return err
	})
	if err != nil {
		return nil, fmt.Errorf("failed to get ingredient: %w", err)
	}

	return mapIngredientToResponse(ingredient), nil
}

// GetAllIngredientsWithLang retrieves all ingredients with language support
func (i *IngredientS) GetAllIngredientsWithLang(ctx context.Context, lang string, limit, offset int32) ([]model.IngredientResponse, int64, error) {
	var total int64
	var ingredients []pg.Ingredient

	err := withTenantRead(ctx, i.repo, func(tenantCtx context.Context, q *pg.Queries) error {
		var err error
		total, err = q.CountIngredients(tenantCtx)
		if err != nil {
			return fmt.Errorf("failed to count ingredients: %w", err)
		}

		ingredients, err = q.GetAllIngredientsWithLanguage(tenantCtx, pg.GetAllIngredientsWithLanguageParams{
			Column1: lang,
			Limit:   limit,
			Offset:  offset,
		})
		return err
	})
	if err != nil {
		return nil, 0, err
	}

	var responses []model.IngredientResponse
	for _, ingredient := range ingredients {
		responses = append(responses, *mapIngredientToResponse(ingredient))
	}
	return responses, total, nil
}
