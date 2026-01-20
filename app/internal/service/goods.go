package service

import (
	"context"
	"fmt"
	"log"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"gitlab.yurtal.tech/company/maryai/back/internal/model"
	"gitlab.yurtal.tech/company/maryai/back/internal/repository"
	pg "gitlab.yurtal.tech/company/maryai/back/internal/repository/pg/tenantsdb"
)

// Good row fields interface for converting different row types to response
type goodRowFields struct {
	ID              uuid.UUID
	Name            string
	Description     *string
	NameI18n        pgtype.UUID
	DescriptionI18n pgtype.UUID
	CategoryID      pgtype.UUID
	DepartmentID    pgtype.UUID
	Price           pgtype.Numeric
	CookTime        *int32
	PictureUrl      *string
	ColorCode       *string
	CostPrice       pgtype.Numeric
	Profit          pgtype.Numeric
	ProfitMargin    pgtype.Numeric
	CreatedAt       pgtype.Timestamptz
	UpdatedAt       pgtype.Timestamptz
}

// Helper function to convert any good row type to response
func goodToResponseAny(row any) *model.GoodResponse {
	var f goodRowFields

	switch v := row.(type) {
	case pg.Good:
		f = goodRowFields{
			ID: v.ID, Name: v.Name, Description: v.Description, NameI18n: v.NameI18n,
			DescriptionI18n: v.DescriptionI18n, CategoryID: v.CategoryID, DepartmentID: v.DepartmentID,
			Price: v.Price, CookTime: v.CookTime, PictureUrl: v.PictureUrl, ColorCode: v.ColorCode,
			CostPrice: v.CostPrice, Profit: v.Profit, ProfitMargin: v.ProfitMargin,
			CreatedAt: v.CreatedAt, UpdatedAt: v.UpdatedAt,
		}
	case pg.CreateGoodRow:
		f = goodRowFields{
			ID: v.ID, Name: v.Name, Description: v.Description, NameI18n: v.NameI18n,
			DescriptionI18n: v.DescriptionI18n, CategoryID: v.CategoryID, DepartmentID: v.DepartmentID,
			Price: v.Price, CookTime: v.CookTime, PictureUrl: v.PictureUrl, ColorCode: v.ColorCode,
			CostPrice: v.CostPrice, Profit: v.Profit, ProfitMargin: v.ProfitMargin,
			CreatedAt: v.CreatedAt, UpdatedAt: v.UpdatedAt,
		}
	case pg.GetGoodByIDRow:
		f = goodRowFields{
			ID: v.ID, Name: v.Name, Description: v.Description, NameI18n: v.NameI18n,
			DescriptionI18n: v.DescriptionI18n, CategoryID: v.CategoryID, DepartmentID: v.DepartmentID,
			Price: v.Price, CookTime: v.CookTime, PictureUrl: v.PictureUrl, ColorCode: v.ColorCode,
			CostPrice: v.CostPrice, Profit: v.Profit, ProfitMargin: v.ProfitMargin,
			CreatedAt: v.CreatedAt, UpdatedAt: v.UpdatedAt,
		}
	case pg.GetAllGoodsRow:
		f = goodRowFields{
			ID: v.ID, Name: v.Name, Description: v.Description, NameI18n: v.NameI18n,
			DescriptionI18n: v.DescriptionI18n, CategoryID: v.CategoryID, DepartmentID: v.DepartmentID,
			Price: v.Price, CookTime: v.CookTime, PictureUrl: v.PictureUrl, ColorCode: v.ColorCode,
			CostPrice: v.CostPrice, Profit: v.Profit, ProfitMargin: v.ProfitMargin,
			CreatedAt: v.CreatedAt, UpdatedAt: v.UpdatedAt,
		}
	case pg.GetGoodsByCategoryIDRow:
		f = goodRowFields{
			ID: v.ID, Name: v.Name, Description: v.Description, NameI18n: v.NameI18n,
			DescriptionI18n: v.DescriptionI18n, CategoryID: v.CategoryID, DepartmentID: v.DepartmentID,
			Price: v.Price, CookTime: v.CookTime, PictureUrl: v.PictureUrl, ColorCode: v.ColorCode,
			CostPrice: v.CostPrice, Profit: v.Profit, ProfitMargin: v.ProfitMargin,
			CreatedAt: v.CreatedAt, UpdatedAt: v.UpdatedAt,
		}
	case pg.GetGoodsByDepartmentIDRow:
		f = goodRowFields{
			ID: v.ID, Name: v.Name, Description: v.Description, NameI18n: v.NameI18n,
			DescriptionI18n: v.DescriptionI18n, CategoryID: v.CategoryID, DepartmentID: v.DepartmentID,
			Price: v.Price, CookTime: v.CookTime, PictureUrl: v.PictureUrl, ColorCode: v.ColorCode,
			CostPrice: v.CostPrice, Profit: v.Profit, ProfitMargin: v.ProfitMargin,
			CreatedAt: v.CreatedAt, UpdatedAt: v.UpdatedAt,
		}
	case pg.GetGoodsByPriceRangeRow:
		f = goodRowFields{
			ID: v.ID, Name: v.Name, Description: v.Description, NameI18n: v.NameI18n,
			DescriptionI18n: v.DescriptionI18n, CategoryID: v.CategoryID, DepartmentID: v.DepartmentID,
			Price: v.Price, CookTime: v.CookTime, PictureUrl: v.PictureUrl, ColorCode: v.ColorCode,
			CostPrice: v.CostPrice, Profit: v.Profit, ProfitMargin: v.ProfitMargin,
			CreatedAt: v.CreatedAt, UpdatedAt: v.UpdatedAt,
		}
	case pg.UpdateGoodRow:
		f = goodRowFields{
			ID: v.ID, Name: v.Name, Description: v.Description, NameI18n: v.NameI18n,
			DescriptionI18n: v.DescriptionI18n, CategoryID: v.CategoryID, DepartmentID: v.DepartmentID,
			Price: v.Price, CookTime: v.CookTime, PictureUrl: v.PictureUrl, ColorCode: v.ColorCode,
			CostPrice: v.CostPrice, Profit: v.Profit, ProfitMargin: v.ProfitMargin,
			CreatedAt: v.CreatedAt, UpdatedAt: v.UpdatedAt,
		}
	case pg.UpdateGoodPriceRow:
		f = goodRowFields{
			ID: v.ID, Name: v.Name, Description: v.Description, NameI18n: v.NameI18n,
			DescriptionI18n: v.DescriptionI18n, CategoryID: v.CategoryID, DepartmentID: v.DepartmentID,
			Price: v.Price, CookTime: v.CookTime, PictureUrl: v.PictureUrl, ColorCode: v.ColorCode,
			CostPrice: v.CostPrice, Profit: v.Profit, ProfitMargin: v.ProfitMargin,
			CreatedAt: v.CreatedAt, UpdatedAt: v.UpdatedAt,
		}
	case pg.UpdateGoodCostFieldsRow:
		f = goodRowFields{
			ID: v.ID, Name: v.Name, Description: v.Description, NameI18n: v.NameI18n,
			DescriptionI18n: v.DescriptionI18n, CategoryID: v.CategoryID, DepartmentID: v.DepartmentID,
			Price: v.Price, CookTime: v.CookTime, PictureUrl: v.PictureUrl, ColorCode: v.ColorCode,
			CostPrice: v.CostPrice, Profit: v.Profit, ProfitMargin: v.ProfitMargin,
			CreatedAt: v.CreatedAt, UpdatedAt: v.UpdatedAt,
		}
	case pg.SearchGoodsRow:
		f = goodRowFields{
			ID: v.ID, Name: v.Name, Description: v.Description, NameI18n: v.NameI18n,
			DescriptionI18n: v.DescriptionI18n, CategoryID: v.CategoryID, DepartmentID: v.DepartmentID,
			Price: v.Price, CookTime: v.CookTime, PictureUrl: v.PictureUrl,
			CostPrice: v.CostPrice, Profit: v.Profit, ProfitMargin: v.ProfitMargin,
			CreatedAt: v.CreatedAt, UpdatedAt: v.UpdatedAt,
		}
	default:
		return nil
	}

	return &model.GoodResponse{
		ID:              f.ID.String(),
		Name:            f.Name,
		Description:     f.Description,
		NameI18n:        uuidToStr(f.NameI18n),
		DescriptionI18n: uuidToStr(f.DescriptionI18n),
		CategoryID:      uuidToStr(f.CategoryID),
		DepartmentID:    uuidToStr(f.DepartmentID),
		Price:           numericToStringGoods(f.Price),
		CookTime:        f.CookTime,
		PictureUrl:      f.PictureUrl,
		ColorCode:       f.ColorCode,
		CostPrice:       numericToStringGoods(f.CostPrice),
		Profit:          numericToStringGoods(f.Profit),
		ProfitMargin:    numericToStringGoods(f.ProfitMargin),
		CreatedAt:       timestampToTime(f.CreatedAt),
		UpdatedAt:       timestampToTime(f.UpdatedAt),
	}
}

