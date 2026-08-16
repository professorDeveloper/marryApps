package handler

import (
	"net/http"
	"strconv"

	"github.com/labstack/echo/v4"
	"gitlab.yurtal.tech/company/maryai/back/internal/model"
)

// CreateSeparationAct creates a new separation act
// @Summary Create separation act
// @Description Create a new separation act in draft status. Add items, then confirm to apply stock changes.
// @Tags SeparationActs
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param lang    query string false "Language (uz, ru, en)" default(uz)
// @Param request body model.CreateSeparationActRequest true "Create separation act"
// @Success 201 {object} model.SeparationActResponse
// @Failure 400 {object} model.ErrorResponse
// @Failure 500 {object} model.ErrorResponse
// @Router /api/v1/separation-acts [post]
func (h *Handler) CreateSeparationAct(c echo.Context) error {
	var req model.CreateSeparationActRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("invalid request", err.Error(), http.StatusBadRequest))
	}
	resp, err := h.service.SeparationAct().CreateSeparationAct(c.Request().Context(), &req)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("failed to create separation act", err.Error(), http.StatusInternalServerError))
	}
	return c.JSON(http.StatusCreated, model.NewSuccessResponse("Separation act created", resp, http.StatusCreated))
}

// CreateSeparationActBatch creates a separation act with items in one call
// @Summary Create separation act with items (batch)
// @Description Creates act header and upserts all output items in one request. Returns full act with stock preview.
// @Tags SeparationActs
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param lang    query string false "Language (uz, ru, en)" default(uz)
// @Param request body model.CreateSeparationActBatchRequest true "Batch create"
// @Success 201 {object} model.SeparationActWithItemsResponse
// @Failure 400 {object} model.ErrorResponse
// @Failure 500 {object} model.ErrorResponse
// @Router /api/v1/separation-acts/batch [post]
func (h *Handler) CreateSeparationActBatch(c echo.Context) error {
	var req model.CreateSeparationActBatchRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("invalid request", err.Error(), http.StatusBadRequest))
	}
	resp, err := h.service.SeparationAct().CreateSeparationActBatch(c.Request().Context(), &req)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("failed to create separation act batch", err.Error(), http.StatusInternalServerError))
	}
	return c.JSON(http.StatusCreated, model.NewSuccessResponse("Separation act created with items", resp, http.StatusCreated))
}

// GetSeparationAct returns a separation act with its items
// @Summary Get separation act by ID
// @Description Returns act header + all items with stock_before/stock_after
// @Tags SeparationActs
// @Produce json
// @Security BearerAuth
// @Param lang query string false "Language (uz, ru, en)" default(uz)
// @Param id   path  string true  "Separation Act ID"
// @Success 200 {object} model.SeparationActWithItemsResponse
// @Failure 404 {object} model.ErrorResponse
// @Router /api/v1/separation-acts/{id} [get]
func (h *Handler) GetSeparationAct(c echo.Context) error {
	id := c.Param("id")
	resp, err := h.service.SeparationAct().GetSeparationAct(c.Request().Context(), id)
	if err != nil {
		return c.JSON(http.StatusNotFound, model.NewErrorResponse("separation act not found", err.Error(), http.StatusNotFound))
	}
	return c.JSON(http.StatusOK, model.NewSuccessResponse("ok", resp, http.StatusOK))
}

