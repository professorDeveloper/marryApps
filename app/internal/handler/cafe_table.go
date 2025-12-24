package handler

import (
	"net/http"
	"strconv"

	"github.com/labstack/echo/v4"
	"gitlab.yurtal.tech/company/maryai/back/internal/model"
)

// CreateCafeTable creates a new cafe table
// @Summary Create a new cafe table
// @Description Create a new cafe table in a specific hall
// @Tags cafe-tables
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param request body model.CreateCafeTableRequest true "Create Cafe Table Request"
// @Success 201 {object} model.CafeTableResponse
// @Failure 400 {object} model.ErrorResponse
// @Failure 401 {object} model.ErrorResponse
// @Router /api/v1/cafe-tables [post]
func (h *Handler) CreateCafeTable(c echo.Context) error {
	var req model.CreateCafeTableRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, model.ErrorResponse{Message: "Invalid request"})
	}

	status := req.Status
	if status == "" {
		status = "free"
	}

	table, err := h.service.CafeTable().CreateCafeTable(c.Request().Context(), req.HallID, req.Number, req.Capacity, &status)
	if err != nil {
		return c.JSON(http.StatusBadRequest, model.ErrorResponse{Message: err.Error()})
	}

	return c.JSON(http.StatusCreated, table)
}

// GetCafeTableByID
// @Summary Get cafe table by ID
// @Description Get a specific cafe table by its ID
// @Tags cafe-tables
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "Cafe Table ID" example:"c0f18a64-7f5c-4425-9414-1b01cddee9d9"
// @Success 200 {object} model.CafeTableResponse
// @Failure 404 {object} model.ErrorResponse
// @Router /api/v1/cafe-tables/{id} [get]
func (h *Handler) GetCafeTableByID(c echo.Context) error {
	tableID := c.Param("id")
	if tableID == "" {
		return c.JSON(http.StatusBadRequest, model.ErrorResponse{Message: "Table ID is required"})
	}

	table, err := h.service.CafeTable().GetCafeTableByID(c.Request().Context(), tableID)
	if err != nil {
		return c.JSON(http.StatusNotFound, model.ErrorResponse{Message: err.Error()})
	}

	return c.JSON(http.StatusOK, table)
}

// GetAllCafeTables
// @Summary Get all cafe tables
// @Description Get all cafe tables with pagination
// @Tags cafe-tables
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param limit query int false "Limit" default(10) example:"10"
// @Param offset query int false "Offset" default(0) example:"0"
// @Success 200 {array} model.CafeTableResponse
// @Failure 400 {object} model.ErrorResponse
// @Router /api/v1/cafe-tables [get]
func (h *Handler) GetAllCafeTables(c echo.Context) error {
	limit := int32(10)
	if l := c.QueryParam("limit"); l != "" {
		if val, err := strconv.Atoi(l); err == nil {
			limit = int32(val)
		}
	}

	offset := int32(0)
	if o := c.QueryParam("offset"); o != "" {
		if val, err := strconv.Atoi(o); err == nil {
			offset = int32(val)
		}
	}

	tables, err := h.service.CafeTable().GetAllCafeTables(c.Request().Context(), limit, offset)
	if err != nil {
		return c.JSON(http.StatusBadRequest, model.ErrorResponse{Message: err.Error()})
	}

	return c.JSON(http.StatusOK, tables)
}