type GoodsS struct {
	repo *repository.Repository
}

func NewGoodsS(repo *repository.Repository) *GoodsS {
	return &GoodsS{repo: repo}
}

// CreateGood creates a new good/menu item
func (g *GoodsS) CreateGood(ctx context.Context, name string, description *string, nameI18n, descriptionI18n, categoryID, departmentID *string, price string, cookTime *int32, pictureUrl *string, colorCode *string) (*model.GoodResponse, error) {
	if name == "" {
		return nil, fmt.Errorf("good name is required")
	}
	if price == "" {
		return nil, fmt.Errorf("price is required")
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

	categoryUUID := pgtype.UUID{}
	if categoryID != nil && *categoryID != "" {
		cID, err := uuid.Parse(*categoryID)
		if err != nil {
			return nil, fmt.Errorf("invalid category_id: %w", err)
		}
		categoryUUID = pgtype.UUID{Bytes: cID, Valid: true}
	}

	departmentUUID := pgtype.UUID{}
	if departmentID != nil && *departmentID != "" {
		dID, err := uuid.Parse(*departmentID)
		if err != nil {
			return nil, fmt.Errorf("invalid department_id: %w", err)
		}
		departmentUUID = pgtype.UUID{Bytes: dID, Valid: true}
	}

	numPrice := pgtype.Numeric{}
	numPrice.Scan(price)

	good, err := g.repo.Tenant(ctx).CreateGood(ctx, pg.CreateGoodParams{
		ID:              id,
		Name:            name,
		Description:     description,
		NameI18n:        nameI18nUUID,
		DescriptionI18n: descriptionI18nUUID,
		CategoryID:      categoryUUID,
		DepartmentID:    departmentUUID,
		Price:           numPrice,
		CookTime:        cookTime,
		PictureUrl:      pictureUrl,
		ColorCode:       colorCode,
	})
	if err != nil {
		log.Printf("CreateGood failed: %v", err)
		return nil, fmt.Errorf("failed to create good: %w", err)
	}

	return goodToResponseAny(good), nil
}

// GetGoodByID retrieves a good by ID
func (g *GoodsS) GetGoodByID(ctx context.Context, goodID string) (*model.GoodResponse, error) {
	id, err := uuid.Parse(goodID)
	if err != nil {
		return nil, fmt.Errorf("invalid good ID: %w", err)
	}

	good, err := g.repo.Tenant(ctx).GetGoodByID(ctx, id)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, fmt.Errorf("good not found")
		}
		log.Printf("GetGoodByID failed: %v", err)
		return nil, fmt.Errorf("failed to retrieve good: %w", err)
	}

	return goodToResponseAny(good), nil
}

