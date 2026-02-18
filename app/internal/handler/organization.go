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

	branch, err := h.service.Organization().CreateBranch(c.Request().Context(), *req.Name, nameI18nUUID, req.Address, req.Phone)
	if err != nil {
		log.Printf("CreateBranch failed: %v", err)
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("failed to create branch", "see logs for details", http.StatusInternalServerError))
	}

	return c.JSON(http.StatusCreated, model.NewSuccessResponse("Branch created successfully", branch, http.StatusCreated))
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
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("branch id is required", "see logs for details", http.StatusBadRequest))
	}

	if _, err := uuid.Parse(branchID); err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("invalid branch id format", "see logs for details", http.StatusBadRequest))
	}

	branch, err := h.service.Organization().GetBranchByID(c.Request().Context(), branchID)
	if err != nil {
		log.Printf("GetBranchByID failed for id %s: %v", branchID, err)
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("failed to fetch branch", "see logs for details", http.StatusInternalServerError))
	}

	if branch == nil {
		return c.JSON(http.StatusNotFound, model.NewErrorResponse("branch not found", "see logs for details", http.StatusNotFound))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse("Branch retrieved successfully", branch, http.StatusOK))
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
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("failed to fetch branches", "see logs for details", http.StatusInternalServerError))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse("Data retrieved successfully", branches, http.StatusOK))
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
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("branch id is required", "see logs for details", http.StatusBadRequest))
	}

	if _, err := uuid.Parse(branchID); err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("invalid branch id format", "see logs for details", http.StatusBadRequest))
	}

	if err := h.service.Organization().DeleteBranch(c.Request().Context(), branchID); err != nil {
		log.Printf("DeleteBranch failed for id %s: %v", branchID, err)
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("failed to delete branch", "see logs for details", http.StatusInternalServerError))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse("Branch deleted successfully", map[string]interface{}{}, http.StatusOK))
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
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("branch id is required", "see logs for details", http.StatusBadRequest))
	}

	if _, err := uuid.Parse(branchID); err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("invalid branch id format", "see logs for details", http.StatusBadRequest))
	}

	if err := h.service.Organization().RestoreBranch(c.Request().Context(), branchID); err != nil {
		log.Printf("RestoreBranch failed for id %s: %v", branchID, err)
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("failed to restore branch", "see logs for details", http.StatusInternalServerError))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse("Branch restored successfully", map[string]interface{}{}, http.StatusOK))
}

// UpdateBranch updates a branch
// @Summary Update branch
// @Description Update a branch's name, name_i18n, or phone
// @Tags branches
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "Branch ID"
// @Param input body model.UpdateBranchRequest true "Branch update data"
// @Success 200 {object} model.BranchResponse "Branch updated successfully"
// @Failure 400 {object} model.ErrorResponse "Invalid request data"
// @Failure 401 {object} model.ErrorResponse "Unauthorized"
// @Failure 500 {object} model.ErrorResponse "Internal server error"
// @Router /api/v1/branches/{id} [put]
func (h *Handler) UpdateBranch(c echo.Context) error {
	branchID := c.Param("id")
	if branchID == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("branch id is required", "see logs for details", http.StatusBadRequest))
	}

	if _, err := uuid.Parse(branchID); err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("invalid branch id format", "see logs for details", http.StatusBadRequest))
	}

	var req model.UpdateBranchRequest
	if err := c.Bind(&req); err != nil {
		log.Printf("Failed to bind update branch request: %v", err)
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("invalid request format", "see logs for details", http.StatusBadRequest))
	}

	branch, err := h.service.Organization().UpdateBranch(c.Request().Context(), branchID, req.Name, req.NameI18n, req.Address, req.Phone)
	if err != nil {
		log.Printf("UpdateBranch failed for id %s: %v", branchID, err)
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("failed to update branch", "see logs for details", http.StatusInternalServerError))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse("Branch updated successfully", branch, http.StatusOK))
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
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("invalid request format", "see logs for details", http.StatusBadRequest))
	}

	translation, err := h.service.Organization().CreateTranslation(c.Request().Context(), req.Uz, req.Ru, req.En)
	if err != nil {
		log.Printf("CreateTranslation failed: %v", err)
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("failed to create translation", "see logs for details", http.StatusInternalServerError))
	}

	return c.JSON(http.StatusCreated, model.NewSuccessResponse("Translation created successfully", translation, http.StatusCreated))
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
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("translation id is required", "see logs for details", http.StatusBadRequest))
	}

	if _, err := uuid.Parse(translationID); err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("invalid translation id format", "see logs for details", http.StatusBadRequest))
	}

	translation, err := h.service.Organization().GetTranslationByID(c.Request().Context(), translationID)
	if err != nil {
		log.Printf("GetTranslationByID failed for id %s: %v", translationID, err)
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("failed to fetch translation", "see logs for details", http.StatusInternalServerError))
	}

	if translation == nil {
		return c.JSON(http.StatusNotFound, model.NewErrorResponse("translation not found", "see logs for details", http.StatusNotFound))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse("Translation retrieved successfully", translation, http.StatusOK))
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
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("failed to fetch translations", "see logs for details", http.StatusInternalServerError))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse("Data retrieved successfully", translations, http.StatusOK))
}

