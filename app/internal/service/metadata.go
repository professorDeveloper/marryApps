package service

import (
	"context"

	"gitlab.yurtal.tech/company/maryai/back/internal/model"
	"gitlab.yurtal.tech/company/maryai/back/internal/repository"
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

	for _, entity := range entities {
		tableName, ok := whitelist[entity]
		if !ok {
			continue
		}

		items, err := s.repo.Tenant(ctx).GetMetadata(ctx, tableName)
		if err != nil {
			return nil, err
		}

		result[entity] = items
	}

	return result, nil
}
