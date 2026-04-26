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
type compoundRowFields struct {
	ID                uuid.UUID
	Name              string
	NameI18n          pgtype.UUID
	Description       *string
	DescriptionI18n   pgtype.UUID
	Quantity          pgtype.Numeric
	Measurement       pg.NullMeasurementType
	Price             pgtype.Numeric
	BranchID          pgtype.UUID
	IngredientGroupID pgtype.UUID
	PictureUrl        *string
	ColorCode         *string
	CreatedAt         pgtype.Timestamptz
	UpdatedAt         pgtype.Timestamptz
}

// Helper function to convert any compound row type to response
func compoundToResponseAny(row any) *model.CompoundResponse {
	var f compoundRowFields

	switch v := row.(type) {
	case pg.Compound:
		f = compoundRowFields{
			ID: v.ID, Name: v.Name, NameI18n: v.NameI18n, Description: v.Description,
			DescriptionI18n: v.DescriptionI18n, Quantity: v.Quantity, Measurement: v.Measurement,
			Price: v.Price, BranchID: v.BranchID, IngredientGroupID: v.IngredientGroupID,
			PictureUrl: v.PictureUrl, ColorCode: v.ColorCode,
			CreatedAt: v.CreatedAt, UpdatedAt: v.UpdatedAt,
		}
	case pg.CreateCompoundRow:
		f = compoundRowFields{
			ID: v.ID, Name: v.Name, NameI18n: v.NameI18n, Description: v.Description,
			DescriptionI18n: v.DescriptionI18n, Quantity: v.Quantity, Measurement: v.Measurement,
			Price: v.Price, BranchID: v.BranchID, IngredientGroupID: v.IngredientGroupID,
			PictureUrl: v.PictureUrl, ColorCode: v.ColorCode,
			CreatedAt: v.CreatedAt, UpdatedAt: v.UpdatedAt,
		}
	case pg.GetCompoundByIDRow:
		f = compoundRowFields{
			ID: v.ID, Name: v.Name, NameI18n: v.NameI18n, Description: v.Description,
			DescriptionI18n: v.DescriptionI18n, Quantity: v.Quantity, Measurement: v.Measurement,
			Price: v.Price, BranchID: v.BranchID, IngredientGroupID: v.IngredientGroupID,
			PictureUrl: v.PictureUrl, ColorCode: v.ColorCode,
			CreatedAt: v.CreatedAt, UpdatedAt: v.UpdatedAt,
		}
	case pg.GetAllCompoundsRow:
		f = compoundRowFields{
			ID: v.ID, Name: v.Name, NameI18n: v.NameI18n, Description: v.Description,
			DescriptionI18n: v.DescriptionI18n, Quantity: v.Quantity, Measurement: v.Measurement,
			Price: v.Price, BranchID: v.BranchID, IngredientGroupID: v.IngredientGroupID,
			PictureUrl: v.PictureUrl, ColorCode: v.ColorCode,
			CreatedAt: v.CreatedAt, UpdatedAt: v.UpdatedAt,
		}
	case pg.UpdateCompoundRow:
		f = compoundRowFields{
			ID: v.ID, Name: v.Name, NameI18n: v.NameI18n, Description: v.Description,
			DescriptionI18n: v.DescriptionI18n, Quantity: v.Quantity, Measurement: v.Measurement,
			Price: v.Price, BranchID: v.BranchID, IngredientGroupID: v.IngredientGroupID,
			PictureUrl: v.PictureUrl, ColorCode: v.ColorCode,
			CreatedAt: v.CreatedAt, UpdatedAt: v.UpdatedAt,
		}
	case pg.UpdateCompoundPriceRow:
		f = compoundRowFields{
			ID: v.ID, Name: v.Name, NameI18n: v.NameI18n, Description: v.Description,
			DescriptionI18n: v.DescriptionI18n, Quantity: v.Quantity, Measurement: v.Measurement,
			Price: v.Price, BranchID: v.BranchID, IngredientGroupID: v.IngredientGroupID,
			PictureUrl: v.PictureUrl, ColorCode: v.ColorCode,
			CreatedAt: v.CreatedAt, UpdatedAt: v.UpdatedAt,
		}
	case pg.UpdateCompoundCostFieldsRow:
		f = compoundRowFields{
			ID: v.ID, Name: v.Name, NameI18n: v.NameI18n, Description: v.Description,
			DescriptionI18n: v.DescriptionI18n, Quantity: v.Quantity, Measurement: v.Measurement,
			Price: v.Price, BranchID: v.BranchID, IngredientGroupID: v.IngredientGroupID,
			PictureUrl: v.PictureUrl, ColorCode: v.ColorCode,
			CreatedAt: v.CreatedAt, UpdatedAt: v.UpdatedAt,
		}
	case pg.GetCompoundByIDWithLanguageRow:
		f = compoundRowFields{
			ID: v.ID, Name: v.Name, NameI18n: v.NameI18n, Description: v.Description,
			DescriptionI18n: v.DescriptionI18n, Quantity: v.Quantity, Measurement: v.Measurement,
			Price: v.Price, BranchID: v.BranchID, IngredientGroupID: v.IngredientGroupID,
			PictureUrl: v.PictureUrl, ColorCode: v.ColorCode,
			CreatedAt: v.CreatedAt, UpdatedAt: v.UpdatedAt,
		}
	case pg.GetAllCompoundsWithLanguageRow:
		f = compoundRowFields{
			ID: v.ID, Name: v.Name, NameI18n: v.NameI18n, Description: v.Description,
			DescriptionI18n: v.DescriptionI18n, Quantity: v.Quantity, Measurement: v.Measurement,
			Price: v.Price, BranchID: v.BranchID, IngredientGroupID: v.IngredientGroupID,
			PictureUrl: v.PictureUrl, ColorCode: v.ColorCode,
			CreatedAt: v.CreatedAt, UpdatedAt: v.UpdatedAt,
		}
	default:
		return nil
	}

	qtyF, _ := strconv.ParseFloat(numericToStr(f.Quantity), 64)

	return &model.CompoundResponse{
		ID:                f.ID.String(),
		Name:              f.Name,
		NameI18n:          uuidToStr(f.NameI18n),
		Description:       f.Description,
		DescriptionI18n:   uuidToStr(f.DescriptionI18n),
		Quantity:          qtyF,
		Measurement:       toMeasurementString(f.Measurement),
		Price:             toPriceString(f.Price),
		BranchID:          uuidToStr(f.BranchID),
		IngredientGroupID: uuidToStr(f.IngredientGroupID),
		PictureUrl:        f.PictureUrl,
		ColorCode:         f.ColorCode,
		CreatedAt:         timestampToTime(f.CreatedAt),
		UpdatedAt:         timestampToTime(f.UpdatedAt),
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
		s := numericToStr(price)
		return &s
	}
	return nil
}

