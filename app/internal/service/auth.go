package service

import (
	"context"
	"errors"
	"fmt"
	"net/http"
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
	if req.PhoneNumber == "" || req.Password == "" {
		return errors.New(http.StatusText(http.StatusBadRequest))
	}

	_, err := s.repo.PgRepo.Repo.GetUserByPhoneNumber(ctx, &req.PhoneNumber)
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
	phoneNumber := req.PhoneNumber
	status := "active"
	userParams := pg.CreateUserParams{
		ID:           uuid.NewString(),
		PhoneNumber:  &phoneNumber,
		FullName:     &fullName,
		PasswordHash: &hash,
		Status:       &status,
	}

	_, err = s.repo.PgRepo.Repo.CreateUser(ctx, userParams)
	if err != nil {
		return err
	}

	return nil
}

func (s *AuthS) Login(ctx context.Context, req model.LoginRequest, jwtCfg *config.JwtConfig) (model.LoginResponse, error) {
	if req.PhoneNumber == "" || req.Password == "" {
		return model.LoginResponse{}, errors.New(http.StatusText(http.StatusBadRequest))
	}

	user, err := s.repo.PgRepo.Repo.GetUserByPhoneNumber(ctx, &req.PhoneNumber)
	if err != nil {
		return model.LoginResponse{}, errors.New(http.StatusText(http.StatusUnauthorized))
	}

	if err := utils.VerifyPassword(*user.PasswordHash, req.Password); err != nil {
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
func (s *AuthS) LoginWithEmail(ctx context.Context, req model.LoginEmailRequest, jwtCfg *config.JwtConfig) (model.LoginResponse, error) {
	if req.Email == "" || req.IdToken == "" {
		return model.LoginResponse{}, errors.New(http.StatusText(http.StatusBadRequest))
	}

	user, err := s.repo.PgRepo.Repo.GetUserByEmail(ctx, &req.Email)

	if err == pgx.ErrNoRows {
		status := "active"
		userParams := pg.CreateUserParams{
			ID:       uuid.NewString(),
			Email:    &req.Email,
			FullName: &req.FullName,
			GoogleId: &req.IdToken,
			Status:   &status,
		}
		_, err = s.repo.PgRepo.Repo.CreateUser(ctx, userParams)
		if err != nil {
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
	if err != nil {
		return model.LoginResponse{}, err
	}

	_, err = s.repo.PgRepo.Repo.UpdateUser(ctx, pg.UpdateUserParams{
		ID:       user.ID,
		GoogleId: &req.IdToken,
		FullName: &req.FullName,
	})
	if err != nil {
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
	fmt.Println(req.RefreshToken)
	if req.RefreshToken == "" {
		return model.RefreshResponse{}, errors.New(http.StatusText(http.StatusUnauthorized))
	}
	refreshToken := req.RefreshToken

	sub, err := utils.ValidateJWT(refreshToken, jwtCfg.SecretKey)
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
	fmt.Println("accessToken", accessToken)
	return model.RefreshResponse{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
	}, nil
}

func (s *AuthS) UpdateUserPassword(ctx context.Context, userID uuid.UUID, currentPassword, newPassword string) error {
	user, err := s.repo.PgRepo.Repo.GetUserByID(ctx, fmt.Sprint(userID))
	if err != nil {
		return fmt.Errorf("failed to get user: %w", err)
	}

	if user.PasswordHash == nil {
		return fmt.Errorf("user has no password set")
	}
	if err := utils.VerifyPassword(*user.PasswordHash, currentPassword); err != nil {
		return fmt.Errorf("invalid current password")
	}

	hashedPassword, err := utils.HashPassword(newPassword)
	if err != nil {
		return fmt.Errorf("failed to hash password: %w", err)
	}

	updateParams := pg.UpdateUserParams{
		ID:           fmt.Sprint(userID),
		PasswordHash: &hashedPassword,
		UpdatedAt:    time.Now(),
	}

	if _, err := s.repo.PgRepo.Repo.UpdateUser(ctx, updateParams); err != nil {
		return fmt.Errorf("failed to update password: %w", err)
	}
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
