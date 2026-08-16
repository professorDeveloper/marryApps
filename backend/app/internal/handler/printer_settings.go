package handler

import (
	"net/http"

	"github.com/labstack/echo/v4"

	"gitlab.yurtal.tech/company/maryai/back/internal/model"
)

type PrinterSettingCreateSuccessResponse struct {
	Status  string                       `json:"status" example:"success"`
	Message string                       `json:"message" example:"Printer setting created successfully"`
	Data    model.PrinterSettingResponse `json:"data"`
	Code    int                          `json:"code" example:"201"`
}

type PrinterSettingGetSuccessResponse struct {
	Status  string                       `json:"status" example:"success"`
	Message string                       `json:"message" example:"Printer setting fetched successfully"`
	Data    model.PrinterSettingResponse `json:"data"`
	Code    int                          `json:"code" example:"200"`
}

type PrinterSettingListSuccessResponse struct {
	Status  string                         `json:"status" example:"success"`
	Message string                         `json:"message" example:"Printer settings fetched successfully"`
	Data    []model.PrinterSettingResponse `json:"data"`
	Code    int                            `json:"code" example:"200"`
}

type PrinterSettingUpdateSuccessResponse struct {
	Status  string                       `json:"status" example:"success"`
	Message string                       `json:"message" example:"Printer setting updated successfully"`
	Data    model.PrinterSettingResponse `json:"data"`
	Code    int                          `json:"code" example:"200"`
}

type PrinterSettingDeleteSuccessResponse struct {
	Status  string `json:"status" example:"success"`
	Message string `json:"message" example:"Printer setting deleted successfully"`
	Data    struct{} `json:"data"`
	Code    int    `json:"code" example:"200"`
}

func getBrandIDFromContext(c echo.Context) string {
	brandID, _ := c.Get("brand_id").(string)
	if brandID == "" {
		brandID, _ = c.Get("brandID").(string)
	}
	return brandID
}

// CreatePrinterSetting godoc
// @Summary Create printer setting
// @Description Create new printer setting for current tenant
// @Tags printer-settings
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param request body model.CreatePrinterSettingRequest true "Create printer setting request"
// @Success 201 {object} handler.PrinterSettingCreateSuccessResponse
// @Failure 400 {object} model.ErrorResponse
// @Router /api/v1/settings/printer-settings [post]
func (h *Handler) CreatePrinterSetting(c echo.Context) error {
	var req model.CreatePrinterSettingRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"invalid request body",
			err.Error(),
			http.StatusBadRequest,
		))
	}

	brandID := getBrandIDFromContext(c)
	if brandID == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"brand_id is required",
			"brand_id not found in context",
			http.StatusBadRequest,
		))
	}

	resp, err := h.service.Settings().CreatePrinterSetting(c.Request().Context(), brandID, req)
	if err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"failed to create printer setting",
			err.Error(),
			http.StatusBadRequest,
		))
	}

	return c.JSON(http.StatusCreated, model.NewSuccessResponse(
		"Printer setting created successfully",
		resp,
		http.StatusCreated,
	))
}

// ListPrinterSettings godoc
// @Summary List printer settings
// @Description Get printer settings list for current tenant
// @Tags printer-settings
// @Accept json
// @Produce json
// @Security BearerAuth
// @Success 200 {object} handler.PrinterSettingListSuccessResponse
// @Failure 400 {object} model.ErrorResponse
// @Router /api/v1/settings/printer-settings [get]
func (h *Handler) ListPrinterSettings(c echo.Context) error {
	brandID := getBrandIDFromContext(c)
	if brandID == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"brand_id is required",
			"brand_id not found in context",
			http.StatusBadRequest,
		))
	}

	resp, err := h.service.Settings().ListPrinterSettings(c.Request().Context(), brandID)
	if err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"failed to list printer settings",
			err.Error(),
			http.StatusBadRequest,
		))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse(
		"Printer settings fetched successfully",
		resp,
		http.StatusOK,
	))
}

// GetPrinterSettingByID godoc
// @Summary Get printer setting by id
// @Description Get one printer setting by id for current tenant
// @Tags printer-settings
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "Printer setting ID"
// @Success 200 {object} handler.PrinterSettingGetSuccessResponse
// @Failure 400 {object} model.ErrorResponse
// @Router /api/v1/settings/printer-settings/{id} [get]
func (h *Handler) GetPrinterSettingByID(c echo.Context) error {
	id := c.Param("id")
	if id == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"id is required",
			"missing path parameter: id",
			http.StatusBadRequest,
		))
	}

	brandID := getBrandIDFromContext(c)
	if brandID == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"brand_id is required",
			"brand_id not found in context",
			http.StatusBadRequest,
		))
	}

	resp, err := h.service.Settings().GetPrinterSettingByID(c.Request().Context(), brandID, id)
	if err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"failed to get printer setting",
			err.Error(),
			http.StatusBadRequest,
		))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse(
		"Printer setting fetched successfully",
		resp,
		http.StatusOK,
	))
}

// UpdatePrinterSetting godoc
// @Summary Update printer setting
// @Description Update printer setting by id for current tenant
// @Tags printer-settings
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "Printer setting ID"
// @Param request body model.UpdatePrinterSettingRequest true "Update printer setting request"
// @Success 200 {object} handler.PrinterSettingUpdateSuccessResponse
// @Failure 400 {object} model.ErrorResponse
// @Router /api/v1/settings/printer-settings/{id} [put]
func (h *Handler) UpdatePrinterSetting(c echo.Context) error {
	id := c.Param("id")
	if id == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"id is required",
			"missing path parameter: id",
			http.StatusBadRequest,
		))
	}

	var req model.UpdatePrinterSettingRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"invalid request body",
			err.Error(),
			http.StatusBadRequest,
		))
	}

	brandID := getBrandIDFromContext(c)
	if brandID == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"brand_id is required",
			"brand_id not found in context",
			http.StatusBadRequest,
		))
	}

	resp, err := h.service.Settings().UpdatePrinterSetting(c.Request().Context(), brandID, id, req)
	if err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"failed to update printer setting",
			err.Error(),
			http.StatusBadRequest,
		))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse(
		"Printer setting updated successfully",
		resp,
		http.StatusOK,
	))
}

// DeletePrinterSetting godoc
// @Summary Delete printer setting
// @Description Soft delete printer setting by id for current tenant
// @Tags printer-settings
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "Printer setting ID"
// @Success 200 {object} handler.PrinterSettingDeleteSuccessResponse
// @Failure 400 {object} model.ErrorResponse
// @Router /api/v1/settings/printer-settings/{id} [delete]
func (h *Handler) DeletePrinterSetting(c echo.Context) error {
	id := c.Param("id")
	if id == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"id is required",
			"missing path parameter: id",
			http.StatusBadRequest,
		))
	}

	brandID := getBrandIDFromContext(c)
	if brandID == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"brand_id is required",
			"brand_id not found in context",
			http.StatusBadRequest,
		))
	}

	if err := h.service.Settings().DeletePrinterSetting(c.Request().Context(), brandID, id); err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"failed to delete printer setting",
			err.Error(),
			http.StatusBadRequest,
		))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse(
		"Printer setting deleted successfully",
		struct{}{},
		http.StatusOK,
	))
}
