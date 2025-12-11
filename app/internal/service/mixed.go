package service

import (
	"context"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
	"gitlab.yurtal.tech/company/blitz/back/internal/model"
	"gitlab.yurtal.tech/company/blitz/back/internal/repository"
	"gitlab.yurtal.tech/company/blitz/back/internal/repository/pg"
)

type MixedS struct {
	repo *repository.Repository
}

func NewMixedS(repo *repository.Repository) MixedI {
	return &MixedS{
		repo: repo,
	}
}

func (s *MixedS) CreateLevelPrice(ctx context.Context, req model.CreatePriceForLevelRequest) (*model.CreatePriceForLevelResponse, error) {
	if req.Level == "" {
		return &model.CreatePriceForLevelResponse{
			Error:     -5,
			ErrorNote: "Level is required",
		}, nil
	}

	if req.Amount == nil || *req.Amount <= 0 {
		return &model.CreatePriceForLevelResponse{
			Error:     -5,
			ErrorNote: "Valid amount is required",
		}, nil
	}

	_, err := s.repo.PgRepo.Repo.GetPaymentPriceForLevelByLevel(ctx, &req.Level)
	if err == nil {
		return &model.CreatePriceForLevelResponse{
			Error:     -5,
			ErrorNote: "levelPrice for this level already exists",
		}, nil
	}

	priceID := uuid.NewString()
	now := time.Now()

	createParams := pg.CreatePaymentPriceForLevelParams{
		ID:      priceID,
		Level:   &req.Level,
		Amount:  req.Amount,
		Created: pgtype.Timestamptz{Time: now, Valid: true},
		Updated: pgtype.Timestamptz{Time: now, Valid: true},
	}

	price, err := s.repo.PgRepo.Repo.CreatePaymentPriceForLevel(ctx, createParams)
	if err != nil {
		return nil, err
	}

	return &model.CreatePriceForLevelResponse{
		Error:     0,
		ErrorNote: "Success",
		Data: model.PriceForLevelResponse{
			ID:     price.ID,
			Level:  *price.Level,
			Amount: *price.Amount,
		},
	}, nil
}
