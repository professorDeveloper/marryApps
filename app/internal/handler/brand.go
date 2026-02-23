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
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"Invalid request format",
			err.Error(),
			http.StatusBadRequest,
		))
	}

	if req.Name == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"Brand name is required",
			"missing required field: name",
			http.StatusBadRequest,
		))
	}

	ctx := c.Request().Context()
	resp, err := h.service.Brand().CreateBrand(ctx, req.Name)
	if err != nil {
		log.Printf("Failed to create brand: %v", err)
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse(
			"Failed to create brand",
			err.Error(),
			http.StatusInternalServerError,
		))
	}

	return c.JSON(http.StatusCreated, model.NewSuccessResponse(
		"Brand created successfully",
		resp,
		http.StatusCreated,
	))
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
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"Invalid brand ID format",
			err.Error(),
			http.StatusBadRequest,
		))
	}

	ctx := c.Request().Context()
	resp, err := h.service.Brand().GetBrand(ctx, brandID)
	if err != nil {
		return c.JSON(http.StatusNotFound, model.NewErrorResponse(
			"Brand not found",
			err.Error(),
			http.StatusNotFound,
		))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse(
		"Brand retrieved successfully",
		resp,
		http.StatusOK,
	))
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
			return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
				"Invalid limit parameter",
				"limit must be a positive integer",
				http.StatusBadRequest,
			))
		}
		if l > 100 {
			l = 100
		}
		limit = int32(l)
	}

	if offsetStr != "" {
		o, err := strconv.Atoi(offsetStr)
		if err != nil || o < 0 {
			return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
				"Invalid offset parameter",
				"offset must be a non-negative integer",
				http.StatusBadRequest,
			))
		}
		offset = int32(o)
	}

	ctx := c.Request().Context()
	brands, err := h.service.Brand().ListBrands(ctx, limit, offset)
	if err != nil {
		log.Printf("Failed to list brands: %v", err)
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse(
			"Failed to list brands",
			err.Error(),
			http.StatusInternalServerError,
		))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse("Data retrieved successfully", brands, http.StatusOK))
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
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"Invalid brand ID format",
			"missing or malformed path parameter: id",
			http.StatusBadRequest,
		))
	}

	req := &model.UpdateBrandRequest{}
	if err := c.Bind(req); err != nil {
		log.Printf("Failed to bind brand update request: %v", err)
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"Invalid request body",
			err.Error(),
			http.StatusBadRequest,
		))
	}

	if req.Name == nil || *req.Name == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"Brand name is required",
			"name field cannot be empty",
			http.StatusBadRequest,
		))
	}

	ctx := c.Request().Context()
	resp, err := h.service.Brand().UpdateBrand(ctx, brandID, req.Name)
	if err != nil {
		log.Printf("Failed to update brand: %v", err)
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse(
			"Failed to update brand",
			err.Error(),
			http.StatusInternalServerError,
		))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse(
		"Brand updated successfully",
		resp,
		http.StatusOK,
	))
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
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"Invalid brand ID format",
			"missing or malformed path parameter: id",
			http.StatusBadRequest,
		))
	}

	ctx := c.Request().Context()
	if err := h.service.Brand().DeleteBrand(ctx, brandID); err != nil {
		log.Printf("Failed to delete brand: %v", err)
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse(
			"Failed to delete brand",
			err.Error(),
			http.StatusInternalServerError,
		))
	}

	return c.JSON(http.StatusNoContent, model.NewSuccessResponse(
		"Brand deleted successfully",
		map[string]interface{}{},
		http.StatusNoContent,
	))
}

// CreateBrandSuperadmin creates a superadmin user for a brand
// @Summary Create brand superadmin
// @Tags brands
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param id path string true "Brand UUID"
// @Param request body model.CreateBrandSuperadminRequest true "Superadmin creation request"
// @Success 201 {object} model.BrandSuperadminResponse
// @Failure 400 {object} model.ErrorResponse
// @Failure 500 {object} model.ErrorResponse
// @Router /api/v1/admin/brands/{id}/superadmins [post]
func (h *Handler) CreateBrandSuperadmin(c echo.Context) error {
	brandID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("Invalid brand ID", err.Error(), http.StatusBadRequest))
	}

	req := &model.CreateBrandSuperadminRequest{}
	if err := c.Bind(req); err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("Invalid request body", err.Error(), http.StatusBadRequest))
	}
	if req.Username == "" || req.Password == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("username and password are required", "", http.StatusBadRequest))
	}

	resp, err := h.service.Brand().CreateBrandSuperadmin(c.Request().Context(), brandID, *req)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("Failed to create superadmin", err.Error(), http.StatusInternalServerError))
	}
	return c.JSON(http.StatusCreated, model.NewSuccessResponse("Superadmin created successfully", resp, http.StatusCreated))
}

// ListBrandSuperadmins lists all superadmins of a brand
// @Summary List brand superadmins
// @Tags brands
// @Security BearerAuth
// @Produce json
// @Param id path string true "Brand UUID"
// @Success 200 {array} model.BrandSuperadminResponse
// @Router /api/v1/admin/brands/{id}/superadmins [get]
func (h *Handler) ListBrandSuperadmins(c echo.Context) error {
	brandID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("Invalid brand ID", err.Error(), http.StatusBadRequest))
	}

	resp, err := h.service.Brand().ListBrandSuperadmins(c.Request().Context(), brandID)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("Failed to list superadmins", err.Error(), http.StatusInternalServerError))
	}
	return c.JSON(http.StatusOK, model.NewSuccessResponse("Data retrieved successfully", resp, http.StatusOK))
}

