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
	"gitlab.yurtal.tech/company/maryai/back/internal/config"
	"gitlab.yurtal.tech/company/maryai/back/internal/model"
	"gitlab.yurtal.tech/company/maryai/back/internal/repository"
	"gitlab.yurtal.tech/company/maryai/back/internal/repository/pg"
	"gitlab.yurtal.tech/company/maryai/back/pkg/utils"
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
	log.Printf("Starting registration for phone: %s", req.PhoneNumber)
	_, err := s.repo.PgRepo.Repo.GetUserByPhoneNumber(ctx, &req.PhoneNumber)
	if err == nil {
		return fmt.Errorf("user with this phone number already exists")
	}
	if !errors.Is(err, pgx.ErrNoRows) {
		return fmt.Errorf("failed to check user existence: %w", err)
	}
	var hashPassword *string
	if strings.TrimSpace(req.Password) != "" {
		h, err := utils.HashPassword(req.Password)
		if err != nil {
			return fmt.Errorf("failed to process password: %w", err)
		}
		hashPassword = &h
	}
	validRoles := map[string]pg.UserRole{
		"admin":      pg.UserRoleAdmin,
		"user":       pg.UserRoleUser,
		"cashier":    pg.UserRoleCashier,
		"superadmin": pg.UserRoleSuperadmin,
		"kitchen":    pg.UserRoleKitchen,
		"waiter":     pg.UserRoleWaiter,
		"manager":    pg.UserRoleManager,
	}

	role := strings.TrimSpace(strings.ToLower(req.Role))
	userRole, validRole := validRoles[role]
	if !validRole {
		userRole = pg.UserRoleUser
		log.Printf("Using default role: %s", userRole)
	}

	fullName := strings.TrimSpace(req.FullName)
	username := strings.TrimSpace(req.Username)
	if username == "" {
		username = strings.TrimSpace(req.PhoneNumber)
	}
	pincode := strings.TrimSpace(req.Pincode)
	var pincodePtr *string
	if pincode != "" {
		pincodePtr = &pincode
	}
	userParams := pg.CreateUserParams{
		ID:           uuid.New(),
		FullName:     &fullName,
		Role:         pg.NullUserRole{UserRole: userRole, Valid: true},
		Email:        nil,
		Pincode:      pincodePtr,
		PhoneNumber:  &req.PhoneNumber,
		HashPassword: hashPassword,
		Username:     &username,
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

	log.Printf("Successfully created user with ID: %s", user.ID.String())
	return nil
}

