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
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"invalid request format",
			err.Error(),
			http.StatusBadRequest,
		))
	}

	if req.Name == nil || *req.Name == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"name is required",
			"missing required field: name",
			http.StatusBadRequest,
		))
	}

	department, err := h.service.Department().CreateDepartment(c.Request().Context(), *req.Name, req.NameI18n, req.ColorCode, req.PictureUrl, &req.StorageID)
	if err != nil {
		log.Printf("CreateDepartment failed: %v", err)
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse(
			"failed to create department",
			err.Error(),
			http.StatusInternalServerError,
		))
	}

	return c.JSON(http.StatusCreated, model.NewSuccessResponse("Department created successfully", department, http.StatusCreated))
}

// GetDepartmentByID retrieves a department by ID
// @Summary Get a department by ID
// @Description Retrieve a specific department by its ID
// @Tags departments
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "Department ID"
// @Param expand query string false "Expand FK relations (comma-separated: storage_id, name_i18n)"
// @Success 200 {object} model.DepartmentResponse "Department found"
// @Failure 400 {object} model.ErrorResponse "Invalid ID format"
// @Failure 401 {object} model.ErrorResponse "Unauthorized"
// @Failure 404 {object} model.ErrorResponse "Department not found"
// @Failure 500 {object} model.ErrorResponse "Internal server error"
// @Router /api/v1/departments/{id} [get]
func (h *Handler) GetDepartmentByID(c echo.Context) error {
	departmentID := c.Param("id")
	if departmentID == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"department id is required",
			"missing path parameter: id",
			http.StatusBadRequest,
		))
	}

	department, err := h.service.Department().GetDepartmentByID(c.Request().Context(), departmentID)
	if err != nil {
		log.Printf("GetDepartmentByID failed for ID %s: %v", departmentID, err)
		return c.JSON(http.StatusNotFound, model.NewErrorResponse(
			"department not found",
			err.Error(),
			http.StatusNotFound,
		))
	}

	if m, expanded, err := h.expandSingleResponse(c, department, "departments"); expanded {
		if err != nil {
			return err
		}
		return c.JSON(http.StatusOK, model.NewSuccessResponse("Department retrieved successfully", m, http.StatusOK))
	}
	return c.JSON(http.StatusOK, model.NewSuccessResponse("Department retrieved successfully", department, http.StatusOK))
}

