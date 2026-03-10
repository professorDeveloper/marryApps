package handler

import (
	"log"
	"net/http"
	"strconv"

	"github.com/google/uuid"
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
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"invalid request format",
			err.Error(),
			http.StatusBadRequest,
		))
	}

	var nameI18nUUID *uuid.UUID
	if req.NameI18n != nil && *req.NameI18n != "" {
		id, err := uuid.Parse(*req.NameI18n)
		if err != nil {
			return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
				"invalid name_i18n UUID format",
				err.Error(),
				http.StatusBadRequest,
			))
		}
		nameI18nUUID = &id
	}

	if req.Name == nil || *req.Name == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"name is required",
			"missing required field: name",
			http.StatusBadRequest,
		))
	}
	hall, err := h.service.Hall().CreateHall(c.Request().Context(), *req.Name, req.BranchID, nameI18nUUID, req.Width, req.Height)
	if err != nil {
		log.Printf("CreateHall failed: %v", err)
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse(
			"failed to create hall",
			err.Error(),
			http.StatusInternalServerError,
		))
	}

	return c.JSON(http.StatusCreated, model.NewSuccessResponse(
		"Hall created successfully",
		hall,
		http.StatusCreated,
	))
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
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"hall id is required",
			"missing path parameter: id",
			http.StatusBadRequest,
		))
	}

	hall, err := h.service.Hall().GetHallByID(c.Request().Context(), hallID)
	if err != nil {
		log.Printf("GetHallByID failed for ID %s: %v", hallID, err)
		return c.JSON(http.StatusNotFound, model.NewErrorResponse(
			"hall not found",
			err.Error(),
			http.StatusNotFound,
		))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse(
		"Hall retrieved successfully",
		hall,
		http.StatusOK,
	))
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

	halls, total, err := h.service.Hall().GetAllHalls(c.Request().Context(), limit, offset)
	if err != nil {
		log.Printf("GetAllHalls failed: %v", err)
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse(
			"failed to retrieve halls",
			err.Error(),
			http.StatusInternalServerError,
		))
	}

	if maps, expanded, err := h.expandListResponse(c, halls, "halls"); expanded {
		if err != nil {
			return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("expand failed", err.Error(), http.StatusInternalServerError))
		}
		return c.JSON(http.StatusOK, model.NewPaginatedResponse("Halls retrieved successfully", maps, int32(total), limit, offset, http.StatusOK))
	}

	return c.JSON(http.StatusOK, model.NewPaginatedResponse("Halls retrieved successfully", halls, int32(total), limit, offset, http.StatusOK))
}

// GetAllHallsWithLang retrieves all halls with language support
// @Summary Get all halls with language support
// @Description Retrieve all halls with names translated to specified language (uz, ru, en)
// @Tags halls
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param lang query string false "Language code (uz, ru, en - default: uz)"
// @Param limit query int false "Limit (default: 20)"
// @Param offset query int false "Offset (default: 0)"
// @Success 200 {array} model.HallResponse "Halls retrieved successfully"
// @Failure 400 {object} model.ErrorResponse "Invalid request parameters"
// @Failure 401 {object} model.ErrorResponse "Unauthorized"
// @Failure 500 {object} model.ErrorResponse "Internal server error"
// @Router /api/v1/halls-lang [get]
func (h *Handler) GetAllHallsWithLang(c echo.Context) error {
	var limit int32 = 20
	var offset int32 = 0
	lang := c.QueryParam("lang")
	if lang == "" {
		lang = "uz" // default language is Uzbek
	}

	// Validate language code
	validLangs := map[string]bool{"uz": true, "ru": true, "en": true}
	if !validLangs[lang] {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"invalid language code",
			"valid values: uz, ru, en",
			http.StatusBadRequest,
		))
	}

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

	halls, total, err := h.service.Hall().GetAllHallsWithLang(c.Request().Context(), lang, limit, offset)
	if err != nil {
		log.Printf("GetAllHallsWithLang failed: %v", err)
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse(
			"failed to retrieve halls",
			err.Error(),
			http.StatusInternalServerError,
		))
	}

	if maps, expanded, err := h.expandListResponse(c, halls, "halls"); expanded {
		if err != nil {
			return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("expand failed", err.Error(), http.StatusInternalServerError))
		}
		return c.JSON(http.StatusOK, model.NewPaginatedResponse("Halls retrieved successfully", maps, int32(total), limit, offset, http.StatusOK))
	}

	return c.JSON(http.StatusOK, model.NewPaginatedResponse("Halls retrieved successfully", halls, int32(total), limit, offset, http.StatusOK))
}

