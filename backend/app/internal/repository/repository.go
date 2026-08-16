package repository

import (
	"context"
	"errors"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	mn "gitlab.yurtal.tech/company/maryai/back/internal/repository/minio"
	pg "gitlab.yurtal.tech/company/maryai/back/internal/repository/pg"
	pgmain "gitlab.yurtal.tech/company/maryai/back/internal/repository/pg/maindb"
	pgtenants "gitlab.yurtal.tech/company/maryai/back/internal/repository/pg/tenantsdb"
	"gitlab.yurtal.tech/company/maryai/back/pkg/minio"
)

type (
	Repository struct {
		PgRepo
		MinioRepo
	}

	PgRepo struct {
		TenantPool   *pgxpool.Pool
		MainPool     *pgxpool.Pool
		tenantExpand *pg.ExpandManager
		mainExpand   *pg.ExpandManager
	}
	MinioRepo struct {
		Repo *mn.MinioRepo
	}
)

type tenantQueriesCtxKey struct{}
type tenantTxCtxKey struct{}
type mainQueriesCtxKey struct{}
type tenantMetadataCtxKey struct{}

// Sentinel errors for repository layer
var (
	// ErrTenantContextNotReady indicates tenant queries are not available in context
	// This happens when middleware has not set up tenant-scoped queries.
	// Service layers must ensure tenant context is properly initialized before calling repository methods.
	ErrTenantContextNotReady = errors.New("tenant context not ready: tenant queries not found in context")

	// ErrTenantTxNotReady indicates tenant transaction is not available in context
	ErrTenantTxNotReady = errors.New("tenant transaction not found in context")
)

func WithTenantQueries(ctx context.Context, q *pgtenants.Queries) context.Context {
	return context.WithValue(ctx, tenantQueriesCtxKey{}, q)
}

func WithTenantTx(ctx context.Context, tx pgx.Tx) context.Context {
	return context.WithValue(ctx, tenantTxCtxKey{}, tx)
}

// TenantMetadata holds tenant context information for safe repository operations
type TenantMetadata struct {
	BrandID  string
	BranchID string
	UserID   string
}

// WithTenantMetadata stores tenant metadata in context for repository layer
func WithTenantMetadata(ctx context.Context, meta TenantMetadata) context.Context {
	return context.WithValue(ctx, tenantMetadataCtxKey{}, meta)
}

// TenantMetadataFromContext retrieves tenant metadata from context
func TenantMetadataFromContext(ctx context.Context) (TenantMetadata, bool) {
	v := ctx.Value(tenantMetadataCtxKey{})
	if v == nil {
		return TenantMetadata{}, false
	}
	meta, ok := v.(TenantMetadata)
	return meta, ok
}

func TenantQueriesFromContext(ctx context.Context) (*pgtenants.Queries, bool) {
	v := ctx.Value(tenantQueriesCtxKey{})
	if v == nil {
		return nil, false
	}
	q, ok := v.(*pgtenants.Queries)
	return q, ok
}

func TenantTxFromContext(ctx context.Context) (pgx.Tx, bool) {
	v := ctx.Value(tenantTxCtxKey{})
	if v == nil {
		return nil, false
	}
	tx, ok := v.(pgx.Tx)
	return tx, ok
}

func (r *Repository) Tenant(ctx context.Context) *pgtenants.Queries {
	if q, ok := TenantQueriesFromContext(ctx); ok && q != nil {
		return q
	}
	// DEPRECATED: This method now returns nil when tenant context is not ready.
	// In the new architecture, middleware no longer sets search_path or tenant queries.
	// Service layers MUST use TenantQueries(ctx) which returns an error.
	// Returning nil here will cause a panic in the service layer, which is intentional
	// to force migration to the safe TenantQueries() method.
	return nil
}

// TenantQueries returns tenant queries from context with error handling.
// This is the safe method for obtaining tenant-scoped queries.
// It returns an error if tenant queries are not available in context,
// preventing unsafe raw pool fallback.
//
// Service layers should use this method instead of Tenant(ctx).
//
// Usage:
//
//	queries, err := repo.TenantQueries(ctx)
//	if err != nil {
//		return fmt.Errorf("tenant context not ready: %w", err)
//	}
//	// ... use queries ...
func (r *Repository) TenantQueries(ctx context.Context) (*pgtenants.Queries, error) {
	q, ok := TenantQueriesFromContext(ctx)
	if !ok || q == nil {
		return nil, ErrTenantContextNotReady
	}
	return q, nil
}

// TenantExpand returns an Expander scoped to the tenant transaction in ctx.
// NOTE: In the new architecture, middleware no longer sets search_path.
// Service layers using this must ensure search_path is set before expansion.
// If no tenant transaction is found in context, returns the base expander.
func (r *Repository) TenantExpand(ctx context.Context) pg.Expander {
	if tx, ok := TenantTxFromContext(ctx); ok && tx != nil {
		return r.PgRepo.tenantExpand.WithTx(tx)
	}
	return r.PgRepo.tenantExpand
}

// TenantExpandWithTx returns an Expander scoped to the provided transaction.
// This is the safe method for obtaining a tenant-scoped expander.
// It requires an explicit transaction parameter, ensuring the caller
// has control over the transaction lifecycle and search_path setup.
//
// Usage:
//
//	tx, err := repo.PgRepo.TenantPool.Begin(ctx)
//	if err != nil {
//		return err
//	}
//	defer tx.Rollback(ctx)
//	// Set search_path...
//	expander := repo.TenantExpandWithTx(tx)
func (r *Repository) TenantExpandWithTx(tx pgx.Tx) pg.Expander {
	return r.PgRepo.tenantExpand.WithTx(tx)
}

func WithMainQueries(ctx context.Context, q *pgmain.Queries) context.Context {
	return context.WithValue(ctx, mainQueriesCtxKey{}, q)
}

func MainQueriesFromContext(ctx context.Context) (*pgmain.Queries, bool) {
	v := ctx.Value(mainQueriesCtxKey{})
	if v == nil {
		return nil, false
	}
	q, ok := v.(*pgmain.Queries)
	return q, ok
}

func (r *Repository) Main(ctx context.Context) *pgmain.Queries {
	if q, ok := MainQueriesFromContext(ctx); ok && q != nil {
		return q
	}
	return pgmain.New(r.PgRepo.MainPool)
}

func New(mainPool, tenantPool *pgxpool.Pool, minioClient *minio.Minio) *Repository {
	return &Repository{
		PgRepo: PgRepo{
			TenantPool:   tenantPool,
			MainPool:     mainPool,
			tenantExpand: pg.NewExpandManager(tenantPool),
			mainExpand:   pg.NewExpandManager(mainPool),
		},
		MinioRepo: MinioRepo{
			Repo: mn.New(minioClient.Client),
		},
	}
}
