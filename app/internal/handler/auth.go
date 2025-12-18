package handler

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/labstack/echo/v4"
	"gitlab.yurtal.tech/company/blitz/back/internal/model"
	"google.golang.org/api/idtoken"
)

// Login handles user login
// @Summary User login
// @Description Authenticate user and return access token and password gonna be YYYYMMDD
// @Tags auth
// @Accept json
// @Produce json
// @Param request body model.LoginRequest true "Login credentials"
// @Success 200 {object} model.LoginResponse "Successfully logged in"
// @Failure 400 {object} model.ErrorResponse "Invalid request format"
// @Failure 401 {object} model.ErrorResponse "Unauthorized"
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
			log.Printf("Failed to bind login request: %v", err)
			return c.JSON(http.StatusBadRequest, model.ErrorResponse{Message: "invalid request body"})
		}
	}
	lang := c.Get("language").(string)

	resp, err := h.service.Auth().Login(c.Request().Context(), req, &h.cfg.Jwt)
	if err != nil {
		log.Printf("Login failed: %v", err)

		if lang == "de" {
			return c.JSON(http.StatusUnauthorized, model.ErrorResponse{Message: "Ungültige Anmeldeinformationen"})
		}
		return c.JSON(http.StatusUnauthorized, model.ErrorResponse{Message: "Fehler beim Anmelden"})
	}

	return c.JSON(http.StatusOK, resp)
}

// RegisterUser handles user registration
// @Summary Register a new user account
// @Description Register a new user with phone number and date of birth. Password is automatically generated from date of birth in YYYYMMDD format. User role defaults to 'student' if not provided.
// @Tags auth
// @Accept json
// @Produce json
// @Param input body model.RegisterRequest true "User registration data"
// @Success 201 {object} model.RegisterResponse "User successfully registered"
// @Failure 400 {object} model.ErrorResponse "Bad request - invalid input, missing required fields, or user already exists with phone number"
// @Failure 500 {object} model.ErrorResponse "Internal server error"
// @Router /api/v1/auth/register [post]
func (h *Handler) RegisterUser(c echo.Context) error {
	var req model.RegisterRequest

	if v := c.Get("register_request"); v != nil {
		if r, ok := v.(*model.RegisterRequest); ok {
			req = *r
		} else {
			log.Printf("Failed to parse register request from context")
			return c.JSON(http.StatusBadRequest, model.ErrorResponse{
				Message: "invalid request data",
			})
		}
	} else {
		if err := c.Bind(&req); err != nil {
			log.Printf("Failed to bind register request: %v", err)
			return c.JSON(http.StatusBadRequest, model.ErrorResponse{
				Message: "invalid request format",
			})
		}

		if req.PhoneNumber == "" {
			return c.JSON(http.StatusBadRequest, model.ErrorResponse{
				Message: "phone number is required",
			})
		}

		if req.FullName == "" {
			return c.JSON(http.StatusBadRequest, model.ErrorResponse{
				Message: "full name is required",
			})
		}

		// Validate date of birth format
		if req.DateOfBirth == "" {
			return c.JSON(http.StatusBadRequest, model.ErrorResponse{
				Message: "date of birth is required in YYYY-MM-DD format",
			})
		}
		// Basic format validation
		_, err := time.Parse("2006-01-02", req.DateOfBirth)
		if err != nil {
			return c.JSON(http.StatusBadRequest, model.ErrorResponse{
				Message: "invalid date format, expected YYYY-MM-DD",
			})
		}
	}

	log.Printf("Register request received - Phone: %s, Name: %s", req.PhoneNumber, req.FullName)

	err := h.service.Auth().Register(c.Request().Context(), req)
	if err != nil {
		log.Printf("Registration failed for phone %s: %v", req.PhoneNumber, err)
		return c.JSON(http.StatusBadRequest, model.ErrorResponse{
			Message: "registration failed: " + err.Error(),
		})
	}

	log.Printf("User successfully registered with phone: %s", req.PhoneNumber)
	return c.JSON(http.StatusCreated, model.RegisterResponse{
		Message: "User registered successfully",
	})
}

// Refresh handles token refresh
// @Summary Token refresh
// @Description Refresh access token using refresh token
// @Tags auth
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param input body model.RefreshRequest true "Refresh token"
// @Success 200 {object} model.RefreshResponse "Token refreshed successfully"
// @Failure 400 {object} model.ErrorResponse "Invalid request format"
// @Failure 401 {object} model.ErrorResponse "Invalid or expired refresh token"
// @Router /api/v1/auth/refresh [post]
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
// @Tags auth
// @Accept json
// @Produce json
// @Param input body model.GoogleAuthRequest true "Google auth request"
// @Success 200 {object} model.LoginResponse "Successfully authenticated with Google"
// @Failure 400 {object} model.ErrorResponse "Invalid request body or app type"
// @Failure 401 {object} model.ErrorResponse "Invalid Google ID Token"
// @Router /api/v1/auth/login/with-google [post]
func (h *Handler) RegisterWithGoogle(c echo.Context) error {
	req := new(model.GoogleAuthRequest)
	lang := c.Get("language").(string)

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
		message := model.GetLocalizedMessage(lang, "invalid_app_type")
		return c.JSON(http.StatusBadRequest, model.ErrorResponse{Message: message})
	}

	payload, err := idtoken.Validate(context.Background(), req.IDToken, clientId)
	if err != nil {
		return c.JSON(http.StatusUnauthorized, map[string]string{"error": "Invalid Google ID Token"})
	}
	email, _ := payload.Claims["email"].(string)
	name, _ := payload.Claims["name"].(string)

	resp, err := h.service.Auth().LoginWithEmail(c.Request().Context(), model.LoginEmailRequest{
		Email:    email,
		IdToken:  req.IDToken,
		FullName: name,
	}, &h.cfg.Jwt)
	if err != nil {
		fmt.Println(err)
		message := model.GetLocalizedMessage(lang, "google_login_failed")
		return c.JSON(http.StatusUnauthorized, model.ErrorResponse{Message: message})
	}

	return c.JSON(http.StatusOK, resp)
}