type CompoundS struct {
	repo *repository.Repository
}

func NewCompoundS(repo *repository.Repository) *CompoundS {
	return &CompoundS{repo: repo}
}

func (c *CompoundS) getTenantMutationQueries(ctx context.Context) (*pg.Queries, context.Context, pgx.Tx, bool, error) {
	if existingTx, ok := repository.TenantTxFromContext(ctx); ok && existingTx != nil {
		if q, ok := repository.TenantQueriesFromContext(ctx); ok && q != nil {
			return q, ctx, existingTx, false, nil
		}
		q := pg.New(existingTx)
		txCtx := repository.WithTenantQueries(ctx, q)
		return q, txCtx, existingTx, false, nil
	}

	tx, err := c.repo.PgRepo.TenantPool.Begin(ctx)
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

func (c *CompoundS) CreateCompound(ctx context.Context, name string, nameI18n, description, descriptionI18n, measurement *string, quantity float64, price *string, pictureUrl *string, colorCode *string, ingredientGroupID *string) (*model.CompoundResponse, error) {
	q, txCtx, tx, ownsTx, err := c.getTenantMutationQueries(ctx)
	if err != nil {
		return nil, err
	}
	if ownsTx {
		defer tx.Rollback(ctx)
	}

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

	numPrice := pgtype.Numeric{}
	if price != nil && *price != "" {
		if err := numPrice.Scan(*price); err != nil {
			return nil, fmt.Errorf("invalid price format: %w", err)
		}
	}

	measurementType := pg.NullMeasurementType{}
	if measurement != nil && *measurement != "" {
		measurementType.MeasurementType = pg.MeasurementType(*measurement)
		measurementType.Valid = true
	}

	ingredientGroupUUID := pgtype.UUID{}
	if ingredientGroupID != nil && *ingredientGroupID != "" {
		igID, err := uuid.Parse(*ingredientGroupID)
		if err != nil {
			return nil, fmt.Errorf("invalid ingredient_group_id: %w", err)
		}
		ingredientGroupUUID = pgtype.UUID{Bytes: igID, Valid: true}
	}

	compound, err := q.CreateCompound(txCtx, pg.CreateCompoundParams{
		ID:                id,
		Name:              name,
		NameI18n:          nameI18nUUID,
		Description:       description,
		DescriptionI18n:   descriptionI18nUUID,
		Quantity:          stringToNumeric(fmt.Sprintf("%g", quantity)),
		Measurement:       measurementType,
		Price:             numPrice,
		PictureUrl:        pictureUrl,
		ColorCode:         colorCode,
		IngredientGroupID: ingredientGroupUUID,
	})
	if err != nil {
		log.Printf("CreateCompound failed: %v", err)
		return nil, fmt.Errorf("failed to create compound: %w", err)
	}

	if ownsTx {
		if err := tx.Commit(ctx); err != nil {
			return nil, fmt.Errorf("failed to commit transaction: %w", err)
		}
	}

	return compoundToResponseAny(compound), nil
}

func (c *CompoundS) GetCompoundByID(ctx context.Context, compoundID string) (*model.CompoundResponse, error) {
	id, err := uuid.Parse(compoundID)
	if err != nil {
		return nil, fmt.Errorf("invalid compound ID: %w", err)
	}

	var compound any
	err = withTenantRead(ctx, c.repo, func(tenantCtx context.Context, q *pg.Queries) error {
		var err error
		compound, err = q.GetCompoundByID(tenantCtx, id)
		return err
	})
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, fmt.Errorf("compound not found")
		}
		log.Printf("GetCompoundByID failed: %v", err)
		return nil, fmt.Errorf("failed to retrieve compound: %w", err)
	}

	return compoundToResponseAny(compound), nil
}

