package handler

import (
	"fmt"
	"log"
	"net/http"
	"strings"

	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
	"gitlab.yurtal.tech/company/maryai/back/internal/model"
)

// CreateCalculation creates a new calculation record for a good
// DEPRECATED: Use POST /api/v1/goods/calculations or POST /api/v1/compounds/calculations instead
// This handler is kept for internal use but is NOT exposed via the API
func (h *Handler) CreateCalculation(c echo.Context) error {
	req := model.CreateCalculationRequest{}
	if err := c.Bind(&req); err != nil {
		log.Printf("CreateCalculation: invalid request: %v", err)
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"Invalid request",
			fmt.Sprintf("%v", err),
			http.StatusBadRequest,
		))
	}

	hasIngredient := req.IngredientID != nil && *req.IngredientID != ""
	hasCompoundToAdd := req.CompoundToAddID != nil && *req.CompoundToAddID != ""
	if hasIngredient && hasCompoundToAdd {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"Invalid request",
			"provide only one: ingredient_id or compound_to_add_id",
			http.StatusBadRequest,
		))
	}

	// Validate that either good_id or compound_id is provided
	if (req.GoodID == nil || *req.GoodID == "") && (req.CompoundID == nil || *req.CompoundID == "") {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"Invalid request",
			"either good_id or compound_id must be provided",
			http.StatusBadRequest,
		))
	}

	// Validate that either ingredient_id or compound_to_add_id is provided
	if !hasIngredient && !hasCompoundToAdd {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"Invalid request",
			"either ingredient_id or compound_to_add_id must be provided",
			http.StatusBadRequest,
		))
	}

	ctx := c.Request().Context()

	var calculation *model.CalculationResponse
	var err error

	// Case 1: Adding ingredient to good
	if req.GoodID != nil && *req.GoodID != "" && req.IngredientID != nil && *req.IngredientID != "" {
		calculation, err = h.service.Calculation().CreateCalculation(ctx, *req.GoodID, *req.IngredientID, req.Quantity)
	} else if req.CompoundID != nil && *req.CompoundID != "" && req.IngredientID != nil && *req.IngredientID != "" {
		// Case 2: Adding ingredient to compound
		calculation, err = h.service.Calculation().CreateCalculationForCompound(ctx, *req.CompoundID, *req.IngredientID, req.Quantity)
	} else if req.GoodID != nil && *req.GoodID != "" && req.CompoundToAddID != nil && *req.CompoundToAddID != "" {
		// Case 3: Adding compound to good
		calculation, err = h.service.Calculation().CreateCalculationWithCompound(ctx, *req.GoodID, *req.CompoundToAddID, req.Quantity)
	} else if req.CompoundID != nil && *req.CompoundID != "" && req.CompoundToAddID != nil && *req.CompoundToAddID != "" {
		// Case 4: Adding compound to compound
		calculation, err = h.service.Calculation().CreateCalculationCompoundToCompound(ctx, *req.CompoundID, *req.CompoundToAddID, req.Quantity)
	} else {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"Invalid request",
			"invalid combination of parameters",
			http.StatusBadRequest,
		))
	}

	if err != nil {
		log.Printf("CreateCalculation: failed to create calculation: %v", err)
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse(
			"Failed to create calculation",
			fmt.Sprintf("%v", err),
			http.StatusInternalServerError,
		))
	}

	return c.JSON(http.StatusCreated, model.NewSuccessResponse(
		"Calculation created successfully",
		calculation,
		http.StatusCreated,
	))
}

