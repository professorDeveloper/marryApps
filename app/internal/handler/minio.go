package handler

import (
	"fmt"
	"io"
	"log"
	"mime"
	"net/http"
	"path/filepath"
	"strings"

	"github.com/labstack/echo/v4"
	"gitlab.yurtal.tech/company/maryai/back/internal/model"
	validator "gitlab.yurtal.tech/company/maryai/back/pkg/validate"
)

// DownloadVideo handles video download from MinIO
// @Summary      Videoni yuklab olish
// @Tags         media
// @Accept       json
// @Security     BearerAuth
// @Produce      octet-stream
// @Param        input body model.DownloadRequest true "Video obyekt nomi"
// @Success      200 {file} binary "Video fayli"
// @Router       /api/v1/media/video/download [post]
func (h *Handler) DownloadVideo(c echo.Context) error {
	req, err := validator.BindAndValidate[model.DownloadRequest](c)
	if err != nil {
		return err
	}

	object, err := h.service.Minio().GetVideo(c.Request().Context(), req.ObjectName)
	if err != nil {
		log.Printf("MinIO GetVideo Error: %v", err)
		return echo.NewHTTPError(http.StatusNotFound, "file_not_found")
	}
	defer object.Close()

	return h.streamFile(c, object, req.ObjectName)
}

// DownloadImage downloads image from MinIO
// @Summary      Rasmni yuklab olish
// @Tags         media
// @Accept       json
// @Produce      octet-stream
// @Security     BearerAuth
// @Param        input body model.DownloadRequest true "Rasm obyekt nomi"
// @Success      200 {file} binary "Rasm fayli"
// @Failure      404 {object} model.ErrorResponse "Rasm topilmadi"
// @Router       /api/v1/media/image/download [post]
func (h *Handler) DownloadImage(c echo.Context) error {
	req, err := validator.BindAndValidate[model.DownloadRequest](c)
	if err != nil {
		return err
	}

	object, err := h.service.Minio().GetImage(c.Request().Context(), req.ObjectName)
	if err != nil {
		log.Printf("MinIO GetImage Error: %v", err)
		return echo.NewHTTPError(http.StatusNotFound, "file_not_found")
	}
	defer object.Close()
	return h.streamFile(c, object, req.ObjectName)
}

// UploadImage handles image upload
// @Summary      Rasm yuklash
// @Tags         media
// @Accept       mpfd
// @Produce      json
// @Security     BearerAuth
// @Param        file formData file true "Rasm fayli"
// @Success      200 {object} model.DownloadSuccessResponse
// @Router       /api/v1/media/image [post]
func (h *Handler) UploadImage(c echo.Context) error {
		return h.handleGenericUpload(c,"image")
}



// UploadVideo handles video upload to MinIO
// @Summary      Video yuklash
// @Tags         media
// @Accept       mpfd
// @Produce      json
// @Security     BearerAuth
// @Param        file formData file true "Video fayli"
// @Success      200 {object} model.DownloadSuccessResponse
// @Router       /api/v1/media/video [post]
func (h *Handler) UploadVideo(c echo.Context) error {
	return h.handleGenericUpload(c, "video")
}

func (h *Handler) streamFile(c echo.Context, r io.Reader, filename string) error {
	cleanName := filepath.Base(filename)
	contentType := "application/octet-stream"
	ext := filepath.Ext(cleanName)
	if ext != "" {
		if t := mime.TypeByExtension(ext); t != "" {
			contentType = t
		}
	}

	c.Response().Header().Set(echo.HeaderContentDisposition, fmt.Sprintf("attachment; filename=%q", cleanName))
	c.Response().Header().Set(echo.HeaderContentType, contentType)
	c.Response().Header().Set("X-Content-Type-Options", "nosniff")

	if _, err := io.Copy(c.Response().Writer, r); err != nil {
		if c.Request().Context().Err() != nil {
			return nil
		}
		log.Printf("Streaming Error: %v", err)
		return echo.NewHTTPError(http.StatusInternalServerError, "download_failed")
	}
	return nil
}

func (h *Handler) handleGenericUpload(c echo.Context, fileType string) error {
	ctx := c.Request().Context()
	fileHeader, err := c.FormFile("file")
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "file_not_found")
	}

	maxSize := int64(50 * 1024 * 1024)
	if fileType == "video" {
		maxSize = 100 * 1024 * 1024
	}
	if fileHeader.Size > maxSize {
		return echo.NewHTTPError(http.StatusBadRequest, "file_too_large")
	}

	src, err := fileHeader.Open()
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "file_open_error")
	}
	defer src.Close()

	fileExt := strings.ToLower(filepath.Ext(fileHeader.Filename))
	var objectName string

	switch fileType {
	case "video":
		objectName, err = h.service.Minio().UploadVideo(ctx, src, fileHeader.Size, fileHeader.Filename, fileExt)
	case "image":
		objectName, err = h.service.Minio().UploadImage(ctx, src, fileHeader.Size, fileHeader.Filename, fileExt)
	}

	if err != nil {
		log.Printf("Upload Error (%s): %v", fileType, err)
		return echo.NewHTTPError(http.StatusInternalServerError, "upload_failed")
	}

	return c.JSON(http.StatusOK, model.SuccessResponses[model.DownloadResponse]{
		Status: "success",
		Data:   model.DownloadResponse{ObjectName: objectName},
	})
}