func (s *CompoundS) GetAllCompounds(ctx context.Context, filter model.CompoundListFilter, limit, offset int32) ([]*model.CompoundResponse, int64, error) {
	if filter.SortBy == "" {
		filter.SortBy = "created_at"
	}
	if filter.SortOrder == "" {
		filter.SortOrder = "desc"
	}

	var total int64
	var rows any

	err := withTenantRead(ctx, s.repo, func(tenantCtx context.Context, q *pg.Queries) error {
		var err error
		total, err = q.CountCompounds(tenantCtx, filter.Search)
		if err != nil {
			log.Printf("CountCompounds failed: %v", err)
			return fmt.Errorf("failed to count compounds: %w", err)
		}

		rows, err = q.GetAllCompounds(tenantCtx, pg.GetAllCompoundsParams{
			Search:    filter.Search,
			SortBy:    filter.SortBy,
			SortOrder: filter.SortOrder,
			Limit:     limit,
			Offset:    offset,
		})
		return err
	})
	if err != nil {
		log.Printf("GetAllCompounds failed: %v", err)
		return nil, 0, fmt.Errorf("failed to retrieve compounds: %w", err)
	}

	responses := make([]*model.CompoundResponse, 0)
	switch v := rows.(type) {
	case []pg.GetAllCompoundsRow:
		for _, row := range v {
			responses = append(responses, compoundToResponseAny(row))
		}
	case []pg.Compound:
		for _, row := range v {
			responses = append(responses, compoundToResponseAny(row))
		}
	}

	return responses, total, nil
}