// GetCafeTablesByHallID
// @Summary Get cafe tables by hall ID
// @Description Get all tables in a specific hall
// @Tags cafe-tables
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param hall_id path string true "Hall ID" example:"a1b2c3d4-e5f6-4a5b-8c9d-e0f1a2b3c4d5"
// @Param limit query int false "Limit" default(10) example:"10"
// @Param offset query int false "Offset" default(0) example:"0"
// @Success 200 {array} model.CafeTableResponse
// @Failure 400 {object} model.ErrorResponse
// @Router /api/v1/cafe-tables/hall/{hall_id} [get]
func (h *Handler) GetCafeTablesByHallID(c echo.Context) error {
	hallID := c.Param("hall_id")
	if hallID == "" {
		return c.JSON(http.StatusBadRequest, model.ErrorResponse{Message: "Hall ID is required"})
	}

	limit := int32(10)
	if l := c.QueryParam("limit"); l != "" {
		if val, err := strconv.Atoi(l); err == nil {
			limit = int32(val)
		}
	}

	offset := int32(0)
	if o := c.QueryParam("offset"); o != "" {
		if val, err := strconv.Atoi(o); err == nil {
			offset = int32(val)
		}
	}

	tables, err := h.service.CafeTable().GetCafeTablesByHallID(c.Request().Context(), hallID, limit, offset)
	if err != nil {
		return c.JSON(http.StatusBadRequest, model.ErrorResponse{Message: err.Error()})
	}

	return c.JSON(http.StatusOK, tables)
}

// GetCafeTablesByStatus
// @Summary Get cafe tables by status
// @Description Get tables with a specific status
// @Tags cafe-tables
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param status path string true "Status" example:"available" enum:"available,occupied,reserved"
// @Param limit query int false "Limit" default(10) example:"10"
// @Param offset query int false "Offset" default(0) example:"0"
// @Success 200 {array} model.CafeTableResponse
// @Failure 400 {object} model.ErrorResponse
// @Router /api/v1/cafe-tables/status/{status} [get]
func (h *Handler) GetCafeTablesByStatus(c echo.Context) error {
	status := c.Param("status")
	if status == "" {
		return c.JSON(http.StatusBadRequest, model.ErrorResponse{Message: "Status is required"})
	}

	limit := int32(10)
	if l := c.QueryParam("limit"); l != "" {
		if val, err := strconv.Atoi(l); err == nil {
			limit = int32(val)
		}
	}

	offset := int32(0)
	if o := c.QueryParam("offset"); o != "" {
		if val, err := strconv.Atoi(o); err == nil {
			offset = int32(val)
		}
	}

	tables, err := h.service.CafeTable().GetCafeTablesByStatus(c.Request().Context(), status, limit, offset)
	if err != nil {
		return c.JSON(http.StatusBadRequest, model.ErrorResponse{Message: err.Error()})
	}

	return c.JSON(http.StatusOK, tables)
}

// UpdateCafeTable
// @Summary Update a cafe table
// @Description Update a cafe table details
// @Tags cafe-tables
// @Security Bearer
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "Cafe Table ID" example:"c0f18a64-7f5c-4425-9414-1b01cddee9d9"
// @Param request body model.UpdateCafeTableRequest true "Update Cafe Table Request"
// @Success 200 {object} model.CafeTableResponse
// @Failure 400 {object} model.ErrorResponse
// @Failure 401 {object} model.ErrorResponse
// @Router /api/v1/cafe-tables/{id} [put]
func (h *Handler) UpdateCafeTable(c echo.Context) error {
	tableID := c.Param("id")
	if tableID == "" {
		return c.JSON(http.StatusBadRequest, model.ErrorResponse{Message: "Table ID is required"})
	}

	var req model.UpdateCafeTableRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, model.ErrorResponse{Message: "Invalid request"})
	}

	table, err := h.service.CafeTable().UpdateCafeTable(c.Request().Context(), tableID, req.HallID, req.Number, req.Capacity, req.Status)
	if err != nil {
		return c.JSON(http.StatusBadRequest, model.ErrorResponse{Message: err.Error()})
	}

	return c.JSON(http.StatusOK, table)
}

