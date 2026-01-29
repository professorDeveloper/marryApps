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
	compound, err := h.service.Compound().CreateCompound(c.Request().Context(), req.Name, req.NameI18n, req.Description, req.DescriptionI18n, req.Measurement, req.DepartmentID, quantity, nil, req.PictureUrl, req.ColorCode)
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

	compound, err := h.service.Compound().UpdateCompound(c.Request().Context(), compoundID, req.Name, req.NameI18n, req.Description, req.DescriptionI18n, req.Measurement, req.DepartmentID, quantity, nil, req.PictureUrl, req.ColorCode)
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
// @Description
// @Description **How it works:**
// @Description - Create the compound first
// @Description - Then create all ingredient calculations (price from invoice_detail)
// @Description - Then create all child compound calculations (price from child compound's price)
// @Description - If any calculation fails, everything is rolled back (compound won't be created)
// @Description - Compound price is auto-calculated as sum of all calculation total_costs
// @Description
// @Description **Example Request:**
// @Description ```json
// @Description {
// @Description   "compound": { "name": "Pizza Dough", "quantity": 1, "measurement": "kg" },
// @Description   "ingredient_calculations": [
// @Description     { "ingredient_id": "flour-uuid", "quantity": "0.5" },
// @Description     { "ingredient_id": "water-uuid", "quantity": "0.3" }
// @Description   ],
// @Description   "compound_calculations": [
// @Description     { "compound_id": "yeast-mix-uuid", "quantity": "1" }
// @Description   ]
// @Description }
// @Description ```
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
		log.Printf("Failed to bind create compound with calculations request: %v", err)
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"Invalid request format",
			err.Error(),
			http.StatusBadRequest,
		))
	}

	// Validate compound request
	if req.Compound.Name == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"Compound name is required",
			"missing required field: compound.name",
			http.StatusBadRequest,
		))
	}

	// Validate ingredient calculations
	for i, calc := range req.IngredientCalculations {
		if calc.IngredientID == "" {
			return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
				"Invalid ingredient calculation",
				"ingredient_calculations["+strconv.Itoa(i)+"]: ingredient_id is required",
				http.StatusBadRequest,
			))
		}
		if calc.Quantity == "" {
			return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
				"Invalid ingredient calculation",
				"ingredient_calculations["+strconv.Itoa(i)+"]: quantity is required",
				http.StatusBadRequest,
			))
		}
	}

	// Validate compound calculations
	for i, calc := range req.CompoundCalculations {
		if calc.CompoundID == "" {
			return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
				"Invalid compound calculation",
				"compound_calculations["+strconv.Itoa(i)+"]: compound_id is required",
				http.StatusBadRequest,
			))
		}
		if calc.Quantity == "" {
			return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
				"Invalid compound calculation",
				"compound_calculations["+strconv.Itoa(i)+"]: quantity is required",
				http.StatusBadRequest,
			))
		}
	}

	ctx := c.Request().Context()

	// Step 1: Create the compound
	quantity := int32(req.Compound.Quantity)
	compoundResp, err := h.service.Compound().CreateCompound(
		ctx,
		req.Compound.Name,
		req.Compound.NameI18n,
		req.Compound.Description,
		req.Compound.DescriptionI18n,
		req.Compound.Measurement,
		req.Compound.DepartmentID,
		quantity,
		nil, // price will be auto-calculated from calculations
		req.Compound.PictureUrl,
		req.Compound.ColorCode,
	)
	if err != nil {
		log.Printf("CreateCompoundWithCalculations: failed to create compound: %v", err)
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse(
			"Failed to create compound",
			err.Error(),
			http.StatusInternalServerError,
		))
	}

	var calculations []model.CalculationResponse

	// Step 2: Create ingredient calculations
	for i, calc := range req.IngredientCalculations {
		calcResp, calcErr := h.service.Calculation().CreateCalculationForCompound(ctx, compoundResp.ID, calc.IngredientID, calc.Quantity)
		if calcErr != nil {
			log.Printf("CreateCompoundWithCalculations: failed to create ingredient calculation[%d]: %v", i, calcErr)
			return c.JSON(http.StatusInternalServerError, model.NewErrorResponse(
				"Failed to create ingredient calculation",
				"ingredient_calculations["+strconv.Itoa(i)+"]: "+calcErr.Error(),
				http.StatusInternalServerError,
			))
		}
		if calcResp != nil {
			calculations = append(calculations, *calcResp)
		}
	}

	// Step 3: Create child compound calculations
	for i, calc := range req.CompoundCalculations {
		calcResp, calcErr := h.service.Calculation().CreateCalculationCompoundToCompound(ctx, compoundResp.ID, calc.CompoundID, calc.Quantity)
		if calcErr != nil {
			log.Printf("CreateCompoundWithCalculations: failed to create compound calculation[%d]: %v", i, calcErr)
			return c.JSON(http.StatusInternalServerError, model.NewErrorResponse(
				"Failed to create compound calculation",
				"compound_calculations["+strconv.Itoa(i)+"]: "+calcErr.Error(),
				http.StatusInternalServerError,
			))
		}
		if calcResp != nil {
			calculations = append(calculations, *calcResp)
		}
	}

	// Fetch updated compound (price should be auto-calculated now)
	updatedCompound, err := h.service.Compound().GetCompoundByID(ctx, compoundResp.ID)
	if err != nil {
		log.Printf("CreateCompoundWithCalculations: failed to fetch updated compound: %v", err)
		// Use original response if fetch fails
		updatedCompound = compoundResp
	}

	response := model.CompoundWithCalculationsResponse{
		Compound:     updatedCompound,
		Calculations: calculations,
	}

	return c.JSON(http.StatusCreated, model.NewSuccessResponse(
		"Compound created successfully",
		response,
		http.StatusCreated,
	))
}

