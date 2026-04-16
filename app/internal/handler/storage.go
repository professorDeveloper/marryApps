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

// CreateStorage creates a new storage
// @Summary Create a new storage
// @Description Create a new storage with name, branch ID, and optional translation ID
// @Tags storages
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param input body model.CreateStorageRequest true "Storage creation data"
// @Success 201 {object} model.StorageResponse "Storage created successfully"
// @Failure 400 {object} model.ErrorResponse "Invalid request data"
// @Failure 401 {object} model.ErrorResponse "Unauthorized"
// @Failure 500 {object} model.ErrorResponse "Internal server error"
// @Router /api/v1/storages [post]
func (h *Handler) CreateStorage(c echo.Context) error {
	var req model.CreateStorageRequest
	if err := c.Bind(&req); err != nil {
		log.Printf("Failed to bind create storage request: %v", err)
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("invalid request format", "see logs for details", http.StatusBadRequest))
	}

	if req.Name == nil || *req.Name == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("name is required", "see logs for details", http.StatusBadRequest))
	}
	var nameI18nUUID *uuid.UUID
	if req.NameI18n != nil && *req.NameI18n != "" {
		id, err := uuid.Parse(*req.NameI18n)
		if err != nil {
			return c.JSON(http.StatusBadRequest, model.NewErrorResponse("invalid name_i18n UUID format", "see logs for details", http.StatusBadRequest))
		}
		nameI18nUUID = &id
	}

	branchID, _ := c.Get("branch_id").(string)
	storage, err := h.service.Storage().CreateStorage(c.Request().Context(), *req.Name, branchID, nameI18nUUID, req.PictureUrl, req.ColorCode)
	if err != nil {
		log.Printf("CreateStorage failed: %v", err)
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("failed to create storage", "see logs for details", http.StatusInternalServerError))
	}

	return c.JSON(http.StatusCreated, model.NewSuccessResponse("Storage created successfully", storage, http.StatusCreated))
}

// GetStorageByID retrieves a storage by ID
// @Summary Get storage by ID
// @Description Retrieve a specific storage by its ID
// @Tags storages
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "Storage ID"
// @Param expand query string false "Comma-separated relations to expand (e.g. name_i18n)"
// @Success 200 {object} model.StorageResponse "Storage details"
// @Failure 400 {object} model.ErrorResponse "Invalid storage ID"
// @Failure 401 {object} model.ErrorResponse "Unauthorized"
// @Failure 404 {object} model.ErrorResponse "Storage not found"
// @Failure 500 {object} model.ErrorResponse "Internal server error"
// @Router /api/v1/storages/{id} [get]
func (h *Handler) GetStorageByID(c echo.Context) error {
	storageID := c.Param("id")
	if storageID == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("storage id is required", "see logs for details", http.StatusBadRequest))
	}

	if _, err := uuid.Parse(storageID); err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("invalid storage id format", "see logs for details", http.StatusBadRequest))
	}

	storage, err := h.service.Storage().GetStorageByID(c.Request().Context(), storageID)
	if err != nil {
		log.Printf("GetStorageByID failed for id %s: %v", storageID, err)
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("failed to fetch storage", "see logs for details", http.StatusInternalServerError))
	}

	if storage == nil {
		return c.JSON(http.StatusNotFound, model.NewErrorResponse("storage not found", "see logs for details", http.StatusNotFound))
	}

	if m, expanded, err := h.expandSingleResponse(c, storage, "storages"); expanded {
		if err != nil {
			return nil
		}
		return c.JSON(http.StatusOK, model.NewSuccessResponse("Storage retrieved successfully", m, http.StatusOK))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse("Storage retrieved successfully", storage, http.StatusOK))
}

