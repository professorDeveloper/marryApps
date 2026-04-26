package service

import (
	"context"
	"fmt"

	"gitlab.yurtal.tech/company/maryai/back/internal/model"
	"gitlab.yurtal.tech/company/maryai/back/internal/repository"
	pg "gitlab.yurtal.tech/company/maryai/back/internal/repository/pg/tenantsdb"
)

type MetadataI interface {
	GetMetadata(ctx context.Context, entities []string, whitelist map[string]string) (map[string][]model.MetadataItem, error)
}

type MetadataS struct {
	repo *repository.Repository
}

func NewMetadataS(repo *repository.Repository) MetadataI {
	return &MetadataS{repo: repo}
}

func (s *MetadataS) GetMetadata(ctx context.Context, entities []string, whitelist map[string]string) (map[string][]model.MetadataItem, error) {
	result := make(map[string][]model.MetadataItem)

	err := withTenantRead(ctx, s.repo, func(ctx context.Context, q *pg.Queries) error {
		for _, entity := range entities {
			tableName, ok := whitelist[entity]
			if !ok {
				continue
			}

			items, err := q.GetMetadata(ctx, tableName)
			if err != nil {
				return fmt.Errorf("failed to get metadata for %s: %w", entity, err)
			}

			result[entity] = items
		}
		return nil
	})
	if err != nil {
		return nil, err
	}

	return result, nil
}
