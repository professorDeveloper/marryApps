package service

import (
	"context"
	"errors"
	"fmt"
	"log"
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

func (s *AuthS) Register(ctx context.Context, req model.RegisterRequest) error {
	if req.PhoneNumber == "" {
		return fmt.Errorf("phone number is required")
	}
	if req.FullName == "" {
		return fmt.Errorf("full name is required")
	}

	dateOfBirth, err := time.Parse("2006-01-02", req.DateOfBirth)
	if err != nil {
		return fmt.Errorf("invalid date format, expected YYYY-MM-DD")
	}

	// Validate date
	if dateOfBirth.IsZero() {
		return fmt.Errorf("date of birth is required")
	}
	if dateOfBirth.After(time.Now()) {
		return fmt.Errorf("date of birth cannot be in the future")
	}

	log.Printf("Starting registration for phone: %s", req.PhoneNumber)

	_, err = s.repo.PgRepo.Repo.GetUserByPhoneNumber(ctx, &req.PhoneNumber)
	if err == nil {
		log.Printf("User with phone %s already exists", req.PhoneNumber)
		return fmt.Errorf("user with this phone number already exists")
	}
	if !errors.Is(err, pgx.ErrNoRows) {
		log.Printf("Error checking user existence: %v", err)
		return fmt.Errorf("failed to check user existence: %w", err)
	}

	// Generate password from the parsed date of birth
	password := dateOfBirth.Format("20060102")
	hash, err := utils.HashPassword(password)
	if err != nil {
		log.Printf("Error hashing password: %v", err)
		return fmt.Errorf("failed to process password: %w", err)
	}
	validRoles := map[string]pg.UserRole{
		"admin":     pg.UserRoleAdmin,
		"moderator": pg.UserRoleModerator,
		"student":   pg.UserRoleStudent,
		"teacher":   pg.UserRoleTeacher,
	}

	role := strings.TrimSpace(strings.ToLower(req.Role))
	userRole, validRole := validRoles[role]
	if !validRole {
		userRole = pg.UserRoleStudent
		log.Printf("Using default role: %s", userRole)
	}

	userParams := pg.CreateUserParams{
		ID:           uuid.NewString(),
		PhoneNumber:  &req.PhoneNumber,
		FullName:     strings.TrimSpace(req.FullName),
		PasswordHash: &hash,
		DateOfBirth:  pgtype.Date{Time: dateOfBirth, Valid: true},
		Role:         pg.NullUserRole{UserRole: userRole, Valid: true},
	}

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
			FullName: req.FullName,
			GoogleId: &req.IdToken,
			Status:   pg.NullUserStatus{UserStatus: pg.UserStatus(status), Valid: true},
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
		FullName: req.FullName,
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

	// Initialize params with existing user data
	params := pg.UpdateUserParams{
		ID:          existingUser.ID,
		FullName:    existingUser.FullName, // Direct string value
		Email:       existingUser.Email,
		PhoneNumber: existingUser.PhoneNumber,
		Gender:      existingUser.Gender, // Keep existing gender
		OverAll:     existingUser.OverAll,
		XP:          existingUser.XP,
		Balance:     existingUser.Balance,
		DateOfBirth: existingUser.DateOfBirth,
		Photo:       existingUser.Photo,
	}

	validGenders := map[string]bool{
		"male":   true,
		"female": true,
		"other":  true,
	}

	if req.FullName != nil && *req.FullName != "" {
		params.FullName = *req.FullName
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
		// Convert string to UserGender type and create NullUserGender
		userGender := pg.UserGender(gender)
		params.Gender = pg.NullUserGender{UserGender: userGender, Valid: true}
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

		// Use pgtype.Date instead of pgtype.Timestamp
		params.DateOfBirth = pgtype.Date{
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
	var (
		dateOfBirth time.Time
		fullName    *string
		email       *string
		role        *string
		gender      *string
		status      *string
	)

	if u.DateOfBirth.Valid {
		dateOfBirth = u.DateOfBirth.Time
	}
	if u.FullName != "" {
		fullName = &u.FullName
	}

	email = u.Email

	if u.Role.Valid {
		roleStr := string(u.Role.UserRole)
		role = &roleStr
	}

	if u.Gender.Valid {
		genderStr := string(u.Gender.UserGender)
		gender = &genderStr
	}

	if u.Status.Valid {
		statusStr := string(u.Status.UserStatus)
		status = &statusStr
	}

	return model.UserResponse{
		ID:          u.ID,
		FullName:    fullName,
		Email:       email,
		Role:        role,
		Gender:      gender,
		Status:      status,
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
