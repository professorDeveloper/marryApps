package service

import (
	"context"
	"fmt"
	"log"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"gitlab.yurtal.tech/company/maryai/back/internal/model"
	"gitlab.yurtal.tech/company/maryai/back/internal/repository"
	pg "gitlab.yurtal.tech/company/maryai/back/internal/repository/pg"
)

type CompoundS struct {
	repo *repository.Repository
}

func NewCompoundS(repo *repository.Repository) *CompoundS {
	return &CompoundS{repo: repo}
}

// CreateCompound creates a new compound
func (c *CompoundS) CreateCompound(ctx context.Context, name string, nameI18n, description, descriptionI18n, measurement, departmentID *string, quantity int32, price *string) (*model.CompoundResponse, error) {
	if name == "" {
		return nil, fmt.Errorf("compound name is required")
	}

	id := uuid.New()
	nameI18nUUID := pgtype.UUID{}
	if nameI18n != nil && *nameI18n != "" {
		i18nID, err := uuid.Parse(*nameI18n)
		if err != nil {
			return nil, fmt.Errorf("invalid name_i18n: %w", err)
		}
		nameI18nUUID = pgtype.UUID{Bytes: i18nID, Valid: true}
	}

	descriptionI18nUUID := pgtype.UUID{}
	if descriptionI18n != nil && *descriptionI18n != "" {
		i18nID, err := uuid.Parse(*descriptionI18n)
		if err != nil {
			return nil, fmt.Errorf("invalid description_i18n: %w", err)
		}
		descriptionI18nUUID = pgtype.UUID{Bytes: i18nID, Valid: true}
	}

	deptID := pgtype.UUID{}
	if departmentID != nil && *departmentID != "" {
		deptUUID, err := uuid.Parse(*departmentID)
		if err != nil {
			return nil, fmt.Errorf("invalid department_id: %w", err)
		}
		deptID = pgtype.UUID{Bytes: deptUUID, Valid: true}
	}

	numPrice := pgtype.Numeric{}
	if price != nil && *price != "" {
		numPrice.Scan(*price)
	}

	measurementType := pg.NullMeasurementType{}
	if measurement != nil && *measurement != "" {
		measurementType.MeasurementType = pg.MeasurementType(*measurement)
		measurementType.Valid = true
	}

	compound, err := c.repo.PgRepo.Repo.CreateCompound(ctx, pg.CreateCompoundParams{
		ID:              id,
		Name:            name,
		NameI18n:        nameI18nUUID,
		Description:     description,
		DescriptionI18n: descriptionI18nUUID,
		Quantity:        &quantity,
		Measurement:     measurementType,
		Price:           numPrice,
		DepartmentID:    deptID,
	})
	if err != nil {
		log.Printf("CreateCompound failed: %v", err)
		return nil, fmt.Errorf("failed to create compound: %w", err)
	}

	return toCompoundResponse(compound), nil
}

// GetCompoundByID retrieves a compound by ID
func (c *CompoundS) GetCompoundByID(ctx context.Context, compoundID string) (*model.CompoundResponse, error) {
	id, err := uuid.Parse(compoundID)
	if err != nil {
		return nil, fmt.Errorf("invalid compound ID: %w", err)
	}

	compound, err := c.repo.PgRepo.Repo.GetCompoundByID(ctx, id)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, fmt.Errorf("compound not found")
		}
		log.Printf("GetCompoundByID failed: %v", err)
		return nil, fmt.Errorf("failed to retrieve compound: %w", err)
	}

	return toCompoundResponse(compound), nil
}

// GetAllCompounds retrieves all compounds with pagination
func (c *CompoundS) GetAllCompounds(ctx context.Context, limit, offset int32) ([]*model.CompoundResponse, error) {
	compounds, err := c.repo.PgRepo.Repo.GetAllCompounds(ctx, pg.GetAllCompoundsParams{
		Limit:  limit,
		Offset: offset,
	})
	if err != nil {
		log.Printf("GetAllCompounds failed: %v", err)
		return nil, fmt.Errorf("failed to retrieve compounds: %w", err)
	}

	var responses []*model.CompoundResponse
	for _, comp := range compounds {
		responses = append(responses, toCompoundResponse(comp))
	}
	return responses, nil
}

