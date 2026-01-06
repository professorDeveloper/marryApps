package handler

import (
	"log"
	"net/http"
	"strconv"

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
	if req.BranchID == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("branch_id is required", "see logs for details", http.StatusBadRequest))
	}

	var nameI18nUUID *uuid.UUID
	if req.NameI18n != nil && *req.NameI18n != "" {
		id, err := uuid.Parse(*req.NameI18n)
		if err != nil {
			return c.JSON(http.StatusBadRequest, model.NewErrorResponse("invalid name_i18n UUID format", "see logs for details", http.StatusBadRequest))
		}
		nameI18nUUID = &id
	}

	storage, err := h.service.Storage().CreateStorage(c.Request().Context(), *req.Name, req.BranchID, nameI18nUUID, req.PictureUrl, req.ColorCode)
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

	return c.JSON(http.StatusOK, model.NewSuccessResponse("Storage retrieved successfully", storage, http.StatusOK))
}

// GetAllStorages retrieves all storages
// @Summary Get all storages
// @Description Retrieve all storages with pagination
// @Tags storages
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param limit query int false "Limit results (default: 20)" default(20)
// @Param offset query int false "Offset for pagination (default: 0)" default(0)
// @Success 200 {array} model.StorageResponse "List of all storages"
// @Failure 401 {object} model.ErrorResponse "Unauthorized"
// @Failure 500 {object} model.ErrorResponse "Internal server error"
// @Router /api/v1/storages [get]
func (h *Handler) GetAllStorages(c echo.Context) error {
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

	storages, err := h.service.Storage().GetAllStorages(c.Request().Context(), limit, offset)
	if err != nil {
		log.Printf("GetAllStorages failed: %v", err)
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("failed to fetch storages", "see logs for details", http.StatusInternalServerError))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse("Data retrieved successfully", storages, http.StatusOK))
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

	storages, err := h.service.Storage().GetStoragesByBranchID(c.Request().Context(), branchID, limit, offset)
	if err != nil {
		log.Printf("GetStoragesByBranchID failed for branch %s: %v", branchID, err)
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("failed to fetch storages by branch", "see logs for details", http.StatusInternalServerError))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse("Data retrieved successfully", storages, http.StatusOK))
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

	storage, err := h.service.Storage().UpdateStorage(c.Request().Context(), storageID, req.Name, req.BranchID, req.NameI18n, req.PictureUrl, req.ColorCode)
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

// SearchStorages searches storages by name
// @Summary Search storages
// @Description Search for storages by name
// @Tags storages
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param q query string true "Search query"
// @Param limit query int false "Limit results (default: 20)" default(20)
// @Param offset query int false "Offset for pagination (default: 0)" default(0)
// @Success 200 {array} model.StorageResponse "List of matching storages"
// @Failure 400 {object} model.ErrorResponse "Invalid parameters"
// @Failure 401 {object} model.ErrorResponse "Unauthorized"
// @Failure 500 {object} model.ErrorResponse "Internal server error"
// @Router /api/v1/storages/search [get]
func (h *Handler) SearchStorages(c echo.Context) error {
	query := c.QueryParam("q")
	if query == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("search query is required", "see logs for details", http.StatusBadRequest))
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

	storages, err := h.service.Storage().SearchStorages(c.Request().Context(), query, limit, offset)
	if err != nil {
		log.Printf("SearchStorages failed for query %s: %v", query, err)
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("failed to search storages", "see logs for details", http.StatusInternalServerError))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse("Data retrieved successfully", storages, http.StatusOK))
}