// GetAllStorages retrieves all storages
// @Summary Get all storages
// @Description Retrieve all storages with pagination, optional search and sorting
// @Tags storages
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param search query string false "Search by storage name"
// @Param sort_by query string false "Sort by field" Enums(name,created_at) default(created_at)
// @Param sort_order query string false "Sort order" Enums(asc,desc) default(desc)
// @Param limit query int false "Limit (default: 20)"
// @Param offset query int false "Offset (default: 0)"
// @Param expand query string false "Expand related fields"
// @Success 200 {object} model.PaginatedStoragesResponse
// @Failure 400 {object} model.ErrorResponse
// @Failure 401 {object} model.ErrorResponse
// @Failure 500 {object} model.ErrorResponse
// @Router /api/v1/storages [get]
func (h *Handler) GetAllStorages(c echo.Context) error {
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

	filter := model.StorageListFilter{
		Search:    strings.TrimSpace(c.QueryParam("search")),
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

	storages, total, err := h.service.Storage().GetAllStorages(c.Request().Context(), filter, limit, offset)
	if err != nil {
		log.Printf("GetAllStorages failed: %v", err)
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse(
			"Failed to retrieve storages",
			err.Error(),
			http.StatusInternalServerError,
		))
	}

	if maps, expanded, err := h.expandListResponse(c, storages, "storages"); expanded {
		if err != nil {
			return c.JSON(http.StatusInternalServerError, model.NewErrorResponse(
				"expand failed",
				err.Error(),
				http.StatusInternalServerError,
			))
		}
		return c.JSON(http.StatusOK, model.NewPaginatedResponse(
			"Storages retrieved successfully",
			maps,
			int32(total),
			limit,
			offset,
			http.StatusOK,
		))
	}

	return c.JSON(http.StatusOK, model.NewPaginatedResponse(
		"Storages retrieved successfully",
		storages,
		int32(total),
		limit,
		offset,
		http.StatusOK,
	))
}

// GetStoragesByBranchID retrieves storages by branch ID
// @Summary Get storages by branch ID
// @Description Retrieve all storages for a specific branch
// @Tags storages
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param branchId path string true "Branch ID"
// @Param limit query int false "Limit results (default: 20)" default(20)
// @Param offset query int false "Offset for pagination (default: 0)" default(0)
// @Param expand query string false "Comma-separated relations to expand (e.g. name_i18n)"
// @Success 200 {array} model.StorageResponse "List of storages for the branch"
// @Failure 400 {object} model.ErrorResponse "Invalid branch ID"
// @Failure 401 {object} model.ErrorResponse "Unauthorized"
// @Failure 500 {object} model.ErrorResponse "Internal server error"
// @Router /api/v1/storages/branch/{branchId} [get]
func (h *Handler) GetStoragesByBranchID(c echo.Context) error {
	branchID := c.Param("branchId")
	if branchID == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("branch id is required", "see logs for details", http.StatusBadRequest))
	}

	if _, err := uuid.Parse(branchID); err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("invalid branch id format", "see logs for details", http.StatusBadRequest))
	}

	limitStr := c.QueryParam("limit")
	offsetStr := c.QueryParam("offset")

	limit := int32(20)
	offset := int32(0)

	if limitStr != "" {
		if l, err := strconv.ParseInt(limitStr, 10, 32); err == nil && l > 0 {
			limit = int32(l)
		}
	}

	if offsetStr != "" {
		if o, err := strconv.ParseInt(offsetStr, 10, 32); err == nil && o >= 0 {
			offset = int32(o)
		}
	}

	storages, total, err := h.service.Storage().GetStoragesByBranchID(c.Request().Context(), branchID, limit, offset)
	if err != nil {
		log.Printf("GetStoragesByBranchID failed for branch %s: %v", branchID, err)
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("failed to fetch storages by branch", "see logs for details", http.StatusInternalServerError))
	}

	if maps, expanded, err := h.expandListResponse(c, storages, "storages"); expanded {
		if err != nil {
			return err
		}
		return c.JSON(http.StatusOK, model.NewPaginatedResponse("Data retrieved successfully", maps, total, limit, offset, http.StatusOK))
	}

	return c.JSON(http.StatusOK, model.NewPaginatedResponse("Data retrieved successfully", storages, total, limit, offset, http.StatusOK))
}

