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
	"gitlab.yurtal.tech/company/maryai/back/internal/config"
	"gitlab.yurtal.tech/company/maryai/back/internal/model"
	"gitlab.yurtal.tech/company/maryai/back/internal/repository"
	pg "gitlab.yurtal.tech/company/maryai/back/internal/repository/pg/tenantsdb"
	"gitlab.yurtal.tech/company/maryai/back/pkg/utils"
)

func roleToString(v interface{}) (string, bool) {
	if v == nil {
		return "", false
	}
	switch t := v.(type) {
	case *string:
		if t == nil {
			return "", false
		}
		ss := strings.TrimSpace(*t)
		if ss == "" {
			return "", false
		}
		return ss, true
	case string:
		if strings.TrimSpace(t) == "" {
			return "", false
		}
		return t, true
	case []byte:
		ss := strings.TrimSpace(string(t))
		if ss == "" {
			return "", false
		}
		return ss, true
	default:
		return "", false
	}
}

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
func normalizedRole(role string) string {
	return strings.ToLower(strings.TrimSpace(role))
}

func canUseTenantPasswordLogin(role string) bool {
	switch normalizedRole(role) {
	case "admin", "manager", "superadmin":
		return true
	default:
		return false
	}
}

func canUsePincodeLogin(role string) bool {
	switch normalizedRole(role) {
	case "cashier", "waiter", "kitchen", "admin", "manager":
		return true
	default:
		return false
	}
}

func canUseGlobalLogin(role string) bool {
	return normalizedRole(role) == "superadmin"
}

func buildTenantLoginResponse(
	ctx context.Context,
	q *pg.Queries,
	user pg.User,
	brandIDSlug string,
	jwtCfg *config.JwtConfig,
) (model.LoginResponse, error) {
	brandID := &brandIDSlug

	role := "user"
	if roleStr, ok := roleToString(user.Role); ok {
		role = normalizedRole(roleStr)
	}

	var branchID *string
	if user.BranchID.Valid {
		s := user.BranchID.String()
		branchID = &s
	} else if user.ShiftID.Valid {
		if sh, err := q.GetShiftByID(ctx, user.ShiftID.Bytes); err == nil {
			s := sh.BranchID.String()
			branchID = &s
		}
	}

	var cashRegisterID *string
	if user.CashRegisterID.Valid {
		s := user.CashRegisterID.String()
		cashRegisterID = &s
	}

	accessToken, err := utils.CreateJWTWithClaims(
		time.Duration(jwtCfg.AccessToken.ExpiresIn)*time.Second,
		user.ID,
		brandID,
		branchID,
		cashRegisterID,
		role,
		false,
		utils.TokenTypeAccess,
		jwtCfg.SecretKey,
	)
	if err != nil {
		return model.LoginResponse{}, err
	}

	refreshToken, err := utils.CreateJWTWithClaims(
		time.Duration(jwtCfg.RefreshToken.ExpiresIn)*time.Second,
		user.ID,
		brandID,
		branchID,
		cashRegisterID,
		role,
		false,
		utils.TokenTypeRefresh,
		jwtCfg.SecretKey,
	)
	if err != nil {
		return model.LoginResponse{}, err
	}

	return model.LoginResponse{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		User:         toUserResponse(user),
	}, nil
}

func (s *AuthS) verifyPOSPassword(ctx context.Context, tx pgx.Tx, posPassword string) (bool, error) {
	var hash string
	err := tx.QueryRow(ctx, `
		SELECT pos_password_hash
		FROM pos_auth_settings
		WHERE id = 1
	`).Scan(&hash)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return false, nil
		}
		return false, err
	}

	if strings.TrimSpace(hash) == "" {
		return false, nil
	}

	if err := utils.VerifyPassword(hash, posPassword); err != nil {
		return false, nil
	}

	return true, nil
}

