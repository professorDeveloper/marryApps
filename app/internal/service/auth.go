package service

import (
	"context"
	"errors"
	"fmt"
	"log"
	"math/rand"
	"net/http"
	"strings"
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

func (b *AuthS) GenerateCode4() string {
	rand.Seed(time.Now().UnixNano())
	return fmt.Sprintf("%04d", rand.Intn(10000))
}
func (s *AuthS) Register(ctx context.Context, req model.RegisterRequest) error {
	if req.PhoneNumber == "" {
		return errors.New(http.StatusText(http.StatusBadRequest))
	}

	log.Printf("Starting registration for phone: %s", req.PhoneNumber)

	_, err := s.repo.PgRepo.Repo.GetUserByPhoneNumber(ctx, &req.PhoneNumber)
	if err == nil {
		log.Printf("User with phone %s already exists", req.PhoneNumber)
		return errors.New("user already exists")
	}
	if !errors.Is(err, pgx.ErrNoRows) {
		log.Printf("Error checking user existence: %v", err)
		return err
	}
	password := req.DateOfBirth.Format("20060102")
	hash, err := utils.HashPassword(password)
	if err != nil {
		log.Printf("Error hashing password: %v", err)
		return err
	}

	fullName := req.FullName
	phoneNumber := req.PhoneNumber
	status := "onhold"
	dateOfBirth := req.DateOfBirth

	validRoles := map[string]bool{"admin": true, "moderator": true, "student": true, "teacher": true}
	role := strings.TrimSpace(req.Role)
	if role == "" || !validRoles[role] {
		role = "student"
		log.Printf("Using default role: %s", role)
	}

	log.Printf("Creating user with params - Phone: %s, Role: %s, Status: %s",
		phoneNumber, role, status)

	userParams := pg.CreateUserParams{
		ID:           uuid.NewString(),
		PhoneNumber:  &phoneNumber,
		FullName:     &fullName,
		PasswordHash: &hash,
		Status:       &status,
		DateOfBirth:  pgtype.Timestamp{Time: dateOfBirth, Valid: true},
		Role:         &role,
	}

	log.Printf("Final user params before CreateUser: %+v", userParams)
	log.Printf("Role pointer value: %s", *userParams.Role)

	user, err := s.repo.PgRepo.Repo.CreateUser(ctx, userParams)
	if err != nil {
		log.Printf("Error creating user: %v", err)
		if pqErr, ok := err.(interface {
			Get(k string) (interface{}, bool)
		}); ok {
			if constraint, ok := pqErr.Get("constraint"); ok {
				log.Printf("Database constraint violation: %v", constraint)
			}
			if detail, ok := pqErr.Get("detail"); ok {
				log.Printf("Error details: %v", detail)
			}
		}
		return fmt.Errorf("failed to create user: %w", err)
	}

	log.Printf("Successfully created user with ID: %s", user.ID)
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
		status := "onhold"
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

	params := pg.UpdateUserPasswordParams{
		ID:           existingUser.ID,
		PasswordHash: &hashedPassword,
	}

	if _, err := s.repo.PgRepo.Repo.UpdateUserPassword(ctx, params); err != nil {
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
		ID:            existingUser.ID,
		FullName:      existingUser.FullName,
		Email:         existingUser.Email,
		PhoneNumber:   existingUser.PhoneNumber,
		Gender:        existingUser.Gender,
		OverAll:       existingUser.OverAll,
		XP:            existingUser.XP,
		Balance:       existingUser.Balance,
		DateOfBirth:   existingUser.DateOfBirth,
		Photo:         existingUser.Photo,
		FirebaseToken: existingUser.FirebaseToken,
		GoogleId:      existingUser.GoogleId,
		IsVerified:    existingUser.IsVerified,
		Status:        existingUser.Status,
		Group:         existingUser.Group,
		Role:          existingUser.Role,
		PasswordHash:  existingUser.PasswordHash,
	}

	validGenders := map[string]bool{
		"male":   true,
		"female": true,
		"other":  true,
	}

	if req.FullName != nil && *req.FullName != "" {
		params.FullName = req.FullName
	}
	if req.Email != nil && *req.Email != "" {
		params.Email = req.Email
	}
	if req.PhoneNumber != nil && *req.PhoneNumber != "" {
		params.PhoneNumber = req.PhoneNumber
	}
	if req.Gender != nil && *req.Gender != "" {
		gender := strings.ToLower(*req.Gender)
		if !validGenders[gender] {
			return model.UserResponse{}, fmt.Errorf("invalid gender value: %s. Allowed values: male, female, other", *req.Gender)
		}
		params.Gender = req.Gender
	}
	if req.OverAll != nil && *req.OverAll >= 0 {
		params.OverAll = req.OverAll
	}
	if req.XP != nil && *req.XP >= 0 {
		params.XP = req.XP
	}
	if req.Balance != nil && *req.Balance >= 0 {
		params.Balance = req.Balance
	}
	if req.Photo != nil && *req.Photo != "" {
		params.Photo = req.Photo
	}

	if req.DateOfBirth != nil && *req.DateOfBirth != "" && *req.DateOfBirth != "string" {
		dateStr := *req.DateOfBirth

		var parsedTime time.Time
		formats := []string{
			time.RFC3339,
			"2006-01-02",
			"2006-01-02T15:04:05Z",
			"2006-01-02T15:04:05",
			"01/02/2006",
		}

		var parseErr error
		for _, format := range formats {
			parsedTime, parseErr = time.Parse(format, dateStr)
			if parseErr == nil {
				break
			}
		}

		if parseErr != nil {
			log.Printf("Failed to parse date '%s': %v", dateStr, parseErr)
			return model.UserResponse{}, fmt.Errorf("invalid date format: %s", dateStr)
		}

		params.DateOfBirth = pgtype.Timestamp{
			Time:  parsedTime.UTC(),
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
		ID:          u.ID,
		FullName:    u.FullName,
		Email:       u.Email,
		Role:        u.Role,
		Gender:      u.Gender,
		Status:      u.Status,
		Photo:       u.Photo,
		PhoneNumber: u.PhoneNumber,
		XP:          u.XP,
		Balance:     u.Balance,
		Group:       u.Group,
		OverAll:     u.OverAll,
		IsVerified:  u.IsVerified,
		DateOfBirth: dateOfBirth,
	}
}
