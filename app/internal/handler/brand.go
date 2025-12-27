package handler

import (
	"log"
	"net/http"
	"strconv"

	"github.com/google/uuid"
	"github.com/labstack/echo/v4"

	"gitlab.yurtal.tech/company/maryai/back/internal/model"
)

// CreateBrand creates a new brand
// @Summary Create brand
// @Description Create a new brand
// @Security BearerAuth
// @Tags brands
// @Accept json
// @Produce json
// @Param request body model.CreateBrandRequest true "Brand creation request"
// @Success 201 {object} model.BrandResponse
// @Failure 400 {object} model.ErrorResponse
// @Failure 500 {object} model.ErrorResponse
// @Router /api/v1/admin/brands [post]
func (h *Handler) CreateBrand(c echo.Context) error {
	req := &model.CreateBrandRequest{}
	if err := c.Bind(req); err != nil {
		log.Printf("Failed to bind brand creation request: %v", err)
		return c.JSON(http.StatusBadRequest, model.ErrorResponse{
			Message: "Invalid request body",
		})
	}

	if req.Name == "" {
		return c.JSON(http.StatusBadRequest, model.ErrorResponse{
			Message: "Brand name is required",
		})
	}

	ctx := c.Request().Context()
	resp, err := h.service.Brand().CreateBrand(ctx, req.Name)
	if err != nil {
		log.Printf("Failed to create brand: %v", err)
		return c.JSON(http.StatusInternalServerError, model.ErrorResponse{
			Message: "Failed to create brand",
		})
	}

	return c.JSON(http.StatusCreated, resp)
}

// GetBrand retrieves a brand by ID
// @Summary Get brand
// @Description Get a brand by ID
// @Tags brands
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "Brand ID"
// @Success 200 {object} model.BrandResponse
// @Failure 400 {object} model.ErrorResponse
// @Failure 404 {object} model.ErrorResponse
// @Failure 500 {object} model.ErrorResponse
// @Router /api/v1/admin/brands/{id} [get]
func (h *Handler) GetBrand(c echo.Context) error {
	brandIDStr := c.Param("id")
	brandID, err := uuid.Parse(brandIDStr)
	if err != nil {
		return c.JSON(http.StatusBadRequest, model.ErrorResponse{
			Message: "Invalid brand ID format",
		})
	}

	ctx := c.Request().Context()
	resp, err := h.service.Brand().GetBrand(ctx, brandID)
	if err != nil {
		return c.JSON(http.StatusNotFound, model.ErrorResponse{
			Message: "Brand not found",
		})
	}

	return c.JSON(http.StatusOK, resp)
}

// ListBrands retrieves all brands
// @Summary List brands
// @Description Get all brands with pagination
// @Tags brands
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param limit query int false "Limit (default: 10, max: 100)" minimum(1) maximum(100)
// @Param offset query int false "Offset (default: 0)" minimum(0)
// @Success 200 {array} model.BrandResponse
// @Failure 400 {object} model.ErrorResponse
// @Failure 500 {object} model.ErrorResponse
// @Router /api/v1/admin/brands [get]
func (h *Handler) ListBrands(c echo.Context) error {
	limitStr := c.QueryParam("limit")
	offsetStr := c.QueryParam("offset")

	limit := int32(10)
	offset := int32(0)

	if limitStr != "" {
		l, err := strconv.Atoi(limitStr)
		if err != nil || l <= 0 {
			return c.JSON(http.StatusBadRequest, model.ErrorResponse{
				Message: "Invalid limit parameter",
			})
		}
		if l > 100 {
			l = 100
		}
		limit = int32(l)
	}

	if offsetStr != "" {
		o, err := strconv.Atoi(offsetStr)
		if err != nil || o < 0 {
			return c.JSON(http.StatusBadRequest, model.ErrorResponse{
				Message: "Invalid offset parameter",
			})
		}
		offset = int32(o)
	}

	ctx := c.Request().Context()
	brands, err := h.service.Brand().ListBrands(ctx, limit, offset)
	if err != nil {
		log.Printf("Failed to list brands: %v", err)
		return c.JSON(http.StatusInternalServerError, model.ErrorResponse{
			Message: "Failed to list brands",
		})
	}

	return c.JSON(http.StatusOK, brands)
}

