package handler

import (
	"log"
	"net/http"
	"strconv"

	"github.com/labstack/echo/v4"
	"gitlab.yurtal.tech/company/maryai/back/internal/model"
)

// CreateCompound creates a new compound
// @Summary Create a new compound
// @Description Create a new compound with ingredients and pricing
// @Tags compounds
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param input body model.CreateCompoundRequest true "Compound creation data"
// @Success 201 {object} model.CompoundResponse "Compound created successfully"
// @Failure 400 {object} model.ErrorResponse "Invalid request data"
// @Failure 401 {object} model.ErrorResponse "Unauthorized"
// @Failure 500 {object} model.ErrorResponse "Internal server error"
// @Router /api/v1/compounds [post]
func (h *Handler) CreateCompound(c echo.Context) error {
	var req model.CreateCompoundRequest
	if err := c.Bind(&req); err != nil {
		log.Printf("Failed to bind create compound request: %v", err)
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"Invalid request format",
			err.Error(),
			http.StatusBadRequest,
		))
	}

	if req.Name == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"Name is required",
			"missing required field: name",
			http.StatusBadRequest,
		))
	}

	quantity := int32(req.Quantity)
	compound, err := h.service.Compound().CreateCompound(c.Request().Context(), req.Name, req.NameI18n, req.Description, req.DescriptionI18n, req.Measurement, req.DepartmentID, quantity, req.Price, req.PictureUrl, req.ColorCode)
	if err != nil {
		log.Printf("CreateCompound failed: %v", err)
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse(
			"Failed to create compound",
			err.Error(),
			http.StatusInternalServerError,
		))
	}

	return c.JSON(http.StatusCreated, model.NewSuccessResponse(
		"Compound created successfully",
		compound,
		http.StatusCreated,
	))
}

// GetCompoundByID retrieves a compound by ID
// @Summary Get a compound by ID
// @Description Retrieve a specific compound by its ID
// @Tags compounds
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "Compound ID"
// @Success 200 {object} model.CompoundResponse "Compound found"
// @Failure 400 {object} model.ErrorResponse "Invalid ID format"
// @Failure 401 {object} model.ErrorResponse "Unauthorized"
// @Failure 404 {object} model.ErrorResponse "Compound not found"
// @Failure 500 {object} model.ErrorResponse "Internal server error"
// @Router /api/v1/compounds/{id} [get]
func (h *Handler) GetCompoundByID(c echo.Context) error {
	compoundID := c.Param("id")
	if compoundID == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"Compound ID is required",
			"missing path parameter: id",
			http.StatusBadRequest,
		))
	}

	compound, err := h.service.Compound().GetCompoundByID(c.Request().Context(), compoundID)
	if err != nil {
		log.Printf("GetCompoundByID failed for ID %s: %v", compoundID, err)
		return c.JSON(http.StatusNotFound, model.NewErrorResponse(
			"Compound not found",
			err.Error(),
			http.StatusNotFound,
		))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse(
		"Compound retrieved successfully",
		compound,
		http.StatusOK,
	))
}

// GetAllCompounds retrieves all compounds
// @Summary Get all compounds
// @Description Retrieve all compounds with pagination
// @Tags compounds
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param limit query int false "Limit (default: 20)"
// @Param offset query int false "Offset (default: 0)"
// @Success 200 {array} model.CompoundResponse "Compounds found"
// @Failure 401 {object} model.ErrorResponse "Unauthorized"
// @Failure 500 {object} model.ErrorResponse "Internal server error"
// @Router /api/v1/compounds [get]
func (h *Handler) GetAllCompounds(c echo.Context) error {
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

	compounds, err := h.service.Compound().GetAllCompounds(c.Request().Context(), limit, offset)
	if err != nil {
		log.Printf("GetAllCompounds failed: %v", err)
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("failed to retrieve compounds", err.Error(), http.StatusInternalServerError))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse("Data retrieved successfully", compounds, http.StatusOK))
}

// GetCompoundsByDepartmentID retrieves compounds by department ID
// @Summary Get compounds by department
// @Description Retrieve all compounds for a specific department
// @Tags compounds
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param departmentId path string true "Department ID"
// @Param limit query int false "Limit (default: 20)"
// @Param offset query int false "Offset (default: 0)"
// @Success 200 {array} model.CompoundResponse "Compounds found"
// @Failure 400 {object} model.ErrorResponse "Invalid ID format"
// @Failure 401 {object} model.ErrorResponse "Unauthorized"
// @Failure 500 {object} model.ErrorResponse "Internal server error"
// @Router /api/v1/compounds/department/{departmentId} [get]
func (h *Handler) GetCompoundsByDepartmentID(c echo.Context) error {
	departmentID := c.Param("departmentId")
	if departmentID == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("department id is required", "missing path parameter: departmentId", http.StatusBadRequest))
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

	compounds, err := h.service.Compound().GetCompoundsByDepartmentID(c.Request().Context(), departmentID, limit, offset)
	if err != nil {
		log.Printf("GetCompoundsByDepartmentID failed: %v", err)
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("failed to retrieve compounds", err.Error(), http.StatusInternalServerError))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse("Data retrieved successfully", compounds, http.StatusOK))
}

