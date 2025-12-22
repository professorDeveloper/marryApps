package handler

import (
	"github.com/labstack/echo-contrib/prometheus"
	"github.com/labstack/echo/v4"
	"gitlab.yurtal.tech/company/maryai/back/internal/config"
	mw "gitlab.yurtal.tech/company/maryai/back/internal/middleware"
	"gitlab.yurtal.tech/company/maryai/back/internal/service"
	"gitlab.yurtal.tech/company/maryai/back/pkg/logger"
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
			auth.POST("/login", h.Login, mw.LoginRateLimiter(), mw.CheckLanguage(), mw.ValidateLoginInput)
			auth.POST("/register", h.RegisterUser, mw.CheckLanguage(), mw.ValidateRegisterInput)
			auth.POST("/refresh", h.Refresh, mw.CheckLanguage())
		}
		payments := api.Group("/payments")
		{
			payments.POST("/create", h.CreateInvoice, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
		}

		user := api.Group("/user")
		{
			user.GET("/me", h.GetUser, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
			user.PUT("/update", h.UpdateUser, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
			user.PUT("/password-update", h.UpdatePassword, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
		}

		// User management endpoints
		users := api.Group("/users")
		{
			users.GET("/by-role", h.GetUsersByRole, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
			users.GET("/staff", h.GetAllStaff, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
			users.GET("/kitchen-staff", h.GetKitchenStaff, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
			users.GET("/waiters", h.GetWaiters, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
			users.GET("/cashiers", h.GetCashiers, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
			users.GET("/search", h.SearchUsers, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
			users.DELETE("/:id", h.DeleteUser, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
			users.POST("/:id/restore", h.RestoreUser, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
		}

		// Shift management endpoints
		shifts := api.Group("/shifts")
		{
			shifts.POST("", h.CreateShift, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
			shifts.GET("", h.GetAllShifts, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
			shifts.GET("/:id", h.GetShiftByID, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
			shifts.PUT("/:id", h.UpdateShift, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
			shifts.DELETE("/:id", h.DeleteShift, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
			shifts.GET("/branch/:branchId", h.GetShiftsByBranchID, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
		}

		// Branch management endpoints
		branches := api.Group("/branches")
		{
			branches.POST("", h.CreateBranch, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
			branches.GET("", h.GetAllBranches, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
			branches.GET("/:id", h.GetBranchByID, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
			branches.DELETE("/:id", h.DeleteBranch, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
			branches.POST("/:id/restore", h.RestoreBranch, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
		}

		// Translation management endpoints
		translations := api.Group("/translations")
		{
			translations.POST("", h.CreateTranslation, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
			translations.GET("", h.GetAllTranslations, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
			translations.GET("/:id", h.GetTranslationByID, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
			translations.DELETE("/:id", h.DeleteTranslation, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
			translations.POST("/:id/restore", h.RestoreTranslation, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
		}

		// Storage management endpoints
		storages := api.Group("/storages")
		{
			storages.POST("", h.CreateStorage, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
			storages.GET("", h.GetAllStorages, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
			storages.GET("/:id", h.GetStorageByID, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
			storages.GET("/branch/:branchId", h.GetStoragesByBranchID, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
			storages.PUT("/:id", h.UpdateStorage, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
			storages.DELETE("/:id", h.DeleteStorage, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
			storages.POST("/:id/restore", h.RestoreStorage, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
			storages.GET("/search", h.SearchStorages, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
		}

		// Department management endpoints
		departments := api.Group("/departments")
		{
			departments.POST("", h.CreateDepartment, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
			departments.GET("", h.GetAllDepartments, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
			departments.GET("/:id", h.GetDepartmentByID, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
			departments.GET("/storage/:storageId", h.GetDepartmentsByStorageID, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
			departments.PUT("/:id", h.UpdateDepartment, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
			departments.DELETE("/:id", h.DeleteDepartment, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
			departments.POST("/:id/restore", h.RestoreDepartment, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
			departments.GET("/search", h.SearchDepartments, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
		}

		// Hall management endpoints
		halls := api.Group("/halls")
		{
			halls.POST("", h.CreateHall, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
			halls.GET("", h.GetAllHalls, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
			halls.GET("/:id", h.GetHallByID, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
			halls.GET("/branch/:branchId", h.GetHallsByBranchID, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
			halls.PUT("/:id", h.UpdateHall, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
			halls.DELETE("/:id", h.DeleteHall, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
			halls.POST("/:id/restore", h.RestoreHall, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
			halls.GET("/search", h.SearchHalls, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
		}

		media := api.Group("/media")
		{
			media.POST("/video", h.UploadVideo, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
			media.GET("/video/download", h.DownloadVideo, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
			media.POST("/image", h.UploadImage, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
			media.GET("/image/download", h.DownloadImage, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
		}

		ingredientGroups := api.Group("/ingredient-groups")
		{
			ingredientGroups.POST("", h.CreateIngredientGroup, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
			ingredientGroups.GET("", h.GetAllIngredientGroups, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
			ingredientGroups.GET("/:id", h.GetIngredientGroupByID, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
			ingredientGroups.PUT("/:id", h.UpdateIngredientGroup, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
			ingredientGroups.DELETE("/:id", h.DeleteIngredientGroup, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
			ingredientGroups.POST("/:id/restore", h.RestoreIngredientGroup, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
		}

		ingredients := api.Group("/ingredients")
		{
			ingredients.POST("", h.CreateIngredient, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
			ingredients.GET("", h.GetAllIngredients, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
			ingredients.GET("/group/:groupId", h.GetIngredientsByGroupID, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
			ingredients.GET("/:id", h.GetIngredientByID, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
			ingredients.PUT("/:id", h.UpdateIngredient, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
			ingredients.DELETE("/:id", h.DeleteIngredient, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
			ingredients.POST("/:id/restore", h.RestoreIngredient, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
		}

		ingredientStock := api.Group("/ingredient-stock")
		{
			ingredientStock.POST("", h.CreateIngredientStock, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
			ingredientStock.GET("", h.GetAllIngredientStock, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
			ingredientStock.GET("/by-ingredient-branch", h.GetStockByIngredientAndBranch, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
			ingredientStock.GET("/branch/:branchId", h.GetStockByBranchID, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
			ingredientStock.GET("/ingredient/:ingredientId", h.GetStockByIngredientID, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
			ingredientStock.GET("/:id", h.GetIngredientStockByID, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
			ingredientStock.PUT("/:id", h.UpdateIngredientStock, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
			ingredientStock.POST("/:id/add", h.AddToIngredientStock, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
			ingredientStock.POST("/:id/remove", h.RemoveFromIngredientStock, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
			ingredientStock.DELETE("/:id", h.DeleteIngredientStock, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
			ingredientStock.POST("/:id/restore", h.RestoreIngredientStock, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
		}

		categories := api.Group("/categories")
		{
			categories.POST("", h.CreateCategory, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
			categories.GET("", h.GetAllCategories, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
			categories.GET("/:id", h.GetCategoryByID, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
			categories.GET("/department/:departmentId", h.GetCategoriesByDepartmentID, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
			categories.GET("/storage/:storageId", h.GetCategoriesByStorageID, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
			categories.GET("/parent/:parentId", h.GetCategoriesByParentID, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
			categories.GET("/root", h.GetRootCategories, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
			categories.GET("/search", h.SearchCategories, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
			categories.PUT("/:id", h.UpdateCategory, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
			categories.DELETE("/:id", h.DeleteCategory, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
			categories.POST("/:id/restore", h.RestoreCategory, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
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
