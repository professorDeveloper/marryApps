package service

import (
	"context"
	"fmt"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
	"gitlab.yurtal.tech/company/maryai/back/internal/model"
	"gitlab.yurtal.tech/company/maryai/back/internal/repository"
	pg "gitlab.yurtal.tech/company/maryai/back/internal/repository/pg/tenantsdb"
)

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

type StorageS struct {
	repo *repository.Repository
}

func NewStorageS(repo *repository.Repository) *StorageS {
	return &StorageS{repo: repo}
}

// CreateStorage creates a new storage
func (s *StorageS) CreateStorage(ctx context.Context, name string, branchID string, nameI18n *uuid.UUID, pictureUrl *string, colorCode *string) (*model.StorageResponse, error) {
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

	storage, err := s.repo.Tenant(ctx).CreateStorage(ctx, pg.CreateStorageParams{
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

	return mapStorageToResponse(storage.ID, storage.Name, storage.BranchID, storage.NameI18n, storage.PictureUrl, storage.ColorCode, storage.CreatedAt, storage.UpdatedAt), nil
}

// GetStorageByID retrieves a storage by ID
func (s *StorageS) GetStorageByID(ctx context.Context, storageID string) (*model.StorageResponse, error) {
	id, err := uuid.Parse(storageID)
	if err != nil {
		return nil, fmt.Errorf("invalid storage ID: %w", err)
	}

	storage, err := s.repo.Tenant(ctx).GetStorageByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("failed to get storage: %w", err)
	}

	return mapStorageToResponse(storage.ID, storage.Name, storage.BranchID, storage.NameI18n, storage.PictureUrl, storage.ColorCode, storage.CreatedAt, storage.UpdatedAt), nil
}

// GetAllStorages retrieves all storages with pagination
func (s *StorageS) GetAllStorages(ctx context.Context, limit, offset int32) ([]model.StorageResponse, error) {
	storages, err := s.repo.Tenant(ctx).GetAllStorages(ctx, pg.GetAllStoragesParams{
		Limit:  limit,
		Offset: offset,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to get storages: %w", err)
	}

	var responses []model.StorageResponse
	for _, str := range storages {
		responses = append(responses, *mapStorageToResponse(str.ID, str.Name, str.BranchID, str.NameI18n, str.PictureUrl, str.ColorCode, str.CreatedAt, str.UpdatedAt))
	}

	return responses, nil
}

// GetStoragesByBranchID retrieves storages by branch ID
func (s *StorageS) GetStoragesByBranchID(ctx context.Context, branchID string, limit, offset int32) ([]model.StorageResponse, error) {
	bID, err := uuid.Parse(branchID)
	if err != nil {
		return nil, fmt.Errorf("invalid branch ID: %w", err)
	}

	storages, err := s.repo.Tenant(ctx).GetStoragesByBranchID(ctx, pg.GetStoragesByBranchIDParams{
		BranchID: pgtype.UUID{Bytes: bID, Valid: true},
		Limit:    limit,
		Offset:   offset,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to get storages by branch: %w", err)
	}

	var responses []model.StorageResponse
	for _, str := range storages {
		responses = append(responses, *mapStorageToResponse(str.ID, str.Name, str.BranchID, str.NameI18n, str.PictureUrl, str.ColorCode, str.CreatedAt, str.UpdatedAt))
	}

	return responses, nil
}

// UpdateStorage updates a storage
func (s *StorageS) UpdateStorage(ctx context.Context, storageID string, name *string, branchID *string, nameI18n *string, pictureUrl *string, colorCode *string, uz *string, ru *string, en *string) (*model.StorageResponse, error) {
	id, err := uuid.Parse(storageID)
	if err != nil {
		return nil, fmt.Errorf("invalid storage ID: %w", err)
	}

	// Get current storage to use as default
	currentStorage, err := s.repo.Tenant(ctx).GetStorageByID(ctx, id)
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

	storage, err := s.repo.Tenant(ctx).UpdateStorage(ctx, pg.UpdateStorageParams{
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
	if uz != nil || ru != nil || en != nil {
		if storage.NameI18n.Valid {
			_, err = s.repo.Tenant(ctx).UpdateTranslation(ctx, pg.UpdateTranslationParams{
				ID: storage.NameI18n.Bytes,
				Uz: uz,
				Ru: ru,
				En: en,
			})
			if err != nil {
				return nil, fmt.Errorf("failed to update translation: %w", err)
			}
		} else {
			// Create a new translation row and link it to the storage
			translationID := uuid.New()
			_, err = s.repo.Tenant(ctx).CreateTranslation(ctx, pg.CreateTranslationParams{
				ID: translationID,
				Uz: uz,
				Ru: ru,
				En: en,
			})
			if err != nil {
				return nil, fmt.Errorf("failed to create translation: %w", err)
			}
			storage, err = s.repo.Tenant(ctx).UpdateStorage(ctx, pg.UpdateStorageParams{
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

	return mapStorageToResponse(storage.ID, storage.Name, storage.BranchID, storage.NameI18n, storage.PictureUrl, storage.ColorCode, storage.CreatedAt, storage.UpdatedAt), nil
}

// DeleteStorage soft deletes a storage
func (s *StorageS) DeleteStorage(ctx context.Context, storageID string) error {
	id, err := uuid.Parse(storageID)
	if err != nil {
		return fmt.Errorf("invalid storage ID: %w", err)
	}

	if err := s.repo.Tenant(ctx).DeleteStorage(ctx, id); err != nil {
		return fmt.Errorf("failed to delete storage: %w", err)
	}

	return nil
}

// RestoreStorage restores a deleted storage
func (s *StorageS) RestoreStorage(ctx context.Context, storageID string) error {
	id, err := uuid.Parse(storageID)
	if err != nil {
		return fmt.Errorf("invalid storage ID: %w", err)
	}

	if err := s.repo.Tenant(ctx).RestoreStorage(ctx, id); err != nil {
		return fmt.Errorf("failed to restore storage: %w", err)
	}

	return nil
}

// SearchStorages searches storages by name
func (s *StorageS) SearchStorages(ctx context.Context, query string, limit, offset int32) ([]model.StorageResponse, error) {
	storages, err := s.repo.Tenant(ctx).SearchStorages(ctx, pg.SearchStoragesParams{
		Column1: &query,
		Limit:   limit,
		Offset:  offset,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to search storages: %w", err)
	}

	var responses []model.StorageResponse
	for _, str := range storages {
		responses = append(responses, *mapStorageToResponse(str.ID, str.Name, str.BranchID, str.NameI18n, str.PictureUrl, str.ColorCode, str.CreatedAt, str.UpdatedAt))
	}

	return responses, nil
}

// GetStorageByIDWithLang retrieves storage by ID with language support
func (s *StorageS) GetStorageByIDWithLang(ctx context.Context, storageID string, lang string) (*model.StorageResponse, error) {
	id, err := uuid.Parse(storageID)
	if err != nil {
		return nil, fmt.Errorf("invalid storage ID: %w", err)
	}

	storage, err := s.repo.Tenant(ctx).GetStorageByIDWithLanguage(ctx, pg.GetStorageByIDWithLanguageParams{
		ID:      id,
		Column2: lang,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to get storage: %w", err)
	}

	return mapStorageToResponse(storage.ID, storage.Name, storage.BranchID, storage.NameI18n, storage.PictureUrl, storage.ColorCode, storage.CreatedAt, storage.UpdatedAt), nil
}

// GetAllStoragesWithLang retrieves all storages with language support
func (s *StorageS) GetAllStoragesWithLang(ctx context.Context, lang string, limit, offset int32) ([]model.StorageResponse, error) {
	storages, err := s.repo.Tenant(ctx).GetAllStoragesWithLanguage(ctx, pg.GetAllStoragesWithLanguageParams{
		Column1: lang,
		Limit:   limit,
		Offset:  offset,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to get storages: %w", err)
	}

	var responses []model.StorageResponse
	for _, str := range storages {
		responses = append(responses, *mapStorageToResponse(str.ID, str.Name, str.BranchID, str.NameI18n, str.PictureUrl, str.ColorCode, str.CreatedAt, str.UpdatedAt))
	}

	return responses, nil
}

// Helper function
