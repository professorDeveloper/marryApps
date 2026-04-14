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

type ModifierS struct {
	repo *repository.Repository
}

func NewModifierS(repo *repository.Repository) *ModifierS {
	return &ModifierS{repo: repo}
}

func mapModifierToResponse(row pg.Modifier) *model.ModifierResponse {
	return &model.ModifierResponse{
		ID:          row.ID.String(),
		Name:        row.Name,
		NameI18n:    uuidToStr(row.NameI18n),
		Description: row.Description,
		Code:        row.Code,
		IsActive:    row.IsActive,
		PictureUrl:  row.PictureUrl,
		CreatedAt:   timestampToTime(row.CreatedAt),
		UpdatedAt:   timestampToTime(row.UpdatedAt),
	}
}

func (s *ModifierS) CreateModifier(ctx context.Context, req model.CreateModifierRequest) (*model.ModifierResponse, error) {
	if strings.TrimSpace(req.Name) == "" {
		return nil, fmt.Errorf("modifier name is required")
	}

	nameI18nUUID := pgtype.UUID{}
	if req.NameI18n != nil && strings.TrimSpace(*req.NameI18n) != "" {
		i18nID, err := uuid.Parse(strings.TrimSpace(*req.NameI18n))
		if err != nil {
			return nil, fmt.Errorf("invalid name_i18n: %w", err)
		}
		nameI18nUUID = pgtype.UUID{Bytes: i18nID, Valid: true}
	}

	if req.Code != nil {
		trimmedCode := strings.TrimSpace(*req.Code)
		req.Code = &trimmedCode

		if trimmedCode == "" {
			req.Code = nil
		} else {
			_, err := s.repo.Tenant(ctx).GetModifierByCode(ctx, req.Code)
			if err == nil {
				return nil, fmt.Errorf("modifier code already exists")
			}
			if err != nil && err != pgx.ErrNoRows {
				log.Printf("GetModifierByCode failed: %v", err)
				return nil, fmt.Errorf("failed to validate modifier code: %w", err)
			}
		}
	}

	finalIsActive := true
	if req.IsActive != nil {
		finalIsActive = *req.IsActive
	}

	row, err := s.repo.Tenant(ctx).CreateModifier(ctx, pg.CreateModifierParams{
		ID:          uuid.New(),
		Name:        strings.TrimSpace(req.Name),
		NameI18n:    nameI18nUUID,
		Description: req.Description,
		Code:        req.Code,
		IsActive:    finalIsActive,
		PictureUrl:  req.PictureUrl,
	})
	if err != nil {
		log.Printf("CreateModifier failed: %v", err)
		return nil, fmt.Errorf("failed to create modifier: %w", err)
	}

	return mapModifierToResponse(row), nil
}

func (s *ModifierS) GetModifierByID(ctx context.Context, modifierID string) (*model.ModifierResponse, error) {
	id, err := uuid.Parse(modifierID)
	if err != nil {
		return nil, fmt.Errorf("invalid modifier ID: %w", err)
	}

	row, err := s.repo.Tenant(ctx).GetModifierByID(ctx, id)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, fmt.Errorf("modifier not found")
		}
		log.Printf("GetModifierByID failed: %v", err)
		return nil, fmt.Errorf("failed to retrieve modifier: %w", err)
	}

	return mapModifierToResponse(row), nil
}

func (s *ModifierS) GetAllModifiers(ctx context.Context, limit, offset int32) ([]*model.ModifierResponse, int64, error) {
	rows, err := s.repo.Tenant(ctx).GetAllModifiers(ctx, pg.GetAllModifiersParams{
		Limit:  limit,
		Offset: offset,
	})
	if err != nil {
		log.Printf("GetAllModifiers failed: %v", err)
		return nil, 0, fmt.Errorf("failed to retrieve modifiers: %w", err)
	}

	total, err := s.repo.Tenant(ctx).CountModifiers(ctx)
	if err != nil {
		log.Printf("CountModifiers failed: %v", err)
		return nil, 0, fmt.Errorf("failed to count modifiers: %w", err)
	}

	responses := make([]*model.ModifierResponse, 0, len(rows))
	for _, row := range rows {
		responses = append(responses, mapModifierToResponse(row))
	}

	return responses, total, nil
}