func (s *AuthS) Login(ctx context.Context, req model.LoginRequest, jwtCfg *config.JwtConfig) (model.LoginResponse, error) {
	if req.Username == "" {
		return model.LoginResponse{}, errors.New(http.StatusText(http.StatusBadRequest))
	}
	user, err := s.repo.PgRepo.Repo.GetUserByUsername(ctx, &req.Username)
	if err != nil {
		return model.LoginResponse{}, errors.New(http.StatusText(http.StatusUnauthorized))
	}
	if req.Password != "" {
		if user.HashPassword == nil || *user.HashPassword == "" {
			return model.LoginResponse{}, errors.New(http.StatusText(http.StatusUnauthorized))
		}
		if err := utils.VerifyPassword(*user.HashPassword, req.Password); err != nil {
			return model.LoginResponse{}, errors.New(http.StatusText(http.StatusUnauthorized))
		}
	} else if req.Pincode != "" {
		if user.Pincode == nil || strings.TrimSpace(*user.Pincode) == "" {
			return model.LoginResponse{}, errors.New(http.StatusText(http.StatusUnauthorized))
		}
		if strings.TrimSpace(*user.Pincode) != req.Pincode {
			return model.LoginResponse{}, errors.New(http.StatusText(http.StatusUnauthorized))
		}
	} else {
		return model.LoginResponse{}, errors.New(http.StatusText(http.StatusBadRequest))
	}

	accessToken, err := utils.CreateJWT(time.Duration(jwtCfg.AccessToken.ExpiresIn)*time.Second,
		user.ID.String(),
		jwtCfg.SecretKey)
	if err != nil {
		return model.LoginResponse{}, err
	}
	refreshToken, err := utils.CreateJWT(time.Duration(jwtCfg.RefreshToken.ExpiresIn)*time.Second,
		user.ID.String(),
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

	userUUID, parseErr := uuid.Parse(fmt.Sprint(sub))
	if parseErr != nil {
		return model.RefreshResponse{}, parseErr
	}
	user, gErr := s.repo.PgRepo.Repo.GetUserByID(ctx, userUUID)
	if gErr != nil {
		return model.RefreshResponse{}, gErr
	}

	accessToken, err := utils.CreateJWT(time.Duration(jwtCfg.AccessToken.ExpiresIn)*time.Second,
		user.ID.String(),
		jwtCfg.SecretKey)
	if err != nil {
		return model.RefreshResponse{}, err
	}
	refreshToken, err = utils.CreateJWT(time.Duration(jwtCfg.RefreshToken.ExpiresIn)*time.Second,
		user.ID.String(),
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
	existingUser, err := s.repo.PgRepo.Repo.GetUserByID(ctx, userID)
	if err != nil {
		return fmt.Errorf("failed to get user: %w", err)
	}

	if existingUser.HashPassword == nil || *existingUser.HashPassword == "" {
		return fmt.Errorf("user has no password set or password hash is invalid")
	}

	if err := utils.VerifyPassword(*existingUser.HashPassword, currentPassword); err != nil {
		return fmt.Errorf("invalid current password")
	}

	hashedPassword, err := utils.HashPassword(newPassword)
	if err != nil {
		return fmt.Errorf("failed to hash password: %w", err)
	}

	params := pg.UpdateUserPasswordParams{ID: existingUser.ID, HashPassword: &hashedPassword}

	if _, err := s.repo.PgRepo.Repo.UpdateUserPassword(ctx, params); err != nil {
		return fmt.Errorf("failed to update password: %w", err)
	}

	return nil
}

func (s *AuthS) GetUserByID(ctx context.Context, userID string) (model.UserResponse, error) {
	uuidID, err := uuid.Parse(userID)
	if err != nil {
		return model.UserResponse{}, err
	}
	user, err := s.repo.PgRepo.Repo.GetUserByID(ctx, uuidID)
	if err != nil {
		return model.UserResponse{}, err
	}
	return toUserResponse(user), nil
}

func (s *AuthS) UpdateUser(ctx context.Context, req model.UpdateUserRequest, userID string) (model.UserResponse, error) {
	uuidID, err := uuid.Parse(userID)
	if err != nil {
		return model.UserResponse{}, err
	}
	existingUser, err := s.repo.PgRepo.Repo.GetUserByID(ctx, uuidID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return model.UserResponse{}, fmt.Errorf("user not found")
		}
		return model.UserResponse{}, fmt.Errorf("failed to fetch user: %w", err)
	}

	params := pg.UpdateUserParams{
		ID:           existingUser.ID,
		FullName:     existingUser.FullName,
		Username:     existingUser.Username,
		Role:         existingUser.Role,
		Email:        existingUser.Email,
		ShiftID:      existingUser.ShiftID,
		Pincode:      existingUser.Pincode,
		HashPassword: existingUser.HashPassword,
		BrandID:      existingUser.BrandID,
		PhoneNumber:  existingUser.PhoneNumber,
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

	user, err := s.repo.PgRepo.Repo.UpdateUser(ctx, params)
	if err != nil {
		log.Printf("Failed to update user: %v", err)
		return model.UserResponse{}, fmt.Errorf("failed to update user: %w", err)
	}

	return toUserResponse(user), nil
}

func toUserResponse(u pg.User) model.UserResponse {
	var (
		fullName  *string
		email     *string
		role      *string
		username  *string
		shiftID   *string
		createdAt *time.Time
		updatedAt *time.Time
		brandID   *int64
	)

	if u.FullName != nil {
		fullName = u.FullName
	}

	email = u.Email
	username = u.Username
	if u.ShiftID.Valid {
		s := u.ShiftID.String()
		shiftID = &s
	}
	if u.CreatedAt.Valid {
		t := u.CreatedAt.Time
		createdAt = &t
	}
	if u.UpdatedAt.Valid {
		t := u.UpdatedAt.Time
		updatedAt = &t
	}

	if u.Role.Valid {
		roleStr := string(u.Role.UserRole)
		role = &roleStr
	}

	return model.UserResponse{
		ID:          u.ID.String(),
		FullName:    fullName,
		Username:    username,
		Role:        role,
		Email:       email,
		PhoneNumber: u.PhoneNumber,
		ShiftID:     shiftID,
		BrandID:     brandID,
		CreatedAt:   createdAt,
		UpdatedAt:   updatedAt,
	}
}

// Additional methods for QR ordering system

// GetUsersByRole retrieves all users of a specific role
func (s *AuthS) GetUsersByRole(ctx context.Context, role string) ([]model.UserResponse, error) {
	userRole := pg.NullUserRole{
		UserRole: pg.UserRole(role),
		Valid:    true,
	}
	users, err := s.repo.PgRepo.Repo.GetUsersByRole(ctx, userRole)
	if err != nil {
		return nil, fmt.Errorf("failed to get users by role: %w", err)
	}

	var responses []model.UserResponse
	for _, user := range users {
		responses = append(responses, toUserResponse(user))
	}
	return responses, nil
}

// GetAllStaff retrieves all active staff members
func (s *AuthS) GetAllStaff(ctx context.Context) ([]model.UserResponse, error) {
	users, err := s.repo.PgRepo.Repo.GetAllUsers(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to get staff: %w", err)
	}

	var responses []model.UserResponse
	for _, user := range users {
		responses = append(responses, toUserResponse(user))
	}
	return responses, nil
}

// GetKitchenStaff retrieves all kitchen staff members
func (s *AuthS) GetKitchenStaff(ctx context.Context) ([]model.UserResponse, error) {
	return s.GetUsersByRole(ctx, string(pg.UserRoleKitchen))
}

// GetWaiters retrieves all waiter staff members
func (s *AuthS) GetWaiters(ctx context.Context) ([]model.UserResponse, error) {
	return s.GetUsersByRole(ctx, string(pg.UserRoleWaiter))
}

// GetCashiers retrieves all cashier staff members
func (s *AuthS) GetCashiers(ctx context.Context) ([]model.UserResponse, error) {
	return s.GetUsersByRole(ctx, string(pg.UserRoleCashier))
}

// DeleteUser performs a soft delete on a user
func (s *AuthS) DeleteUser(ctx context.Context, userID string) error {
	uuidID, err := uuid.Parse(userID)
	if err != nil {
		return fmt.Errorf("invalid user ID format: %w", err)
	}

	_, err = s.repo.PgRepo.Repo.SoftDeleteUser(ctx, uuidID)
	if err != nil {
		return fmt.Errorf("failed to delete user: %w", err)
	}

	return nil
}

// RestoreUser restores a soft-deleted user
func (s *AuthS) RestoreUser(ctx context.Context, userID string) error {
	uuidID, err := uuid.Parse(userID)
	if err != nil {
		return fmt.Errorf("invalid user ID format: %w", err)
	}

	_, err = s.repo.PgRepo.Repo.RestoreUser(ctx, uuidID)
	if err != nil {
		return fmt.Errorf("failed to restore user: %w", err)
	}

	return nil
}

// SearchUsers performs a full-text search on users
func (s *AuthS) SearchUsers(ctx context.Context, query string, limit, offset int32) ([]model.UserResponse, error) {
	users, err := s.repo.PgRepo.Repo.SearchUsers(ctx, pg.SearchUsersParams{
		Column1: &query,
		Limit:   limit,
		Offset:  offset,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to search users: %w", err)
	}

	var responses []model.UserResponse
	for _, user := range users {
		responses = append(responses, toUserResponse(user))
	}
	return responses, nil
}