func (s *AuthS) Register(ctx context.Context, req model.RegisterRequest) error {
	if req.PhoneNumber == "" {
		return fmt.Errorf("phone number is required")
	}
	if req.FullName == "" {
		return fmt.Errorf("full name is required")
	}

	log.Printf("Starting registration for phone: %s", req.PhoneNumber)

	role := strings.TrimSpace(strings.ToLower(req.Role))
	if role != "superadmin" {
		if req.BrandID == nil || strings.TrimSpace(*req.BrandID) == "" {
			return fmt.Errorf("brand_id is required for non-superadmin users")
		}
		if req.BranchID == nil || strings.TrimSpace(*req.BranchID) == "" {
			return fmt.Errorf("branch_id is required for non-superadmin users")
		}
	}

	var tenantBrandUUID uuid.UUID
	var tenantResolver *TenantResolver
	var brandIDSlug string
	var branchUUID pgtype.UUID

	if role != "superadmin" {
		branchStr := strings.TrimSpace(*req.BranchID)
		bID, err := uuid.Parse(branchStr)
		if err != nil {
			return fmt.Errorf("invalid branch_id: %w", err)
		}
		branchUUID = pgtype.UUID{Bytes: bID, Valid: true}
	}

	if role != "superadmin" {
		brandIDSlug = strings.TrimSpace(*req.BrandID)
		tenantResolver = NewTenantResolver(s.repo)
		tenantCfg, err := tenantResolver.ResolveTenantByBrandID(ctx, brandIDSlug)
		if err != nil {
			return fmt.Errorf("failed to resolve tenant: %w", err)
		}
		tenantBrandUUID = tenantCfg.BrandUUID

		schemaName := fmt.Sprintf("tenant_%s", brandIDSlug)
		log.Printf("Setting schema to: %s for user registration", schemaName)

		tx, err := s.repo.PgRepo.TenantPool.Begin(ctx)
		if err != nil {
			return fmt.Errorf("failed to begin transaction: %w", err)
		}

		if _, err := tx.Exec(ctx, fmt.Sprintf("SET LOCAL search_path TO \"%s\", public", schemaName)); err != nil {
			tx.Rollback(ctx)
			return fmt.Errorf("failed to set schema: %w", err)
		}

		var existingID string
		checkPhoneErr := tx.QueryRow(ctx,
			"SELECT id FROM users WHERE phone_number = $1 AND deleted_at = 0 LIMIT 1",
			&req.PhoneNumber).Scan(&existingID)

		if branchUUID.Valid {
			var branchID string
			checkBranchErr := tx.QueryRow(ctx,
				"SELECT id FROM branches WHERE id = $1 AND deleted_at = 0 LIMIT 1",
				branchUUID).Scan(&branchID)
			if checkBranchErr != nil {
				tx.Rollback(ctx)
				log.Printf("  ⚠️  Branch validation failed: branch_id=%s, schema=%s, error=%v", branchUUID.String(), schemaName, checkBranchErr)
				return fmt.Errorf("invalid branch_id: branch not found in schema")
			}
			log.Printf("  ✓ Branch validated: %s", branchID)
		}

		tx.Rollback(ctx)

		if checkPhoneErr == nil {
			return fmt.Errorf("user with this phone number already exists")
		}
		if !errors.Is(checkPhoneErr, pgx.ErrNoRows) {
			return fmt.Errorf("failed to check user existence: %w", checkPhoneErr)
		}
	} else {
		_, err := s.repo.Tenant(ctx).GetUserByPhoneNumber(ctx, &req.PhoneNumber)
		if err == nil {
			return fmt.Errorf("user with this phone number already exists")
		}
		if !errors.Is(err, pgx.ErrNoRows) {
			return fmt.Errorf("failed to check user existence: %w", err)
		}
	}
	validRoles := map[string]string{
		"admin":      "admin",
		"user":       "user",
		"cashier":    "cashier",
		"superadmin": "superadmin",
		"kitchen":    "kitchen",
		"waiter":     "waiter",
		"manager":    "manager",
	}

	userRole, validRole := validRoles[role]
	if !validRole {
		userRole = "user"
		log.Printf("Using default role: %s", userRole)
	}

	// role bo‘yicha credential policy
	switch userRole {
	case "superadmin":
		if strings.TrimSpace(req.Password) == "" {
			return fmt.Errorf("password is required for role %s", userRole)
		}

	case "admin", "manager":
		if strings.TrimSpace(req.Password) == "" && strings.TrimSpace(req.Pincode) == "" {
			return fmt.Errorf("password or pincode is required for role %s", userRole)
		}

	case "cashier", "waiter", "kitchen":
		if strings.TrimSpace(req.Pincode) == "" {
			return fmt.Errorf("pincode is required for role %s", userRole)
		}
	}

	var hashPassword *string
	if strings.TrimSpace(req.Password) != "" {
		h, err := utils.HashPassword(req.Password)
		if err != nil {
			return fmt.Errorf("failed to process password: %w", err)
		}
		hashPassword = &h
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

	brandID := pgtype.UUID{}

	if role == "superadmin" {
		log.Printf("User is superadmin, no brand_id required")
	} else if brandIDSlug != "" && tenantBrandUUID != uuid.Nil {
		brandID = pgtype.UUID{Bytes: tenantBrandUUID, Valid: true}
		log.Printf("User will be created with brand_id: %s", tenantBrandUUID.String())
	}

	cashRegUUID := pgtype.UUID{}
	if req.CashRegisterID != nil && *req.CashRegisterID != "" {
		if id, err := uuid.Parse(*req.CashRegisterID); err == nil {
			cashRegUUID = pgtype.UUID{Bytes: id, Valid: true}
		}
	}
	if role == "cashier" && !cashRegUUID.Valid {
		return fmt.Errorf("cash_register_id is required for cashier role")
	}

	userParams := pg.CreateUserParams{
		ID:             uuid.New(),
		FullName:       &fullName,
		Role:           userRole,
		Email:          nil,
		Pincode:        pincodePtr,
		PhoneNumber:    &req.PhoneNumber,
		HashPassword:   hashPassword,
		Username:       &username,
		BrandID:        brandID,
		IsActive:       true,
		BranchID:       branchUUID,
		CashRegisterID: cashRegUUID,
	}

	if role != "superadmin" && brandIDSlug != "" {
		schemaName := fmt.Sprintf("tenant_%s", brandIDSlug)
		tx, err := s.repo.PgRepo.TenantPool.Begin(ctx)
		if err != nil {
			return fmt.Errorf("failed to begin transaction: %w", err)
		}

		if _, err := tx.Exec(ctx, fmt.Sprintf("SET LOCAL search_path TO \"%s\", public", schemaName)); err != nil {
			tx.Rollback(ctx)
			return fmt.Errorf("failed to set schema: %w", err)
		}

		q := s.repo.Tenant(ctx).WithTx(tx)
		user, err := q.CreateUser(ctx, userParams)
		if err != nil {
			log.Printf("Error creating user in schema %s: %v", schemaName, err)
			tx.Rollback(ctx)
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

		if err := tx.Commit(ctx); err != nil {
			log.Printf("Failed to commit transaction: %v", err)
			return fmt.Errorf("failed to commit transaction: %w", err)
		}

		log.Printf("Successfully created user with ID: %s in schema: %s", user.ID.String(), schemaName)
		return nil
	}

	user, err := s.repo.Tenant(ctx).CreateUser(ctx, userParams)
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
	username := strings.TrimSpace(req.Username)
	password := strings.TrimSpace(req.Password)

	if username == "" {
		return model.LoginResponse{}, errors.New(http.StatusText(http.StatusBadRequest))
	}
	if password == "" {
		return model.LoginResponse{}, errors.New(http.StatusText(http.StatusBadRequest))
	}
	if req.BrandID == nil || strings.TrimSpace(*req.BrandID) == "" {
		return model.LoginResponse{}, errors.New("brand_id is required")
	}

	brandIDSlug := strings.TrimSpace(*req.BrandID)
	schemaName := fmt.Sprintf("tenant_%s", brandIDSlug)

	tx, err := s.repo.PgRepo.TenantPool.Begin(ctx)
	if err != nil {
		return model.LoginResponse{}, err
	}
	defer tx.Rollback(ctx)

	if _, err := tx.Exec(ctx, fmt.Sprintf(`SET LOCAL search_path TO "%s", public`, schemaName)); err != nil {
		return model.LoginResponse{}, errors.New(http.StatusText(http.StatusUnauthorized))
	}

	q := s.repo.Tenant(ctx).WithTx(tx)

	user, err := q.GetUserByUsername(ctx, &username)
	if err != nil {
		return model.LoginResponse{}, errors.New(http.StatusText(http.StatusUnauthorized))
	}

	if !user.IsActive {
		return model.LoginResponse{}, errors.New(http.StatusText(http.StatusUnauthorized))
	}

	role := "user"
	if roleStr, ok := roleToString(user.Role); ok {
		role = normalizedRole(roleStr)
	}

	if !canUseTenantPasswordLogin(role) {
		log.Printf("Login: role=%s cannot use tenant password login user=%s", role, user.ID)
		return model.LoginResponse{}, errors.New(http.StatusText(http.StatusUnauthorized))
	}

	if user.HashPassword == nil || *user.HashPassword == "" {
		return model.LoginResponse{}, errors.New(http.StatusText(http.StatusUnauthorized))
	}

	if err := utils.VerifyPassword(*user.HashPassword, password); err != nil {
		return model.LoginResponse{}, errors.New(http.StatusText(http.StatusUnauthorized))
	}

	if req.FCMToken != nil && strings.TrimSpace(*req.FCMToken) != "" {
		_, err := q.UpdateUserFCMToken(ctx, pg.UpdateUserFCMTokenParams{
			ID:       user.ID,
			FcmToken: req.FCMToken,
		})
		if err != nil {
			log.Printf("Failed to save FCM token: %v", err)
		}
	}

	return buildTenantLoginResponse(ctx, q, user, brandIDSlug, jwtCfg)
}

func (s *AuthS) LoginWithPincode(ctx context.Context, req model.PincodeLoginRequest, jwtCfg *config.JwtConfig) (model.LoginResponse, error) {
	brandIDSlug := strings.TrimSpace(req.BrandID)
	posPassword := strings.TrimSpace(req.PosPassword)

	if brandIDSlug == "" {
		return model.LoginResponse{}, errors.New("brand_id is required")
	}
	if posPassword == "" {
		return model.LoginResponse{}, errors.New("pos_password is required")
	}
	if req.Pincode == nil || strings.TrimSpace(*req.Pincode) == "" {
		return model.LoginResponse{}, errors.New("pincode is required")
	}

	pincode := strings.TrimSpace(*req.Pincode)
	req.Pincode = &pincode

	schemaName := fmt.Sprintf("tenant_%s", brandIDSlug)
	tx, err := s.repo.PgRepo.TenantPool.Begin(ctx)
	if err != nil {
		return model.LoginResponse{}, err
	}
	defer tx.Rollback(ctx)

	if _, err := tx.Exec(ctx, fmt.Sprintf(`SET LOCAL search_path TO "%s", public`, schemaName)); err != nil {
		return model.LoginResponse{}, errors.New(http.StatusText(http.StatusUnauthorized))
	}

	q := s.repo.Tenant(ctx).WithTx(tx)

	ok, err := s.verifyPOSPassword(ctx, tx, posPassword)
	if err != nil {
		log.Printf("LoginWithPincode: verifyPOSPassword failed: %v", err)
		return model.LoginResponse{}, err
	}
	if !ok {
		log.Printf("LoginWithPincode: invalid POS password for brand=%s", brandIDSlug)
		return model.LoginResponse{}, errors.New(http.StatusText(http.StatusUnauthorized))
	}

	user, err := q.GetUserByPincode(ctx, req.Pincode)
	if err != nil {
		log.Printf("LoginWithPincode: user not found by pincode: %v", err)
		return model.LoginResponse{}, errors.New(http.StatusText(http.StatusUnauthorized))
	}

	if !user.IsActive {
		return model.LoginResponse{}, errors.New(http.StatusText(http.StatusUnauthorized))
	}

	role := "user"
	if roleStr, ok := roleToString(user.Role); ok {
		role = normalizedRole(roleStr)
	}

	if !canUsePincodeLogin(role) {
		log.Printf("LoginWithPincode: role=%s cannot use POS pincode login user=%s", role, user.ID)
		return model.LoginResponse{}, errors.New(http.StatusText(http.StatusUnauthorized))
	}

	if req.FCMToken != nil && strings.TrimSpace(*req.FCMToken) != "" {
		_, err := q.UpdateUserFCMToken(ctx, pg.UpdateUserFCMTokenParams{
			ID:       user.ID,
			FcmToken: req.FCMToken,
		})
		if err != nil {
			log.Printf("Failed to save FCM token: %v", err)
		}
	}

	return buildTenantLoginResponse(ctx, q, user, brandIDSlug, jwtCfg)
}

func (s *AuthS) LoginGlobal(ctx context.Context, req model.LoginRequest, jwtCfg *config.JwtConfig) (model.LoginResponse, error) {
	username := strings.TrimSpace(req.Username)
	password := strings.TrimSpace(req.Password)

	if username == "" || password == "" {
		return model.LoginResponse{}, errors.New(http.StatusText(http.StatusBadRequest))
	}

	type mainUser struct {
		ID       uuid.UUID
		Username string
		Password string
		Email    string
		Role     string
	}

	var u mainUser
	err := s.repo.PgRepo.MainPool.QueryRow(
		ctx,
		"SELECT id, username, password, email, role FROM users WHERE username=$1",
		username,
	).Scan(&u.ID, &u.Username, &u.Password, &u.Email, &u.Role)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return model.LoginResponse{}, errors.New(http.StatusText(http.StatusUnauthorized))
		}
		return model.LoginResponse{}, err
	}

	role := normalizedRole(u.Role)
	if !canUseGlobalLogin(role) {
		log.Printf("LoginGlobal: role=%s cannot use global login user=%s", role, u.ID)
		return model.LoginResponse{}, errors.New(http.StatusText(http.StatusUnauthorized))
	}

	if err := utils.VerifyPassword(u.Password, password); err != nil {
		log.Printf("LoginGlobal: Password verification failed for user %s", u.Username)
		return model.LoginResponse{}, errors.New(http.StatusText(http.StatusUnauthorized))
	}

	accessToken, err := utils.CreateJWTWithClaims(
		time.Duration(jwtCfg.AccessToken.ExpiresIn)*time.Second,
		u.ID,
		nil,
		nil,
		nil,
		role,
		true,
		utils.TokenTypeAccess,
		jwtCfg.SecretKey,
	)
	if err != nil {
		return model.LoginResponse{}, err
	}

	refreshToken, err := utils.CreateJWTWithClaims(
		time.Duration(jwtCfg.RefreshToken.ExpiresIn)*time.Second,
		u.ID,
		nil,
		nil,
		nil,
		role,
		true,
		utils.TokenTypeRefresh,
		jwtCfg.SecretKey,
	)
	if err != nil {
		return model.LoginResponse{}, err
	}

	roleCopy := role
	email := u.Email
	uName := u.Username

	return model.LoginResponse{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		User: model.UserResponse{
			ID:       u.ID.String(),
			Username: &uName,
			Role:     &roleCopy,
			Email:    &email,
		},
	}, nil
}

