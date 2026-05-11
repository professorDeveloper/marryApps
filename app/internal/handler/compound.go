package handler

import (
	"log"
	"net/http"
	"strconv"
	"strings"

	"github.com/google/uuid"
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

	compound, err := h.service.Compound().CreateCompound(c.Request().Context(), req.Name, req.NameI18n, req.Description, req.DescriptionI18n, req.Measurement, req.Quantity, nil, req.PictureUrl, req.ColorCode, req.IngredientGroupID)
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
// @Description Retrieve all compounds with pagination, optional search, department filter and sorting
// @Tags compounds
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param search query string false "Search by compound name or description"
// @Param department_id query string false "Filter by department ID"
// @Param sort_by query string false "Sort by field" Enums(name,created_at) default(created_at)
// @Param sort_order query string false "Sort order" Enums(asc,desc) default(desc)
// @Param limit query int false "Limit (default: 20)"
// @Param offset query int false "Offset (default: 0)"
// @Param expand query string false "Expand related fields"
// @Success 200 {object} model.PaginatedCompoundsResponse
// @Failure 400 {object} model.ErrorResponse
// @Failure 401 {object} model.ErrorResponse
// @Failure 500 {object} model.ErrorResponse
// @Router /api/v1/compounds [get]
func (h *Handler) GetAllCompounds(c echo.Context) error {
	var limit int32 = 20
	var offset int32 = 0

	if limitStr := c.QueryParam("limit"); limitStr != "" {
		l, err := strconv.ParseInt(limitStr, 10, 32)
		if err != nil || l <= 0 {
			return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
				"Invalid limit",
				"limit must be a positive integer",
				http.StatusBadRequest,
			))
		}
		limit = int32(l)
	}

	if offsetStr := c.QueryParam("offset"); offsetStr != "" {
		o, err := strconv.ParseInt(offsetStr, 10, 32)
		if err != nil || o < 0 {
			return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
				"Invalid offset",
				"offset must be a non-negative integer",
				http.StatusBadRequest,
			))
		}
		offset = int32(o)
	}

	filter := model.CompoundListFilter{
		Search:       strings.TrimSpace(c.QueryParam("search")),
		DepartmentID: strings.TrimSpace(c.QueryParam("department_id")),
		SortBy:       strings.TrimSpace(c.QueryParam("sort_by")),
		SortOrder:    strings.TrimSpace(c.QueryParam("sort_order")),
	}

	if filter.SortBy == "" {
		filter.SortBy = "created_at"
	}
	if filter.SortOrder == "" {
		filter.SortOrder = "desc"
	}

	allowedSortBy := map[string]bool{
		"name":       true,
		"created_at": true,
	}
	if !allowedSortBy[filter.SortBy] {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"Invalid sort_by",
			"allowed values: name, created_at",
			http.StatusBadRequest,
		))
	}

	allowedSortOrder := map[string]bool{
		"asc":  true,
		"desc": true,
	}
	if !allowedSortOrder[filter.SortOrder] {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"Invalid sort_order",
			"allowed values: asc, desc",
			http.StatusBadRequest,
		))
	}

	if filter.DepartmentID != "" {
		if _, err := uuid.Parse(filter.DepartmentID); err != nil {
			return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
				"Invalid department_id",
				"department_id must be a valid UUID",
				http.StatusBadRequest,
			))
		}
	}

	compounds, total, err := h.service.Compound().GetAllCompounds(c.Request().Context(), filter, limit, offset)
	if err != nil {
		log.Printf("GetAllCompounds failed: %v", err)
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse(
			"Failed to retrieve compounds",
			err.Error(),
			http.StatusInternalServerError,
		))
	}

	if maps, expanded, err := h.expandListResponse(c, compounds, "compounds"); expanded {
		if err != nil {
			return c.JSON(http.StatusInternalServerError, model.NewErrorResponse(
				"expand failed",
				err.Error(),
				http.StatusInternalServerError,
			))
		}
		return c.JSON(http.StatusOK, model.NewPaginatedResponse(
			"Compounds retrieved successfully",
			maps,
			int32(total),
			limit,
			offset,
			http.StatusOK,
		))
	}

	return c.JSON(http.StatusOK, model.NewPaginatedResponse(
		"Compounds retrieved successfully",
		compounds,
		int32(total),
		limit,
		offset,
		http.StatusOK,
	))
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
	return c.JSON(http.StatusGone, model.NewErrorResponse("Endpoint deprecated", "Use GET /api/v1/compounds with filters instead", http.StatusGone))
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

	compound, err := h.service.Compound().UpdateCompound(c.Request().Context(), compoundID, req.Name, req.NameI18n, req.Description, req.DescriptionI18n, req.Measurement, req.Quantity, nil, req.PictureUrl, req.ColorCode, req.IngredientGroupID)
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

