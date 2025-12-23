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

type DepartmentS struct {
	repo *repository.Repository
}

func NewDepartmentS(repo *repository.Repository) *DepartmentS {
	return &DepartmentS{repo: repo}
}

func (d *DepartmentS) CreateDepartment(ctx context.Context, name string, nameI18n *string, storageID *string) (*model.DepartmentResponse, error) {
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

	department, err := d.repo.PgRepo.Repo.CreateDepartment(ctx, pg.CreateDepartmentParams{
		ID:        uuid.New(),
		Name:      name,
		NameI18n:  nameI18nUUID,
		StorageID: storageUUID,
	})
	if err != nil {
		log.Printf("CreateDepartment failed: %v", err)
		return nil, fmt.Errorf("failed to create department: %w", err)
	}

	return toDepartmentResponse(department), nil
}

// GetDepartmentByID retrieves a department by ID
func (d *DepartmentS) GetDepartmentByID(ctx context.Context, departmentID string) (*model.DepartmentResponse, error) {
	id, err := uuid.Parse(departmentID)
	if err != nil {
		return nil, fmt.Errorf("invalid department ID: %w", err)
	}

	department, err := d.repo.PgRepo.Repo.GetDepartmentByID(ctx, id)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, fmt.Errorf("department not found")
		}
		log.Printf("GetDepartmentByID failed: %v", err)
		return nil, fmt.Errorf("failed to retrieve department: %w", err)
	}

	return toDepartmentResponse(department), nil
}

// GetAllDepartments retrieves all departments with pagination
func (d *DepartmentS) GetAllDepartments(ctx context.Context, limit, offset int32) ([]*model.DepartmentResponse, error) {
	departments, err := d.repo.PgRepo.Repo.GetAllDepartments(ctx, pg.GetAllDepartmentsParams{
		Limit:  limit,
		Offset: offset,
	})
	if err != nil {
		log.Printf("GetAllDepartments failed: %v", err)
		return nil, fmt.Errorf("failed to retrieve departments: %w", err)
	}

	var responses []*model.DepartmentResponse
	for _, dept := range departments {
		responses = append(responses, toDepartmentResponse(dept))
	}
	return responses, nil
}

// GetDepartmentsByStorageID retrieves departments by storage ID
func (d *DepartmentS) GetDepartmentsByStorageID(ctx context.Context, storageID string, limit, offset int32) ([]*model.DepartmentResponse, error) {
	id, err := uuid.Parse(storageID)
	if err != nil {
		return nil, fmt.Errorf("invalid storage ID: %w", err)
	}

	departments, err := d.repo.PgRepo.Repo.GetDepartmentsByStorageID(ctx, pg.GetDepartmentsByStorageIDParams{
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
		responses = append(responses, toDepartmentResponse(dept))
	}
	return responses, nil
}

// UpdateDepartment updates a department
func (d *DepartmentS) UpdateDepartment(ctx context.Context, departmentID string, name *string, nameI18n *string, storageID *string) (*model.DepartmentResponse, error) {
	id, err := uuid.Parse(departmentID)
	if err != nil {
		return nil, fmt.Errorf("invalid department ID: %w", err)
	}

	// Get existing department
	existing, err := d.repo.PgRepo.Repo.GetDepartmentByID(ctx, id)
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

	finalStorageID := existing.StorageID
	if storageID != nil && *storageID != "" {
		storageUUID, err := uuid.Parse(*storageID)
		if err != nil {
			return nil, fmt.Errorf("invalid storage_id: %w", err)
		}
		finalStorageID = pgtype.UUID{Bytes: storageUUID, Valid: true}
	}

	department, err := d.repo.PgRepo.Repo.UpdateDepartment(ctx, pg.UpdateDepartmentParams{
		ID:        id,
		Name:      finalName,
		NameI18n:  finalNameI18n,
		StorageID: finalStorageID,
	})
	if err != nil {
		log.Printf("UpdateDepartment failed: %v", err)
		return nil, fmt.Errorf("failed to update department: %w", err)
	}

	return toDepartmentResponse(department), nil
}

// DeleteDepartment soft deletes a department
func (d *DepartmentS) DeleteDepartment(ctx context.Context, departmentID string) error {
	id, err := uuid.Parse(departmentID)
	if err != nil {
		return fmt.Errorf("invalid department ID: %w", err)
	}

	if err := d.repo.PgRepo.Repo.DeleteDepartment(ctx, id); err != nil {
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

	if err := d.repo.PgRepo.Repo.RestoreDepartment(ctx, id); err != nil {
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
	departments, err := d.repo.PgRepo.Repo.SearchDepartments(ctx, pg.SearchDepartmentsParams{
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
		responses = append(responses, toDepartmentResponse(dept))
	}
	return responses, nil
}

// Helper function to convert database department to response model
func toDepartmentResponse(dept pg.Department) *model.DepartmentResponse {
	var nameI18nStr *string
	if dept.NameI18n.Valid {
		str := dept.NameI18n.String()
		nameI18nStr = &str
	}

	storageIDStr := ""
	if dept.StorageID.Valid {
		storageIDStr = dept.StorageID.String()
	}

	var createdAt *time.Time
	if dept.CreatedAt.Valid {
		createdAt = &dept.CreatedAt.Time
	}

	var updatedAt *time.Time
	if dept.UpdatedAt.Valid {
		updatedAt = &dept.UpdatedAt.Time
	}

	name := dept.Name
	return &model.DepartmentResponse{
		ID:        dept.ID.String(),
		Name:      &name,
		NameI18n:  nameI18nStr,
		StorageID: storageIDStr,
		CreatedAt: createdAt,
		UpdatedAt: updatedAt,
	}
}
