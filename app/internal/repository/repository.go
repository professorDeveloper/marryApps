package repository

import (
	"context"

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

func WithTenantQueries(ctx context.Context, q *pgtenants.Queries) context.Context {
	return context.WithValue(ctx, tenantQueriesCtxKey{}, q)
}

func WithTenantTx(ctx context.Context, tx pgx.Tx) context.Context {
	return context.WithValue(ctx, tenantTxCtxKey{}, tx)
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
	return pgtenants.New(r.PgRepo.TenantPool)
}

// TenantExpand returns an Expander scoped to the tenant transaction in ctx so that
// the correct search_path (set by TenantMiddleware) is used when querying FK metadata.
func (r *Repository) TenantExpand(ctx context.Context) pg.Expander {
	if tx, ok := TenantTxFromContext(ctx); ok && tx != nil {
		return r.PgRepo.tenantExpand.WithTx(tx)
	}
	return r.PgRepo.tenantExpand
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