func (s *AuthS) Refresh(ctx context.Context, req model.RefreshRequest, jwtCfg *config.JwtConfig) (model.RefreshResponse, error) {
	if req.RefreshToken == "" {
		return model.RefreshResponse{}, errors.New(http.StatusText(http.StatusUnauthorized))
	}

	claims, err := utils.ValidateJWTWithClaims(req.RefreshToken, jwtCfg.SecretKey)
	if err != nil {
		log.Printf("refresh: validate token failed: %v", err)
		return model.RefreshResponse{}, errors.New(http.StatusText(http.StatusUnauthorized))
	}

	if claims.TokenType != utils.TokenTypeRefresh {
		log.Printf("refresh: invalid token type=%s user=%s", claims.TokenType, claims.UserID)
		return model.RefreshResponse{}, errors.New(http.StatusText(http.StatusUnauthorized))
	}

	if claims.IsGlobal {
		var role string
		err := s.repo.PgRepo.MainPool.QueryRow(
			ctx,
			"SELECT role FROM users WHERE id=$1",
			claims.UserID,
		).Scan(&role)
		if err != nil {
			log.Printf("refresh global: role query failed for user=%s: %v", claims.UserID, err)
			if errors.Is(err, pgx.ErrNoRows) {
				return model.RefreshResponse{}, errors.New(http.StatusText(http.StatusUnauthorized))
			}
			return model.RefreshResponse{}, err
		}

		accessToken, err := utils.CreateJWTWithClaims(
			time.Duration(jwtCfg.AccessToken.ExpiresIn)*time.Second,
			claims.UserID,
			nil,
			nil,
			nil,
			role,
			true,
			utils.TokenTypeAccess,
			jwtCfg.SecretKey,
		)
		if err != nil {
			return model.RefreshResponse{}, err
		}

		refreshToken, err := utils.CreateJWTWithClaims(
			time.Duration(jwtCfg.RefreshToken.ExpiresIn)*time.Second,
			claims.UserID,
			nil,
			nil,
			nil,
			role,
			true,
			utils.TokenTypeRefresh,
			jwtCfg.SecretKey,
		)
		if err != nil {
			return model.RefreshResponse{}, err
		}

		return model.RefreshResponse{
			AccessToken:  accessToken,
			RefreshToken: refreshToken,
		}, nil
	}

	if claims.BrandID == nil {
		log.Printf("refresh tenant: claims.BrandID is nil for user=%s", claims.UserID)
		return model.RefreshResponse{}, errors.New(http.StatusText(http.StatusUnauthorized))
	}

	brandIDSlug := strings.TrimSpace(*claims.BrandID)
	if brandIDSlug == "" {
		log.Printf("refresh tenant: empty brand slug for user=%s", claims.UserID)
		return model.RefreshResponse{}, errors.New(http.StatusText(http.StatusUnauthorized))
	}

	schemaName := fmt.Sprintf("tenant_%s", brandIDSlug)
	tx, err := s.repo.PgRepo.TenantPool.Begin(ctx)
	if err != nil {
		log.Printf("refresh tenant: begin tx failed: %v", err)
		return model.RefreshResponse{}, err
	}
	defer tx.Rollback(ctx)

	if _, err := tx.Exec(ctx, fmt.Sprintf("SET LOCAL search_path TO \"%s\", public", schemaName)); err != nil {
		log.Printf("refresh tenant: set search_path failed schema=%s err=%v", schemaName, err)
		return model.RefreshResponse{}, errors.New(http.StatusText(http.StatusUnauthorized))
	}

	if claims.BranchID != nil && strings.TrimSpace(*claims.BranchID) != "" {
		if _, err := tx.Exec(ctx, "SET LOCAL app.branch_id = $1", strings.TrimSpace(*claims.BranchID)); err != nil {
			return model.RefreshResponse{}, errors.New(http.StatusText(http.StatusUnauthorized))
		}
	}

	q := s.repo.Tenant(ctx).WithTx(tx)

	user, gErr := q.GetUserByID(ctx, claims.UserID)
	if gErr != nil {
		log.Printf("refresh tenant: GetUserByID failed user=%s schema=%s err=%v", claims.UserID, schemaName, gErr)
		if errors.Is(gErr, pgx.ErrNoRows) {
			return model.RefreshResponse{}, errors.New(http.StatusText(http.StatusUnauthorized))
		}
		return model.RefreshResponse{}, gErr
	}

	brandID := claims.BrandID

	role := "user"
	if roleStr, ok := roleToString(user.Role); ok {
		role = roleStr
	}

	var branchID *string
	if user.BranchID.Valid {
		s := user.BranchID.String()
		branchID = &s
	} else if user.ShiftID.Valid {
		if sh, err := q.GetShiftByID(ctx, user.ShiftID.Bytes); err == nil {
			s := sh.BranchID.String()
			branchID = &s
		} else {
			log.Printf("refresh tenant: GetShiftByID failed shift=%s err=%v", user.ShiftID.Bytes, err)
		}
	}

	var cashRegisterID *string
	if user.CashRegisterID.Valid {
		s := user.CashRegisterID.String()
		cashRegisterID = &s
	}

	accessToken, err := utils.CreateJWTWithClaims(
		time.Duration(jwtCfg.AccessToken.ExpiresIn)*time.Second,
		user.ID,
		brandID,
		branchID,
		cashRegisterID,
		role,
		false,
		utils.TokenTypeAccess,
		jwtCfg.SecretKey,
	)
	if err != nil {
		log.Printf("refresh tenant: create access token failed: %v", err)
		return model.RefreshResponse{}, err
	}

	refreshToken, err := utils.CreateJWTWithClaims(
		time.Duration(jwtCfg.RefreshToken.ExpiresIn)*time.Second,
		user.ID,
		brandID,
		branchID,
		cashRegisterID,
		role,
		false,
		utils.TokenTypeRefresh,
		jwtCfg.SecretKey,
	)
	if err != nil {
		log.Printf("refresh tenant: create refresh token failed: %v", err)
		return model.RefreshResponse{}, err
	}

	return model.RefreshResponse{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
	}, nil
}