// GetCompoundsByDepartmentID retrieves compounds by department ID
func (c *CompoundS) GetCompoundsByDepartmentID(ctx context.Context, departmentID string, limit, offset int32) ([]*model.CompoundResponse, error) {
	id, err := uuid.Parse(departmentID)
	if err != nil {
		return nil, fmt.Errorf("invalid department ID: %w", err)
	}

	compounds, err := c.repo.PgRepo.Repo.GetCompoundsByDepartmentID(ctx, pg.GetCompoundsByDepartmentIDParams{
		DepartmentID: pgtype.UUID{Bytes: id, Valid: true},
		Limit:        limit,
		Offset:       offset,
	})
	if err != nil {
		log.Printf("GetCompoundsByDepartmentID failed: %v", err)
		return nil, fmt.Errorf("failed to retrieve compounds: %w", err)
	}

	var responses []*model.CompoundResponse
	for _, comp := range compounds {
		responses = append(responses, toCompoundResponse(comp))
	}
	return responses, nil
}

// UpdateCompound updates a compound
func (c *CompoundS) UpdateCompound(ctx context.Context, compoundID string, name, nameI18n, description, descriptionI18n, measurement, departmentID *string, quantity *int32, price *string) (*model.CompoundResponse, error) {
	id, err := uuid.Parse(compoundID)
	if err != nil {
		return nil, fmt.Errorf("invalid compound ID: %w", err)
	}

	// Get existing compound
	existing, err := c.repo.PgRepo.Repo.GetCompoundByID(ctx, id)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, fmt.Errorf("compound not found")
		}
		return nil, fmt.Errorf("failed to get compound: %w", err)
	}

	finalName := existing.Name
	if name != nil && *name != "" {
		finalName = *name
	}

	finalNameI18n := existing.NameI18n
	if nameI18n != nil && *nameI18n != "" {
		i18nID, err := uuid.Parse(*nameI18n)
		if err != nil {
			return nil, fmt.Errorf("invalid name_i18n: %w", err)
		}
		finalNameI18n = pgtype.UUID{Bytes: i18nID, Valid: true}
	}

	finalDescription := existing.Description
	if description != nil {
		finalDescription = description
	}

	finalDescriptionI18n := existing.DescriptionI18n
	if descriptionI18n != nil && *descriptionI18n != "" {
		i18nID, err := uuid.Parse(*descriptionI18n)
		if err != nil {
			return nil, fmt.Errorf("invalid description_i18n: %w", err)
		}
		finalDescriptionI18n = pgtype.UUID{Bytes: i18nID, Valid: true}
	}

	finalQuantity := existing.Quantity
	if quantity != nil {
		finalQuantity = quantity
	}

	finalMeasurement := existing.Measurement
	if measurement != nil && *measurement != "" {
		finalMeasurement = pg.NullMeasurementType{
			MeasurementType: pg.MeasurementType(*measurement),
			Valid:           true,
		}
	}

	finalPrice := existing.Price
	if price != nil && *price != "" {
		finalPrice.Scan(*price)
	}

	finalDeptID := existing.DepartmentID
	if departmentID != nil && *departmentID != "" {
		deptID, err := uuid.Parse(*departmentID)
		if err != nil {
			return nil, fmt.Errorf("invalid department_id: %w", err)
		}
		finalDeptID = pgtype.UUID{Bytes: deptID, Valid: true}
	}

	compound, err := c.repo.PgRepo.Repo.UpdateCompound(ctx, pg.UpdateCompoundParams{
		ID:              id,
		Name:            finalName,
		NameI18n:        finalNameI18n,
		Description:     finalDescription,
		DescriptionI18n: finalDescriptionI18n,
		Quantity:        finalQuantity,
		Measurement:     finalMeasurement,
		Price:           finalPrice,
		DepartmentID:    finalDeptID,
	})
	if err != nil {
		log.Printf("UpdateCompound failed: %v", err)
		return nil, fmt.Errorf("failed to update compound: %w", err)
	}

	return toCompoundResponse(compound), nil
}

