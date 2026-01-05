package handler

import (
	"log"
	"net/http"
	"strconv"

	"github.com/labstack/echo/v4"
	"gitlab.yurtal.tech/company/maryai/back/internal/model"
)

// CreateCategory creates a new category
// @Summary Create a new category
// @Description Create a new category with name and optional relationships (department, storage, parent)
// @Tags categories
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param input body model.CreateCategoryRequest true "Category creation data"
// @Success 201 {object} model.CategoryResponse "Category created successfully"
// @Failure 400 {object} model.ErrorResponse "Invalid request data"
// @Failure 401 {object} model.ErrorResponse "Unauthorized"
// @Failure 500 {object} model.ErrorResponse "Internal server error"
// @Router /api/v1/categories [post]
func (h *Handler) CreateCategory(c echo.Context) error {
	var req model.CreateCategoryRequest
	if err := c.Bind(&req); err != nil {
		log.Printf("Failed to bind create category request: %v", err)
		return c.JSON(http.StatusBadRequest, model.ErrorResponse{Message: "invalid request format"})
	}

	if req.Name == "" {
		return c.JSON(http.StatusBadRequest, model.ErrorResponse{Message: "name is required"})
	}

	category, err := h.service.Category().CreateCategory(c.Request().Context(), req.Name, req.NameI18n, req.DepartmentID, req.StorageID, req.Parent, req.PictureUrl, req.ColorCode)
	if err != nil {
		log.Printf("CreateCategory failed: %v", err)
		return c.JSON(http.StatusInternalServerError, model.ErrorResponse{Message: "failed to create category"})
	}

	return c.JSON(http.StatusCreated, category)
}

// GetCategoryByID retrieves a category by ID
// @Summary Get a category by ID
// @Description Retrieve a specific category by its ID
// @Tags categories
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "Category ID"
// @Success 200 {object} model.CategoryResponse "Category found"
// @Failure 400 {object} model.ErrorResponse "Invalid ID format"
// @Failure 401 {object} model.ErrorResponse "Unauthorized"
// @Failure 404 {object} model.ErrorResponse "Category not found"
// @Failure 500 {object} model.ErrorResponse "Internal server error"
// @Router /api/v1/categories/{id} [get]
func (h *Handler) GetCategoryByID(c echo.Context) error {
	categoryID := c.Param("id")
	if categoryID == "" {
		return c.JSON(http.StatusBadRequest, model.ErrorResponse{Message: "category id is required"})
	}

	category, err := h.service.Category().GetCategoryByID(c.Request().Context(), categoryID)
	if err != nil {
		log.Printf("GetCategoryByID failed for ID %s: %v", categoryID, err)
		return c.JSON(http.StatusNotFound, model.ErrorResponse{Message: "category not found"})
	}

	return c.JSON(http.StatusOK, category)
}

// GetAllCategories retrieves all categories
// @Summary Get all categories
// @Description Retrieve all categories with pagination
// @Tags categories
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param limit query int false "Limit (default: 20)"
// @Param offset query int false "Offset (default: 0)"
// @Success 200 {array} model.CategoryResponse "Categories found"
// @Failure 401 {object} model.ErrorResponse "Unauthorized"
// @Failure 500 {object} model.ErrorResponse "Internal server error"
// @Router /api/v1/categories [get]
func (h *Handler) GetAllCategories(c echo.Context) error {
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

	categories, err := h.service.Category().GetAllCategories(c.Request().Context(), limit, offset)
	if err != nil {
		log.Printf("GetAllCategories failed: %v", err)
		return c.JSON(http.StatusInternalServerError, model.ErrorResponse{Message: "failed to retrieve categories"})
	}

	return c.JSON(http.StatusOK, categories)
}

