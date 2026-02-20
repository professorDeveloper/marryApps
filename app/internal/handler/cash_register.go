package handler

import (
	"fmt"
	"log"
	"net/http"

	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
	"gitlab.yurtal.tech/company/maryai/back/internal/model"
)

// CreateCashRegister godoc
// @Summary Create a new cash register
// @Description Create a new cash register for the current branch
// @Tags cash-registers
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param request body model.CashRegisterRequest true "Cash register data"
// @Success 201 {object} model.CashRegisterResponse "Cash register created successfully"
// @Failure 400 {object} model.ErrorResponse "Invalid request format"
// @Failure 401 {object} model.ErrorResponse "Unauthorized"
// @Failure 500 {object} model.ErrorResponse "Internal server error"
// @Router /api/v1/cash-registers [post]
func (h *Handler) CreateCashRegister(c echo.Context) error {
	var req model.CashRegisterRequest
	if err := c.Bind(&req); err != nil {
		log.Printf("Failed to bind request: %v", err)
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("Invalid request format", err.Error(), http.StatusBadRequest))
	}

	ctx := c.Request().Context()
	cashRegister, err := h.service.Cash().CreateCashRegister(ctx, req)
	if err != nil {
		log.Printf("Failed to create cash register: %v", err)
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("Failed to create cash register", err.Error(), http.StatusInternalServerError))
	}

	return c.JSON(http.StatusCreated, model.NewSuccessResponse("Cash register created successfully", cashRegister, http.StatusCreated))
}

// GetCashRegister godoc
// @Summary Get cash register by ID
// @Description Retrieve a cash register by its ID
// @Tags cash-registers
// @Produce json
// @Security BearerAuth
// @Param id path string true "Cash register ID"
// @Success 200 {object} model.CashRegisterResponse "Cash register retrieved successfully"
// @Failure 401 {object} model.ErrorResponse "Unauthorized"
// @Failure 404 {object} model.ErrorResponse "Cash register not found"
// @Failure 500 {object} model.ErrorResponse "Internal server error"
// @Router /api/v1/cash-registers/{id} [get]
func (h *Handler) GetCashRegister(c echo.Context) error {
	idStr := c.Param("id")
	if idStr == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("Missing ID parameter", "", http.StatusBadRequest))
	}

	id, err := uuid.Parse(idStr)
	if err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("Invalid ID format", err.Error(), http.StatusBadRequest))
	}

	ctx := c.Request().Context()
	cashRegister, err := h.service.Cash().GetCashRegisterByID(ctx, id)
	if err != nil {
		log.Printf("Failed to get cash register: %v", err)
		return c.JSON(http.StatusNotFound, model.NewErrorResponse("Cash register not found", err.Error(), http.StatusNotFound))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse("Cash register retrieved successfully", cashRegister, http.StatusOK))
}

// GetAllCashRegisters godoc
// @Summary Get all cash registers
// @Description Retrieve all cash registers for the current branch
// @Tags cash-registers
// @Produce json
// @Security BearerAuth
// @Param limit query int false "Limit results (default: 20)" default(20)
// @Param offset query int false "Offset for pagination (default: 0)" default(0)
// @Success 200 {array} model.CashRegisterResponse "Cash registers retrieved successfully"
// @Failure 401 {object} model.ErrorResponse "Unauthorized"
// @Failure 500 {object} model.ErrorResponse "Internal server error"
// @Router /api/v1/cash-registers [get]
func (h *Handler) GetAllCashRegisters(c echo.Context) error {
	limitStr := c.QueryParam("limit")
	offsetStr := c.QueryParam("offset")

	limit := int32(20)
	offset := int32(0)

	if limitStr != "" {
		var l int32
		if _, err := fmt.Sscanf(limitStr, "%d", &l); err == nil && l > 0 {
			limit = l
		}
	}

	if offsetStr != "" {
		var o int32
		if _, err := fmt.Sscanf(offsetStr, "%d", &o); err == nil && o >= 0 {
			offset = o
		}
	}

	ctx := c.Request().Context()
	cashRegisters, err := h.service.Cash().GetAllCashRegisters(ctx, limit, offset)
	if err != nil {
		log.Printf("Failed to get cash registers: %v", err)
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("Failed to get cash registers", err.Error(), http.StatusInternalServerError))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse("Cash registers retrieved successfully", cashRegisters, http.StatusOK))
}