// RecalculateCompoundPrice recalculates the price of a compound based on its ingredient calculations
// @Summary Recalculate compound price
// @Description Manually recalculate the price of a compound based on all ingredient calculations
// @Tags compounds
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "Compound ID"
// @Success 200 {object} model.CompoundResponse "Price recalculated successfully"
// @Failure 400 {object} model.ErrorResponse "Invalid ID format"
// @Failure 401 {object} model.ErrorResponse "Unauthorized"
// @Failure 404 {object} model.ErrorResponse "Compound not found"
// @Failure 500 {object} model.ErrorResponse "Internal server error"
// @Router /api/v1/compounds/{id}/recalculate-price [post]
func (h *Handler) RecalculateCompoundPrice(c echo.Context) error {
	compoundID := c.Param("id")
	if compoundID == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("compound id is required", "missing path parameter: id", http.StatusBadRequest))
	}

	compound, err := h.service.Compound().RecalculateCompoundPrice(c.Request().Context(), compoundID)
	if err != nil {
		log.Printf("RecalculateCompoundPrice failed for ID %s: %v", compoundID, err)
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("failed to recalculate compound price", err.Error(), http.StatusInternalServerError))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse("Compound price recalculated successfully", compound, http.StatusOK))
}

// CreateCompoundWithCalculations creates a new compound with calculations in one transaction
// @Summary Create compound with multiple ingredients and child compounds (One Save)
// @Description Create a new compound with its ingredient/child compound calculations in one atomic transaction.
// @Description The compound price is auto-calculated as sum of all calculation total_costs.
// @Tags compounds
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param lang query string false "Language (uz, ru, en)" default(uz)
// @Param request body model.CreateCompoundWithCalculationsRequest true "Compound + ingredients + child compounds"
// @Success 201 {object} model.CompoundWithCalculationsResponse "Compound and all calculations created successfully"
// @Failure 400 {object} model.ErrorResponse "Invalid request (missing fields, invalid UUIDs, etc.)"
// @Failure 401 {object} model.ErrorResponse "Unauthorized"
// @Failure 500 {object} model.ErrorResponse "Internal error (ingredient not found, no invoice, etc.)"
// @Router /api/v1/compounds/with-calculations [post]
func (h *Handler) CreateCompoundWithCalculations(c echo.Context) error {
	var req model.CreateCompoundWithCalculationsRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("Invalid request format", err.Error(), http.StatusBadRequest))
	}

	if req.Compound.Name == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("Compound name is required", "missing required field: compound.name", http.StatusBadRequest))
	}

	for i, calc := range req.IngredientCalculations {
		if calc.IngredientID == "" || calc.Quantity == "" {
			return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
				"Invalid ingredient calculation",
				"ingredient_calculations["+strconv.Itoa(i)+"]: ingredient_id and quantity are required",
				http.StatusBadRequest,
			))
		}
	}

	for i, calc := range req.CompoundCalculations {
		if calc.CompoundID == "" || calc.Quantity == "" {
			return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
				"Invalid compound calculation",
				"compound_calculations["+strconv.Itoa(i)+"]: compound_id and quantity are required",
				http.StatusBadRequest,
			))
		}
	}

	resp, err := h.service.Calculation().CreateCompoundWithCalculations(c.Request().Context(), &req)
	if err != nil {
		log.Printf("CreateCompoundWithCalculations failed: %v", err)
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("Failed to create compound with calculations", err.Error(), http.StatusInternalServerError))
	}

	return c.JSON(http.StatusCreated, model.NewSuccessResponse("Compound created successfully", resp, http.StatusCreated))
}

