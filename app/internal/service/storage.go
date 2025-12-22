package service

import (
	"context"
	"fmt"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
	"gitlab.yurtal.tech/company/maryai/back/internal/model"
	"gitlab.yurtal.tech/company/maryai/back/internal/repository"
	"gitlab.yurtal.tech/company/maryai/back/internal/repository/pg"
)

type StorageS struct {
	repo *repository.Repository
}

func NewStorageS(repo *repository.Repository) *StorageS {
	return &StorageS{repo: repo}
}

// CreateStorage creates a new storage
func (s *StorageS) CreateStorage(ctx context.Context, name string, branchID string, nameI18n *uuid.UUID) (*model.StorageResponse, error) {
	if name == "" {
		return nil, fmt.Errorf("storage name is required")
	}
	if branchID == "" {
		return nil, fmt.Errorf("branch_id is required")
	}

	bID, err := uuid.Parse(branchID)
	if err != nil {
		return nil, fmt.Errorf("invalid branch ID: %w", err)
	}

	nameI18nUUID := pgtype.UUID{}
	if nameI18n != nil {
		nameI18nUUID = pgtype.UUID{Bytes: *nameI18n, Valid: true}
	}

	storage, err := s.repo.PgRepo.Repo.CreateStorage(ctx, pg.CreateStorageParams{
		ID:       uuid.New(),
		Name:     name,
		BranchID: pgtype.UUID{Bytes: bID, Valid: true},
		NameI18n: nameI18nUUID,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to create storage: %w", err)
	}

	return toStorageResponse(storage), nil
}

// GetStorageByID retrieves a storage by ID
func (s *StorageS) GetStorageByID(ctx context.Context, storageID string) (*model.StorageResponse, error) {
	id, err := uuid.Parse(storageID)
	if err != nil {
		return nil, fmt.Errorf("invalid storage ID: %w", err)
	}

	storage, err := s.repo.PgRepo.Repo.GetStorageByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("failed to get storage: %w", err)
	}

	return toStorageResponse(storage), nil
}

// GetAllStorages retrieves all storages with pagination
func (s *StorageS) GetAllStorages(ctx context.Context, limit, offset int32) ([]model.StorageResponse, error) {
	storages, err := s.repo.PgRepo.Repo.GetAllStorages(ctx, pg.GetAllStoragesParams{
		Limit:  limit,
		Offset: offset,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to get storages: %w", err)
	}

	var responses []model.StorageResponse
	for _, str := range storages {
		responses = append(responses, *toStorageResponse(str))
	}

	return responses, nil
}

// GetStoragesByBranchID retrieves storages by branch ID
func (s *StorageS) GetStoragesByBranchID(ctx context.Context, branchID string, limit, offset int32) ([]model.StorageResponse, error) {
	bID, err := uuid.Parse(branchID)
	if err != nil {
		return nil, fmt.Errorf("invalid branch ID: %w", err)
	}

	storages, err := s.repo.PgRepo.Repo.GetStoragesByBranchID(ctx, pg.GetStoragesByBranchIDParams{
		BranchID: pgtype.UUID{Bytes: bID, Valid: true},
		Limit:    limit,
		Offset:   offset,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to get storages by branch: %w", err)
	}

	var responses []model.StorageResponse
	for _, str := range storages {
		responses = append(responses, *toStorageResponse(str))
	}

	return responses, nil
}

// UpdateStorage updates a storage
func (s *StorageS) UpdateStorage(ctx context.Context, storageID string, name *string, branchID *string, nameI18n *string) (*model.StorageResponse, error) {
	id, err := uuid.Parse(storageID)
	if err != nil {
		return nil, fmt.Errorf("invalid storage ID: %w", err)
	}

	// Get current storage to use as default
	currentStorage, err := s.repo.PgRepo.Repo.GetStorageByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("failed to get storage: %w", err)
	}

	updatedName := currentStorage.Name
	if name != nil && *name != "" {
		updatedName = *name
	}

	updatedBranchID := currentStorage.BranchID
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

	storage, err := s.repo.PgRepo.Repo.UpdateStorage(ctx, pg.UpdateStorageParams{
		ID:       id,
		Name:     updatedName,
		BranchID: updatedBranchID,
		NameI18n: updatedNameI18n,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to update storage: %w", err)
	}

	return toStorageResponse(storage), nil
}

// DeleteStorage soft deletes a storage
func (s *StorageS) DeleteStorage(ctx context.Context, storageID string) error {
	id, err := uuid.Parse(storageID)
	if err != nil {
		return fmt.Errorf("invalid storage ID: %w", err)
	}

	if err := s.repo.PgRepo.Repo.DeleteStorage(ctx, id); err != nil {
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

	if err := s.repo.PgRepo.Repo.RestoreStorage(ctx, id); err != nil {
		return fmt.Errorf("failed to restore storage: %w", err)
	}

	return nil
}

// SearchStorages searches storages by name
func (s *StorageS) SearchStorages(ctx context.Context, query string, limit, offset int32) ([]model.StorageResponse, error) {
	storages, err := s.repo.PgRepo.Repo.SearchStorages(ctx, pg.SearchStoragesParams{
		Column1: &query,
		Limit:   limit,
		Offset:  offset,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to search storages: %w", err)
	}

	var responses []model.StorageResponse
	for _, str := range storages {
		responses = append(responses, *toStorageResponse(str))
	}

	return responses, nil
}

// Helper function
func toStorageResponse(st pg.Storage) *model.StorageResponse {
	if st.ID == uuid.Nil {
		return nil
	}

	var nameI18nStr *string
	if st.NameI18n.Valid {
		uuidStr := uuid.UUID(st.NameI18n.Bytes).String()
		nameI18nStr = &uuidStr
	}

	name := st.Name
	branchID := st.BranchID.String()

	return &model.StorageResponse{
		ID:        st.ID.String(),
		Name:      &name,
		BranchID:  branchID,
		NameI18n:  nameI18nStr,
		CreatedAt: nil,
		UpdatedAt: nil,
	}
}