func (s *ModifierS) UpdateModifier(ctx context.Context, modifierID string, req model.UpdateModifierRequest) (*model.ModifierResponse, error) {
	id, err := uuid.Parse(modifierID)
	if err != nil {
		return nil, fmt.Errorf("invalid modifier ID: %w", err)
	}

	existing, err := s.repo.Tenant(ctx).GetModifierByID(ctx, id)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, fmt.Errorf("modifier not found")
		}
		log.Printf("GetModifierByID failed before update: %v", err)
		return nil, fmt.Errorf("failed to get modifier: %w", err)
	}

	finalName := existing.Name
	if req.Name != nil {
		trimmedName := strings.TrimSpace(*req.Name)
		if trimmedName == "" {
			return nil, fmt.Errorf("modifier name cannot be empty")
		}
		finalName = trimmedName
	}

	finalNameI18n := existing.NameI18n
	if req.NameI18n != nil {
		trimmed := strings.TrimSpace(*req.NameI18n)
		if trimmed == "" {
			finalNameI18n = pgtype.UUID{}
		} else {
			i18nID, err := uuid.Parse(trimmed)
			if err != nil {
				return nil, fmt.Errorf("invalid name_i18n: %w", err)
			}
			finalNameI18n = pgtype.UUID{Bytes: i18nID, Valid: true}
		}
	}

	finalDescription := existing.Description
	if req.Description != nil {
		finalDescription = req.Description
	}

	finalCode := existing.Code
	if req.Code != nil {
		trimmedCode := strings.TrimSpace(*req.Code)
		finalCode = &trimmedCode
		if trimmedCode == "" {
			finalCode = nil
		} else {
			found, err := s.repo.Tenant(ctx).GetModifierByCode(ctx, &trimmedCode)
			if err == nil && found.ID != existing.ID {
				return nil, fmt.Errorf("modifier code already exists")
			}
			if err != nil && err != pgx.ErrNoRows {
				log.Printf("GetModifierByCode failed: %v", err)
				return nil, fmt.Errorf("failed to validate modifier code: %w", err)
			}
		}
	}

	finalIsActive := existing.IsActive
	if req.IsActive != nil {
		finalIsActive = *req.IsActive
	}

	finalPictureURL := existing.PictureUrl
	if req.PictureUrl != nil {
		finalPictureURL = req.PictureUrl
	}

	row, err := s.repo.Tenant(ctx).UpdateModifier(ctx, pg.UpdateModifierParams{
		ID:          id,
		Name:        finalName,
		NameI18n:    finalNameI18n,
		Description: finalDescription,
		Code:        finalCode,
		IsActive:    finalIsActive,
		PictureUrl:  finalPictureURL,
	})
	if err != nil {
		log.Printf("UpdateModifier failed: %v", err)
		return nil, fmt.Errorf("failed to update modifier: %w", err)
	}

	return mapModifierToResponse(row), nil
}

func (s *ModifierS) DeleteModifier(ctx context.Context, modifierID string) error {
	id, err := uuid.Parse(modifierID)
	if err != nil {
		return fmt.Errorf("invalid modifier ID: %w", err)
	}

	_, err = s.repo.Tenant(ctx).GetModifierByID(ctx, id)
	if err != nil {
		if err == pgx.ErrNoRows {
			return fmt.Errorf("modifier not found")
		}
		log.Printf("GetModifierByID failed before delete: %v", err)
		return fmt.Errorf("failed to validate modifier: %w", err)
	}

	activeCount, err := s.repo.Tenant(ctx).CountActiveOrderItemModifiersByModifierID(ctx, id)
	if err != nil {
		log.Printf("CountActiveOrderItemModifiersByModifierID failed: %v", err)
		return fmt.Errorf("failed to validate modifier usage: %w", err)
	}
	if activeCount > 0 {
		return fmt.Errorf("modifier cannot be deleted: it is used by active order items")
	}

	if err := s.repo.Tenant(ctx).DeleteModifier(ctx, id); err != nil {
		log.Printf("DeleteModifier failed: %v", err)
		return fmt.Errorf("failed to delete modifier: %w", err)
	}

	return nil
}

func (s *ModifierS) RestoreModifier(ctx context.Context, modifierID string) error {
	id, err := uuid.Parse(modifierID)
	if err != nil {
		return fmt.Errorf("invalid modifier ID: %w", err)
	}

	if err := s.repo.Tenant(ctx).RestoreModifier(ctx, id); err != nil {
		log.Printf("RestoreModifier failed: %v", err)
		return fmt.Errorf("failed to restore modifier: %w", err)
	}

	return nil
}

func (s *ModifierS) SearchModifiers(ctx context.Context, query string, limit, offset int32) ([]*model.ModifierResponse, error) {
	q := strings.TrimSpace(query)

	rows, err := s.repo.Tenant(ctx).SearchModifiers(ctx, pg.SearchModifiersParams{
		Column1: &q,
		Limit:   limit,
		Offset:  offset,
	})
	if err != nil {
		log.Printf("SearchModifiers failed: %v", err)
		return nil, fmt.Errorf("failed to search modifiers: %w", err)
	}

	responses := make([]*model.ModifierResponse, 0, len(rows))
	for _, row := range rows {
		responses = append(responses, mapModifierToResponse(row))
	}

	return responses, nil
}