// UpdateCompoundWithCalculations updates a compound and replaces all calculations in one transaction
// @Summary Update compound with multiple ingredients and child compounds (One Save)
// @Description Update a compound and atomically replace all its calculations in one transaction.
// @Description Old calculations are deleted, new ones inserted, price recalculated once at the end.
// @Tags compounds
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param lang query string false "Language (uz, ru, en)" default(uz)
// @Param id path string true "Compound ID"
// @Param request body model.UpdateCompoundWithCalculationsRequest true "Compound update + ingredients + child compounds"
// @Success 200 {object} model.CompoundWithCalculationsResponse "Compound and all calculations updated successfully"
// @Failure 400 {object} model.ErrorResponse "Invalid request (missing fields, invalid UUIDs, etc.)"
// @Failure 401 {object} model.ErrorResponse "Unauthorized"
// @Failure 500 {object} model.ErrorResponse "Internal error (ingredient not found, no invoice, etc.)"
// @Router /api/v1/compounds/{id}/with-calculations [put]
func (h *Handler) UpdateCompoundWithCalculations(c echo.Context) error {
	compoundID := c.Param("id")
	if compoundID == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("compound id is required", "missing path parameter: id", http.StatusBadRequest))
	}

	var req model.UpdateCompoundWithCalculationsRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("Invalid request format", err.Error(), http.StatusBadRequest))
	}

	for i, calc := range req.IngredientCalculations {
		if calc.IngredientID == "" || calc.Quantity == "" {
			return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
				"Invalid ingredient calculation",
				"ingredient_calculations["+strconv.Itoa(i)+"]: ingredient_id and quantity are required",
				http.StatusBadRequest,
			))
		}
	}

	for i, calc := range req.CompoundCalculations {
		if calc.CompoundID == "" || calc.Quantity == "" {
			return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
				"Invalid compound calculation",
				"compound_calculations["+strconv.Itoa(i)+"]: compound_id and quantity are required",
				http.StatusBadRequest,
			))
		}
	}

	resp, err := h.service.Calculation().UpdateCompoundWithCalculations(c.Request().Context(), compoundID, &req)
	if err != nil {
		log.Printf("UpdateCompoundWithCalculations failed for compound %s: %v", compoundID, err)
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("Failed to update compound with calculations", err.Error(), http.StatusInternalServerError))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse("Compound updated successfully", resp, http.StatusOK))
}

// ==================== COMPOUNDS WITH LANGUAGE HANDLERS ====================

// GetCompoundByIDWithLang retrieves a compound by ID with language support
// @Summary Get compound by ID with language support
// @Description Retrieve a specific compound by its ID with names and descriptions translated to specified language
// @Tags compounds
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "Compound ID"
// @Param lang query string false "Language code (uz, ru, en - default: uz)"
// @Success 200 {object} model.CompoundResponse "Compound details"
// @Failure 400 {object} model.ErrorResponse "Invalid request parameters"
// @Failure 401 {object} model.ErrorResponse "Unauthorized"
// @Failure 404 {object} model.ErrorResponse "Compound not found"
// @Failure 500 {object} model.ErrorResponse "Internal server error"
// @Router /api/v1/compounds-lang/{id} [get]
func (h *Handler) GetCompoundByIDWithLang(c echo.Context) error {
	compoundID := c.Param("id")
	if compoundID == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("compound id is required", "see logs for details", http.StatusBadRequest))
	}

	lang := c.QueryParam("lang")
	if lang == "" {
		lang = "uz"
	}

	validLangs := map[string]bool{"uz": true, "ru": true, "en": true}
	if !validLangs[lang] {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("invalid language code", "valid values: uz, ru, en", http.StatusBadRequest))
	}

	compound, err := h.service.Compound().GetCompoundByIDWithLang(c.Request().Context(), compoundID, lang)
	if err != nil {
		log.Printf("GetCompoundByIDWithLang failed: %v", err)
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("failed to get compound", "see logs for details", http.StatusInternalServerError))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse("Compound retrieved successfully", compound, http.StatusOK))
}