// ListSeparationActs lists separation acts with filters, pagination and totals
// @Summary List separation acts
// @Description List acts filtered by storage, group, ingredient, status, date range. Returns total count and sums.
// @Tags SeparationActs
// @Produce json
// @Security BearerAuth
// @Param lang          query string false "Language (uz, ru, en)" default(uz)
// @Param storage_id    query string false "Filter by storage UUID"
// @Param group_id      query string false "Filter by group UUID"
// @Param ingredient_id query string false "Filter by source ingredient UUID"
// @Param status        query string false "Filter by status (draft/active/cancelled)"
// @Param start_date    query string false "Start date (RFC3339)"
// @Param end_date      query string false "End date (RFC3339)"
// @Param limit         query int    false "Limit"  default(20)
// @Param offset        query int    false "Offset" default(0)
// @Success 200 {object} model.SeparationActListResponse
// @Failure 500 {object} model.ErrorResponse
// @Router /api/v1/separation-acts [get]
func (h *Handler) ListSeparationActs(c echo.Context) error {
	limit := int32(20)
	offset := int32(0)
	if l, err := strconv.Atoi(c.QueryParam("limit")); err == nil && l > 0 {
		limit = int32(l)
	}
	if o, err := strconv.Atoi(c.QueryParam("offset")); err == nil && o >= 0 {
		offset = int32(o)
	}

	var storageID, groupID, ingredientID, status, startDate, endDate *string
	if v := c.QueryParam("storage_id"); v != "" {
		storageID = &v
	}
	if v := c.QueryParam("group_id"); v != "" {
		groupID = &v
	}
	if v := c.QueryParam("ingredient_id"); v != "" {
		ingredientID = &v
	}
	if v := c.QueryParam("status"); v != "" {
		status = &v
	}
	if v := c.QueryParam("start_date"); v != "" {
		startDate = &v
	}
	if v := c.QueryParam("end_date"); v != "" {
		endDate = &v
	}

	resp, err := h.service.SeparationAct().ListSeparationActs(c.Request().Context(), storageID, groupID, ingredientID, status, startDate, endDate, limit, offset)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("failed to list separation acts", err.Error(), http.StatusInternalServerError))
	}
	return c.JSON(http.StatusOK, resp)
}

// UpdateSeparationAct updates a draft separation act header
// @Summary Update separation act
// @Description Update storage, group, date, description. Only works on draft acts.
// @Tags SeparationActs
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param lang    query string false "Language (uz, ru, en)" default(uz)
// @Param id      path  string true  "Separation Act ID"
// @Param request body model.UpdateSeparationActRequest true "Update act"
// @Success 200 {object} model.SeparationActResponse
// @Failure 400 {object} model.ErrorResponse
// @Failure 500 {object} model.ErrorResponse
// @Router /api/v1/separation-acts/{id} [put]
func (h *Handler) UpdateSeparationAct(c echo.Context) error {
	id := c.Param("id")
	var req model.UpdateSeparationActRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("invalid request", err.Error(), http.StatusBadRequest))
	}
	resp, err := h.service.SeparationAct().UpdateSeparationAct(c.Request().Context(), id, &req)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("failed to update separation act", err.Error(), http.StatusInternalServerError))
	}
	return c.JSON(http.StatusOK, model.NewSuccessResponse("Separation act updated", resp, http.StatusOK))
}

// ConfirmSeparationAct confirms a draft act and applies all stock changes
// @Summary Confirm separation act
// @Description Confirms act: removes source ingredient qty from source storage, adds output items to their storages, saves stock snapshots.
// @Tags SeparationActs
// @Produce json
// @Security BearerAuth
// @Param lang query string false "Language (uz, ru, en)" default(uz)
// @Param id   path  string true  "Separation Act ID"
// @Success 200 {object} model.SeparationActResponse
// @Failure 400 {object} model.ErrorResponse
// @Failure 500 {object} model.ErrorResponse
// @Router /api/v1/separation-acts/{id}/confirm [post]
func (h *Handler) ConfirmSeparationAct(c echo.Context) error {
	id := c.Param("id")
	resp, err := h.service.SeparationAct().ConfirmSeparationAct(c.Request().Context(), id)
	if err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("failed to confirm separation act", err.Error(), http.StatusBadRequest))
	}
	return c.JSON(http.StatusOK, model.NewSuccessResponse("Separation act confirmed, stock updated", resp, http.StatusOK))
}

