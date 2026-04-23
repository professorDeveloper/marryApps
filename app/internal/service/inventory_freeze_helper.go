package service

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"gitlab.yurtal.tech/company/maryai/back/internal/repository"
)

func getLastActiveInventoryLockTimestamp(ctx context.Context, repo *repository.Repository, storageID uuid.UUID) (*time.Time, error) {
	row, err := repo.Tenant(ctx).GetLastActiveInventoryByStorage(ctx, storageID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to get last active inventory for storage %s: %w", storageID.String(), err)
	}

	if row.CountedAt.IsZero() {
		return nil, nil
	}

	return &row.CountedAt, nil
}

func assertCanMutateAfterInventory(ctx context.Context, repo *repository.Repository, storageID uuid.UUID, effectiveAt time.Time, entityName string) error {
	lockTimestamp, err := getLastActiveInventoryLockTimestamp(ctx, repo, storageID)
	if err != nil {
		return err
	}
	if lockTimestamp == nil {
		return nil
	}

	// Compare timestamps directly without normalization
	if !effectiveAt.After(*lockTimestamp) {
		return fmt.Errorf("%s is locked by active inventory counted at %s", entityName, lockTimestamp.Format(time.RFC3339))
	}

	return nil
}

func assertCanMutateInventorySnapshot(ctx context.Context, repo *repository.Repository, storageID uuid.UUID, inventoryID uuid.UUID, countedAt time.Time, entityName string) error {
	hasNewer, err := repo.Tenant(ctx).HasNewerActiveInventoryByStorage(ctx, storageID, inventoryID, countedAt)
	if err != nil {
		return fmt.Errorf("failed to check newer active inventory for %s: %w", entityName, err)
	}
	if hasNewer {
		return fmt.Errorf("%s is locked by a newer active inventory", entityName)
	}
	return nil
}
