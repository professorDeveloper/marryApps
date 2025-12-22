package handler

import (
	"fmt"
	"io"
	"net/http"
	"path/filepath"
	"strings"

	"github.com/labstack/echo/v4"
	"gitlab.yurtal.tech/company/maryai/back/internal/model"
)

// UploadImage handles image upload to MinIO
// @Summary Upload user image
// @Description Uploads a user image file
// @Tags media
// @Accept mpfd
// @Produce json
// @Param file formData file true "Image file to upload"
// @Security BearerAuth
// @Success 200 {object} model.DownloadResponse "Image successfully uploaded"
// @Failure 400 {object} model.ErrorResponse "Invalid request or file not found"
// @Failure 401 {object} model.ErrorResponse "Unauthorized"
// @Failure 500 {object} model.ErrorResponse "Failed to process upload"
// @Router /api/v1/media/image [post]
func (h *Handler) UploadImage(c echo.Context) error {
	ctx := c.Request().Context()

	userIDInterface := c.Get("user_id")
	if userIDInterface == nil {
		return c.JSON(http.StatusUnauthorized, model.ErrorResponse{
			Message: "User ID not found in context",
		})
	}
	userID, ok := userIDInterface.(string)
	if !ok {
		return c.JSON(http.StatusInternalServerError, model.ErrorResponse{
			Message: "Invalid user ID format",
		})
	}

	lang := "uz"
	if langInterface := c.Get("lang"); langInterface != nil {
		if langStr, ok := langInterface.(string); ok {
			lang = langStr
		}
	}

	fileHeader, err := c.FormFile("file")
	if err != nil {
		message := model.GetLocalizedMessage(lang, "file_not_fount")
		return c.JSON(http.StatusBadRequest, model.ErrorResponse{Message: message})
	}

	maxSize := int64(50 * 1024 * 1024)
	if fileHeader.Size > maxSize {
		message := model.GetLocalizedMessage(lang, "file_too_large")
		return c.JSON(http.StatusBadRequest, model.ErrorResponse{Message: message})
	}

	src, err := fileHeader.Open()
	if err != nil {
		message := model.GetLocalizedMessage(lang, "error_while_getting_file")
		return c.JSON(http.StatusInternalServerError, model.ErrorResponse{Message: message})
	}
	defer src.Close()

	objectName, err := h.service.Minio().PutAvatar(
		ctx,
		src,
		fileHeader.Size,
		userID,
	)

	if err != nil {
		fmt.Printf("MinIOga yuklashda xatolik: %v\n", err)
		message := model.GetLocalizedMessage(lang, "error_while_getting_file")
		return c.JSON(http.StatusInternalServerError, model.ErrorResponse{Message: message})
	}

	return c.JSON(http.StatusOK, model.DownloadResponse{ObjectName: objectName})
}

// DownloadImage downloads image from MinIO
// @Summary Download image
// @Description Downloads an image by object name
// @Tags media
// @Accept json
// @Produce octet-stream
// @Security BearerAuth
// @Param object_name query string true "Image object name"
// @Success 200 {file} file "Image file"
// @Failure 400 {object} model.ErrorResponse "Invalid request"
// @Failure 404 {object} model.ErrorResponse "Image not found"
// @Failure 500 {object} model.ErrorResponse "Failed to download file"
// @Router /api/v1/user/media/download [get]
func (h *Handler) DownloadImage(c echo.Context) error {
	lang := "uz"
	if langInterface := c.Get("lang"); langInterface != nil {
		if langStr, ok := langInterface.(string); ok {
			lang = langStr
		}
	}

	objectName := c.QueryParam("object_name")
	if objectName == "" {
		message := model.GetLocalizedMessage(lang, "invalid_request_body")
		return c.JSON(http.StatusBadRequest, model.ErrorResponse{Message: message})
	}
	ctx := c.Request().Context()

	object, err := h.service.Minio().GetAvatar(ctx, objectName)
	if err != nil {
		message := model.GetLocalizedMessage(lang, "error_while_getting_file")
		return c.JSON(http.StatusNotFound, model.ErrorResponse{Message: message})
	}
	defer object.Close()

	c.Response().Header().Set(echo.HeaderContentDisposition, fmt.Sprintf("attachment; filename=%s", objectName))
	c.Response().Header().Set(echo.HeaderContentType, "application/octet-stream")
	c.Response().Header().Set("X-Content-Type-Options", "nosniff")

	if _, err = io.Copy(c.Response().Writer, object); err != nil {
		message := model.GetLocalizedMessage(lang, "error_while_getting_file")
		return c.JSON(http.StatusInternalServerError, model.ErrorResponse{Message: message})
	}

	return nil
}

