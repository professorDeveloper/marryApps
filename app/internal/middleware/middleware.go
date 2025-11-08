// app/internal/middleware/middleware.go
package middleware

import (
	"time"

	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	"gitlab.yurtal.tech/company/blitz/back/internal/config"
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