// CreateGoodCalculation creates a new calculation record for a good
// @Summary Create good calculation
// @Description Add ingredient or compound to a good and create a calculation record
// @Tags Calculations
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param req body model.CreateGoodCalculationRequest true "Good ID, ingredient ID or compound ID to add, and quantity"
// @Success 201 {object} model.CalculationResponse
// @Failure 400 {object} model.ErrorData "Bad request"
// @Failure 401 {object} model.ErrorData "Unauthorized"
// @Failure 500 {object} model.ErrorData "Internal server error"
// @Router /api/v1/goods/calculations [post]
func (h *Handler) CreateGoodCalculation(c echo.Context) error {
	req := model.CreateGoodCalculationRequest{}
	if err := c.Bind(&req); err != nil {
		log.Printf("CreateGoodCalculation: invalid request: %v", err)
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"Invalid request",
			err.Error(),
			http.StatusBadRequest,
		))
	}

	hasIngredient := req.IngredientID != nil && *req.IngredientID != ""
	hasCompoundToAdd := req.CompoundToAddID != nil && *req.CompoundToAddID != ""
	if hasIngredient && hasCompoundToAdd {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"Invalid request",
			"provide only one: ingredient_id or compound_to_add_id",
			http.StatusBadRequest,
		))
	}

	if req.GoodID == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"Good ID is required",
			"good_id must be provided in request body",
			http.StatusBadRequest,
		))
	}

	if !hasIngredient && !hasCompoundToAdd {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"Invalid request",
			"either ingredient_id or compound_to_add_id must be provided",
			http.StatusBadRequest,
		))
	}

	ctx := c.Request().Context()

	var calculation *model.CalculationResponse
	var err error

	if hasIngredient {
		calculation, err = h.service.Calculation().CreateCalculation(ctx, req.GoodID, *req.IngredientID, req.Quantity)
	} else {
		calculation, err = h.service.Calculation().CreateCalculationWithCompound(ctx, req.GoodID, *req.CompoundToAddID, req.Quantity)
	}

	if err != nil {
		log.Printf("CreateGoodCalculation: failed to create calculation: %v", err)
		status := http.StatusInternalServerError
		errMsg := err.Error()
		if strings.Contains(errMsg, "not found") {
			status = http.StatusNotFound
		} else if strings.Contains(errMsg, "no invoice found") || strings.Contains(errMsg, "has no price") {
			status = http.StatusBadRequest
		}
		return c.JSON(status, model.NewErrorResponse(
			"Failed to create calculation",
			errMsg,
			status,
		))
	}

	return c.JSON(http.StatusCreated, model.NewSuccessResponse(
		"Calculation created successfully",
		calculation,
		http.StatusCreated,
	))
}

// CreateCompoundCalculation creates a new calculation record for a compound
// @Summary Create compound calculation
// @Description Add ingredient or child compound to a compound and create a calculation record
// @Tags Calculations
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param req body model.CreateCompoundCalculationRequest true "Compound ID, ingredient ID or compound ID to add, and quantity"
// @Success 201 {object} model.CalculationResponse
// @Failure 400 {object} model.ErrorData "Bad request"
// @Failure 401 {object} model.ErrorData "Unauthorized"
// @Failure 500 {object} model.ErrorData "Internal server error"
// @Router /api/v1/compounds/calculations [post]
func (h *Handler) CreateCompoundCalculation(c echo.Context) error {
	req := model.CreateCompoundCalculationRequest{}
	if err := c.Bind(&req); err != nil {
		log.Printf("CreateCompoundCalculation: invalid request: %v", err)
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"Invalid request",
			err.Error(),
			http.StatusBadRequest,
		))
	}

	hasIngredient := req.IngredientID != nil && *req.IngredientID != ""
	hasCompoundToAdd := req.CompoundToAddID != nil && *req.CompoundToAddID != ""
	if hasIngredient && hasCompoundToAdd {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"Invalid request",
			"provide only one: ingredient_id or compound_to_add_id",
			http.StatusBadRequest,
		))
	}

	if req.CompoundID == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"Compound ID is required",
			"compound_id must be provided in request body",
			http.StatusBadRequest,
		))
	}

	if !hasIngredient && !hasCompoundToAdd {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"Invalid request",
			"either ingredient_id or compound_to_add_id must be provided",
			http.StatusBadRequest,
		))
	}

	ctx := c.Request().Context()

	var calculation *model.CalculationResponse
	var err error

	if hasIngredient {
		calculation, err = h.service.Calculation().CreateCalculationForCompound(ctx, req.CompoundID, *req.IngredientID, req.Quantity)
	} else {
		calculation, err = h.service.Calculation().CreateCalculationCompoundToCompound(ctx, req.CompoundID, *req.CompoundToAddID, req.Quantity)
	}

	if err != nil {
		log.Printf("CreateCompoundCalculation: failed to create calculation: %v", err)
		status := http.StatusInternalServerError
		errMsg := err.Error()
		if strings.Contains(errMsg, "not found") {
			status = http.StatusNotFound
		} else if strings.Contains(errMsg, "no invoice found") || strings.Contains(errMsg, "has no price") {
			status = http.StatusBadRequest
		}
		return c.JSON(status, model.NewErrorResponse(
			"Failed to create calculation",
			errMsg,
			status,
		))
	}

	return c.JSON(http.StatusCreated, model.NewSuccessResponse(
		"Calculation created successfully",
		calculation,
		http.StatusCreated,
	))
}