// GetAllDepartments retrieves all departments
// @Summary Get all departments
// @Description Retrieve all departments with pagination, optional search, storage filter and sorting
// @Tags departments
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param search query string false "Search by department name"
// @Param storage_id query string false "Filter by storage ID"
// @Param sort_by query string false "Sort by field" Enums(name,created_at) default(created_at)
// @Param sort_order query string false "Sort order" Enums(asc,desc) default(desc)
// @Param limit query int false "Limit (default: 20)"
// @Param offset query int false "Offset (default: 0)"
// @Param expand query string false "Expand related fields"
// @Success 200 {object} model.PaginatedDepartmentsResponse
// @Failure 400 {object} model.ErrorResponse
// @Failure 401 {object} model.ErrorResponse
// @Failure 500 {object} model.ErrorResponse
// @Router /api/v1/departments [get]
func (h *Handler) GetAllDepartments(c echo.Context) error {
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

	filter := model.DepartmentListFilter{
		Search:    strings.TrimSpace(c.QueryParam("search")),
		StorageID: strings.TrimSpace(c.QueryParam("storage_id")),
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

	if filter.StorageID != "" {
		if _, err := uuid.Parse(filter.StorageID); err != nil {
			return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
				"Invalid storage_id",
				"storage_id must be a valid UUID",
				http.StatusBadRequest,
			))
		}
	}

	resp, total, err := h.service.Department().GetAllDepartments(c.Request().Context(), filter, limit, offset)
	if err != nil {
		log.Printf("GetAllDepartments failed: %v", err)
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse(
			"Operation failed",
			err.Error(),
			http.StatusInternalServerError,
		))
	}

	if maps, expanded, err := h.expandListResponse(c, resp, "departments"); expanded {
		if err != nil {
			return c.JSON(http.StatusInternalServerError, model.NewErrorResponse(
				"expand failed",
				err.Error(),
				http.StatusInternalServerError,
			))
		}
		return c.JSON(http.StatusOK, model.NewPaginatedResponse(
			"Departments retrieved successfully",
			maps,
			int32(total),
			limit,
			offset,
			http.StatusOK,
		))
	}

	return c.JSON(http.StatusOK, model.NewPaginatedResponse(
		"Departments retrieved successfully",
		resp,
		int32(total),
		limit,
		offset,
		http.StatusOK,
	))
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
// @Param expand query string false "Expand FK relations (comma-separated: storage_id, name_i18n)"
// @Success 200 {array} model.DepartmentResponse "Departments found"
// @Failure 400 {object} model.ErrorResponse "Invalid ID format"
// @Failure 401 {object} model.ErrorResponse "Unauthorized"
// @Failure 500 {object} model.ErrorResponse "Internal server error"
// @Router /api/v1/departments/storage/{storageId} [get]
func (h *Handler) GetDepartmentsByStorageID(c echo.Context) error {
	storageID := c.Param("storageId")
	if storageID == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"storage id is required",
			"missing path parameter: storageId",
			http.StatusBadRequest,
		))
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

	departments, total, err := h.service.Department().GetDepartmentsByStorageID(c.Request().Context(), storageID, limit, offset)
	if err != nil {
		log.Printf("GetDepartmentsByStorageID failed for storage ID %s: %v", storageID, err)
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse(
			"failed to retrieve departments for storage",
			err.Error(),
			http.StatusInternalServerError,
		))
	}

	if maps, expanded, err := h.expandListResponse(c, departments, "departments"); expanded {
		if err != nil {
			return err
		}
		return c.JSON(http.StatusOK, model.NewPaginatedResponse("Data retrieved successfully", maps, total, limit, offset, http.StatusOK))
	}
	return c.JSON(http.StatusOK, model.NewPaginatedResponse("Data retrieved successfully", departments, total, limit, offset, http.StatusOK))
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
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"department id is required",
			"missing path parameter: id",
			http.StatusBadRequest,
		))
	}

	var req model.UpdateDepartmentRequest
	if err := c.Bind(&req); err != nil {
		log.Printf("Failed to bind update department request: %v", err)
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"invalid request format",
			err.Error(),
			http.StatusBadRequest,
		))
	}

	department, err := h.service.Department().UpdateDepartment(c.Request().Context(), departmentID, req.Name, req.NameI18n, req.ColorCode, req.PictureUrl, req.StorageID, req.Uz, req.Ru, req.En)
	if err != nil {
		log.Printf("UpdateDepartment failed for ID %s: %v", departmentID, err)
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse(
			"failed to update department",
			err.Error(),
			http.StatusInternalServerError,
		))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse("Department updated successfully", department, http.StatusOK))
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
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"department id is required",
			"missing path parameter: id",
			http.StatusBadRequest,
		))
	}

	if err := h.service.Department().DeleteDepartment(c.Request().Context(), departmentID); err != nil {
		log.Printf("DeleteDepartment failed for ID %s: %v", departmentID, err)
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse(
			"failed to delete department",
			err.Error(),
			http.StatusInternalServerError,
		))
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
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"department id is required",
			"missing path parameter: id",
			http.StatusBadRequest,
		))
	}

	department, err := h.service.Department().RestoreDepartment(c.Request().Context(), departmentID)
	if err != nil {
		log.Printf("RestoreDepartment failed for ID %s: %v", departmentID, err)
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse(
			"failed to restore department",
			err.Error(),
			http.StatusInternalServerError,
		))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse("Department restored successfully", department, http.StatusOK))
}