func (c *CompoundS) UpdateCompound(ctx context.Context, compoundID string, name, nameI18n, description, descriptionI18n, measurement *string, quantity *float64, price *string, pictureUrl *string, colorCode *string, ingredientGroupID *string) (*model.CompoundResponse, error) {
	q, txCtx, tx, ownsTx, err := c.getTenantMutationQueries(ctx)
	if err != nil {
		return nil, err
	}
	if ownsTx {
		defer tx.Rollback(ctx)
	}

	id, err := uuid.Parse(compoundID)
	if err != nil {
		return nil, fmt.Errorf("invalid compound ID: %w", err)
	}

	existing, err := q.GetCompoundByID(txCtx, id)
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
		finalQuantity = stringToNumeric(fmt.Sprintf("%g", *quantity))
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
		if err := finalPrice.Scan(*price); err != nil {
			return nil, fmt.Errorf("invalid price format: %w", err)
		}
	}

	finalPictureUrl := existing.PictureUrl
	if pictureUrl != nil {
		finalPictureUrl = pictureUrl
	}

	finalColorCode := existing.ColorCode
	if colorCode != nil {
		finalColorCode = colorCode
	}

	finalIngredientGroupID := existing.IngredientGroupID
	if ingredientGroupID != nil && *ingredientGroupID != "" {
		igID, err := uuid.Parse(*ingredientGroupID)
		if err != nil {
			return nil, fmt.Errorf("invalid ingredient_group_id: %w", err)
		}
		finalIngredientGroupID = pgtype.UUID{Bytes: igID, Valid: true}
	}

	compound, err := q.UpdateCompound(txCtx, pg.UpdateCompoundParams{
		ID:                id,
		Name:              finalName,
		NameI18n:          finalNameI18n,
		Description:       finalDescription,
		DescriptionI18n:   finalDescriptionI18n,
		Quantity:          finalQuantity,
		Measurement:       finalMeasurement,
		Price:             finalPrice,
		PictureUrl:        finalPictureUrl,
		ColorCode:         finalColorCode,
		IngredientGroupID: finalIngredientGroupID,
	})
	if err != nil {
		log.Printf("UpdateCompound failed: %v", err)
		return nil, fmt.Errorf("failed to update compound: %w", err)
	}

	if ownsTx {
		if err := tx.Commit(ctx); err != nil {
			return nil, fmt.Errorf("failed to commit transaction: %w", err)
		}
	}

	return compoundToResponseAny(compound), nil
}

// DeleteCompound soft deletes a compound
func (c *CompoundS) DeleteCompound(ctx context.Context, compoundID string) error {
	q, txCtx, tx, ownsTx, err := c.getTenantMutationQueries(ctx)
	if err != nil {
		return err
	}
	if ownsTx {
		defer tx.Rollback(ctx)
	}

	id, err := uuid.Parse(compoundID)
	if err != nil {
		return fmt.Errorf("invalid compound ID: %w", err)
	}

	if err := q.DeleteCompound(txCtx, id); err != nil {
		log.Printf("DeleteCompound failed: %v", err)
		return fmt.Errorf("failed to delete compound: %w", err)
	}

	if ownsTx {
		if err := tx.Commit(ctx); err != nil {
			return fmt.Errorf("failed to commit transaction: %w", err)
		}
	}

	return nil
}

// RestoreCompound restores a soft-deleted compound
func (c *CompoundS) RestoreCompound(ctx context.Context, compoundID string) (*model.CompoundResponse, error) {
	q, txCtx, tx, ownsTx, err := c.getTenantMutationQueries(ctx)
	if err != nil {
		return nil, err
	}
	if ownsTx {
		defer tx.Rollback(ctx)
	}

	id, err := uuid.Parse(compoundID)
	if err != nil {
		return nil, fmt.Errorf("invalid compound ID: %w", err)
	}

	if err := q.RestoreCompound(txCtx, id); err != nil {
		log.Printf("RestoreCompound failed: %v", err)
		return nil, fmt.Errorf("failed to restore compound: %w", err)
	}

	if ownsTx {
		if err := tx.Commit(ctx); err != nil {
			return nil, fmt.Errorf("failed to commit transaction: %w", err)
		}
	}

	return c.GetCompoundByID(ctx, compoundID)
}