// UpdateStorage updates a storage
// @Summary Update storage
// @Description Update a storage's information
// @Tags storages
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "Storage ID"
// @Param input body model.UpdateStorageRequest true "Storage update data"
// @Success 200 {object} model.StorageResponse "Storage updated successfully"
// @Failure 400 {object} model.ErrorResponse "Invalid request data"
// @Failure 401 {object} model.ErrorResponse "Unauthorized"
// @Failure 500 {object} model.ErrorResponse "Internal server error"
// @Router /api/v1/storages/{id} [put]
func (h *Handler) UpdateStorage(c echo.Context) error {
	storageID := c.Param("id")
	if storageID == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("storage id is required", "see logs for details", http.StatusBadRequest))
	}

	if _, err := uuid.Parse(storageID); err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("invalid storage id format", "see logs for details", http.StatusBadRequest))
	}

	var req model.UpdateStorageRequest
	if err := c.Bind(&req); err != nil {
		log.Printf("Failed to bind update storage request: %v", err)
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("invalid request format", "see logs for details", http.StatusBadRequest))
	}

	storage, err := h.service.Storage().UpdateStorage(c.Request().Context(), storageID, req.Name, nil, req.NameI18n, req.PictureUrl, req.ColorCode, req.Uz, req.Ru, req.En)
	if err != nil {
		log.Printf("UpdateStorage failed for id %s: %v", storageID, err)
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("failed to update storage", "see logs for details", http.StatusInternalServerError))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse("Storage updated successfully", storage, http.StatusOK))
}

// DeleteStorage deletes a storage
// @Summary Delete storage
// @Description Soft delete a storage (mark as deleted without removing from database)
// @Tags storages
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "Storage ID"
// @Success 200 {object} model.SuccessResponse "Storage deleted successfully"
// @Failure 400 {object} model.ErrorResponse "Invalid storage ID"
// @Failure 401 {object} model.ErrorResponse "Unauthorized"
// @Failure 500 {object} model.ErrorResponse "Internal server error"
// @Router /api/v1/storages/{id} [delete]
func (h *Handler) DeleteStorage(c echo.Context) error {
	storageID := c.Param("id")
	if storageID == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("storage id is required", "see logs for details", http.StatusBadRequest))
	}

	if _, err := uuid.Parse(storageID); err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("invalid storage id format", "see logs for details", http.StatusBadRequest))
	}

	if err := h.service.Storage().DeleteStorage(c.Request().Context(), storageID); err != nil {
		log.Printf("DeleteStorage failed for id %s: %v", storageID, err)
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("failed to delete storage", "see logs for details", http.StatusInternalServerError))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse("Storage deleted successfully", map[string]interface{}{}, http.StatusOK))
}

// RestoreStorage restores a deleted storage
// @Summary Restore storage
// @Description Restore a previously deleted storage
// @Tags storages
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "Storage ID"
// @Success 200 {object} model.SuccessResponse "Storage restored successfully"
// @Failure 400 {object} model.ErrorResponse "Invalid storage ID"
// @Failure 401 {object} model.ErrorResponse "Unauthorized"
// @Failure 500 {object} model.ErrorResponse "Internal server error"
// @Router /api/v1/storages/{id}/restore [post]
func (h *Handler) RestoreStorage(c echo.Context) error {
	storageID := c.Param("id")
	if storageID == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("storage id is required", "see logs for details", http.StatusBadRequest))
	}

	if _, err := uuid.Parse(storageID); err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("invalid storage id format", "see logs for details", http.StatusBadRequest))
	}

	if err := h.service.Storage().RestoreStorage(c.Request().Context(), storageID); err != nil {
		log.Printf("RestoreStorage failed for id %s: %v", storageID, err)
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("failed to restore storage", "see logs for details", http.StatusInternalServerError))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse("Storage restored successfully", map[string]interface{}{}, http.StatusOK))
}

