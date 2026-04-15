package handler

import (
	"log"
	"net/http"
	"strings"

	"github.com/labstack/echo/v4"
	"gitlab.yurtal.tech/company/maryai/back/internal/model"
)

// AttachModifierToGood attaches a modifier to a good
// @Summary Attach modifier to good
// @Description Attach a modifier to a good
// @Tags goods-modifiers
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "Good ID"
// @Param request body model.AttachModifiersToGoodRequest true "Attach modifiers request"
// @Success 201 {object} model.SuccessResponse
// @Failure 400 {object} model.ErrorResponse
// @Failure 500 {object} model.ErrorResponse
// @Router /api/v1/goods/{id}/modifiers [post]
func (h *Handler) AttachModifierToGood(c echo.Context) error {
	goodID := strings.TrimSpace(c.Param("id"))
	if goodID == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"Good ID is required",
			"missing path parameter: id",
			http.StatusBadRequest,
		))
	}

	var req model.AttachModifiersToGoodRequest
	if err := c.Bind(&req); err != nil {
		log.Printf("Failed to bind attach modifiers request: %v", err)
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"Invalid request format",
			err.Error(),
			http.StatusBadRequest,
		))
	}

	if len(req.Modifiers) == 0 {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"Modifiers list is required",
			"missing required field: modifiers",
			http.StatusBadRequest,
		))
	}

	if err := h.service.GoodsModifier().AttachModifiersToGood(c.Request().Context(), goodID, req); err != nil {
		log.Printf("AttachModifiersToGood failed for good %s: %v", goodID, err)
		return respondDomainError(c, "Failed to attach modifiers to good", err)
	}

	return c.JSON(http.StatusCreated, model.NewSuccessResponse(
		"Modifiers attached to good successfully",
		map[string]interface{}{},
		http.StatusCreated,
	))
}

// GetModifiersByGoodID retrieves modifiers attached to a good
// @Summary Get modifiers by good ID
// @Description Retrieve all modifiers attached to a good
// @Tags goods-modifiers
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "Good ID"
// @Success 200 {array} model.GoodModifierResponse
// @Failure 400 {object} model.ErrorResponse
// @Failure 500 {object} model.ErrorResponse
// @Router /api/v1/goods/{id}/modifiers [get]
func (h *Handler) GetModifiersByGoodID(c echo.Context) error {
	goodID := strings.TrimSpace(c.Param("id"))
	if goodID == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"Good ID is required",
			"missing path parameter: id",
			http.StatusBadRequest,
		))
	}

	resp, err := h.service.GoodsModifier().GetModifiersByGoodID(c.Request().Context(), goodID)
	if err != nil {
		log.Printf("GetModifiersByGoodID failed for good %s: %v", goodID, err)
		return respondDomainError(c, "Failed to retrieve good modifiers", err)
	}

	total := int32(len(resp))
	limit := total
	offset := int32(0)

	return c.JSON(http.StatusOK, model.NewPaginatedResponse(
		"Good modifiers retrieved successfully",
		resp,
		total,
		limit,
		offset,
		http.StatusOK,
	))
}

// DetachModifierFromGood detaches a modifier from a good
// @Summary Detach modifier from good
// @Description Detach a modifier from a good
// @Tags goods-modifiers
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "Good ID"
// @Param modifierId path string true "Modifier ID"
// @Success 200 {object} model.SuccessResponse
// @Failure 400 {object} model.ErrorResponse
// @Failure 500 {object} model.ErrorResponse
// @Router /api/v1/goods/{id}/modifiers/{modifierId} [delete]
func (h *Handler) DetachModifierFromGood(c echo.Context) error {
	goodID := strings.TrimSpace(c.Param("id"))
	if goodID == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"Good ID is required",
			"missing path parameter: id",
			http.StatusBadRequest,
		))
	}

	modifierID := strings.TrimSpace(c.Param("modifierId"))
	if modifierID == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"Modifier ID is required",
			"missing path parameter: modifierId",
			http.StatusBadRequest,
		))
	}

	if err := h.service.GoodsModifier().DetachModifierFromGood(c.Request().Context(), goodID, modifierID); err != nil {
		log.Printf("DetachModifierFromGood failed for good %s modifier %s: %v", goodID, modifierID, err)
		return respondDomainError(c, "Failed to detach modifier from good", err)
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse(
		"Modifier detached from good successfully",
		map[string]interface{}{},
		http.StatusOK,
	))
}