func (c *CompoundS) CreateCompoundDetail(ctx context.Context, compoundID, ingredientID string, quantity int64) (*model.CompoundDetailResponse, error) {
	q, txCtx, tx, ownsTx, err := c.getTenantMutationQueries(ctx)
	if err != nil {
		return nil, err
	}
	if ownsTx {
		defer tx.Rollback(ctx)
	}

	id := uuid.New()
	compID, err := uuid.Parse(compoundID)
	if err != nil {
		return nil, fmt.Errorf("invalid compound ID: %w", err)
	}

	ingID, err := uuid.Parse(ingredientID)
	if err != nil {
		return nil, fmt.Errorf("invalid ingredient ID: %w", err)
	}

	detail, err := q.CreateCompoundDetail(txCtx, pg.CreateCompoundDetailParams{
		ID:           id,
		CompoundID:   compID,
		IngredientID: ingID,
		Quantity:     quantity,
	})
	if err != nil {
		log.Printf("CreateCompoundDetail failed: %v", err)
		return nil, fmt.Errorf("failed to create compound detail: %w", err)
	}

	if ownsTx {
		if err := tx.Commit(ctx); err != nil {
			return nil, fmt.Errorf("failed to commit transaction: %w", err)
		}
	}

	return toCompoundDetailResponse(detail), nil
}

