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
	pg "gitlab.yurtal.tech/company/maryai/back/internal/repository/pg/tenantsdb"
)

// Helper functions for SQLC type conversion
func uuidToStr(u pgtype.UUID) *string {
	if !u.Valid {
		return nil
	}
	str := u.String()
	return &str
}

func timestampToTime(ts pgtype.Timestamptz) *time.Time {
	if !ts.Valid {
		return nil
	}
	return &ts.Time
}

// Generic function to map any category row to response
func mapCategoryToResponse(id uuid.UUID, name string, nameI18n, departmentID, storageID, parent pgtype.UUID, pictureUrl, colorCode *string, createdAt, updatedAt pgtype.Timestamptz) *model.CategoryResponse {
	return &model.CategoryResponse{
		ID:           id.String(),
		Name:         name,
		NameI18n:     uuidToStr(nameI18n),
		PictureUrl:   pictureUrl,
		ColorCode:    colorCode,
		DepartmentID: uuidToStr(departmentID),
		StorageID:    uuidToStr(storageID),
		Parent:       uuidToStr(parent),
		CreatedAt:    timestampToTime(createdAt),
		UpdatedAt:    timestampToTime(updatedAt),
	}
}

type CategoryS struct {
	repo *repository.Repository
}

func NewCategoryS(repo *repository.Repository) *CategoryS {
	return &CategoryS{repo: repo}
}

func (c *CategoryS) CreateCategory(ctx context.Context, name string, nameI18n, departmentID, storageID, parent *string, pictureUrl, colorCode *string) (*model.CategoryResponse, error) {
	if name == "" {
		return nil, fmt.Errorf("category name is required")
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

	deptID := pgtype.UUID{}
	if departmentID != nil && *departmentID != "" {
		id, err := uuid.Parse(*departmentID)
		if err != nil {
			return nil, fmt.Errorf("invalid department_id: %w", err)
		}
		deptID = pgtype.UUID{Bytes: id, Valid: true}
	}

	storageUUID := pgtype.UUID{}
	if storageID != nil && *storageID != "" {
		id, err := uuid.Parse(*storageID)
		if err != nil {
			return nil, fmt.Errorf("invalid storage_id: %w", err)
		}
		storageUUID = pgtype.UUID{Bytes: id, Valid: true}
	}

	parentUUID := pgtype.UUID{}
	if parent != nil && *parent != "" {
		id, err := uuid.Parse(*parent)
		if err != nil {
			return nil, fmt.Errorf("invalid parent: %w", err)
		}
		parentUUID = pgtype.UUID{Bytes: id, Valid: true}
	}

	category, err := c.repo.Tenant(ctx).CreateCategory(ctx, pg.CreateCategoryParams{
		ID:           id,
		Name:         name,
		NameI18n:     nameI18nUUID,
		DepartmentID: deptID,
		StorageID:    storageUUID,
		Parent:       parentUUID,
		PictureUrl:   pictureUrl,
		ColorCode:    colorCode,
	})
	if err != nil {
		log.Printf("CreateCategory failed: %v", err)
		return nil, fmt.Errorf("failed to create category: %w", err)
	}

	return mapCategoryToResponse(category.ID, category.Name, category.NameI18n, category.DepartmentID, category.StorageID, category.Parent, category.PictureUrl, category.ColorCode, category.CreatedAt, category.UpdatedAt), nil
}

func (c *CategoryS) GetCategoryByID(ctx context.Context, categoryID string) (*model.CategoryResponse, error) {
	id, err := uuid.Parse(categoryID)
	if err != nil {
		return nil, fmt.Errorf("invalid category ID: %w", err)
	}

	category, err := c.repo.Tenant(ctx).GetCategoryByID(ctx, id)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, fmt.Errorf("category not found")
		}
		log.Printf("GetCategoryByID failed: %v", err)
		return nil, fmt.Errorf("failed to retrieve category: %w", err)
	}

	return mapCategoryToResponse(category.ID, category.Name, category.NameI18n, category.DepartmentID, category.StorageID, category.Parent, category.PictureUrl, category.ColorCode, category.CreatedAt, category.UpdatedAt), nil
}

func (c *CategoryS) GetAllCategories(ctx context.Context, limit, offset int32) ([]*model.CategoryResponse, error) {
	categories, err := c.repo.Tenant(ctx).GetAllCategories(ctx, pg.GetAllCategoriesParams{
		Limit:  limit,
		Offset: offset,
	})
	if err != nil {
		log.Printf("GetAllCategories failed: %v", err)
		return nil, fmt.Errorf("failed to retrieve categories: %w", err)
	}

	var responses []*model.CategoryResponse
	for _, cat := range categories {
		responses = append(responses, mapCategoryToResponse(cat.ID, cat.Name, cat.NameI18n, cat.DepartmentID, cat.StorageID, cat.Parent, cat.PictureUrl, cat.ColorCode, cat.CreatedAt, cat.UpdatedAt))
	}
	return responses, nil
}

