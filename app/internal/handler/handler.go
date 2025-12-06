package handler

import (
	"github.com/labstack/echo-contrib/prometheus"
	"github.com/labstack/echo/v4"
	"gitlab.yurtal.tech/company/blitz/back/internal/config"
	mw "gitlab.yurtal.tech/company/blitz/back/internal/middleware"
	"gitlab.yurtal.tech/company/blitz/back/internal/service"
	"gitlab.yurtal.tech/company/blitz/back/pkg/logger"
)

type Handler struct {
	logger  *logger.Logger
	service service.I
	cfg     *config.Config
}

func (h *Handler) Register(router *echo.Echo) {
	p := prometheus.NewPrometheus("echo", nil)
	p.Use(router)

	api := router.Group("/api/v1")
	{
		auth := api.Group("/auth")
		{
			auth.POST("/login", h.Login, mw.LoginRateLimiter(), mw.ValidateLoginInput)
			auth.POST("/register", h.RegisterUser, mw.ValidateRegisterInput)
			auth.POST("/refresh", h.Refresh)
			auth.POST("/login/with-google", h.RegisterWithGoogle)
		}
	}

}

func New(logger *logger.Logger, cfg *config.Config, service service.I) *Handler {
	return &Handler{
		logger:  logger,
		service: service,
		cfg:     cfg,
	}
}
