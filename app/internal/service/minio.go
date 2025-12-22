package service

import (
	"bytes"
	"context"
	"fmt"
	"io"
	"mime"
	"net/http"
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

func (s *MinioS) PutAvatar(ctx context.Context, file io.Reader, size int64, userID string) (string, error) {

	bucketName := model.BucketName
	folderName := model.ImageFolderName
	s.minioClient.CreateBucket(ctx, bucketName, "")

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

	objectName := fmt.Sprintf("%s_avatar%s", userID, extension)

	fullReader := io.MultiReader(bytes.NewReader(fileBuffer[:n]), file)
	_, err = s.minioClient.PutObject(ctx, bucketName, folderName, objectName, fullReader, size, extension)
	if err != nil {
		return "", fmt.Errorf("minio put object failed: %w", err)
	}

	return objectName, nil
}

func (s *MinioS) GetAvatar(ctx context.Context, objectName string) (*RealMinio.Object, error) {
	bucketName := model.BucketName
	folderName := model.ImageFolderName
	fmt.Println("objectName:", objectName)
	obj, err := s.minioClient.GetObject(ctx, bucketName, folderName, objectName)
	if err != nil {
		fmt.Println(err)
		return nil, fmt.Errorf("minio get object failed: %w", err)
	}

	return obj, nil
}

func (s *MinioS) PutVideo(ctx context.Context, file io.Reader, size int64, fileName string, extension string) (string, error) {

	bucketName := model.BucketName
	folderName := model.VideoFolderName
	s.minioClient.CreateBucket(ctx, bucketName, "")

	fileBuffer := make([]byte, 512)
	n, err := file.Read(fileBuffer)
	if err != nil && err != io.EOF {
		return "", fmt.Errorf("fayl buferini o'qishda xato: %w", err)
	}
	now := time.Now()
	timestamp := now.Format("20060102150405")
	cleanFileName := strings.ReplaceAll(fileName, " ", "_")
	cleanFileName = strings.ToLower(cleanFileName)

	objectName := fmt.Sprintf("%s_%s%s",
		strings.TrimSuffix(cleanFileName, filepath.Ext(cleanFileName)),
		timestamp,
		extension)

	fullReader := io.MultiReader(bytes.NewReader(fileBuffer[:n]), file)
	_, err = s.minioClient.PutObject(ctx, bucketName, folderName, objectName, fullReader, size, extension)
	if err != nil {
		return "", fmt.Errorf("minio put object failed: %w", err)
	}

	return objectName, nil
}
func (s *MinioS) GetVideo(ctx context.Context, objectName string) (*RealMinio.Object, error) {
	bucketName := model.BucketName
	folderName := model.VideoFolderName
	fmt.Println("objectName:", objectName)
	obj, err := s.minioClient.GetObject(ctx, bucketName, folderName, objectName)
	if err != nil {
		fmt.Println(err)
		return nil, fmt.Errorf("minio get object failed: %w", err)
	}

	return obj, nil
}