// GetBrandSuperadmin gets a single superadmin of a brand
// @Summary Get brand superadmin
// @Tags brands
// @Security BearerAuth
// @Produce json
// @Param id path string true "Brand UUID"
// @Param user_id path string true "User UUID"
// @Success 200 {object} model.BrandSuperadminResponse
// @Router /api/v1/admin/brands/{id}/superadmins/{user_id} [get]
func (h *Handler) GetBrandSuperadmin(c echo.Context) error {
	brandID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("Invalid brand ID", err.Error(), http.StatusBadRequest))
	}
	userID, err := uuid.Parse(c.Param("user_id"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("Invalid user ID", err.Error(), http.StatusBadRequest))
	}

	resp, err := h.service.Brand().GetBrandSuperadmin(c.Request().Context(), brandID, userID)
	if err != nil {
		return c.JSON(http.StatusNotFound, model.NewErrorResponse("Superadmin not found", err.Error(), http.StatusNotFound))
	}
	return c.JSON(http.StatusOK, model.NewSuccessResponse("Data retrieved successfully", resp, http.StatusOK))
}

// UpdateBrandSuperadmin updates a superadmin of a brand
// @Summary Update brand superadmin
// @Tags brands
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param id path string true "Brand UUID"
// @Param user_id path string true "User UUID"
// @Param request body model.UpdateBrandSuperadminRequest true "Update request"
// @Success 200 {object} model.BrandSuperadminResponse
// @Router /api/v1/admin/brands/{id}/superadmins/{user_id} [put]
func (h *Handler) UpdateBrandSuperadmin(c echo.Context) error {
	brandID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("Invalid brand ID", err.Error(), http.StatusBadRequest))
	}
	userID, err := uuid.Parse(c.Param("user_id"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("Invalid user ID", err.Error(), http.StatusBadRequest))
	}

	req := &model.UpdateBrandSuperadminRequest{}
	if err := c.Bind(req); err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("Invalid request body", err.Error(), http.StatusBadRequest))
	}

	resp, err := h.service.Brand().UpdateBrandSuperadmin(c.Request().Context(), brandID, userID, *req)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("Failed to update superadmin", err.Error(), http.StatusInternalServerError))
	}
	return c.JSON(http.StatusOK, model.NewSuccessResponse("Superadmin updated successfully", resp, http.StatusOK))
}

// DeleteBrandSuperadmin soft-deletes a superadmin of a brand
// @Summary Delete brand superadmin
// @Tags brands
// @Security BearerAuth
// @Produce json
// @Param id path string true "Brand UUID"
// @Param user_id path string true "User UUID"
// @Success 200
// @Router /api/v1/admin/brands/{id}/superadmins/{user_id} [delete]
func (h *Handler) DeleteBrandSuperadmin(c echo.Context) error {
	brandID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("Invalid brand ID", err.Error(), http.StatusBadRequest))
	}
	userID, err := uuid.Parse(c.Param("user_id"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("Invalid user ID", err.Error(), http.StatusBadRequest))
	}

	if err := h.service.Brand().DeleteBrandSuperadmin(c.Request().Context(), brandID, userID); err != nil {
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("Failed to delete superadmin", err.Error(), http.StatusInternalServerError))
	}
	return c.JSON(http.StatusOK, model.NewSuccessResponse("Superadmin deleted successfully", map[string]any{}, http.StatusOK))
}

// // InitializeTenantSchema initializes a tenant schema for a brand
// // @Summary Initialize tenant schema
// // @Description Create a schema for the brand and run tenant migrations
// // @Tags brands
// // @Accept json
// // @Produce json
// // @Security BearerAuth
// // @Param id path string true "Brand ID"
// // @Success 200 {object} map[string]string "Schema initialized successfully"
// // @Failure 400 {object} model.ErrorResponse
// // @Failure 404 {object} model.ErrorResponse
// // @Failure 500 {object} model.ErrorResponse
// // @Router /api/v1/admin/brands/{id}/init-schema [post]
// func (h *Handler) InitializeTenantSchema(c echo.Context) error {
// 	brandIDStr := c.Param("id")
// 	brandID, err := uuid.Parse(brandIDStr)
// 	if err != nil {
// 		return c.JSON(http.StatusBadRequest, model.ErrorResponse{
// 			Message: "Invalid brand ID format",
// 		})
// 	}

// 	ctx := c.Request().Context()
// 	if err := h.service.Brand().InitializeTenantSchema(ctx, brandID); err != nil {
// 		log.Printf("Failed to initialize tenant schema: %v", err)
// 		return c.JSON(http.StatusInternalServerError, model.ErrorResponse{
// 			Message: "Failed to initialize tenant schema: " + err.Error(),
// 		})
// 	}

// 	return c.JSON(http.StatusOK, map[string]string{
// 		"message": "Tenant schema initialized successfully",
// 		"brandId": brandID.String(),
// 	})
// }
