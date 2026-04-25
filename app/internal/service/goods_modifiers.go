package service

import (
	"context"
	"fmt"
	"log"
	"strings"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"gitlab.yurtal.tech/company/maryai/back/internal/model"
	"gitlab.yurtal.tech/company/maryai/back/internal/repository"
	pg "gitlab.yurtal.tech/company/maryai/back/internal/repository/pg/tenantsdb"
)

type GoodsModifierS struct {
	repo *repository.Repository
}

func NewGoodsModifierS(repo *repository.Repository) *GoodsModifierS {
	return &GoodsModifierS{repo: repo}
}

func mapGoodModifierRow(row pg.GetModifiersByGoodIDRow) *model.GoodModifierResponse {
	return &model.GoodModifierResponse{
		ID:         row.ID.String(),
		GoodID:     row.GoodID.String(),
		ModifierID: row.ModifierID.String(),
		IsRequired: row.IsRequired,
		SortOrder:  row.SortOrder,
		CreatedAt:  timestampToTime(row.CreatedAt),
		UpdatedAt:  timestampToTime(row.UpdatedAt),
		Modifier: &model.ModifierShortResponse{
			ID:          row.ModifierID.String(),
			Name:        row.Name,
			NameI18n:    uuidToStr(row.NameI18n),
			Description: row.Description,
			Code:        row.Code,
			IsActive:    row.IsActive,
			PictureUrl:  row.PictureUrl,
		},
	}
}

func isDeleted(v *int64) bool {
	return v != nil && *v != 0
}

func isActiveRelation(v *int64) bool {
	return v == nil || *v == 0
}

func (s *GoodsModifierS) AttachModifiersToGood(ctx context.Context, goodID string, req model.AttachModifiersToGoodRequest) error {
	if strings.TrimSpace(goodID) == "" {
		return fmt.Errorf("good ID is required")
	}

	if len(req.Modifiers) == 0 {
		return fmt.Errorf("modifiers list is required")
	}

	goodUUID, err := uuid.Parse(strings.TrimSpace(goodID))
	if err != nil {
		return fmt.Errorf("invalid good ID: %w", err)
	}

	_, err = s.repo.Tenant(ctx).GetGoodByID(ctx, goodUUID)
	if err != nil {
		if err == pgx.ErrNoRows {
			return fmt.Errorf("good not found")
		}
		log.Printf("GetGoodByID failed: %v", err)
		return fmt.Errorf("failed to validate good: %w", err)
	}

	for _, item := range req.Modifiers {
		if strings.TrimSpace(item.ModifierID) == "" {
			return fmt.Errorf("modifier_id is required")
		}

		modifierUUID, err := uuid.Parse(strings.TrimSpace(item.ModifierID))
		if err != nil {
			return fmt.Errorf("invalid modifier ID: %w", err)
		}

		modifier, err := s.repo.Tenant(ctx).GetModifierByID(ctx, modifierUUID)
		if err != nil {
			if err == pgx.ErrNoRows {
				return fmt.Errorf("modifier not found: %s", item.ModifierID)
			}
			log.Printf("GetModifierByID failed: %v", err)
			return fmt.Errorf("failed to validate modifier: %w", err)
		}

		if !modifier.IsActive {
			return fmt.Errorf("modifier is inactive: %s", item.ModifierID)
		}

		isRequired := false
		if item.IsRequired != nil {
			isRequired = *item.IsRequired
		}

		sortOrder := int32(0)
		if item.SortOrder != nil {
			sortOrder = *item.SortOrder
		}

		existing, err := s.repo.Tenant(ctx).GetGoodModifierByGoodAndModifierID(ctx, pg.GetGoodModifierByGoodAndModifierIDParams{
			GoodID:     goodUUID,
			ModifierID: modifierUUID,
		})

		if err == nil {
			if isActiveRelation(existing.DeletedAt) {
				return fmt.Errorf("modifier already attached to good: %s", item.ModifierID)
			}

			err = s.repo.Tenant(ctx).RestoreModifierToGood(ctx, pg.RestoreModifierToGoodParams{
				GoodID:     goodUUID,
				ModifierID: modifierUUID,
				IsRequired: isRequired,
				SortOrder:  sortOrder,
			})
			if err != nil {
				log.Printf("RestoreModifierToGood failed: %v", err)
				return fmt.Errorf("failed to restore good modifier relation: %w", err)
			}

			continue
		}

		if err != pgx.ErrNoRows {
			log.Printf("GetGoodModifierByGoodAndModifierID failed: %v", err)
			return fmt.Errorf("failed to validate good modifier relation: %w", err)
		}

		_, err = s.repo.Tenant(ctx).AttachModifierToGood(ctx, pg.AttachModifierToGoodParams{
			ID:         uuid.New(),
			GoodID:     goodUUID,
			ModifierID: modifierUUID,
			IsRequired: isRequired,
			SortOrder:  sortOrder,
		})
		if err != nil {
			log.Printf("AttachModifierToGood failed: %v", err)
			return fmt.Errorf("failed to attach modifier to good: %w", err)
		}
	}

	return nil
}

