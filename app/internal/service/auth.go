package service

import (
	"context"
	"errors"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"gitlab.yurtal.tech/company/blitz/back/internal/config"
	"gitlab.yurtal.tech/company/blitz/back/internal/model"
	"gitlab.yurtal.tech/company/blitz/back/internal/repository"
	"gitlab.yurtal.tech/company/blitz/back/internal/repository/pg"
	"gitlab.yurtal.tech/company/blitz/back/pkg/utils"
)

type AuthS struct {
	cfg  *config.Config
	repo *repository.Repository
}

func NewAuthS(cfg *config.Config, repo *repository.Repository) *AuthS {
	return &AuthS{
		cfg:  cfg,
		repo: repo,
	}
}

func (s *AuthS) Register(ctx context.Context, req model.RegisterRequest) error {
	if req.Email == "" || req.Password == "" {
		return errors.New(http.StatusText(http.StatusBadRequest))
	}

	_, err := s.repo.PgRepo.Repo.GetUserByEmail(ctx, &req.Email)
	if err == nil {
		return errors.New("user already exists")
	}
	if !errors.Is(err, pgx.ErrNoRows) {
		return err
	}

	hash, err := utils.HashPassword(req.Password)
	if err != nil {
		return err
	}

	fullName := req.FullName
	email := strings.ToLower(req.Email)
	status := "active"
	userParams := pg.CreateUserParams{
		ID:           uuid.NewString(),
		FullName:     &fullName,
		Email:        &email,
		PasswordHash: hash,
		Status:       &status,
	}

	_, err = s.repo.PgRepo.Repo.CreateUser(ctx, userParams)
	if err != nil {
		return err
	}

	return nil
}

func (s *AuthS) Login(ctx context.Context, req model.LoginRequest, jwtCfg *config.JwtConfig) (model.LoginResponse, error) {
	if req.Email == "" || req.Password == "" {
		return model.LoginResponse{}, errors.New(http.StatusText(http.StatusBadRequest))
	}

	user, err := s.repo.PgRepo.Repo.GetUserByEmail(ctx, &req.Email)
	if err != nil {
		return model.LoginResponse{}, errors.New(http.StatusText(http.StatusUnauthorized))
	}

	if err := utils.VerifyPassword(user.PasswordHash, req.Password); err != nil {
		return model.LoginResponse{}, errors.New(http.StatusText(http.StatusUnauthorized))
	}

	accessToken, err := utils.CreateJWT(time.Duration(jwtCfg.AccessToken.ExpiresIn)*time.Second,
		user.ID,
		jwtCfg.SecretKey)
	if err != nil {
		return model.LoginResponse{}, err
	}
	refreshToken, err := utils.CreateJWT(time.Duration(jwtCfg.RefreshToken.ExpiresIn)*time.Second,
		user.ID,
		jwtCfg.SecretKey)
	if err != nil {
		return model.LoginResponse{}, err
	}

	return model.LoginResponse{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		User:         toUserResponse(user),
	}, nil
}

func (s *AuthS) Refresh(ctx context.Context, req model.RefreshRequest, jwtCfg *config.JwtConfig) (model.RefreshResponse, error) {
	if req.RefreshToken == "" {
		return model.RefreshResponse{}, errors.New(http.StatusText(http.StatusUnauthorized))
	}
	refreshToken := req.RefreshToken

	sub, err := utils.ValidateJWT(refreshToken, jwtCfg.RefreshToken.PrivateKey)
	if err != nil {
		return model.RefreshResponse{}, errors.New(http.StatusText(http.StatusUnauthorized))
	}

	user, gErr := s.repo.PgRepo.Repo.GetUserByID(ctx, fmt.Sprint(sub))
	if gErr != nil {
		return model.RefreshResponse{}, gErr
	}

	accessToken, err := utils.CreateJWT(time.Duration(jwtCfg.AccessToken.ExpiresIn)*time.Second,
		user.ID,
		jwtCfg.SecretKey)
	if err != nil {
		return model.RefreshResponse{}, err
	}
	refreshToken, err = utils.CreateJWT(time.Duration(jwtCfg.RefreshToken.ExpiresIn)*time.Second,
		user.ID,
		jwtCfg.SecretKey)
	if err != nil {
		return model.RefreshResponse{}, err
	}
	return model.RefreshResponse{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
	}, nil
}

func (s *AuthS) Logout(ctx context.Context) error {
	return nil
}

func toUserResponse(u pg.User) model.UserResponse {
	return model.UserResponse{
		ID:       u.ID,
		FullName: u.FullName,
		Email:    u.Email,
		Role:     u.Role,
		Gender:   u.Gender,
		Status:   u.Status,
		Photo:    u.Photo,
	}
}
