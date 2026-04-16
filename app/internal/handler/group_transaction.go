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

// CreateGroupTransaction creates a new group transaction
// @Summary Create group transaction
// @Description Create a new group transaction
// @Tags group-transactions
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param request body model.CreateGroupTransactionRequest true "Create group transaction request"
// @Success 201 {object} model.GroupTransactionResponse
// @Failure 400 {object} model.ErrorResponse
// @Failure 401 {object} model.ErrorResponse
// @Failure 500 {object} model.ErrorResponse
// @Router /api/v1/group-transactions [post]
func (h *Handler) CreateGroupTransaction(c echo.Context) error {
	var req model.CreateGroupTransactionRequest
	if err := c.Bind(&req); err != nil {
		log.Printf("Failed to bind create group transaction request: %v", err)
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("invalid request format", "see logs for details", http.StatusBadRequest))
	}

	if req.Name == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("name is required", "see logs for details", http.StatusBadRequest))
	}

	resp, err := h.service.GroupTransaction().CreateGroupTransaction(c.Request().Context(), &req)
	if err != nil {
		log.Printf("CreateGroupTransaction failed: %v", err)
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("failed to create group transaction", err.Error(), http.StatusInternalServerError))
	}

	return c.JSON(http.StatusCreated, model.NewSuccessResponse("Group transaction created successfully", resp, http.StatusCreated))
}

// GetGroupTransactionByID retrieves a group transaction by ID
// @Summary Get group transaction by ID
// @Description Retrieve a group transaction by its ID
// @Tags group-transactions
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "Group Transaction ID"
// @Success 200 {object} model.GroupTransactionResponse
// @Failure 400 {object} model.ErrorResponse
// @Failure 500 {object} model.ErrorResponse
// @Router /api/v1/group-transactions/{id} [get]
func (h *Handler) GetGroupTransactionByID(c echo.Context) error {
	id := c.Param("id")
	if _, err := uuid.Parse(id); err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("invalid id format", "see logs for details", http.StatusBadRequest))
	}

	resp, err := h.service.GroupTransaction().GetGroupTransactionByID(c.Request().Context(), id)
	if err != nil {
		log.Printf("GetGroupTransactionByID failed: %v", err)
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("failed to get group transaction", err.Error(), http.StatusInternalServerError))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse("Data retrieved successfully", resp, http.StatusOK))
}

// GetAllGroupTransactions retrieves all group transactions with pagination
// @Summary Get all group transactions
// @Description Retrieve all group transactions with pagination, optional search and sorting
// @Tags group-transactions
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param search query string false "Search by group transaction name"
// @Param sort_by query string false "Sort by field" Enums(name,created_at) default(created_at)
// @Param sort_order query string false "Sort order" Enums(asc,desc) default(desc)
// @Param limit query int false "Limit" default(10)
// @Param offset query int false "Offset" default(0)
// @Success 200 {object} model.PaginatedGroupTransactionsResponse
// @Failure 400 {object} model.ErrorResponse
// @Failure 500 {object} model.ErrorResponse
// @Router /api/v1/group-transactions [get]
func (h *Handler) GetAllGroupTransactions(c echo.Context) error {
	limit := 10
	offset := 0

	if l := c.QueryParam("limit"); l != "" {
		val, err := strconv.Atoi(l)
		if err != nil || val <= 0 {
			return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
				"invalid limit",
				"limit must be a positive integer",
				http.StatusBadRequest,
			))
		}
		limit = val
	}

	if o := c.QueryParam("offset"); o != "" {
		val, err := strconv.Atoi(o)
		if err != nil || val < 0 {
			return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
				"invalid offset",
				"offset must be a non-negative integer",
				http.StatusBadRequest,
			))
		}
		offset = val
	}

	filter := model.GroupTransactionListFilter{
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
			"invalid sort_by",
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
			"invalid sort_order",
			"allowed values: asc, desc",
			http.StatusBadRequest,
		))
	}

	resp, total, err := h.service.GroupTransaction().GetAllGroupTransactions(
		c.Request().Context(),
		filter,
		int32(limit),
		int32(offset),
	)
	if err != nil {
		log.Printf("GetAllGroupTransactions failed: %v", err)
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse(
			"failed to get group transactions",
			err.Error(),
			http.StatusInternalServerError,
		))
	}

	return c.JSON(http.StatusOK, model.NewPaginatedResponse(
		"Group transactions retrieved successfully",
		resp,
		int32(total),
		int32(limit),
		int32(offset),
		http.StatusOK,
	))
}

