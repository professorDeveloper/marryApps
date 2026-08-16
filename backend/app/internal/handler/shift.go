package handler

import (
	"log"
	"net/http"

	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
	"gitlab.yurtal.tech/company/maryai/back/internal/middleware"
	"gitlab.yurtal.tech/company/maryai/back/internal/model"
)

// CreateShift creates a new shift
// @Summary Create a new shift
// @Description Create a new shift for staff scheduling
// @Tags shifts
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param input body model.CreateShiftRequest true "Shift creation data"
// @Success 201 {object} model.ShiftResponse "Shift created successfully"
// @Failure 400 {object} model.ErrorResponse "Invalid request data"
// @Failure 401 {object} model.ErrorResponse "Unauthorized"
// @Failure 500 {object} model.ErrorResponse "Internal server error"
// @Router /api/v1/shifts [post]
func (h *Handler) CreateShift(c echo.Context) error {
	var req model.CreateShiftRequest
	if err := c.Bind(&req); err != nil {
		log.Printf("Failed to bind create shift request: %v", err)
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"invalid request format",
			err.Error(),
			http.StatusBadRequest,
		))
	}

	if req.Name == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"name is required",
			"missing required field: name",
			http.StatusBadRequest,
		))
	}

	branchID := middleware.GetBranchIDFromContext(c)
	if branchID == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"branch_id is required",
			"missing required field: branch_id",
			http.StatusBadRequest,
		))
	}

	shift, err := h.service.Shift().CreateShift(c.Request().Context(), req.Name, req.Role, req.WorkingDays, req.OpenTime, req.CloseTime, branchID)
	if err != nil {
		log.Printf("CreateShift failed: %v", err)
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse(
			"failed to create shift",
			err.Error(),
			http.StatusInternalServerError,
		))
	}

	return c.JSON(http.StatusCreated, model.NewSuccessResponse(
		"Shift created successfully",
		shift,
		http.StatusCreated,
	))
}

// GetShiftByID retrieves a shift by ID
// @Summary Get shift by ID
// @Description Retrieve a specific shift by its ID
// @Tags shifts
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "Shift ID"
// @Success 200 {object} model.ShiftResponse "Shift details"
// @Failure 400 {object} model.ErrorResponse "Invalid shift ID"
// @Failure 401 {object} model.ErrorResponse "Unauthorized"
// @Failure 404 {object} model.ErrorResponse "Shift not found"
// @Failure 500 {object} model.ErrorResponse "Internal server error"
// @Router /api/v1/shifts/{id} [get]
func (h *Handler) GetShiftByID(c echo.Context) error {
	shiftID := c.Param("id")
	if shiftID == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"shift id is required",
			"missing path parameter: id",
			http.StatusBadRequest,
		))
	}

	// Validate UUID format
	if _, err := uuid.Parse(shiftID); err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"invalid shift id format",
			err.Error(),
			http.StatusBadRequest,
		))
	}

	shift, err := h.service.Shift().GetShiftByID(c.Request().Context(), shiftID)
	if err != nil {
		log.Printf("GetShiftByID failed for id %s: %v", shiftID, err)
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse(
			"failed to fetch shift",
			err.Error(),
			http.StatusInternalServerError,
		))
	}

	if shift == nil {
		return c.JSON(http.StatusNotFound, model.NewErrorResponse(
			"shift not found",
			"shift not found",
			http.StatusNotFound,
		))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse(
		"Shift retrieved successfully",
		shift,
		http.StatusOK,
	))
}

// GetAllShifts retrieves all shifts
// @Summary Get all shifts
// @Description Retrieve all shifts in the system
// @Tags shifts
// @Accept json
// @Produce json
// @Security BearerAuth
// @Success 200 {array} model.ShiftResponse "List of all shifts"
// @Failure 401 {object} model.ErrorResponse "Unauthorized"
// @Failure 500 {object} model.ErrorResponse "Internal server error"
// @Router /api/v1/shifts [get]
func (h *Handler) GetAllShifts(c echo.Context) error {
	shifts, err := h.service.Shift().GetAllShifts(c.Request().Context())
	if err != nil {
		log.Printf("GetAllShifts failed: %v", err)
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse(
			"failed to fetch shifts",
			err.Error(),
			http.StatusInternalServerError,
		))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse(
		"Shifts retrieved successfully",
		shifts,
		http.StatusOK,
	))
}