// GetCategoriesByDepartmentID retrieves categories by department ID
// @Summary Get categories by department
// @Description Retrieve all categories for a specific department
// @Tags categories
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param departmentId path string true "Department ID"
// @Param limit query int false "Limit (default: 20)"
// @Param offset query int false "Offset (default: 0)"
// @Success 200 {array} model.CategoryResponse "Categories found"
// @Failure 400 {object} model.ErrorResponse "Invalid ID format"
// @Failure 401 {object} model.ErrorResponse "Unauthorized"
// @Failure 500 {object} model.ErrorResponse "Internal server error"
// @Router /api/v1/categories/department/{departmentId} [get]
func (h *Handler) GetCategoriesByDepartmentID(c echo.Context) error {
	departmentID := c.Param("departmentId")
	if departmentID == "" {
		return c.JSON(http.StatusBadRequest, model.ErrorResponse{Message: "department id is required"})
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

	categories, err := h.service.Category().GetCategoriesByDepartmentID(c.Request().Context(), departmentID, limit, offset)
	if err != nil {
		log.Printf("GetCategoriesByDepartmentID failed: %v", err)
		return c.JSON(http.StatusInternalServerError, model.ErrorResponse{Message: "failed to retrieve categories"})
	}

	return c.JSON(http.StatusOK, categories)
}

// GetCategoriesByStorageID retrieves categories by storage ID
// @Summary Get categories by storage
// @Description Retrieve all categories for a specific storage
// @Tags categories
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param storageId path string true "Storage ID"
// @Param limit query int false "Limit (default: 20)"
// @Param offset query int false "Offset (default: 0)"
// @Success 200 {array} model.CategoryResponse "Categories found"
// @Failure 400 {object} model.ErrorResponse "Invalid ID format"
// @Failure 401 {object} model.ErrorResponse "Unauthorized"
// @Failure 500 {object} model.ErrorResponse "Internal server error"
// @Router /api/v1/categories/storage/{storageId} [get]
func (h *Handler) GetCategoriesByStorageID(c echo.Context) error {
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

	categories, err := h.service.Category().GetCategoriesByStorageID(c.Request().Context(), storageID, limit, offset)
	if err != nil {
		log.Printf("GetCategoriesByStorageID failed: %v", err)
		return c.JSON(http.StatusInternalServerError, model.ErrorResponse{Message: "failed to retrieve categories"})
	}

	return c.JSON(http.StatusOK, categories)
}

// GetCategoriesByParentID retrieves subcategories by parent ID
// @Summary Get subcategories by parent
// @Description Retrieve all subcategories for a specific parent category
// @Tags categories
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param parentId path string true "Parent Category ID"
// @Param limit query int false "Limit (default: 20)"
// @Param offset query int false "Offset (default: 0)"
// @Success 200 {array} model.CategoryResponse "Subcategories found"
// @Failure 400 {object} model.ErrorResponse "Invalid ID format"
// @Failure 401 {object} model.ErrorResponse "Unauthorized"
// @Failure 500 {object} model.ErrorResponse "Internal server error"
// @Router /api/v1/categories/parent/{parentId} [get]
func (h *Handler) GetCategoriesByParentID(c echo.Context) error {
	parentID := c.Param("parentId")
	if parentID == "" {
		return c.JSON(http.StatusBadRequest, model.ErrorResponse{Message: "parent id is required"})
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

	categories, err := h.service.Category().GetCategoriesByParentID(c.Request().Context(), parentID, limit, offset)
	if err != nil {
		log.Printf("GetCategoriesByParentID failed: %v", err)
		return c.JSON(http.StatusInternalServerError, model.ErrorResponse{Message: "failed to retrieve subcategories"})
	}

	return c.JSON(http.StatusOK, categories)
}

// GetRootCategories retrieves root categories (no parent)
// @Summary Get root categories
// @Description Retrieve all root categories (categories without parent)
// @Tags categories
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param limit query int false "Limit (default: 20)"
// @Param offset query int false "Offset (default: 0)"
// @Success 200 {array} model.CategoryResponse "Root categories found"
// @Failure 401 {object} model.ErrorResponse "Unauthorized"
// @Failure 500 {object} model.ErrorResponse "Internal server error"
// @Router /api/v1/categories/root [get]
func (h *Handler) GetRootCategories(c echo.Context) error {
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

	categories, err := h.service.Category().GetRootCategories(c.Request().Context(), limit, offset)
	if err != nil {
		log.Printf("GetRootCategories failed: %v", err)
		return c.JSON(http.StatusInternalServerError, model.ErrorResponse{Message: "failed to retrieve root categories"})
	}

	return c.JSON(http.StatusOK, categories)
}

// UpdateCategory updates a category
// @Summary Update a category
// @Description Update an existing category
// @Tags categories
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "Category ID"
// @Param input body model.UpdateCategoryRequest true "Category update data"
// @Success 200 {object} model.CategoryResponse "Category updated successfully"
// @Failure 400 {object} model.ErrorResponse "Invalid request data"
// @Failure 401 {object} model.ErrorResponse "Unauthorized"
// @Failure 404 {object} model.ErrorResponse "Category not found"
// @Failure 500 {object} model.ErrorResponse "Internal server error"
// @Router /api/v1/categories/{id} [put]
func (h *Handler) UpdateCategory(c echo.Context) error {
	categoryID := c.Param("id")
	if categoryID == "" {
		return c.JSON(http.StatusBadRequest, model.ErrorResponse{Message: "category id is required"})
	}

	var req model.UpdateCategoryRequest
	if err := c.Bind(&req); err != nil {
		log.Printf("Failed to bind update category request: %v", err)
		return c.JSON(http.StatusBadRequest, model.ErrorResponse{Message: "invalid request format"})
	}

	category, err := h.service.Category().UpdateCategory(c.Request().Context(), categoryID, req.Name, req.NameI18n, req.DepartmentID, req.StorageID, req.Parent, req.PictureUrl, req.ColorCode)
	if err != nil {
		log.Printf("UpdateCategory failed for ID %s: %v", categoryID, err)
		return c.JSON(http.StatusInternalServerError, model.ErrorResponse{Message: "failed to update category"})
	}

	return c.JSON(http.StatusOK, category)
}

// DeleteCategory soft deletes a category
// @Summary Delete a category
// @Description Soft delete a category by ID
// @Tags categories
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "Category ID"
// @Success 204 "Category deleted successfully"
// @Failure 400 {object} model.ErrorResponse "Invalid ID format"
// @Failure 401 {object} model.ErrorResponse "Unauthorized"
// @Failure 404 {object} model.ErrorResponse "Category not found"
// @Failure 500 {object} model.ErrorResponse "Internal server error"
// @Router /api/v1/categories/{id} [delete]
func (h *Handler) DeleteCategory(c echo.Context) error {
	categoryID := c.Param("id")
	if categoryID == "" {
		return c.JSON(http.StatusBadRequest, model.ErrorResponse{Message: "category id is required"})
	}

	if err := h.service.Category().DeleteCategory(c.Request().Context(), categoryID); err != nil {
		log.Printf("DeleteCategory failed for ID %s: %v", categoryID, err)
		return c.JSON(http.StatusInternalServerError, model.ErrorResponse{Message: "failed to delete category"})
	}

	return c.NoContent(http.StatusNoContent)
}

// RestoreCategory restores a soft-deleted category
// @Summary Restore a category
// @Description Restore a soft-deleted category by ID
// @Tags categories
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "Category ID"
// @Success 200 {object} model.CategoryResponse "Category restored successfully"
// @Failure 400 {object} model.ErrorResponse "Invalid ID format"
// @Failure 401 {object} model.ErrorResponse "Unauthorized"
// @Failure 404 {object} model.ErrorResponse "Category not found"
// @Failure 500 {object} model.ErrorResponse "Internal server error"
// @Router /api/v1/categories/{id}/restore [post]
func (h *Handler) RestoreCategory(c echo.Context) error {
	categoryID := c.Param("id")
	if categoryID == "" {
		return c.JSON(http.StatusBadRequest, model.ErrorResponse{Message: "category id is required"})
	}

	category, err := h.service.Category().RestoreCategory(c.Request().Context(), categoryID)
	if err != nil {
		log.Printf("RestoreCategory failed for ID %s: %v", categoryID, err)
		return c.JSON(http.StatusInternalServerError, model.ErrorResponse{Message: "failed to restore category"})
	}

	return c.JSON(http.StatusOK, category)
}

// SearchCategories searches for categories by name
// @Summary Search categories
// @Description Search for categories by name with pagination
// @Tags categories
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param q query string true "Search query"
// @Param limit query int false "Limit (default: 20)"
// @Param offset query int false "Offset (default: 0)"
// @Success 200 {array} model.CategoryResponse "Categories found"
// @Failure 400 {object} model.ErrorResponse "Invalid request data"
// @Failure 401 {object} model.ErrorResponse "Unauthorized"
// @Failure 500 {object} model.ErrorResponse "Internal server error"
// @Router /api/v1/categories/search [get]
func (h *Handler) SearchCategories(c echo.Context) error {
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

	categories, err := h.service.Category().SearchCategories(c.Request().Context(), query, limit, offset)
	if err != nil {
		log.Printf("SearchCategories failed for query %s: %v", query, err)
		return c.JSON(http.StatusInternalServerError, model.ErrorResponse{Message: "failed to search categories"})
	}

	return c.JSON(http.StatusOK, categories)
}