// GetAllCompoundsWithLang retrieves all compounds with language support
// @Summary Get all compounds with language support
// @Description Retrieve all compounds with names and descriptions translated to specified language, with optional search and sorting
// @Tags compounds
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param lang query string false "Language code (uz, ru, en - default: uz)"
// @Param search query string false "Search by compound name or description"
// @Param sort_by query string false "Sort by field" Enums(name,created_at) default(created_at)
// @Param sort_order query string false "Sort order" Enums(asc,desc) default(desc)
// @Param limit query int false "Limit (default: 20)"
// @Param offset query int false "Offset (default: 0)"
// @Param expand query string false "Expand related fields"
// @Success 200 {object} model.PaginatedCompoundsResponse
// @Failure 400 {object} model.ErrorResponse
// @Failure 401 {object} model.ErrorResponse
// @Failure 500 {object} model.ErrorResponse
// @Router /api/v1/compounds-lang [get]
func (h *Handler) GetAllCompoundsWithLang(c echo.Context) error {
	var limit int32 = 20
	var offset int32 = 0

	if limitStr := c.QueryParam("limit"); limitStr != "" {
		l, err := strconv.ParseInt(limitStr, 10, 32)
		if err != nil || l <= 0 {
			return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
				"Invalid limit",
				"limit must be a positive integer",
				http.StatusBadRequest,
			))
		}
		limit = int32(l)
	}

	if offsetStr := c.QueryParam("offset"); offsetStr != "" {
		o, err := strconv.ParseInt(offsetStr, 10, 32)
		if err != nil || o < 0 {
			return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
				"Invalid offset",
				"offset must be a non-negative integer",
				http.StatusBadRequest,
			))
		}
		offset = int32(o)
	}

	lang := strings.TrimSpace(c.QueryParam("lang"))
	if lang == "" {
		lang = "uz"
	}

	validLangs := map[string]bool{
		"uz": true,
		"ru": true,
		"en": true,
	}
	if !validLangs[lang] {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"Invalid language code",
			"valid values: uz, ru, en",
			http.StatusBadRequest,
		))
	}

	filter := model.CompoundListFilter{
		Search:    strings.TrimSpace(c.QueryParam("search")),
		SortBy:    strings.TrimSpace(c.QueryParam("sort_by")),
		SortOrder: strings.TrimSpace(c.QueryParam("sort_order")),
	}

	if filter.SortBy == "" {
		filter.SortBy = "created_at"
	}
	if filter.SortOrder == "" {
		filter.SortOrder = "desc"
	}

	allowedSortBy := map[string]bool{
		"name":       true,
		"created_at": true,
	}
	if !allowedSortBy[filter.SortBy] {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"Invalid sort_by",
			"allowed values: name, created_at",
			http.StatusBadRequest,
		))
	}

	allowedSortOrder := map[string]bool{
		"asc":  true,
		"desc": true,
	}
	if !allowedSortOrder[filter.SortOrder] {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"Invalid sort_order",
			"allowed values: asc, desc",
			http.StatusBadRequest,
		))
	}

	compounds, total, err := h.service.Compound().GetAllCompoundsWithLang(
		c.Request().Context(),
		lang,
		filter,
		limit,
		offset,
	)
	if err != nil {
		log.Printf("GetAllCompoundsWithLang failed: %v", err)
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse(
			"Failed to get compounds",
			err.Error(),
			http.StatusInternalServerError,
		))
	}

	if maps, expanded, err := h.expandListResponse(c, compounds, "compounds"); expanded {
		if err != nil {
			return c.JSON(http.StatusInternalServerError, model.NewErrorResponse(
				"expand failed",
				err.Error(),
				http.StatusInternalServerError,
			))
		}
		return c.JSON(http.StatusOK, model.NewPaginatedResponse(
			"Compounds retrieved successfully",
			maps,
			int32(total),
			limit,
			offset,
			http.StatusOK,
		))
	}

	return c.JSON(http.StatusOK, model.NewPaginatedResponse(
		"Compounds retrieved successfully",
		compounds,
		int32(total),
		limit,
		offset,
		http.StatusOK,
	))
}
