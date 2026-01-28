package service

import (
	"context"
	"fmt"
	"log"
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

// Compound row fields for converting different row types to response
// Note: Compounds don't have cost_price, profit, profit_margin - they're intermediate products
type compoundRowFields struct {
	ID              uuid.UUID
	Name            string
	NameI18n        pgtype.UUID
	Description     *string
	DescriptionI18n pgtype.UUID
	Quantity        *int32
	Measurement     pg.NullMeasurementType
	Price           pgtype.Numeric
	DepartmentID    pgtype.UUID
	PictureUrl      *string
	ColorCode       *string
	CreatedAt       pgtype.Timestamptz
	UpdatedAt       pgtype.Timestamptz
}

// Helper function to convert any compound row type to response
func compoundToResponseAny(row any) *model.CompoundResponse {
	var f compoundRowFields

	switch v := row.(type) {
	case pg.Compound:
		f = compoundRowFields{
			ID: v.ID, Name: v.Name, NameI18n: v.NameI18n, Description: v.Description,
			DescriptionI18n: v.DescriptionI18n, Quantity: v.Quantity, Measurement: v.Measurement,
			Price: v.Price, DepartmentID: v.DepartmentID, PictureUrl: v.PictureUrl, ColorCode: v.ColorCode,
			CreatedAt: v.CreatedAt, UpdatedAt: v.UpdatedAt,
		}
	default:
		return nil
	}

	qty := int64(0)
	if f.Quantity != nil {
		qty = int64(*f.Quantity)
	}

	return &model.CompoundResponse{
		ID:              f.ID.String(),
		Name:            f.Name,
		NameI18n:        uuidToStr(f.NameI18n),
		Description:     f.Description,
		DescriptionI18n: uuidToStr(f.DescriptionI18n),
		Quantity:        qty,
		Measurement:     toMeasurementString(f.Measurement),
		Price:           toPriceString(f.Price),
		DepartmentID:    uuidToStr(f.DepartmentID),
		PictureUrl:      f.PictureUrl,
		ColorCode:       f.ColorCode,
		CreatedAt:       timestampToTime(f.CreatedAt),
		UpdatedAt:       timestampToTime(f.UpdatedAt),
	}
}

// Helper functions to convert measurement and price types
func toMeasurementString(measurement pg.NullMeasurementType) *string {
	if measurement.Valid {
		str := string(measurement.MeasurementType)
		return &str
	}
	return nil
}

func toPriceString(price pgtype.Numeric) *string {
	if price.Valid {
		// Convert to Decimal string representation
		if price.NaN {
			str := "NaN"
			return &str
		}
		if price.InfinityModifier > 0 {
			str := "Infinity"
			return &str
		}
		if price.InfinityModifier < 0 {
			str := "-Infinity"
			return &str
		}

		// If Int is nil, return 0
		if price.Int == nil {
			str := "0"
			return &str
		}

		// Apply exponent to format the number
		str := price.Int.String()
		if price.Exp < 0 {
			// Need to add decimal point
			exp := -int(price.Exp)
			if exp >= len(str) {
				// Add leading zeros and decimal
				str = "0." + strings.Repeat("0", exp-len(str)) + str
			} else {
				// Insert decimal point
				str = str[:len(str)-exp] + "." + str[len(str)-exp:]
			}
		} else if price.Exp > 0 {
			// Add trailing zeros
			str = str + strings.Repeat("0", int(price.Exp))
		}

		return &str
	}
	return nil
}

type CompoundS struct {
	repo *repository.Repository
}

func NewCompoundS(repo *repository.Repository) *CompoundS {
	return &CompoundS{repo: repo}
}

func (c *CompoundS) CreateCompound(ctx context.Context, name string, nameI18n, description, descriptionI18n, measurement, departmentID *string, quantity int32, price *string, pictureUrl *string, colorCode *string) (*model.CompoundResponse, error) {
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

	compound, err := c.repo.Tenant(ctx).CreateCompound(ctx, pg.CreateCompoundParams{
		ID:              id,
		Name:            name,
		NameI18n:        nameI18nUUID,
		Description:     description,
		DescriptionI18n: descriptionI18nUUID,
		Quantity:        &quantity,
		Measurement:     measurementType,
		Price:           numPrice,
		DepartmentID:    deptID,
		PictureUrl:      pictureUrl,
		ColorCode:       colorCode,
	})
	if err != nil {
		log.Printf("CreateCompound failed: %v", err)
		return nil, fmt.Errorf("failed to create compound: %w", err)
	}

	return compoundToResponseAny(compound), nil
}

func (c *CompoundS) GetCompoundByID(ctx context.Context, compoundID string) (*model.CompoundResponse, error) {
	id, err := uuid.Parse(compoundID)
	if err != nil {
		return nil, fmt.Errorf("invalid compound ID: %w", err)
	}

	compound, err := c.repo.Tenant(ctx).GetCompoundByID(ctx, id)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, fmt.Errorf("compound not found")
		}
		log.Printf("GetCompoundByID failed: %v", err)
		return nil, fmt.Errorf("failed to retrieve compound: %w", err)
	}

	return compoundToResponseAny(compound), nil
}