// UpdateCafeTableStatus
// @Summary Update cafe table status
// @Description Update the status of a cafe table
// @Tags cafe-tables
// @Security Bearer
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "Cafe Table ID" example:"c0f18a64-7f5c-4425-9414-1b01cddee9d9"
// @Param request body model.UpdateCafeTableStatusRequest true "Update Cafe Table Status Request"
// @Success 200 {object} model.CafeTableResponse
// @Failure 400 {object} model.ErrorResponse
// @Failure 401 {object} model.ErrorResponse
// @Router /api/v1/cafe-tables/{id}/status [patch]
func (h *Handler) UpdateCafeTableStatus(c echo.Context) error {
	tableID := c.Param("id")
	if tableID == "" {
		return c.JSON(http.StatusBadRequest, model.ErrorResponse{Message: "Table ID is required"})
	}

	var req model.UpdateCafeTableStatusRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, model.ErrorResponse{Message: "Invalid request"})
	}

	table, err := h.service.CafeTable().UpdateCafeTableStatus(c.Request().Context(), tableID, req.Status)
	if err != nil {
		return c.JSON(http.StatusBadRequest, model.ErrorResponse{Message: err.Error()})
	}

	return c.JSON(http.StatusOK, table)
}

// DeleteCafeTable
// @Summary Delete a cafe table
// @Description Soft delete a cafe table
// @Tags cafe-tables
// @Security Bearer
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "Cafe Table ID" example:"c0f18a64-7f5c-4425-9414-1b01cddee9d9"
// @Success 204
// @Failure 400 {object} model.ErrorResponse
// @Failure 401 {object} model.ErrorResponse
// @Router /api/v1/cafe-tables/{id} [delete]
func (h *Handler) DeleteCafeTable(c echo.Context) error {
	tableID := c.Param("id")
	if tableID == "" {
		return c.JSON(http.StatusBadRequest, model.ErrorResponse{Message: "Table ID is required"})
	}

	if err := h.service.CafeTable().DeleteCafeTable(c.Request().Context(), tableID); err != nil {
		return c.JSON(http.StatusBadRequest, model.ErrorResponse{Message: err.Error()})
	}

	return c.NoContent(http.StatusNoContent)
}

// RestoreCafeTable
// @Summary Restore a cafe table
// @Description Restore a soft deleted cafe table
// @Tags cafe-tables
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param id path string true "Cafe Table ID" example:"c0f18a64-7f5c-4425-9414-1b01cddee9d9"
// @Success 204
// @Failure 400 {object} model.ErrorResponse
// @Failure 401 {object} model.ErrorResponse
// @Router /api/v1/cafe-tables/{id}/restore [post]
func (h *Handler) RestoreCafeTable(c echo.Context) error {
	tableID := c.Param("id")
	if tableID == "" {
		return c.JSON(http.StatusBadRequest, model.ErrorResponse{Message: "Table ID is required"})
	}

	if err := h.service.CafeTable().RestoreCafeTable(c.Request().Context(), tableID); err != nil {
		return c.JSON(http.StatusBadRequest, model.ErrorResponse{Message: err.Error()})
	}

	return c.NoContent(http.StatusNoContent)
}

// SearchCafeTables
// @Summary Search cafe tables
// @Description Search cafe tables by number or status
// @Tags cafe-tables
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param query query string false "Search query" example:"5"
// @Param limit query int false "Limit" default(10) example:"10"
// @Param offset query int false "Offset" default(0) example:"0"
// @Success 200 {array} model.CafeTableResponse
// @Failure 400 {object} model.ErrorResponse
// @Router /api/v1/cafe-tables/search [get]
func (h *Handler) SearchCafeTables(c echo.Context) error {
	query := c.QueryParam("query")
	if query == "" {
		return c.JSON(http.StatusBadRequest, model.ErrorResponse{Message: "Query is required"})
	}

	limit := int32(10)
	if l := c.QueryParam("limit"); l != "" {
		if val, err := strconv.Atoi(l); err == nil {
			limit = int32(val)
		}
	}

	offset := int32(0)
	if o := c.QueryParam("offset"); o != "" {
		if val, err := strconv.Atoi(o); err == nil {
			offset = int32(val)
		}
	}

	tables, err := h.service.CafeTable().SearchCafeTables(c.Request().Context(), query, limit, offset)
	if err != nil {
		return c.JSON(http.StatusBadRequest, model.ErrorResponse{Message: err.Error()})
	}

	return c.JSON(http.StatusOK, tables)
}

