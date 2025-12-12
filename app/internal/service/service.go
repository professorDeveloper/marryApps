package service

import (
	"context"

	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
	"gitlab.yurtal.tech/company/blitz/back/internal/config"
	"gitlab.yurtal.tech/company/blitz/back/internal/model"
	"gitlab.yurtal.tech/company/blitz/back/internal/repository"
	"gitlab.yurtal.tech/company/blitz/back/pkg/paymentClick"
	"gitlab.yurtal.tech/company/blitz/back/pkg/paymentPayme"
)

type AuthI interface {
	Register(ctx context.Context, req model.RegisterRequest) error
	Login(ctx context.Context, req model.LoginRequest, jwtCfg *config.JwtConfig) (model.LoginResponse, error)
	LoginWithEmail(ctx context.Context, req model.LoginEmailRequest, jwtCfg *config.JwtConfig) (model.LoginResponse, error)
	Refresh(ctx context.Context, req model.RefreshRequest, jwtCfg *config.JwtConfig) (model.RefreshResponse, error)
	UpdateUserPassword(ctx context.Context, userID uuid.UUID, currentPassword, newPassword string) error
	GetUserByID(ctx context.Context, userID string) (model.UserResponse, error)
	UpdateUser(ctx context.Context, req model.UpdateUserRequest, userID string) (model.UserResponse, error)
}
type PaymentI interface {
	CreateInvoice(c echo.Context, ctx context.Context) (*model.CheckoutURL, error)
	CreatePaymeInvoice(c echo.Context, ctx context.Context) (*model.CheckoutURL, error)
}
type MixedI interface {
	CreateLevelPrice(ctx context.Context, req model.CreatePriceForLevelRequest) (*model.CreatePriceForLevelResponse, error)
}
type I interface {
	Auth() AuthI
	Payment() PaymentI
	Repository() *repository.Repository
	Mixed() MixedI
}

type Service struct {
	auth    AuthI
	payment PaymentI
	repo    *repository.Repository
	mixed   MixedI
}

func New(cfg *config.Config, repo *repository.Repository, clickClient *paymentClick.Client, paymeClient *paymentPayme.Client) *Service {
	return &Service{
		auth:    NewAuthS(cfg, repo),
		payment: NewPaymentS(cfg, repo, clickClient, paymeClient),
		repo:    repo,
		mixed:   NewMixedS(repo),
	}
}

func (s *Service) Mixed() MixedI {
	return s.mixed
}

func (s *Service) Auth() AuthI {
	return s.auth
}
func (s *Service) Payment() PaymentI {
	return s.payment
}

func (s *Service) Repository() *repository.Repository {
	return s.repo
}
