package service

import (
	"bytes"
	"context"
	"fmt"
	"io"
	"mime"
	"net/http"

	minioClient "gitlab.yurtal.tech/company/blitz/back/pkg/minio"
	RealMinio "github.com/minio/minio-go/v7"
	"gitlab.yurtal.tech/company/blitz/back/internal/config"
	"gitlab.yurtal.tech/company/blitz/back/internal/model"
)

type MinioS struct {
	cfg         *config.Config
	minioClient *minioClient.Minio
}

func NewMinioS(cfg *config.Config, minioClient *minioClient.Minio) *MinioS {
	return &MinioS{
		cfg:         cfg,
		minioClient: minioClient,
	}
}

func (s *MinioS) PutAvatar(ctx context.Context, file io.Reader, size int64, userID string) (string, error) {
	bucketName := model.AvatarBucketName

	fileBuffer := make([]byte, 512)
	n, err := file.Read(fileBuffer)
	if err != nil && err != io.EOF {
		return "", fmt.Errorf("fayl buferini o'qishda xato: %w", err)
	}

	contentType := http.DetectContentType(fileBuffer[:n])

	extensions, _ := mime.ExtensionsByType(contentType)
	extension := ""
	if len(extensions) > 0 {
		extension = extensions[0]
	} else {
		extension = ".bin"
	}

	objectName := fmt.Sprintf("%s/avatar%s", userID, extension)

	fullReader := io.MultiReader(bytes.NewReader(fileBuffer[:n]), file)
	_, err = s.minioClient.PutObject(ctx, bucketName, objectName, fullReader, size,objectName)
	if err != nil {
		return "", fmt.Errorf("minio put object failed: %w", err)
	}

	return objectName, nil
}

func (s *MinioS) GetAvatar(ctx context.Context, objectName string) (*RealMinio.Object, error) {
	bucketName := model.AvatarBucketName
	obj, err := s.minioClient.GetObject(ctx, bucketName, objectName)
	if err != nil {
		return nil, fmt.Errorf("minio get object failed: %w", err)
	}

	return obj, nil
}
