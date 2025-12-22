package handler

import (
	"log"
	"net/http"
	"strconv"

	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
	"gitlab.yurtal.tech/company/maryai/back/internal/model"
)

// ==================== BRANCH HANDLERS ====================

// CreateBranch creates a new branch
// @Summary Create a new branch
// @Description Create a new branch with name, address, and phone
// @Tags branches
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param input body model.CreateBranchRequest true "Branch creation data"
// @Success 201 {object} model.BranchResponse "Branch created successfully"
// @Failure 400 {object} model.ErrorResponse "Invalid request data"
// @Failure 401 {object} model.ErrorResponse "Unauthorized"
// @Failure 500 {object} model.ErrorResponse "Internal server error"
// @Router /api/v1/branches [post]
func (h *Handler) CreateBranch(c echo.Context) error {
	var req model.CreateBranchRequest
	if err := c.Bind(&req); err != nil {
		log.Printf("Failed to bind create branch request: %v", err)
		return c.JSON(http.StatusBadRequest, model.ErrorResponse{Message: "invalid request format"})
	}

	if req.Name == nil || *req.Name == "" {
		return c.JSON(http.StatusBadRequest, model.ErrorResponse{Message: "name is required"})
	}

	var nameI18nUUID *uuid.UUID
	if req.NameI18n != nil && *req.NameI18n != "" {
		id, err := uuid.Parse(*req.NameI18n)
		if err != nil {
			return c.JSON(http.StatusBadRequest, model.ErrorResponse{Message: "invalid name_i18n UUID format"})
		}
		nameI18nUUID = &id
	}

	branch, err := h.service.Organization().CreateBranch(c.Request().Context(), *req.Name, nameI18nUUID, req.Address, req.Phone)
	if err != nil {
		log.Printf("CreateBranch failed: %v", err)
		return c.JSON(http.StatusInternalServerError, model.ErrorResponse{Message: "failed to create branch"})
	}

	return c.JSON(http.StatusCreated, branch)
}

// GetBranchByID retrieves a branch by ID
// @Summary Get branch by ID
// @Description Retrieve a specific branch by its ID
// @Tags branches
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "Branch ID"
// @Success 200 {object} model.BranchResponse "Branch details"
// @Failure 400 {object} model.ErrorResponse "Invalid branch ID"
// @Failure 401 {object} model.ErrorResponse "Unauthorized"
// @Failure 404 {object} model.ErrorResponse "Branch not found"
// @Failure 500 {object} model.ErrorResponse "Internal server error"
// @Router /api/v1/branches/{id} [get]
func (h *Handler) GetBranchByID(c echo.Context) error {
	branchID := c.Param("id")
	if branchID == "" {
		return c.JSON(http.StatusBadRequest, model.ErrorResponse{Message: "branch id is required"})
	}

	if _, err := uuid.Parse(branchID); err != nil {
		return c.JSON(http.StatusBadRequest, model.ErrorResponse{Message: "invalid branch id format"})
	}

	branch, err := h.service.Organization().GetBranchByID(c.Request().Context(), branchID)
	if err != nil {
		log.Printf("GetBranchByID failed for id %s: %v", branchID, err)
		return c.JSON(http.StatusInternalServerError, model.ErrorResponse{Message: "failed to fetch branch"})
	}

	if branch == nil {
		return c.JSON(http.StatusNotFound, model.ErrorResponse{Message: "branch not found"})
	}

	return c.JSON(http.StatusOK, branch)
}

// GetAllBranches retrieves all branches
// @Summary Get all branches
// @Description Retrieve all branches with pagination
// @Tags branches
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param limit query int false "Limit results (default: 20)" default(20)
// @Param offset query int false "Offset for pagination (default: 0)" default(0)
// @Success 200 {array} model.BranchResponse "List of all branches"
// @Failure 401 {object} model.ErrorResponse "Unauthorized"
// @Failure 500 {object} model.ErrorResponse "Internal server error"
// @Router /api/v1/branches [get]
func (h *Handler) GetAllBranches(c echo.Context) error {
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

	branches, err := h.service.Organization().GetAllBranches(c.Request().Context(), limit, offset)
	if err != nil {
		log.Printf("GetAllBranches failed: %v", err)
		return c.JSON(http.StatusInternalServerError, model.ErrorResponse{Message: "failed to fetch branches"})
	}

	return c.JSON(http.StatusOK, branches)
}