// GetShiftsByBranchID retrieves shifts for a specific branch
// @Summary Get shifts by branch
// @Description Retrieve all shifts for a specific branch
// @Tags shifts
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param branchId path string true "Branch ID"
// @Success 200 {array} model.ShiftResponse "List of shifts for the branch"
// @Failure 400 {object} model.ErrorResponse "Invalid branch ID"
// @Failure 401 {object} model.ErrorResponse "Unauthorized"
// @Failure 500 {object} model.ErrorResponse "Internal server error"
// @Router /api/v1/shifts/branch/{branchId} [get]
func (h *Handler) GetShiftsByBranchID(c echo.Context) error {
	branchID := c.Param("branchId")
	if branchID == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"branch_id is required",
			"missing path parameter: branchId",
			http.StatusBadRequest,
		))
	}

	// Validate UUID format
	if _, err := uuid.Parse(branchID); err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"invalid branch_id format",
			err.Error(),
			http.StatusBadRequest,
		))
	}

	shifts, err := h.service.Shift().GetShiftsByBranchID(c.Request().Context(), branchID)
	if err != nil {
		log.Printf("GetShiftsByBranchID failed for branch_id %s: %v", branchID, err)
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse(
			"failed to fetch shifts",
			err.Error(),
			http.StatusInternalServerError,
		))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse(
		"Shifts retrieved successfully",
		shifts,
		http.StatusOK,
	))
}

// UpdateShift updates an existing shift
// @Summary Update shift
// @Description Update an existing shift details
// @Tags shifts
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "Shift ID"
// @Param input body model.UpdateShiftRequest true "Shift update data"
// @Success 200 {object} model.ShiftResponse "Shift updated successfully"
// @Failure 400 {object} model.ErrorResponse "Invalid request data"
// @Failure 401 {object} model.ErrorResponse "Unauthorized"
// @Failure 404 {object} model.ErrorResponse "Shift not found"
// @Failure 500 {object} model.ErrorResponse "Internal server error"
// @Router /api/v1/shifts/{id} [put]
func (h *Handler) UpdateShift(c echo.Context) error {
	shiftID := c.Param("id")
	if shiftID == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"shift id is required",
			"missing path parameter: id",
			http.StatusBadRequest,
		))
	}

	// Validate UUID format
	if _, err := uuid.Parse(shiftID); err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"invalid shift id format",
			err.Error(),
			http.StatusBadRequest,
		))
	}

	var req model.UpdateShiftRequest
	if err := c.Bind(&req); err != nil {
		log.Printf("Failed to bind update shift request: %v", err)
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"invalid request format",
			err.Error(),
			http.StatusBadRequest,
		))
	}

	shift, err := h.service.Shift().UpdateShift(c.Request().Context(), shiftID, req.Name, req.Role, req.WorkingDays, req.OpenTime, req.CloseTime)
	if err != nil {
		log.Printf("UpdateShift failed for id %s: %v", shiftID, err)
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse(
			"failed to update shift",
			err.Error(),
			http.StatusInternalServerError,
		))
	}

	if shift == nil {
		return c.JSON(http.StatusNotFound, model.NewErrorResponse(
			"shift not found",
			"shift not found",
			http.StatusNotFound,
		))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse(
		"Shift updated successfully",
		shift,
		http.StatusOK,
	))
}

// DeleteShift deletes a shift
// @Summary Delete shift
// @Description Delete a shift from the system
// @Tags shifts
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "Shift ID"
// @Success 200 {object} model.SuccessResponse "Shift deleted successfully"
// @Failure 400 {object} model.ErrorResponse "Invalid shift ID"
// @Failure 401 {object} model.ErrorResponse "Unauthorized"
// @Failure 500 {object} model.ErrorResponse "Internal server error"
// @Router /api/v1/shifts/{id} [delete]
func (h *Handler) DeleteShift(c echo.Context) error {
	shiftID := c.Param("id")
	if shiftID == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"shift id is required",
			"missing path parameter: id",
			http.StatusBadRequest,
		))
	}

	// Validate UUID format
	if _, err := uuid.Parse(shiftID); err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"invalid shift id format",
			err.Error(),
			http.StatusBadRequest,
		))
	}

	if err := h.service.Shift().DeleteShift(c.Request().Context(), shiftID); err != nil {
		log.Printf("DeleteShift failed for id %s: %v", shiftID, err)
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse(
			"failed to delete shift",
			err.Error(),
			http.StatusInternalServerError,
		))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse(
		"Shift deleted successfully",
		struct{}{},
		http.StatusOK,
	))
}
