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

// withTenantRead executes a read-only function within a tenant-scoped transaction.
// The transaction is always rolled back (read-only).
// This helper is for tenant-safe read operations.
func (s *ModifierS) withTenantRead(ctx context.Context, fn func(context.Context, *pg.Queries) error) error {
	brandID, _ := ctx.Value("brand_id").(string)
	brandID = strings.TrimSpace(brandID)
	if brandID == "" {
		return fmt.Errorf("brand_id is missing in context")
	}

	schemaName := fmt.Sprintf("tenant_%s", brandID)

	tx, err := s.repo.PgRepo.TenantPool.Begin(ctx)
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback(ctx)

	if _, err := tx.Exec(ctx, fmt.Sprintf(`SET LOCAL search_path TO "%s", public`, schemaName)); err != nil {
		return fmt.Errorf("failed to set tenant search_path: %w", err)
	}

	if _, err := tx.Exec(ctx, "SET LOCAL app.brand_id = $1", brandID); err != nil {
		return fmt.Errorf("failed to set app.brand_id: %w", err)
	}

	if branchID, _ := ctx.Value("branch_id").(string); strings.TrimSpace(branchID) != "" {
		if _, err := tx.Exec(ctx, "SET LOCAL app.branch_id = $1", strings.TrimSpace(branchID)); err != nil {
			return fmt.Errorf("failed to set app.branch_id: %w", err)
		}
	}

	q := pg.New(tx)
	if err := fn(ctx, q); err != nil {
		return err
	}

	return nil
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

	var row pg.Modifier
	err = s.withTenantRead(ctx, func(ctx context.Context, q *pg.Queries) error {
		var err error
		row, err = q.GetModifierByID(ctx, id)
		if err != nil {
			if err == pgx.ErrNoRows {
				return fmt.Errorf("modifier not found")
			}
			log.Printf("GetModifierByID failed: %v", err)
			return fmt.Errorf("failed to retrieve modifier: %w", err)
		}
		return nil
	})
	if err != nil {
		return nil, err
	}

	return mapModifierToResponse(row), nil
}

func (s *ModifierS) GetModifiers(ctx context.Context, query string, limit, offset int32) ([]*model.ModifierResponse, int64, error) {
	q := strings.TrimSpace(query)

	var rows []pg.Modifier
	var total int64
	err := s.withTenantRead(ctx, func(ctx context.Context, queries *pg.Queries) error {
		var err error
		rows, err = queries.GetModifiers(ctx, pg.GetModifiersParams{
			Column1: q,
			Limit:   limit,
			Offset:  offset,
		})
		if err != nil {
			log.Printf("GetModifiers failed: %v", err)
			return fmt.Errorf("failed to retrieve modifiers: %w", err)
		}

		total, err = queries.CountModifiersFiltered(ctx, q)
		if err != nil {
			log.Printf("CountModifiersFiltered failed: %v", err)
			return fmt.Errorf("failed to count modifiers: %w", err)
		}
		return nil
	})
	if err != nil {
		return nil, 0, err
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