// DeleteBranch deletes a branch
// @Summary Delete branch
// @Description Soft delete a branch (mark as deleted without removing from database)
// @Tags branches
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "Branch ID"
// @Success 200 {object} model.SuccessResponse "Branch deleted successfully"
// @Failure 400 {object} model.ErrorResponse "Invalid branch ID"
// @Failure 401 {object} model.ErrorResponse "Unauthorized"
// @Failure 500 {object} model.ErrorResponse "Internal server error"
// @Router /api/v1/branches/{id} [delete]
func (h *Handler) DeleteBranch(c echo.Context) error {
	branchID := c.Param("id")
	if branchID == "" {
		return c.JSON(http.StatusBadRequest, model.ErrorResponse{Message: "branch id is required"})
	}

	if _, err := uuid.Parse(branchID); err != nil {
		return c.JSON(http.StatusBadRequest, model.ErrorResponse{Message: "invalid branch id format"})
	}

	if err := h.service.Organization().DeleteBranch(c.Request().Context(), branchID); err != nil {
		log.Printf("DeleteBranch failed for id %s: %v", branchID, err)
		return c.JSON(http.StatusInternalServerError, model.ErrorResponse{Message: "failed to delete branch"})
	}

	return c.JSON(http.StatusOK, model.SuccessResponse{Message: "Branch deleted successfully"})
}

// RestoreBranch restores a deleted branch
// @Summary Restore branch
// @Description Restore a previously deleted branch
// @Tags branches
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "Branch ID"
// @Success 200 {object} model.SuccessResponse "Branch restored successfully"
// @Failure 400 {object} model.ErrorResponse "Invalid branch ID"
// @Failure 401 {object} model.ErrorResponse "Unauthorized"
// @Failure 500 {object} model.ErrorResponse "Internal server error"
// @Router /api/v1/branches/{id}/restore [post]
func (h *Handler) RestoreBranch(c echo.Context) error {
	branchID := c.Param("id")
	if branchID == "" {
		return c.JSON(http.StatusBadRequest, model.ErrorResponse{Message: "branch id is required"})
	}

	if _, err := uuid.Parse(branchID); err != nil {
		return c.JSON(http.StatusBadRequest, model.ErrorResponse{Message: "invalid branch id format"})
	}

	if err := h.service.Organization().RestoreBranch(c.Request().Context(), branchID); err != nil {
		log.Printf("RestoreBranch failed for id %s: %v", branchID, err)
		return c.JSON(http.StatusInternalServerError, model.ErrorResponse{Message: "failed to restore branch"})
	}

	return c.JSON(http.StatusOK, model.SuccessResponse{Message: "Branch restored successfully"})
}

// ==================== TRANSLATION HANDLERS ====================

// CreateTranslation creates a new translation
// @Summary Create a new translation
// @Description Create a new translation with uz, ru, en content
// @Tags translations
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param input body model.CreateTranslationRequest true "Translation creation data"
// @Success 201 {object} model.TranslationResponse "Translation created successfully"
// @Failure 400 {object} model.ErrorResponse "Invalid request data"
// @Failure 401 {object} model.ErrorResponse "Unauthorized"
// @Failure 500 {object} model.ErrorResponse "Internal server error"
// @Router /api/v1/translations [post]
func (h *Handler) CreateTranslation(c echo.Context) error {
	var req model.CreateTranslationRequest
	if err := c.Bind(&req); err != nil {
		log.Printf("Failed to bind create translation request: %v", err)
		return c.JSON(http.StatusBadRequest, model.ErrorResponse{Message: "invalid request format"})
	}

	translation, err := h.service.Organization().CreateTranslation(c.Request().Context(), req.Uz, req.Ru, req.En)
	if err != nil {
		log.Printf("CreateTranslation failed: %v", err)
		return c.JSON(http.StatusInternalServerError, model.ErrorResponse{Message: "failed to create translation"})
	}

	return c.JSON(http.StatusCreated, translation)
}