// GetCafeTablesByHallAndStatus
// @Summary Get cafe tables by hall and status
// @Description Get tables in a specific hall with a specific status
// @Tags cafe-tables
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param hall_id query string false "Hall ID" example:"a1b2c3d4-e5f6-4a5b-8c9d-e0f1a2b3c4d5"
// @Param status query string false "Status" example:"free"
// @Success 200 {array} model.CafeTableResponse
// @Failure 400 {object} model.ErrorResponse
// @Router /api/v1/cafe-tables/hall-status [get]
func (h *Handler) GetCafeTablesByHallAndStatus(c echo.Context) error {
	hallID := c.QueryParam("hall_id")
	status := c.QueryParam("status")

	if hallID == "" || status == "" {
		return c.JSON(http.StatusBadRequest, model.ErrorResponse{Message: "Hall ID and status are required"})
	}

	tables, err := h.service.CafeTable().GetCafeTablesByHallAndStatus(c.Request().Context(), hallID, status)
	if err != nil {
		return c.JSON(http.StatusBadRequest, model.ErrorResponse{Message: err.Error()})
	}

	return c.JSON(http.StatusOK, tables)
}

// GetAvailableTablesByHall
// @Summary Get available tables by hall
// @Description Get all available (free) tables in a specific hall
// @Tags cafe-tables
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param hall_id path string true "Hall ID" example:"a1b2c3d4-e5f6-4a5b-8c9d-e0f1a2b3c4d5"
// @Success 200 {array} model.CafeTableResponse
// @Failure 400 {object} model.ErrorResponse
// @Router /api/v1/cafe-tables/available/hall/{hall_id} [get]
func (h *Handler) GetAvailableTablesByHall(c echo.Context) error {
	hallID := c.Param("hall_id")
	if hallID == "" {
		return c.JSON(http.StatusBadRequest, model.ErrorResponse{Message: "Hall ID is required"})
	}

	tables, err := h.service.CafeTable().GetAvailableTablesByHall(c.Request().Context(), hallID)
	if err != nil {
		return c.JSON(http.StatusBadRequest, model.ErrorResponse{Message: err.Error()})
	}

	return c.JSON(http.StatusOK, tables)
}

// GetAvailableTablesByCapacity
// @Summary Get available tables by capacity
// @Description Get available tables that can accommodate a minimum number of guests
// @Tags cafe-tables
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param capacity query int true "Minimum capacity" example:"4"
// @Param limit query int false "Limit" default(10) example:"10"
// @Param offset query int false "Offset" default(0) example:"0"
// @Success 200 {array} model.CafeTableResponse
// @Failure 400 {object} model.ErrorResponse
// @Router /api/v1/cafe-tables/available/capacity [get]
func (h *Handler) GetAvailableTablesByCapacity(c echo.Context) error {
	capacityStr := c.QueryParam("capacity")
	if capacityStr == "" {
		return c.JSON(http.StatusBadRequest, model.ErrorResponse{Message: "Capacity is required"})
	}

	capacity := int32(0)
	if val, err := strconv.Atoi(capacityStr); err == nil {
		capacity = int32(val)
	} else {
		return c.JSON(http.StatusBadRequest, model.ErrorResponse{Message: "Invalid capacity"})
	}

	limit := int32(10)
	if l := c.QueryParam("limit"); l != "" {
		if val, err := strconv.Atoi(l); err == nil {
			limit = int32(val)
		}
	}

	offset := int32(0)
	if o := c.QueryParam("offset"); o != "" {
		if val, err := strconv.Atoi(o); err == nil {
			offset = int32(val)
		}
	}

	tables, err := h.service.CafeTable().GetAvailableTablesByCapacity(c.Request().Context(), capacity, limit, offset)
	if err != nil {
		return c.JSON(http.StatusBadRequest, model.ErrorResponse{Message: err.Error()})
	}

	return c.JSON(http.StatusOK, tables)
}

