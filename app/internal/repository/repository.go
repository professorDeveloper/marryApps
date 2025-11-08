package repository

import (
	mn "gitlab.yurtal.tech/company/blitz/back/internal/repository/minio"
	"gitlab.yurtal.tech/company/blitz/back/internal/repository/pg"
	"gitlab.yurtal.tech/company/blitz/back/pkg/minio"
	"gitlab.yurtal.tech/company/blitz/back/pkg/postgres"
)

type (
	Repository struct {
		PgRepo
		MinioRepo
		// RedisRepo
	}

	PgRepo struct {
		Repo *pg.Queries
	}
	MinioRepo struct {
		Repo *mn.MinioRepo
	}
	// RedisRepo struct {
	// 	Repo *redis.Client
	// }
)

func New(pgarg *postgres.Postgres, minioClient *minio.Minio) *Repository {
	return &Repository{
		PgRepo: PgRepo{
			Repo: pg.New(pgarg.Pool),
		},
		MinioRepo: MinioRepo{
			Repo: mn.New(minioClient.Client),
		},
	}
}