// UploadVideo handles video upload to MinIO
// @Summary Upload video
// @Description Uploads a video file
// @Tags media
// @Accept mpfd
// @Produce json
// @Param file formData file true "Video file to upload"
// @Security BearerAuth
// @Success 200 {object} model.DownloadResponse "Video successfully uploaded"
// @Failure 400 {object} model.ErrorResponse "Invalid request or file not found"
// @Failure 401 {object} model.ErrorResponse "Unauthorized"
// @Failure 500 {object} model.ErrorResponse "Failed to process upload"
// @Router /api/v1/media/video [post]
func (h *Handler) UploadVideo(c echo.Context) error {
	ctx := c.Request().Context()

	lang := "uz"
	if langInterface := c.Get("lang"); langInterface != nil {
		if langStr, ok := langInterface.(string); ok {
			lang = langStr
		}
	}

	fileHeader, err := c.FormFile("file")
	if err != nil {
		message := model.GetLocalizedMessage(lang, "file_not_fount")
		return c.JSON(http.StatusBadRequest, model.ErrorResponse{Message: message})
	}

	maxSize := int64(100 * 1024 * 1024)
	if fileHeader.Size > maxSize {
		message := model.GetLocalizedMessage(lang, "file_too_large")
		return c.JSON(http.StatusBadRequest, model.ErrorResponse{Message: message})
	}
	fileExt := strings.ToLower(filepath.Ext(fileHeader.Filename))

	src, err := fileHeader.Open()
	if err != nil {
		message := model.GetLocalizedMessage(lang, "error_while_getting_file")
		return c.JSON(http.StatusInternalServerError, model.ErrorResponse{Message: message})
	}
	defer src.Close()

	objectName, err := h.service.Minio().PutVideo(
		ctx,
		src,
		fileHeader.Size,
		fileHeader.Filename,
		fileExt,
	)

	if err != nil {
		fmt.Printf("MinIOga yuklashda xatolik: %v\n", err)
		message := model.GetLocalizedMessage(lang, "error_while_getting_file")
		return c.JSON(http.StatusInternalServerError, model.ErrorResponse{Message: message})
	}

	return c.JSON(http.StatusOK, model.DownloadResponse{ObjectName: objectName})
}

// DownloadVideo downloads video from MinIO
// @Summary Download video
// @Description Downloads video by object name
// @Tags media
// @Accept json
// @Produce octet-stream
// @Security BearerAuth
// @Param object_name query string true "Video object name"
// @Success 200 {file} file "Video file"
// @Failure 400 {object} model.ErrorResponse "Invalid request"
// @Failure 404 {object} model.ErrorResponse "Video not found"
// @Failure 500 {object} model.ErrorResponse "Failed to download file"
// @Router /api/v1/media/video/download [get]
func (h *Handler) DownloadVideo(c echo.Context) error {
	lang := "uz"
	if langInterface := c.Get("lang"); langInterface != nil {
		if langStr, ok := langInterface.(string); ok {
			lang = langStr
		}
	}

	objectName := c.QueryParam("object_name")
	if objectName == "" {
		message := model.GetLocalizedMessage(lang, "invalid_request_body")
		return c.JSON(http.StatusBadRequest, model.ErrorResponse{Message: message})
	}
	ctx := c.Request().Context()

	object, err := h.service.Minio().GetVideo(ctx, objectName)
	if err != nil {
		message := model.GetLocalizedMessage(lang, "error_while_getting_file")
		return c.JSON(http.StatusNotFound, model.ErrorResponse{Message: message})
	}
	defer object.Close()

	c.Response().Header().Set(echo.HeaderContentDisposition, fmt.Sprintf("attachment; filename=%s", objectName))
	c.Response().Header().Set(echo.HeaderContentType, "application/octet-stream")
	c.Response().Header().Set("X-Content-Type-Options", "nosniff")

	if _, err = io.Copy(c.Response().Writer, object); err != nil {
		message := model.GetLocalizedMessage(lang, "error_while_getting_file")
		return c.JSON(http.StatusInternalServerError, model.ErrorResponse{Message: message})
	}

	return nil
}
