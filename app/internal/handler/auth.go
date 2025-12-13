package handler

import (
	"context"
	"fmt"
	"net/http"

	"github.com/labstack/echo/v4"
	"gitlab.yurtal.tech/company/blitz/back/internal/model"
	"google.golang.org/api/idtoken"
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
// @Param Accept-Language header string false "Tilni belgilash uchun (masalan: uz,de)" default(uz) 
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
	lang := c.Get("language").(string)

	resp, err := h.service.Auth().Login(c.Request().Context(), req, &h.cfg.Jwt)
	if err != nil {
		fmt.Println(model.ErrorResponse{Message: err.Error()})

		if lang == "de" {
			return c.JSON(http.StatusUnauthorized, model.ErrorResponse{Message: "Ungültige Anmeldeinformationen"})
		}
		return c.JSON(http.StatusUnauthorized, model.ErrorResponse{Message: "Fehler beim Anmelden"})
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
	lang := c.Get("language").(string)

	err := h.service.Auth().Register(c.Request().Context(), req)
	if err != nil {
		if lang == "de" {
			return c.JSON(http.StatusBadRequest, model.ErrorResponse{Message: "Fehler beim Registrieren"})
		}
		return c.JSON(http.StatusBadRequest, model.ErrorResponse{Message: "Register qilishda xatolik"})
	}

	return c.JSON(http.StatusCreated, model.RegisterResponse{Message: "User successfully registered"})
}

// Refresh handles token refresh
// @Summary Token refresh
// @Description Refresh access token using refresh token
// @Tags Auth
// @Accept json
// @Produce json
// @Param   input  body      model.RefreshRequest  true  "Refresh token"
// @Success 200 {object} model.RefreshResponse
// @Failure 401 {object} model.ErrorResponse
// @Router /api/v1/auth/refresh [post]
// @Param Accept-Language header string false "Tilni belgilash uchun (masalan: uz,de)" default(uz) 

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
	lang := c.Get("language").(string)
	resp, err := h.service.Auth().Refresh(c.Request().Context(), req, &h.cfg.Jwt)
	if err != nil {
		fmt.Println(err)
		if lang == "de" {
			return c.JSON(http.StatusUnauthorized, model.ErrorResponse{Message: "Fehler beim Anmelden"})
		}
		return c.JSON(http.StatusUnauthorized, model.ErrorResponse{Message: "Login qilishda xatolik"})
	}

	return c.JSON(http.StatusOK, resp)
}

// RegisterWithGoogle handles user registration with Google
// @Summary User registration with Google
// @Description Register a new user using Google and return token with user data
// @Tags Auth
// @Accept json
// @Produce json
// @Param   input  body      model.GoogleAuthRequest  true  "Google auth request"
// @Success 200 {object} model.LoginResponse
// @Failure 400 {object} model.ErrorResponse
// @Failure 401 {object} model.ErrorResponse
// @Router /api/v1/auth/login/with-google [post]
// @Param Accept-Language header string false "Tilni belgilash uchun (masalan: uz,de)" default(uz) 

func (h *Handler) RegisterWithGoogle(c echo.Context) error {
	req := new(model.GoogleAuthRequest)

	if err := c.Bind(req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Invalid request body"})
	}
	var clientId string
	switch req.AppType {
	case "web":
		clientId = h.cfg.Google.WebClientId
	case "android":
		clientId = h.cfg.Google.AndroidClientId
	case "ios":
		clientId = h.cfg.Google.IOSClientId
	default:
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Invalid app type"})
	}

	payload, err := idtoken.Validate(context.Background(), req.IDToken, clientId)
	if err != nil {
		return c.JSON(http.StatusUnauthorized, map[string]string{"error": "Invalid Google ID Token"})
	}
	email, _ := payload.Claims["email"].(string)
	name, _ := payload.Claims["name"].(string)
	lang := c.Get("language").(string)

	resp, err := h.service.Auth().LoginWithEmail(c.Request().Context(), model.LoginEmailRequest{
		Email:    email,
		IdToken:  req.IDToken,
		FullName: name,
	}, &h.cfg.Jwt)
	if err != nil {
		fmt.Println(err)
		if lang == "de" {
			return c.JSON(http.StatusUnauthorized, model.ErrorResponse{Message: "Fehler beim Google Anmelden"})
		}
		return c.JSON(http.StatusUnauthorized, model.ErrorResponse{Message: "Google bilan login qilishda xatolik"})
	}

	return c.JSON(http.StatusOK, resp)
}