// GetDepartmentByIDWithLang retrieves a department by ID with language support
// @Summary Get department by ID with language support
// @Description Retrieve a specific department by its ID with names translated to specified language
// @Tags departments
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "Department ID"
// @Param lang query string false "Language code (uz, ru, en - default: uz)"
// @Param expand query string false "Expand FK relations (comma-separated: storage_id, name_i18n)"
// @Success 200 {object} model.DepartmentResponse "Department details"
// @Failure 400 {object} model.ErrorResponse "Invalid request parameters"
// @Failure 401 {object} model.ErrorResponse "Unauthorized"
// @Failure 404 {object} model.ErrorResponse "Department not found"
// @Failure 500 {object} model.ErrorResponse "Internal server error"
// @Router /api/v1/departments-lang/{id} [get]
func (h *Handler) GetDepartmentByIDWithLang(c echo.Context) error {
	departmentID := c.Param("id")
	if departmentID == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"department id is required",
			"missing path parameter: id",
			http.StatusBadRequest,
		))
	}

	lang := c.QueryParam("lang")
	if lang == "" {
		lang = "uz"
	}

	validLangs := map[string]bool{"uz": true, "ru": true, "en": true}
	if !validLangs[lang] {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"invalid language code",
			"valid values: uz, ru, en",
			http.StatusBadRequest,
		))
	}

	department, err := h.service.Department().GetDepartmentByIDWithLang(c.Request().Context(), departmentID, lang)
	if err != nil {
		log.Printf("GetDepartmentByIDWithLang failed for id %s: %v", departmentID, err)
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse(
			"failed to get department",
			err.Error(),
			http.StatusInternalServerError,
		))
	}

	if m, expanded, err := h.expandSingleResponse(c, department, "departments"); expanded {
		if err != nil {
			return err
		}
		return c.JSON(http.StatusOK, model.NewSuccessResponse("Department retrieved successfully", m, http.StatusOK))
	}
	return c.JSON(http.StatusOK, model.NewSuccessResponse("Department retrieved successfully", department, http.StatusOK))
}

// GetAllDepartmentsWithLang retrieves all departments with language support
// @Summary Get all departments with language support
// @Description Retrieve all departments with names translated to specified language
// @Tags departments
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param lang query string false "Language code (uz, ru, en - default: uz)"
// @Param limit query int false "Limit (default: 20)"
// @Param offset query int false "Offset (default: 0)"
// @Param expand query string false "Expand FK relations (comma-separated: storage_id, name_i18n)"
// @Success 200 {array} model.DepartmentResponse "Departments retrieved successfully"
// @Failure 400 {object} model.ErrorResponse "Invalid request parameters"
// @Failure 401 {object} model.ErrorResponse "Unauthorized"
// @Failure 500 {object} model.ErrorResponse "Internal server error"
// @Router /api/v1/departments-lang [get]
func (h *Handler) GetAllDepartmentsWithLang(c echo.Context) error {
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
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"invalid language code",
			"valid values: uz, ru, en",
			http.StatusBadRequest,
		))
	}

	departments, total, err := h.service.Department().GetAllDepartmentsWithLang(c.Request().Context(), lang, limit, offset)
	if err != nil {
		log.Printf("GetAllDepartmentsWithLang failed: %v", err)
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse(
			"failed to get departments",
			err.Error(),
			http.StatusInternalServerError,
		))
	}

	if maps, expanded, err := h.expandListResponse(c, departments, "departments"); expanded {
		if err != nil {
			return err
		}
		return c.JSON(http.StatusOK, model.NewPaginatedResponse("Departments retrieved successfully", maps, total, limit, offset, http.StatusOK))
	}
	return c.JSON(http.StatusOK, model.NewPaginatedResponse("Departments retrieved successfully", departments, total, limit, offset, http.StatusOK))
}
