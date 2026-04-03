package handler

import (
	"log"
	"net/http"

	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
	"gitlab.yurtal.tech/company/maryai/back/internal/model"
)

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