func (s *GoodsModifierS) GetModifiersByGoodID(ctx context.Context, goodID string) ([]*model.GoodModifierResponse, error) {
	if strings.TrimSpace(goodID) == "" {
		return nil, fmt.Errorf("good ID is required")
	}

	goodUUID, err := uuid.Parse(strings.TrimSpace(goodID))
	if err != nil {
		return nil, fmt.Errorf("invalid good ID: %w", err)
	}

	var rows []pg.GetModifiersByGoodIDRow
	err = withTenantRead(ctx, s.repo, func(ctx context.Context, q *pg.Queries) error {
		_, err := q.GetGoodByID(ctx, goodUUID)
		if err != nil {
			if err == pgx.ErrNoRows {
				return fmt.Errorf("good not found")
			}
			log.Printf("GetGoodByID failed: %v", err)
			return fmt.Errorf("failed to validate good: %w", err)
		}

		rows, err = q.GetModifiersByGoodID(ctx, goodUUID)
		if err != nil {
			log.Printf("GetModifiersByGoodID failed: %v", err)
			return fmt.Errorf("failed to retrieve good modifiers: %w", err)
		}
		return nil
	})
	if err != nil {
		return nil, err
	}

	resp := make([]*model.GoodModifierResponse, 0, len(rows))
	for _, row := range rows {
		resp = append(resp, mapGoodModifierRow(row))
	}

	return resp, nil
}

func (s *GoodsModifierS) DetachModifierFromGood(ctx context.Context, goodID, modifierID string) error {
	if strings.TrimSpace(goodID) == "" {
		return fmt.Errorf("good ID is required")
	}
	if strings.TrimSpace(modifierID) == "" {
		return fmt.Errorf("modifier ID is required")
	}

	goodUUID, err := uuid.Parse(strings.TrimSpace(goodID))
	if err != nil {
		return fmt.Errorf("invalid good ID: %w", err)
	}

	modifierUUID, err := uuid.Parse(strings.TrimSpace(modifierID))
	if err != nil {
		return fmt.Errorf("invalid modifier ID: %w", err)
	}

	existing, err := s.repo.Tenant(ctx).GetGoodModifierByGoodAndModifierID(ctx, pg.GetGoodModifierByGoodAndModifierIDParams{
		GoodID:     goodUUID,
		ModifierID: modifierUUID,
	})
	if err != nil {
		if err == pgx.ErrNoRows {
			return fmt.Errorf("good modifier relation not found")
		}
		log.Printf("GetGoodModifierByGoodAndModifierID failed: %v", err)
		return fmt.Errorf("failed to validate good modifier relation: %w", err)
	}

	if isDeleted(existing.DeletedAt) {
		return fmt.Errorf("modifier is not attached to this good")
	}

	err = s.repo.Tenant(ctx).DetachModifierFromGood(ctx, pg.DetachModifierFromGoodParams{
		GoodID:     goodUUID,
		ModifierID: modifierUUID,
	})
	if err != nil {
		log.Printf("DetachModifierFromGood failed: %v", err)
		return fmt.Errorf("failed to detach modifier from good: %w", err)
	}

	return nil
}

func (s *GoodsModifierS) ReplaceModifiersForGood(ctx context.Context, goodID string, req model.AttachModifiersToGoodRequest) error {
	if strings.TrimSpace(goodID) == "" {
		return fmt.Errorf("good ID is required")
	}

	goodUUID, err := uuid.Parse(strings.TrimSpace(goodID))
	if err != nil {
		return fmt.Errorf("invalid good ID: %w", err)
	}

	_, err = s.repo.Tenant(ctx).GetGoodByID(ctx, goodUUID)
	if err != nil {
		if err == pgx.ErrNoRows {
			return fmt.Errorf("good not found")
		}
		log.Printf("GetGoodByID failed: %v", err)
		return fmt.Errorf("failed to validate good: %w", err)
	}

	if err := s.repo.Tenant(ctx).SoftDeleteAllModifiersByGoodID(ctx, goodUUID); err != nil {
		log.Printf("SoftDeleteAllModifiersByGoodID failed: %v", err)
		return fmt.Errorf("failed to clear existing good modifiers: %w", err)
	}

	if len(req.Modifiers) == 0 {
		return nil
	}

	return s.AttachModifiersToGood(ctx, goodID, req)
}