// GetAllGoods retrieves all goods with pagination
func (g *GoodsS) GetAllGoods(ctx context.Context, limit, offset int32) ([]*model.GoodResponse, error) {
	goods, err := g.repo.Tenant(ctx).GetAllGoods(ctx, pg.GetAllGoodsParams{
		Limit:  limit,
		Offset: offset,
	})
	if err != nil {
		log.Printf("GetAllGoods failed: %v", err)
		return nil, fmt.Errorf("failed to retrieve goods: %w", err)
	}

	var responses []*model.GoodResponse
	for _, good := range goods {
		responses = append(responses, goodToResponseAny(good))
	}
	return responses, nil
}

// GetGoodsByCategory retrieves goods by category
func (g *GoodsS) GetGoodsByCategory(ctx context.Context, categoryID string, limit, offset int32) ([]*model.GoodResponse, error) {
	id, err := uuid.Parse(categoryID)
	if err != nil {
		return nil, fmt.Errorf("invalid category ID: %w", err)
	}

	goods, err := g.repo.Tenant(ctx).GetGoodsByCategoryID(ctx, pg.GetGoodsByCategoryIDParams{
		CategoryID: pgtype.UUID{Bytes: id, Valid: true},
		Limit:      limit,
		Offset:     offset,
	})
	if err != nil {
		log.Printf("GetGoodsByCategory failed: %v", err)
		return nil, fmt.Errorf("failed to retrieve goods: %w", err)
	}

	var responses []*model.GoodResponse
	for _, good := range goods {
		responses = append(responses, goodToResponseAny(good))
	}
	return responses, nil
}

