package handler

import (
	"log"
	"net/http"
	"strconv"
	"strings"

	"github.com/labstack/echo/v4"
	"gitlab.yurtal.tech/company/maryai/back/internal/model"
)

// CreateModifier creates a new modifier
// @Summary Create modifier
// @Description Create a new modifier
// @Tags modifiers
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param request body model.CreateModifierRequest true "Modifier creation request"
// @Success 201 {object} model.ModifierResponse
// @Failure 400 {object} model.ErrorResponse
// @Failure 500 {object} model.ErrorResponse
// @Router /api/v1/modifiers [post]
func (h *Handler) CreateModifier(c echo.Context) error {
	var req model.CreateModifierRequest
	if err := c.Bind(&req); err != nil {
		log.Printf("Failed to bind create modifier request: %v", err)
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"Invalid request format",
			err.Error(),
			http.StatusBadRequest,
		))
	}

	if strings.TrimSpace(req.Name) == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"Modifier name is required",
			"missing required field: name",
			http.StatusBadRequest,
		))
	}

	resp, err := h.service.Modifier().CreateModifier(c.Request().Context(), req)
	if err != nil {
		log.Printf("CreateModifier failed: %v", err)
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse(
			"Failed to create modifier",
			err.Error(),
			http.StatusInternalServerError,
		))
	}

	return c.JSON(http.StatusCreated, model.NewSuccessResponse(
		"Modifier created successfully",
		resp,
		http.StatusCreated,
	))
}

// GetModifierByID retrieves a modifier by ID
// @Summary Get modifier by ID
// @Description Retrieve a modifier by ID
// @Tags modifiers
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "Modifier ID"
// @Success 200 {object} model.ModifierResponse
// @Failure 400 {object} model.ErrorResponse
// @Failure 404 {object} model.ErrorResponse
// @Failure 500 {object} model.ErrorResponse
// @Router /api/v1/modifiers/{id} [get]
func (h *Handler) GetModifierByID(c echo.Context) error {
	modifierID := c.Param("id")
	if strings.TrimSpace(modifierID) == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"Modifier ID is required",
			"missing path parameter: id",
			http.StatusBadRequest,
		))
	}

	resp, err := h.service.Modifier().GetModifierByID(c.Request().Context(), modifierID)
	if err != nil {
		log.Printf("GetModifierByID failed for ID %s: %v", modifierID, err)
		return c.JSON(http.StatusNotFound, model.NewErrorResponse(
			"Modifier not found",
			err.Error(),
			http.StatusNotFound,
		))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse(
		"Modifier retrieved successfully",
		resp,
		http.StatusOK,
	))
}

// GetAllModifiers retrieves all modifiers with pagination
// @Summary Get all modifiers
// @Description Retrieve all modifiers with pagination
// @Tags modifiers
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param limit query int false "Limit (default: 20)"
// @Param offset query int false "Offset (default: 0)"
// @Param expand query string false "Expand related fields"
// @Success 200 {array} model.ModifierResponse
// @Failure 500 {object} model.ErrorResponse
// @Router /api/v1/modifiers [get]
func (h *Handler) GetAllModifiers(c echo.Context) error {
	var limit int32 = 20
	var offset int32 = 0

	if limitStr := c.QueryParam("limit"); limitStr != "" {
		if l, err := strconv.ParseInt(limitStr, 10, 32); err == nil && l > 0 {
			limit = int32(l)
		}
	}

	if offsetStr := c.QueryParam("offset"); offsetStr != "" {
		if o, err := strconv.ParseInt(offsetStr, 10, 32); err == nil && o >= 0 {
			offset = int32(o)
		}
	}

	resp, err := h.service.Modifier().GetAllModifiers(c.Request().Context(), limit, offset)
	if err != nil {
		log.Printf("GetAllModifiers failed: %v", err)
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse(
			"Failed to retrieve modifiers",
			err.Error(),
			http.StatusInternalServerError,
		))
	}

	total := int32(len(resp))

	if maps, expanded, err := h.expandListResponse(c, resp, "modifiers"); expanded {
		if err != nil {
			return c.JSON(http.StatusInternalServerError, model.NewErrorResponse(
				"expand failed",
				err.Error(),
				http.StatusInternalServerError,
			))
		}
		return c.JSON(http.StatusOK, model.NewPaginatedResponse(
			"Modifiers retrieved successfully",
			maps,
			total,
			limit,
			offset,
			http.StatusOK,
		))
	}

	return c.JSON(http.StatusOK, model.NewPaginatedResponse(
		"Modifiers retrieved successfully",
		resp,
		total,
		limit,
		offset,
		http.StatusOK,
	))
}