// GetAvailableTablesByHallAndCapacity
// @Summary Get available tables by hall and capacity
// @Description Get available tables in a specific hall that can accommodate a minimum number of guests
// @Tags cafe-tables
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param hall_id path string true "Hall ID" example:"a1b2c3d4-e5f6-4a5b-8c9d-e0f1a2b3c4d5"
// @Param capacity query int true "Minimum capacity" example:"4"
// @Success 200 {array} model.CafeTableResponse
// @Failure 400 {object} model.ErrorResponse
// @Router /api/v1/cafe-tables/available/hall/{hall_id}/capacity [get]
func (h *Handler) GetAvailableTablesByHallAndCapacity(c echo.Context) error {
	hallID := c.Param("hall_id")
	if hallID == "" {
		return c.JSON(http.StatusBadRequest, model.ErrorResponse{Message: "Hall ID is required"})
	}

	capacityStr := c.QueryParam("capacity")
	if capacityStr == "" {
		return c.JSON(http.StatusBadRequest, model.ErrorResponse{Message: "Capacity is required"})
	}

	capacity := int32(0)
	if val, err := strconv.Atoi(capacityStr); err == nil {
		capacity = int32(val)
	} else {
		return c.JSON(http.StatusBadRequest, model.ErrorResponse{Message: "Invalid capacity"})
	}

	tables, err := h.service.CafeTable().GetAvailableTablesByHallAndCapacity(c.Request().Context(), hallID, capacity)
	if err != nil {
		return c.JSON(http.StatusBadRequest, model.ErrorResponse{Message: err.Error()})
	}

	return c.JSON(http.StatusOK, tables)
}

// SetTableFree
// @Summary Set table as free
// @Description Mark a cafe table as free (available)
// @Tags cafe-tables
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param id path string true "Cafe Table ID" example:"c0f18a64-7f5c-4425-9414-1b01cddee9d9"
// @Success 200 {object} model.CafeTableResponse
// @Failure 400 {object} model.ErrorResponse
// @Failure 401 {object} model.ErrorResponse
// @Router /api/v1/cafe-tables/{id}/set-free [post]
func (h *Handler) SetTableFree(c echo.Context) error {
	tableID := c.Param("id")
	if tableID == "" {
		return c.JSON(http.StatusBadRequest, model.ErrorResponse{Message: "Table ID is required"})
	}

	table, err := h.service.CafeTable().SetTableFree(c.Request().Context(), tableID)
	if err != nil {
		return c.JSON(http.StatusBadRequest, model.ErrorResponse{Message: err.Error()})
	}

	return c.JSON(http.StatusOK, table)
}

// SetTableBusy
// @Summary Set table as busy
// @Description Mark a cafe table as busy (occupied)
// @Tags cafe-tables
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param id path string true "Cafe Table ID" example:"c0f18a64-7f5c-4425-9414-1b01cddee9d9"
// @Success 200 {object} model.CafeTableResponse
// @Failure 400 {object} model.ErrorResponse
// @Failure 401 {object} model.ErrorResponse
// @Router /api/v1/cafe-tables/{id}/set-busy [post]
func (h *Handler) SetTableBusy(c echo.Context) error {
	tableID := c.Param("id")
	if tableID == "" {
		return c.JSON(http.StatusBadRequest, model.ErrorResponse{Message: "Table ID is required"})
	}

	table, err := h.service.CafeTable().SetTableBusy(c.Request().Context(), tableID)
	if err != nil {
		return c.JSON(http.StatusBadRequest, model.ErrorResponse{Message: err.Error()})
	}

	return c.JSON(http.StatusOK, table)
}

// GetTableOccupancyStats
// @Summary Get table occupancy statistics
// @Description Get overall cafe table occupancy statistics
// @Tags cafe-tables
// @Security BearerAuth
// @Accept json
// @Produce json
// @Success 200 {object} model.TableOccupancyStats
// @Failure 400 {object} model.ErrorResponse
// @Router /api/v1/cafe-tables/stats/occupancy [get]
func (h *Handler) GetTableOccupancyStats(c echo.Context) error {
	stats, err := h.service.CafeTable().GetTableOccupancyStats(c.Request().Context())
	if err != nil {
		return c.JSON(http.StatusBadRequest, model.ErrorResponse{Message: err.Error()})
	}

	return c.JSON(http.StatusOK, stats)
}
