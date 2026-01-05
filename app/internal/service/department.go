package service

import (
	"context"
	"fmt"
	"log"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"gitlab.yurtal.tech/company/maryai/back/internal/model"
	"gitlab.yurtal.tech/company/maryai/back/internal/repository"
	pg "gitlab.yurtal.tech/company/maryai/back/internal/repository/pg/tenantsdb"
)

// Generic function to map any department row to response
func mapDepartmentToResponse(id uuid.UUID, name string, nameI18n, storageID pgtype.UUID, colorCode *string, createdAt, updatedAt pgtype.Timestamptz) *model.DepartmentResponse {
	return &model.DepartmentResponse{
		ID:        id.String(),
		Name:      &name,
		NameI18n:  uuidToStr(nameI18n),
		ColorCode: colorCode,
		StorageID: storageID.String(),
		CreatedAt: timestampToTime(createdAt),
		UpdatedAt: timestampToTime(updatedAt),
	}
}

type DepartmentS struct {
	repo *repository.Repository
}

func NewDepartmentS(repo *repository.Repository) *DepartmentS {
	return &DepartmentS{repo: repo}
}

func (d *DepartmentS) CreateDepartment(ctx context.Context, name string, nameI18n, colorCode *string, storageID *string) (*model.DepartmentResponse, error) {
	if name == "" {
		return nil, fmt.Errorf("department name is required")
	}

	nameI18nUUID := pgtype.UUID{}
	if nameI18n != nil && *nameI18n != "" {
		i18nID, err := uuid.Parse(*nameI18n)
		if err != nil {
			return nil, fmt.Errorf("invalid name_i18n: %w", err)
		}
		nameI18nUUID = pgtype.UUID{Bytes: i18nID, Valid: true}
	}

	storageUUID := pgtype.UUID{}
	if storageID != nil && *storageID != "" {
		id, err := uuid.Parse(*storageID)
		if err != nil {
			return nil, fmt.Errorf("invalid storage_id: %w", err)
		}
		storageUUID = pgtype.UUID{Bytes: id, Valid: true}
	}

	department, err := d.repo.Tenant(ctx).CreateDepartment(ctx, pg.CreateDepartmentParams{
		ID:        uuid.New(),
		Name:      name,
		NameI18n:  nameI18nUUID,
		ColorCode: colorCode,
		StorageID: storageUUID,
	})
	if err != nil {
		log.Printf("CreateDepartment failed: %v", err)
		return nil, fmt.Errorf("failed to create department: %w", err)
	}

	return mapDepartmentToResponse(department.ID, department.Name, department.NameI18n, department.StorageID, department.ColorCode, department.CreatedAt, department.UpdatedAt), nil
}

// GetDepartmentByID retrieves a department by ID
func (d *DepartmentS) GetDepartmentByID(ctx context.Context, departmentID string) (*model.DepartmentResponse, error) {
	id, err := uuid.Parse(departmentID)
	if err != nil {
		return nil, fmt.Errorf("invalid department ID: %w", err)
	}

	department, err := d.repo.Tenant(ctx).GetDepartmentByID(ctx, id)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, fmt.Errorf("department not found")
		}
		log.Printf("GetDepartmentByID failed: %v", err)
		return nil, fmt.Errorf("failed to retrieve department: %w", err)
	}

	return mapDepartmentToResponse(department.ID, department.Name, department.NameI18n, department.StorageID, department.ColorCode, department.CreatedAt, department.UpdatedAt), nil
}

// GetAllDepartments retrieves all departments with pagination
func (d *DepartmentS) GetAllDepartments(ctx context.Context, limit, offset int32) ([]*model.DepartmentResponse, error) {
	departments, err := d.repo.Tenant(ctx).GetAllDepartments(ctx, pg.GetAllDepartmentsParams{
		Limit:  limit,
		Offset: offset,
	})
	if err != nil {
		log.Printf("GetAllDepartments failed: %v", err)
		return nil, fmt.Errorf("failed to retrieve departments: %w", err)
	}

	var responses []*model.DepartmentResponse
	for _, dept := range departments {
		responses = append(responses, mapDepartmentToResponse(dept.ID, dept.Name, dept.NameI18n, dept.StorageID, dept.ColorCode, dept.CreatedAt, dept.UpdatedAt))
	}
	return responses, nil
}

