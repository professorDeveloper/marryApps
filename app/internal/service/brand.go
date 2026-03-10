package service

import (
	"context"
	"fmt"
	"log"
	"regexp"
	"strings"
	"time"
	"unicode"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
	"gitlab.yurtal.tech/company/maryai/back/internal/migrate"
	"gitlab.yurtal.tech/company/maryai/back/internal/model"
	"gitlab.yurtal.tech/company/maryai/back/internal/repository"
	pgmain "gitlab.yurtal.tech/company/maryai/back/internal/repository/pg/maindb"
	pg "gitlab.yurtal.tech/company/maryai/back/internal/repository/pg/tenantsdb"
	"gitlab.yurtal.tech/company/maryai/back/pkg/utils"
)

type BrandI interface {
	CreateBrand(ctx context.Context, name string) (*model.BrandResponse, error)
	GetBrand(ctx context.Context, brandID uuid.UUID) (*model.BrandResponse, error)
	ListBrands(ctx context.Context, limit, offset int32) ([]model.BrandResponse, int64, error)
	UpdateBrand(ctx context.Context, brandID uuid.UUID, name *string) (*model.BrandResponse, error)
	DeleteBrand(ctx context.Context, brandID uuid.UUID) error
	InitializeTenantSchema(ctx context.Context, brandID uuid.UUID) error

	CreateBrandSuperadmin(ctx context.Context, brandID uuid.UUID, req model.CreateBrandSuperadminRequest) (*model.BrandSuperadminResponse, error)
	ListBrandSuperadmins(ctx context.Context, brandID uuid.UUID) ([]model.BrandSuperadminResponse, error)
	GetBrandSuperadmin(ctx context.Context, brandID uuid.UUID, userID uuid.UUID) (*model.BrandSuperadminResponse, error)
	UpdateBrandSuperadmin(ctx context.Context, brandID uuid.UUID, userID uuid.UUID, req model.UpdateBrandSuperadminRequest) (*model.BrandSuperadminResponse, error)
	DeleteBrandSuperadmin(ctx context.Context, brandID uuid.UUID, userID uuid.UUID) error
}

type BrandS struct {
	repo *repository.Repository
}

func NewBrandS(repo *repository.Repository) *BrandS {
	return &BrandS{
		repo: repo,
	}
}

func normalizeBrandDb(name string) string {
	// Remove Uzbek apostrophe-like chars so:
	// Oʻ -> o, Gʻ -> g, O' -> o, etc.
	s := strings.ToLower(name)
	s = strings.NewReplacer("ʻ", "", "’", "", "‘", "", "`", "", "'", "").Replace(s)

	// Keep only letters/digits as tokens; convert separators to underscore.
	var b strings.Builder
	prevUnderscore := false
	for _, r := range s {
		if unicode.IsLetter(r) || unicode.IsDigit(r) {
			b.WriteRune(r)
			prevUnderscore = false
			continue
		}
		if !prevUnderscore {
			b.WriteByte('_')
			prevUnderscore = true
		}
	}
	out := b.String()
	out = regexp.MustCompile(`_+`).ReplaceAllString(out, "_")
	out = strings.Trim(out, "_")
	return out
}

func (s *BrandS) CreateBrand(ctx context.Context, name string) (*model.BrandResponse, error) {
	name = strings.TrimSpace(name)
	if name == "" {
		return nil, fmt.Errorf("brand name cannot be empty")
	}

	brandID := normalizeBrandDb(name)
	if brandID == "" {
		return nil, fmt.Errorf("brand name cannot be empty")
	}

	brand, err := s.repo.Main(ctx).CreateBrand(ctx, pgmain.CreateBrandParams{Name: name, BrandID: brandID})
	if err != nil {
		log.Printf("Failed to create brand: %v", err)
		return nil, fmt.Errorf("failed to create brand: %w", err)
	}

	schemaName := fmt.Sprintf("tenant_%s", brand.BrandID)

	if err := s.createSchema(ctx, schemaName); err != nil {
		log.Printf("Failed to create schema: %v", err)
		if _, dErr := s.repo.PgRepo.MainPool.Exec(ctx, "DELETE FROM brands WHERE id = $1", brand.ID); dErr != nil {
			log.Printf("Failed to rollback brand after schema creation error: %v", dErr)
		}
		return nil, fmt.Errorf("failed to create tenant schema: %w", err)
	}

	if err := s.runMigrationsInSchema(ctx, schemaName); err != nil {
		log.Printf("Failed to run migrations: %v", err)
		if _, sErr := s.repo.PgRepo.TenantPool.Exec(ctx, fmt.Sprintf("DROP SCHEMA IF EXISTS %s CASCADE", schemaName)); sErr != nil {
			log.Printf("Failed to drop schema after migrations error: %v", sErr)
		}
		if _, dErr := s.repo.PgRepo.MainPool.Exec(ctx, "DELETE FROM brands WHERE id = $1", brand.ID); dErr != nil {
			log.Printf("Failed to rollback brand after migrations error: %v", dErr)
		}
		return nil, fmt.Errorf("failed to run migrations in schema: %w", err)
	}

	return &model.BrandResponse{
		ID:        brand.ID,
		Name:      brand.Name,
		BrandID:   brand.BrandID,
		CreatedAt: brand.CreatedAt.Time,
		UpdatedAt: brand.UpdatedAt.Time,
	}, nil
}

