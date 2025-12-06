// app/internal/middleware/middleware.go
package middleware

import (
	"fmt"
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
	// Request ID
	e.Use(middleware.RequestID())

	// Logger
	e.Use(middleware.Logger())

	// Recover from panics
	e.Use(middleware.Recover())

	// CORS
	e.Use(middleware.CORSWithConfig(middleware.CORSConfig{
		AllowOrigins:     cfg.Server.Http.Cors.AllowedOrigins,
		AllowMethods:     cfg.Server.Http.Cors.AllowedMethods,
		AllowHeaders:     cfg.Server.Http.Cors.AllowedHeaders,
		AllowCredentials: cfg.Server.Http.Cors.AllowCredentials,
	}))

	// Timeout
	e.Use(middleware.TimeoutWithConfig(middleware.TimeoutConfig{
		Timeout: time.Duration(cfg.Server.CtxDefaultTimeout) * time.Second,
	}))

	// Rate limiter
	e.Use(middleware.RateLimiter(middleware.NewRateLimiterMemoryStore(20)))
}

// LoginRateLimiter limits login attempts per IP to mitigate brute-force attacks
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
			return c.JSON(http.StatusTooManyRequests, model.ErrorResponse{Message: "too many login attempts"})
		},
	})
}

// CheckAuth is an auth middleware that validates JWT access token and sets user_id in context.
// It looks for token in Authorization: Bearer header first, then in "access_token" cookie.
func CheckAuth(cfg *config.Config) echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			var accessToken string

			authHeader := c.Request().Header.Get("Authorization")
			fields := strings.Fields(authHeader)
			if len(fields) == 2 && strings.EqualFold(fields[0], "Bearer") {
				accessToken = fields[1]
			} 

			if accessToken == "" {
				return c.JSON(http.StatusUnauthorized, model.ErrorResponse{Message: "you are not logged in"})
			}

			sub, err := utils.ValidateJWT(accessToken, cfg.Jwt.SecretKey)
			if err != nil {
				return c.JSON(http.StatusUnauthorized, model.ErrorResponse{Message: err.Error()})
			}

			c.Set("user_id", fmt.Sprint(sub))
			return next(c)
		}
	}
}

// ValidateLoginInput binds and validates login request body before reaching handler
func ValidateLoginInput(next echo.HandlerFunc) echo.HandlerFunc {
	return func(c echo.Context) error {
		var req model.LoginRequest
		if err := c.Bind(&req); err != nil {
			return c.JSON(http.StatusBadRequest, model.ErrorResponse{Message: "invalid request body"})
		}
		if req.PhoneNumber == "" || req.Password == "" {
			return c.JSON(http.StatusBadRequest, model.ErrorResponse{Message: "phone number and password are required"})
		}

		c.Set("loginBody", req)
		return next(c)
	}
}

// ValidateRegisterInput binds and validates registration request body before reaching handler
func ValidateRegisterInput(next echo.HandlerFunc) echo.HandlerFunc {
	return func(c echo.Context) error {
		var req model.RegisterRequest
		if err := c.Bind(&req); err != nil {
			return c.JSON(http.StatusBadRequest, model.ErrorResponse{Message: "invalid request body"})
		}
		if req.PhoneNumber == "" || req.Password == "" {
			return c.JSON(http.StatusBadRequest, model.ErrorResponse{Message: "phone number and password are required"})
		}

		c.Set("registerBody", req)
		return next(c)
	}

}
