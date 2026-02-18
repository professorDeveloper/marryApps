package handler

import (
	"log"
	"net/http"
	"strconv"

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
// @Description Retrieve all group transactions with pagination
// @Tags group-transactions
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param limit query int false "Limit" default(10)
// @Param offset query int false "Offset" default(0)
// @Success 200 {array} model.GroupTransactionResponse
// @Failure 500 {object} model.ErrorResponse
// @Router /api/v1/group-transactions [get]
func (h *Handler) GetAllGroupTransactions(c echo.Context) error {
	limit, _ := strconv.Atoi(c.QueryParam("limit"))
	offset, _ := strconv.Atoi(c.QueryParam("offset"))
	if limit <= 0 {
		limit = 10
	}

	resp, err := h.service.GroupTransaction().GetAllGroupTransactions(c.Request().Context(), int32(limit), int32(offset))
	if err != nil {
		log.Printf("GetAllGroupTransactions failed: %v", err)
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("failed to get group transactions", err.Error(), http.StatusInternalServerError))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse("Data retrieved successfully", resp, http.StatusOK))
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

// SearchGroupTransactions searches group transactions by name
// @Summary Search group transactions
// @Description Search group transactions by name
// @Tags group-transactions
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param q query string true "Search query"
// @Param limit query int false "Limit" default(10)
// @Param offset query int false "Offset" default(0)
// @Success 200 {array} model.GroupTransactionResponse
// @Failure 400 {object} model.ErrorResponse
// @Failure 500 {object} model.ErrorResponse
// @Router /api/v1/group-transactions/search [get]
func (h *Handler) SearchGroupTransactions(c echo.Context) error {
	query := c.QueryParam("q")
	if query == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("search query is required", "see logs for details", http.StatusBadRequest))
	}

	limit, _ := strconv.Atoi(c.QueryParam("limit"))
	offset, _ := strconv.Atoi(c.QueryParam("offset"))
	if limit <= 0 {
		limit = 10
	}

	resp, err := h.service.GroupTransaction().SearchGroupTransactions(c.Request().Context(), query, int32(limit), int32(offset))
	if err != nil {
		log.Printf("SearchGroupTransactions failed: %v", err)
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("failed to search group transactions", err.Error(), http.StatusInternalServerError))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse("Data retrieved successfully", resp, http.StatusOK))
}