// GetCashRegistersByBranchID godoc
// @Summary Get cash registers by branch ID
// @Description Retrieve all cash registers for a specific branch
// @Tags cash-registers
// @Produce json
// @Security BearerAuth
// @Param branchId path string true "Branch ID"
// @Param limit query int false "Limit results (default: 20)" default(20)
// @Param offset query int false "Offset for pagination (default: 0)" default(0)
// @Success 200 {array} model.CashRegisterResponse "Cash registers retrieved successfully"
// @Failure 400 {object} model.ErrorResponse "Invalid branch ID"
// @Failure 401 {object} model.ErrorResponse "Unauthorized"
// @Failure 500 {object} model.ErrorResponse "Internal server error"
// @Router /api/v1/cash-registers/branch/{branchId} [get]
func (h *Handler) GetCashRegistersByBranchID(c echo.Context) error {
	branchID, err := uuid.Parse(c.Param("branchId"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("Invalid branch ID", err.Error(), http.StatusBadRequest))
	}

	limit := int32(20)
	offset := int32(0)
	if l := c.QueryParam("limit"); l != "" {
		var v int32
		if _, err := fmt.Sscanf(l, "%d", &v); err == nil && v > 0 {
			limit = v
		}
	}
	if o := c.QueryParam("offset"); o != "" {
		var v int32
		if _, err := fmt.Sscanf(o, "%d", &v); err == nil && v >= 0 {
			offset = v
		}
	}

	cashRegisters, err := h.service.Cash().GetCashRegistersByBranchID(c.Request().Context(), branchID, limit, offset)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("Failed to get cash registers", err.Error(), http.StatusInternalServerError))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse("Cash registers retrieved successfully", cashRegisters, http.StatusOK))
}

// UpdateCashRegister godoc
// @Summary Update cash register
// @Description Update a cash register
// @Tags cash-registers
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "Cash register ID"
// @Param request body model.CashRegisterRequest true "Cash register update data"
// @Success 200 {object} model.CashRegisterResponse "Cash register updated successfully"
// @Failure 400 {object} model.ErrorResponse "Invalid request format"
// @Failure 401 {object} model.ErrorResponse "Unauthorized"
// @Failure 404 {object} model.ErrorResponse "Cash register not found"
// @Failure 500 {object} model.ErrorResponse "Internal server error"
// @Router /api/v1/cash-registers/{id} [put]
func (h *Handler) UpdateCashRegister(c echo.Context) error {
	idStr := c.Param("id")
	if idStr == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("Missing ID parameter", "", http.StatusBadRequest))
	}

	id, err := uuid.Parse(idStr)
	if err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("Invalid ID format", err.Error(), http.StatusBadRequest))
	}

	var req model.CashRegisterRequest
	if err := c.Bind(&req); err != nil {
		log.Printf("Failed to bind request: %v", err)
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("Invalid request format", err.Error(), http.StatusBadRequest))
	}

	ctx := c.Request().Context()
	cashRegister, err := h.service.Cash().UpdateCashRegister(ctx, id, req)
	if err != nil {
		log.Printf("Failed to update cash register: %v", err)
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("Failed to update cash register", err.Error(), http.StatusInternalServerError))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse("Cash register updated successfully", cashRegister, http.StatusOK))
}

// DeleteCashRegister godoc
// @Summary Delete cash register
// @Description Soft delete a cash register
// @Tags cash-registers
// @Produce json
// @Security BearerAuth
// @Param id path string true "Cash register ID"
// @Success 200 {object} model.SuccessResponse "Cash register deleted successfully"
// @Failure 400 {object} model.ErrorResponse "Invalid ID"
// @Failure 401 {object} model.ErrorResponse "Unauthorized"
// @Failure 404 {object} model.ErrorResponse "Cash register not found"
// @Failure 500 {object} model.ErrorResponse "Internal server error"
// @Router /api/v1/cash-registers/{id} [delete]
func (h *Handler) DeleteCashRegister(c echo.Context) error {
	idStr := c.Param("id")
	if idStr == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("Missing ID parameter", "", http.StatusBadRequest))
	}

	id, err := uuid.Parse(idStr)
	if err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("Invalid ID format", err.Error(), http.StatusBadRequest))
	}

	ctx := c.Request().Context()
	if err := h.service.Cash().DeleteCashRegister(ctx, id); err != nil {
		log.Printf("Failed to delete cash register: %v", err)
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("Failed to delete cash register", err.Error(), http.StatusInternalServerError))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse("Cash register deleted successfully", map[string]interface{}{}, http.StatusOK))
}

// RestoreCashRegister godoc
// @Summary Restore cash register
// @Description Restore a soft-deleted cash register
// @Tags cash-registers
// @Produce json
// @Security BearerAuth
// @Param id path string true "Cash register ID"
// @Success 200 {object} model.SuccessResponse "Cash register restored successfully"
// @Failure 400 {object} model.ErrorResponse "Invalid ID"
// @Failure 401 {object} model.ErrorResponse "Unauthorized"
// @Failure 500 {object} model.ErrorResponse "Internal server error"
// @Router /api/v1/cash-registers/{id}/restore [post]
func (h *Handler) RestoreCashRegister(c echo.Context) error {
	idStr := c.Param("id")
	if idStr == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("Missing ID parameter", "", http.StatusBadRequest))
	}

	id, err := uuid.Parse(idStr)
	if err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("Invalid ID format", err.Error(), http.StatusBadRequest))
	}

	ctx := c.Request().Context()
	if err := h.service.Cash().RestoreCashRegister(ctx, id); err != nil {
		log.Printf("Failed to restore cash register: %v", err)
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("Failed to restore cash register", err.Error(), http.StatusInternalServerError))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse("Cash register restored successfully", map[string]interface{}{}, http.StatusOK))
}
