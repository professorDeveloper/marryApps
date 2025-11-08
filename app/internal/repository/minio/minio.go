package minio

import "github.com/minio/minio-go/v7"

type MinioRepo struct {
	Repo *minio.Client
}

func New(mn *minio.Client) *MinioRepo {
	return &MinioRepo{
		Repo: mn,
	}
}
