package service

import (
	"context"
	"errors"
	"fmt"
	"log"
	"strings"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"gitlab.yurtal.tech/company/maryai/back/internal/repository"
)

// Sentinel errors for tenant resolution
var (
	// ErrTenantNotFound indicates the tenant does not exist in the database
	ErrTenantNotFound = errors.New("tenant not found")

	// ErrTenantInactive indicates the tenant exists but is inactive
	// NOTE: Currently not implemented in DB schema (brands table lacks is_active column)
	// This sentinel is reserved for future use when active/inactive status is added
	ErrTenantInactive = errors.New("tenant is inactive")

	// ErrTenantResolveTimeout indicates the tenant resolution timed out
	ErrTenantResolveTimeout = errors.New("tenant resolution timed out")

	// ErrTenantResolveCanceled indicates the tenant resolution was canceled
	ErrTenantResolveCanceled = errors.New("tenant resolution canceled")

	// ErrTenantResolveDB indicates a database error during tenant resolution
	ErrTenantResolveDB = errors.New("database error during tenant resolution")

	// ErrInvalidInput indicates invalid input parameters
	ErrInvalidInput = errors.New("invalid input")
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
		return nil, fmt.Errorf("%w: brand_id is empty", ErrInvalidInput)
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

		// Classify error types
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, fmt.Errorf("%w: brand_id=%s", ErrTenantNotFound, brandID)
		}
		if errors.Is(err, context.Canceled) {
			return nil, fmt.Errorf("%w: brand_id=%s", ErrTenantResolveCanceled, brandID)
		}
		if errors.Is(err, context.DeadlineExceeded) {
			return nil, fmt.Errorf("%w: brand_id=%s", ErrTenantResolveTimeout, brandID)
		}

		// Generic DB error - preserve original error for debugging
		return nil, fmt.Errorf("%w: brand_id=%s, original=%v", ErrTenantResolveDB, brandID, err)
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
// 2. Returns tenant configuration for use in middleware
//
// Error classification:
// - ErrTenantNotFound: brand does not exist in database
// - ErrTenantResolveCanceled: request was canceled
// - ErrTenantResolveTimeout: request timed out
// - ErrTenantResolveDB: database error (connection, query, etc.)
// - ErrInvalidInput: empty brand_id
//
// Currently returns minimal config, but prepared for:
// - Per-tenant DB credentials (future)
// - Tenant metadata/settings (feature flags, storage quotas, etc.)

func (tr *TenantResolver) ResolveTenantByBrandUUID(ctx context.Context, brandUUID uuid.UUID) (*TenantConfig, error) {
	if brandUUID == uuid.Nil {
		return nil, fmt.Errorf("%w: brand_uuid is nil", ErrInvalidInput)
	}

	// Query main DB for brand info
	brand, err := tr.repo.Main(ctx).GetBrandByID(ctx, brandUUID)
	if err != nil {
		log.Printf("Failed to resolve brand %s: %v", brandUUID.String(), err)

		// Classify error types
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, fmt.Errorf("%w: brand_uuid=%s", ErrTenantNotFound, brandUUID.String())
		}
		if errors.Is(err, context.Canceled) {
			return nil, fmt.Errorf("%w: brand_uuid=%s", ErrTenantResolveCanceled, brandUUID.String())
		}
		if errors.Is(err, context.DeadlineExceeded) {
			return nil, fmt.Errorf("%w: brand_uuid=%s", ErrTenantResolveTimeout, brandUUID.String())
		}

		// Generic DB error - preserve original error for debugging
		return nil, fmt.Errorf("%w: brand_uuid=%s, original=%v", ErrTenantResolveDB, brandUUID.String(), err)
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