// GetGoodsByDepartment retrieves goods by department
func (g *GoodsS) GetGoodsByDepartment(ctx context.Context, departmentID string, limit, offset int32) ([]*model.GoodResponse, error) {
	id, err := uuid.Parse(departmentID)
	if err != nil {
		return nil, fmt.Errorf("invalid department ID: %w", err)
	}

	goods, err := g.repo.Tenant(ctx).GetGoodsByDepartmentID(ctx, pg.GetGoodsByDepartmentIDParams{
		DepartmentID: pgtype.UUID{Bytes: id, Valid: true},
		Limit:        limit,
		Offset:       offset,
	})
	if err != nil {
		log.Printf("GetGoodsByDepartment failed: %v", err)
		return nil, fmt.Errorf("failed to retrieve goods: %w", err)
	}

	var responses []*model.GoodResponse
	for _, good := range goods {
		responses = append(responses, goodToResponseAny(good))
	}
	return responses, nil
}

// GetGoodsByPriceRange retrieves goods within a price range
func (g *GoodsS) GetGoodsByPriceRange(ctx context.Context, minPrice, maxPrice string, limit, offset int32) ([]*model.GoodResponse, error) {
	minNum := pgtype.Numeric{}
	maxNum := pgtype.Numeric{}
	minNum.Scan(minPrice)
	maxNum.Scan(maxPrice)

	goods, err := g.repo.Tenant(ctx).GetGoodsByPriceRange(ctx, pg.GetGoodsByPriceRangeParams{
		Price:   minNum,
		Price_2: maxNum,
		Limit:   limit,
		Offset:  offset,
	})
	if err != nil {
		log.Printf("GetGoodsByPriceRange failed: %v", err)
		return nil, fmt.Errorf("failed to retrieve goods: %w", err)
	}

	var responses []*model.GoodResponse
	for _, good := range goods {
		responses = append(responses, goodToResponseAny(good))
	}
	return responses, nil
}