func (s *AuthS) UpdateUserPassword(ctx context.Context, userID uuid.UUID, currentPassword, newPassword string) error {
	existingUser, err := s.repo.Tenant(ctx).GetUserByID(ctx, userID)
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

	if _, err := s.repo.Tenant(ctx).UpdateUserPassword(ctx, params); err != nil {
		return fmt.Errorf("failed to update password: %w", err)
	}

	return nil
}

func (s *AuthS) GetUserByID(ctx context.Context, userID string) (model.UserResponse, error) {
	uuidID, err := uuid.Parse(userID)
	if err != nil {
		return model.UserResponse{}, err
	}
	user, err := s.repo.Tenant(ctx).GetUserByID(ctx, uuidID)
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
	existingUser, err := s.repo.Tenant(ctx).GetUserByID(ctx, uuidID)
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

	if req.Pincode != nil {
		p := strings.TrimSpace(*req.Pincode)
		if p == "" {
			params.Pincode = nil
		} else {
			params.Pincode = &p
		}
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

	user, err := s.repo.Tenant(ctx).UpdateUser(ctx, params)
	if err != nil {
		log.Printf("Failed to update user: %v", err)
		return model.UserResponse{}, fmt.Errorf("failed to update user: %w", err)
	}

	if req.IsActive != nil {
		user, err = s.repo.Tenant(ctx).UpdateUserIsActive(ctx, pg.UpdateUserIsActiveParams{
			ID:       existingUser.ID,
			IsActive: *req.IsActive,
		})
		if err != nil {
			log.Printf("Failed to update user is_active: %v", err)
			return model.UserResponse{}, fmt.Errorf("failed to update user is_active: %w", err)
		}
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
		brandID   *string
		branchID  *string
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

	if u.BrandID.Valid {
		b := u.BrandID.String()
		brandID = &b
	}

	if u.BranchID.Valid {
		br := u.BranchID.String()
		branchID = &br
	}

	var cashRegisterID *string
	if u.CashRegisterID.Valid {
		s := u.CashRegisterID.String()
		cashRegisterID = &s
	}

	if roleStr, ok := roleToString(u.Role); ok {
		role = &roleStr
	}

	return model.UserResponse{
		ID:             u.ID.String(),
		FullName:       fullName,
		Username:       username,
		Role:           role,
		IsActive:       u.IsActive,
		Email:          email,
		PhoneNumber:    u.PhoneNumber,
		ShiftID:        shiftID,
		BrandID:        brandID,
		BranchID:       branchID,
		CashRegisterID: cashRegisterID,
		CreatedAt:      createdAt,
		UpdatedAt:      updatedAt,
	}
}

func (s *AuthS) GetUsersByRole(ctx context.Context, role string, limit, offset int32) ([]model.UserResponse, int64, error) {
	role = strings.TrimSpace(strings.ToLower(role))

	total, err := s.repo.Tenant(ctx).CountUsersByRole(ctx, role)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to count users by role: %w", err)
	}

	users, err := s.repo.Tenant(ctx).GetUsersByRolePaginated(ctx, pg.GetUsersByRolePaginatedParams{
		Role:   role,
		Limit:  limit,
		Offset: offset,
	})
	if err != nil {
		return nil, 0, fmt.Errorf("failed to get users by role: %w", err)
	}

	var responses []model.UserResponse
	for _, user := range users {
		responses = append(responses, toUserResponse(user))
	}
	return responses, total, nil
}

func (s *AuthS) GetKitchenStaff(ctx context.Context, limit, offset int32) ([]model.UserResponse, int64, error) {
	total, err := s.repo.Tenant(ctx).CountStaffUsers(ctx)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to count staff: %w", err)
	}
	users, err := s.repo.Tenant(ctx).GetStaffUsersPaginated(ctx, pg.GetStaffUsersPaginatedParams{
		Limit:  limit,
		Offset: offset,
	})
	if err != nil {
		return nil, 0, fmt.Errorf("failed to get staff: %w", err)
	}
	var responses []model.UserResponse
	for _, u := range users {
		responses = append(responses, toUserResponse(u))
	}
	return responses, total, nil
}

