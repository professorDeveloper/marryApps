package service

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
	"gitlab.yurtal.tech/company/maryai/back/internal/model"
	"gitlab.yurtal.tech/company/maryai/back/internal/repository"
	"gitlab.yurtal.tech/company/maryai/back/internal/repository/pg"
)

type IngredientS struct {
	repo *repository.Repository
}

func NewIngredientS(repo *repository.Repository) *IngredientS {
	return &IngredientS{repo: repo}
}

func (i *IngredientS) CreateIngredientGroup(ctx context.Context, name string, nameI18n *uuid.UUID) (*model.IngredientGroupResponse, error) {
	if name == "" {
		return nil, fmt.Errorf("ingredient group name is required")
	}

	nameI18nUUID := pgtype.UUID{}
	if nameI18n != nil {
		nameI18nUUID = pgtype.UUID{Bytes: *nameI18n, Valid: true}
	}

	group, err := i.repo.PgRepo.Repo.CreateIngredientGroup(ctx, pg.CreateIngredientGroupParams{
		ID:       uuid.New(),
		Name:     name,
		NameI18n: nameI18nUUID,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to create ingredient group: %w", err)
	}

	return toIngredientGroupResponse(group), nil
}

// GetIngredientGroupByID retrieves an ingredient group by ID
func (i *IngredientS) GetIngredientGroupByID(ctx context.Context, groupID string) (*model.IngredientGroupResponse, error) {
	id, err := uuid.Parse(groupID)
	if err != nil {
		return nil, fmt.Errorf("invalid ingredient group ID: %w", err)
	}

	group, err := i.repo.PgRepo.Repo.GetIngredientGroupByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("failed to get ingredient group: %w", err)
	}

	return toIngredientGroupResponse(group), nil
}

