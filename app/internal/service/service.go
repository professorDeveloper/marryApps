package service

import (
	"gitlab.yurtal.tech/company/blitz/back/internal/config"
	"gitlab.yurtal.tech/company/blitz/back/internal/repository"
)

type AuthI interface {
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
