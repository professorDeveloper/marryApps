package service

import (
	"context"
	"io"

	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
	RealMinio "github.com/minio/minio-go/v7"
	"gitlab.yurtal.tech/company/blitz/back/internal/config"
	"gitlab.yurtal.tech/company/blitz/back/internal/model"
	"gitlab.yurtal.tech/company/blitz/back/internal/repository"
	"gitlab.yurtal.tech/company/blitz/back/pkg/minio"
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
type MinioI interface {
	PutAvatar(ctx context.Context, file io.Reader, size int64, userID string) (string, error)
	GetAvatar(ctx context.Context, objectName string) (*RealMinio.Object, error)
	PutVideo(ctx context.Context, file io.Reader, size int64,fileName string,extension string) (string, error)
	GetVideo(ctx context.Context, objectName string) (*RealMinio.Object, error)
	PutAudio(ctx context.Context, file io.Reader, size int64,fileName string,extension string) (string, error)
	GetAudio(ctx context.Context, objectName string) (*RealMinio.Object, error)
	PutBook(ctx context.Context, file io.Reader, size int64,fileName string,extension string) (string, error)
	GetBook(ctx context.Context, objectName string) (*RealMinio.Object, error)
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
	Minio() MinioI
}

type Service struct {
	auth    AuthI
	payment PaymentI
	repo    *repository.Repository
	mixed   MixedI
	minio   MinioI
}

func New(cfg *config.Config, repo *repository.Repository, clickClient *paymentClick.Client, paymeClient *paymentPayme.Client, minioClient *minio.Minio) *Service {
	return &Service{
		auth:    NewAuthS(cfg, repo),
		payment: NewPaymentS(cfg, repo, clickClient, paymeClient),
		repo:    repo,
		mixed:   NewMixedS(repo),
		minio:   NewMinioS(cfg, minioClient),
	}
}

func (s *Service) Mixed() MixedI {
	return s.mixed
}
func (s *Service) Minio() MinioI {
	return s.minio
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