// DeleteCompound soft deletes a compound
func (c *CompoundS) DeleteCompound(ctx context.Context, compoundID string) error {
	id, err := uuid.Parse(compoundID)
	if err != nil {
		return fmt.Errorf("invalid compound ID: %w", err)
	}

	if err := c.repo.PgRepo.Repo.DeleteCompound(ctx, id); err != nil {
		log.Printf("DeleteCompound failed: %v", err)
		return fmt.Errorf("failed to delete compound: %w", err)
	}
	return nil
}

// RestoreCompound restores a soft-deleted compound
func (c *CompoundS) RestoreCompound(ctx context.Context, compoundID string) (*model.CompoundResponse, error) {
	id, err := uuid.Parse(compoundID)
	if err != nil {
		return nil, fmt.Errorf("invalid compound ID: %w", err)
	}

	if err := c.repo.PgRepo.Repo.RestoreCompound(ctx, id); err != nil {
		log.Printf("RestoreCompound failed: %v", err)
		return nil, fmt.Errorf("failed to restore compound: %w", err)
	}

	return c.GetCompoundByID(ctx, compoundID)
}

// SearchCompounds searches for compounds by name or description
func (c *CompoundS) SearchCompounds(ctx context.Context, query string, limit, offset int32) ([]*model.CompoundResponse, error) {
	if query == "" {
		return nil, fmt.Errorf("search query is required")
	}

	compounds, err := c.repo.PgRepo.Repo.SearchCompounds(ctx, pg.SearchCompoundsParams{
		Column1: &query,
		Limit:   limit,
		Offset:  offset,
	})
	if err != nil {
		log.Printf("SearchCompounds failed: %v", err)
		return nil, fmt.Errorf("failed to search compounds: %w", err)
	}

	var responses []*model.CompoundResponse
	for _, comp := range compounds {
		responses = append(responses, toCompoundResponse(comp))
	}
	return responses, nil
}

// Helper function to convert database compound to response model
func toCompoundResponse(comp pg.Compound) *model.CompoundResponse {
	var nameI18nStr *string
	if comp.NameI18n.Valid {
		str := comp.NameI18n.String()
		nameI18nStr = &str
	}

	var descriptionI18nStr *string
	if comp.DescriptionI18n.Valid {
		str := comp.DescriptionI18n.String()
		descriptionI18nStr = &str
	}

	var deptIDStr *string
	if comp.DepartmentID.Valid {
		str := comp.DepartmentID.String()
		deptIDStr = &str
	}

	var quantityInt64 int64
	if comp.Quantity != nil {
		quantityInt64 = int64(*comp.Quantity)
	}

	var priceStr *string
	if comp.Price.Valid && comp.Price.Int != nil {
		priceValue := comp.Price.Int.String()
		priceStr = &priceValue
	}

	var measurementStr *string
	if comp.Measurement.Valid {
		str := string(comp.Measurement.MeasurementType)
		measurementStr = &str
	}

	var createdAt *time.Time
	if comp.CreatedAt.Valid {
		createdAt = &comp.CreatedAt.Time
	}

	var updatedAt *time.Time
	if comp.UpdatedAt.Valid {
		updatedAt = &comp.UpdatedAt.Time
	}

	return &model.CompoundResponse{
		ID:              comp.ID.String(),
		Name:            comp.Name,
		NameI18n:        nameI18nStr,
		Description:     comp.Description,
		DescriptionI18n: descriptionI18nStr,
		Quantity:        quantityInt64,
		Measurement:     measurementStr,
		Price:           priceStr,
		DepartmentID:    deptIDStr,
		CreatedAt:       createdAt,
		UpdatedAt:       updatedAt,
	}
}

// ==================== COMPOUND DETAILS ====================

