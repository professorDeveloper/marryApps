package minio

import (
	"context"
	"fmt"
	"io"
	"log"
	"strings"

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

func (m *Minio) PutObject(ctx context.Context, bucketName, folderName, objectName string, reader io.Reader, size int64, contentType string) (int64, error) {
	objectPath := objectName
	if folderName != "" {
		folderName = strings.TrimSuffix(folderName, "/")
		objectPath = folderName + "/" + objectName
	}
	fmt.Println(objectPath)
	info, err := m.Client.PutObject(
		ctx,
		bucketName,
		objectPath,
		reader,
		size,
		minio.PutObjectOptions{ContentType: contentType},
	)
	if err != nil {
		return 0, err
	}
	return info.Size, nil
}
func (m *Minio) GetObject(ctx context.Context, bucketName, folderName, objectName string) (*minio.Object, error) {
	objectPath := objectName
	if folderName != "" {
		folderName = strings.TrimSuffix(folderName, "/")
		objectPath = folderName + "/" + objectName
	}
	fmt.Println(objectPath)
	obj, err := m.Client.GetObject(
		ctx,
		bucketName,
		objectPath,
		minio.GetObjectOptions{},
	)
	if err != nil {
		return nil, err
	}
	return obj, nil
}

func (m *Minio) RemoveObject(ctx context.Context, bucketName, folderName, objectName string) error {
	opts := minio.RemoveObjectOptions{}
	objectPath := objectName
	if folderName != "" {
		folderName = strings.TrimSuffix(folderName, "/")
		objectPath = folderName + "/" + objectName
	}

	err := m.Client.RemoveObject(ctx, bucketName, objectPath, opts)
	if err != nil {
		return err
	}
	return nil
}
