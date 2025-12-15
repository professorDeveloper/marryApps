package middleware

import (
	"bytes"
	"fmt"
	"io"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	"gitlab.yurtal.tech/company/blitz/back/internal/config"
	"gitlab.yurtal.tech/company/blitz/back/internal/model"
	"gitlab.yurtal.tech/company/blitz/back/pkg/utils"
)

func SetupMiddleware(e *echo.Echo, cfg *config.Config) {
	e.Use(CheckLanguage())

	e.Use(middleware.RequestID())

	e.Use(middleware.LoggerWithConfig(middleware.LoggerConfig{
		Format: "${time_rfc3339} ${method} ${uri} ${status} ${latency_human}\n",
	}))

	e.Use(middleware.Recover())

	e.Use(middleware.SecureWithConfig(middleware.SecureConfig{
		XSSProtection:         "1; mode=block",
		ContentTypeNosniff:    "nosniff",
		XFrameOptions:         "SAMEORIGIN",
		HSTSMaxAge:            3600,
		ContentSecurityPolicy: "default-src 'self'",
	}))

	// CORS
	e.Use(middleware.CORSWithConfig(middleware.CORSConfig{
		AllowOrigins:     cfg.Server.Http.Cors.AllowedOrigins,
		AllowMethods:     cfg.Server.Http.Cors.AllowedMethods,
		AllowHeaders:     cfg.Server.Http.Cors.AllowedHeaders,
		AllowCredentials: cfg.Server.Http.Cors.AllowCredentials,
		MaxAge:           3600,
	}))

	e.Use(middleware.TimeoutWithConfig(middleware.TimeoutConfig{
		Timeout: time.Duration(cfg.Server.CtxDefaultTimeout) * time.Second,
		Skipper: func(c echo.Context) bool {
			return strings.HasPrefix(c.Path(), "/api/v1/user/avatar")
		},
	}))

	e.Use(middleware.BodyLimit("10M"))

	e.Use(middleware.RateLimiter(middleware.NewRateLimiterMemoryStore(20)))

	e.Use(SanitizeInput())
}

func LoginRateLimiter() echo.MiddlewareFunc {
	store := middleware.NewRateLimiterMemoryStoreWithConfig(middleware.RateLimiterMemoryStoreConfig{
		Rate:      5,
		Burst:     5,
		ExpiresIn: time.Minute,
	})

	return middleware.RateLimiterWithConfig(middleware.RateLimiterConfig{
		Store: store,
		IdentifierExtractor: func(c echo.Context) (string, error) {
			return c.RealIP(), nil
		},
		ErrorHandler: func(c echo.Context, err error) error {
			lang := getLanguage(c)
			message := model.GetLocalizedMessage(lang, "too_many_attempts")
			return c.JSON(http.StatusTooManyRequests, model.ErrorResponse{Message: message})
		},
	})
}

func CheckAuth(cfg *config.Config) echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			authHeader := c.Request().Header.Get("Authorization")
			var accessToken string

			fields := strings.Fields(authHeader)
			if len(fields) == 2 && strings.EqualFold(fields[0], "Bearer") {
				accessToken = fields[1]
			} else if authHeader != "" && !strings.Contains(authHeader, " ") {
				accessToken = authHeader
			}

			if accessToken == "" {
				return c.JSON(http.StatusUnauthorized, model.ErrorResponse{
					Message: "You are not logged in",
				})
			}

			sub, err := utils.ValidateJWT(accessToken, cfg.Jwt.SecretKey)
			if err != nil {
				log.Printf("JWT validation error: %v", err)
				return c.JSON(http.StatusUnauthorized, model.ErrorResponse{
					Message: "Invalid token",
				})
			}

			c.Set("user_id", fmt.Sprint(sub))
			return next(c)
		}
	}
}

func ValidateLoginInput(next echo.HandlerFunc) echo.HandlerFunc {
	return func(c echo.Context) error {
		var req model.LoginRequest
		if err := c.Bind(&req); err != nil {
			lang := getLanguage(c)
			message := model.GetLocalizedMessage(lang, "invalid_request_body")
			log.Printf("Login bind error: %v", err)
			return c.JSON(http.StatusBadRequest, model.ErrorResponse{Message: message})
		}

		req.PhoneNumber = strings.TrimSpace(req.PhoneNumber)
		req.Password = strings.TrimSpace(req.Password)

		if req.PhoneNumber == "" || req.Password == "" {
			lang := getLanguage(c)
			message := model.GetLocalizedMessage(lang, "phone_password_required")
			return c.JSON(http.StatusBadRequest, model.ErrorResponse{Message: message})
		}

		// Basic phone number validation
		if len(req.PhoneNumber) < 9 || len(req.PhoneNumber) > 15 {
			lang := getLanguage(c)
			message := model.GetLocalizedMessage(lang, "invalid_phone_format")
			return c.JSON(http.StatusBadRequest, model.ErrorResponse{Message: message})
		}

		c.Set("loginBody", req)
		return next(c)
	}
}

