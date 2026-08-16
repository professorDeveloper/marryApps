package service

import (
	"context"
	"fmt"
	"log"
	"strings"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"gitlab.yurtal.tech/company/maryai/back/internal/model"
	"gitlab.yurtal.tech/company/maryai/back/internal/repository"
	pg "gitlab.yurtal.tech/company/maryai/back/internal/repository/pg/tenantsdb"
)

func mapDepartmentToResponse(id uuid.UUID, name string, nameI18n, storageID pgtype.UUID, colorCode, pictureUrl *string, createdAt, updatedAt pgtype.Timestamptz) *model.DepartmentResponse {
	return &model.DepartmentResponse{
		ID:         id.String(),
		Name:       &name,
		NameI18n:   uuidToStr(nameI18n),
		ColorCode:  colorCode,
		PictureUrl: pictureUrl,
		StorageID:  storageID.String(),
		CreatedAt:  timestampToTime(createdAt),
		UpdatedAt:  timestampToTime(updatedAt),
	}
}

type DepartmentS struct {
	repo *repository.Repository
}

func NewDepartmentS(repo *repository.Repository) *DepartmentS {
	return &DepartmentS{repo: repo}
}

func (d *DepartmentS) getTenantMutationQueries(ctx context.Context) (*pg.Queries, context.Context, pgx.Tx, bool, error) {
	if existingTx, ok := repository.TenantTxFromContext(ctx); ok && existingTx != nil {
		if q, ok := repository.TenantQueriesFromContext(ctx); ok && q != nil {
			return q, ctx, existingTx, false, nil
		}
		q := pg.New(existingTx)
		txCtx := repository.WithTenantQueries(ctx, q)
		return q, txCtx, existingTx, false, nil
	}

	tx, err := d.repo.PgRepo.TenantPool.Begin(ctx)
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

func (d *DepartmentS) CreateDepartment(ctx context.Context, name string, nameI18n, colorCode, pictureUrl *string, storageID *string) (*model.DepartmentResponse, error) {
	q, txCtx, tx, ownsTx, err := d.getTenantMutationQueries(ctx)
	if err != nil {
		return nil, err
	}
	if ownsTx {
		defer tx.Rollback(ctx)
	}

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

	department, err := q.CreateDepartment(txCtx, pg.CreateDepartmentParams{
		ID:         uuid.New(),
		Name:       name,
		NameI18n:   nameI18nUUID,
		ColorCode:  colorCode,
		PictureUrl: pictureUrl,
		StorageID:  storageUUID,
	})
	if err != nil {
		log.Printf("CreateDepartment failed: %v", err)
		return nil, fmt.Errorf("failed to create department: %w", err)
	}

	if ownsTx {
		if err := tx.Commit(ctx); err != nil {
			return nil, fmt.Errorf("failed to commit transaction: %w", err)
		}
	}

	return mapDepartmentToResponse(department.ID, department.Name, department.NameI18n, department.StorageID, department.ColorCode, department.PictureUrl, department.CreatedAt, department.UpdatedAt), nil
}

// GetDepartmentByID retrieves a department by ID
func (d *DepartmentS) GetDepartmentByID(ctx context.Context, departmentID string) (*model.DepartmentResponse, error) {
	id, err := uuid.Parse(departmentID)
	if err != nil {
		return nil, fmt.Errorf("invalid department ID: %w", err)
	}

	var department pg.Department
	err = withTenantRead(ctx, d.repo, func(ctx context.Context, q *pg.Queries) error {
		var err error
		department, err = q.GetDepartmentByID(ctx, id)
		if err != nil {
			if err == pgx.ErrNoRows {
				return fmt.Errorf("department not found")
			}
			log.Printf("GetDepartmentByID failed: %v", err)
			return fmt.Errorf("failed to retrieve department: %w", err)
		}
		return nil
	})
	if err != nil {
		return nil, err
	}

	return mapDepartmentToResponse(department.ID, department.Name, department.NameI18n, department.StorageID, department.ColorCode, department.PictureUrl, department.CreatedAt, department.UpdatedAt), nil
}

func (s *DepartmentS) GetAllDepartments(ctx context.Context, filter model.DepartmentListFilter, limit, offset int32) ([]*model.DepartmentResponse, int64, error) {
	if filter.SortBy == "" {
		filter.SortBy = "created_at"
	}
	if filter.SortOrder == "" {
		filter.SortOrder = "desc"
	}

	storageUUID, err := parseOptionalUUID(filter.StorageID)
	if err != nil {
		return nil, 0, fmt.Errorf("invalid storage_id: %w", err)
	}

	var rows []pg.GetAllDepartmentsRow
	var total int64
	err = withTenantRead(ctx, s.repo, func(ctx context.Context, q *pg.Queries) error {
		var err error
		total, err = q.CountDepartments(ctx, pg.CountDepartmentsParams{
			Search:    filter.Search,
			StorageID: storageUUID,
		})
		if err != nil {
			return fmt.Errorf("failed to count departments: %w", err)
		}

		rows, err = q.GetAllDepartments(ctx, pg.GetAllDepartmentsParams{
			Search:    filter.Search,
			StorageID: storageUUID,
			SortBy:    filter.SortBy,
			SortOrder: filter.SortOrder,
			Limit:     limit,
			Offset:    offset,
		})
		if err != nil {
			return fmt.Errorf("failed to get departments: %w", err)
		}
		return nil
	})
	if err != nil {
		return nil, 0, err
	}

	resp := make([]*model.DepartmentResponse, 0, len(rows))
	for _, row := range rows {
		resp = append(resp, mapDepartmentToResponse(row.ID, row.Name, row.NameI18n, row.StorageID, row.ColorCode, row.PictureUrl, row.CreatedAt, row.UpdatedAt))
	}

	return resp, total, nil
}

// GetDepartmentsByStorageID retrieves departments by storage ID
func (d *DepartmentS) GetDepartmentsByStorageID(ctx context.Context, storageID string, limit, offset int32) ([]*model.DepartmentResponse, int32, error) {
	id, err := uuid.Parse(storageID)
	if err != nil {
		return nil, 0, fmt.Errorf("invalid storage ID: %w", err)
	}

	var departments []pg.Department
	var total int64
	err = withTenantRead(ctx, d.repo, func(ctx context.Context, q *pg.Queries) error {
		var err error
		total, err = q.CountDepartmentsByStorage(ctx, pgtype.UUID{Bytes: id, Valid: true})
		if err != nil {
			return fmt.Errorf("failed to count departments: %w", err)
		}

		departments, err = q.GetDepartmentsByStorageID(ctx, pg.GetDepartmentsByStorageIDParams{
			StorageID: pgtype.UUID{Bytes: id, Valid: true},
			Limit:     limit,
			Offset:    offset,
		})
		if err != nil {
			log.Printf("GetDepartmentsByStorageID failed: %v", err)
			return fmt.Errorf("failed to retrieve departments: %w", err)
		}
		return nil
	})
	if err != nil {
		return nil, 0, err
	}

	var responses []*model.DepartmentResponse
	for _, dept := range departments {
		responses = append(responses, mapDepartmentToResponse(dept.ID, dept.Name, dept.NameI18n, dept.StorageID, dept.ColorCode, dept.PictureUrl, dept.CreatedAt, dept.UpdatedAt))
	}
	return responses, int32(total), nil
}

// UpdateDepartment updates a department
func (d *DepartmentS) UpdateDepartment(ctx context.Context, departmentID string, name *string, nameI18n *string, colorCode *string, pictureUrl *string, storageID *string, uz *string, ru *string, en *string) (*model.DepartmentResponse, error) {
	q, txCtx, tx, ownsTx, err := d.getTenantMutationQueries(ctx)
	if err != nil {
		return nil, err
	}
	if ownsTx {
		defer tx.Rollback(ctx)
	}

	id, err := uuid.Parse(departmentID)
	if err != nil {
		return nil, fmt.Errorf("invalid department ID: %w", err)
	}

	// Get existing department
	existing, err := q.GetDepartmentByID(txCtx, id)
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

	finalPictureUrl := existing.PictureUrl
	if pictureUrl != nil {
		finalPictureUrl = pictureUrl
	}

	finalStorageID := existing.StorageID
	if storageID != nil && *storageID != "" {
		storageUUID, err := uuid.Parse(*storageID)
		if err != nil {
			return nil, fmt.Errorf("invalid storage_id: %w", err)
		}
		finalStorageID = pgtype.UUID{Bytes: storageUUID, Valid: true}
	}

	department, err := q.UpdateDepartment(txCtx, pg.UpdateDepartmentParams{
		ID:         id,
		Name:       finalName,
		NameI18n:   finalNameI18n,
		ColorCode:  finalColorCode,
		PictureUrl: finalPictureUrl,
		StorageID:  finalStorageID,
	})
	if err != nil {
		log.Printf("UpdateDepartment failed: %v", err)
		return nil, fmt.Errorf("failed to update department: %w", err)
	}

	// Update translation fields if provided
	var finalUz, finalRu, finalEn *string
	if uz != nil || ru != nil || en != nil {
		if department.NameI18n.Valid {
			tr, trErr := q.UpdateTranslation(txCtx, pg.UpdateTranslationParams{
				ID: department.NameI18n.Bytes,
				Uz: uz,
				Ru: ru,
				En: en,
			})
			if trErr != nil {
				return nil, fmt.Errorf("failed to update translation: %w", trErr)
			}
			finalUz, finalRu, finalEn = tr.Uz, tr.Ru, tr.En
		} else {
			translationID := uuid.New()
			tr, trErr := q.CreateTranslation(txCtx, pg.CreateTranslationParams{
				ID: translationID,
				Uz: uz,
				Ru: ru,
				En: en,
			})
			if trErr != nil {
				return nil, fmt.Errorf("failed to create translation: %w", trErr)
			}
			finalUz, finalRu, finalEn = tr.Uz, tr.Ru, tr.En
			department, err = q.UpdateDepartment(txCtx, pg.UpdateDepartmentParams{
				ID:         id,
				Name:       department.Name,
				NameI18n:   pgtype.UUID{Bytes: translationID, Valid: true},
				ColorCode:  department.ColorCode,
				PictureUrl: department.PictureUrl,
				StorageID:  department.StorageID,
			})
			if err != nil {
				return nil, fmt.Errorf("failed to link translation: %w", err)
			}
		}
	}

	if ownsTx {
		if err := tx.Commit(ctx); err != nil {
			return nil, fmt.Errorf("failed to commit transaction: %w", err)
		}
	}

	resp := mapDepartmentToResponse(department.ID, department.Name, department.NameI18n, department.StorageID, department.ColorCode, department.PictureUrl, department.CreatedAt, department.UpdatedAt)
	resp.Uz = finalUz
	resp.Ru = finalRu
	resp.En = finalEn
	return resp, nil
}

// DeleteDepartment soft deletes a department
func (d *DepartmentS) DeleteDepartment(ctx context.Context, departmentID string) error {
	q, txCtx, tx, ownsTx, err := d.getTenantMutationQueries(ctx)
	if err != nil {
		return err
	}
	if ownsTx {
		defer tx.Rollback(ctx)
	}

	id, err := uuid.Parse(departmentID)
	if err != nil {
		return fmt.Errorf("invalid department ID: %w", err)
	}

	if err := q.DeleteDepartment(txCtx, id); err != nil {
		log.Printf("DeleteDepartment failed: %v", err)
		return fmt.Errorf("failed to delete department: %w", err)
	}

	if ownsTx {
		if err := tx.Commit(ctx); err != nil {
			return fmt.Errorf("failed to commit transaction: %w", err)
		}
	}

	return nil
}

// RestoreDepartment restores a soft-deleted department
func (d *DepartmentS) RestoreDepartment(ctx context.Context, departmentID string) (*model.DepartmentResponse, error) {
	q, txCtx, tx, ownsTx, err := d.getTenantMutationQueries(ctx)
	if err != nil {
		return nil, err
	}
	if ownsTx {
		defer tx.Rollback(ctx)
	}

	id, err := uuid.Parse(departmentID)
	if err != nil {
		return nil, fmt.Errorf("invalid department ID: %w", err)
	}

	if err := q.RestoreDepartment(txCtx, id); err != nil {
		log.Printf("RestoreDepartment failed: %v", err)
		return nil, fmt.Errorf("failed to restore department: %w", err)
	}

	if ownsTx {
		if err := tx.Commit(ctx); err != nil {
			return nil, fmt.Errorf("failed to commit transaction: %w", err)
		}
	}

	return d.GetDepartmentByID(ctx, departmentID)
}

// GetDepartmentByIDWithLang retrieves department by ID with language support
func (d *DepartmentS) GetDepartmentByIDWithLang(ctx context.Context, departmentID string, lang string) (*model.DepartmentResponse, error) {
	id, err := uuid.Parse(departmentID)
	if err != nil {
		return nil, fmt.Errorf("invalid department ID: %w", err)
	}

	var department pg.GetDepartmentByIDWithLanguageRow
	err = withTenantRead(ctx, d.repo, func(ctx context.Context, q *pg.Queries) error {
		var err error
		department, err = q.GetDepartmentByIDWithLanguage(ctx, pg.GetDepartmentByIDWithLanguageParams{
			ID:      id,
			Column2: lang,
		})
		if err != nil {
			log.Printf("GetDepartmentByIDWithLang failed: %v", err)
			return fmt.Errorf("failed to get department: %w", err)
		}
		return nil
	})
	if err != nil {
		return nil, err
	}

	return mapDepartmentToResponse(department.ID, department.Name, department.NameI18n, department.StorageID, department.ColorCode, department.PictureUrl, department.CreatedAt, department.UpdatedAt), nil
}

// GetAllDepartmentsWithLang retrieves all departments with language support
func (d *DepartmentS) GetAllDepartmentsWithLang(ctx context.Context, lang string, limit, offset int32) ([]model.DepartmentResponse, int32, error) {
	var departments []pg.GetAllDepartmentsWithLanguageRow
	var total int64
	err := withTenantRead(ctx, d.repo, func(ctx context.Context, q *pg.Queries) error {
		var err error
		total, err = q.CountDepartments(ctx, pg.CountDepartmentsParams{
			Search:    "",
			StorageID: pgtype.UUID{},
		})
		if err != nil {
			return fmt.Errorf("failed to count departments: %w", err)
		}

		departments, err = q.GetAllDepartmentsWithLanguage(ctx, pg.GetAllDepartmentsWithLanguageParams{
			Column1: lang,
			Limit:   limit,
			Offset:  offset,
		})
		if err != nil {
			return fmt.Errorf("failed to get departments: %w", err)
		}
		return nil
	})
	if err != nil {
		return nil, 0, err
	}

	responses := make([]model.DepartmentResponse, 0, len(departments))
	for _, dept := range departments {
		responses = append(responses, *mapDepartmentToResponse(
			dept.ID,
			dept.Name,
			dept.NameI18n,
			dept.StorageID,
			dept.ColorCode,
			dept.PictureUrl,
			dept.CreatedAt,
			dept.UpdatedAt,
		))
	}

	return responses, int32(total), nil
}
