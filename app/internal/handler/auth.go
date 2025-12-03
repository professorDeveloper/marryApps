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
	var req model.LoginRequest
	if v := c.Get("loginBody"); v != nil {
		if r, ok := v.(model.LoginRequest); ok {
			req = r
		} else {
			return c.JSON(http.StatusBadRequest, model.ErrorResponse{Message: "invalid request body"})
		}
	} else {
		if err := c.Bind(&req); err != nil {
			return c.JSON(http.StatusBadRequest, model.ErrorResponse{Message: "invalid request body"})
		}
	}

	resp, err := h.service.Auth().Login(c.Request().Context(), req, &h.cfg.Jwt)
	if err != nil {
		return c.JSON(http.StatusUnauthorized, model.ErrorResponse{Message: err.Error()})
	}

	return c.JSON(http.StatusOK, resp)
}

// Register handles user registration
// @Summary User registration
// @Description Register a new user and return token with user data
// @Tags Auth
// @Accept json
// @Produce json
// @Param   input  body      model.RegisterRequest  true  "Registration data"
// @Success 201
// @Failure 400 {object} model.ErrorResponse
// @Router /api/v1/auth/register [post]
func (h *Handler) RegisterUser(c echo.Context) error {
	var req model.RegisterRequest
	if v := c.Get("registerBody"); v != nil {
		if r, ok := v.(model.RegisterRequest); ok {
			req = r
		} else {
			return c.JSON(http.StatusBadRequest, model.ErrorResponse{Message: "invalid request body"})
		}
	} else {
		if err := c.Bind(&req); err != nil {
			return c.JSON(http.StatusBadRequest, model.ErrorResponse{Message: "invalid request body"})
		}
	}

	err := h.service.Auth().Register(c.Request().Context(), req)
	if err != nil {
		return c.JSON(http.StatusBadRequest, model.ErrorResponse{Message: err.Error()})
	}

	return c.NoContent(http.StatusCreated)
}

// Refresh handles token refresh
// @Summary Token refresh
// @Description Refresh access token using refresh token
// @Tags Auth
// @Accept json
// @Produce json
// @Success 200 {object} model.RefreshResponse
// @Failure 401 {object} model.ErrorResponse
// @Router /api/v1/auth/refresh [get]
func (h *Handler) Refresh(c echo.Context) error {
	var req model.RefreshRequest
	if v := c.Get("refreshBody"); v != nil {
		if r, ok := v.(model.RefreshRequest); ok {
			req = r
		} else {
			return c.JSON(http.StatusBadRequest, model.ErrorResponse{Message: "invalid request body"})
		}
	} else {
		if err := c.Bind(&req); err != nil {
			return c.JSON(http.StatusBadRequest, model.ErrorResponse{Message: "invalid request body"})
		}
	}
	resp, err := h.service.Auth().Refresh(c.Request().Context(), req, &h.cfg.Jwt)
	if err != nil {
		return c.JSON(http.StatusUnauthorized, model.ErrorResponse{Message: err.Error()})
	}

	return c.JSON(http.StatusOK, resp)
}

// Logout handles user logout
// @Summary User logout
// @Description Logout user and invalidate access and refresh tokens
// @Tags Auth
// @Accept json
// @Produce json
// @Success 200 {object} model.LogoutResponse
// @Failure 401 {object} model.ErrorResponse
// @Router /api/v1/auth/logout [get]
func (h *Handler) Logout(c echo.Context) error {
	err := h.service.Auth().Logout(c.Request().Context())
	if err != nil {
		return c.JSON(http.StatusUnauthorized, model.ErrorResponse{Message: err.Error()})
	}
	return c.JSON(http.StatusOK, model.LogoutResponse{Message: "logout successful"})
}
