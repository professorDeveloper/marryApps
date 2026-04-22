package service

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"gitlab.yurtal.tech/company/maryai/back/internal/repository"
)

func normalizeInventoryLockDate(t time.Time) time.Time {
	y, m, d := t.In(time.UTC).Date()
	return time.Date(y, m, d, 0, 0, 0, 0, time.UTC)
}

func getLastActiveInventoryLockDate(ctx context.Context, repo *repository.Repository, storageID uuid.UUID) (*time.Time, error) {
	row, err := repo.Tenant(ctx).GetLastActiveInventoryByStorage(ctx, storageID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to get last active inventory for storage %s: %w", storageID.String(), err)
	}

	if !row.Date.Valid {
		return nil, nil
	}

	lockDate := normalizeInventoryLockDate(row.Date.Time)
	return &lockDate, nil
}

func assertCanMutateAfterInventory(ctx context.Context, repo *repository.Repository, storageID uuid.UUID, effectiveAt time.Time, entityName string) error {
	lockDate, err := getLastActiveInventoryLockDate(ctx, repo, storageID)
	if err != nil {
		return err
	}
	if lockDate == nil {
		return nil
	}

	effectiveDate := normalizeInventoryLockDate(effectiveAt)
	if !effectiveDate.After(*lockDate) {
		return fmt.Errorf("%s is locked by active inventory dated %s", entityName, lockDate.Format("2006-01-02"))
	}

	return nil
}

func assertCanMutateInventorySnapshot(ctx context.Context, repo *repository.Repository, storageID uuid.UUID, inventoryID uuid.UUID, inventoryDate pgtype.Date, entityName string) error {
	hasNewer, err := repo.Tenant(ctx).HasNewerActiveInventoryByStorage(ctx, storageID, inventoryID, inventoryDate)
	if err != nil {
		return fmt.Errorf("failed to check newer active inventory for %s: %w", entityName, err)
	}
	if hasNewer {
		return fmt.Errorf("%s is locked by a newer active inventory", entityName)
	}
	return nil
}
