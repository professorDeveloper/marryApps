package handler

import (
	"log"
	"net/http"
	"strconv"

	"github.com/labstack/echo/v4"
	"gitlab.yurtal.tech/company/maryai/back/internal/model"
)

// CreateDepartment creates a new department
// @Summary Create a new department
// @Description Create a new department with name, optional translation ID, and storage ID
// @Tags departments
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param input body model.CreateDepartmentRequest true "Department creation data"
// @Success 201 {object} model.DepartmentResponse "Department created successfully"
// @Failure 400 {object} model.ErrorResponse "Invalid request data"
// @Failure 401 {object} model.ErrorResponse "Unauthorized"
// @Failure 500 {object} model.ErrorResponse "Internal server error"
// @Router /api/v1/departments [post]
func (h *Handler) CreateDepartment(c echo.Context) error {
	var req model.CreateDepartmentRequest
	if err := c.Bind(&req); err != nil {
		log.Printf("Failed to bind create department request: %v", err)
		return c.JSON(http.StatusBadRequest, model.ErrorResponse{Message: "invalid request format"})
	}

	if req.Name == nil || *req.Name == "" {
		return c.JSON(http.StatusBadRequest, model.ErrorResponse{Message: "name is required"})
	}

	department, err := h.service.Department().CreateDepartment(c.Request().Context(), *req.Name, req.NameI18n, req.ColorCode, &req.StorageID)
	if err != nil {
		log.Printf("CreateDepartment failed: %v", err)
		return c.JSON(http.StatusInternalServerError, model.ErrorResponse{Message: "failed to create department"})
	}

	return c.JSON(http.StatusCreated, department)
}

// GetDepartmentByID retrieves a department by ID
// @Summary Get a department by ID
// @Description Retrieve a specific department by its ID
// @Tags departments
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "Department ID"
// @Success 200 {object} model.DepartmentResponse "Department found"
// @Failure 400 {object} model.ErrorResponse "Invalid ID format"
// @Failure 401 {object} model.ErrorResponse "Unauthorized"
// @Failure 404 {object} model.ErrorResponse "Department not found"
// @Failure 500 {object} model.ErrorResponse "Internal server error"
// @Router /api/v1/departments/{id} [get]
func (h *Handler) GetDepartmentByID(c echo.Context) error {
	departmentID := c.Param("id")
	if departmentID == "" {
		return c.JSON(http.StatusBadRequest, model.ErrorResponse{Message: "department id is required"})
	}

	department, err := h.service.Department().GetDepartmentByID(c.Request().Context(), departmentID)
	if err != nil {
		log.Printf("GetDepartmentByID failed for ID %s: %v", departmentID, err)
		return c.JSON(http.StatusNotFound, model.ErrorResponse{Message: "department not found"})
	}

	return c.JSON(http.StatusOK, department)
}

// GetAllDepartments retrieves all departments
// @Summary Get all departments
// @Description Retrieve all departments with pagination
// @Tags departments
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param limit query int false "Limit (default: 20)"
// @Param offset query int false "Offset (default: 0)"
// @Success 200 {array} model.DepartmentResponse "Departments found"
// @Failure 401 {object} model.ErrorResponse "Unauthorized"
// @Failure 500 {object} model.ErrorResponse "Internal server error"
// @Router /api/v1/departments [get]
func (h *Handler) GetAllDepartments(c echo.Context) error {
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

	departments, err := h.service.Department().GetAllDepartments(c.Request().Context(), limit, offset)
	if err != nil {
		log.Printf("GetAllDepartments failed: %v", err)
		return c.JSON(http.StatusInternalServerError, model.ErrorResponse{Message: "failed to retrieve departments"})
	}

	return c.JSON(http.StatusOK, departments)
}

