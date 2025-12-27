package service

import (
	"context"
	"fmt"
	"log"
	"strings"

	"github.com/google/uuid"
	"gitlab.yurtal.tech/company/maryai/back/internal/migrate"
	"gitlab.yurtal.tech/company/maryai/back/internal/model"
	"gitlab.yurtal.tech/company/maryai/back/internal/repository"
	pgmain "gitlab.yurtal.tech/company/maryai/back/internal/repository/pg/maindb"
)

type BrandI interface {
	CreateBrand(ctx context.Context, name string) (*model.BrandResponse, error)
	GetBrand(ctx context.Context, brandID uuid.UUID) (*model.BrandResponse, error)
	ListBrands(ctx context.Context, limit, offset int32) ([]model.BrandResponse, error)
	UpdateBrand(ctx context.Context, brandID uuid.UUID, name *string) (*model.BrandResponse, error)
	DeleteBrand(ctx context.Context, brandID uuid.UUID) error
	InitializeTenantSchema(ctx context.Context, brandID uuid.UUID) error
}

type BrandS struct {
	repo *repository.Repository
}

func NewBrandS(repo *repository.Repository) *BrandS {
	return &BrandS{
		repo: repo,
	}
}

func (s *BrandS) CreateBrand(ctx context.Context, name string) (*model.BrandResponse, error) {
	name = strings.TrimSpace(name)
	if name == "" {
		return nil, fmt.Errorf("brand name cannot be empty")
	}

	brand, err := s.repo.Main(ctx).CreateBrand(ctx, name)
	if err != nil {
		log.Printf("Failed to create brand: %v", err)
		return nil, fmt.Errorf("failed to create brand: %w", err)
	}

	return &model.BrandResponse{
		ID:        brand.ID,
		Name:      brand.Name,
		BrandDbID: brand.BrandDbID,
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
		BrandDbID: brand.BrandDbID,
		CreatedAt: brand.CreatedAt.Time,
		UpdatedAt: brand.UpdatedAt.Time,
	}, nil
}

func (s *BrandS) ListBrands(ctx context.Context, limit, offset int32) ([]model.BrandResponse, error) {
	if limit <= 0 {
		limit = 10
	}
	if limit > 100 {
		limit = 100
	}
	if offset < 0 {
		offset = 0
	}

	brands, err := s.repo.Main(ctx).ListBrands(ctx, pgmain.ListBrandsParams{
		Limit:  limit,
		Offset: offset,
	})
	if err != nil {
		log.Printf("Failed to list brands: %v", err)
		return nil, fmt.Errorf("failed to list brands: %w", err)
	}

	var responses []model.BrandResponse
	for _, brand := range brands {
		responses = append(responses, model.BrandResponse{
			ID:        brand.ID,
			Name:      brand.Name,
			BrandDbID: brand.BrandDbID,
			CreatedAt: brand.CreatedAt.Time,
			UpdatedAt: brand.UpdatedAt.Time,
		})
	}

	return responses, nil
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
		BrandDbID: brand.BrandDbID,
		CreatedAt: brand.CreatedAt.Time,
		UpdatedAt: brand.UpdatedAt.Time,
	}, nil
}

func (s *BrandS) DeleteBrand(ctx context.Context, brandID uuid.UUID) error {
	if brandID == uuid.Nil {
		return fmt.Errorf("invalid brand ID")
	}

	_, err := s.repo.Main(ctx).GetBrandByID(ctx, brandID)
	if err != nil {
		return fmt.Errorf("brand not found")
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

	schemaName := fmt.Sprintf("tenant_%s", strings.ReplaceAll(brandID.String(), "-", "_"))

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