// GetTranslationByID retrieves a translation by ID
// @Summary Get translation by ID
// @Description Retrieve a specific translation by its ID
// @Tags translations
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "Translation ID"
// @Success 200 {object} model.TranslationResponse "Translation details"
// @Failure 400 {object} model.ErrorResponse "Invalid translation ID"
// @Failure 401 {object} model.ErrorResponse "Unauthorized"
// @Failure 404 {object} model.ErrorResponse "Translation not found"
// @Failure 500 {object} model.ErrorResponse "Internal server error"
// @Router /api/v1/translations/{id} [get]
func (h *Handler) GetTranslationByID(c echo.Context) error {
	translationID := c.Param("id")
	if translationID == "" {
		return c.JSON(http.StatusBadRequest, model.ErrorResponse{Message: "translation id is required"})
	}

	if _, err := uuid.Parse(translationID); err != nil {
		return c.JSON(http.StatusBadRequest, model.ErrorResponse{Message: "invalid translation id format"})
	}

	translation, err := h.service.Organization().GetTranslationByID(c.Request().Context(), translationID)
	if err != nil {
		log.Printf("GetTranslationByID failed for id %s: %v", translationID, err)
		return c.JSON(http.StatusInternalServerError, model.ErrorResponse{Message: "failed to fetch translation"})
	}

	if translation == nil {
		return c.JSON(http.StatusNotFound, model.ErrorResponse{Message: "translation not found"})
	}

	return c.JSON(http.StatusOK, translation)
}

// GetAllTranslations retrieves all translations
// @Summary Get all translations
// @Description Retrieve all translations with pagination
// @Tags translations
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param limit query int false "Limit results (default: 20)" default(20)
// @Param offset query int false "Offset for pagination (default: 0)" default(0)
// @Success 200 {array} model.TranslationResponse "List of all translations"
// @Failure 401 {object} model.ErrorResponse "Unauthorized"
// @Failure 500 {object} model.ErrorResponse "Internal server error"
// @Router /api/v1/translations [get]
func (h *Handler) GetAllTranslations(c echo.Context) error {
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

	translations, err := h.service.Organization().GetAllTranslations(c.Request().Context(), limit, offset)
	if err != nil {
		log.Printf("GetAllTranslations failed: %v", err)
		return c.JSON(http.StatusInternalServerError, model.ErrorResponse{Message: "failed to fetch translations"})
	}

	return c.JSON(http.StatusOK, translations)
}

// DeleteTranslation deletes a translation
// @Summary Delete translation
// @Description Soft delete a translation (mark as deleted without removing from database)
// @Tags translations
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "Translation ID"
// @Success 200 {object} model.SuccessResponse "Translation deleted successfully"
// @Failure 400 {object} model.ErrorResponse "Invalid translation ID"
// @Failure 401 {object} model.ErrorResponse "Unauthorized"
// @Failure 500 {object} model.ErrorResponse "Internal server error"
// @Router /api/v1/translations/{id} [delete]
func (h *Handler) DeleteTranslation(c echo.Context) error {
	translationID := c.Param("id")
	if translationID == "" {
		return c.JSON(http.StatusBadRequest, model.ErrorResponse{Message: "translation id is required"})
	}

	if _, err := uuid.Parse(translationID); err != nil {
		return c.JSON(http.StatusBadRequest, model.ErrorResponse{Message: "invalid translation id format"})
	}

	if err := h.service.Organization().DeleteTranslation(c.Request().Context(), translationID); err != nil {
		log.Printf("DeleteTranslation failed for id %s: %v", translationID, err)
		return c.JSON(http.StatusInternalServerError, model.ErrorResponse{Message: "failed to delete translation"})
	}

	return c.JSON(http.StatusOK, model.SuccessResponse{Message: "Translation deleted successfully"})
}

// RestoreTranslation restores a deleted translation
// @Summary Restore translation
// @Description Restore a previously deleted translation
// @Tags translations
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "Translation ID"
// @Success 200 {object} model.SuccessResponse "Translation restored successfully"
// @Failure 400 {object} model.ErrorResponse "Invalid translation ID"
// @Failure 401 {object} model.ErrorResponse "Unauthorized"
// @Failure 500 {object} model.ErrorResponse "Internal server error"
// @Router /api/v1/translations/{id}/restore [post]
func (h *Handler) RestoreTranslation(c echo.Context) error {
	translationID := c.Param("id")
	if translationID == "" {
		return c.JSON(http.StatusBadRequest, model.ErrorResponse{Message: "translation id is required"})
	}

	if _, err := uuid.Parse(translationID); err != nil {
		return c.JSON(http.StatusBadRequest, model.ErrorResponse{Message: "invalid translation id format"})
	}

	if err := h.service.Organization().RestoreTranslation(c.Request().Context(), translationID); err != nil {
		log.Printf("RestoreTranslation failed for id %s: %v", translationID, err)
		return c.JSON(http.StatusInternalServerError, model.ErrorResponse{Message: "failed to restore translation"})
	}

	return c.JSON(http.StatusOK, model.SuccessResponse{Message: "Translation restored successfully"})
}