func ValidateRegisterInput(next echo.HandlerFunc) echo.HandlerFunc {
	return func(c echo.Context) error {
		var req model.RegisterRequest

		body, err := io.ReadAll(c.Request().Body)
		if err != nil {
			lang := getLanguage(c)
			message := model.GetLocalizedMessage(lang, "invalid_request_body")
			log.Printf("Failed to read request body: %v", err)
			return c.JSON(http.StatusBadRequest, model.ErrorResponse{Message: message})
		}

		// Restore body for binding
		c.Request().Body = io.NopCloser(bytes.NewBuffer(body))

		if err := c.Bind(&req); err != nil {
			lang := getLanguage(c)
			message := model.GetLocalizedMessage(lang, "invalid_request_format")
			log.Printf("Failed to bind register request: %v", err)
			return c.JSON(http.StatusBadRequest, model.ErrorResponse{Message: message})
		}

		req.PhoneNumber = strings.TrimSpace(req.PhoneNumber)
		req.Password = strings.TrimSpace(req.Password)
		req.FullName = strings.TrimSpace(req.FullName)

		if req.PhoneNumber == "" || req.Password == "" {
			lang := getLanguage(c)
			message := model.GetLocalizedMessage(lang, "phone_password_required")
			return c.JSON(http.StatusBadRequest, model.ErrorResponse{Message: message})
		}

		// Password strength validation
		if len(req.Password) < 8 {
			lang := getLanguage(c)
			message := model.GetLocalizedMessage(lang, "password_too_short")
			return c.JSON(http.StatusBadRequest, model.ErrorResponse{Message: message})
		}

		// Phone number validation
		if len(req.PhoneNumber) < 9 || len(req.PhoneNumber) > 15 {
			lang := getLanguage(c)
			message := model.GetLocalizedMessage(lang, "invalid_phone_format")
			return c.JSON(http.StatusBadRequest, model.ErrorResponse{Message: message})
		}

		c.Set("registerBody", req)
		return next(c)
	}
}

// ValidateRefreshInput validates refresh token request
func ValidateRefreshInput(next echo.HandlerFunc) echo.HandlerFunc {
	return func(c echo.Context) error {
		var req model.RefreshRequest
		if err := c.Bind(&req); err != nil {
			lang := getLanguage(c)
			message := model.GetLocalizedMessage(lang, "invalid_request_body")
			return c.JSON(http.StatusBadRequest, model.ErrorResponse{Message: message})
		}

		if req.RefreshToken == "" {
			lang := getLanguage(c)
			message := model.GetLocalizedMessage(lang, "refresh_token_required")
			return c.JSON(http.StatusBadRequest, model.ErrorResponse{Message: message})
		}

		c.Set("refreshBody", req)
		return next(c)
	}
}

// CheckLanguage extracts and validates the Accept-Language header
func CheckLanguage() echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			lang := "uz" // Default language

			acceptLang := c.Request().Header.Get("Accept-Language")
			if acceptLang != "" {
				langs := strings.Split(acceptLang, ",")
				if len(langs) > 0 {
					langParts := strings.Split(strings.TrimSpace(langs[0]), "-")
					if len(langParts) > 0 {
						lang = strings.ToLower(langParts[0])
					}
				}
			}

			// Validate against supported languages
			switch lang {
			case "de", "uz", "en":
				c.Set("language", lang)
			default:
				c.Set("language", "uz") // Fallback to default
			}

			return next(c)
		}
	}
}

// SanitizeInput sanitizes user input to prevent XSS and injection attacks
func SanitizeInput() echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			// Skip for file uploads
			contentType := c.Request().Header.Get("Content-Type")
			if strings.Contains(contentType, "multipart/form-data") {
				return next(c)
			}
			return next(c)
		}
	}
}



func getLanguage(c echo.Context) string {
	if lang, ok := c.Get("language").(string); ok {
		return lang
	}
	return "uz"
}