// UpdateGroupTransaction updates a group transaction
// @Summary Update group transaction
// @Description Update a group transaction by its ID
// @Tags group-transactions
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "Group Transaction ID"
// @Param request body model.UpdateGroupTransactionRequest true "Update group transaction request"
// @Success 200 {object} model.GroupTransactionResponse
// @Failure 400 {object} model.ErrorResponse
// @Failure 500 {object} model.ErrorResponse
// @Router /api/v1/group-transactions/{id} [put]
func (h *Handler) UpdateGroupTransaction(c echo.Context) error {
	id := c.Param("id")
	if _, err := uuid.Parse(id); err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("invalid id format", "see logs for details", http.StatusBadRequest))
	}

	var req model.UpdateGroupTransactionRequest
	if err := c.Bind(&req); err != nil {
		log.Printf("Failed to bind update group transaction request: %v", err)
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("invalid request format", "see logs for details", http.StatusBadRequest))
	}

	resp, err := h.service.GroupTransaction().UpdateGroupTransaction(c.Request().Context(), id, &req)
	if err != nil {
		log.Printf("UpdateGroupTransaction failed: %v", err)
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("failed to update group transaction", err.Error(), http.StatusInternalServerError))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse("Group transaction updated successfully", resp, http.StatusOK))
}

// DeleteGroupTransaction soft deletes a group transaction
// @Summary Delete group transaction
// @Description Soft delete a group transaction by its ID
// @Tags group-transactions
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "Group Transaction ID"
// @Success 200 {object} model.SuccessResponse
// @Failure 400 {object} model.ErrorResponse
// @Failure 500 {object} model.ErrorResponse
// @Router /api/v1/group-transactions/{id} [delete]
func (h *Handler) DeleteGroupTransaction(c echo.Context) error {
	id := c.Param("id")
	if _, err := uuid.Parse(id); err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("invalid id format", "see logs for details", http.StatusBadRequest))
	}

	if err := h.service.GroupTransaction().DeleteGroupTransaction(c.Request().Context(), id); err != nil {
		log.Printf("DeleteGroupTransaction failed: %v", err)
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("failed to delete group transaction", err.Error(), http.StatusInternalServerError))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse("Group transaction deleted successfully", map[string]interface{}{}, http.StatusOK))
}

// RestoreGroupTransaction restores a deleted group transaction
// @Summary Restore group transaction
// @Description Restore a previously deleted group transaction
// @Tags group-transactions
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "Group Transaction ID"
// @Success 200 {object} model.GroupTransactionResponse
// @Failure 400 {object} model.ErrorResponse
// @Failure 500 {object} model.ErrorResponse
// @Router /api/v1/group-transactions/{id}/restore [post]
func (h *Handler) RestoreGroupTransaction(c echo.Context) error {
	id := c.Param("id")
	if _, err := uuid.Parse(id); err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("invalid id format", "see logs for details", http.StatusBadRequest))
	}

	resp, err := h.service.GroupTransaction().RestoreGroupTransaction(c.Request().Context(), id)
	if err != nil {
		log.Printf("RestoreGroupTransaction failed: %v", err)
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("failed to restore group transaction", err.Error(), http.StatusInternalServerError))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse("Group transaction restored successfully", resp, http.StatusOK))
}
