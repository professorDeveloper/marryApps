package handler

import (
	"fmt"
	"io"
	"net/http"
	"path/filepath"
	"strings"

	"github.com/labstack/echo/v4"
	"gitlab.yurtal.tech/company/blitz/back/internal/model"
)

// UploadAvatar handles avatar upload to MinIO
// @Summary Upload user avatar
// @Description Uploads a user avatar image file
// @Tags users
// @Accept mpfd
// @Produce json
// @Param file formData file true "Image file to upload"
// @Security BearerAuth
// @Success 200 {object} model.DownloadResponse "Avatar successfully uploaded"
// @Failure 400 {object} model.ErrorResponse "Invalid request or file not found"
// @Failure 401 {object} model.ErrorResponse "Unauthorized"
// @Failure 500 {object} model.ErrorResponse "Failed to process upload"
// @Router /api/v1/user/image [post]
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

// DownloadAvatar downloads user avatar from MinIO
// @Summary Download user avatar
// @Description Downloads a user's avatar by object name
// @Tags users
// @Accept json
// @Produce octet-stream
// @Security BearerAuth
// @Param input body model.DownloadRequest true "Avatar object name"
// @Success 200 {file} file "Avatar image file"
// @Failure 400 {object} model.ErrorResponse "Invalid request"
// @Failure 404 {object} model.ErrorResponse "Avatar not found"
// @Failure 500 {object} model.ErrorResponse "Failed to download file"
// @Router /api/v1/user/image/download [post]
func (h *Handler) DownloadImage(c echo.Context) error {
	lang := "uz"
	if langInterface := c.Get("lang"); langInterface != nil {
		if langStr, ok := langInterface.(string); ok {
			lang = langStr
		}
	}

	req := model.DownloadRequest{}
	if err := c.Bind(&req); err != nil {
		message := model.GetLocalizedMessage(lang, "invalid_request_body")
		return c.JSON(http.StatusBadRequest, model.ErrorResponse{Message: message})
	}
	ctx := c.Request().Context()

	object, err := h.service.Minio().GetAvatar(ctx, req.ObjectName)
	if err != nil {
		message := model.GetLocalizedMessage(lang, "error_while_getting_file")
		return c.JSON(http.StatusNotFound, model.ErrorResponse{Message: message})
	}
	defer object.Close()

	c.Response().Header().Set(echo.HeaderContentDisposition, fmt.Sprintf("attachment; filename=%s", req.ObjectName))
	c.Response().Header().Set(echo.HeaderContentType, "application/octet-stream")
	c.Response().Header().Set("X-Content-Type-Options", "nosniff")

	if _, err = io.Copy(c.Response().Writer, object); err != nil {
		message := model.GetLocalizedMessage(lang, "error_while_getting_file")
		return c.JSON(http.StatusInternalServerError, model.ErrorResponse{Message: message})
	}

	return nil
}

