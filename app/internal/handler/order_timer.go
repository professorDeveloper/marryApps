package handler

import (
	"log"
	"net/http"
	"strings"

	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
	"gitlab.yurtal.tech/company/maryai/back/internal/model"
)

// StartOrderTableTimer godoc
// @Summary Start order table timer
// @Description Starts table timer for a time-based table if needed
// @Tags order-table-timer
// @Security BearerAuth
// @Produce json
// @Param id path string true "Order ID"
// @Success 200 {object} model.SuccessResponse{data=model.TableTimerResponse}
// @Failure 400 {object} model.ErrorResponse
// @Failure 401 {object} model.ErrorResponse
// @Failure 403 {object} model.ErrorResponse
// @Router /api/v1/orders/{id}/table-timer/start [post]
func (h *Handler) StartOrderTableTimer(c echo.Context) error {
	orderID := c.Param("id")
	if orderID == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"order id is required",
			"missing path parameter: id",
			http.StatusBadRequest,
		))
	}
	if _, err := uuid.Parse(orderID); err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"invalid order id format",
			err.Error(),
			http.StatusBadRequest,
		))
	}

	userID, _ := c.Get("user_id").(string)
	role, _ := c.Get("role").(string)

	resp, err := h.service.TableTimer().StartTableTimerIfNeeded(c.Request().Context(), orderID, userID, role)
	if err != nil {
		log.Printf("StartOrderTableTimer failed for order %s: %v", orderID, err)
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"failed to start table timer",
			err.Error(),
			http.StatusBadRequest,
		))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse(
		"Table timer started successfully",
		resp,
		http.StatusOK,
	))
}

// GetOrderTableTimer godoc
// @Summary Get order table timer
// @Description Returns current table timer state for the order
// @Tags order-table-timer
// @Security BearerAuth
// @Produce json
// @Param id path string true "Order ID"
// @Success 200 {object} model.SuccessResponse{data=model.TableTimerResponse}
// @Failure 400 {object} model.ErrorResponse
// @Failure 401 {object} model.ErrorResponse
// @Failure 403 {object} model.ErrorResponse
// @Router /api/v1/orders/{id}/table-timer [get]
func (h *Handler) GetOrderTableTimer(c echo.Context) error {
	orderID := c.Param("id")
	if orderID == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"order id is required",
			"missing path parameter: id",
			http.StatusBadRequest,
		))
	}
	if _, err := uuid.Parse(orderID); err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"invalid order id format",
			err.Error(),
			http.StatusBadRequest,
		))
	}

	resp, err := h.service.TableTimer().GetTableTimerState(c.Request().Context(), orderID)
	if err != nil {
		log.Printf("GetOrderTableTimer failed for order %s: %v", orderID, err)
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"failed to get table timer",
			err.Error(),
			http.StatusBadRequest,
		))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse(
		"Table timer retrieved successfully",
		resp,
		http.StatusOK,
	))
}

// PauseOrderTableTimer godoc
// @Summary Pause order table timer
// @Description Pauses the active table timer for the given order
// @Tags order-table-timer
// @Security BearerAuth
// @Produce json
// @Param id path string true "Order ID"
// @Success 200 {object} model.SuccessResponse{data=model.TableTimerResponse}
// @Failure 400 {object} model.ErrorResponse
// @Failure 401 {object} model.ErrorResponse
// @Failure 403 {object} model.ErrorResponse
// @Router /api/v1/orders/{id}/table-timer/pause [post]
func (h *Handler) PauseOrderTableTimer(c echo.Context) error {
	orderID := c.Param("id")
	if orderID == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"order id is required",
			"missing path parameter: id",
			http.StatusBadRequest,
		))
	}
	if _, err := uuid.Parse(orderID); err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"invalid order id format",
			err.Error(),
			http.StatusBadRequest,
		))
	}

	userID, _ := c.Get("user_id").(string)
	role, _ := c.Get("role").(string)

	resp, err := h.service.TableTimer().PauseTableTimer(c.Request().Context(), orderID, userID, role)
	if err != nil {
		log.Printf("PauseOrderTableTimer failed for order %s: %v", orderID, err)
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"failed to pause table timer",
			err.Error(),
			http.StatusBadRequest,
		))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse(
		"Table timer paused successfully",
		resp,
		http.StatusOK,
	))
}

