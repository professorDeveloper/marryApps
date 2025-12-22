package handler

import (
	"log"
	"net/http"
	"strconv"

	"github.com/labstack/echo/v4"
	"gitlab.yurtal.tech/company/maryai/back/internal/model"
)

// CreateHall creates a new hall
// @Summary Create a new hall
// @Description Create a new hall with name, branch ID, and optional translation ID
// @Tags halls
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param input body model.CreateHallRequest true "Hall creation data"
// @Success 201 {object} model.HallResponse "Hall created successfully"
// @Failure 400 {object} model.ErrorResponse "Invalid request data"
// @Failure 401 {object} model.ErrorResponse "Unauthorized"
// @Failure 500 {object} model.ErrorResponse "Internal server error"
// @Router /api/v1/halls [post]
func (h *Handler) CreateHall(c echo.Context) error {
	var req model.CreateHallRequest
	if err := c.Bind(&req); err != nil {
		log.Printf("Failed to bind create hall request: %v", err)
		return c.JSON(http.StatusBadRequest, model.ErrorResponse{Message: "invalid request format"})
	}

	if req.Name == nil || *req.Name == "" {
		return c.JSON(http.StatusBadRequest, model.ErrorResponse{Message: "name is required"})
	}
	if req.BranchID == "" {
		return c.JSON(http.StatusBadRequest, model.ErrorResponse{Message: "branch_id is required"})
	}

	hall, err := h.service.Hall().CreateHall(c.Request().Context(), *req.Name, req.BranchID, nil)
	if err != nil {
		log.Printf("CreateHall failed: %v", err)
		return c.JSON(http.StatusInternalServerError, model.ErrorResponse{Message: "failed to create hall"})
	}

	return c.JSON(http.StatusCreated, hall)
}

// GetHallByID retrieves a hall by ID
// @Summary Get a hall by ID
// @Description Retrieve a specific hall by its ID
// @Tags halls
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "Hall ID"
// @Success 200 {object} model.HallResponse "Hall found"
// @Failure 400 {object} model.ErrorResponse "Invalid ID format"
// @Failure 401 {object} model.ErrorResponse "Unauthorized"
// @Failure 404 {object} model.ErrorResponse "Hall not found"
// @Failure 500 {object} model.ErrorResponse "Internal server error"
// @Router /api/v1/halls/{id} [get]
func (h *Handler) GetHallByID(c echo.Context) error {
	hallID := c.Param("id")
	if hallID == "" {
		return c.JSON(http.StatusBadRequest, model.ErrorResponse{Message: "hall id is required"})
	}

	hall, err := h.service.Hall().GetHallByID(c.Request().Context(), hallID)
	if err != nil {
		log.Printf("GetHallByID failed for ID %s: %v", hallID, err)
		return c.JSON(http.StatusNotFound, model.ErrorResponse{Message: "hall not found"})
	}

	return c.JSON(http.StatusOK, hall)
}

// GetAllHalls retrieves all halls
// @Summary Get all halls
// @Description Retrieve all halls with pagination
// @Tags halls
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param limit query int false "Limit (default: 20)"
// @Param offset query int false "Offset (default: 0)"
// @Success 200 {array} model.HallResponse "Halls found"
// @Failure 401 {object} model.ErrorResponse "Unauthorized"
// @Failure 500 {object} model.ErrorResponse "Internal server error"
// @Router /api/v1/halls [get]
func (h *Handler) GetAllHalls(c echo.Context) error {
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

	halls, err := h.service.Hall().GetAllHalls(c.Request().Context(), limit, offset)
	if err != nil {
		log.Printf("GetAllHalls failed: %v", err)
		return c.JSON(http.StatusInternalServerError, model.ErrorResponse{Message: "failed to retrieve halls"})
	}

	return c.JSON(http.StatusOK, halls)
}

