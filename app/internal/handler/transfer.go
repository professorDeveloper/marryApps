package handler

import (
	"log"
	"net/http"
	"strconv"

	"github.com/labstack/echo/v4"
	"gitlab.yurtal.tech/company/maryai/back/internal/model"
)

// CreateTransferBatch creates a transfer with items in one call
// @Summary Create transfer with items (batch)
// @Description Create a transfer and its items in one call. Stock is moved immediately.
// @Tags Transfers
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param request body model.CreateTransferBatchRequest true "Transfer batch request"
// @Success 201 {object} model.TransferResponse
// @Failure 400 {object} model.ErrorResponse
// @Failure 401 {object} model.ErrorResponse
// @Failure 500 {object} model.ErrorResponse
// @Router /api/v1/transfers/batch [post]
func (h *Handler) CreateTransferBatch(c echo.Context) error {
	var req model.CreateTransferBatchRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("invalid request format", err.Error(), http.StatusBadRequest))
	}

	if req.FromBranchID == "" || req.ToBranchID == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("from_branch_id and to_branch_id are required", "missing required fields", http.StatusBadRequest))
	}
	if req.FromStorageID == "" || req.ToStorageID == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("from_storage_id and to_storage_id are required", "missing required fields", http.StatusBadRequest))
	}
	if len(req.Items) == 0 {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("at least one item is required", "missing required field: items", http.StatusBadRequest))
	}

	transfer, err := h.service.Transfer().CreateTransferBatch(c.Request().Context(), req)
	if err != nil {
		log.Printf("CreateTransferBatch failed: %v", err)
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("failed to create transfer", err.Error(), http.StatusInternalServerError))
	}

	return c.JSON(http.StatusCreated, model.NewSuccessResponse("Transfer created successfully", transfer, http.StatusCreated))
}

// CreateTransfer creates a transfer header only
// @Summary Create transfer (header only)
// @Description Create a transfer without items. Items can be added later.
// @Tags Transfers
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param request body model.CreateTransferRequest true "Transfer request"
// @Success 201 {object} model.TransferResponse
// @Failure 400 {object} model.ErrorResponse
// @Failure 401 {object} model.ErrorResponse
// @Failure 500 {object} model.ErrorResponse
// @Router /api/v1/transfers [post]
func (h *Handler) CreateTransfer(c echo.Context) error {
	var req model.CreateTransferRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("invalid request format", err.Error(), http.StatusBadRequest))
	}

	transfer, err := h.service.Transfer().CreateTransfer(c.Request().Context(), req)
	if err != nil {
		log.Printf("CreateTransfer failed: %v", err)
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("failed to create transfer", err.Error(), http.StatusInternalServerError))
	}

	return c.JSON(http.StatusCreated, model.NewSuccessResponse("Transfer created successfully", transfer, http.StatusCreated))
}

// AddTransferItems adds items to an existing transfer
// @Summary Add items to transfer
// @Description Add items to an existing active transfer. Stock is moved immediately.
// @Tags Transfers
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param request body model.CreateTransferItemsRequest true "Transfer items request"
// @Success 201 {object} model.TransferResponse
// @Failure 400 {object} model.ErrorResponse
// @Failure 401 {object} model.ErrorResponse
// @Failure 500 {object} model.ErrorResponse
// @Router /api/v1/transfers/items [post]
func (h *Handler) AddTransferItems(c echo.Context) error {
	var req model.CreateTransferItemsRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("invalid request format", err.Error(), http.StatusBadRequest))
	}

	if req.TransferID == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("transfer_id is required", "missing required field", http.StatusBadRequest))
	}
	if len(req.Items) == 0 {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("at least one item is required", "missing required field: items", http.StatusBadRequest))
	}

	transfer, err := h.service.Transfer().AddTransferItems(c.Request().Context(), req)
	if err != nil {
		log.Printf("AddTransferItems failed: %v", err)
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("failed to add transfer items", err.Error(), http.StatusInternalServerError))
	}

	return c.JSON(http.StatusCreated, model.NewSuccessResponse("Transfer items added successfully", transfer, http.StatusCreated))
}

// GetTransferByID retrieves a transfer with its items
// @Summary Get transfer by ID
// @Description Get a transfer with all its items
// @Tags Transfers
// @Produce json
// @Security BearerAuth
// @Param id path string true "Transfer ID"
// @Success 200 {object} model.TransferResponse
// @Failure 400 {object} model.ErrorResponse
// @Failure 401 {object} model.ErrorResponse
// @Failure 404 {object} model.ErrorResponse
// @Router /api/v1/transfers/{id} [get]
func (h *Handler) GetTransferByID(c echo.Context) error {
	id := c.Param("id")
	if id == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("transfer id is required", "missing path parameter: id", http.StatusBadRequest))
	}

	transfer, err := h.service.Transfer().GetTransferByID(c.Request().Context(), id)
	if err != nil {
		log.Printf("GetTransferByID failed: %v", err)
		return c.JSON(http.StatusNotFound, model.NewErrorResponse("transfer not found", err.Error(), http.StatusNotFound))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse("Transfer retrieved successfully", transfer, http.StatusOK))
}

