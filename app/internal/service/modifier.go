package service

import (
	"context"
	"fmt"
	"log"
	"strconv"
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

func int64ToNumeric(val *int64) pgtype.Numeric {
	if val == nil {
		return pgtype.Numeric{}
	}

	n := pgtype.Numeric{}
	_ = n.Scan(fmt.Sprintf("%d", *val))
	return n
}

func numericToInt64Ptr(n pgtype.Numeric) *int64 {
	if !n.Valid {
		return nil
	}

	if v, err := n.Int64Value(); err == nil && v.Valid {
		val := v.Int64
		return &val
	}

	if v, err := n.Float64Value(); err == nil && v.Valid {
		val := int64(v.Float64)
		return &val
	}

	// fallback
	s := numericToStringModifier(n)
	if s == "" {
		return nil
	}

	f, err := strconv.ParseFloat(s, 64)
	if err != nil {
		return nil
	}

	val := int64(f)
	return &val
}

func numericToStringModifier(n pgtype.Numeric) string {
	if !n.Valid {
		return ""
	}
	if n.NaN {
		return ""
	}
	if n.InfinityModifier != 0 {
		return ""
	}
	if n.Int == nil {
		return "0"
	}

	str := n.Int.String()
	if n.Exp < 0 {
		exp := -int(n.Exp)
		if exp >= len(str) {
			str = "0." + strings.Repeat("0", exp-len(str)) + str
		} else {
			str = str[:len(str)-exp] + "." + str[len(str)-exp:]
		}
	} else if n.Exp > 0 {
		str = str + strings.Repeat("0", int(n.Exp))
	}

	return str
}

func mapModifierToResponse(row pg.Modifier) *model.ModifierResponse {
	return &model.ModifierResponse{
		ID:          row.ID.String(),
		Name:        row.Name,
		NameI18n:    uuidToStr(row.NameI18n),
		Description: row.Description,
		Code:        row.Code,
		PriceDelta:  numericToInt64Ptr(row.PriceDelta),
		CostDelta:   numericToInt64Ptr(row.CostDelta),
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

		if trimmedCode != "" {
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

	row, err := s.repo.Tenant(ctx).CreateModifier(ctx, pg.CreateModifierParams{
		ID:          uuid.New(),
		Name:        strings.TrimSpace(req.Name),
		NameI18n:    nameI18nUUID,
		Description: req.Description,
		Code:        req.Code,
		PriceDelta:  int64ToNumeric(req.PriceDelta),
		CostDelta:   int64ToNumeric(req.CostDelta),
		IsActive:    req.IsActive,
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

func (s *ModifierS) GetAllModifiers(ctx context.Context, limit, offset int32) ([]*model.ModifierResponse, error) {
	rows, err := s.repo.Tenant(ctx).GetAllModifiers(ctx, pg.GetAllModifiersParams{
		Limit:  limit,
		Offset: offset,
	})
	if err != nil {
		log.Printf("GetAllModifiers failed: %v", err)
		return nil, fmt.Errorf("failed to retrieve modifiers: %w", err)
	}

	responses := make([]*model.ModifierResponse, 0, len(rows))
	for _, row := range rows {
		responses = append(responses, mapModifierToResponse(row))
	}

	return responses, nil
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

	finalPriceDelta := existing.PriceDelta
	if req.PriceDelta != nil {
		finalPriceDelta = int64ToNumeric(req.PriceDelta)
	}

	finalCostDelta := existing.CostDelta
	if req.CostDelta != nil {
		finalCostDelta = int64ToNumeric(req.CostDelta)
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
		PriceDelta:  finalPriceDelta,
		CostDelta:   finalCostDelta,
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