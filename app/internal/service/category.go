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

type CategoryS struct {
	repo *repository.Repository
}

func NewCategoryS(repo *repository.Repository) *CategoryS {
	return &CategoryS{repo: repo}
}

func (c *CategoryS) CreateCategory(ctx context.Context, name string, nameI18n, departmentID, storageID, parent *string, pictureUrl *string) (*model.CategoryResponse, error) {
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
	})
	if err != nil {
		log.Printf("CreateCategory failed: %v", err)
		return nil, fmt.Errorf("failed to create category: %w", err)
	}

	return toCategoryResponse(category), nil
}

// GetCategoryByID retrieves a category by ID
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

	return toCategoryResponse(category), nil
}

// GetAllCategories retrieves all categories with pagination
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
		responses = append(responses, toCategoryResponse(cat))
	}
	return responses, nil
}

// GetCategoriesByDepartmentID retrieves categories by department ID
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
		responses = append(responses, toCategoryResponse(cat))
	}
	return responses, nil
}

// GetCategoriesByStorageID retrieves categories by storage ID
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
		responses = append(responses, toCategoryResponse(cat))
	}
	return responses, nil
}

// GetCategoriesByParentID retrieves subcategories by parent ID
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
		responses = append(responses, toCategoryResponse(cat))
	}
	return responses, nil
}

// GetRootCategories retrieves root categories (no parent)
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
		responses = append(responses, toCategoryResponse(cat))
	}
	return responses, nil
}

// UpdateCategory updates a category
func (c *CategoryS) UpdateCategory(ctx context.Context, categoryID string, name, nameI18n, departmentID, storageID, parent *string, pictureUrl *string) (*model.CategoryResponse, error) {
	id, err := uuid.Parse(categoryID)
	if err != nil {
		return nil, fmt.Errorf("invalid category ID: %w", err)
	}

	// Get existing category
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

	category, err := c.repo.Tenant(ctx).UpdateCategory(ctx, pg.UpdateCategoryParams{
		ID:           id,
		Name:         finalName,
		NameI18n:     finalNameI18n,
		DepartmentID: finalDeptID,
		StorageID:    finalStorageID,
		Parent:       finalParent,
		PictureUrl:   finalPictureUrl,
	})
	if err != nil {
		log.Printf("UpdateCategory failed: %v", err)
		return nil, fmt.Errorf("failed to update category: %w", err)
	}

	return toCategoryResponse(category), nil
}

// DeleteCategory soft deletes a category
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

// RestoreCategory restores a soft-deleted category
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

// SearchCategories searches for categories by name
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
		responses = append(responses, toCategoryResponse(cat))
	}
	return responses, nil
}

// Helper function to convert database category to response model
func toCategoryResponse(cat pg.Category) *model.CategoryResponse {
	var nameI18nStr *string
	if cat.NameI18n.Valid {
		str := cat.NameI18n.String()
		nameI18nStr = &str
	}

	var deptIDStr *string
	if cat.DepartmentID.Valid {
		str := cat.DepartmentID.String()
		deptIDStr = &str
	}

	var storageIDStr *string
	if cat.StorageID.Valid {
		str := cat.StorageID.String()
		storageIDStr = &str
	}

	var parentStr *string
	if cat.Parent.Valid {
		str := cat.Parent.String()
		parentStr = &str
	}

	var createdAt *time.Time
	if cat.CreatedAt.Valid {
		createdAt = &cat.CreatedAt.Time
	}

	var updatedAt *time.Time
	if cat.UpdatedAt.Valid {
		updatedAt = &cat.UpdatedAt.Time
	}

	return &model.CategoryResponse{
		ID:           cat.ID.String(),
		Name:         cat.Name,
		NameI18n:     nameI18nStr,
		PictureUrl:   cat.PictureUrl,
		DepartmentID: deptIDStr,
		StorageID:    storageIDStr,
		Parent:       parentStr,
		CreatedAt:    createdAt,
		UpdatedAt:    updatedAt,
	}
}
