package minio

import (
	"context"
	"io"
	"log"

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
	mn := &Minio{}
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

	mn.Client = minioClient
	return mn, nil
}

func (m *Minio) CreateBucket(ctx context.Context, bucketName string, location string) error {
	err := m.Client.MakeBucket(ctx, bucketName, minio.MakeBucketOptions{Region: location})
	if err != nil {
		exists, errBucketExists := m.Client.BucketExists(ctx, bucketName)
		if errBucketExists == nil && exists {
			log.Printf("We already own %s\n", bucketName)
		} else {
			return err
		}
	} else {
		log.Printf("Successfully created %s\n", bucketName)
	}
	return nil
}

func (m *Minio) RemoveBucket(ctx context.Context, bucketName string) error {
	return m.Client.RemoveBucket(ctx, bucketName)
}

func (m *Minio) PutObject(ctx context.Context,bucketName, objectName string, reader io.Reader, size int64, contentType string) (int64, error) {
    info, err := m.Client.PutObject(
        ctx,
        bucketName,
        objectName,
        reader,
        size,
        minio.PutObjectOptions{ContentType: contentType},
    )
    if err != nil {
        return 0, err
    }
    return info.Size, nil
}
func (m *Minio) GetObject(ctx context.Context,bucketName, objectName string) (*minio.Object, error) {
    obj, err := m.Client.GetObject(
        ctx,
        bucketName,
        objectName,
        minio.GetObjectOptions{},
    )
    if err != nil {
        return nil, err
    }
    return obj, nil
}

func (m *Minio) RemoveObject(ctx context.Context,bucketName, objectName string) error {
    opts := minio.RemoveObjectOptions{}
    
	err := m.Client.RemoveObject(ctx, bucketName, objectName, opts)
    if err != nil {
        return err
    }
    return nil
}