func (c *CompoundS) GetCompoundDetailByID(ctx context.Context, detailID string) (*model.CompoundDetailResponse, error) {
	id, err := uuid.Parse(detailID)
	if err != nil {
		return nil, fmt.Errorf("invalid detail ID: %w", err)
	}

	var detail pg.CompoundsDetail
	err = withTenantRead(ctx, c.repo, func(tenantCtx context.Context, q *pg.Queries) error {
		var err error
		detail, err = q.GetCompoundDetailByID(tenantCtx, id)
		return err
	})
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

	var details []pg.CompoundsDetail
	err = withTenantRead(ctx, c.repo, func(tenantCtx context.Context, q *pg.Queries) error {
		var err error
		details, err = q.GetCompoundDetailsByCompoundID(tenantCtx, id)
		return err
	})
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

	var details []pg.CompoundsDetail
	err = withTenantRead(ctx, c.repo, func(tenantCtx context.Context, q *pg.Queries) error {
		var err error
		details, err = q.GetCompoundDetailsByIngredientID(tenantCtx, pg.GetCompoundDetailsByIngredientIDParams{
			IngredientID: id,
			Limit:        limit,
			Offset:       offset,
		})
		return err
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
	q, txCtx, tx, ownsTx, err := c.getTenantMutationQueries(ctx)
	if err != nil {
		return nil, err
	}
	if ownsTx {
		defer tx.Rollback(ctx)
	}

	id, err := uuid.Parse(detailID)
	if err != nil {
		return nil, fmt.Errorf("invalid detail ID: %w", err)
	}

	existing, err := q.GetCompoundDetailByID(txCtx, id)
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

	detail, err := q.UpdateCompoundDetail(txCtx, pg.UpdateCompoundDetailParams{
		ID:           id,
		CompoundID:   finalCompoundID,
		IngredientID: finalIngredientID,
		Quantity:     finalQuantity,
	})
	if err != nil {
		log.Printf("UpdateCompoundDetail failed: %v", err)
		return nil, fmt.Errorf("failed to update compound detail: %w", err)
	}

	if ownsTx {
		if err := tx.Commit(ctx); err != nil {
			return nil, fmt.Errorf("failed to commit transaction: %w", err)
		}
	}

	return toCompoundDetailResponse(detail), nil
}

// DeleteCompoundDetail deletes a compound detail
func (c *CompoundS) DeleteCompoundDetail(ctx context.Context, detailID string) error {
	q, txCtx, tx, ownsTx, err := c.getTenantMutationQueries(ctx)
	if err != nil {
		return err
	}
	if ownsTx {
		defer tx.Rollback(ctx)
	}

	id, err := uuid.Parse(detailID)
	if err != nil {
		return fmt.Errorf("invalid detail ID: %w", err)
	}

	if err := q.DeleteCompoundDetail(txCtx, id); err != nil {
		log.Printf("DeleteCompoundDetail failed: %v", err)
		return fmt.Errorf("failed to delete compound detail: %w", err)
	}

	if ownsTx {
		if err := tx.Commit(ctx); err != nil {
			return fmt.Errorf("failed to commit transaction: %w", err)
		}
	}

	return nil
}

// RestoreCompoundDetail restores a deleted compound detail
func (c *CompoundS) RestoreCompoundDetail(ctx context.Context, detailID string) (*model.CompoundDetailResponse, error) {
	q, txCtx, tx, ownsTx, err := c.getTenantMutationQueries(ctx)
	if err != nil {
		return nil, err
	}
	if ownsTx {
		defer tx.Rollback(ctx)
	}

	id, err := uuid.Parse(detailID)
	if err != nil {
		return nil, fmt.Errorf("invalid detail ID: %w", err)
	}

	if err := q.RestoreCompoundDetail(txCtx, id); err != nil {
		log.Printf("RestoreCompoundDetail failed: %v", err)
		return nil, fmt.Errorf("failed to restore compound detail: %w", err)
	}

	if ownsTx {
		if err := tx.Commit(ctx); err != nil {
			return nil, fmt.Errorf("failed to commit transaction: %w", err)
		}
	}

	return c.GetCompoundDetailByID(ctx, detailID)
}

// ==================== COMPOUND STOCK ====================

// CreateCompoundStock creates a new compound stock entry
func (c *CompoundS) CreateCompoundStock(ctx context.Context, compoundID, branchID string, quantity int64) (*model.CompoundStockResponse, error) {
	q, txCtx, tx, ownsTx, err := c.getTenantMutationQueries(ctx)
	if err != nil {
		return nil, err
	}
	if ownsTx {
		defer tx.Rollback(ctx)
	}

	id := uuid.New()
	compID, err := uuid.Parse(compoundID)
	if err != nil {
		return nil, fmt.Errorf("invalid compound ID: %w", err)
	}

	bID, err := uuid.Parse(branchID)
	if err != nil {
		return nil, fmt.Errorf("invalid branch ID: %w", err)
	}

	stock, err := q.CreateCompoundStock(txCtx, pg.CreateCompoundStockParams{
		ID:         id,
		CompoundID: compID,
		Quantity:   quantity,
		BranchID:   bID,
	})
	if err != nil {
		log.Printf("CreateCompoundStock failed: %v", err)
		return nil, fmt.Errorf("failed to create compound stock: %w", err)
	}

	if ownsTx {
		if err := tx.Commit(ctx); err != nil {
			return nil, fmt.Errorf("failed to commit transaction: %w", err)
		}
	}

	return toCompoundStockResponse(stock), nil
}

// GetCompoundStockByID retrieves compound stock by ID
func (c *CompoundS) GetCompoundStockByID(ctx context.Context, stockID string) (*model.CompoundStockResponse, error) {
	id, err := uuid.Parse(stockID)
	if err != nil {
		return nil, fmt.Errorf("invalid stock ID: %w", err)
	}

	var stock pg.CompoundStock
	err = withTenantRead(ctx, c.repo, func(tenantCtx context.Context, q *pg.Queries) error {
		var err error
		stock, err = q.GetCompoundStockByID(tenantCtx, id)
		return err
	})
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

	var stock pg.CompoundStock
	err = withTenantRead(ctx, c.repo, func(tenantCtx context.Context, q *pg.Queries) error {
		var err error
		stock, err = q.GetStockByCompoundAndBranch(tenantCtx, pg.GetStockByCompoundAndBranchParams{
			CompoundID: compID,
			BranchID:   bID,
		})
		return err
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
	var stocks []pg.CompoundStock
	err := withTenantRead(ctx, c.repo, func(tenantCtx context.Context, q *pg.Queries) error {
		var err error
		stocks, err = q.GetAllCompoundStock(tenantCtx, pg.GetAllCompoundStockParams{
			Limit:  limit,
			Offset: offset,
		})
		return err
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

	var stocks []pg.CompoundStock
	err = withTenantRead(ctx, c.repo, func(tenantCtx context.Context, q *pg.Queries) error {
		var err error
		stocks, err = q.GetCompoundStockByBranchID(tenantCtx, pg.GetCompoundStockByBranchIDParams{
			BranchID: bID,
			Limit:    limit,
			Offset:   offset,
		})
		return err
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

	var stocks []pg.CompoundStock
	err = withTenantRead(ctx, c.repo, func(tenantCtx context.Context, q *pg.Queries) error {
		var err error
		stocks, err = q.GetCompoundStockByCompoundID(tenantCtx, pg.GetCompoundStockByCompoundIDParams{
			CompoundID: compID,
			Limit:      limit,
			Offset:     offset,
		})
		return err
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
	q, txCtx, tx, ownsTx, err := c.getTenantMutationQueries(ctx)
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

	stock, err := q.UpdateCompoundStock(txCtx, pg.UpdateCompoundStockParams{
		ID:       id,
		Quantity: quantity,
	})
	if err != nil {
		log.Printf("UpdateCompoundStock failed: %v", err)
		return nil, fmt.Errorf("failed to update compound stock: %w", err)
	}

	if ownsTx {
		if err := tx.Commit(ctx); err != nil {
			return nil, fmt.Errorf("failed to commit transaction: %w", err)
		}
	}

	return toCompoundStockResponse(stock), nil
}

// AddToCompoundStock adds quantity to compound stock
func (c *CompoundS) AddToCompoundStock(ctx context.Context, stockID string, quantity int64) (*model.CompoundStockResponse, error) {
	q, txCtx, tx, ownsTx, err := c.getTenantMutationQueries(ctx)
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

	stock, err := q.AddToCompoundStock(txCtx, pg.AddToCompoundStockParams{
		ID:       id,
		Quantity: quantity,
	})
	if err != nil {
		log.Printf("AddToCompoundStock failed: %v", err)
		return nil, fmt.Errorf("failed to add to compound stock: %w", err)
	}

	if ownsTx {
		if err := tx.Commit(ctx); err != nil {
			return nil, fmt.Errorf("failed to commit transaction: %w", err)
		}
	}

	return toCompoundStockResponse(stock), nil
}

// RemoveFromCompoundStock removes quantity from compound stock
func (c *CompoundS) RemoveFromCompoundStock(ctx context.Context, stockID string, quantity int64) (*model.CompoundStockResponse, error) {
	q, txCtx, tx, ownsTx, err := c.getTenantMutationQueries(ctx)
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

	stock, err := q.RemoveFromCompoundStock(txCtx, pg.RemoveFromCompoundStockParams{
		ID:       id,
		Quantity: quantity,
	})
	if err != nil {
		log.Printf("RemoveFromCompoundStock failed: %v", err)
		return nil, fmt.Errorf("failed to remove from compound stock: %w", err)
	}

	if ownsTx {
		if err := tx.Commit(ctx); err != nil {
			return nil, fmt.Errorf("failed to commit transaction: %w", err)
		}
	}

	return toCompoundStockResponse(stock), nil
}

// DeleteCompoundStock deletes compound stock
func (c *CompoundS) DeleteCompoundStock(ctx context.Context, stockID string) error {
	q, txCtx, tx, ownsTx, err := c.getTenantMutationQueries(ctx)
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

	if err := q.DeleteCompoundStock(txCtx, id); err != nil {
		log.Printf("DeleteCompoundStock failed: %v", err)
		return fmt.Errorf("failed to delete compound stock: %w", err)
	}

	if ownsTx {
		if err := tx.Commit(ctx); err != nil {
			return fmt.Errorf("failed to commit transaction: %w", err)
		}
	}

	return nil
}

// RestoreCompoundStock restores deleted compound stock
func (c *CompoundS) RestoreCompoundStock(ctx context.Context, stockID string) (*model.CompoundStockResponse, error) {
	q, txCtx, tx, ownsTx, err := c.getTenantMutationQueries(ctx)
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

	if err := q.RestoreCompoundStock(txCtx, id); err != nil {
		log.Printf("RestoreCompoundStock failed: %v", err)
		return nil, fmt.Errorf("failed to restore compound stock: %w", err)
	}

	if ownsTx {
		if err := tx.Commit(ctx); err != nil {
			return nil, fmt.Errorf("failed to commit transaction: %w", err)
		}
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
	q, txCtx, tx, ownsTx, err := c.getTenantMutationQueries(ctx)
	if err != nil {
		return nil, err
	}
	if ownsTx {
		defer tx.Rollback(ctx)
	}

	id, err := uuid.Parse(compoundID)
	if err != nil {
		return nil, fmt.Errorf("invalid compound_id: %w", err)
	}

	// Get all ingredient calculations for this compound (excluding compound-to-compound)
	calculations, err := q.GetCalculationsByCompoundID(txCtx, pgtype.UUID{Bytes: id, Valid: true})
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

	updated, err := q.UpdateCompound(txCtx, updateParams)
	if err != nil {
		log.Printf("RecalculateCompoundPrice: failed to update compound: %v", err)
		return nil, fmt.Errorf("failed to update compound: %w", err)
	}

	if ownsTx {
		if err := tx.Commit(ctx); err != nil {
			return nil, fmt.Errorf("failed to commit transaction: %w", err)
		}
	}

	return compoundToResponseAny(updated), nil
}

// GetCompoundByIDWithLang retrieves compound by ID with language support
func (c *CompoundS) GetCompoundByIDWithLang(ctx context.Context, compoundID string, lang string) (*model.CompoundResponse, error) {
	id, err := uuid.Parse(compoundID)
	if err != nil {
		return nil, fmt.Errorf("invalid compound ID: %w", err)
	}

	var compound any
	err = withTenantRead(ctx, c.repo, func(tenantCtx context.Context, q *pg.Queries) error {
		var err error
		compound, err = q.GetCompoundByIDWithLanguage(tenantCtx, pg.GetCompoundByIDWithLanguageParams{
			ID:      id,
			Column2: lang,
		})
		return err
	})
	if err != nil {
		log.Printf("GetCompoundByIDWithLang failed: %v", err)
		return nil, fmt.Errorf("failed to get compound: %w", err)
	}

	return compoundToResponseAny(compound), nil
}

// GetAllCompoundsWithLang retrieves all compounds with language support
func (c *CompoundS) GetAllCompoundsWithLang(ctx context.Context, lang string, filter model.CompoundListFilter, limit, offset int32) ([]*model.CompoundResponse, int64, error) {
	if filter.SortBy == "" {
		filter.SortBy = "created_at"
	}
	if filter.SortOrder == "" {
		filter.SortOrder = "desc"
	}

	var total int64
	var compounds any

	err := withTenantRead(ctx, c.repo, func(tenantCtx context.Context, q *pg.Queries) error {
		var err error
		total, err = q.CountCompounds(tenantCtx, filter.Search)
		if err != nil {
			log.Printf("CountCompounds (WithLang) failed: %v", err)
			return fmt.Errorf("failed to count compounds: %w", err)
		}

		compounds, err = q.GetAllCompoundsWithLanguage(tenantCtx, pg.GetAllCompoundsWithLanguageParams{
			Lang:      lang,
			Search:    filter.Search,
			SortBy:    filter.SortBy,
			SortOrder: filter.SortOrder,
			Limit:     limit,
			Offset:    offset,
		})
		return err
	})
	if err != nil {
		log.Printf("GetAllCompoundsWithLang failed: %v", err)
		return nil, 0, fmt.Errorf("failed to get compounds: %w", err)
	}

	responses := make([]*model.CompoundResponse, 0)
	switch v := compounds.(type) {
	case []pg.GetAllCompoundsWithLanguageRow:
		for _, compound := range v {
			responses = append(responses, compoundToResponseAny(compound))
		}
	case []pg.Compound:
		for _, compound := range v {
			responses = append(responses, compoundToResponseAny(compound))
		}
	}

	return responses, total, nil
}
