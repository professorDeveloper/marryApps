package service

import (
	"context"

	"gitlab.yurtal.tech/company/blitz/back/internal/config"
	"gitlab.yurtal.tech/company/blitz/back/internal/model"
	"gitlab.yurtal.tech/company/blitz/back/internal/repository"
)

type AuthI interface {
	Register(ctx context.Context, req model.RegisterRequest) error
	Login(ctx context.Context, req model.LoginRequest, jwtCfg *config.JwtConfig) (model.LoginResponse, error)
	LoginWithEmail(ctx context.Context, req model.LoginEmailRequest, jwtCfg *config.JwtConfig) (model.LoginResponse, error)
	Refresh(ctx context.Context, req model.RefreshRequest, jwtCfg *config.JwtConfig) (model.RefreshResponse, error)
}

type I interface {
	Auth() AuthI
}

type Service struct {
	auth AuthI
}

func New(cfg *config.Config, repo *repository.Repository) *Service {
	return &Service{
		auth: NewAuthS(cfg, repo),
	}
}

func (s *Service) Auth() AuthI {
	return s.auth
}