// CreateCompoundDetail creates a new compound detail
func (c *CompoundS) CreateCompoundDetail(ctx context.Context, compoundID, ingredientID string, quantity int64) (*model.CompoundDetailResponse, error) {
	id := uuid.New()
	compID, err := uuid.Parse(compoundID)
	if err != nil {
		return nil, fmt.Errorf("invalid compound ID: %w", err)
	}

	ingID, err := uuid.Parse(ingredientID)
	if err != nil {
		return nil, fmt.Errorf("invalid ingredient ID: %w", err)
	}

	detail, err := c.repo.PgRepo.Repo.CreateCompoundDetail(ctx, pg.CreateCompoundDetailParams{
		ID:           id,
		CompoundID:   compID,
		IngredientID: ingID,
		Quantity:     quantity,
	})
	if err != nil {
		log.Printf("CreateCompoundDetail failed: %v", err)
		return nil, fmt.Errorf("failed to create compound detail: %w", err)
	}

	return toCompoundDetailResponse(detail), nil
}

// GetCompoundDetailByID retrieves a compound detail by ID
func (c *CompoundS) GetCompoundDetailByID(ctx context.Context, detailID string) (*model.CompoundDetailResponse, error) {
	id, err := uuid.Parse(detailID)
	if err != nil {
		return nil, fmt.Errorf("invalid detail ID: %w", err)
	}

	detail, err := c.repo.PgRepo.Repo.GetCompoundDetailByID(ctx, id)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, fmt.Errorf("compound detail not found")
		}
		log.Printf("GetCompoundDetailByID failed: %v", err)
		return nil, fmt.Errorf("failed to retrieve compound detail: %w", err)
	}

	return toCompoundDetailResponse(detail), nil
}

// GetCompoundDetailsByCompoundID retrieves all details for a compound
func (c *CompoundS) GetCompoundDetailsByCompoundID(ctx context.Context, compoundID string) ([]*model.CompoundDetailResponse, error) {
	id, err := uuid.Parse(compoundID)
	if err != nil {
		return nil, fmt.Errorf("invalid compound ID: %w", err)
	}

	details, err := c.repo.PgRepo.Repo.GetCompoundDetailsByCompoundID(ctx, id)
	if err != nil {
		log.Printf("GetCompoundDetailsByCompoundID failed: %v", err)
		return nil, fmt.Errorf("failed to retrieve compound details: %w", err)
	}

	var responses []*model.CompoundDetailResponse
	for _, detail := range details {
		responses = append(responses, toCompoundDetailResponse(detail))
	}
	return responses, nil
}

// GetCompoundDetailsByIngredientID retrieves all compound details for an ingredient
func (c *CompoundS) GetCompoundDetailsByIngredientID(ctx context.Context, ingredientID string, limit, offset int32) ([]*model.CompoundDetailResponse, error) {
	id, err := uuid.Parse(ingredientID)
	if err != nil {
		return nil, fmt.Errorf("invalid ingredient ID: %w", err)
	}

	details, err := c.repo.PgRepo.Repo.GetCompoundDetailsByIngredientID(ctx, pg.GetCompoundDetailsByIngredientIDParams{
		IngredientID: id,
		Limit:        limit,
		Offset:       offset,
	})
	if err != nil {
		log.Printf("GetCompoundDetailsByIngredientID failed: %v", err)
		return nil, fmt.Errorf("failed to retrieve compound details: %w", err)
	}

	var responses []*model.CompoundDetailResponse
	for _, detail := range details {
		responses = append(responses, toCompoundDetailResponse(detail))
	}
	return responses, nil
}

// UpdateCompoundDetail updates a compound detail
func (c *CompoundS) UpdateCompoundDetail(ctx context.Context, detailID string, compoundID, ingredientID *string, quantity *int64) (*model.CompoundDetailResponse, error) {
	id, err := uuid.Parse(detailID)
	if err != nil {
		return nil, fmt.Errorf("invalid detail ID: %w", err)
	}

	// Get existing detail
	existing, err := c.repo.PgRepo.Repo.GetCompoundDetailByID(ctx, id)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, fmt.Errorf("compound detail not found")
		}
		return nil, fmt.Errorf("failed to get compound detail: %w", err)
	}

	finalCompoundID := existing.CompoundID
	if compoundID != nil && *compoundID != "" {
		cid, err := uuid.Parse(*compoundID)
		if err != nil {
			return nil, fmt.Errorf("invalid compound ID: %w", err)
		}
		finalCompoundID = cid
	}

	finalIngredientID := existing.IngredientID
	if ingredientID != nil && *ingredientID != "" {
		iid, err := uuid.Parse(*ingredientID)
		if err != nil {
			return nil, fmt.Errorf("invalid ingredient ID: %w", err)
		}
		finalIngredientID = iid
	}

	finalQuantity := existing.Quantity
	if quantity != nil {
		finalQuantity = *quantity
	}

	detail, err := c.repo.PgRepo.Repo.UpdateCompoundDetail(ctx, pg.UpdateCompoundDetailParams{
		ID:           id,
		CompoundID:   finalCompoundID,
		IngredientID: finalIngredientID,
		Quantity:     finalQuantity,
	})
	if err != nil {
		log.Printf("UpdateCompoundDetail failed: %v", err)
		return nil, fmt.Errorf("failed to update compound detail: %w", err)
	}

	return toCompoundDetailResponse(detail), nil
}