func (c *CategoryS) GetCategoriesByDepartmentID(ctx context.Context, departmentID string, limit, offset int32) ([]*model.CategoryResponse, error) {
	id, err := uuid.Parse(departmentID)
	if err != nil {
		return nil, fmt.Errorf("invalid department ID: %w", err)
	}

	categories, err := c.repo.Tenant(ctx).GetCategoriesByDepartmentID(ctx, pg.GetCategoriesByDepartmentIDParams{
		DepartmentID: pgtype.UUID{Bytes: id, Valid: true},
		Limit:        limit,
		Offset:       offset,
	})
	if err != nil {
		log.Printf("GetCategoriesByDepartmentID failed: %v", err)
		return nil, fmt.Errorf("failed to retrieve categories: %w", err)
	}

	var responses []*model.CategoryResponse
	for _, cat := range categories {
		responses = append(responses, mapCategoryToResponse(cat.ID, cat.Name, cat.NameI18n, cat.DepartmentID, cat.StorageID, cat.Parent, cat.PictureUrl, cat.ColorCode, cat.CreatedAt, cat.UpdatedAt))
	}
	return responses, nil
}

func (c *CategoryS) GetCategoriesByStorageID(ctx context.Context, storageID string, limit, offset int32) ([]*model.CategoryResponse, error) {
	id, err := uuid.Parse(storageID)
	if err != nil {
		return nil, fmt.Errorf("invalid storage ID: %w", err)
	}

	categories, err := c.repo.Tenant(ctx).GetCategoriesByStorageID(ctx, pg.GetCategoriesByStorageIDParams{
		StorageID: pgtype.UUID{Bytes: id, Valid: true},
		Limit:     limit,
		Offset:    offset,
	})
	if err != nil {
		log.Printf("GetCategoriesByStorageID failed: %v", err)
		return nil, fmt.Errorf("failed to retrieve categories: %w", err)
	}

	var responses []*model.CategoryResponse
	for _, cat := range categories {
		responses = append(responses, mapCategoryToResponse(cat.ID, cat.Name, cat.NameI18n, cat.DepartmentID, cat.StorageID, cat.Parent, cat.PictureUrl, cat.ColorCode, cat.CreatedAt, cat.UpdatedAt))
	}
	return responses, nil
}

func (c *CategoryS) GetCategoriesByParentID(ctx context.Context, parentID string, limit, offset int32) ([]*model.CategoryResponse, error) {
	id, err := uuid.Parse(parentID)
	if err != nil {
		return nil, fmt.Errorf("invalid parent ID: %w", err)
	}

	categories, err := c.repo.Tenant(ctx).GetCategoriesByParentID(ctx, pg.GetCategoriesByParentIDParams{
		Parent: pgtype.UUID{Bytes: id, Valid: true},
		Limit:  limit,
		Offset: offset,
	})
	if err != nil {
		log.Printf("GetCategoriesByParentID failed: %v", err)
		return nil, fmt.Errorf("failed to retrieve subcategories: %w", err)
	}

	var responses []*model.CategoryResponse
	for _, cat := range categories {
		responses = append(responses, mapCategoryToResponse(cat.ID, cat.Name, cat.NameI18n, cat.DepartmentID, cat.StorageID, cat.Parent, cat.PictureUrl, cat.ColorCode, cat.CreatedAt, cat.UpdatedAt))
	}
	return responses, nil
}

func (c *CategoryS) GetRootCategories(ctx context.Context, limit, offset int32) ([]*model.CategoryResponse, error) {
	categories, err := c.repo.Tenant(ctx).GetRootCategories(ctx, pg.GetRootCategoriesParams{
		Limit:  limit,
		Offset: offset,
	})
	if err != nil {
		log.Printf("GetRootCategories failed: %v", err)
		return nil, fmt.Errorf("failed to retrieve root categories: %w", err)
	}

	var responses []*model.CategoryResponse
	for _, cat := range categories {
		responses = append(responses, mapCategoryToResponse(cat.ID, cat.Name, cat.NameI18n, cat.DepartmentID, cat.StorageID, cat.Parent, cat.PictureUrl, cat.ColorCode, cat.CreatedAt, cat.UpdatedAt))
	}
	return responses, nil
}

