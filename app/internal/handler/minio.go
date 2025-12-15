package handler

import (
	"fmt"
	"io"
	"net/http"

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
// @Success 200 {object} model.DownloadAvatarResponse "Avatar successfully uploaded"
// @Failure 400 {object} model.ErrorResponse "Invalid request or file not found"
// @Failure 401 {object} model.ErrorResponse "Unauthorized"
// @Failure 500 {object} model.ErrorResponse "Failed to process upload"
// @Router /api/v1/user/avatar [post]
func (h *Handler) UploadAvatar(c echo.Context) error {
	ctx := c.Request().Context()
	userID := c.Get("user_id").(string)
	lang := c.Get("lang").(string)

	fileHeader, err := c.FormFile("file")
	if err != nil {
		if lang == "de" {
			return c.JSON(http.StatusBadRequest, model.ErrorResponse{Message: "Datei nicht gefunden"})
		}
		return c.JSON(http.StatusBadRequest, model.ErrorResponse{Message: "File topilmadi"})
	}
	
	// File size in bytes (50MB = 50 * 1024 * 1024)
	maxSize := int64(50 * 1024 * 1024)
	if fileHeader.Size > maxSize {
		if lang == "de" {
			return c.JSON(http.StatusBadRequest, model.ErrorResponse{Message: "Datei größer als 50MB"})
		}
		return c.JSON(http.StatusBadRequest, model.ErrorResponse{Message: "File belgilangan hajmdan katta 50MB"})
	}

	src, err := fileHeader.Open()
	if err != nil {
		if lang == "de" {
			return c.JSON(http.StatusInternalServerError, model.ErrorResponse{Message: "Datei konnte nicht geöffnet werden"})
		}
		return c.JSON(http.StatusInternalServerError, model.ErrorResponse{Message: "Fayl oqimini ochishda xato"})
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
		if lang == "de" {
			return c.JSON(http.StatusInternalServerError, model.ErrorResponse{Message: "Fehler beim Hochladen"})
		}
		return c.JSON(http.StatusInternalServerError, model.ErrorResponse{Message: "Faylni yuklashda xatolik"})
	}

	return c.JSON(http.StatusOK, model.DownloadAvatarResponse{ObjectName: objectName})
}

// DownloadAvatar downloads user avatar from MinIO
// @Summary Download user avatar
// @Description Downloads a user's avatar by object name
// @Tags users
// @Produce octet-stream
// @Param object_name query string true "Object name of the avatar"
// @Success 200 {file} file "Avatar image file"
// @Failure 400 {object} model.ErrorResponse "Invalid request"
// @Failure 404 {object} model.ErrorResponse "Avatar not found"
// @Failure 500 {object} model.ErrorResponse "Failed to download file"
// @Router /api/v1/user/avatar [get]
func (h *Handler) DownloadAvatar(c echo.Context) error {
	lang := c.Get("lang").(string)
	req := model.DownloadAvatarRequest{}
	if err := c.Bind(&req); err != nil {
		if lang == "de" {
			return c.JSON(http.StatusBadRequest, model.ErrorResponse{Message: "Ungültige Anfrage"})
		}
		return c.JSON(http.StatusBadRequest, model.ErrorResponse{Message: "bad request"})
	}
	ctx := c.Request().Context()

	object, err := h.service.Minio().GetAvatar(ctx, req.ObjectName)
	if err != nil {
		if lang == "de" {
			return c.JSON(http.StatusNotFound, model.ErrorResponse{Message: "Avatar nicht gefunden"})
		}
		return c.JSON(http.StatusNotFound, model.ErrorResponse{Message: "Avatarni topib bo'lmadi"})
	}
	defer object.Close()

	c.Response().Header().Set(echo.HeaderContentDisposition, fmt.Sprintf("attachment; filename=%s", req.ObjectName))
	c.Response().Header().Set(echo.HeaderContentType, "application/octet-stream")
	c.Response().Header().Set("X-Content-Type-Options", "nosniff")

	if _, err = io.Copy(c.Response().Writer, object); err != nil {
		if lang == "de" {
			return c.JSON(http.StatusInternalServerError, model.ErrorResponse{Message: "Fehler beim Herunterladen"})
		}
		return c.JSON(http.StatusInternalServerError, model.ErrorResponse{Message: "Failed to download file"})
	}

	return nil
}