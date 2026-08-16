package service

import (
	"bytes"
	"context"
	"fmt"
	"io"
	"path/filepath"
	"strings"
	"time"

	RealMinio "github.com/minio/minio-go/v7"
	"gitlab.yurtal.tech/company/maryai/back/internal/config"
	"gitlab.yurtal.tech/company/maryai/back/internal/model"
	minioClient "gitlab.yurtal.tech/company/maryai/back/pkg/minio"
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

func (s *MinioS) putFile(
	ctx context.Context,
	file io.Reader,
	size int64,
	fileName string,
	extension string,
	folderName string,
) (string, error) {

	bucketName := model.BucketName
	_ = s.minioClient.CreateBucket(ctx, bucketName, "")

	fileBuffer := make([]byte, 512)
	n, err := file.Read(fileBuffer)
	if err != nil && err != io.EOF {
		return "", fmt.Errorf("fayl buferini o'qishda xato: %w", err)
	}

	now := time.Now()
	timestamp := now.Format("20060102150405")

	cleanFileName := strings.ToLower(strings.ReplaceAll(fileName, " ", "_"))
	baseName := strings.TrimSuffix(cleanFileName, filepath.Ext(cleanFileName))

	objectName := fmt.Sprintf("%s_%s%s", baseName, timestamp, extension)

	fullReader := io.MultiReader(bytes.NewReader(fileBuffer[:n]), file)

	_, err = s.minioClient.PutObject(
		ctx,
		bucketName,
		folderName,
		objectName,
		fullReader,
		size,
		extension,
	)
	if err != nil {
		return "", fmt.Errorf("minio put object failed: %w", err)
	}

	return objectName, nil
}


func (s *MinioS) UploadImage(ctx context.Context, file io.Reader, size int64, fileName, ext string) (string, error) {
	return s.putFile(ctx, file, size, fileName, ext, model.ImageFolderName)
}

func (s *MinioS) UploadVideo(ctx context.Context, file io.Reader, size int64, fileName, ext string) (string, error) {
	return s.putFile(ctx, file, size, fileName, ext, model.VideoFolderName)
}


func (s *MinioS) getFile(ctx context.Context, objectName, folderName string) (*RealMinio.Object, error) {
	obj, err := s.minioClient.GetObject(ctx, model.BucketName, folderName, objectName)
	if err != nil {
		return nil, fmt.Errorf("minio get object failed: %w", err)
	}
	return obj, nil
}

func (s *MinioS) GetImage(ctx context.Context, objectName string) (*RealMinio.Object, error) {
	return s.getFile(ctx, objectName, model.ImageFolderName)
}


func (s *MinioS) GetVideo(ctx context.Context, objectName string) (*RealMinio.Object, error) {
	return s.getFile(ctx, objectName, model.VideoFolderName)
}