// GetCalculation retrieves a calculation by ID
// @Summary Get calculation by ID
// @Description Retrieve a single calculation record by ID. Used by both /goods/calculations/{id} and /compounds/calculations/{id}
// @Tags Calculations
// @Produce json
// @Security BearerAuth
// @Param id path string true "Calculation ID"
// @Success 200 {object} model.CalculationResponse
// @Failure 400 {object} model.ErrorData "Bad request"
// @Failure 401 {object} model.ErrorData "Unauthorized"
// @Failure 404 {object} model.ErrorData "Not found"
// @Failure 500 {object} model.ErrorData "Internal server error"
// @Router /api/v1/goods/calculations/{id} [get]
func (h *Handler) GetCalculation(c echo.Context) error {
	calculationID := c.Param("id")
	if calculationID == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"Calculation ID is required",
			"",
			http.StatusBadRequest,
		))
	}

	ctx := c.Request().Context()

	calculation, err := h.service.Calculation().GetCalculationByID(ctx, calculationID)
	if err != nil {
		log.Printf("GetCalculation: failed to retrieve calculation: %v", err)
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse(
			"Failed to retrieve calculation",
			fmt.Sprintf("%v", err),
			http.StatusInternalServerError,
		))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse(
		"Calculation retrieved successfully",
		calculation,
		http.StatusOK,
	))
}

// GetGoodCalculations retrieves all calculations for a good
// @Summary Get calculations by good ID
// @Description Retrieve all calculations (ingredients and compounds) for a specific good
// @Tags Calculations
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param good_id query string true "Good ID"
// @Success 200 {array} model.CalculationResponse "List of calculations"
// @Failure 400 {object} model.ErrorData "Bad request"
// @Failure 401 {object} model.ErrorData "Unauthorized"
// @Failure 500 {object} model.ErrorData "Internal server error"
// @Router /api/v1/goods/calculations [get]
func (h *Handler) GetGoodCalculations(c echo.Context) error {
	goodID := c.QueryParam("good_id")
	if goodID == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"Good ID is required",
			"good_id must be provided as a query parameter",
			http.StatusBadRequest,
		))
	}

	ctx := c.Request().Context()

	calculations, err := h.service.Calculation().GetCalculationsByGoodID(ctx, goodID)
	if err != nil {
		log.Printf("GetGoodCalculations: failed to retrieve calculations: %v", err)
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse(
			"Failed to retrieve calculations",
			fmt.Sprintf("%v", err),
			http.StatusInternalServerError,
		))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse(
		"Calculations retrieved successfully",
		calculations,
		http.StatusOK,
	))
}

// GetCompoundCalculations retrieves all calculations for a compound
// @Summary Get calculations by compound ID
// @Description Retrieve all calculations (ingredients and child compounds) for a specific compound
// @Tags Calculations
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param compound_id query string true "Compound ID"
// @Success 200 {array} model.CalculationResponse "List of calculations"
// @Failure 400 {object} model.ErrorData "Bad request"
// @Failure 401 {object} model.ErrorData "Unauthorized"
// @Failure 500 {object} model.ErrorData "Internal server error"
// @Router /api/v1/compounds/calculations [get]
func (h *Handler) GetCompoundCalculations(c echo.Context) error {
	compoundID := c.QueryParam("compound_id")
	if compoundID == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"Compound ID is required",
			"compound_id must be provided as a query parameter",
			http.StatusBadRequest,
		))
	}

	ctx := c.Request().Context()

	calculations, err := h.service.Calculation().GetCalculationsByCompoundID(ctx, compoundID)
	if err != nil {
		log.Printf("GetCompoundCalculations: failed to retrieve calculations: %v", err)
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse(
			"Failed to retrieve calculations",
			err.Error(),
			http.StatusInternalServerError,
		))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse(
		"Calculations retrieved successfully",
		calculations,
		http.StatusOK,
	))
}