// UpdateTranslation updates a translation
// @Summary Update translation
// @Description Update an existing translation by ID (partial update of uz/ru/en)
// @Tags translations
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "Translation ID"
// @Param input body model.UpdateTranslationRequest true "Translation update data"
// @Success 200 {object} model.TranslationResponse "Translation updated successfully"
// @Failure 400 {object} model.ErrorResponse "Invalid request data"
// @Failure 401 {object} model.ErrorResponse "Unauthorized"
// @Failure 404 {object} model.ErrorResponse "Translation not found"
// @Failure 500 {object} model.ErrorResponse "Internal server error"
// @Router /api/v1/translations/{id} [put]
func (h *Handler) UpdateTranslation(c echo.Context) error {
	translationID := c.Param("id")
	if translationID == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("translation id is required", "see logs for details", http.StatusBadRequest))
	}

	if _, err := uuid.Parse(translationID); err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("invalid translation id format", "see logs for details", http.StatusBadRequest))
	}

	var req model.UpdateTranslationRequest
	if err := c.Bind(&req); err != nil {
		log.Printf("Failed to bind update translation request: %v", err)
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("invalid request format", "see logs for details", http.StatusBadRequest))
	}

	if req.Uz == nil && req.Ru == nil && req.En == nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("invalid request", "at least one of uz, ru, en must be provided", http.StatusBadRequest))
	}

	translation, err := h.service.Organization().UpdateTranslation(c.Request().Context(), translationID, req.Uz, req.Ru, req.En)
	if err != nil {
		log.Printf("UpdateTranslation failed for id %s: %v", translationID, err)
		if strings.Contains(err.Error(), "no rows") || strings.Contains(err.Error(), "not found") {
			return c.JSON(http.StatusNotFound, model.NewErrorResponse("translation not found", "see logs for details", http.StatusNotFound))
		}
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("failed to update translation", "see logs for details", http.StatusInternalServerError))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse("Translation updated successfully", translation, http.StatusOK))
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
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("translation id is required", "see logs for details", http.StatusBadRequest))
	}

	if _, err := uuid.Parse(translationID); err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("invalid translation id format", "see logs for details", http.StatusBadRequest))
	}

	if err := h.service.Organization().DeleteTranslation(c.Request().Context(), translationID); err != nil {
		log.Printf("DeleteTranslation failed for id %s: %v", translationID, err)
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("failed to delete translation", "see logs for details", http.StatusInternalServerError))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse("Translation deleted successfully", map[string]interface{}{}, http.StatusOK))
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
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("translation id is required", "see logs for details", http.StatusBadRequest))
	}

	if _, err := uuid.Parse(translationID); err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("invalid translation id format", "see logs for details", http.StatusBadRequest))
	}

	if err := h.service.Organization().RestoreTranslation(c.Request().Context(), translationID); err != nil {
		log.Printf("RestoreTranslation failed for id %s: %v", translationID, err)
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("failed to restore translation", "see logs for details", http.StatusInternalServerError))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse("Translation restored successfully", map[string]interface{}{}, http.StatusOK))
}

// ==================== BRANCH WITH LANGUAGE HANDLERS ====================

// GetBranchByIDWithLang retrieves a branch by ID with language support
// @Summary Get branch by ID with language support
// @Description Retrieve a specific branch by its ID with names translated to specified language
// @Tags branches
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "Branch ID"
// @Param lang query string false "Language code (uz, ru, en - default: uz)"
// @Success 200 {object} model.BranchResponse "Branch details"
// @Failure 400 {object} model.ErrorResponse "Invalid request parameters"
// @Failure 401 {object} model.ErrorResponse "Unauthorized"
// @Failure 404 {object} model.ErrorResponse "Branch not found"
// @Failure 500 {object} model.ErrorResponse "Internal server error"
// @Router /api/v1/branches-lang/{id} [get]
func (h *Handler) GetBranchByIDWithLang(c echo.Context) error {
	branchID := c.Param("id")
	if branchID == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("branch id is required", "see logs for details", http.StatusBadRequest))
	}

	if _, err := uuid.Parse(branchID); err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("invalid branch id format", "see logs for details", http.StatusBadRequest))
	}

	lang := c.QueryParam("lang")
	if lang == "" {
		lang = "uz"
	}

	validLangs := map[string]bool{"uz": true, "ru": true, "en": true}
	if !validLangs[lang] {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("invalid language code", "valid values: uz, ru, en", http.StatusBadRequest))
	}

	branch, err := h.service.Organization().GetBranchByIDWithLang(c.Request().Context(), branchID, lang)
	if err != nil {
		log.Printf("GetBranchByIDWithLang failed for id %s: %v", branchID, err)
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("failed to fetch branch", "see logs for details", http.StatusInternalServerError))
	}

	if branch == nil {
		return c.JSON(http.StatusNotFound, model.NewErrorResponse("branch not found", "see logs for details", http.StatusNotFound))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse("Branch retrieved successfully", branch, http.StatusOK))
}

// GetAllBranchesWithLang retrieves all branches with language support
// @Summary Get all branches with language support
// @Description Retrieve all branches with names translated to specified language
// @Tags branches
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param lang query string false "Language code (uz, ru, en - default: uz)"
// @Param limit query int false "Limit (default: 20)"
// @Param offset query int false "Offset (default: 0)"
// @Success 200 {array} model.BranchResponse "Branches retrieved successfully"
// @Failure 400 {object} model.ErrorResponse "Invalid request parameters"
// @Failure 401 {object} model.ErrorResponse "Unauthorized"
// @Failure 500 {object} model.ErrorResponse "Internal server error"
// @Router /api/v1/branches-lang [get]
func (h *Handler) GetAllBranchesWithLang(c echo.Context) error {
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

	branches, err := h.service.Organization().GetAllBranchesWithLang(c.Request().Context(), lang, limit, offset)
	if err != nil {
		log.Printf("GetAllBranchesWithLang failed: %v", err)
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("failed to fetch branches", "see logs for details", http.StatusInternalServerError))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse("Branches retrieved successfully", branches, http.StatusOK))
}
