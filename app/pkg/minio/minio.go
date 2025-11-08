package minio

import (
	"context"

	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"
)

type Minio struct {
	endpoint        string
	accessKeyID     string
	secretAccessKey string
	useSSL          bool

	Client *minio.Client
}

func New(opts ...Option) (*Minio, error) {
	mn := &Minio{
		useSSL: false,
	}
	for _, opt := range opts {
		opt(mn)
	}

	minioClient, err := minio.New(mn.endpoint, &minio.Options{
		Creds:  credentials.NewStaticV4(mn.accessKeyID, mn.secretAccessKey, ""),
		Secure: mn.useSSL,
	})
	if err != nil {
		return nil, err
	}

	return &Minio{Client: minioClient}, nil
}

func (m *Minio) CreateBucket(bucketName string) error {
	return m.Client.MakeBucket(context.Background(), bucketName, minio.MakeBucketOptions{Region: "us-east-1"})
}

func (m *Minio) RemoveBucket(bucketName string) error {
	return m.Client.RemoveBucket(context.Background(), bucketName)
}