func (s *BrandS) GetBrand(ctx context.Context, brandID uuid.UUID) (*model.BrandResponse, error) {
	if brandID == uuid.Nil {
		return nil, fmt.Errorf("invalid brand ID")
	}

	brand, err := s.repo.Main(ctx).GetBrandByID(ctx, brandID)
	if err != nil {
		log.Printf("Failed to get brand %s: %v", brandID.String(), err)
		return nil, fmt.Errorf("brand not found")
	}

	return &model.BrandResponse{
		ID:        brand.ID,
		Name:      brand.Name,
		BrandID:   brand.BrandID,
		CreatedAt: brand.CreatedAt.Time,
		UpdatedAt: brand.UpdatedAt.Time,
	}, nil
}

func (s *BrandS) ListBrands(ctx context.Context, limit, offset int32) ([]model.BrandResponse, int64, error) {
	if limit <= 0 {
		limit = 10
	}
	if limit > 100 {
		limit = 100
	}
	if offset < 0 {
		offset = 0
	}

	total, err := s.repo.Main(ctx).CountBrands(ctx)
	if err != nil {
		log.Printf("Failed to count brands: %v", err)
		return nil, 0, fmt.Errorf("failed to count brands: %w", err)
	}

	brands, err := s.repo.Main(ctx).ListBrands(ctx, pgmain.ListBrandsParams{
		Limit:  limit,
		Offset: offset,
	})
	if err != nil {
		log.Printf("Failed to list brands: %v", err)
		return nil, 0, fmt.Errorf("failed to list brands: %w", err)
	}

	var responses []model.BrandResponse
	for _, brand := range brands {
		responses = append(responses, model.BrandResponse{
			ID:        brand.ID,
			Name:      brand.Name,
			BrandID:   brand.BrandID,
			CreatedAt: brand.CreatedAt.Time,
			UpdatedAt: brand.UpdatedAt.Time,
		})
	}

	return responses, total, nil
}

func (s *BrandS) UpdateBrand(ctx context.Context, brandID uuid.UUID, name *string) (*model.BrandResponse, error) {
	if brandID == uuid.Nil {
		return nil, fmt.Errorf("invalid brand ID")
	}

	brand, err := s.repo.Main(ctx).GetBrandByID(ctx, brandID)
	if err != nil {
		return nil, fmt.Errorf("brand not found")
	}

	if name != nil {
		trimmedName := strings.TrimSpace(*name)
		if trimmedName == "" {
			return nil, fmt.Errorf("brand name cannot be empty")
		}
		brand.Name = trimmedName
	}

	return &model.BrandResponse{
		ID:        brand.ID,
		Name:      brand.Name,
		BrandID:   brand.BrandID,
		CreatedAt: brand.CreatedAt.Time,
		UpdatedAt: brand.UpdatedAt.Time,
	}, nil
}