// DeleteCompoundDetail deletes a compound detail
func (c *CompoundS) DeleteCompoundDetail(ctx context.Context, detailID string) error {
	id, err := uuid.Parse(detailID)
	if err != nil {
		return fmt.Errorf("invalid detail ID: %w", err)
	}

	if err := c.repo.PgRepo.Repo.DeleteCompoundDetail(ctx, id); err != nil {
		log.Printf("DeleteCompoundDetail failed: %v", err)
		return fmt.Errorf("failed to delete compound detail: %w", err)
	}
	return nil
}

// RestoreCompoundDetail restores a deleted compound detail
func (c *CompoundS) RestoreCompoundDetail(ctx context.Context, detailID string) (*model.CompoundDetailResponse, error) {
	id, err := uuid.Parse(detailID)
	if err != nil {
		return nil, fmt.Errorf("invalid detail ID: %w", err)
	}

	if err := c.repo.PgRepo.Repo.RestoreCompoundDetail(ctx, id); err != nil {
		log.Printf("RestoreCompoundDetail failed: %v", err)
		return nil, fmt.Errorf("failed to restore compound detail: %w", err)
	}

	return c.GetCompoundDetailByID(ctx, detailID)
}

// ==================== COMPOUND STOCK ====================

// CreateCompoundStock creates a new compound stock entry
func (c *CompoundS) CreateCompoundStock(ctx context.Context, compoundID, branchID string, quantity int64) (*model.CompoundStockResponse, error) {
	id := uuid.New()
	compID, err := uuid.Parse(compoundID)
	if err != nil {
		return nil, fmt.Errorf("invalid compound ID: %w", err)
	}

	bID, err := uuid.Parse(branchID)
	if err != nil {
		return nil, fmt.Errorf("invalid branch ID: %w", err)
	}

	stock, err := c.repo.PgRepo.Repo.CreateCompoundStock(ctx, pg.CreateCompoundStockParams{
		ID:         id,
		CompoundID: compID,
		Quantity:   quantity,
		BranchID:   bID,
	})
	if err != nil {
		log.Printf("CreateCompoundStock failed: %v", err)
		return nil, fmt.Errorf("failed to create compound stock: %w", err)
	}

	return toCompoundStockResponse(stock), nil
}

// GetCompoundStockByID retrieves compound stock by ID
func (c *CompoundS) GetCompoundStockByID(ctx context.Context, stockID string) (*model.CompoundStockResponse, error) {
	id, err := uuid.Parse(stockID)
	if err != nil {
		return nil, fmt.Errorf("invalid stock ID: %w", err)
	}

	stock, err := c.repo.PgRepo.Repo.GetCompoundStockByID(ctx, id)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, fmt.Errorf("compound stock not found")
		}
		log.Printf("GetCompoundStockByID failed: %v", err)
		return nil, fmt.Errorf("failed to retrieve compound stock: %w", err)
	}

	return toCompoundStockResponse(stock), nil
}

