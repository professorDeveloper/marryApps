package handler

import (
	"net/http"

	"github.com/labstack/echo/v4"
	"gitlab.yurtal.tech/company/blitz/back/internal/model"
)

// createLevelPrice godoc
// @Summary Create a new price level
// @Description Creates a new price for a specific level in the system
// @Tags level-prices
// @Accept json
// @Produce json
// @Security ApiKeyAuth
// @Param Authorization header string true "Bearer token" default(Bearer <your_token>)
// @Param request body model.CreatePriceForLevelRequest true "Price level creation details"
// @Success 200 {object} model.CreatePriceForLevelResponse "Successfully created price level"
// @Failure 400 {object} model.CreatePriceForLevelResponse "Invalid request or price level already exists"
// @Failure 401 {object} model.CreatePriceForLevelResponse "Unauthorized - Invalid or missing token"
// @Failure 500 {object} model.CreatePriceForLevelResponse "Internal server error"
// @Router /level-price/create [post]
func (h *Handler) createLevelPrice(c echo.Context) error {
	var req model.CreatePriceForLevelRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, model.CreatePriceForLevelResponse{
			Error:     -1,
			ErrorNote: "Invalid request format",
		})
	}

	resp, err := h.service.Mixed().CreateLevelPrice(c.Request().Context(), req)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, model.CreatePriceForLevelResponse{
			Error:     -9,
			ErrorNote: "Failed to create price for level",
		})
	}

	if resp.Error != 0 {
		return c.JSON(http.StatusBadRequest, resp)
	}

	return c.JSON(http.StatusOK, resp)
}