// UpdateBrand updates a brand
// @Summary Update brand
// @Description Update a brand by ID
// @Tags brands
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "Brand ID"
// @Param request body model.UpdateBrandRequest true "Brand update request"
// @Success 200 {object} model.BrandResponse
// @Failure 400 {object} model.ErrorResponse
// @Failure 404 {object} model.ErrorResponse
// @Failure 500 {object} model.ErrorResponse
// @Router /api/v1/admin/brands/{id} [put]
func (h *Handler) UpdateBrand(c echo.Context) error {
	brandIDStr := c.Param("id")
	brandID, err := uuid.Parse(brandIDStr)
	if err != nil {
		return c.JSON(http.StatusBadRequest, model.ErrorResponse{
			Message: "Invalid brand ID format",
		})
	}

	req := &model.UpdateBrandRequest{}
	if err := c.Bind(req); err != nil {
		log.Printf("Failed to bind brand update request: %v", err)
		return c.JSON(http.StatusBadRequest, model.ErrorResponse{
			Message: "Invalid request body",
		})
	}

	if req.Name == nil || *req.Name == "" {
		return c.JSON(http.StatusBadRequest, model.ErrorResponse{
			Message: "Brand name is required",
		})
	}

	ctx := c.Request().Context()
	resp, err := h.service.Brand().UpdateBrand(ctx, brandID, req.Name)
	if err != nil {
		log.Printf("Failed to update brand: %v", err)
		return c.JSON(http.StatusInternalServerError, model.ErrorResponse{
			Message: "Failed to update brand",
		})
	}

	return c.JSON(http.StatusOK, resp)
}

// DeleteBrand deletes a brand
// @Summary Delete brand
// @Description Delete a brand by ID
// @Tags brands
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "Brand ID"
// @Success 204
// @Failure 400 {object} model.ErrorResponse
// @Failure 404 {object} model.ErrorResponse
// @Failure 500 {object} model.ErrorResponse
// @Router /api/v1/admin/brands/{id} [delete]
func (h *Handler) DeleteBrand(c echo.Context) error {
	brandIDStr := c.Param("id")
	brandID, err := uuid.Parse(brandIDStr)
	if err != nil {
		return c.JSON(http.StatusBadRequest, model.ErrorResponse{
			Message: "Invalid brand ID format",
		})
	}

	ctx := c.Request().Context()
	if err := h.service.Brand().DeleteBrand(ctx, brandID); err != nil {
		log.Printf("Failed to delete brand: %v", err)
		return c.JSON(http.StatusInternalServerError, model.ErrorResponse{
			Message: "Failed to delete brand",
		})
	}

	return c.NoContent(http.StatusNoContent)
}

// InitializeTenantSchema initializes a tenant schema for a brand
// @Summary Initialize tenant schema
// @Description Create a schema for the brand and run tenant migrations
// @Tags brands
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "Brand ID"
// @Success 200 {object} map[string]string "Schema initialized successfully"
// @Failure 400 {object} model.ErrorResponse
// @Failure 404 {object} model.ErrorResponse
// @Failure 500 {object} model.ErrorResponse
// @Router /api/v1/admin/brands/{id}/init-schema [post]
func (h *Handler) InitializeTenantSchema(c echo.Context) error {
	brandIDStr := c.Param("id")
	brandID, err := uuid.Parse(brandIDStr)
	if err != nil {
		return c.JSON(http.StatusBadRequest, model.ErrorResponse{
			Message: "Invalid brand ID format",
		})
	}

	ctx := c.Request().Context()
	if err := h.service.Brand().InitializeTenantSchema(ctx, brandID); err != nil {
		log.Printf("Failed to initialize tenant schema: %v", err)
		return c.JSON(http.StatusInternalServerError, model.ErrorResponse{
			Message: "Failed to initialize tenant schema: " + err.Error(),
		})
	}

	return c.JSON(http.StatusOK, map[string]string{
		"message": "Tenant schema initialized successfully",
		"brandId": brandID.String(),
	})
}