func (s *AuthS) DeleteUser(ctx context.Context, userID string) error {
	uuidID, err := uuid.Parse(userID)
	if err != nil {
		return fmt.Errorf("invalid user ID format: %w", err)
	}

	_, err = s.repo.Tenant(ctx).SoftDeleteUser(ctx, uuidID)
	if err != nil {
		return fmt.Errorf("failed to delete user: %w", err)
	}

	return nil
}

func (s *AuthS) RestoreUser(ctx context.Context, userID string) error {
	uuidID, err := uuid.Parse(userID)
	if err != nil {
		return fmt.Errorf("invalid user ID format: %w", err)
	}

	_, err = s.repo.Tenant(ctx).RestoreUser(ctx, uuidID)
	if err != nil {
		return fmt.Errorf("failed to restore user: %w", err)
	}

	return nil
}

func (s *AuthS) SearchUsers(ctx context.Context, query string, limit, offset int32) ([]model.UserResponse, error) {
	users, err := s.repo.Tenant(ctx).SearchUsers(ctx, pg.SearchUsersParams{
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

func (s *AuthS) UpdatePOSPassword(ctx context.Context, brandID, currentPassword, newPassword string) error {
	brandID = strings.TrimSpace(brandID)
	currentPassword = strings.TrimSpace(currentPassword)
	newPassword = strings.TrimSpace(newPassword)

	if brandID == "" {
		return errors.New("brand_id is required")
	}
	if newPassword == "" {
		return errors.New("new_password is required")
	}
	if len(newPassword) < 4 {
		return errors.New("new_password must be at least 4 characters")
	}

	schemaName := fmt.Sprintf("tenant_%s", brandID)

	tx, err := s.repo.PgRepo.TenantPool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	if _, err := tx.Exec(ctx, fmt.Sprintf(`SET LOCAL search_path TO "%s", public`, schemaName)); err != nil {
		return errors.New(http.StatusText(http.StatusUnauthorized))
	}

	q := s.repo.Tenant(ctx).WithTx(tx)

	existing, err := q.GetPOSAuthSettings(ctx)
	if err != nil && !errors.Is(err, pgx.ErrNoRows) {
		return err
	}

	// Agar oldin parol bo‘lsa, currentPassword tekshiriladi
	if err == nil && strings.TrimSpace(existing.PosPasswordHash) != "" {
		if currentPassword == "" {
			return errors.New("current_password is required")
		}
		if verifyErr := utils.VerifyPassword(existing.PosPasswordHash, currentPassword); verifyErr != nil {
			return errors.New(http.StatusText(http.StatusUnauthorized))
		}
	}

	hashed, err := utils.HashPassword(newPassword)
	if err != nil {
		return err
	}

	if err := q.UpsertPOSAuthSettings(ctx, hashed); err != nil {
		return err
	}

	return tx.Commit(ctx)
}

func (s *AuthS) GetPOSPasswordStatus(ctx context.Context, brandID string) (bool, error) {
	brandID = strings.TrimSpace(brandID)
	if brandID == "" {
		return false, errors.New("brand_id is required")
	}

	schemaName := fmt.Sprintf("tenant_%s", brandID)

	tx, err := s.repo.PgRepo.TenantPool.Begin(ctx)
	if err != nil {
		return false, err
	}
	defer tx.Rollback(ctx)

	if _, err := tx.Exec(ctx, fmt.Sprintf(`SET LOCAL search_path TO "%s", public`, schemaName)); err != nil {
		return false, errors.New(http.StatusText(http.StatusUnauthorized))
	}

	q := s.repo.Tenant(ctx).WithTx(tx)

	row, err := q.GetPOSAuthSettings(ctx)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return false, nil
		}
		return false, err
	}

	if strings.TrimSpace(row.PosPasswordHash) == "" {
		return false, nil
	}

	return true, nil
}