// GetHallsByBranchID retrieves halls by branch ID
// @Summary Get halls by branch ID
// @Description Retrieve all halls for a specific branch
// @Tags halls
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param branchId path string true "Branch ID"
// @Param limit query int false "Limit (default: 20)"
// @Param offset query int false "Offset (default: 0)"
// @Success 200 {array} model.HallResponse "Halls found"
// @Failure 400 {object} model.ErrorResponse "Invalid ID format"
// @Failure 401 {object} model.ErrorResponse "Unauthorized"
// @Failure 500 {object} model.ErrorResponse "Internal server error"
// @Router /api/v1/halls/branch/{branchId} [get]
func (h *Handler) GetHallsByBranchID(c echo.Context) error {
	branchID := c.Param("branchId")
	if branchID == "" {
		return c.JSON(http.StatusBadRequest, model.ErrorResponse{Message: "branch id is required"})
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

	halls, err := h.service.Hall().GetHallsByBranchID(c.Request().Context(), branchID, limit, offset)
	if err != nil {
		log.Printf("GetHallsByBranchID failed for branch ID %s: %v", branchID, err)
		return c.JSON(http.StatusInternalServerError, model.ErrorResponse{Message: "failed to retrieve halls for branch"})
	}

	return c.JSON(http.StatusOK, halls)
}

// UpdateHall updates a hall
// @Summary Update a hall
// @Description Update an existing hall
// @Tags halls
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "Hall ID"
// @Param input body model.UpdateHallRequest true "Hall update data"
// @Success 200 {object} model.HallResponse "Hall updated successfully"
// @Failure 400 {object} model.ErrorResponse "Invalid request data"
// @Failure 401 {object} model.ErrorResponse "Unauthorized"
// @Failure 404 {object} model.ErrorResponse "Hall not found"
// @Failure 500 {object} model.ErrorResponse "Internal server error"
// @Router /api/v1/halls/{id} [put]
func (h *Handler) UpdateHall(c echo.Context) error {
	hallID := c.Param("id")
	if hallID == "" {
		return c.JSON(http.StatusBadRequest, model.ErrorResponse{Message: "hall id is required"})
	}

	var req model.UpdateHallRequest
	if err := c.Bind(&req); err != nil {
		log.Printf("Failed to bind update hall request: %v", err)
		return c.JSON(http.StatusBadRequest, model.ErrorResponse{Message: "invalid request format"})
	}

	hall, err := h.service.Hall().UpdateHall(c.Request().Context(), hallID, req.Name, req.BranchID, req.NameI18n)
	if err != nil {
		log.Printf("UpdateHall failed for ID %s: %v", hallID, err)
		return c.JSON(http.StatusInternalServerError, model.ErrorResponse{Message: "failed to update hall"})
	}

	return c.JSON(http.StatusOK, hall)
}

// DeleteHall soft deletes a hall
// @Summary Delete a hall
// @Description Soft delete a hall by ID
// @Tags halls
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "Hall ID"
// @Success 204 "Hall deleted successfully"
// @Failure 400 {object} model.ErrorResponse "Invalid ID format"
// @Failure 401 {object} model.ErrorResponse "Unauthorized"
// @Failure 404 {object} model.ErrorResponse "Hall not found"
// @Failure 500 {object} model.ErrorResponse "Internal server error"
// @Router /api/v1/halls/{id} [delete]
func (h *Handler) DeleteHall(c echo.Context) error {
	hallID := c.Param("id")
	if hallID == "" {
		return c.JSON(http.StatusBadRequest, model.ErrorResponse{Message: "hall id is required"})
	}

	if err := h.service.Hall().DeleteHall(c.Request().Context(), hallID); err != nil {
		log.Printf("DeleteHall failed for ID %s: %v", hallID, err)
		return c.JSON(http.StatusInternalServerError, model.ErrorResponse{Message: "failed to delete hall"})
	}

	return c.NoContent(http.StatusNoContent)
}

// RestoreHall restores a soft-deleted hall
// @Summary Restore a hall
// @Description Restore a soft-deleted hall by ID
// @Tags halls
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "Hall ID"
// @Success 200 {object} model.HallResponse "Hall restored successfully"
// @Failure 400 {object} model.ErrorResponse "Invalid ID format"
// @Failure 401 {object} model.ErrorResponse "Unauthorized"
// @Failure 404 {object} model.ErrorResponse "Hall not found"
// @Failure 500 {object} model.ErrorResponse "Internal server error"
// @Router /api/v1/halls/{id}/restore [post]
func (h *Handler) RestoreHall(c echo.Context) error {
	hallID := c.Param("id")
	if hallID == "" {
		return c.JSON(http.StatusBadRequest, model.ErrorResponse{Message: "hall id is required"})
	}

	hall, err := h.service.Hall().RestoreHall(c.Request().Context(), hallID)
	if err != nil {
		log.Printf("RestoreHall failed for ID %s: %v", hallID, err)
		return c.JSON(http.StatusInternalServerError, model.ErrorResponse{Message: "failed to restore hall"})
	}

	return c.JSON(http.StatusOK, hall)
}

// SearchHalls searches for halls by name
// @Summary Search halls
// @Description Search for halls by name with pagination
// @Tags halls
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param q query string true "Search query"
// @Param limit query int false "Limit (default: 20)"
// @Param offset query int false "Offset (default: 0)"
// @Success 200 {array} model.HallResponse "Halls found"
// @Failure 400 {object} model.ErrorResponse "Invalid request data"
// @Failure 401 {object} model.ErrorResponse "Unauthorized"
// @Failure 500 {object} model.ErrorResponse "Internal server error"
// @Router /api/v1/halls/search [get]
func (h *Handler) SearchHalls(c echo.Context) error {
	query := c.QueryParam("q")
	if query == "" {
		return c.JSON(http.StatusBadRequest, model.ErrorResponse{Message: "search query is required"})
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

	halls, err := h.service.Hall().SearchHalls(c.Request().Context(), query, limit, offset)
	if err != nil {
		log.Printf("SearchHalls failed for query %s: %v", query, err)
		return c.JSON(http.StatusInternalServerError, model.ErrorResponse{Message: "failed to search halls"})
	}

	return c.JSON(http.StatusOK, halls)
}