func (c *CategoryS) UpdateCategory(ctx context.Context, categoryID string, name, nameI18n, departmentID, storageID, parent *string, pictureUrl *string, colorCode *string) (*model.CategoryResponse, error) {
	id, err := uuid.Parse(categoryID)
	if err != nil {
		return nil, fmt.Errorf("invalid category ID: %w", err)
	}

	existing, err := c.repo.Tenant(ctx).GetCategoryByID(ctx, id)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, fmt.Errorf("category not found")
		}
		return nil, fmt.Errorf("failed to get category: %w", err)
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

	finalDeptID := existing.DepartmentID
	if departmentID != nil && *departmentID != "" {
		deptID, err := uuid.Parse(*departmentID)
		if err != nil {
			return nil, fmt.Errorf("invalid department_id: %w", err)
		}
		finalDeptID = pgtype.UUID{Bytes: deptID, Valid: true}
	}

	finalStorageID := existing.StorageID
	if storageID != nil && *storageID != "" {
		storID, err := uuid.Parse(*storageID)
		if err != nil {
			return nil, fmt.Errorf("invalid storage_id: %w", err)
		}
		finalStorageID = pgtype.UUID{Bytes: storID, Valid: true}
	}

	finalParent := existing.Parent
	if parent != nil && *parent != "" {
		parentID, err := uuid.Parse(*parent)
		if err != nil {
			return nil, fmt.Errorf("invalid parent: %w", err)
		}
		finalParent = pgtype.UUID{Bytes: parentID, Valid: true}
	}

	finalPictureUrl := existing.PictureUrl
	if pictureUrl != nil {
		finalPictureUrl = pictureUrl
	}

	finalColorCode := existing.ColorCode
	if colorCode != nil {
		finalColorCode = colorCode
	}

	category, err := c.repo.Tenant(ctx).UpdateCategory(ctx, pg.UpdateCategoryParams{
		ID:           id,
		Name:         finalName,
		NameI18n:     finalNameI18n,
		DepartmentID: finalDeptID,
		StorageID:    finalStorageID,
		Parent:       finalParent,
		PictureUrl:   finalPictureUrl,
		ColorCode:    finalColorCode,
	})
	if err != nil {
		log.Printf("UpdateCategory failed: %v", err)
		return nil, fmt.Errorf("failed to update category: %w", err)
	}

	return mapCategoryToResponse(category.ID, category.Name, category.NameI18n, category.DepartmentID, category.StorageID, category.Parent, category.PictureUrl, category.ColorCode, category.CreatedAt, category.UpdatedAt), nil
}

func (c *CategoryS) DeleteCategory(ctx context.Context, categoryID string) error {
	id, err := uuid.Parse(categoryID)
	if err != nil {
		return fmt.Errorf("invalid category ID: %w", err)
	}

	if err := c.repo.Tenant(ctx).DeleteCategory(ctx, id); err != nil {
		log.Printf("DeleteCategory failed: %v", err)
		return fmt.Errorf("failed to delete category: %w", err)
	}
	return nil
}

func (c *CategoryS) RestoreCategory(ctx context.Context, categoryID string) (*model.CategoryResponse, error) {
	id, err := uuid.Parse(categoryID)
	if err != nil {
		return nil, fmt.Errorf("invalid category ID: %w", err)
	}

	if err := c.repo.Tenant(ctx).RestoreCategory(ctx, id); err != nil {
		log.Printf("RestoreCategory failed: %v", err)
		return nil, fmt.Errorf("failed to restore category: %w", err)
	}

	return c.GetCategoryByID(ctx, categoryID)
}

func (c *CategoryS) SearchCategories(ctx context.Context, query string, limit, offset int32) ([]*model.CategoryResponse, error) {
	if query == "" {
		return nil, fmt.Errorf("search query is required")
	}

	q := query
	categories, err := c.repo.Tenant(ctx).SearchCategories(ctx, pg.SearchCategoriesParams{
		Column1: &q,
		Limit:   limit,
		Offset:  offset,
	})
	if err != nil {
		log.Printf("SearchCategories failed: %v", err)
		return nil, fmt.Errorf("failed to search categories: %w", err)
	}

	var responses []*model.CategoryResponse
	for _, cat := range categories {
		responses = append(responses, mapCategoryToResponse(cat.ID, cat.Name, cat.NameI18n, cat.DepartmentID, cat.StorageID, cat.Parent, cat.PictureUrl, cat.ColorCode, cat.CreatedAt, cat.UpdatedAt))
	}
	return responses, nil
}
