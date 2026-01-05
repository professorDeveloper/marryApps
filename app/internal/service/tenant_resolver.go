package service

import (
	"context"
	"fmt"
	"log"
	"strings"

	"github.com/google/uuid"
	"gitlab.yurtal.tech/company/maryai/back/internal/repository"
)

// TenantResolver resolves tenant configuration from main DB
type TenantResolver struct {
	repo *repository.Repository
}

// NewTenantResolver creates a new tenant resolver
func NewTenantResolver(repo *repository.Repository) *TenantResolver {
	return &TenantResolver{
		repo: repo,
	}
}

// TenantConfig holds the resolved tenant configuration
type TenantConfig struct {
	BrandUUID uuid.UUID
	BrandID   string
	BrandName string
	// Future: database connection details if using per-tenant DBs
}

func (tr *TenantResolver) ResolveTenantByBrandID(ctx context.Context, brandID string) (*TenantConfig, error) {
	brandID = strings.TrimSpace(brandID)
	if brandID == "" {
		return nil, fmt.Errorf("invalid brand_id: empty")
	}

	var brandUUID uuid.UUID
	var brandName string
	var brandIDFromDB string

	err := tr.repo.PgRepo.MainPool.QueryRow(
		ctx,
		"SELECT id, name, brand_id FROM brands WHERE brand_id = $1",
		brandID,
	).Scan(&brandUUID, &brandName, &brandIDFromDB)
	if err != nil {
		log.Printf("Failed to resolve brand %s: %v", brandID, err)
		return nil, fmt.Errorf("brand not found or inactive")
	}

	return &TenantConfig{
		BrandUUID: brandUUID,
		BrandID:   brandIDFromDB,
		BrandName: brandName,
	}, nil
}

// ResolveTenantByBrandID resolves tenant configuration from main DB
// This function:
// 1. Queries main DB for brand info
// 2. Validates brand exists and is active
// 3. Returns tenant configuration for use in middleware
//
// Currently returns minimal config, but prepared for:
// - Per-tenant DB credentials (future)
// - Tenant metadata/settings (feature flags, storage quotas, etc.)

func (tr *TenantResolver) ResolveTenantByBrandUUID(ctx context.Context, brandUUID uuid.UUID) (*TenantConfig, error) {
	if brandUUID == uuid.Nil {
		return nil, fmt.Errorf("invalid brand_id: nil UUID")
	}

	// Query main DB for brand info
	brand, err := tr.repo.Main(ctx).GetBrandByID(ctx, brandUUID)
	if err != nil {
		log.Printf("Failed to resolve brand %s: %v", brandUUID.String(), err)
		return nil, fmt.Errorf("brand not found or inactive")
	}

	return &TenantConfig{
		BrandUUID: brandUUID,
		BrandID:   brand.BrandID,
		BrandName: brand.Name,
		// Future fields:
		// DatabaseHost: creds.Host,
		// DatabasePort: creds.Port,
		// DatabaseName: creds.DbName,
		// DatabaseUser: creds.Username,
		// DatabasePassword: decryptPassword(creds.PasswordHash),
	}, nil
}

// GetDatabaseCredentials retrieves the database credentials for a tenant
// DEPRECATED: No longer needed - we use schema-based multi-tenancy
// All tenants use the same database with isolated schemas
// Keeping this comment for historical reference
//
// Previously used when implementing per-tenant databases
// Now all tenants share maryaipgdb with separate schemas:
// - tenant_<brand-uuid> for each brand
// - Schema isolation via SET LOCAL search_path
// func (tr *TenantResolver) GetDatabaseCredentials(ctx context.Context, brandID uuid.UUID) error {
// 	if brandID == uuid.Nil {
// 		return fmt.Errorf("invalid brand_id: nil UUID")
// 	}

// 	// Schema-based approach doesn't require per-tenant database credentials
// 	// All database operations use TenantPool with schema switching
// 	return nil
// }