// GetStockByCompoundAndBranch retrieves stock for a specific compound and branch
func (c *CompoundS) GetStockByCompoundAndBranch(ctx context.Context, compoundID, branchID string) (*model.CompoundStockResponse, error) {
	compID, err := uuid.Parse(compoundID)
	if err != nil {
		return nil, fmt.Errorf("invalid compound ID: %w", err)
	}

	bID, err := uuid.Parse(branchID)
	if err != nil {
		return nil, fmt.Errorf("invalid branch ID: %w", err)
	}

	stock, err := c.repo.PgRepo.Repo.GetStockByCompoundAndBranch(ctx, pg.GetStockByCompoundAndBranchParams{
		CompoundID: compID,
		BranchID:   bID,
	})
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, fmt.Errorf("compound stock not found")
		}
		log.Printf("GetStockByCompoundAndBranch failed: %v", err)
		return nil, fmt.Errorf("failed to retrieve compound stock: %w", err)
	}

	return toCompoundStockResponse(stock), nil
}

// GetAllCompoundStock retrieves all compound stocks with pagination
func (c *CompoundS) GetAllCompoundStock(ctx context.Context, limit, offset int32) ([]*model.CompoundStockResponse, error) {
	stocks, err := c.repo.PgRepo.Repo.GetAllCompoundStock(ctx, pg.GetAllCompoundStockParams{
		Limit:  limit,
		Offset: offset,
	})
	if err != nil {
		log.Printf("GetAllCompoundStock failed: %v", err)
		return nil, fmt.Errorf("failed to retrieve compound stocks: %w", err)
	}

	var responses []*model.CompoundStockResponse
	for _, stock := range stocks {
		responses = append(responses, toCompoundStockResponse(stock))
	}
	return responses, nil
}

// GetCompoundStockByBranchID retrieves all compound stocks for a branch
func (c *CompoundS) GetCompoundStockByBranchID(ctx context.Context, branchID string, limit, offset int32) ([]*model.CompoundStockResponse, error) {
	bID, err := uuid.Parse(branchID)
	if err != nil {
		return nil, fmt.Errorf("invalid branch ID: %w", err)
	}

	stocks, err := c.repo.PgRepo.Repo.GetCompoundStockByBranchID(ctx, pg.GetCompoundStockByBranchIDParams{
		BranchID: bID,
		Limit:    limit,
		Offset:   offset,
	})
	if err != nil {
		log.Printf("GetCompoundStockByBranchID failed: %v", err)
		return nil, fmt.Errorf("failed to retrieve compound stocks: %w", err)
	}

	var responses []*model.CompoundStockResponse
	for _, stock := range stocks {
		responses = append(responses, toCompoundStockResponse(stock))
	}
	return responses, nil
}

// GetCompoundStockByCompoundID retrieves all stock entries for a compound
func (c *CompoundS) GetCompoundStockByCompoundID(ctx context.Context, compoundID string, limit, offset int32) ([]*model.CompoundStockResponse, error) {
	compID, err := uuid.Parse(compoundID)
	if err != nil {
		return nil, fmt.Errorf("invalid compound ID: %w", err)
	}

	stocks, err := c.repo.PgRepo.Repo.GetCompoundStockByCompoundID(ctx, pg.GetCompoundStockByCompoundIDParams{
		CompoundID: compID,
		Limit:      limit,
		Offset:     offset,
	})
	if err != nil {
		log.Printf("GetCompoundStockByCompoundID failed: %v", err)
		return nil, fmt.Errorf("failed to retrieve compound stocks: %w", err)
	}

	var responses []*model.CompoundStockResponse
	for _, stock := range stocks {
		responses = append(responses, toCompoundStockResponse(stock))
	}
	return responses, nil
}

// UpdateCompoundStock updates compound stock quantity
func (c *CompoundS) UpdateCompoundStock(ctx context.Context, stockID string, quantity int64) (*model.CompoundStockResponse, error) {
	id, err := uuid.Parse(stockID)
	if err != nil {
		return nil, fmt.Errorf("invalid stock ID: %w", err)
	}

	stock, err := c.repo.PgRepo.Repo.UpdateCompoundStock(ctx, pg.UpdateCompoundStockParams{
		ID:       id,
		Quantity: quantity,
	})
	if err != nil {
		log.Printf("UpdateCompoundStock failed: %v", err)
		return nil, fmt.Errorf("failed to update compound stock: %w", err)
	}

	return toCompoundStockResponse(stock), nil
}