// GetStorageByIDWithLang retrieves a storage by ID with language support
// @Summary Get storage by ID with language support
// @Description Retrieve a specific storage by its ID with names translated to specified language
// @Tags storages
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "Storage ID"
// @Param lang query string false "Language code (uz, ru, en - default: uz)"
// @Param expand query string false "Comma-separated relations to expand (e.g. name_i18n)"
// @Success 200 {object} model.StorageResponse "Storage details"
// @Failure 400 {object} model.ErrorResponse "Invalid request parameters"
// @Failure 401 {object} model.ErrorResponse "Unauthorized"
// @Failure 404 {object} model.ErrorResponse "Storage not found"
// @Failure 500 {object} model.ErrorResponse "Internal server error"
// @Router /api/v1/storages-lang/{id} [get]
func (h *Handler) GetStorageByIDWithLang(c echo.Context) error {
	storageID := c.Param("id")
	if storageID == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("storage id is required", "see logs for details", http.StatusBadRequest))
	}

	if _, err := uuid.Parse(storageID); err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("invalid storage id format", "see logs for details", http.StatusBadRequest))
	}

	lang := c.QueryParam("lang")
	if lang == "" {
		lang = "uz"
	}

	validLangs := map[string]bool{"uz": true, "ru": true, "en": true}
	if !validLangs[lang] {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("invalid language code", "valid values: uz, ru, en", http.StatusBadRequest))
	}

	storage, err := h.service.Storage().GetStorageByIDWithLang(c.Request().Context(), storageID, lang)
	if err != nil {
		log.Printf("GetStorageByIDWithLang failed for id %s: %v", storageID, err)
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("failed to fetch storage", "see logs for details", http.StatusInternalServerError))
	}

	if m, expanded, err := h.expandSingleResponse(c, storage, "storages"); expanded {
		if err != nil {
			return nil
		}
		return c.JSON(http.StatusOK, model.NewSuccessResponse("Storage retrieved successfully", m, http.StatusOK))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse("Storage retrieved successfully", storage, http.StatusOK))
}

// GetAllStoragesWithLang retrieves all storages with language support
// @Summary Get all storages with language support
// @Description Retrieve all storages with names translated to specified language
// @Tags storages
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param lang query string false "Language code (uz, ru, en - default: uz)"
// @Param limit query int false "Limit (default: 20)"
// @Param offset query int false "Offset (default: 0)"
// @Param expand query string false "Comma-separated relations to expand (e.g. name_i18n)"
// @Success 200 {array} model.StorageResponse "Storages retrieved successfully"
// @Failure 400 {object} model.ErrorResponse "Invalid request parameters"
// @Failure 401 {object} model.ErrorResponse "Unauthorized"
// @Failure 500 {object} model.ErrorResponse "Internal server error"
// @Router /api/v1/storages-lang [get]
func (h *Handler) GetAllStoragesWithLang(c echo.Context) error {
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

	storages, total, err := h.service.Storage().GetAllStoragesWithLang(c.Request().Context(), lang, limit, offset)
	if err != nil {
		log.Printf("GetAllStoragesWithLang failed: %v", err)
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("failed to fetch storages", "see logs for details", http.StatusInternalServerError))
	}

	if maps, expanded, err := h.expandListResponse(c, storages, "storages"); expanded {
		if err != nil {
			return err
		}
		return c.JSON(http.StatusOK, model.NewPaginatedResponse("Storages retrieved successfully", maps, total, limit, offset, http.StatusOK))
	}

	return c.JSON(http.StatusOK, model.NewPaginatedResponse("Storages retrieved successfully", storages, total, limit, offset, http.StatusOK))
}