// UpdateGoodCalculation updates a calculation scoped under a good
// DEPRECATED: Use PUT /api/v1/goods/calculations/{id} instead
// This handler is kept for backward compatibility but is NOT exposed in API
func (h *Handler) UpdateGoodCalculation(c echo.Context) error {
	goodID := c.Param("id")
	calculationID := c.Param("calculation_id")
	if goodID == "" || calculationID == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"Invalid request",
			"missing path parameter: id or calculation_id",
			http.StatusBadRequest,
		))
	}

	if _, err := uuid.Parse(goodID); err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"Invalid good ID format",
			err.Error(),
			http.StatusBadRequest,
		))
	}
	if _, err := uuid.Parse(calculationID); err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"Invalid calculation ID format",
			err.Error(),
			http.StatusBadRequest,
		))
	}

	ctx := c.Request().Context()

	existing, err := h.service.Calculation().GetCalculationByID(ctx, calculationID)
	if err != nil {
		log.Printf("UpdateGoodCalculation: failed to retrieve calculation: %v", err)
		return c.JSON(http.StatusNotFound, model.NewErrorResponse(
			"Calculation not found",
			err.Error(),
			http.StatusNotFound,
		))
	}
	if existing.GoodID == nil || *existing.GoodID != goodID {
		return c.JSON(http.StatusNotFound, model.NewErrorResponse(
			"Calculation not found",
			"calculation does not belong to the specified good",
			http.StatusNotFound,
		))
	}

	req := model.UpdateCalculationRequest{}
	if err := c.Bind(&req); err != nil {
		log.Printf("UpdateGoodCalculation: invalid request: %v", err)
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"Invalid request",
			err.Error(),
			http.StatusBadRequest,
		))
	}

	updated, err := h.service.Calculation().UpdateCalculation(ctx, calculationID, req.Quantity)
	if err != nil {
		log.Printf("UpdateGoodCalculation: failed to update calculation: %v", err)
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse(
			"Failed to update calculation",
			err.Error(),
			http.StatusInternalServerError,
		))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse(
		"Calculation updated successfully",
		updated,
		http.StatusOK,
	))
}

// DeleteGoodCalculation deletes a calculation scoped under a good
// DEPRECATED: Use DELETE /api/v1/goods/calculations/{id} instead
// This handler is kept for backward compatibility but is NOT exposed in API
func (h *Handler) DeleteGoodCalculation(c echo.Context) error {
	goodID := c.Param("id")
	calculationID := c.Param("calculation_id")
	if goodID == "" || calculationID == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"Invalid request",
			"missing path parameter: id or calculation_id",
			http.StatusBadRequest,
		))
	}

	if _, err := uuid.Parse(goodID); err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"Invalid good ID format",
			err.Error(),
			http.StatusBadRequest,
		))
	}
	if _, err := uuid.Parse(calculationID); err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"Invalid calculation ID format",
			err.Error(),
			http.StatusBadRequest,
		))
	}

	ctx := c.Request().Context()

	existing, err := h.service.Calculation().GetCalculationByID(ctx, calculationID)
	if err != nil {
		log.Printf("DeleteGoodCalculation: failed to retrieve calculation: %v", err)
		return c.JSON(http.StatusNotFound, model.NewErrorResponse(
			"Calculation not found",
			err.Error(),
			http.StatusNotFound,
		))
	}
	if existing.GoodID == nil || *existing.GoodID != goodID {
		return c.JSON(http.StatusNotFound, model.NewErrorResponse(
			"Calculation not found",
			"calculation does not belong to the specified good",
			http.StatusNotFound,
		))
	}

	if err := h.service.Calculation().DeleteCalculation(ctx, calculationID); err != nil {
		log.Printf("DeleteGoodCalculation: failed to delete calculation: %v", err)
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse(
			"Failed to delete calculation",
			err.Error(),
			http.StatusInternalServerError,
		))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse(
		"Calculation deleted successfully",
		map[string]interface{}{},
		http.StatusOK,
	))
}

