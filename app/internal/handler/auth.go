package handler

import (
	"net/http"

	"github.com/labstack/echo/v4"
	"gitlab.yurtal.tech/company/blitz/back/internal/model"
)

// Login handles user login
// @Summary User login
// @Description Authenticate user and return access token
// @Tags Auth
// @Accept json
// @Produce json
// @Param   input  body      model.LoginRequest  true  "Login credentials"
// @Success 200 {object} model.LoginResponse
// @Failure 400 {object} model.ErrorResponse
// @Failure 401 {object} model.ErrorResponse
// @Router /api/v1/auth/login [post]
func (h *Handler) Login(c echo.Context) error {
	return c.JSON(http.StatusOK, model.LoginResponse{Token: "login2"})
}
