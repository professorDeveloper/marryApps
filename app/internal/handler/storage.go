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
		return c.JSON(http.StatusBadRequest, model.ErrorResponse{Message: "invalid request format"})
	}

	if req.Name == nil || *req.Name == "" {
		return c.JSON(http.StatusBadRequest, model.ErrorResponse{Message: "name is required"})
	}
	if req.BranchID == "" {
		return c.JSON(http.StatusBadRequest, model.ErrorResponse{Message: "branch_id is required"})
	}

	var nameI18nUUID *uuid.UUID
	if req.NameI18n != nil && *req.NameI18n != "" {
		id, err := uuid.Parse(*req.NameI18n)
		if err != nil {
			return c.JSON(http.StatusBadRequest, model.ErrorResponse{Message: "invalid name_i18n UUID format"})
		}
		nameI18nUUID = &id
	}

	storage, err := h.service.Storage().CreateStorage(c.Request().Context(), *req.Name, req.BranchID, nameI18nUUID, req.PictureUrl)
	if err != nil {
		log.Printf("CreateStorage failed: %v", err)
		return c.JSON(http.StatusInternalServerError, model.ErrorResponse{Message: "failed to create storage"})
	}

	return c.JSON(http.StatusCreated, storage)
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
		return c.JSON(http.StatusBadRequest, model.ErrorResponse{Message: "storage id is required"})
	}

	if _, err := uuid.Parse(storageID); err != nil {
		return c.JSON(http.StatusBadRequest, model.ErrorResponse{Message: "invalid storage id format"})
	}

	storage, err := h.service.Storage().GetStorageByID(c.Request().Context(), storageID)
	if err != nil {
		log.Printf("GetStorageByID failed for id %s: %v", storageID, err)
		return c.JSON(http.StatusInternalServerError, model.ErrorResponse{Message: "failed to fetch storage"})
	}

	if storage == nil {
		return c.JSON(http.StatusNotFound, model.ErrorResponse{Message: "storage not found"})
	}

	return c.JSON(http.StatusOK, storage)
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
		return c.JSON(http.StatusInternalServerError, model.ErrorResponse{Message: "failed to fetch storages"})
	}

	return c.JSON(http.StatusOK, storages)
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
		return c.JSON(http.StatusBadRequest, model.ErrorResponse{Message: "branch id is required"})
	}

	if _, err := uuid.Parse(branchID); err != nil {
		return c.JSON(http.StatusBadRequest, model.ErrorResponse{Message: "invalid branch id format"})
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
		return c.JSON(http.StatusInternalServerError, model.ErrorResponse{Message: "failed to fetch storages by branch"})
	}

	return c.JSON(http.StatusOK, storages)
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
		return c.JSON(http.StatusBadRequest, model.ErrorResponse{Message: "storage id is required"})
	}

	if _, err := uuid.Parse(storageID); err != nil {
		return c.JSON(http.StatusBadRequest, model.ErrorResponse{Message: "invalid storage id format"})
	}

	var req model.UpdateStorageRequest
	if err := c.Bind(&req); err != nil {
		log.Printf("Failed to bind update storage request: %v", err)
		return c.JSON(http.StatusBadRequest, model.ErrorResponse{Message: "invalid request format"})
	}

	storage, err := h.service.Storage().UpdateStorage(c.Request().Context(), storageID, req.Name, req.BranchID, req.NameI18n, req.PictureUrl)
	if err != nil {
		log.Printf("UpdateStorage failed for id %s: %v", storageID, err)
		return c.JSON(http.StatusInternalServerError, model.ErrorResponse{Message: "failed to update storage"})
	}

	return c.JSON(http.StatusOK, storage)
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
		return c.JSON(http.StatusBadRequest, model.ErrorResponse{Message: "storage id is required"})
	}

	if _, err := uuid.Parse(storageID); err != nil {
		return c.JSON(http.StatusBadRequest, model.ErrorResponse{Message: "invalid storage id format"})
	}

	if err := h.service.Storage().DeleteStorage(c.Request().Context(), storageID); err != nil {
		log.Printf("DeleteStorage failed for id %s: %v", storageID, err)
		return c.JSON(http.StatusInternalServerError, model.ErrorResponse{Message: "failed to delete storage"})
	}

	return c.JSON(http.StatusOK, model.SuccessResponse{Message: "Storage deleted successfully"})
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
		return c.JSON(http.StatusBadRequest, model.ErrorResponse{Message: "storage id is required"})
	}

	if _, err := uuid.Parse(storageID); err != nil {
		return c.JSON(http.StatusBadRequest, model.ErrorResponse{Message: "invalid storage id format"})
	}

	if err := h.service.Storage().RestoreStorage(c.Request().Context(), storageID); err != nil {
		log.Printf("RestoreStorage failed for id %s: %v", storageID, err)
		return c.JSON(http.StatusInternalServerError, model.ErrorResponse{Message: "failed to restore storage"})
	}

	return c.JSON(http.StatusOK, model.SuccessResponse{Message: "Storage restored successfully"})
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
		return c.JSON(http.StatusBadRequest, model.ErrorResponse{Message: "search query is required"})
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
		return c.JSON(http.StatusInternalServerError, model.ErrorResponse{Message: "failed to search storages"})
	}

	return c.JSON(http.StatusOK, storages)
}