// UpdateCompoundCalculation updates a calculation scoped under a compound
// DEPRECATED: Use PUT /api/v1/compounds/calculations/{id} instead
// This handler is kept for backward compatibility but is NOT exposed in API
func (h *Handler) UpdateCompoundCalculation(c echo.Context) error {
	compoundID := c.Param("id")
	calculationID := c.Param("calculation_id")
	if compoundID == "" || calculationID == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"Invalid request",
			"missing path parameter: id or calculation_id",
			http.StatusBadRequest,
		))
	}

	if _, err := uuid.Parse(compoundID); err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"Invalid compound ID format",
			err.Error(),
			http.StatusBadRequest,
		))
	}
	if _, err := uuid.Parse(calculationID); err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"Invalid calculation ID format",
			err.Error(),
			http.StatusBadRequest,
		))
	}

	ctx := c.Request().Context()

	existing, err := h.service.Calculation().GetCalculationByID(ctx, calculationID)
	if err != nil {
		log.Printf("UpdateCompoundCalculation: failed to retrieve calculation: %v", err)
		return c.JSON(http.StatusNotFound, model.NewErrorResponse(
			"Calculation not found",
			err.Error(),
			http.StatusNotFound,
		))
	}
	if existing.CompoundID == nil || *existing.CompoundID != compoundID {
		return c.JSON(http.StatusNotFound, model.NewErrorResponse(
			"Calculation not found",
			"calculation does not belong to the specified compound",
			http.StatusNotFound,
		))
	}

	req := model.UpdateCalculationRequest{}
	if err := c.Bind(&req); err != nil {
		log.Printf("UpdateCompoundCalculation: invalid request: %v", err)
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"Invalid request",
			err.Error(),
			http.StatusBadRequest,
		))
	}

	updated, err := h.service.Calculation().UpdateCalculation(ctx, calculationID, req.Quantity)
	if err != nil {
		log.Printf("UpdateCompoundCalculation: failed to update calculation: %v", err)
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse(
			"Failed to update calculation",
			err.Error(),
			http.StatusInternalServerError,
		))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse(
		"Calculation updated successfully",
		updated,
		http.StatusOK,
	))
}

// DeleteCompoundCalculation deletes a calculation scoped under a compound
// DEPRECATED: Use DELETE /api/v1/compounds/calculations/{id} instead
// This handler is kept for backward compatibility but is NOT exposed in API
func (h *Handler) DeleteCompoundCalculation(c echo.Context) error {
	compoundID := c.Param("id")
	calculationID := c.Param("calculation_id")
	if compoundID == "" || calculationID == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"Invalid request",
			"missing path parameter: id or calculation_id",
			http.StatusBadRequest,
		))
	}

	if _, err := uuid.Parse(compoundID); err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"Invalid compound ID format",
			err.Error(),
			http.StatusBadRequest,
		))
	}
	if _, err := uuid.Parse(calculationID); err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"Invalid calculation ID format",
			err.Error(),
			http.StatusBadRequest,
		))
	}

	ctx := c.Request().Context()

	existing, err := h.service.Calculation().GetCalculationByID(ctx, calculationID)
	if err != nil {
		log.Printf("DeleteCompoundCalculation: failed to retrieve calculation: %v", err)
		return c.JSON(http.StatusNotFound, model.NewErrorResponse(
			"Calculation not found",
			err.Error(),
			http.StatusNotFound,
		))
	}
	if existing.CompoundID == nil || *existing.CompoundID != compoundID {
		return c.JSON(http.StatusNotFound, model.NewErrorResponse(
			"Calculation not found",
			"calculation does not belong to the specified compound",
			http.StatusNotFound,
		))
	}

	if err := h.service.Calculation().DeleteCalculation(ctx, calculationID); err != nil {
		log.Printf("DeleteCompoundCalculation: failed to delete calculation: %v", err)
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse(
			"Failed to delete calculation",
			err.Error(),
			http.StatusInternalServerError,
		))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse(
		"Calculation deleted successfully",
		map[string]interface{}{},
		http.StatusOK,
	))
}