// GetAllHallsByBranchId retrieves all halls with braches - language support
// @Summary Get all halls with branch  ID -  language support
// @Description Retrieve all halls with names translated to specified language (uz, ru, en)
// @Tags halls
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param lang query string false "Language code (uz, ru, en - default: uz)"
// @Param limit query int false "Limit (default: 20)"
// @Param offset query int false "Offset (default: 0)"
// @Failure 401 {object} model.ErrorResponse "Unauthorized"
// @Failure 500 {object} model.ErrorResponse "Internal server error"
// @Router /api/v1/halls/branch/{branchId} [get]
func (h *Handler) GetHallsByBranchID(c echo.Context) error {
	branchID := c.Param("branchId")
	if branchID == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"branch id is required",
			"missing path parameter: branchId",
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

	halls, total, err := h.service.Hall().GetHallsByBranchID(c.Request().Context(), branchID, limit, offset)
	if err != nil {
		log.Printf("GetHallsByBranchID failed for branch ID %s: %v", branchID, err)
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse(
			"failed to retrieve halls for branch",
			err.Error(),
			http.StatusInternalServerError,
		))
	}

	if maps, expanded, err := h.expandListResponse(c, halls, "halls"); expanded {
		if err != nil {
			return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("expand failed", err.Error(), http.StatusInternalServerError))
		}
		return c.JSON(http.StatusOK, model.NewPaginatedResponse("Halls retrieved successfully", maps, int32(total), limit, offset, http.StatusOK))
	}

	return c.JSON(http.StatusOK, model.NewPaginatedResponse("Halls retrieved successfully", halls, int32(total), limit, offset, http.StatusOK))
}

// GetHallsByBranchIDWithLang retrieves halls by branch ID with language support
// @Summary Get halls by branch ID with language support
// @Description Retrieve all halls for a specific branch with names translated to specified language
// @Tags halls
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param branchId path string true "Branch ID"
// @Param lang query string false "Language code (uz, ru, en - default: uz)"
// @Param limit query int false "Limit (default: 20)"
// @Param offset query int false "Offset (default: 0)"
// @Success 200 {array} model.HallResponse "Halls retrieved successfully"
// @Failure 400 {object} model.ErrorResponse "Invalid request parameters"
// @Failure 401 {object} model.ErrorResponse "Unauthorized"
// @Failure 500 {object} model.ErrorResponse "Internal server error"
// @Router /api/v1/halls-lang/branch/{branchId} [get]
func (h *Handler) GetHallsByBranchIDWithLang(c echo.Context) error {
	branchID := c.Param("branchId")
	if branchID == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"missing path parameter: branchId",
			"branch ID is required",
			http.StatusBadRequest,
		))
	}

	var limit int32 = 20
	var offset int32 = 0
	lang := c.QueryParam("lang")
	if lang == "" {
		lang = "uz" // default language is Uzbek
	}

	// Validate language code
	validLangs := map[string]bool{"uz": true, "ru": true, "en": true}
	if !validLangs[lang] {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"invalid language code",
			"valid values: uz, ru, en",
			http.StatusBadRequest,
		))
	}

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

	halls, total, err := h.service.Hall().GetHallsByBranchIDWithLang(c.Request().Context(), branchID, lang, limit, offset)
	if err != nil {
		log.Printf("GetHallsByBranchIDWithLang failed for branch ID %s: %v", branchID, err)
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse(
			"failed to retrieve halls for branch",
			err.Error(),
			http.StatusInternalServerError,
		))
	}

	if maps, expanded, err := h.expandListResponse(c, halls, "halls"); expanded {
		if err != nil {
			return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("expand failed", err.Error(), http.StatusInternalServerError))
		}
		return c.JSON(http.StatusOK, model.NewPaginatedResponse("Halls retrieved successfully", maps, int32(total), limit, offset, http.StatusOK))
	}

	return c.JSON(http.StatusOK, model.NewPaginatedResponse("Halls retrieved successfully", halls, int32(total), limit, offset, http.StatusOK))
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
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"hall id is required",
			"missing path parameter: id",
			http.StatusBadRequest,
		))
	}

	var req model.UpdateHallRequest
	if err := c.Bind(&req); err != nil {
		log.Printf("Failed to bind update hall request: %v", err)
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"invalid request format",
			err.Error(),
			http.StatusBadRequest,
		))
	}

	hall, err := h.service.Hall().UpdateHall(c.Request().Context(), hallID, req.Name, req.BranchID, req.NameI18n, req.Width, req.Height)
	if err != nil {
		log.Printf("UpdateHall failed for ID %s: %v", hallID, err)
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse(
			"failed to update hall",
			err.Error(),
			http.StatusInternalServerError,
		))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse(
		"Hall updated successfully",
		hall,
		http.StatusOK,
	))
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
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"hall id is required",
			"missing path parameter: id",
			http.StatusBadRequest,
		))
	}

	if err := h.service.Hall().DeleteHall(c.Request().Context(), hallID); err != nil {
		log.Printf("DeleteHall failed for ID %s: %v", hallID, err)
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse(
			"failed to delete hall",
			err.Error(),
			http.StatusInternalServerError,
		))
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
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"hall id is required",
			"missing path parameter: id",
			http.StatusBadRequest,
		))
	}

	hall, err := h.service.Hall().RestoreHall(c.Request().Context(), hallID)
	if err != nil {
		log.Printf("RestoreHall failed for ID %s: %v", hallID, err)
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse(
			"failed to restore hall",
			err.Error(),
			http.StatusInternalServerError,
		))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse(
		"Hall restored successfully",
		hall,
		http.StatusOK,
	))
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
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"search query is required",
			"missing query parameter: q",
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

	halls, err := h.service.Hall().SearchHalls(c.Request().Context(), query, limit, offset)
	if err != nil {
		log.Printf("SearchHalls failed for query %s: %v", query, err)
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse(
			"failed to search halls",
			err.Error(),
			http.StatusInternalServerError,
		))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse(
		"Halls retrieved successfully",
		halls,
		http.StatusOK,
	))
}