func (s *BrandS) DeleteBrand(ctx context.Context, brandID uuid.UUID) error {
	if brandID == uuid.Nil {
		return fmt.Errorf("invalid brand ID")
	}

	brand, err := s.repo.Main(ctx).GetBrandByID(ctx, brandID)
	if err != nil {
		return fmt.Errorf("brand not found")
	}

	schemaName := fmt.Sprintf("tenant_%s", brand.BrandID)
	if _, err := s.repo.PgRepo.TenantPool.Exec(ctx, fmt.Sprintf("DROP SCHEMA IF EXISTS \"%s\" CASCADE", schemaName)); err != nil {
		log.Printf("Failed to drop schema %s: %v", schemaName, err)
		return fmt.Errorf("failed to drop tenant schema: %w", err)
	}

	if _, err := s.repo.Main(ctx).DeleteBrand(ctx, brandID); err != nil {
		log.Printf("Failed to delete brand %s: %v", brandID, err)
		return fmt.Errorf("failed to delete brand: %w", err)
	}

	return nil
}

// Sheqqa schema yaratib migratsiyalarni ishga tushiradi
func (s *BrandS) InitializeTenantSchema(ctx context.Context, brandID uuid.UUID) error {
	if brandID == uuid.Nil {
		return fmt.Errorf("invalid brand ID")
	}

	brand, err := s.repo.Main(ctx).GetBrandByID(ctx, brandID)
	if err != nil {
		log.Printf("Brand not found: %v", err)
		return fmt.Errorf("brand not found")
	}

	log.Printf("Initializing tenant schema for brand: %s (ID: %s)", brand.Name, brandID.String())

	schemaName := fmt.Sprintf("tenant_%s", brand.BrandID)

	if err := s.createSchema(ctx, schemaName); err != nil {
		log.Printf("Failed to create schema: %v", err)
		return fmt.Errorf("failed to create tenant schema: %w", err)
	}

	if err := s.runMigrationsInSchema(ctx, schemaName); err != nil {
		log.Printf("Failed to run migrations: %v", err)
		return fmt.Errorf("failed to run migrations in schema: %w", err)
	}

	log.Printf("Successfully initialized schema %s for brand %s", schemaName, brand.Name)
	return nil
}

func (s *BrandS) createSchema(ctx context.Context, schemaName string) error {
	if err := migrate.CreateTenantSchema(ctx, s.repo.PgRepo.TenantPool, schemaName); err != nil {
		return err
	}
	log.Printf("Schema %s created successfully", schemaName)
	return nil
}

func (s *BrandS) runMigrationsInSchema(ctx context.Context, schemaName string) error {
	return migrate.RunMigrationsInSchema(ctx, s.repo.PgRepo.TenantPool, schemaName)
}

// execInBrandSchema resolves brand schema and runs fn inside a transaction scoped to it.
func (s *BrandS) execInBrandSchema(ctx context.Context, brandID uuid.UUID, fn func(q *pg.Queries) error) error {
	resolver := NewTenantResolver(s.repo)
	cfg, err := resolver.ResolveTenantByBrandUUID(ctx, brandID)
	if err != nil {
		return err
	}
	schemaName := fmt.Sprintf("tenant_%s", cfg.BrandID)

	tx, err := s.repo.PgRepo.TenantPool.Begin(ctx)
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}
	if _, err := tx.Exec(ctx, fmt.Sprintf(`SET LOCAL search_path TO "%s", public`, schemaName)); err != nil {
		tx.Rollback(ctx)
		return fmt.Errorf("failed to set schema: %w", err)
	}
	q := s.repo.Tenant(ctx).WithTx(tx)
	if err := fn(q); err != nil {
		tx.Rollback(ctx)
		return err
	}
	return tx.Commit(ctx)
}

func toSuperadminResponse(u pg.User) model.BrandSuperadminResponse {
	r := model.BrandSuperadminResponse{
		ID:          u.ID.String(),
		FullName:    u.FullName,
		Username:    u.Username,
		Email:       u.Email,
		PhoneNumber: u.PhoneNumber,
		IsActive:    u.IsActive,
	}
	if u.BrandID.Valid {
		s := u.BrandID.String()
		r.BrandID = &s
	}
	if u.CreatedAt.Valid {
		t := u.CreatedAt.Time
		r.CreatedAt = &t
	}
	if u.UpdatedAt.Valid {
		t := u.UpdatedAt.Time
		r.UpdatedAt = &t
	}
	return r
}