// AddToCompoundStock adds quantity to compound stock
func (c *CompoundS) AddToCompoundStock(ctx context.Context, stockID string, quantity int64) (*model.CompoundStockResponse, error) {
	id, err := uuid.Parse(stockID)
	if err != nil {
		return nil, fmt.Errorf("invalid stock ID: %w", err)
	}

	stock, err := c.repo.PgRepo.Repo.AddToCompoundStock(ctx, pg.AddToCompoundStockParams{
		ID:       id,
		Quantity: quantity,
	})
	if err != nil {
		log.Printf("AddToCompoundStock failed: %v", err)
		return nil, fmt.Errorf("failed to add to compound stock: %w", err)
	}

	return toCompoundStockResponse(stock), nil
}

// RemoveFromCompoundStock removes quantity from compound stock
func (c *CompoundS) RemoveFromCompoundStock(ctx context.Context, stockID string, quantity int64) (*model.CompoundStockResponse, error) {
	id, err := uuid.Parse(stockID)
	if err != nil {
		return nil, fmt.Errorf("invalid stock ID: %w", err)
	}

	stock, err := c.repo.PgRepo.Repo.RemoveFromCompoundStock(ctx, pg.RemoveFromCompoundStockParams{
		ID:       id,
		Quantity: quantity,
	})
	if err != nil {
		log.Printf("RemoveFromCompoundStock failed: %v", err)
		return nil, fmt.Errorf("failed to remove from compound stock: %w", err)
	}

	return toCompoundStockResponse(stock), nil
}

// DeleteCompoundStock deletes compound stock
func (c *CompoundS) DeleteCompoundStock(ctx context.Context, stockID string) error {
	id, err := uuid.Parse(stockID)
	if err != nil {
		return fmt.Errorf("invalid stock ID: %w", err)
	}

	if err := c.repo.PgRepo.Repo.DeleteCompoundStock(ctx, id); err != nil {
		log.Printf("DeleteCompoundStock failed: %v", err)
		return fmt.Errorf("failed to delete compound stock: %w", err)
	}
	return nil
}

// RestoreCompoundStock restores deleted compound stock
func (c *CompoundS) RestoreCompoundStock(ctx context.Context, stockID string) (*model.CompoundStockResponse, error) {
	id, err := uuid.Parse(stockID)
	if err != nil {
		return nil, fmt.Errorf("invalid stock ID: %w", err)
	}

	if err := c.repo.PgRepo.Repo.RestoreCompoundStock(ctx, id); err != nil {
		log.Printf("RestoreCompoundStock failed: %v", err)
		return nil, fmt.Errorf("failed to restore compound stock: %w", err)
	}

	return c.GetCompoundStockByID(ctx, stockID)
}

// Helper function to convert database compound detail to response model
func toCompoundDetailResponse(detail pg.CompoundsDetail) *model.CompoundDetailResponse {
	var createdAt *time.Time
	if detail.CreatedAt.Valid {
		createdAt = &detail.CreatedAt.Time
	}

	var updatedAt *time.Time
	if detail.UpdatedAt.Valid {
		updatedAt = &detail.UpdatedAt.Time
	}

	return &model.CompoundDetailResponse{
		ID:           detail.ID.String(),
		CompoundID:   detail.CompoundID.String(),
		IngredientID: detail.IngredientID.String(),
		Quantity:     detail.Quantity,
		CreatedAt:    createdAt,
		UpdatedAt:    updatedAt,
	}
}

// Helper function to convert database compound stock to response model
func toCompoundStockResponse(stock pg.CompoundStock) *model.CompoundStockResponse {
	var createdAt *time.Time
	if stock.CreatedAt.Valid {
		createdAt = &stock.CreatedAt.Time
	}

	var updatedAt *time.Time
	if stock.UpdatedAt.Valid {
		updatedAt = &stock.UpdatedAt.Time
	}

	return &model.CompoundStockResponse{
		ID:         stock.ID.String(),
		CompoundID: stock.CompoundID.String(),
		Quantity:   stock.Quantity,
		BranchID:   stock.BranchID.String(),
		CreatedAt:  createdAt,
		UpdatedAt:  updatedAt,
	}
}