// GetDepartmentsByStorageID retrieves departments by storage ID
func (d *DepartmentS) GetDepartmentsByStorageID(ctx context.Context, storageID string, limit, offset int32) ([]*model.DepartmentResponse, error) {
	id, err := uuid.Parse(storageID)
	if err != nil {
		return nil, fmt.Errorf("invalid storage ID: %w", err)
	}

	departments, err := d.repo.Tenant(ctx).GetDepartmentsByStorageID(ctx, pg.GetDepartmentsByStorageIDParams{
		StorageID: pgtype.UUID{Bytes: id, Valid: true},
		Limit:     limit,
		Offset:    offset,
	})
	if err != nil {
		log.Printf("GetDepartmentsByStorageID failed: %v", err)
		return nil, fmt.Errorf("failed to retrieve departments: %w", err)
	}

	var responses []*model.DepartmentResponse
	for _, dept := range departments {
		responses = append(responses, mapDepartmentToResponse(dept.ID, dept.Name, dept.NameI18n, dept.StorageID, dept.ColorCode, dept.CreatedAt, dept.UpdatedAt))
	}
	return responses, nil
}

// UpdateDepartment updates a department
func (d *DepartmentS) UpdateDepartment(ctx context.Context, departmentID string, name *string, nameI18n *string, colorCode *string, storageID *string) (*model.DepartmentResponse, error) {
	id, err := uuid.Parse(departmentID)
	if err != nil {
		return nil, fmt.Errorf("invalid department ID: %w", err)
	}

	// Get existing department
	existing, err := d.repo.Tenant(ctx).GetDepartmentByID(ctx, id)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, fmt.Errorf("department not found")
		}
		return nil, fmt.Errorf("failed to get department: %w", err)
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

	finalColorCode := existing.ColorCode
	if colorCode != nil {
		finalColorCode = colorCode
	}

	finalStorageID := existing.StorageID
	if storageID != nil && *storageID != "" {
		storageUUID, err := uuid.Parse(*storageID)
		if err != nil {
			return nil, fmt.Errorf("invalid storage_id: %w", err)
		}
		finalStorageID = pgtype.UUID{Bytes: storageUUID, Valid: true}
	}

	department, err := d.repo.Tenant(ctx).UpdateDepartment(ctx, pg.UpdateDepartmentParams{
		ID:        id,
		Name:      finalName,
		NameI18n:  finalNameI18n,
		ColorCode: finalColorCode,
		StorageID: finalStorageID,
	})
	if err != nil {
		log.Printf("UpdateDepartment failed: %v", err)
		return nil, fmt.Errorf("failed to update department: %w", err)
	}

	return mapDepartmentToResponse(department.ID, department.Name, department.NameI18n, department.StorageID, department.ColorCode, department.CreatedAt, department.UpdatedAt), nil
}

// DeleteDepartment soft deletes a department
func (d *DepartmentS) DeleteDepartment(ctx context.Context, departmentID string) error {
	id, err := uuid.Parse(departmentID)
	if err != nil {
		return fmt.Errorf("invalid department ID: %w", err)
	}

	if err := d.repo.Tenant(ctx).DeleteDepartment(ctx, id); err != nil {
		log.Printf("DeleteDepartment failed: %v", err)
		return fmt.Errorf("failed to delete department: %w", err)
	}
	return nil
}

// RestoreDepartment restores a soft-deleted department
func (d *DepartmentS) RestoreDepartment(ctx context.Context, departmentID string) (*model.DepartmentResponse, error) {
	id, err := uuid.Parse(departmentID)
	if err != nil {
		return nil, fmt.Errorf("invalid department ID: %w", err)
	}

	if err := d.repo.Tenant(ctx).RestoreDepartment(ctx, id); err != nil {
		log.Printf("RestoreDepartment failed: %v", err)
		return nil, fmt.Errorf("failed to restore department: %w", err)
	}

	return d.GetDepartmentByID(ctx, departmentID)
}

// SearchDepartments searches for departments by name
func (d *DepartmentS) SearchDepartments(ctx context.Context, query string, limit, offset int32) ([]*model.DepartmentResponse, error) {
	if query == "" {
		return nil, fmt.Errorf("search query is required")
	}

	q := query
	departments, err := d.repo.Tenant(ctx).SearchDepartments(ctx, pg.SearchDepartmentsParams{
		Column1: &q,
		Limit:   limit,
		Offset:  offset,
	})
	if err != nil {
		log.Printf("SearchDepartments failed: %v", err)
		return nil, fmt.Errorf("failed to search departments: %w", err)
	}

	var responses []*model.DepartmentResponse
	for _, dept := range departments {
		responses = append(responses, mapDepartmentToResponse(dept.ID, dept.Name, dept.NameI18n, dept.StorageID, dept.ColorCode, dept.CreatedAt, dept.UpdatedAt))
	}
	return responses, nil
}

// Helper function to convert database department to response model