// UploadBook handles avatar upload to MinIO
// @Summary Upload book
// @Description Uploads a book file
// @Tags library
// @Accept mpfd
// @Produce json
// @Param file formData file true "Book file to upload"
// @Security BearerAuth
// @Success 200 {object} model.DownloadResponse "Book successfully uploaded"
// @Failure 400 {object} model.ErrorResponse "Invalid request or file not found"
// @Failure 401 {object} model.ErrorResponse "Unauthorized"
// @Failure 500 {object} model.ErrorResponse "Failed to process upload"
// @Router /api/v1/library/book [post]
func (h *Handler) UploadBook(c echo.Context) error {
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
	fileExt := strings.ToLower(filepath.Ext(fileHeader.Filename))


	objectName, err := h.service.Minio().PutBook(
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

// DownloadBook downloads book from MinIO
// @Summary Download book
// @Description Downloads a book by object name
// @Tags library
// @Accept json
// @Produce octet-stream
// @Security BearerAuth
// @Param input body model.DownloadRequest true "Book object name"
// @Success 200 {file} file "Book file"
// @Failure 400 {object} model.ErrorResponse "Invalid request"
// @Failure 404 {object} model.ErrorResponse "Book not found"
// @Failure 500 {object} model.ErrorResponse "Failed to download file"
// @Router /api/v1/library/book/download [post]
func (h *Handler) DownloadBook(c echo.Context) error {
	lang := "uz"
	if langInterface := c.Get("lang"); langInterface != nil {
		if langStr, ok := langInterface.(string); ok {
			lang = langStr
		}
	}

	req := model.DownloadRequest{}
	if err := c.Bind(&req); err != nil {
		message := model.GetLocalizedMessage(lang, "invalid_request_body")
		return c.JSON(http.StatusBadRequest, model.ErrorResponse{Message: message})
	}
	ctx := c.Request().Context()

	object, err := h.service.Minio().GetBook(ctx, req.ObjectName)
	if err != nil {
		message := model.GetLocalizedMessage(lang, "error_while_getting_file")
		return c.JSON(http.StatusNotFound, model.ErrorResponse{Message: message})
	}
	defer object.Close()

	c.Response().Header().Set(echo.HeaderContentDisposition, fmt.Sprintf("attachment; filename=%s", req.ObjectName))
	c.Response().Header().Set(echo.HeaderContentType, "application/octet-stream")
	c.Response().Header().Set("X-Content-Type-Options", "nosniff")

	if _, err = io.Copy(c.Response().Writer, object); err != nil {
		message := model.GetLocalizedMessage(lang, "error_while_getting_file")
		return c.JSON(http.StatusInternalServerError, model.ErrorResponse{Message: message})
	}

	return nil
}
// UploadAudio handles audio upload to MinIO
// @Summary Upload user audio
// @Description Uploads a user audio file
// @Tags library
// @Accept mpfd
// @Produce json
// @Param file formData file true "Audio file to upload"
// @Security BearerAuth
// @Success 200 {object} model.DownloadResponse "Audio successfully uploaded"
// @Failure 400 {object} model.ErrorResponse "Invalid request or file not found"
// @Failure 401 {object} model.ErrorResponse "Unauthorized"
// @Failure 500 {object} model.ErrorResponse "Failed to process upload"
// @Router /api/v1/library/audio [post]
func (h *Handler) UploadAudio(c echo.Context) error {
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
	fileExt := strings.ToLower(filepath.Ext(fileHeader.Filename))

	defer src.Close()

	objectName, err := h.service.Minio().PutAudio(
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

// DownloadAudio downloads audio from MinIO
// @Summary Download user audio
// @Description Downloads audio podcast by object name
// @Tags library
// @Accept json
// @Produce octet-stream
// @Security BearerAuth
// @Param input body model.DownloadRequest true "Audio object name"
// @Success 200 {file} file "Audio file"
// @Failure 400 {object} model.ErrorResponse "Invalid request"
// @Failure 404 {object} model.ErrorResponse "Audio not found"
// @Failure 500 {object} model.ErrorResponse "Failed to download file"
// @Router /api/v1/library/audio/download [post]
func (h *Handler) DownloadAudio(c echo.Context) error {
	lang := "uz"
	if langInterface := c.Get("lang"); langInterface != nil {
		if langStr, ok := langInterface.(string); ok {
			lang = langStr
		}
	}

	req := model.DownloadRequest{}
	if err := c.Bind(&req); err != nil {
		message := model.GetLocalizedMessage(lang, "invalid_request_body")
		return c.JSON(http.StatusBadRequest, model.ErrorResponse{Message: message})
	}
	ctx := c.Request().Context()

	object, err := h.service.Minio().GetAudio(ctx, req.ObjectName)
	if err != nil {
		message := model.GetLocalizedMessage(lang, "error_while_getting_file")
		return c.JSON(http.StatusNotFound, model.ErrorResponse{Message: message})
	}
	defer object.Close()

	c.Response().Header().Set(echo.HeaderContentDisposition, fmt.Sprintf("attachment; filename=%s", req.ObjectName))
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
// @Tags library
// @Accept mpfd
// @Produce json
// @Param file formData file true "Video file to upload"
// @Security BearerAuth
// @Success 200 {object} model.DownloadResponse "Video successfully uploaded"
// @Failure 400 {object} model.ErrorResponse "Invalid request or file not found"
// @Failure 401 {object} model.ErrorResponse "Unauthorized"
// @Failure 500 {object} model.ErrorResponse "Failed to process upload"
// @Router /api/v1/library/video [post]
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
// @Tags library
// @Accept json
// @Produce octet-stream
// @Security BearerAuth
// @Param input body model.DownloadRequest true "Video object name"
// @Success 200 {file} file "Video file"
// @Failure 400 {object} model.ErrorResponse "Invalid request"
// @Failure 404 {object} model.ErrorResponse "Video not found"
// @Failure 500 {object} model.ErrorResponse "Failed to download file"
// @Router /api/v1/library/video/download [post]
func (h *Handler) DownloadVideo(c echo.Context) error {
	lang := "uz"
	if langInterface := c.Get("lang"); langInterface != nil {
		if langStr, ok := langInterface.(string); ok {
			lang = langStr
		}
	}

	req := model.DownloadRequest{}
	if err := c.Bind(&req); err != nil {
		message := model.GetLocalizedMessage(lang, "invalid_request_body")
		return c.JSON(http.StatusBadRequest, model.ErrorResponse{Message: message})
	}
	ctx := c.Request().Context()

	object, err := h.service.Minio().GetVideo(ctx, req.ObjectName)
	if err != nil {
		message := model.GetLocalizedMessage(lang, "error_while_getting_file")
		return c.JSON(http.StatusNotFound, model.ErrorResponse{Message: message})
	}
	defer object.Close()

	c.Response().Header().Set(echo.HeaderContentDisposition, fmt.Sprintf("attachment; filename=%s", req.ObjectName))
	c.Response().Header().Set(echo.HeaderContentType, "application/octet-stream")
	c.Response().Header().Set("X-Content-Type-Options", "nosniff")

	if _, err = io.Copy(c.Response().Writer, object); err != nil {
		message := model.GetLocalizedMessage(lang, "error_while_getting_file")
		return c.JSON(http.StatusInternalServerError, model.ErrorResponse{Message: message})
	}

	return nil
}