// CancelSeparationAct cancels a draft separation act
// @Summary Cancel separation act
// @Description Cancels a draft act (no stock change)
// @Tags SeparationActs
// @Produce json
// @Security BearerAuth
// @Param lang query string false "Language (uz, ru, en)" default(uz)
// @Param id   path  string true  "Separation Act ID"
// @Success 200 {object} model.SeparationActResponse
// @Failure 400 {object} model.ErrorResponse
// @Failure 500 {object} model.ErrorResponse
// @Router /api/v1/separation-acts/{id}/cancel [post]
func (h *Handler) CancelSeparationAct(c echo.Context) error {
	id := c.Param("id")
	resp, err := h.service.SeparationAct().CancelSeparationAct(c.Request().Context(), id)
	if err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("failed to cancel separation act", err.Error(), http.StatusBadRequest))
	}
	return c.JSON(http.StatusOK, model.NewSuccessResponse("Separation act cancelled", resp, http.StatusOK))
}

// DeleteSeparationAct soft-deletes a separation act (reverses stock if active)
// @Summary Delete separation act
// @Description Soft-deletes a separation act. If confirmed (active), reverses all stock changes first.
// @Tags SeparationActs
// @Produce json
// @Security BearerAuth
// @Param lang query string false "Language (uz, ru, en)" default(uz)
// @Param id   path  string true  "Separation Act ID"
// @Success 200 {object} model.SuccessResponse
// @Failure 500 {object} model.ErrorResponse
// @Router /api/v1/separation-acts/{id} [delete]
func (h *Handler) DeleteSeparationAct(c echo.Context) error {
	id := c.Param("id")
	if err := h.service.SeparationAct().DeleteSeparationAct(c.Request().Context(), id); err != nil {
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("failed to delete separation act", err.Error(), http.StatusInternalServerError))
	}
	return c.JSON(http.StatusOK, model.NewSuccessResponse("Separation act deleted", struct{}{}, http.StatusOK))
}

// UpsertSeparationActItems adds or updates output items on a draft separation act
// @Summary Upsert separation act items
// @Description Add/update multiple output ingredient items. Returns items with live stock preview.
// @Tags SeparationActs
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param lang    query string false "Language (uz, ru, en)" default(uz)
// @Param id      path  string true  "Separation Act ID"
// @Param request body model.UpsertSeparationActItemsRequest true "Items to upsert"
// @Success 200 {object} []model.SeparationActItemResponse
// @Failure 400 {object} model.ErrorResponse
// @Failure 500 {object} model.ErrorResponse
// @Router /api/v1/separation-acts/{id}/items [post]
func (h *Handler) UpsertSeparationActItems(c echo.Context) error {
	id := c.Param("id")
	var req model.UpsertSeparationActItemsRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("invalid request", err.Error(), http.StatusBadRequest))
	}
	resp, err := h.service.SeparationAct().UpsertSeparationActItems(c.Request().Context(), id, &req)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("failed to upsert items", err.Error(), http.StatusInternalServerError))
	}
	return c.JSON(http.StatusOK, model.NewSuccessResponse("Items saved", resp, http.StatusOK))
}

// DeleteSeparationActItem removes an output item from a draft separation act
// @Summary Delete separation act item
// @Description Remove an output ingredient item from a draft act
// @Tags SeparationActs
// @Produce json
// @Security BearerAuth
// @Param lang    query string false "Language (uz, ru, en)" default(uz)
// @Param id      path  string true  "Separation Act ID"
// @Param item_id path  string true  "Item ID"
// @Success 200 {object} model.SuccessResponse
// @Failure 500 {object} model.ErrorResponse
// @Router /api/v1/separation-acts/{id}/items/{item_id} [delete]
func (h *Handler) DeleteSeparationActItem(c echo.Context) error {
	itemID := c.Param("item_id")
	if err := h.service.SeparationAct().DeleteSeparationActItem(c.Request().Context(), itemID); err != nil {
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("failed to delete item", err.Error(), http.StatusInternalServerError))
	}
	return c.JSON(http.StatusOK, model.NewSuccessResponse("Item deleted", struct{}{}, http.StatusOK))
}