func (s *BrandS) CreateBrandSuperadmin(ctx context.Context, brandID uuid.UUID, req model.CreateBrandSuperadminRequest) (*model.BrandSuperadminResponse, error) {
	req.Username = strings.TrimSpace(req.Username)
	req.Password = strings.TrimSpace(req.Password)
	if req.Username == "" {
		return nil, fmt.Errorf("username is required")
	}
	if req.Password == "" {
		return nil, fmt.Errorf("password is required")
	}

	hash, err := utils.HashPassword(req.Password)
	if err != nil {
		return nil, fmt.Errorf("failed to hash password: %w", err)
	}

	// Resolve brand to get brand UUID for brand_id field
	resolver := NewTenantResolver(s.repo)
	cfg, err := resolver.ResolveTenantByBrandUUID(ctx, brandID)
	if err != nil {
		return nil, err
	}

	fullName := strings.TrimSpace(req.FullName)

	var result model.BrandSuperadminResponse
	err = s.execInBrandSchema(ctx, brandID, func(q *pg.Queries) error {
		user, err := q.CreateUser(ctx, pg.CreateUserParams{
			ID:           uuid.New(),
			FullName:     &fullName,
			Username:     &req.Username,
			Role:         "superadmin",
			Email:        req.Email,
			PhoneNumber:  req.PhoneNumber,
			HashPassword: &hash,
			BrandID:      pgtype.UUID{Bytes: cfg.BrandUUID, Valid: true},
			BranchID:     pgtype.UUID{},
			ShiftID:      pgtype.UUID{},
			IsActive:     true,
			Pincode:      nil,
		})
		if err != nil {
			return fmt.Errorf("failed to create superadmin: %w", err)
		}
		result = toSuperadminResponse(user)
		return nil
	})
	if err != nil {
		return nil, err
	}
	return &result, nil
}

func (s *BrandS) ListBrandSuperadmins(ctx context.Context, brandID uuid.UUID) ([]model.BrandSuperadminResponse, error) {
	var result []model.BrandSuperadminResponse
	err := s.execInBrandSchema(ctx, brandID, func(q *pg.Queries) error {
		users, err := q.GetBrandSuperadmins(ctx)
		if err != nil {
			return fmt.Errorf("failed to list superadmins: %w", err)
		}
		for _, u := range users {
			result = append(result, toSuperadminResponse(u))
		}
		return nil
	})
	if err != nil {
		return nil, err
	}
	return result, nil
}

func (s *BrandS) GetBrandSuperadmin(ctx context.Context, brandID uuid.UUID, userID uuid.UUID) (*model.BrandSuperadminResponse, error) {
	var result model.BrandSuperadminResponse
	err := s.execInBrandSchema(ctx, brandID, func(q *pg.Queries) error {
		u, err := q.GetBrandSuperadminByID(ctx, userID)
		if err != nil {
			return fmt.Errorf("superadmin not found")
		}
		result = toSuperadminResponse(u)
		return nil
	})
	if err != nil {
		return nil, err
	}
	return &result, nil
}

func (s *BrandS) UpdateBrandSuperadmin(ctx context.Context, brandID uuid.UUID, userID uuid.UUID, req model.UpdateBrandSuperadminRequest) (*model.BrandSuperadminResponse, error) {
	var hashPtr *string
	if req.Password != nil && strings.TrimSpace(*req.Password) != "" {
		h, err := utils.HashPassword(*req.Password)
		if err != nil {
			return nil, fmt.Errorf("failed to hash password: %w", err)
		}
		hashPtr = &h
	}

	var result model.BrandSuperadminResponse
	err := s.execInBrandSchema(ctx, brandID, func(q *pg.Queries) error {
		u, err := q.UpdateBrandSuperadmin(ctx, pg.UpdateBrandSuperadminParams{
			ID:           userID,
			FullName:     req.FullName,
			Username:     req.Username,
			Email:        req.Email,
			PhoneNumber:  req.PhoneNumber,
			HashPassword: hashPtr,
			IsActive:     req.IsActive,
		})
		if err != nil {
			return fmt.Errorf("failed to update superadmin: %w", err)
		}
		result = toSuperadminResponse(u)
		return nil
	})
	if err != nil {
		return nil, err
	}
	return &result, nil
}

func (s *BrandS) DeleteBrandSuperadmin(ctx context.Context, brandID uuid.UUID, userID uuid.UUID) error {
	return s.execInBrandSchema(ctx, brandID, func(q *pg.Queries) error {
		if err := q.SoftDeleteBrandSuperadmin(ctx, userID); err != nil {
			return fmt.Errorf("failed to delete superadmin: %w", err)
		}
		return nil
	})
}

// ensure time import is used
var _ = time.Now