// GetDepartmentsByStorageID retrieves departments by storage ID
// @Summary Get departments by storage ID
// @Description Retrieve all departments for a specific storage
// @Tags departments
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param storageId path string true "Storage ID"
// @Param limit query int false "Limit (default: 20)"
// @Param offset query int false "Offset (default: 0)"
// @Success 200 {array} model.DepartmentResponse "Departments found"
// @Failure 400 {object} model.ErrorResponse "Invalid ID format"
// @Failure 401 {object} model.ErrorResponse "Unauthorized"
// @Failure 500 {object} model.ErrorResponse "Internal server error"
// @Router /api/v1/departments/storage/{storageId} [get]
func (h *Handler) GetDepartmentsByStorageID(c echo.Context) error {
	storageID := c.Param("storageId")
	if storageID == "" {
		return c.JSON(http.StatusBadRequest, model.ErrorResponse{Message: "storage id is required"})
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

	departments, err := h.service.Department().GetDepartmentsByStorageID(c.Request().Context(), storageID, limit, offset)
	if err != nil {
		log.Printf("GetDepartmentsByStorageID failed for storage ID %s: %v", storageID, err)
		return c.JSON(http.StatusInternalServerError, model.ErrorResponse{Message: "failed to retrieve departments for storage"})
	}

	return c.JSON(http.StatusOK, departments)
}

// UpdateDepartment updates a department
// @Summary Update a department
// @Description Update an existing department
// @Tags departments
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "Department ID"
// @Param input body model.UpdateDepartmentRequest true "Department update data"
// @Success 200 {object} model.DepartmentResponse "Department updated successfully"
// @Failure 400 {object} model.ErrorResponse "Invalid request data"
// @Failure 401 {object} model.ErrorResponse "Unauthorized"
// @Failure 404 {object} model.ErrorResponse "Department not found"
// @Failure 500 {object} model.ErrorResponse "Internal server error"
// @Router /api/v1/departments/{id} [put]
func (h *Handler) UpdateDepartment(c echo.Context) error {
	departmentID := c.Param("id")
	if departmentID == "" {
		return c.JSON(http.StatusBadRequest, model.ErrorResponse{Message: "department id is required"})
	}

	var req model.UpdateDepartmentRequest
	if err := c.Bind(&req); err != nil {
		log.Printf("Failed to bind update department request: %v", err)
		return c.JSON(http.StatusBadRequest, model.ErrorResponse{Message: "invalid request format"})
	}

	department, err := h.service.Department().UpdateDepartment(c.Request().Context(), departmentID, req.Name, req.NameI18n, req.ColorCode, req.StorageID)
	if err != nil {
		log.Printf("UpdateDepartment failed for ID %s: %v", departmentID, err)
		return c.JSON(http.StatusInternalServerError, model.ErrorResponse{Message: "failed to update department"})
	}

	return c.JSON(http.StatusOK, department)
}

// DeleteDepartment soft deletes a department
// @Summary Delete a department
// @Description Soft delete a department by ID
// @Tags departments
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "Department ID"
// @Success 204 "Department deleted successfully"
// @Failure 400 {object} model.ErrorResponse "Invalid ID format"
// @Failure 401 {object} model.ErrorResponse "Unauthorized"
// @Failure 404 {object} model.ErrorResponse "Department not found"
// @Failure 500 {object} model.ErrorResponse "Internal server error"
// @Router /api/v1/departments/{id} [delete]
func (h *Handler) DeleteDepartment(c echo.Context) error {
	departmentID := c.Param("id")
	if departmentID == "" {
		return c.JSON(http.StatusBadRequest, model.ErrorResponse{Message: "department id is required"})
	}

	if err := h.service.Department().DeleteDepartment(c.Request().Context(), departmentID); err != nil {
		log.Printf("DeleteDepartment failed for ID %s: %v", departmentID, err)
		return c.JSON(http.StatusInternalServerError, model.ErrorResponse{Message: "failed to delete department"})
	}

	return c.NoContent(http.StatusNoContent)
}

// RestoreDepartment restores a soft-deleted department
// @Summary Restore a department
// @Description Restore a soft-deleted department by ID
// @Tags departments
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "Department ID"
// @Success 200 {object} model.DepartmentResponse "Department restored successfully"
// @Failure 400 {object} model.ErrorResponse "Invalid ID format"
// @Failure 401 {object} model.ErrorResponse "Unauthorized"
// @Failure 404 {object} model.ErrorResponse "Department not found"
// @Failure 500 {object} model.ErrorResponse "Internal server error"
// @Router /api/v1/departments/{id}/restore [post]
func (h *Handler) RestoreDepartment(c echo.Context) error {
	departmentID := c.Param("id")
	if departmentID == "" {
		return c.JSON(http.StatusBadRequest, model.ErrorResponse{Message: "department id is required"})
	}

	department, err := h.service.Department().RestoreDepartment(c.Request().Context(), departmentID)
	if err != nil {
		log.Printf("RestoreDepartment failed for ID %s: %v", departmentID, err)
		return c.JSON(http.StatusInternalServerError, model.ErrorResponse{Message: "failed to restore department"})
	}

	return c.JSON(http.StatusOK, department)
}

// SearchDepartments searches for departments by name
// @Summary Search departments
// @Description Search for departments by name with pagination
// @Tags departments
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param q query string true "Search query"
// @Param limit query int false "Limit (default: 20)"
// @Param offset query int false "Offset (default: 0)"
// @Success 200 {array} model.DepartmentResponse "Departments found"
// @Failure 400 {object} model.ErrorResponse "Invalid request data"
// @Failure 401 {object} model.ErrorResponse "Unauthorized"
// @Failure 500 {object} model.ErrorResponse "Internal server error"
// @Router /api/v1/departments/search [get]
func (h *Handler) SearchDepartments(c echo.Context) error {
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

	departments, err := h.service.Department().SearchDepartments(c.Request().Context(), query, limit, offset)
	if err != nil {
		log.Printf("SearchDepartments failed for query %s: %v", query, err)
		return c.JSON(http.StatusInternalServerError, model.ErrorResponse{Message: "failed to search departments"})
	}

	return c.JSON(http.StatusOK, departments)
}
