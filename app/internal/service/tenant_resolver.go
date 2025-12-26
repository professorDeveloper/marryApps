package service

import (
	"context"
	"fmt"
	"log"

	"github.com/google/uuid"
	"gitlab.yurtal.tech/company/maryai/back/internal/repository"
	pgmain "gitlab.yurtal.tech/company/maryai/back/internal/repository/pg/maindb"
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
	BrandID   uuid.UUID
	BrandName string
	// Future: database connection details if using per-tenant DBs
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
func (tr *TenantResolver) ResolveTenantByBrandID(ctx context.Context, brandID uuid.UUID) (*TenantConfig, error) {
	if brandID == uuid.Nil {
		return nil, fmt.Errorf("invalid brand_id: nil UUID")
	}

	// Query main DB for brand info
	brand, err := tr.repo.Main(ctx).GetBrandByID(ctx, brandID)
	if err != nil {
		log.Printf("Failed to resolve brand %s: %v", brandID.String(), err)
		return nil, fmt.Errorf("brand not found or inactive")
	}

	return &TenantConfig{
		BrandID:   brandID,
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
// This is used when implementing per-tenant databases
// Currently returns nil as all tenants use the same tenants DB pool
func (tr *TenantResolver) GetDatabaseCredentials(ctx context.Context, brandID uuid.UUID) (*pgmain.DatabaseCredential, error) {
	if brandID == uuid.Nil {
		return nil, fmt.Errorf("invalid brand_id: nil UUID")
	}

	// Query main DB for database credentials
	// This would be used to dynamically connect to tenant-specific DBs
	creds, err := tr.repo.Main(ctx).GetDatabaseCredentialByBrandID(ctx, brandID)
	if err != nil {
		log.Printf("Failed to get credentials for brand %s: %v", brandID.String(), err)
		return nil, fmt.Errorf("database credentials not found")
	}

	return &creds, nil
}
