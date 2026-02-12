package repository

import (
	"context"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	mn "gitlab.yurtal.tech/company/maryai/back/internal/repository/minio"
	pgmain "gitlab.yurtal.tech/company/maryai/back/internal/repository/pg/maindb"
	pg "gitlab.yurtal.tech/company/maryai/back/internal/repository/pg/tenantsdb"
	"gitlab.yurtal.tech/company/maryai/back/pkg/minio"
)

type (
	Repository struct {
		PgRepo
		MinioRepo
		// RedisRepo
	}

	PgRepo struct {
		TenantPool *pgxpool.Pool
		MainPool   *pgxpool.Pool
	}
	MinioRepo struct {
		Repo *mn.MinioRepo
	}
	// RedisRepo struct {
	// 	Repo *redis.Client
	// }
)

type tenantQueriesCtxKey struct{}
type tenantTxCtxKey struct{}

func WithTenantQueries(ctx context.Context, q *pg.Queries) context.Context {
	return context.WithValue(ctx, tenantQueriesCtxKey{}, q)
}

func WithTenantTx(ctx context.Context, tx pgx.Tx) context.Context {
	return context.WithValue(ctx, tenantTxCtxKey{}, tx)
}

func TenantQueriesFromContext(ctx context.Context) (*pg.Queries, bool) {
	v := ctx.Value(tenantQueriesCtxKey{})
	if v == nil {
		return nil, false
	}
	q, ok := v.(*pg.Queries)
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

func (r *Repository) Tenant(ctx context.Context) *pg.Queries {
	if q, ok := TenantQueriesFromContext(ctx); ok && q != nil {
		return q
	}
	return pg.New(r.PgRepo.TenantPool)
}

type mainQueriesCtxKey struct{}

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
			TenantPool: tenantPool,
			MainPool:   mainPool,
		},
		MinioRepo: MinioRepo{
			Repo: mn.New(minioClient.Client),
		},
	}
}