// UpdateGood updates a good
func (g *GoodsS) UpdateGood(ctx context.Context, goodID string, name, description, nameI18n, descriptionI18n, categoryID, departmentID, price *string, cookTime *int32, pictureUrl *string, colorCode *string) (*model.GoodResponse, error) {
	id, err := uuid.Parse(goodID)
	if err != nil {
		return nil, fmt.Errorf("invalid good ID: %w", err)
	}

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

	categoryUUID := pgtype.UUID{}
	if categoryID != nil && *categoryID != "" {
		cID, err := uuid.Parse(*categoryID)
		if err != nil {
			return nil, fmt.Errorf("invalid category_id: %w", err)
		}
		categoryUUID = pgtype.UUID{Bytes: cID, Valid: true}
	}

	departmentUUID := pgtype.UUID{}
	if departmentID != nil && *departmentID != "" {
		dID, err := uuid.Parse(*departmentID)
		if err != nil {
			return nil, fmt.Errorf("invalid department_id: %w", err)
		}
		departmentUUID = pgtype.UUID{Bytes: dID, Valid: true}
	}

	priceNum := pgtype.Numeric{}
	if price != nil && *price != "" {
		priceNum.Scan(*price)
	}

	finalName := ""
	if name != nil {
		finalName = *name
	}

	finalDescription := (*string)(nil)
	if description != nil {
		finalDescription = description
	}

	good, err := g.repo.Tenant(ctx).UpdateGood(ctx, pg.UpdateGoodParams{
		ID:              id,
		Name:            finalName,
		Description:     finalDescription,
		NameI18n:        nameI18nUUID,
		DescriptionI18n: descriptionI18nUUID,
		CategoryID:      categoryUUID,
		DepartmentID:    departmentUUID,
		Price:           priceNum,
		CookTime:        cookTime,
		PictureUrl:      pictureUrl,
		ColorCode:       colorCode,
	})
	if err != nil {
		log.Printf("UpdateGood failed: %v", err)
		return nil, fmt.Errorf("failed to update good: %w", err)
	}

	return goodToResponseAny(good), nil
}

// UpdateGoodPrice updates the price of a good
func (g *GoodsS) UpdateGoodPrice(ctx context.Context, goodID, price string) (*model.GoodResponse, error) {
	id, err := uuid.Parse(goodID)
	if err != nil {
		return nil, fmt.Errorf("invalid good ID: %w", err)
	}

	priceNum := pgtype.Numeric{}
	priceNum.Scan(price)

	good, err := g.repo.Tenant(ctx).UpdateGoodPrice(ctx, pg.UpdateGoodPriceParams{
		ID:    id,
		Price: priceNum,
	})
	if err != nil {
		log.Printf("UpdateGoodPrice failed: %v", err)
		return nil, fmt.Errorf("failed to update good price: %w", err)
	}

	return goodToResponseAny(good), nil
}

// DeleteGood deletes a good
func (g *GoodsS) DeleteGood(ctx context.Context, goodID string) error {
	id, err := uuid.Parse(goodID)
	if err != nil {
		return fmt.Errorf("invalid good ID: %w", err)
	}

	if err := g.repo.Tenant(ctx).DeleteGood(ctx, id); err != nil {
		log.Printf("DeleteGood failed: %v", err)
		return fmt.Errorf("failed to delete good: %w", err)
	}
	return nil
}

// RestoreGood restores a deleted good
func (g *GoodsS) RestoreGood(ctx context.Context, goodID string) (*model.GoodResponse, error) {
	id, err := uuid.Parse(goodID)
	if err != nil {
		return nil, fmt.Errorf("invalid good ID: %w", err)
	}

	if err := g.repo.Tenant(ctx).RestoreGood(ctx, id); err != nil {
		log.Printf("RestoreGood failed: %v", err)
		return nil, fmt.Errorf("failed to restore good: %w", err)
	}

	return g.GetGoodByID(ctx, goodID)
}

// SearchGoods searches for goods by name or description
func (g *GoodsS) SearchGoods(ctx context.Context, query string, limit, offset int32) ([]*model.GoodResponse, error) {
	if query == "" {
		return nil, fmt.Errorf("search query is required")
	}

	goods, err := g.repo.Tenant(ctx).SearchGoods(ctx, pg.SearchGoodsParams{
		Column1: &query,
		Limit:   limit,
		Offset:  offset,
	})
	if err != nil {
		log.Printf("SearchGoods failed: %v", err)
		return nil, fmt.Errorf("failed to search goods: %w", err)
	}

	var responses []*model.GoodResponse
	for _, good := range goods {
		responses = append(responses, goodToResponseAny(good))
	}
	return responses, nil
}

// ==================== GOODS DETAILS ====================

