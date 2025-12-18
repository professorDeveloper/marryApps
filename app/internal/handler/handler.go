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
			auth.POST("/login", h.Login, mw.LoginRateLimiter(),mw.CheckLanguage(), mw.ValidateLoginInput)
			auth.POST("/register", h.RegisterUser,mw.CheckLanguage(), mw.ValidateRegisterInput)
			auth.POST("/refresh",h.Refresh,mw.CheckLanguage())
			auth.POST("/login/with-google", h.RegisterWithGoogle,mw.CheckLanguage())
		}
		payments := api.Group("/payments")
		{
			payments.POST("/create", h.CreateInvoice,mw.CheckLanguage(),mw.CheckAuth(h.cfg))
		}
		levelPrice := api.Group("/level-price")
		{
			levelPrice.POST("/create", h.createLevelPrice,mw.CheckLanguage(),mw.CheckAuth(h.cfg))
		}
		user := api.Group("/user")
		{
			user.GET("/me", h.GetUser,mw.CheckLanguage(),mw.CheckAuth(h.cfg))
			user.PUT("/update", h.UpdateUser,mw.CheckLanguage(),mw.CheckAuth(h.cfg))
			user.PUT("/password-update", h.UpdatePassword,mw.CheckLanguage(),mw.CheckAuth(h.cfg))
			user.POST("/image", h.UploadImage,mw.CheckLanguage(),mw.CheckAuth(h.cfg))
			user.POST("/image/download", h.DownloadImage,mw.CheckLanguage(),mw.CheckAuth(h.cfg))
		}
		libarary := api.Group("/library")
		{
			libarary.POST("/book", h.UploadBook,mw.CheckLanguage(),mw.CheckAuth(h.cfg))
			libarary.POST("/book/download", h.DownloadBook,mw.CheckLanguage(),mw.CheckAuth(h.cfg))
			libarary.POST("/audio", h.UploadAudio,mw.CheckLanguage(),mw.CheckAuth(h.cfg))
			libarary.POST("/audio/download", h.DownloadAudio,mw.CheckLanguage(),mw.CheckAuth(h.cfg))
			libarary.POST("/video", h.UploadVideo,mw.CheckLanguage(),mw.CheckAuth(h.cfg))
			libarary.POST("/video/download", h.DownloadVideo,mw.CheckLanguage(),mw.CheckAuth(h.cfg))
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