func (c *CompoundS) GetAllCompounds(ctx context.Context, limit, offset int32) ([]*model.CompoundResponse, error) {
	compounds, err := c.repo.Tenant(ctx).GetAllCompounds(ctx, pg.GetAllCompoundsParams{
		Limit:  limit,
		Offset: offset,
	})
	if err != nil {
		log.Printf("GetAllCompounds failed: %v", err)
		return nil, fmt.Errorf("failed to retrieve compounds: %w", err)
	}

	var responses []*model.CompoundResponse
	for _, comp := range compounds {
		responses = append(responses, compoundToResponseAny(comp))
	}
	return responses, nil
}

func (c *CompoundS) GetCompoundsByDepartmentID(ctx context.Context, departmentID string, limit, offset int32) ([]*model.CompoundResponse, error) {
	id, err := uuid.Parse(departmentID)
	if err != nil {
		return nil, fmt.Errorf("invalid department ID: %w", err)
	}

	compounds, err := c.repo.Tenant(ctx).GetCompoundsByDepartmentID(ctx, pg.GetCompoundsByDepartmentIDParams{
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
		responses = append(responses, compoundToResponseAny(comp))
	}
	return responses, nil
}

func (c *CompoundS) UpdateCompound(ctx context.Context, compoundID string, name, nameI18n, description, descriptionI18n, measurement, departmentID *string, quantity *int32, price *string, pictureUrl *string, colorCode *string) (*model.CompoundResponse, error) {
	id, err := uuid.Parse(compoundID)
	if err != nil {
		return nil, fmt.Errorf("invalid compound ID: %w", err)
	}

	existing, err := c.repo.Tenant(ctx).GetCompoundByID(ctx, id)
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

	finalPictureUrl := existing.PictureUrl
	if pictureUrl != nil {
		finalPictureUrl = pictureUrl
	}

	finalColorCode := existing.ColorCode
	if colorCode != nil {
		finalColorCode = colorCode
	}

	compound, err := c.repo.Tenant(ctx).UpdateCompound(ctx, pg.UpdateCompoundParams{
		ID:              id,
		Name:            finalName,
		NameI18n:        finalNameI18n,
		Description:     finalDescription,
		DescriptionI18n: finalDescriptionI18n,
		Quantity:        finalQuantity,
		Measurement:     finalMeasurement,
		Price:           finalPrice,
		DepartmentID:    finalDeptID,
		PictureUrl:      finalPictureUrl,
		ColorCode:       finalColorCode,
	})
	if err != nil {
		log.Printf("UpdateCompound failed: %v", err)
		return nil, fmt.Errorf("failed to update compound: %w", err)
	}

	return compoundToResponseAny(compound), nil
}

// DeleteCompound soft deletes a compound
func (c *CompoundS) DeleteCompound(ctx context.Context, compoundID string) error {
	id, err := uuid.Parse(compoundID)
	if err != nil {
		return fmt.Errorf("invalid compound ID: %w", err)
	}

	if err := c.repo.Tenant(ctx).DeleteCompound(ctx, id); err != nil {
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

	if err := c.repo.Tenant(ctx).RestoreCompound(ctx, id); err != nil {
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

	compounds, err := c.repo.Tenant(ctx).SearchCompounds(ctx, pg.SearchCompoundsParams{
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
		responses = append(responses, compoundToResponseAny(comp))
	}
	return responses, nil
}

// Helper function to convert database compound to response model

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

	detail, err := c.repo.Tenant(ctx).CreateCompoundDetail(ctx, pg.CreateCompoundDetailParams{
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

func (c *CompoundS) GetCompoundDetailByID(ctx context.Context, detailID string) (*model.CompoundDetailResponse, error) {
	id, err := uuid.Parse(detailID)
	if err != nil {
		return nil, fmt.Errorf("invalid detail ID: %w", err)
	}

	detail, err := c.repo.Tenant(ctx).GetCompoundDetailByID(ctx, id)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, fmt.Errorf("compound detail not found")
		}
		log.Printf("GetCompoundDetailByID failed: %v", err)
		return nil, fmt.Errorf("failed to retrieve compound detail: %w", err)
	}

	return toCompoundDetailResponse(detail), nil
}

func (c *CompoundS) GetCompoundDetailsByCompoundID(ctx context.Context, compoundID string) ([]*model.CompoundDetailResponse, error) {
	id, err := uuid.Parse(compoundID)
	if err != nil {
		return nil, fmt.Errorf("invalid compound ID: %w", err)
	}

	details, err := c.repo.Tenant(ctx).GetCompoundDetailsByCompoundID(ctx, id)
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

func (c *CompoundS) GetCompoundDetailsByIngredientID(ctx context.Context, ingredientID string, limit, offset int32) ([]*model.CompoundDetailResponse, error) {
	id, err := uuid.Parse(ingredientID)
	if err != nil {
		return nil, fmt.Errorf("invalid ingredient ID: %w", err)
	}

	details, err := c.repo.Tenant(ctx).GetCompoundDetailsByIngredientID(ctx, pg.GetCompoundDetailsByIngredientIDParams{
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

func (c *CompoundS) UpdateCompoundDetail(ctx context.Context, detailID string, compoundID, ingredientID *string, quantity *int64) (*model.CompoundDetailResponse, error) {
	id, err := uuid.Parse(detailID)
	if err != nil {
		return nil, fmt.Errorf("invalid detail ID: %w", err)
	}

	existing, err := c.repo.Tenant(ctx).GetCompoundDetailByID(ctx, id)
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

	detail, err := c.repo.Tenant(ctx).UpdateCompoundDetail(ctx, pg.UpdateCompoundDetailParams{
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

	if err := c.repo.Tenant(ctx).DeleteCompoundDetail(ctx, id); err != nil {
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

	if err := c.repo.Tenant(ctx).RestoreCompoundDetail(ctx, id); err != nil {
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

	stock, err := c.repo.Tenant(ctx).CreateCompoundStock(ctx, pg.CreateCompoundStockParams{
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

	stock, err := c.repo.Tenant(ctx).GetCompoundStockByID(ctx, id)
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

	stock, err := c.repo.Tenant(ctx).GetStockByCompoundAndBranch(ctx, pg.GetStockByCompoundAndBranchParams{
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
	stocks, err := c.repo.Tenant(ctx).GetAllCompoundStock(ctx, pg.GetAllCompoundStockParams{
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

	stocks, err := c.repo.Tenant(ctx).GetCompoundStockByBranchID(ctx, pg.GetCompoundStockByBranchIDParams{
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

	stocks, err := c.repo.Tenant(ctx).GetCompoundStockByCompoundID(ctx, pg.GetCompoundStockByCompoundIDParams{
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

	stock, err := c.repo.Tenant(ctx).UpdateCompoundStock(ctx, pg.UpdateCompoundStockParams{
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

	stock, err := c.repo.Tenant(ctx).AddToCompoundStock(ctx, pg.AddToCompoundStockParams{
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

	stock, err := c.repo.Tenant(ctx).RemoveFromCompoundStock(ctx, pg.RemoveFromCompoundStockParams{
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

	if err := c.repo.Tenant(ctx).DeleteCompoundStock(ctx, id); err != nil {
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

	if err := c.repo.Tenant(ctx).RestoreCompoundStock(ctx, id); err != nil {
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

// RecalculateCompoundPrice manually recalculates the price of a compound based on its ingredient calculations
func (c *CompoundS) RecalculateCompoundPrice(ctx context.Context, compoundID string) (*model.CompoundResponse, error) {
	id, err := uuid.Parse(compoundID)
	if err != nil {
		return nil, fmt.Errorf("invalid compound_id: %w", err)
	}

	// Get all ingredient calculations for this compound (excluding compound-to-compound)
	calculations, err := c.repo.Tenant(ctx).GetCalculationsByCompoundID(ctx, pgtype.UUID{Bytes: id, Valid: true})
	if err != nil && err != pgx.ErrNoRows {
		log.Printf("RecalculateCompoundPrice: failed to fetch calculations: %v", err)
		return nil, fmt.Errorf("failed to fetch calculations: %w", err)
	}

	// Sum all total_cost values from calculations with ingredient_id (not compound_id components)
	totalPrice := 0.0
	log.Printf("RecalculateCompoundPrice: Found %d calculations", len(calculations))
	if calculations != nil {
		for _, calc := range calculations {
			log.Printf("RecalculateCompoundPrice: Calc ID=%s, IngredientID=%s, TotalCost=%v", calc.ID, calc.IngredientID, calc.TotalCost)
			// Only sum if it's an ingredient calculation (ingredient_id is not nil/empty)
			if calc.IngredientID.Valid {
				// Convert pgtype.Numeric to float
				costStr := numericToStr(calc.TotalCost)
				log.Printf("RecalculateCompoundPrice: Adding cost %s (from %v)", costStr, calc.TotalCost)
				if costFloat, err := strconv.ParseFloat(costStr, 64); err == nil {
					totalPrice += costFloat
				} else {
					log.Printf("RecalculateCompoundPrice: Error parsing cost: %v", err)
				}
			}
		}
	}

	log.Printf("RecalculateCompoundPrice: Total price calculated = %.2f", totalPrice)

	// Update the compound price
	updateParams := pg.UpdateCompoundParams{
		ID:    id,
		Price: stringToNumeric(fmt.Sprintf("%.2f", totalPrice)),
	}

	updated, err := c.repo.Tenant(ctx).UpdateCompound(ctx, updateParams)
	if err != nil {
		log.Printf("RecalculateCompoundPrice: failed to update compound: %v", err)
		return nil, fmt.Errorf("failed to update compound: %w", err)
	}

	return compoundToResponseAny(updated), nil
}

// GetCompoundByIDWithLang retrieves compound by ID with language support
func (c *CompoundS) GetCompoundByIDWithLang(ctx context.Context, compoundID string, lang string) (*model.CompoundResponse, error) {
	id, err := uuid.Parse(compoundID)
	if err != nil {
		return nil, fmt.Errorf("invalid compound ID: %w", err)
	}

	compound, err := c.repo.Tenant(ctx).GetCompoundByIDWithLanguage(ctx, pg.GetCompoundByIDWithLanguageParams{
		ID:      id,
		Column2: lang,
	})
	if err != nil {
		log.Printf("GetCompoundByIDWithLang failed: %v", err)
		return nil, fmt.Errorf("failed to get compound: %w", err)
	}

	return compoundToResponseAny(compound), nil
}

// GetAllCompoundsWithLang retrieves all compounds with language support
func (c *CompoundS) GetAllCompoundsWithLang(ctx context.Context, lang string, limit, offset int32) ([]*model.CompoundResponse, error) {
	compounds, err := c.repo.Tenant(ctx).GetAllCompoundsWithLanguage(ctx, pg.GetAllCompoundsWithLanguageParams{
		Column1: lang,
		Limit:   limit,
		Offset:  offset,
	})
	if err != nil {
		log.Printf("GetAllCompoundsWithLang failed: %v", err)
		return nil, fmt.Errorf("failed to get compounds: %w", err)
	}

	var responses []*model.CompoundResponse
	for _, compound := range compounds {
		responses = append(responses, compoundToResponseAny(compound))
	}
	return responses, nil
}