// CreateGoodDetail creates a new good detail
func (g *GoodsS) CreateGoodDetail(ctx context.Context, goodID string, ingredientID, compoundID *string, measurement *string, quantity int64) (*model.GoodDetailResponse, error) {
	id := uuid.New()
	gID, err := uuid.Parse(goodID)
	if err != nil {
		return nil, fmt.Errorf("invalid good ID: %w", err)
	}

	var ingID, cmpID pgtype.UUID
	if ingredientID != nil && *ingredientID != "" {
		iid, err := uuid.Parse(*ingredientID)
		if err != nil {
			return nil, fmt.Errorf("invalid ingredient ID: %w", err)
		}
		ingID = pgtype.UUID{Bytes: iid, Valid: true}
	}
	if compoundID != nil && *compoundID != "" {
		cid, err := uuid.Parse(*compoundID)
		if err != nil {
			return nil, fmt.Errorf("invalid compound ID: %w", err)
		}
		cmpID = pgtype.UUID{Bytes: cid, Valid: true}
	}

	if !ingID.Valid && !cmpID.Valid {
		return nil, fmt.Errorf("either ingredient_id or compound_id is required")
	}

	measurementType := pg.NullMeasurementType{}
	if measurement != nil && *measurement != "" {
		measurementType.MeasurementType = pg.MeasurementType(*measurement)
		measurementType.Valid = true
	}

	detail, err := g.repo.Tenant(ctx).CreateGoodDetail(ctx, pg.CreateGoodDetailParams{
		ID:           id,
		GoodID:       gID,
		IngredientID: ingID,
		CompoundID:   cmpID,
		Measurement:  measurementType,
		Quantity:     quantity,
	})
	if err != nil {
		log.Printf("CreateGoodDetail failed: %v", err)
		return nil, fmt.Errorf("failed to create good detail: %w", err)
	}

	return toGoodDetailResponse(detail), nil
}

// GetGoodDetailByID retrieves a good detail by ID
func (g *GoodsS) GetGoodDetailByID(ctx context.Context, detailID string) (*model.GoodDetailResponse, error) {
	id, err := uuid.Parse(detailID)
	if err != nil {
		return nil, fmt.Errorf("invalid detail ID: %w", err)
	}

	detail, err := g.repo.Tenant(ctx).GetGoodDetailByID(ctx, id)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, fmt.Errorf("good detail not found")
		}
		log.Printf("GetGoodDetailByID failed: %v", err)
		return nil, fmt.Errorf("failed to retrieve good detail: %w", err)
	}

	return toGoodDetailResponse(detail), nil
}

// GetGoodDetailsByGood retrieves all details for a good
func (g *GoodsS) GetGoodDetailsByGood(ctx context.Context, goodID string) ([]*model.GoodDetailResponse, error) {
	id, err := uuid.Parse(goodID)
	if err != nil {
		return nil, fmt.Errorf("invalid good ID: %w", err)
	}

	details, err := g.repo.Tenant(ctx).GetGoodDetailsByGoodID(ctx, id)
	if err != nil {
		log.Printf("GetGoodDetailsByGood failed: %v", err)
		return nil, fmt.Errorf("failed to retrieve good details: %w", err)
	}

	var responses []*model.GoodDetailResponse
	for _, detail := range details {
		responses = append(responses, toGoodDetailResponse(detail))
	}
	return responses, nil
}

// GetGoodDetailsByIngredient retrieves all good details for an ingredient
func (g *GoodsS) GetGoodDetailsByIngredient(ctx context.Context, ingredientID string, limit, offset int32) ([]*model.GoodDetailResponse, error) {
	id, err := uuid.Parse(ingredientID)
	if err != nil {
		return nil, fmt.Errorf("invalid ingredient ID: %w", err)
	}

	details, err := g.repo.Tenant(ctx).GetGoodDetailsByIngredientID(ctx, pg.GetGoodDetailsByIngredientIDParams{
		IngredientID: pgtype.UUID{Bytes: id, Valid: true},
		Limit:        limit,
		Offset:       offset,
	})
	if err != nil {
		log.Printf("GetGoodDetailsByIngredient failed: %v", err)
		return nil, fmt.Errorf("failed to retrieve good details: %w", err)
	}

	var responses []*model.GoodDetailResponse
	for _, detail := range details {
		responses = append(responses, toGoodDetailResponse(detail))
	}
	return responses, nil
}

