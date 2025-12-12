package service

import (
	"context"
	"errors"
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
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
    existingUser, err := s.repo.PgRepo.Repo.GetUserByID(ctx, fmt.Sprint(userID))
    if err != nil {
        return fmt.Errorf("failed to get user: %w", err) 
    }

    if existingUser.GoogleId != nil { 
        return fmt.Errorf("password cannot be updated for users who logged in by Auth2")
    }

    if existingUser.PasswordHash == nil { 
        return fmt.Errorf("user has no password set or password hash is invalid")
    }

    if err := utils.VerifyPassword(*existingUser.PasswordHash, currentPassword); err != nil {
     return fmt.Errorf("invalid current password")
    }

    hashedPassword, err := utils.HashPassword(newPassword)
    if err != nil {
        return fmt.Errorf("failed to hash password: %w", err)
    }

    params := toUpdateParams(existingUser) 
    params.PasswordHash = &hashedPassword
    
    if _, err := s.repo.PgRepo.Repo.UpdateUser(ctx, params); err != nil {
        return fmt.Errorf("failed to update password: %w", err)
    }
    
    return nil
}

func (s *AuthS) GetUserByID(ctx context.Context, userID string) (model.UserResponse, error) {
	user, err := s.repo.PgRepo.Repo.GetUserByID(ctx, userID)
	if err != nil {
		return model.UserResponse{}, err
	}
	return toUserResponse(user), nil
}

func (s *AuthS) UpdateUser(ctx context.Context, req model.UpdateUserRequest, userID string) (model.UserResponse, error) {
	existingUser, err := s.repo.PgRepo.Repo.GetUserByID(ctx, userID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return model.UserResponse{}, fmt.Errorf("user not found")
		}
		return model.UserResponse{}, fmt.Errorf("failed to fetch user: %w", err)
	}

	

	params := pg.UpdateUserParams{
		ID:                      userID,
		FullName:                existingUser.FullName,
		Role:                    existingUser.Role,
		Email:                   existingUser.Email,
		PhoneNumber:             existingUser.PhoneNumber,
		Group:                   existingUser.Group,
		Photo:                   existingUser.Photo,
		Gender:                  existingUser.Gender,
		OverAll:                 existingUser.OverAll, 
		Level:                   existingUser.Level,
		XP:                      existingUser.XP,
		Balance:                 existingUser.Balance,
		IsAgreedForUserContract: existingUser.IsAgreedForUserContract,
		IsVerified:              existingUser.IsVerified,
		Status:                  existingUser.Status,
		DateOfBirth:             existingUser.DateOfBirth,
		FirebaseToken:           existingUser.FirebaseToken,
		GoogleId:                existingUser.GoogleId,
		PasswordHash:            existingUser.PasswordHash,
	}

	if req.FullName != nil {
		params.FullName = req.FullName
	}
	if req.Email != nil {
		params.Email = req.Email
	}
	if req.PhoneNumber != nil {
		params.PhoneNumber = req.PhoneNumber
	}
	if req.Gender != nil {
		params.Gender = req.Gender
	}
	if req.OverAll != nil {
		params.OverAll = req.OverAll
	}
	if req.XP != nil {
		params.XP = req.XP
	}
	if req.Balance != nil {
		params.Balance = req.Balance
	}
	if req.Level != nil {
		params.Level = req.Level
	}

	if !req.DateOfBirth.IsZero() {
		params.DateOfBirth = pgtype.Timestamp{
			Time:  req.DateOfBirth.UTC(),
			Valid: true,
		}
	}
	user, err := s.repo.PgRepo.Repo.UpdateUser(ctx, params)
	if err != nil {
		log.Printf("Failed to update user: %v", err)
		return model.UserResponse{}, fmt.Errorf("failed to update user: %w", err)
	}

	return toUserResponse(user), nil
}
func toUserResponse(u pg.User) model.UserResponse {
	var dateOfBirth time.Time
	if u.DateOfBirth.Valid {
		dateOfBirth = u.DateOfBirth.Time
	}

	return model.UserResponse{
		ID:                      u.ID,
		FullName:                u.FullName,
		Email:                   u.Email,
		Role:                    u.Role,
		Gender:                  u.Gender,
		Status:                  u.Status,
		Photo:                   u.Photo,
		PhoneNumber:             u.PhoneNumber,
		XP:                      u.XP,
		Balance:                 u.Balance,
		Group:                   u.Group,
		Level:                   u.Level,
		OverAll:                 u.OverAll,
		IsVerified:              u.IsVerified,
		IsAgreedForUserContract: u.IsAgreedForUserContract,
		DateOfBirth:             dateOfBirth,
	}
}
func toUpdateParams(u pg.User) pg.UpdateUserParams {
    return pg.UpdateUserParams{
        ID: u.ID,
        FullName: u.FullName,
        Role: u.Role,
        Email: u.Email,
        PhoneNumber: u.PhoneNumber,
        Group: u.Group,
        Photo: u.Photo,
        Gender: u.Gender,
        DateOfBirth: u.DateOfBirth,
        OverAll: u.OverAll,
        Level: u.Level,
        XP: u.XP,
        Balance: u.Balance,
        IsAgreedForUserContract: u.IsAgreedForUserContract,
        IsVerified: u.IsVerified,
        Status: u.Status,
        PasswordHash: u.PasswordHash,
		GoogleId: u.GoogleId,
		FirebaseToken: u.FirebaseToken,
    }
}