// UpdateModifier updates a modifier by ID
// @Summary Update modifier
// @Description Update a modifier by ID
// @Tags modifiers
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "Modifier ID"
// @Param request body model.UpdateModifierRequest true "Modifier update request"
// @Success 200 {object} model.ModifierResponse
// @Failure 400 {object} model.ErrorResponse
// @Failure 404 {object} model.ErrorResponse
// @Failure 500 {object} model.ErrorResponse
// @Router /api/v1/modifiers/{id} [put]
func (h *Handler) UpdateModifier(c echo.Context) error {
	modifierID := c.Param("id")
	if strings.TrimSpace(modifierID) == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"Modifier ID is required",
			"missing path parameter: id",
			http.StatusBadRequest,
		))
	}

	var req model.UpdateModifierRequest
	if err := c.Bind(&req); err != nil {
		log.Printf("Failed to bind update modifier request: %v", err)
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"Invalid request format",
			err.Error(),
			http.StatusBadRequest,
		))
	}

	if req.Name != nil && strings.TrimSpace(*req.Name) == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"Modifier name cannot be empty",
			"name field cannot be empty",
			http.StatusBadRequest,
		))
	}

	resp, err := h.service.Modifier().UpdateModifier(c.Request().Context(), modifierID, req)
	if err != nil {
		log.Printf("UpdateModifier failed for ID %s: %v", modifierID, err)
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse(
			"Failed to update modifier",
			err.Error(),
			http.StatusInternalServerError,
		))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse(
		"Modifier updated successfully",
		resp,
		http.StatusOK,
	))
}

// DeleteModifier soft deletes a modifier by ID
// @Summary Delete modifier
// @Description Soft delete a modifier by ID
// @Tags modifiers
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "Modifier ID"
// @Success 200 {object} model.SuccessResponse
// @Failure 400 {object} model.ErrorResponse
// @Failure 500 {object} model.ErrorResponse
// @Router /api/v1/modifiers/{id} [delete]
func (h *Handler) DeleteModifier(c echo.Context) error {
	modifierID := c.Param("id")
	if strings.TrimSpace(modifierID) == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"Modifier ID is required",
			"missing path parameter: id",
			http.StatusBadRequest,
		))
	}

	if err := h.service.Modifier().DeleteModifier(c.Request().Context(), modifierID); err != nil {
		log.Printf("DeleteModifier failed for ID %s: %v", modifierID, err)
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse(
			"Failed to delete modifier",
			err.Error(),
			http.StatusInternalServerError,
		))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse(
		"Modifier deleted successfully",
		map[string]interface{}{},
		http.StatusOK,
	))
}

// RestoreModifier restores a soft deleted modifier by ID
// @Summary Restore modifier
// @Description Restore a soft deleted modifier by ID
// @Tags modifiers
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "Modifier ID"
// @Success 200 {object} model.SuccessResponse
// @Failure 400 {object} model.ErrorResponse
// @Failure 500 {object} model.ErrorResponse
// @Router /api/v1/modifiers/{id}/restore [post]
func (h *Handler) RestoreModifier(c echo.Context) error {
	modifierID := c.Param("id")
	if strings.TrimSpace(modifierID) == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"Modifier ID is required",
			"missing path parameter: id",
			http.StatusBadRequest,
		))
	}

	if err := h.service.Modifier().RestoreModifier(c.Request().Context(), modifierID); err != nil {
		log.Printf("RestoreModifier failed for ID %s: %v", modifierID, err)
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse(
			"Failed to restore modifier",
			err.Error(),
			http.StatusInternalServerError,
		))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse(
		"Modifier restored successfully",
		map[string]interface{}{},
		http.StatusOK,
	))
}

// SearchModifiers searches modifiers by query
// @Summary Search modifiers
// @Description Search modifiers by name, description, or code
// @Tags modifiers
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param q query string true "Search query"
// @Param limit query int false "Limit (default: 20)"
// @Param offset query int false "Offset (default: 0)"
// @Success 200 {array} model.ModifierResponse
// @Failure 400 {object} model.ErrorResponse
// @Failure 500 {object} model.ErrorResponse
// @Router /api/v1/modifiers/search [get]
func (h *Handler) SearchModifiers(c echo.Context) error {
	query := strings.TrimSpace(c.QueryParam("q"))
	if query == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"Search query is required",
			"missing required query parameter: q",
			http.StatusBadRequest,
		))
	}

	var limit int32 = 20
	var offset int32 = 0

	if limitStr := c.QueryParam("limit"); limitStr != "" {
		if l, err := strconv.ParseInt(limitStr, 10, 32); err == nil && l > 0 {
			limit = int32(l)
		}
	}

	if offsetStr := c.QueryParam("offset"); offsetStr != "" {
		if o, err := strconv.ParseInt(offsetStr, 10, 32); err == nil && o >= 0 {
			offset = int32(o)
		}
	}

	resp, err := h.service.Modifier().SearchModifiers(c.Request().Context(), query, limit, offset)
	if err != nil {
		log.Printf("SearchModifiers failed for query %q: %v", query, err)
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse(
			"Failed to search modifiers",
			err.Error(),
			http.StatusInternalServerError,
		))
	}

	total := int32(len(resp))

	if maps, expanded, err := h.expandListResponse(c, resp, "modifiers"); expanded {
		if err != nil {
			return c.JSON(http.StatusInternalServerError, model.NewErrorResponse(
				"expand failed",
				err.Error(),
				http.StatusInternalServerError,
			))
		}
		return c.JSON(http.StatusOK, model.NewPaginatedResponse(
			"Modifiers retrieved successfully",
			maps,
			total,
			limit,
			offset,
			http.StatusOK,
		))
	}

	return c.JSON(http.StatusOK, model.NewPaginatedResponse(
		"Modifiers retrieved successfully",
		resp,
		total,
		limit,
		offset,
		http.StatusOK,
	))
}