// GetGoodDetailsByCompound retrieves all good details for a compound
func (g *GoodsS) GetGoodDetailsByCompound(ctx context.Context, compoundID string, limit, offset int32) ([]*model.GoodDetailResponse, error) {
	id, err := uuid.Parse(compoundID)
	if err != nil {
		return nil, fmt.Errorf("invalid compound ID: %w", err)
	}

	details, err := g.repo.Tenant(ctx).GetGoodDetailsByCompoundID(ctx, pg.GetGoodDetailsByCompoundIDParams{
		CompoundID: pgtype.UUID{Bytes: id, Valid: true},
		Limit:      limit,
		Offset:     offset,
	})
	if err != nil {
		log.Printf("GetGoodDetailsByCompound failed: %v", err)
		return nil, fmt.Errorf("failed to retrieve good details: %w", err)
	}

	var responses []*model.GoodDetailResponse
	for _, detail := range details {
		responses = append(responses, toGoodDetailResponse(detail))
	}
	return responses, nil
}

// UpdateGoodDetail updates a good detail
func (g *GoodsS) UpdateGoodDetail(ctx context.Context, detailID string, goodID, ingredientID, compoundID *string, measurement *string, quantity *int64) (*model.GoodDetailResponse, error) {
	id, err := uuid.Parse(detailID)
	if err != nil {
		return nil, fmt.Errorf("invalid detail ID: %w", err)
	}

	// Get existing detail
	existing, err := g.repo.Tenant(ctx).GetGoodDetailByID(ctx, id)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, fmt.Errorf("good detail not found")
		}
		return nil, fmt.Errorf("failed to get good detail: %w", err)
	}

	finalGoodID := existing.GoodID
	if goodID != nil && *goodID != "" {
		gid, err := uuid.Parse(*goodID)
		if err != nil {
			return nil, fmt.Errorf("invalid good ID: %w", err)
		}
		finalGoodID = gid
	}

	finalIngredientID := existing.IngredientID
	if ingredientID != nil && *ingredientID != "" {
		iid, err := uuid.Parse(*ingredientID)
		if err != nil {
			return nil, fmt.Errorf("invalid ingredient ID: %w", err)
		}
		finalIngredientID = pgtype.UUID{Bytes: iid, Valid: true}
	}

	finalCompoundID := existing.CompoundID
	if compoundID != nil && *compoundID != "" {
		cid, err := uuid.Parse(*compoundID)
		if err != nil {
			return nil, fmt.Errorf("invalid compound ID: %w", err)
		}
		finalCompoundID = pgtype.UUID{Bytes: cid, Valid: true}
	}

	finalMeasurement := existing.Measurement
	if measurement != nil && *measurement != "" {
		finalMeasurement = pg.NullMeasurementType{
			MeasurementType: pg.MeasurementType(*measurement),
			Valid:           true,
		}
	}

	finalQuantity := existing.Quantity
	if quantity != nil {
		finalQuantity = *quantity
	}

	detail, err := g.repo.Tenant(ctx).UpdateGoodDetail(ctx, pg.UpdateGoodDetailParams{
		ID:           id,
		GoodID:       finalGoodID,
		IngredientID: finalIngredientID,
		CompoundID:   finalCompoundID,
		Measurement:  finalMeasurement,
		Quantity:     finalQuantity,
	})
	if err != nil {
		log.Printf("UpdateGoodDetail failed: %v", err)
		return nil, fmt.Errorf("failed to update good detail: %w", err)
	}

	return toGoodDetailResponse(detail), nil
}

