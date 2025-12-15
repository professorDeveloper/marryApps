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
// @Description Uploads a user avatar image file (supports multiple languages)
// @Tags users
// @Accept mpfd
// @Produce json
// @Param file formData file true "Image file to upload"
// @Param Accept-Language header string false "Language preference (e.g., 'de' for German, default: 'en')"
// @Success 200 {object} model.SuccessResponse "Avatar successfully uploaded"
// @Success 200 {object} model.SuccessResponse "Avatar erfolgreich hochgeladen"
// @Success 200 {object} model.SuccessResponse "Avatar muvaffaqiyatli yuklandi"
// @Failure 400 {object} model.ErrorResponse "Invalid request"
// @Failure 400 {object} model.ErrorResponse "Ungültige Anforderung"
// @Failure 400 {object} model.ErrorResponse "Noto'g'ri so'rov"
// @Failure 401 {object} model.ErrorResponse "Unauthorized"
// @Failure 401 {object} model.ErrorResponse "Nicht autorisiert"
// @Failure 401 {object} model.ErrorResponse "Avtorizatsiyadan o'tilmagan"
// @Failure 500 {object} model.ErrorResponse "Failed to process upload"
// @Failure 500 {object} model.ErrorResponse "Fehler beim Hochladen"
// @Failure 500 {object} model.ErrorResponse "Yuklashda xatolik yuz berdi"
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
	size := fileHeader.Size
	if size > 50 {
		if lang == "de" {
			return c.JSON(http.StatusBadRequest, model.ErrorResponse{Message: "Datei groesser als 50mb"})
		}
		return c.JSON(http.StatusBadRequest, model.ErrorResponse{Message: "File belgilangan hajmdan katta 50mb "})
	}

	src, err := fileHeader.Open()
	if err != nil {
		if lang == "de" {
			return c.JSON(http.StatusInternalServerError, model.ErrorResponse{Message: "Datei nicht gefunden"})
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
			return c.JSON(http.StatusInternalServerError, model.ErrorResponse{Message: "Datei nicht gefunden"})
		}
		return c.JSON(http.StatusInternalServerError, model.ErrorResponse{Message: "Faylni yuklashda xatolik"})
	}

	return c.JSON(http.StatusOK, model.DownloadAvatarResponse{ObjectName: objectName})
}

// handler/avatar.go yoki handler/user.go faylida

// DownloadAvatar downloads user avatar from MinIO
// @Summary Download user avatar
// @Description Downloads a user's avatar by user ID (supports multiple languages)
// @Tags users
// @Produce octet-stream
// @Param Accept-Language header string false "Language preference (e.g., 'de' for German, default: 'en')"
// @Success 200 {file} file "Avatar image file"
// @Failure 400 {object} model.ErrorResponse "Invalid request"
// @Failure 400 {object} model.ErrorResponse "Ungültige Anforderung"
// @Failure 400 {object} model.ErrorResponse "Noto'g'ri so'rov"
// @Failure 404 {object} model.ErrorResponse "Avatar not found"
// @Failure 404 {object} model.ErrorResponse "Avatar nicht gefunden"
// @Failure 404 {object} model.ErrorResponse "Avatar topilmadi"
// @Failure 500 {object} model.ErrorResponse "Failed to download file"
// @Failure 500 {object} model.ErrorResponse "Fehler beim Herunterladen der Datei"
// @Failure 500 {object} model.ErrorResponse "Faylni yuklashda xatolik yuz berdi"
// @Router /api/v1/user/avatar[get]
func (h *Handler) DownloadAvatar(c echo.Context) error {
	lang := c.Get("lang").(string)
	req := model.DownloadAvatarRequest{}
	if err := c.Bind(&req); err != nil {
		if lang == "de" {
			return c.JSON(http.StatusBadRequest, model.ErrorResponse{Message: "Datei nicht gefunden"})
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
			return c.JSON(http.StatusInternalServerError, model.ErrorResponse{Message: "Datei nicht gefunden"})
		}
		return c.JSON(http.StatusInternalServerError, model.ErrorResponse{Message: "Failed to download file"})
	}

	return nil

}