// GetAllTransfers retrieves all transfers with pagination
// @Summary Get all transfers
// @Description Get all transfers visible to the current branch
// @Tags Transfers
// @Produce json
// @Security BearerAuth
// @Param limit query int false "Limit (default: 20)"
// @Param offset query int false "Offset (default: 0)"
// @Success 200 {array} model.TransferResponse
// @Failure 401 {object} model.ErrorResponse
// @Failure 500 {object} model.ErrorResponse
// @Router /api/v1/transfers [get]
func (h *Handler) GetAllTransfers(c echo.Context) error {
	var limit int32 = 20
	var offset int32 = 0

	if l := c.QueryParam("limit"); l != "" {
		if v, err := strconv.ParseInt(l, 10, 32); err == nil && v > 0 {
			limit = int32(v)
		}
	}
	if o := c.QueryParam("offset"); o != "" {
		if v, err := strconv.ParseInt(o, 10, 32); err == nil && v >= 0 {
			offset = int32(v)
		}
	}

	transfers, err := h.service.Transfer().GetAllTransfers(c.Request().Context(), limit, offset)
	if err != nil {
		log.Printf("GetAllTransfers failed: %v", err)
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("failed to retrieve transfers", err.Error(), http.StatusInternalServerError))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse("Transfers retrieved successfully", transfers, http.StatusOK))
}

// DeleteTransfer soft deletes a transfer and reverses stock
// @Summary Delete transfer
// @Description Soft delete a transfer and reverse all stock changes
// @Tags Transfers
// @Produce json
// @Security BearerAuth
// @Param id path string true "Transfer ID"
// @Success 204 "Transfer deleted successfully"
// @Failure 400 {object} model.ErrorResponse
// @Failure 401 {object} model.ErrorResponse
// @Failure 500 {object} model.ErrorResponse
// @Router /api/v1/transfers/{id} [delete]
func (h *Handler) DeleteTransfer(c echo.Context) error {
	id := c.Param("id")
	if id == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("transfer id is required", "missing path parameter: id", http.StatusBadRequest))
	}

	if err := h.service.Transfer().DeleteTransfer(c.Request().Context(), id); err != nil {
		log.Printf("DeleteTransfer failed: %v", err)
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("failed to delete transfer", err.Error(), http.StatusInternalServerError))
	}

	return c.NoContent(http.StatusNoContent)
}

// UpsertTransferItems replaces all items of a transfer in one call, reversing old stock and applying new quantities.
// @Summary Batch update transfer items
// @Description Replaces all transfer items. Old stock changes are reversed, then new quantities are applied.
// @Tags Transfers
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "Transfer ID"
// @Param input body model.UpsertTransferItemsRequest true "New transfer items"
// @Success 200 {object} model.TransferResponse "Updated transfer with new items"
// @Failure 400 {object} model.ErrorResponse
// @Failure 404 {object} model.ErrorResponse
// @Failure 500 {object} model.ErrorResponse
// @Router /api/v1/transfers/{id}/items/batch [put]
func (h *Handler) UpsertTransferItems(c echo.Context) error {
	id := c.Param("id")
	if id == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("transfer id is required", "missing path parameter: id", http.StatusBadRequest))
	}

	var req model.UpsertTransferItemsRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("invalid request body", err.Error(), http.StatusBadRequest))
	}

	resp, err := h.service.Transfer().UpsertTransferItems(c.Request().Context(), id, req)
	if err != nil {
		log.Printf("UpsertTransferItems failed: %v", err)
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("failed to update transfer items", err.Error(), http.StatusInternalServerError))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse("Transfer items updated successfully", resp, http.StatusOK))
}

// DeleteTransferItem removes a single item and reverses its stock
// @Summary Delete transfer item
// @Description Delete a single transfer item and reverse its stock change
// @Tags Transfers
// @Produce json
// @Security BearerAuth
// @Param id path string true "Transfer Item ID"
// @Success 204 "Transfer item deleted successfully"
// @Failure 400 {object} model.ErrorResponse
// @Failure 401 {object} model.ErrorResponse
// @Failure 500 {object} model.ErrorResponse
// @Router /api/v1/transfers/items/{id} [delete]
func (h *Handler) DeleteTransferItem(c echo.Context) error {
	id := c.Param("id")
	if id == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("item id is required", "missing path parameter: id", http.StatusBadRequest))
	}

	if err := h.service.Transfer().DeleteTransferItem(c.Request().Context(), id); err != nil {
		log.Printf("DeleteTransferItem failed: %v", err)
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("failed to delete transfer item", err.Error(), http.StatusInternalServerError))
	}

	return c.NoContent(http.StatusNoContent)
}