// UpdateGoodDetailQuantity updates the quantity of a good detail
func (g *GoodsS) UpdateGoodDetailQuantity(ctx context.Context, detailID string, quantity int64) (*model.GoodDetailResponse, error) {
	id, err := uuid.Parse(detailID)
	if err != nil {
		return nil, fmt.Errorf("invalid detail ID: %w", err)
	}

	detail, err := g.repo.Tenant(ctx).UpdateGoodDetailQuantity(ctx, pg.UpdateGoodDetailQuantityParams{
		ID:       id,
		Quantity: quantity,
	})
	if err != nil {
		log.Printf("UpdateGoodDetailQuantity failed: %v", err)
		return nil, fmt.Errorf("failed to update good detail quantity: %w", err)
	}

	return toGoodDetailResponse(detail), nil
}

// DeleteGoodDetail deletes a good detail
func (g *GoodsS) DeleteGoodDetail(ctx context.Context, detailID string) error {
	id, err := uuid.Parse(detailID)
	if err != nil {
		return fmt.Errorf("invalid detail ID: %w", err)
	}

	if err := g.repo.Tenant(ctx).DeleteGoodDetail(ctx, id); err != nil {
		log.Printf("DeleteGoodDetail failed: %v", err)
		return fmt.Errorf("failed to delete good detail: %w", err)
	}
	return nil
}

// RestoreGoodDetail restores a deleted good detail
func (g *GoodsS) RestoreGoodDetail(ctx context.Context, detailID string) (*model.GoodDetailResponse, error) {
	id, err := uuid.Parse(detailID)
	if err != nil {
		return nil, fmt.Errorf("invalid detail ID: %w", err)
	}

	if err := g.repo.Tenant(ctx).RestoreGoodDetail(ctx, id); err != nil {
		log.Printf("RestoreGoodDetail failed: %v", err)
		return nil, fmt.Errorf("failed to restore good detail: %w", err)
	}

	return g.GetGoodDetailByID(ctx, detailID)
}

// Helper function to convert database good to response model

// Helper function to convert database good detail to response model
func toGoodDetailResponse(detail pg.GoodsDetail) *model.GoodDetailResponse {
	var ingredientIDStr *string
	if detail.IngredientID.Valid {
		str := detail.IngredientID.String()
		ingredientIDStr = &str
	}

	var compoundIDStr *string
	if detail.CompoundID.Valid {
		str := detail.CompoundID.String()
		compoundIDStr = &str
	}

	var measurementStr *string
	if detail.Measurement.Valid {
		str := string(detail.Measurement.MeasurementType)
		measurementStr = &str
	}

	var createdAt *time.Time
	if detail.CreatedAt.Valid {
		createdAt = &detail.CreatedAt.Time
	}

	var updatedAt *time.Time
	if detail.UpdatedAt.Valid {
		updatedAt = &detail.UpdatedAt.Time
	}

	return &model.GoodDetailResponse{
		ID:           detail.ID.String(),
		GoodID:       detail.GoodID.String(),
		IngredientID: ingredientIDStr,
		CompoundID:   compoundIDStr,
		Measurement:  measurementStr,
		Quantity:     detail.Quantity,
		CreatedAt:    createdAt,
		UpdatedAt:    updatedAt,
	}
}

// Helper function to convert pgtype.Numeric to string
func numericToStringGoods(n pgtype.Numeric) string {
	if !n.Valid {
		return "0"
	}
	// Convert to Decimal string representation
	if n.NaN {
		return "NaN"
	}
	if n.InfinityModifier > 0 {
		return "Infinity"
	}
	if n.InfinityModifier < 0 {
		return "-Infinity"
	}

	// If Int is nil, return 0
	if n.Int == nil {
		return "0"
	}

	// Apply exponent to format the number
	str := n.Int.String()
	if n.Exp < 0 {
		// Need to add decimal point
		exp := -int(n.Exp)
		if exp >= len(str) {
			// Add leading zeros and decimal
			str = "0." + strings.Repeat("0", exp-len(str)) + str
		} else {
			// Insert decimal point
			str = str[:len(str)-exp] + "." + str[len(str)-exp:]
		}
	} else if n.Exp > 0 {
		// Add trailing zeros
		str = str + strings.Repeat("0", int(n.Exp))
	}

	return str
}