// UpdateCalculation updates an existing calculation quantity
// @Summary Update calculation quantity (auto-recalculates total_cost)
// @Description Update only the quantity of a calculation. Total cost is automatically recalculated as: total_cost = quantity × price_per_unit. To change ingredient/compound, delete and create a new calculation. Used by both /goods/calculations/{id} and /compounds/calculations/{id}
// @Tags Calculations
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "Calculation ID"
// @Param req body model.UpdateCalculationRequest true "Update request (quantity only)"
// @Success 200 {object} model.CalculationResponse
// @Failure 400 {object} model.ErrorData "Bad request"
// @Failure 401 {object} model.ErrorData "Unauthorized"
// @Failure 404 {object} model.ErrorData "Not found"
// @Failure 500 {object} model.ErrorData "Internal server error"
// @Router /api/v1/goods/calculations/{id} [put]
func (h *Handler) UpdateCalculation(c echo.Context) error {
	calculationID := c.Param("id")
	if calculationID == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"Calculation ID is required",
			"",
			http.StatusBadRequest,
		))
	}

	req := model.UpdateCalculationRequest{}
	if err := c.Bind(&req); err != nil {
		log.Printf("UpdateCalculation: invalid request: %v", err)
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"Invalid request",
			fmt.Sprintf("%v", err),
			http.StatusBadRequest,
		))
	}

	// Validate quantity is provided
	if req.Quantity == nil || *req.Quantity == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"Invalid request",
			"quantity is required",
			http.StatusBadRequest,
		))
	}

	ctx := c.Request().Context()

	calculation, err := h.service.Calculation().UpdateCalculation(ctx, calculationID, req.Quantity)
	if err != nil {
		log.Printf("UpdateCalculation: failed to update calculation: %v", err)
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse(
			"Failed to update calculation",
			fmt.Sprintf("%v", err),
			http.StatusInternalServerError,
		))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse(
		"Calculation updated successfully",
		calculation,
		http.StatusOK,
	))
}

// DeleteCalculation deletes a calculation
// @Summary Delete calculation
// @Description Delete a calculation record. Used by both /goods/calculations/{id} and /compounds/calculations/{id}
// @Tags Calculations
// @Produce json
// @Security BearerAuth
// @Param id path string true "Calculation ID"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} model.ErrorData "Bad request"
// @Failure 401 {object} model.ErrorData "Unauthorized"
// @Failure 404 {object} model.ErrorData "Not found"
// @Failure 500 {object} model.ErrorData "Internal server error"
// @Router /api/v1/goods/calculations/{id} [delete]
func (h *Handler) DeleteCalculation(c echo.Context) error {
	calculationID := c.Param("id")
	if calculationID == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"Calculation ID is required",
			"",
			http.StatusBadRequest,
		))
	}

	ctx := c.Request().Context()

	if err := h.service.Calculation().DeleteCalculation(ctx, calculationID); err != nil {
		log.Printf("DeleteCalculation: failed to delete calculation: %v", err)
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse(
			"Failed to delete calculation",
			fmt.Sprintf("%v", err),
			http.StatusInternalServerError,
		))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse(
		"Calculation deleted successfully",
		map[string]interface{}{},
		http.StatusOK,
	))
}

