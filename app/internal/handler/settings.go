package handler

import (
	"log"
	"net/http"
	"strings"

	"github.com/labstack/echo/v4"
	"gitlab.yurtal.tech/company/maryai/back/internal/model"
)

// UpdatePOSPassword updates POS password for current tenant
// @Summary Update POS password
// @Description Update POS password for current tenant. Only admin/manager/superadmin can do this.
// @Tags settings
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param request body model.UpdatePOSPasswordRequest true "POS password update payload"
// @Success 200 {object} model.UpdatePOSPasswordSwaggerResponse
// @Failure 400 {object} model.ErrorData
// @Failure 401 {object} model.ErrorData
// @Failure 403 {object} model.ErrorData
// @Router /api/v1/settings/pos-password [put]
func (h *Handler) UpdatePOSPassword(c echo.Context) error {
	var req model.UpdatePOSPasswordRequest
	if err := c.Bind(&req); err != nil {
		log.Printf("UpdatePOSPassword bind error: %v", err)
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"Noto'g'ri so'rov formati",
			"see logs for details",
			http.StatusBadRequest,
		))
	}

	brandID, _ := c.Get("brand_id").(string)
	brandID = strings.TrimSpace(brandID)
	if brandID == "" {
		return c.JSON(http.StatusUnauthorized, model.NewErrorResponse(
			"Brand aniqlanmadi",
			"see logs for details",
			http.StatusUnauthorized,
		))
	}

	err := h.service.Auth().UpdatePOSPassword(
		c.Request().Context(),
		brandID,
		req.CurrentPassword,
		req.NewPassword,
	)
	if err != nil {
		log.Printf("UpdatePOSPassword failed: %v", err)

		status := http.StatusBadRequest
		if err.Error() == http.StatusText(http.StatusUnauthorized) {
			status = http.StatusUnauthorized
		}

		return c.JSON(status, model.NewErrorResponse(
			"POS password yangilanmadi",
			"see logs for details",
			status,
		))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse(
		"POS password muvaffaqiyatli yangilandi",
		model.UpdatePOSPasswordResponse{Message: "updated"},
		http.StatusOK,
	))
}

// GetPOSPasswordStatus returns whether POS password is configured
// @Summary Get POS password status
// @Description Returns whether POS password is configured for current tenant
// @Tags settings
// @Accept json
// @Produce json
// @Security BearerAuth
// @Success 200 {object} model.POSPasswordStatusSwaggerResponse
// @Failure 401 {object} model.ErrorData
// @Failure 403 {object} model.ErrorData
// @Router /api/v1/settings/pos-password/status [get]
func (h *Handler) GetPOSPasswordStatus(c echo.Context) error {
	brandID, _ := c.Get("brand_id").(string)
	brandID = strings.TrimSpace(brandID)
	if brandID == "" {
		return c.JSON(http.StatusUnauthorized, model.NewErrorResponse(
			"Brand aniqlanmadi",
			"see logs for details",
			http.StatusUnauthorized,
		))
	}

	ok, err := h.service.Auth().GetPOSPasswordStatus(c.Request().Context(), brandID)
	if err != nil {
		log.Printf("GetPOSPasswordStatus failed: %v", err)
		status := http.StatusBadRequest
		if err.Error() == http.StatusText(http.StatusUnauthorized) {
			status = http.StatusUnauthorized
		}
		return c.JSON(status, model.NewErrorResponse(
			"POS password holatini olishda xatolik",
			"see logs for details",
			status,
		))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse(
		"POS password holati olindi",
		model.POSPasswordStatusResponse{IsConfigured: ok},
		http.StatusOK,
	))
}