// ResumeOrderTableTimer godoc
// @Summary Resume order table timer
// @Description Resumes a paused table timer for the given order
// @Tags order-table-timer
// @Security BearerAuth
// @Produce json
// @Param id path string true "Order ID"
// @Success 200 {object} model.SuccessResponse{data=model.TableTimerResponse}
// @Failure 400 {object} model.ErrorResponse
// @Failure 401 {object} model.ErrorResponse
// @Failure 403 {object} model.ErrorResponse
// @Router /api/v1/orders/{id}/table-timer/resume [post]
func (h *Handler) ResumeOrderTableTimer(c echo.Context) error {
	orderID := c.Param("id")
	if orderID == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"order id is required",
			"missing path parameter: id",
			http.StatusBadRequest,
		))
	}
	if _, err := uuid.Parse(orderID); err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"invalid order id format",
			err.Error(),
			http.StatusBadRequest,
		))
	}

	userID, _ := c.Get("user_id").(string)
	role, _ := c.Get("role").(string)

	resp, err := h.service.TableTimer().ResumeTableTimer(c.Request().Context(), orderID, userID, role)
	if err != nil {
		log.Printf("ResumeOrderTableTimer failed for order %s: %v", orderID, err)
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"failed to resume table timer",
			err.Error(),
			http.StatusBadRequest,
		))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse(
		"Table timer resumed successfully",
		resp,
		http.StatusOK,
	))
}

// TransferOrderTableTimer godoc
// @Summary Transfer order table timer to another table
// @Description Transfers the active table timer session to a different table
// @Tags order-table-timer
// @Security BearerAuth
// @Produce json
// @Param id path string true "Session ID"
// @Param request body object{to_table_id=string,reason=string} true "Transfer request"
// @Success 200 {object} model.SuccessResponse{data=model.TableTimerResponse}
// @Failure 400 {object} model.ErrorResponse
// @Failure 401 {object} model.ErrorResponse
// @Failure 403 {object} model.ErrorResponse
// @Failure 409 {object} model.ErrorResponse
// @Router /api/v1/orders/{id}/table-timer/transfer [post]
func (h *Handler) TransferOrderTableTimer(c echo.Context) error {
	sessionID := c.Param("id")
	if sessionID == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"session id is required",
			"missing path parameter: id",
			http.StatusBadRequest,
		))
	}
	if _, err := uuid.Parse(sessionID); err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"invalid session id format",
			err.Error(),
			http.StatusBadRequest,
		))
	}

	var req struct {
		ToTableID string `json:"to_table_id" validate:"required"`
		Reason    string `json:"reason"`
	}
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"invalid request body",
			err.Error(),
			http.StatusBadRequest,
		))
	}

	if req.ToTableID == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"to_table_id is required",
			"missing required field: to_table_id",
			http.StatusBadRequest,
		))
	}
	if _, err := uuid.Parse(req.ToTableID); err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"invalid to_table_id format",
			err.Error(),
			http.StatusBadRequest,
		))
	}

	userID, _ := c.Get("user_id").(string)
	role, _ := c.Get("role").(string)

	resp, err := h.service.TableTimer().TransferTableTimer(c.Request().Context(), sessionID, req.ToTableID, req.Reason, userID, role)
	if err != nil {
		log.Printf("TransferOrderTableTimer failed for session %s: %v", sessionID, err)

		errText := err.Error()

		if strings.Contains(errText, "not found") {
			return c.JSON(http.StatusNotFound, model.NewErrorResponse(
				"timer session not found",
				errText,
				http.StatusNotFound,
			))
		}

		if strings.Contains(errText, "already busy") ||
			strings.Contains(errText, "must be running to transfer") ||
			strings.Contains(errText, "same as current") ||
			strings.Contains(errText, "active segment not found") {
			return c.JSON(http.StatusConflict, model.NewErrorResponse(
				"transfer conflict",
				errText,
				http.StatusConflict,
			))
		}

		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"failed to transfer table timer",
			errText,
			http.StatusBadRequest,
		))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse(
		"Table timer transferred successfully",
		resp,
		http.StatusOK,
	))
}