// GetGoodWithCalculations retrieves a good with all its calculations and profit info
// @Summary Get good with calculations
// @Description Retrieve a good with all its ingredient calculations and profit information
// @Tags Calculations
// @Produce json
// @Security BearerAuth
// @Param id path string true "Good ID"
// @Param expand query string false "Comma-separated list of fields to expand (e.g. ingredients,compounds)"
// @Success 200 {object} model.GoodCalculationResponse
// @Failure 400 {object} model.ErrorData "Bad request"
// @Failure 401 {object} model.ErrorData "Unauthorized"
// @Failure 404 {object} model.ErrorData "Not found"
// @Failure 500 {object} model.ErrorData "Internal server error"
// @Router /api/v1/goods/{id}/with-calculations [get]
func (h *Handler) GetGoodWithCalculations(c echo.Context) error {
	goodID := c.Param("id")
	if goodID == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"Good ID is required",
			"",
			http.StatusBadRequest,
		))
	}

	ctx := c.Request().Context()

	good, err := h.service.Calculation().GetGoodWithCalculations(ctx, goodID)
	if err != nil {
		log.Printf("GetGoodWithCalculations: failed to retrieve good: %v", err)
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse(
			"Failed to retrieve good",
			fmt.Sprintf("%v", err),
			http.StatusInternalServerError,
		))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse(
		"Good with calculations retrieved successfully",
		good,
		http.StatusOK,
	))
}

// GetCompoundWithCalculations retrieves a compound with all its calculations and profit info
// @Summary Get compound with calculations
// @Description Retrieve a compound with all its calculations and profit information
// @Tags Calculations
// @Produce json
// @Security BearerAuth
// @Param id path string true "Compound ID"
// @Param expand query string false "Comma-separated list of fields to expand (e.g. ingredients,compounds)"
// @Success 200 {object} model.CompoundCalculationResponse
// @Failure 400 {object} model.ErrorData "Bad request"
// @Failure 401 {object} model.ErrorData "Unauthorized"
// @Failure 404 {object} model.ErrorData "Not found"
// @Failure 500 {object} model.ErrorData "Internal server error"
// @Router /api/v1/compounds/{id}/with-calculations [get]
func (h *Handler) GetCompoundWithCalculations(c echo.Context) error {
	compoundID := c.Param("id")
	if compoundID == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"Compound ID is required",
			"",
			http.StatusBadRequest,
		))
	}

	ctx := c.Request().Context()

	compound, err := h.service.Calculation().GetCompoundWithCalculations(ctx, compoundID)
	if err != nil {
		log.Printf("GetCompoundWithCalculations: failed to retrieve compound: %v", err)
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse(
			"Failed to retrieve compound",
			err.Error(),
			http.StatusInternalServerError,
		))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse(
		"Compound with calculations retrieved successfully",
		compound,
		http.StatusOK,
	))
}

// PreviewCalculations returns calculated ingredient/compound cost rows without saving anything
// @Summary Preview calculations (no DB writes)
// @Description Calculate ingredient + compound costs for UI preview. Does not create any DB records.
// @Tags Calculations
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param request body model.PreviewCalculationsRequest true "Preview calculations request"
// @Success 200 {object} model.PreviewCalculationsResponse "Preview generated successfully"
// @Failure 400 {object} model.ErrorResponse "Invalid request"
// @Failure 401 {object} model.ErrorResponse "Unauthorized"
// @Failure 500 {object} model.ErrorResponse "Internal server error"
// @Router /api/v1/calculations/preview [post]
func (h *Handler) PreviewCalculations(c echo.Context) error {
	var req model.PreviewCalculationsRequest
	if err := c.Bind(&req); err != nil {
		log.Printf("PreviewCalculations: invalid request: %v", err)
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"Invalid request",
			err.Error(),
			http.StatusBadRequest,
		))
	}

	ctx := c.Request().Context()
	resp, err := h.service.Calculation().PreviewCalculations(ctx, &req)
	if err != nil {
		log.Printf("PreviewCalculations: failed: %v", err)
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"Failed to preview calculations",
			err.Error(),
			http.StatusBadRequest,
		))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse(
		"Calculations preview generated successfully",
		resp,
		http.StatusOK,
	))
}