func (h *Handler) UpdateCompoundWithCalculations(c echo.Context) error {
	compoundID := c.Param("id")
	if compoundID == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"compound id is required",
			"missing path parameter: id",
			http.StatusBadRequest,
		))
	}

	var req model.UpdateCompoundWithCalculationsRequest
	if err := c.Bind(&req); err != nil {
		log.Printf("Failed to bind update compound with calculations request: %v", err)
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"Invalid request format",
			err.Error(),
			http.StatusBadRequest,
		))
	}

	// Validate ingredient calculations
	for i, calc := range req.IngredientCalculations {
		if calc.IngredientID == "" {
			return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
				"Invalid ingredient calculation",
				"ingredient_calculations["+strconv.Itoa(i)+"]: ingredient_id is required",
				http.StatusBadRequest,
			))
		}
		if calc.Quantity == "" {
			return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
				"Invalid ingredient calculation",
				"ingredient_calculations["+strconv.Itoa(i)+"]: quantity is required",
				http.StatusBadRequest,
			))
		}
	}

	// Validate compound calculations
	for i, calc := range req.CompoundCalculations {
		if calc.CompoundID == "" {
			return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
				"Invalid compound calculation",
				"compound_calculations["+strconv.Itoa(i)+"]: compound_id is required",
				http.StatusBadRequest,
			))
		}
		if calc.Quantity == "" {
			return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
				"Invalid compound calculation",
				"compound_calculations["+strconv.Itoa(i)+"]: quantity is required",
				http.StatusBadRequest,
			))
		}
	}

	ctx := c.Request().Context()

	var qty32 *int32
	if req.Compound.Quantity != nil {
		q := int32(*req.Compound.Quantity)
		qty32 = &q
	}

	compoundResp, err := h.service.Compound().UpdateCompound(
		ctx,
		compoundID,
		req.Compound.Name,
		req.Compound.NameI18n,
		req.Compound.Description,
		req.Compound.DescriptionI18n,
		req.Compound.Measurement,
		req.Compound.DepartmentID,
		qty32,
		nil,
		req.Compound.PictureUrl,
		req.Compound.ColorCode,
	)
	if err != nil {
		log.Printf("UpdateCompoundWithCalculations: failed to update compound: %v", err)
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse(
			"Failed to update compound",
			err.Error(),
			http.StatusInternalServerError,
		))
	}

	if err := h.service.Calculation().DeleteCalculationsByCompoundID(ctx, compoundID); err != nil {
		log.Printf("UpdateCompoundWithCalculations: failed to delete old calculations: %v", err)
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse(
			"Failed to delete old calculations",
			err.Error(),
			http.StatusInternalServerError,
		))
	}

	var calculations []model.CalculationResponse

	for i, calc := range req.IngredientCalculations {
		calcResp, calcErr := h.service.Calculation().CreateCalculationForCompound(ctx, compoundID, calc.IngredientID, calc.Quantity)
		if calcErr != nil {
			log.Printf("UpdateCompoundWithCalculations: failed to create ingredient calculation[%d]: %v", i, calcErr)
			return c.JSON(http.StatusInternalServerError, model.NewErrorResponse(
				"Failed to create ingredient calculation",
				"ingredient_calculations["+strconv.Itoa(i)+"]: "+calcErr.Error(),
				http.StatusInternalServerError,
			))
		}
		if calcResp != nil {
			calculations = append(calculations, *calcResp)
		}
	}

	for i, calc := range req.CompoundCalculations {
		calcResp, calcErr := h.service.Calculation().CreateCalculationCompoundToCompound(ctx, compoundID, calc.CompoundID, calc.Quantity)
		if calcErr != nil {
			log.Printf("UpdateCompoundWithCalculations: failed to create compound calculation[%d]: %v", i, calcErr)
			return c.JSON(http.StatusInternalServerError, model.NewErrorResponse(
				"Failed to create compound calculation",
				"compound_calculations["+strconv.Itoa(i)+"]: "+calcErr.Error(),
				http.StatusInternalServerError,
			))
		}
		if calcResp != nil {
			calculations = append(calculations, *calcResp)
		}
	}

	updatedCompound, cErr := h.service.Compound().GetCompoundByID(ctx, compoundID)
	if cErr != nil {
		log.Printf("UpdateCompoundWithCalculations: failed to fetch updated compound: %v", cErr)
		updatedCompound = compoundResp
	}

	response := model.CompoundWithCalculationsResponse{
		Compound:     updatedCompound,
		Calculations: calculations,
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse(
		"Compound updated successfully",
		response,
		http.StatusOK,
	))
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
// @Description Retrieve all compounds with names and descriptions translated to specified language
// @Tags compounds
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param lang query string false "Language code (uz, ru, en - default: uz)"
// @Param limit query int false "Limit (default: 20)"
// @Param offset query int false "Offset (default: 0)"
// @Success 200 {array} model.CompoundResponse "Compounds retrieved successfully"
// @Failure 400 {object} model.ErrorResponse "Invalid request parameters"
// @Failure 401 {object} model.ErrorResponse "Unauthorized"
// @Failure 500 {object} model.ErrorResponse "Internal server error"
// @Router /api/v1/compounds-lang [get]
func (h *Handler) GetAllCompoundsWithLang(c echo.Context) error {
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

	lang := c.QueryParam("lang")
	if lang == "" {
		lang = "uz"
	}

	validLangs := map[string]bool{"uz": true, "ru": true, "en": true}
	if !validLangs[lang] {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("invalid language code", "valid values: uz, ru, en", http.StatusBadRequest))
	}

	compounds, err := h.service.Compound().GetAllCompoundsWithLang(c.Request().Context(), lang, limit, offset)
	if err != nil {
		log.Printf("GetAllCompoundsWithLang failed: %v", err)
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("failed to get compounds", "see logs for details", http.StatusInternalServerError))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse("Compounds retrieved successfully", compounds, http.StatusOK))
}