// UpdateCompound updates a compound
// @Summary Update a compound
// @Description Update an existing compound
// @Tags compounds
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "Compound ID"
// @Param input body model.UpdateCompoundRequest true "Compound update data"
// @Success 200 {object} model.CompoundResponse "Compound updated successfully"
// @Failure 400 {object} model.ErrorResponse "Invalid request data"
// @Failure 401 {object} model.ErrorResponse "Unauthorized"
// @Failure 404 {object} model.ErrorResponse "Compound not found"
// @Failure 500 {object} model.ErrorResponse "Internal server error"
// @Router /api/v1/compounds/{id} [put]
func (h *Handler) UpdateCompound(c echo.Context) error {
	compoundID := c.Param("id")
	if compoundID == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("compound id is required", "missing path parameter: id", http.StatusBadRequest))
	}

	var req model.UpdateCompoundRequest
	if err := c.Bind(&req); err != nil {
		log.Printf("Failed to bind update compound request: %v", err)
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("invalid request format", err.Error(), http.StatusBadRequest))
	}

	var quantity *int32
	if req.Quantity != nil {
		q := int32(*req.Quantity)
		quantity = &q
	}

	compound, err := h.service.Compound().UpdateCompound(c.Request().Context(), compoundID, req.Name, req.NameI18n, req.Description, req.DescriptionI18n, req.Measurement, req.DepartmentID, quantity, req.Price, req.PictureUrl, req.ColorCode)
	if err != nil {
		log.Printf("UpdateCompound failed for ID %s: %v", compoundID, err)
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("failed to update compound", err.Error(), http.StatusInternalServerError))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse("Compound updated successfully", compound, http.StatusOK))
}

// DeleteCompound soft deletes a compound
// @Summary Delete a compound
// @Description Soft delete a compound by ID
// @Tags compounds
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "Compound ID"
// @Success 204 "Compound deleted successfully"
// @Failure 400 {object} model.ErrorResponse "Invalid ID format"
// @Failure 401 {object} model.ErrorResponse "Unauthorized"
// @Failure 404 {object} model.ErrorResponse "Compound not found"
// @Failure 500 {object} model.ErrorResponse "Internal server error"
// @Router /api/v1/compounds/{id} [delete]
func (h *Handler) DeleteCompound(c echo.Context) error {
	compoundID := c.Param("id")
	if compoundID == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("compound id is required", "missing path parameter: id", http.StatusBadRequest))
	}

	if err := h.service.Compound().DeleteCompound(c.Request().Context(), compoundID); err != nil {
		log.Printf("DeleteCompound failed for ID %s: %v", compoundID, err)
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("failed to delete compound", err.Error(), http.StatusInternalServerError))
	}

	return c.NoContent(http.StatusNoContent)
}

// RestoreCompound restores a soft-deleted compound
// @Summary Restore a compound
// @Description Restore a soft-deleted compound by ID
// @Tags compounds
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "Compound ID"
// @Success 200 {object} model.CompoundResponse "Compound restored successfully"
// @Failure 400 {object} model.ErrorResponse "Invalid ID format"
// @Failure 401 {object} model.ErrorResponse "Unauthorized"
// @Failure 404 {object} model.ErrorResponse "Compound not found"
// @Failure 500 {object} model.ErrorResponse "Internal server error"
// @Router /api/v1/compounds/{id}/restore [post]
func (h *Handler) RestoreCompound(c echo.Context) error {
	compoundID := c.Param("id")
	if compoundID == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("compound id is required", "missing path parameter: id", http.StatusBadRequest))
	}

	compound, err := h.service.Compound().RestoreCompound(c.Request().Context(), compoundID)
	if err != nil {
		log.Printf("RestoreCompound failed for ID %s: %v", compoundID, err)
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("failed to restore compound", err.Error(), http.StatusInternalServerError))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse("Compound restored successfully", compound, http.StatusOK))
}

// SearchCompounds searches for compounds by name or description
// @Summary Search compounds
// @Description Search for compounds by name or description with pagination
// @Tags compounds
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param q query string true "Search query"
// @Param limit query int false "Limit (default: 20)"
// @Param offset query int false "Offset (default: 0)"
// @Success 200 {array} model.CompoundResponse "Compounds found"
// @Failure 400 {object} model.ErrorResponse "Invalid request data"
// @Failure 401 {object} model.ErrorResponse "Unauthorized"
// @Failure 500 {object} model.ErrorResponse "Internal server error"
// @Router /api/v1/compounds/search [get]
func (h *Handler) SearchCompounds(c echo.Context) error {
	query := c.QueryParam("q")
	if query == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("search query is required", "missing query parameter: q", http.StatusBadRequest))
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

	compounds, err := h.service.Compound().SearchCompounds(c.Request().Context(), query, limit, offset)
	if err != nil {
		log.Printf("SearchCompounds failed for query %s: %v", query, err)
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("failed to search compounds", err.Error(), http.StatusInternalServerError))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse("Data retrieved successfully", compounds, http.StatusOK))
}