// CreateModifierCalculation adds an ingredient or child-compound line to a modifier tech card.
func (h *Handler) CreateModifierCalculation(c echo.Context) error {
	req := model.CreateModifierCalculationRequest{}
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"Invalid request",
			err.Error(),
			http.StatusBadRequest,
		))
	}

	hasIngredient := req.IngredientID != nil && *req.IngredientID != ""
	hasCompoundToAdd := req.CompoundToAddID != nil && *req.CompoundToAddID != ""
	if hasIngredient && hasCompoundToAdd {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"Invalid request",
			"provide only one: ingredient_id or compound_to_add_id",
			http.StatusBadRequest,
		))
	}
	if req.ModifierID == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"modifier_id is required",
			"",
			http.StatusBadRequest,
		))
	}
	if !hasIngredient && !hasCompoundToAdd {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"Invalid request",
			"either ingredient_id or compound_to_add_id must be provided",
			http.StatusBadRequest,
		))
	}

	ctx := c.Request().Context()
	var out *model.ModifierCalculationResponse
	var err error
	if hasIngredient {
		out, err = h.service.Calculation().CreateModifierCalculationForIngredient(ctx, req.ModifierID, *req.IngredientID, req.Quantity)
	} else {
		out, err = h.service.Calculation().CreateModifierCalculationForCompound(ctx, req.ModifierID, *req.CompoundToAddID, req.Quantity)
	}
	if err != nil {
		log.Printf("CreateModifierCalculation failed: %v", err)
		return respondDomainError(c, "Failed to create modifier calculation", err)
	}

	return c.JSON(http.StatusCreated, model.NewSuccessResponse(
		"Modifier calculation created successfully",
		out,
		http.StatusCreated,
	))
}

// GetModifierCalculations lists tech-card rows for a modifier (query: modifier_id).
func (h *Handler) GetModifierCalculations(c echo.Context) error {
	modifierID := c.QueryParam("modifier_id")
	if modifierID == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"modifier_id is required",
			"use query parameter modifier_id",
			http.StatusBadRequest,
		))
	}

	ctx := c.Request().Context()
	rows, err := h.service.Calculation().GetModifierCalculationsByModifierID(ctx, modifierID)
	if err != nil {
		log.Printf("GetModifierCalculations failed for modifier %s: %v", modifierID, err)
		return respondDomainError(c, "Failed to retrieve modifier calculations", err)
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse(
		"Modifier calculations retrieved successfully",
		rows,
		http.StatusOK,
	))
}

// GetModifierCalculationByID returns a single modifier calculation row.
func (h *Handler) GetModifierCalculationByID(c echo.Context) error {
	id := c.Param("id")
	if id == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"id is required",
			"",
			http.StatusBadRequest,
		))
	}

	ctx := c.Request().Context()
	row, err := h.service.Calculation().GetModifierCalculationByID(ctx, id)
	if err != nil {
		log.Printf("GetModifierCalculationByID failed for id %s: %v", id, err)
		return respondDomainError(c, "Failed to retrieve modifier calculation", err)
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse(
		"Modifier calculation retrieved successfully",
		row,
		http.StatusOK,
	))
}

// UpdateModifierCalculation updates quantity on a modifier calculation row.
func (h *Handler) UpdateModifierCalculation(c echo.Context) error {
	id := c.Param("id")
	if id == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"id is required",
			"",
			http.StatusBadRequest,
		))
	}

	var req model.UpdateModifierCalculationRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"Invalid request",
			err.Error(),
			http.StatusBadRequest,
		))
	}

	ctx := c.Request().Context()
	row, err := h.service.Calculation().UpdateModifierCalculation(ctx, id, req.Quantity)
	if err != nil {
		log.Printf("UpdateModifierCalculation failed for id %s: %v", id, err)
		return respondDomainError(c, "Failed to update modifier calculation", err)
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse(
		"Modifier calculation updated successfully",
		row,
		http.StatusOK,
	))
}

// DeleteModifierCalculation soft-deletes a modifier calculation row.
func (h *Handler) DeleteModifierCalculation(c echo.Context) error {
	id := c.Param("id")
	if id == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"id is required",
			"",
			http.StatusBadRequest,
		))
	}

	ctx := c.Request().Context()
	if err := h.service.Calculation().DeleteModifierCalculation(ctx, id); err != nil {
		log.Printf("DeleteModifierCalculation failed for id %s: %v", id, err)
		return respondDomainError(c, "Failed to delete modifier calculation", err)
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse(
		"Modifier calculation deleted successfully",
		map[string]interface{}{},
		http.StatusOK,
	))
}