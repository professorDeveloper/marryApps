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

type StorageS struct {
	repo *repository.Repository
}

func NewStorageS(repo *repository.Repository) *StorageS {
	return &StorageS{repo: repo}
}

func (s *StorageS) getTenantMutationQueries(ctx context.Context) (*pg.Queries, context.Context, pgx.Tx, bool, error) {
	if existingTx, ok := repository.TenantTxFromContext(ctx); ok && existingTx != nil {
		if q, ok := repository.TenantQueriesFromContext(ctx); ok && q != nil {
			return q, ctx, existingTx, false, nil
		}
		q := pg.New(existingTx)
		txCtx := repository.WithTenantQueries(ctx, q)
		return q, txCtx, existingTx, false, nil
	}

	tx, err := s.repo.PgRepo.TenantPool.Begin(ctx)
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

// Helper function

// Generic function to map any storage row to response
func mapStorageToResponse(id uuid.UUID, name string, branchID pgtype.UUID, nameI18n pgtype.UUID, pictureUrl *string, colorCode *string, createdAt, updatedAt pgtype.Timestamptz) *model.StorageResponse {
	return &model.StorageResponse{
		ID:         id.String(),
		Name:       &name,
		BranchID:   branchID.String(),
		NameI18n:   uuidToStr(nameI18n),
		PictureUrl: pictureUrl,
		ColorCode:  colorCode,
		CreatedAt:  timestampToTime(createdAt),
		UpdatedAt:  timestampToTime(updatedAt),
	}
}

// CreateStorage creates a new storage
func (s *StorageS) CreateStorage(ctx context.Context, name string, branchID string, nameI18n *uuid.UUID, pictureUrl *string, colorCode *string) (*model.StorageResponse, error) {
	q, txCtx, tx, ownsTx, err := s.getTenantMutationQueries(ctx)
	if err != nil {
		return nil, err
	}
	if ownsTx {
		defer tx.Rollback(ctx)
	}

	if name == "" {
		return nil, fmt.Errorf("storage name is required")
	}
	bID, err := resolveBranchUUID(ctx, branchID)
	if err != nil {
		return nil, err
	}

	nameI18nUUID := pgtype.UUID{}
	if nameI18n != nil {
		nameI18nUUID = pgtype.UUID{Bytes: *nameI18n, Valid: true}
	}

	storage, err := q.CreateStorage(txCtx, pg.CreateStorageParams{
		ID:         uuid.New(),
		Name:       name,
		BranchID:   pgtype.UUID{Bytes: bID, Valid: true},
		NameI18n:   nameI18nUUID,
		PictureUrl: pictureUrl,
		ColorCode:  colorCode,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to create storage: %w", err)
	}

	if ownsTx {
		if err := tx.Commit(ctx); err != nil {
			return nil, fmt.Errorf("failed to commit transaction: %w", err)
		}
	}

	return mapStorageToResponse(storage.ID, storage.Name, storage.BranchID, storage.NameI18n, storage.PictureUrl, storage.ColorCode, storage.CreatedAt, storage.UpdatedAt), nil
}

// GetStorageByID retrieves a storage by ID
func (s *StorageS) GetStorageByID(ctx context.Context, storageID string) (*model.StorageResponse, error) {
	id, err := uuid.Parse(storageID)
	if err != nil {
		return nil, fmt.Errorf("invalid storage ID: %w", err)
	}

	var storage pg.Storage
	err = withTenantRead(ctx, s.repo, func(ctx context.Context, q *pg.Queries) error {
		var err error
		storage, err = q.GetStorageByID(ctx, id)
		if err != nil {
			return fmt.Errorf("failed to get storage: %w", err)
		}
		return nil
	})
	if err != nil {
		return nil, err
	}

	return mapStorageToResponse(storage.ID, storage.Name, storage.BranchID, storage.NameI18n, storage.PictureUrl, storage.ColorCode, storage.CreatedAt, storage.UpdatedAt), nil
}

func (s *StorageS) GetAllStorages(ctx context.Context, filter model.StorageListFilter, limit, offset int32) ([]*model.StorageResponse, int64, error) {
	if filter.SortBy == "" {
		filter.SortBy = "created_at"
	}
	if filter.SortOrder == "" {
		filter.SortOrder = "desc"
	}

	var rows []pg.Storage
	var total int64
	err := withTenantRead(ctx, s.repo, func(ctx context.Context, q *pg.Queries) error {
		var err error
		total, err = q.CountStorages(ctx, filter.Search)
		if err != nil {
			log.Printf("CountStorages failed: %v", err)
			return fmt.Errorf("failed to count storages: %w", err)
		}

		rows, err = q.GetAllStorages(ctx, pg.GetAllStoragesParams{
			Search:    filter.Search,
			SortBy:    filter.SortBy,
			SortOrder: filter.SortOrder,
			Limit:     limit,
			Offset:    offset,
		})
		if err != nil {
			log.Printf("GetAllStorages failed: %v", err)
			return fmt.Errorf("failed to retrieve storages: %w", err)
		}
		return nil
	})
	if err != nil {
		return nil, 0, err
	}

	var responses []*model.StorageResponse
	for _, row := range rows {
		responses = append(responses, mapStorageToResponse(
			row.ID,
			row.Name,
			row.BranchID,
			row.NameI18n,
			row.PictureUrl,
			row.ColorCode,
			row.CreatedAt,
			row.UpdatedAt,
		))
	}

	return responses, total, nil
}

// GetStoragesByBranchID retrieves storages by branch ID
func (s *StorageS) GetStoragesByBranchID(ctx context.Context, branchID string, limit, offset int32) ([]model.StorageResponse, int32, error) {
	bID, err := uuid.Parse(branchID)
	if err != nil {
		return nil, 0, fmt.Errorf("invalid branch ID: %w", err)
	}

	var storages []pg.Storage
	var total int64
	err = withTenantRead(ctx, s.repo, func(ctx context.Context, q *pg.Queries) error {
		var err error
		total, err = q.CountStoragesByBranch(ctx, pgtype.UUID{Bytes: bID, Valid: true})
		if err != nil {
			return fmt.Errorf("failed to count storages by branch: %w", err)
		}

		storages, err = q.GetStoragesByBranchID(ctx, pg.GetStoragesByBranchIDParams{
			BranchID: pgtype.UUID{Bytes: bID, Valid: true},
			Limit:    limit,
			Offset:   offset,
		})
		if err != nil {
			return fmt.Errorf("failed to get storages by branch: %w", err)
		}
		return nil
	})
	if err != nil {
		return nil, 0, err
	}

	var responses []model.StorageResponse
	for _, str := range storages {
		responses = append(responses, *mapStorageToResponse(str.ID, str.Name, str.BranchID, str.NameI18n, str.PictureUrl, str.ColorCode, str.CreatedAt, str.UpdatedAt))
	}

	return responses, int32(total), nil
}

// UpdateStorage updates a storage
func (s *StorageS) UpdateStorage(ctx context.Context, storageID string, name *string, branchID *string, nameI18n *string, pictureUrl *string, colorCode *string, uz *string, ru *string, en *string) (*model.StorageResponse, error) {
	q, txCtx, tx, ownsTx, err := s.getTenantMutationQueries(ctx)
	if err != nil {
		return nil, err
	}
	if ownsTx {
		defer tx.Rollback(ctx)
	}

	id, err := uuid.Parse(storageID)
	if err != nil {
		return nil, fmt.Errorf("invalid storage ID: %w", err)
	}

	// Get current storage to use as default
	currentStorage, err := q.GetStorageByID(txCtx, id)
	if err != nil {
		return nil, fmt.Errorf("failed to get storage: %w", err)
	}

	updatedName := currentStorage.Name
	if name != nil && *name != "" {
		updatedName = *name
	}

	updatedBranchID := currentStorage.BranchID
	if err := validateBranchOverride(ctx, branchID); err != nil {
		return nil, err
	}
	if branchID != nil && *branchID != "" {
		bID, err := uuid.Parse(*branchID)
		if err != nil {
			return nil, fmt.Errorf("invalid branch ID: %w", err)
		}
		updatedBranchID = pgtype.UUID{Bytes: bID, Valid: true}
	}

	updatedNameI18n := currentStorage.NameI18n
	if nameI18n != nil && *nameI18n != "" {
		uuid, err := uuid.Parse(*nameI18n)
		if err != nil {
			return nil, fmt.Errorf("invalid name_i18n UUID: %w", err)
		}
		updatedNameI18n = pgtype.UUID{Bytes: uuid, Valid: true}
	}

	updatedPictureUrl := currentStorage.PictureUrl
	if pictureUrl != nil {
		updatedPictureUrl = pictureUrl
	}

	updatedColorCode := currentStorage.ColorCode
	if colorCode != nil {
		updatedColorCode = colorCode
	}

	storage, err := q.UpdateStorage(txCtx, pg.UpdateStorageParams{
		ID:         id,
		Name:       updatedName,
		BranchID:   updatedBranchID,
		NameI18n:   updatedNameI18n,
		PictureUrl: updatedPictureUrl,
		ColorCode:  updatedColorCode,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to update storage: %w", err)
	}

	// Update translation fields if provided
	var finalUz, finalRu, finalEn *string
	if uz != nil || ru != nil || en != nil {
		if storage.NameI18n.Valid {
			tr, trErr := q.UpdateTranslation(txCtx, pg.UpdateTranslationParams{
				ID: storage.NameI18n.Bytes,
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
			storage, err = q.UpdateStorage(txCtx, pg.UpdateStorageParams{
				ID:         id,
				Name:       storage.Name,
				BranchID:   storage.BranchID,
				NameI18n:   pgtype.UUID{Bytes: translationID, Valid: true},
				PictureUrl: storage.PictureUrl,
				ColorCode:  storage.ColorCode,
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

	resp := mapStorageToResponse(storage.ID, storage.Name, storage.BranchID, storage.NameI18n, storage.PictureUrl, storage.ColorCode, storage.CreatedAt, storage.UpdatedAt)
	resp.Uz = finalUz
	resp.Ru = finalRu
	resp.En = finalEn
	return resp, nil
}

// DeleteStorage soft deletes a storage
func (s *StorageS) DeleteStorage(ctx context.Context, storageID string) error {
	q, txCtx, tx, ownsTx, err := s.getTenantMutationQueries(ctx)
	if err != nil {
		return err
	}
	if ownsTx {
		defer tx.Rollback(ctx)
	}

	id, err := uuid.Parse(storageID)
	if err != nil {
		return fmt.Errorf("invalid storage ID: %w", err)
	}

	if err := q.DeleteStorage(txCtx, id); err != nil {
		return fmt.Errorf("failed to delete storage: %w", err)
	}

	if ownsTx {
		if err := tx.Commit(ctx); err != nil {
			return fmt.Errorf("failed to commit transaction: %w", err)
		}
	}

	return nil
}

// RestoreStorage restores a deleted storage
func (s *StorageS) RestoreStorage(ctx context.Context, storageID string) error {
	q, txCtx, tx, ownsTx, err := s.getTenantMutationQueries(ctx)
	if err != nil {
		return err
	}
	if ownsTx {
		defer tx.Rollback(ctx)
	}

	id, err := uuid.Parse(storageID)
	if err != nil {
		return fmt.Errorf("invalid storage ID: %w", err)
	}

	if err := q.RestoreStorage(txCtx, id); err != nil {
		return fmt.Errorf("failed to restore storage: %w", err)
	}

	if ownsTx {
		if err := tx.Commit(ctx); err != nil {
			return fmt.Errorf("failed to commit transaction: %w", err)
		}
	}

	return nil
}

// GetStorageByIDWithLang retrieves storage by ID with language support
func (s *StorageS) GetStorageByIDWithLang(ctx context.Context, storageID string, lang string) (*model.StorageResponse, error) {
	id, err := uuid.Parse(storageID)
	if err != nil {
		return nil, fmt.Errorf("invalid storage ID: %w", err)
	}

	var storage pg.Storage
	err = withTenantRead(ctx, s.repo, func(ctx context.Context, q *pg.Queries) error {
		var err error
		storage, err = q.GetStorageByIDWithLanguage(ctx, pg.GetStorageByIDWithLanguageParams{
			ID:      id,
			Column2: lang,
		})
		if err != nil {
			return fmt.Errorf("failed to get storage: %w", err)
		}
		return nil
	})
	if err != nil {
		return nil, err
	}

	return mapStorageToResponse(storage.ID, storage.Name, storage.BranchID, storage.NameI18n, storage.PictureUrl, storage.ColorCode, storage.CreatedAt, storage.UpdatedAt), nil
}

// GetAllStoragesWithLang retrieves all storages with language support
func (s *StorageS) GetAllStoragesWithLang(ctx context.Context, lang string, limit, offset int32) ([]model.StorageResponse, int32, error) {
	var storages []pg.Storage
	var total int64
	err := withTenantRead(ctx, s.repo, func(ctx context.Context, q *pg.Queries) error {
		var err error
		total, err = q.CountStorages(ctx, "")
		if err != nil {
			return fmt.Errorf("failed to count storages: %w", err)
		}

		storages, err = q.GetAllStoragesWithLanguage(ctx, pg.GetAllStoragesWithLanguageParams{
			Column1: lang,
			Limit:   limit,
			Offset:  offset,
		})
		if err != nil {
			return fmt.Errorf("failed to get storages: %w", err)
		}
		return nil
	})
	if err != nil {
		return nil, 0, err
	}

	var responses []model.StorageResponse
	for _, str := range storages {
		responses = append(responses, *mapStorageToResponse(
			str.ID,
			str.Name,
			str.BranchID,
			str.NameI18n,
			str.PictureUrl,
			str.ColorCode,
			str.CreatedAt,
			str.UpdatedAt,
		))
	}

	return responses, int32(total), nil
}
