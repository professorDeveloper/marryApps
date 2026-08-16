package handler

import (
	"github.com/labstack/echo/v4"
)

// GetCompoundCalculation retrieves a calculation by ID for compounds
// @Summary Get calculation by ID
// @Description Retrieve a single calculation record by ID
// @Tags Calculations
// @Produce json
// @Security BearerAuth
// @Param id path string true "Calculation ID"
// @Success 200 {object} model.CalculationResponse
// @Failure 400 {object} model.ErrorData "Bad request"
// @Failure 401 {object} model.ErrorData "Unauthorized"
// @Failure 404 {object} model.ErrorData "Not found"
// @Failure 500 {object} model.ErrorData "Internal server error"
// @Router /api/v1/compounds/calculations/{id} [get]
func (h *Handler) GetCompoundCalculation(c echo.Context) error {
	return h.GetCalculation(c)
}

// UpdateCompoundCalculationWrapper updates calculation for compounds
// @Summary Update calculation quantity
// @Description Update only the quantity of a calculation. Total cost is automatically recalculated as: total_cost = quantity × price_per_unit. To change ingredient/compound, delete and create a new calculation.
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
// @Router /api/v1/compounds/calculations/{id} [put]
func (h *Handler) UpdateCompoundCalculationWrapper(c echo.Context) error {
	return h.UpdateCalculation(c)
}

// DeleteCompoundCalculationWrapper deletes calculation for compounds
// @Summary Delete calculation
// @Description Delete a calculation record
// @Tags Calculations
// @Produce json
// @Security BearerAuth
// @Param id path string true "Calculation ID"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} model.ErrorData "Bad request"
// @Failure 401 {object} model.ErrorData "Unauthorized"
// @Failure 404 {object} model.ErrorData "Not found"
// @Failure 500 {object} model.ErrorData "Internal server error"
// @Router /api/v1/compounds/calculations/{id} [delete]
func (h *Handler) DeleteCompoundCalculationWrapper(c echo.Context) error {
	return h.DeleteCalculation(c)
}