// GetAllIngredientGroups retrieves all ingredient groups
func (i *IngredientS) GetAllIngredientGroups(ctx context.Context, limit, offset int32) ([]model.IngredientGroupResponse, error) {
	groups, err := i.repo.PgRepo.Repo.GetAllIngredientGroups(ctx, pg.GetAllIngredientGroupsParams{
		Limit:  limit,
		Offset: offset,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to get ingredient groups: %w", err)
	}

	var responses []model.IngredientGroupResponse
	for _, g := range groups {
		responses = append(responses, *toIngredientGroupResponse(g))
	}

	return responses, nil
}

// UpdateIngredientGroup updates an ingredient group
func (i *IngredientS) UpdateIngredientGroup(ctx context.Context, groupID string, name *string, nameI18n *string) (*model.IngredientGroupResponse, error) {
	id, err := uuid.Parse(groupID)
	if err != nil {
		return nil, fmt.Errorf("invalid ingredient group ID: %w", err)
	}

	// Use current values as defaults
	groupData, err := i.repo.PgRepo.Repo.GetIngredientGroupByID(ctx, id)
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

	group, err := i.repo.PgRepo.Repo.UpdateIngredientGroup(ctx, pg.UpdateIngredientGroupParams{
		ID:       id,
		Name:     updatedName,
		NameI18n: updatedNameI18n,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to update ingredient group: %w", err)
	}

	return toIngredientGroupResponse(group), nil
}

// DeleteIngredientGroup soft deletes an ingredient group
func (i *IngredientS) DeleteIngredientGroup(ctx context.Context, groupID string) error {
	id, err := uuid.Parse(groupID)
	if err != nil {
		return fmt.Errorf("invalid ingredient group ID: %w", err)
	}

	if err := i.repo.PgRepo.Repo.DeleteIngredientGroup(ctx, id); err != nil {
		return fmt.Errorf("failed to delete ingredient group: %w", err)
	}

	return nil
}

// RestoreIngredientGroup restores a deleted ingredient group
func (i *IngredientS) RestoreIngredientGroup(ctx context.Context, groupID string) error {
	id, err := uuid.Parse(groupID)
	if err != nil {
		return fmt.Errorf("invalid ingredient group ID: %w", err)
	}

	if err := i.repo.PgRepo.Repo.RestoreIngredientGroup(ctx, id); err != nil {
		return fmt.Errorf("failed to restore ingredient group: %w", err)
	}

	return nil
}

// ==================== INGREDIENTS ====================

// CreateIngredient creates a new ingredient
func (i *IngredientS) CreateIngredient(ctx context.Context, name string, nameI18n *uuid.UUID, groupID *string, measurement *string, pictureUrl *string, brandID *string) (*model.IngredientResponse, error) {
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

	brandUUID := pgtype.UUID{}
	if brandID != nil && *brandID != "" {
		id, err := uuid.Parse(*brandID)
		if err != nil {
			return nil, fmt.Errorf("invalid brand_id: %w", err)
		}
		brandUUID = pgtype.UUID{Bytes: id, Valid: true}
	}

	measurementNullable := pg.NullMeasurementType{}
	if measurement != nil && *measurement != "" {
		measurementNullable = pg.NullMeasurementType{MeasurementType: pg.MeasurementType(*measurement), Valid: true}
	}

	ingredient, err := i.repo.PgRepo.Repo.CreateIngredient(ctx, pg.CreateIngredientParams{
		ID:          uuid.New(),
		Name:        name,
		NameI18n:    nameI18nUUID,
		GroupID:     groupUUID,
		Measurement: measurementNullable,
		PictureUrl:  pictureUrl,
		BrandID:     brandUUID,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to create ingredient: %w", err)
	}

	return toIngredientResponse(ingredient), nil
}

// GetIngredientByID retrieves an ingredient by ID
func (i *IngredientS) GetIngredientByID(ctx context.Context, ingredientID string) (*model.IngredientResponse, error) {
	id, err := uuid.Parse(ingredientID)
	if err != nil {
		return nil, fmt.Errorf("invalid ingredient ID: %w", err)
	}

	ingredient, err := i.repo.PgRepo.Repo.GetIngredientByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("failed to get ingredient: %w", err)
	}

	return toIngredientResponse(ingredient), nil
}

// GetAllIngredients retrieves all ingredients
func (i *IngredientS) GetAllIngredients(ctx context.Context, limit, offset int32) ([]model.IngredientResponse, error) {
	ingredients, err := i.repo.PgRepo.Repo.GetAllIngredients(ctx, pg.GetAllIngredientsParams{
		Limit:  limit,
		Offset: offset,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to get ingredients: %w", err)
	}

	var responses []model.IngredientResponse
	for _, ing := range ingredients {
		responses = append(responses, *toIngredientResponse(ing))
	}

	return responses, nil
}

// GetIngredientsByGroupID retrieves ingredients by group ID
func (i *IngredientS) GetIngredientsByGroupID(ctx context.Context, groupID string, limit, offset int32) ([]model.IngredientResponse, error) {
	id, err := uuid.Parse(groupID)
	if err != nil {
		return nil, fmt.Errorf("invalid group ID: %w", err)
	}

	ingredients, err := i.repo.PgRepo.Repo.GetIngredientsByGroupID(ctx, pg.GetIngredientsByGroupIDParams{
		GroupID: pgtype.UUID{Bytes: id, Valid: true},
		Limit:   limit,
		Offset:  offset,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to get ingredients by group: %w", err)
	}

	var responses []model.IngredientResponse
	for _, ing := range ingredients {
		responses = append(responses, *toIngredientResponse(ing))
	}

	return responses, nil
}

// UpdateIngredient updates an ingredient
func (i *IngredientS) UpdateIngredient(ctx context.Context, ingredientID string, name *string, nameI18n *string, groupID *string, measurement *string, pictureUrl *string, brandID *string) (*model.IngredientResponse, error) {
	id, err := uuid.Parse(ingredientID)
	if err != nil {
		return nil, fmt.Errorf("invalid ingredient ID: %w", err)
	}

	existing, err := i.repo.PgRepo.Repo.GetIngredientByID(ctx, id)
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

	finalBrandID := existing.BrandID
	if brandID != nil && *brandID != "" {
		brandUUID, err := uuid.Parse(*brandID)
		if err != nil {
			return nil, fmt.Errorf("invalid brand_id: %w", err)
		}
		finalBrandID = pgtype.UUID{Bytes: brandUUID, Valid: true}
	}

	finalMeasurement := existing.Measurement
	if measurement != nil && *measurement != "" {
		finalMeasurement = pg.NullMeasurementType{MeasurementType: pg.MeasurementType(*measurement), Valid: true}
	}

	ingredient, err := i.repo.PgRepo.Repo.UpdateIngredient(ctx, pg.UpdateIngredientParams{
		ID:          id,
		Name:        finalName,
		NameI18n:    finalNameI18n,
		GroupID:     finalGroupID,
		Measurement: finalMeasurement,
		PictureUrl:  pictureUrl,
		BrandID:     finalBrandID,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to update ingredient: %w", err)
	}

	return toIngredientResponse(ingredient), nil
}

// DeleteIngredient soft deletes an ingredient
func (i *IngredientS) DeleteIngredient(ctx context.Context, ingredientID string) error {
	id, err := uuid.Parse(ingredientID)
	if err != nil {
		return fmt.Errorf("invalid ingredient ID: %w", err)
	}

	if err := i.repo.PgRepo.Repo.DeleteIngredient(ctx, id); err != nil {
		return fmt.Errorf("failed to delete ingredient: %w", err)
	}

	return nil
}

// RestoreIngredient restores a deleted ingredient
func (i *IngredientS) RestoreIngredient(ctx context.Context, ingredientID string) error {
	id, err := uuid.Parse(ingredientID)
	if err != nil {
		return fmt.Errorf("invalid ingredient ID: %w", err)
	}

	if err := i.repo.PgRepo.Repo.RestoreIngredient(ctx, id); err != nil {
		return fmt.Errorf("failed to restore ingredient: %w", err)
	}

	return nil
}

// ==================== INGREDIENT STOCK ====================

// CreateIngredientStock creates a new ingredient stock entry
func (i *IngredientS) CreateIngredientStock(ctx context.Context, ingredientID string, quantity int64, branchID string) (*model.IngredientStockResponse, error) {
	if ingredientID == "" {
		return nil, fmt.Errorf("ingredient_id is required")
	}
	if branchID == "" {
		return nil, fmt.Errorf("branch_id is required")
	}

	ingID, err := uuid.Parse(ingredientID)
	if err != nil {
		return nil, fmt.Errorf("invalid ingredient ID: %w", err)
	}

	bID, err := uuid.Parse(branchID)
	if err != nil {
		return nil, fmt.Errorf("invalid branch ID: %w", err)
	}

	stock, err := i.repo.PgRepo.Repo.CreateIngredientStock(ctx, pg.CreateIngredientStockParams{
		ID:           uuid.New(),
		IngredientID: ingID,
		Quantity:     quantity,
		BranchID:     bID,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to create ingredient stock: %w", err)
	}

	return toIngredientStockResponse(stock), nil
}

// GetIngredientStockByID retrieves ingredient stock by ID
func (i *IngredientS) GetIngredientStockByID(ctx context.Context, stockID string) (*model.IngredientStockResponse, error) {
	id, err := uuid.Parse(stockID)
	if err != nil {
		return nil, fmt.Errorf("invalid stock ID: %w", err)
	}

	stock, err := i.repo.PgRepo.Repo.GetIngredientStockByID(ctx, id)
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

	stock, err := i.repo.PgRepo.Repo.GetStockByIngredientAndBranch(ctx, pg.GetStockByIngredientAndBranchParams{
		IngredientID: ingID,
		BranchID:     bID,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to get ingredient stock: %w", err)
	}

	return toIngredientStockResponse(stock), nil
}

// GetAllIngredientStock retrieves all ingredient stock entries
func (i *IngredientS) GetAllIngredientStock(ctx context.Context, limit, offset int32) ([]model.IngredientStockResponse, error) {
	stocks, err := i.repo.PgRepo.Repo.GetAllIngredientStock(ctx, pg.GetAllIngredientStockParams{
		Limit:  limit,
		Offset: offset,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to get ingredient stock: %w", err)
	}

	var responses []model.IngredientStockResponse
	for _, s := range stocks {
		responses = append(responses, *toIngredientStockResponse(s))
	}

	return responses, nil
}

// GetStockByBranchID retrieves all stock for a branch
func (i *IngredientS) GetStockByBranchID(ctx context.Context, branchID string, limit, offset int32) ([]model.IngredientStockResponse, error) {
	bID, err := uuid.Parse(branchID)
	if err != nil {
		return nil, fmt.Errorf("invalid branch ID: %w", err)
	}

	stocks, err := i.repo.PgRepo.Repo.GetStockByBranchID(ctx, pg.GetStockByBranchIDParams{
		BranchID: bID,
		Limit:    limit,
		Offset:   offset,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to get stock by branch: %w", err)
	}

	var responses []model.IngredientStockResponse
	for _, s := range stocks {
		responses = append(responses, *toIngredientStockResponse(s))
	}

	return responses, nil
}

// GetStockByIngredientID retrieves all stock for an ingredient
func (i *IngredientS) GetStockByIngredientID(ctx context.Context, ingredientID string, limit, offset int32) ([]model.IngredientStockResponse, error) {
	ingID, err := uuid.Parse(ingredientID)
	if err != nil {
		return nil, fmt.Errorf("invalid ingredient ID: %w", err)
	}

	stocks, err := i.repo.PgRepo.Repo.GetStockByIngredientID(ctx, pg.GetStockByIngredientIDParams{
		IngredientID: ingID,
		Limit:        limit,
		Offset:       offset,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to get stock by ingredient: %w", err)
	}

	var responses []model.IngredientStockResponse
	for _, s := range stocks {
		responses = append(responses, *toIngredientStockResponse(s))
	}

	return responses, nil
}

// UpdateIngredientStock updates ingredient stock quantity
func (i *IngredientS) UpdateIngredientStock(ctx context.Context, stockID string, quantity int64) (*model.IngredientStockResponse, error) {
	id, err := uuid.Parse(stockID)
	if err != nil {
		return nil, fmt.Errorf("invalid stock ID: %w", err)
	}

	stock, err := i.repo.PgRepo.Repo.UpdateIngredientStock(ctx, pg.UpdateIngredientStockParams{
		ID:       id,
		Quantity: quantity,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to update ingredient stock: %w", err)
	}

	return toIngredientStockResponse(stock), nil
}

// AddToIngredientStock increases ingredient stock quantity
func (i *IngredientS) AddToIngredientStock(ctx context.Context, stockID string, quantity int64) (*model.IngredientStockResponse, error) {
	id, err := uuid.Parse(stockID)
	if err != nil {
		return nil, fmt.Errorf("invalid stock ID: %w", err)
	}

	stock, err := i.repo.PgRepo.Repo.AddToIngredientStock(ctx, pg.AddToIngredientStockParams{
		ID:       id,
		Quantity: quantity,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to add to ingredient stock: %w", err)
	}

	return toIngredientStockResponse(stock), nil
}

// RemoveFromIngredientStock decreases ingredient stock quantity
func (i *IngredientS) RemoveFromIngredientStock(ctx context.Context, stockID string, quantity int64) (*model.IngredientStockResponse, error) {
	id, err := uuid.Parse(stockID)
	if err != nil {
		return nil, fmt.Errorf("invalid stock ID: %w", err)
	}

	stock, err := i.repo.PgRepo.Repo.RemoveFromIngredientStock(ctx, pg.RemoveFromIngredientStockParams{
		ID:       id,
		Quantity: quantity,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to remove from ingredient stock: %w", err)
	}

	return toIngredientStockResponse(stock), nil
}

// DeleteIngredientStock soft deletes ingredient stock
func (i *IngredientS) DeleteIngredientStock(ctx context.Context, stockID string) error {
	id, err := uuid.Parse(stockID)
	if err != nil {
		return fmt.Errorf("invalid stock ID: %w", err)
	}

	if err := i.repo.PgRepo.Repo.DeleteIngredientStock(ctx, id); err != nil {
		return fmt.Errorf("failed to delete ingredient stock: %w", err)
	}

	return nil
}

// RestoreIngredientStock restores deleted ingredient stock
func (i *IngredientS) RestoreIngredientStock(ctx context.Context, stockID string) error {
	id, err := uuid.Parse(stockID)
	if err != nil {
		return fmt.Errorf("invalid stock ID: %w", err)
	}

	if err := i.repo.PgRepo.Repo.RestoreIngredientStock(ctx, id); err != nil {
		return fmt.Errorf("failed to restore ingredient stock: %w", err)
	}

	return nil
}

func toIngredientGroupResponse(g pg.IngredientGroup) *model.IngredientGroupResponse {
	if g.ID == uuid.Nil {
		return nil
	}

	var nameI18nStr *string
	if g.NameI18n.Valid {
		uuidStr := uuid.UUID(g.NameI18n.Bytes).String()
		nameI18nStr = &uuidStr
	}

	var createdAt *time.Time
	if g.CreatedAt.Valid {
		createdAt = &g.CreatedAt.Time
	}

	var updatedAt *time.Time
	if g.UpdatedAt.Valid {
		updatedAt = &g.UpdatedAt.Time
	}

	name := g.Name
	return &model.IngredientGroupResponse{
		ID:        g.ID.String(),
		Name:      &name,
		NameI18n:  nameI18nStr,
		CreatedAt: createdAt,
		UpdatedAt: updatedAt,
	}
}

func toIngredientResponse(ing pg.Ingredient) *model.IngredientResponse {
	if ing.ID == uuid.Nil {
		return nil
	}

	var nameI18nStr *string
	if ing.NameI18n.Valid {
		uuidStr := uuid.UUID(ing.NameI18n.Bytes).String()
		nameI18nStr = &uuidStr
	}

	var groupIDStr *string
	if ing.GroupID.Valid {
		str := ing.GroupID.String()
		groupIDStr = &str
	}

	var brandIDStr *string
	if ing.BrandID.Valid {
		str := ing.BrandID.String()
		brandIDStr = &str
	}

	var measurementStr *string
	if ing.Measurement.Valid {
		str := string(ing.Measurement.MeasurementType)
		measurementStr = &str
	}

	var createdAt *time.Time
	if ing.CreatedAt.Valid {
		createdAt = &ing.CreatedAt.Time
	}

	var updatedAt *time.Time
	if ing.UpdatedAt.Valid {
		updatedAt = &ing.UpdatedAt.Time
	}

	name := ing.Name
	return &model.IngredientResponse{
		ID:          ing.ID.String(),
		Name:        &name,
		NameI18n:    nameI18nStr,
		GroupID:     groupIDStr,
		Measurement: measurementStr,
		PictureUrl:  ing.PictureUrl,
		BrandID:     brandIDStr,
		CreatedAt:   createdAt,
		UpdatedAt:   updatedAt,
	}
}

func toIngredientStockResponse(s pg.IngredientStock) *model.IngredientStockResponse {
	if s.ID == uuid.Nil {
		return nil
	}

	var createdAt *time.Time
	if s.CreatedAt.Valid {
		createdAt = &s.CreatedAt.Time
	}

	var updatedAt *time.Time
	if s.UpdatedAt.Valid {
		updatedAt = &s.UpdatedAt.Time
	}

	return &model.IngredientStockResponse{
		ID:           s.ID.String(),
		IngredientID: s.IngredientID.String(),
		Quantity:     s.Quantity,
		BranchID:     s.BranchID.String(),
		CreatedAt:    createdAt,
		UpdatedAt:    updatedAt,
	}
}
