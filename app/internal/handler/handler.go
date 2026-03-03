package handler

import (
	"github.com/labstack/echo-contrib/prometheus"
	"github.com/labstack/echo/v4"
	"gitlab.yurtal.tech/company/maryai/back/internal/config"
	mw "gitlab.yurtal.tech/company/maryai/back/internal/middleware"
	"gitlab.yurtal.tech/company/maryai/back/internal/repository"
	"gitlab.yurtal.tech/company/maryai/back/internal/service"
	"gitlab.yurtal.tech/company/maryai/back/pkg/logger"
	"gitlab.yurtal.tech/company/maryai/back/pkg/notification"
)

type Handler struct {
	logger    *logger.Logger
	service   service.I
	cfg       *config.Config
	repo      *repository.Repository
	fcmClient *notification.FCMClient
}

func (h *Handler) Register(router *echo.Echo) {
	p := prometheus.NewPrometheus("echo", nil)
	p.Use(router)

	api := router.Group("/api/v1")

	{
		auth := api.Group("/auth")
		{
			auth.POST("/login", h.Login, mw.LoginRateLimiter(), mw.CheckLanguage(), mw.ValidateLoginInput)
			auth.POST("/login-pincode", h.LoginWithPincode, mw.LoginRateLimiter(), mw.CheckLanguage())
			auth.POST("/register", h.RegisterUser, mw.CheckLanguage(), mw.ValidateRegisterInput)
			auth.POST("/refresh", h.Refresh, mw.CheckLanguage())
		}

		// Global login
		auth.POST("/global/login", h.LoginGlobal, mw.LoginRateLimiter(), mw.CheckLanguage(), mw.ValidateLoginInput)
		payments := api.Group("/payments")
		{
			payments.POST("/create", h.CreateInvoice, mw.CheckLanguage(), mw.CheckAuth(h.cfg), mw.TenantMiddleware(h.repo))
		}

		sync := api.Group("/sync", mw.CheckAuth(h.cfg), mw.TenantMiddleware(h.repo))
		{
			sync.POST("/pull", h.SyncPull, mw.CheckLanguage())
			sync.POST("/push", h.SyncPush, mw.CheckLanguage())
			sync.GET("/change-logs", h.GetChangeLogs, mw.CheckLanguage())
		}

		user := api.Group("/user", mw.CheckAuth(h.cfg), mw.TenantMiddleware(h.repo))
		{
			user.GET("/me", h.GetUser, mw.CheckLanguage())
			user.PUT("/update", h.UpdateUser, mw.CheckLanguage())
			user.PUT("/password-update", h.UpdatePassword, mw.CheckLanguage())
		}

		// User management endpoints
		users := api.Group("/users", mw.CheckAuth(h.cfg), mw.TenantMiddleware(h.repo))
		{
			users.GET("/by-role", h.GetUsersByRole, mw.CheckLanguage())
			users.GET("/staff", h.GetAllStaff, mw.CheckLanguage())
			users.GET("/kitchen-staff", h.GetKitchenStaff, mw.CheckLanguage())
			users.GET("/waiters", h.GetWaiters, mw.CheckLanguage())
			users.GET("/cashiers", h.GetCashiers, mw.CheckLanguage())
			users.GET("/search", h.SearchUsers, mw.CheckLanguage())
			users.PUT("/:id", h.UpdateUserByID, mw.CheckLanguage())
			users.DELETE("/:id", h.DeleteUser, mw.CheckLanguage())
			users.POST("/:id/restore", h.RestoreUser, mw.CheckLanguage())
		}

		// Shift management endpoints
		shifts := api.Group("/shifts", mw.CheckAuth(h.cfg), mw.TenantMiddleware(h.repo))
		{
			shifts.POST("", h.CreateShift, mw.CheckLanguage())
			shifts.GET("", h.GetAllShifts, mw.CheckLanguage())
			shifts.GET("/:id", h.GetShiftByID, mw.CheckLanguage())
			shifts.PUT("/:id", h.UpdateShift, mw.CheckLanguage())
			shifts.DELETE("/:id", h.DeleteShift, mw.CheckLanguage())
			shifts.GET("/branch/:branchId", h.GetShiftsByBranchID, mw.CheckLanguage())
		}

		// Branch management endpoints
		branches := api.Group("/branches", mw.CheckAuth(h.cfg), mw.TenantMiddleware(h.repo))
		{
			branches.POST("", h.CreateBranch, mw.CheckLanguage())
			branches.GET("", h.GetAllBranches, mw.CheckLanguage())
			branches.GET("/:id", h.GetBranchByID, mw.CheckLanguage())
			branches.PUT("/:id", h.UpdateBranch, mw.CheckLanguage())
			branches.DELETE("/:id", h.DeleteBranch, mw.CheckLanguage())
			branches.POST("/:id/restore", h.RestoreBranch, mw.CheckLanguage())
		}

		// Branch endpoints with language support
		branchesLang := api.Group("/branches-lang", mw.CheckAuth(h.cfg), mw.TenantMiddleware(h.repo))
		{
			branchesLang.GET("/:id", h.GetBranchByIDWithLang, mw.CheckLanguage())
			branchesLang.GET("", h.GetAllBranchesWithLang, mw.CheckLanguage())
		}

		// Translation management endpoints
		translations := api.Group("/translations", mw.CheckAuth(h.cfg), mw.TenantMiddleware(h.repo))
		{
			translations.POST("", h.CreateTranslation, mw.CheckLanguage())
			translations.GET("", h.GetAllTranslations, mw.CheckLanguage())
			translations.GET("/:id", h.GetTranslationByID, mw.CheckLanguage())
			translations.PUT("/:id", h.UpdateTranslation, mw.CheckLanguage())
			translations.DELETE("/:id", h.DeleteTranslation, mw.CheckLanguage())
			translations.POST("/:id/restore", h.RestoreTranslation, mw.CheckLanguage())
		}

		// Storage management endpoints
		storages := api.Group("/storages", mw.CheckAuth(h.cfg), mw.TenantMiddleware(h.repo))
		{
			storages.POST("", h.CreateStorage, mw.CheckLanguage())
			storages.GET("", h.GetAllStorages, mw.CheckLanguage())
			storages.GET("/:id", h.GetStorageByID, mw.CheckLanguage())
			storages.GET("/branch/:branchId", h.GetStoragesByBranchID, mw.CheckLanguage())
			storages.PUT("/:id", h.UpdateStorage, mw.CheckLanguage())
			storages.DELETE("/:id", h.DeleteStorage, mw.CheckLanguage())
			storages.POST("/:id/restore", h.RestoreStorage, mw.CheckLanguage())
			storages.GET("/search", h.SearchStorages, mw.CheckLanguage())
		}

		// Storage endpoints with language support
		storagesLang := api.Group("/storages-lang", mw.CheckAuth(h.cfg), mw.TenantMiddleware(h.repo))
		{
			storagesLang.GET("/:id", h.GetStorageByIDWithLang, mw.CheckLanguage())
			storagesLang.GET("", h.GetAllStoragesWithLang, mw.CheckLanguage())
		}

		// Department management endpoints
		departments := api.Group("/departments", mw.CheckAuth(h.cfg), mw.TenantMiddleware(h.repo))
		{
			departments.POST("", h.CreateDepartment, mw.CheckLanguage())
			departments.GET("", h.GetAllDepartments, mw.CheckLanguage())
			departments.GET("/:id", h.GetDepartmentByID, mw.CheckLanguage())
			departments.GET("/storage/:storageId", h.GetDepartmentsByStorageID, mw.CheckLanguage())
			departments.PUT("/:id", h.UpdateDepartment, mw.CheckLanguage())
			departments.DELETE("/:id", h.DeleteDepartment, mw.CheckLanguage())
			departments.POST("/:id/restore", h.RestoreDepartment, mw.CheckLanguage())
			departments.GET("/search", h.SearchDepartments, mw.CheckLanguage())
		}

		// Department endpoints with language support
		departmentsLang := api.Group("/departments-lang", mw.CheckAuth(h.cfg), mw.TenantMiddleware(h.repo))
		{
			departmentsLang.GET("/:id", h.GetDepartmentByIDWithLang, mw.CheckLanguage())
			departmentsLang.GET("", h.GetAllDepartmentsWithLang, mw.CheckLanguage())
		}

		// Hall management endpoints
		halls := api.Group("/halls", mw.CheckAuth(h.cfg), mw.TenantMiddleware(h.repo))
		{
			halls.POST("", h.CreateHall, mw.CheckLanguage())
			halls.GET("/search", h.SearchHalls, mw.CheckLanguage()) // Must come before /:id
			halls.GET("/branch/:branchId", h.GetHallsByBranchID, mw.CheckLanguage())
			halls.GET("/:id", h.GetHallByID, mw.CheckLanguage())
			halls.GET("", h.GetAllHalls, mw.CheckLanguage())
			halls.GET("/halls-lang", h.GetAllHallsWithLang, mw.CheckLanguage())
			halls.PUT("/:id", h.UpdateHall, mw.CheckLanguage())
			halls.DELETE("/:id", h.DeleteHall, mw.CheckLanguage())
			halls.POST("/:id/restore", h.RestoreHall, mw.CheckLanguage())
			halls.GET("halls-lang/branch/:id", h.GetHallsByBranchID, mw.CheckLanguage())
		}

		// Hall endpoints with language support
		hallsLang := api.Group("/halls-lang", mw.CheckAuth(h.cfg), mw.TenantMiddleware(h.repo))
		{
			hallsLang.GET("/branch/:branchId", h.GetHallsByBranchIDWithLang, mw.CheckLanguage())
			hallsLang.GET("", h.GetAllHallsWithLang, mw.CheckLanguage())
		}

		media := api.Group("/media", mw.CheckAuth(h.cfg), mw.TenantMiddleware(h.repo))
		{
			media.POST("/video", h.UploadVideo, mw.CheckLanguage())
			media.POST("/video/download", h.DownloadVideo, mw.CheckLanguage())
			media.POST("/image", h.UploadImage, mw.CheckLanguage())
			media.POST("/image/download", h.DownloadImage, mw.CheckLanguage())
		}

		ingredientGroups := api.Group("/ingredient-groups", mw.CheckAuth(h.cfg), mw.TenantMiddleware(h.repo))
		{
			ingredientGroups.POST("", h.CreateIngredientGroup, mw.CheckLanguage())
			ingredientGroups.GET("", h.GetAllIngredientGroups, mw.CheckLanguage())
			ingredientGroups.GET("/:id", h.GetIngredientGroupByID, mw.CheckLanguage())
			ingredientGroups.PUT("/:id", h.UpdateIngredientGroup, mw.CheckLanguage())
			ingredientGroups.DELETE("/:id", h.DeleteIngredientGroup, mw.CheckLanguage())
			ingredientGroups.POST("/:id/restore", h.RestoreIngredientGroup, mw.CheckLanguage())
		}

		// Ingredient groups endpoints with language support
		ingredientGroupsLang := api.Group("/ingredient-groups-lang", mw.CheckAuth(h.cfg), mw.TenantMiddleware(h.repo))
		{
			ingredientGroupsLang.GET("/:id", h.GetIngredientGroupByIDWithLang, mw.CheckLanguage())
			ingredientGroupsLang.GET("", h.GetAllIngredientGroupsWithLang, mw.CheckLanguage())
		}

		ingredients := api.Group("/ingredients", mw.CheckAuth(h.cfg), mw.TenantMiddleware(h.repo))
		{
			ingredients.POST("", h.CreateIngredient, mw.CheckLanguage())
			ingredients.GET("", h.GetAllIngredients, mw.CheckLanguage())
			ingredients.GET("/group/:groupId", h.GetIngredientsByGroupID, mw.CheckLanguage())
			ingredients.GET("/:id", h.GetIngredientByID, mw.CheckLanguage())
			ingredients.PUT("/:id", h.UpdateIngredient, mw.CheckLanguage())
			ingredients.DELETE("/:id", h.DeleteIngredient, mw.CheckLanguage())
			ingredients.POST("/:id/restore", h.RestoreIngredient, mw.CheckLanguage())
		}

		// Ingredients endpoints with language support
		ingredientsLang := api.Group("/ingredients-lang", mw.CheckAuth(h.cfg), mw.TenantMiddleware(h.repo))
		{
			ingredientsLang.GET("/:id", h.GetIngredientByIDWithLang, mw.CheckLanguage())
			ingredientsLang.GET("", h.GetAllIngredientsWithLang, mw.CheckLanguage())
		}

		ingredientStock := api.Group("/ingredient-stock", mw.CheckAuth(h.cfg), mw.TenantMiddleware(h.repo))
		{
			ingredientStock.GET("", h.GetAllIngredientStock, mw.CheckLanguage())
			ingredientStock.GET("/by-ingredient-branch", h.GetStockByIngredientAndBranch, mw.CheckLanguage())
			ingredientStock.GET("/branch/:branchId", h.GetStockByBranchID, mw.CheckLanguage())
			ingredientStock.GET("/ingredient/:ingredientId", h.GetStockByIngredientID, mw.CheckLanguage())
			ingredientStock.GET(":id", h.GetIngredientStockByID, mw.CheckLanguage())
			ingredientStock.PUT(":id", h.UpdateIngredientStock, mw.CheckLanguage())
			ingredientStock.POST(":id/add", h.AddToIngredientStock, mw.CheckLanguage())
			ingredientStock.POST(":id/remove", h.RemoveFromIngredientStock, mw.CheckLanguage())
			ingredientStock.DELETE(":id", h.DeleteIngredientStock, mw.CheckLanguage())
			ingredientStock.POST(":id/restore", h.RestoreIngredientStock, mw.CheckLanguage())
		}

		ingredientReports := api.Group("/ingredient-reports", mw.CheckAuth(h.cfg), mw.TenantMiddleware(h.repo))
		{
			ingredientReports.GET("", h.GetIngredientReport, mw.CheckLanguage())
			ingredientReports.GET("/:ingredientId", h.GetIngredientReportItem, mw.CheckLanguage())
			ingredientReports.GET("/:ingredientId/movements", h.GetIngredientReportMovements, mw.CheckLanguage())
		}

		orders := api.Group("/orders", mw.CheckAuth(h.cfg), mw.TenantMiddleware(h.repo))
		{
			orders.POST("", h.CreateOrder, mw.CheckLanguage())
			orders.GET("", h.GetAllOrders, mw.CheckLanguage())
			orders.GET("/:id", h.GetOrderByID, mw.CheckLanguage())
			orders.POST("/:id/items", h.AddOrderItems, mw.CheckLanguage())
			orders.PUT("/:id", h.UpdateOrder, mw.CheckLanguage())
			orders.DELETE("/:id", h.DeleteOrder, mw.CheckLanguage())
			orders.POST("/:id/restore", h.RestoreOrder, mw.CheckLanguage())

			orders.PUT("/:id/status", h.UpdateOrderStatus, mw.CheckLanguage())
			orders.POST("/:id/pay", h.MarkOrderPaid, mw.CheckLanguage())
			orders.POST("/:id/cancel", h.CancelOrder, mw.CheckLanguage())
			orders.POST("/:id/cooking", h.MarkOrderCooking, mw.CheckLanguage())
			orders.POST("/:id/ready", h.MarkOrderReady, mw.CheckLanguage())
			orders.POST("/:id/served", h.MarkOrderServed, mw.CheckLanguage())
			orders.POST("/:id/activate", h.ActivateOrder, mw.CheckLanguage())
			orders.POST("/:id/reschedule", h.RescheduleOrder, mw.CheckLanguage())

			orders.GET("/status/:status", h.GetOrdersByStatus, mw.CheckLanguage())
			orders.GET("/table/:tableId", h.GetOrdersByTableID, mw.CheckLanguage())
			orders.GET("/waiter/:waiterId", h.GetOrdersByWaiterID, mw.CheckLanguage())
			orders.POST("/:id/assign-waiter/:waiterId", h.AssignWaiterToOrder, mw.CheckLanguage())
			orders.POST("/:id/assign-cashier/:cashierId", h.AssignCashierToOrder, mw.CheckLanguage())
		}

		bills := api.Group("/bills", mw.CheckAuth(h.cfg), mw.TenantMiddleware(h.repo))
		{
			bills.GET("", h.GetBills, mw.CheckLanguage())
			bills.GET("/:id", h.GetBillDetails, mw.CheckLanguage())
		}

		orderItems := api.Group("/order-items", mw.CheckAuth(h.cfg), mw.TenantMiddleware(h.repo))
		{
			orderItems.POST("", h.CreateOrderItem, mw.CheckLanguage())
			orderItems.GET("", h.GetAllOrderItems, mw.CheckLanguage())
			orderItems.GET("/:id", h.GetOrderItemByID, mw.CheckLanguage())
			orderItems.PUT("/:id", h.UpdateOrderItem, mw.CheckLanguage())
			orderItems.DELETE("/:id", h.DeleteOrderItem, mw.CheckLanguage())
			orderItems.POST("/:id/restore", h.RestoreOrderItem, mw.CheckLanguage())

			orderItems.GET("/order/:orderId", h.GetOrderItemsByOrderID, mw.CheckLanguage())
			orderItems.GET("/status/:status", h.GetOrderItemsByStatus, mw.CheckLanguage())
			orderItems.PUT("/:id/quantity", h.UpdateOrderItemQuantity, mw.CheckLanguage())
			orderItems.PUT("/:id/status", h.UpdateOrderItemStatus, mw.CheckLanguage())
			orderItems.POST("/:id/cancel", h.CancelOrderItem, mw.CheckLanguage())
			orderItems.POST("/:id/cooking", h.MarkOrderItemCooking, mw.CheckLanguage())
			orderItems.POST("/:id/ready", h.MarkOrderItemReady, mw.CheckLanguage())
		}

		// kitchen := api.Group("/kitchen")
		// {
		// 	kitchen.GET("/queue", h.GetKitchenQueue, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
		// }

		categories := api.Group("/categories", mw.CheckAuth(h.cfg), mw.TenantMiddleware(h.repo))
		{
			categories.POST("", h.CreateCategory, mw.CheckLanguage())
			categories.GET("", h.GetAllCategories, mw.CheckLanguage())
			categories.GET("/:id", h.GetCategoryByID, mw.CheckLanguage())
			categories.GET("/department/:departmentId", h.GetCategoriesByDepartmentID, mw.CheckLanguage())
			categories.GET("/storage/:storageId", h.GetCategoriesByStorageID, mw.CheckLanguage())
			categories.GET("/parent/:parentId", h.GetCategoriesByParentID, mw.CheckLanguage())
			categories.GET("/root", h.GetRootCategories, mw.CheckLanguage())
			categories.GET("/search", h.SearchCategories, mw.CheckLanguage())
			categories.PUT("/:id", h.UpdateCategory, mw.CheckLanguage())
			categories.DELETE("/:id", h.DeleteCategory, mw.CheckLanguage())
			categories.POST("/:id/restore", h.RestoreCategory, mw.CheckLanguage())
		}

		// Categories endpoints with language support
		categoriesLang := api.Group("/categories-lang", mw.CheckAuth(h.cfg), mw.TenantMiddleware(h.repo))
		{
			categoriesLang.GET("/:id", h.GetCategoryByIDWithLang, mw.CheckLanguage())
			categoriesLang.GET("", h.GetAllCategoriesWithLang, mw.CheckLanguage())
		}

		compounds := api.Group("/compounds", mw.CheckAuth(h.cfg), mw.TenantMiddleware(h.repo))
		{
			compounds.POST("", h.CreateCompound, mw.CheckLanguage())
			compounds.POST("/with-calculations", h.CreateCompoundWithCalculations, mw.CheckLanguage())
			compounds.GET("", h.GetAllCompounds, mw.CheckLanguage())
			compounds.GET("/:id/with-calculations", h.GetCompoundWithCalculations, mw.CheckLanguage())
			compounds.PUT("/:id/with-calculations", h.UpdateCompoundWithCalculations, mw.CheckLanguage())
			compounds.GET("/:id", h.GetCompoundByID, mw.CheckLanguage())
			compounds.GET("/department/:departmentId", h.GetCompoundsByDepartmentID, mw.CheckLanguage())
			compounds.POST("/:id/recalculate-price", h.RecalculateCompoundPrice, mw.CheckLanguage())
			compounds.PUT("/:id", h.UpdateCompound, mw.CheckLanguage())
			compounds.DELETE("/:id", h.DeleteCompound, mw.CheckLanguage())
			compounds.POST("/:id/restore", h.RestoreCompound, mw.CheckLanguage())
			compounds.GET("/search", h.SearchCompounds, mw.CheckLanguage())
			compounds.GET("/:compound_id/details", h.GetCompoundDetailsByCompound, mw.CheckLanguage())
			compounds.GET("/:compound_id/stock", h.GetCompoundStockByCompound, mw.CheckLanguage())
		}

		// Compounds endpoints with language support
		compoundsLang := api.Group("/compounds-lang", mw.CheckAuth(h.cfg), mw.TenantMiddleware(h.repo))
		{
			compoundsLang.GET("/:id", h.GetCompoundByIDWithLang, mw.CheckLanguage())
			compoundsLang.GET("", h.GetAllCompoundsWithLang, mw.CheckLanguage())
		}

		compoundDetails := api.Group("/compound-details", mw.CheckAuth(h.cfg), mw.TenantMiddleware(h.repo))
		{
			compoundDetails.POST("", h.CreateCompoundDetail, mw.CheckLanguage())
			compoundDetails.GET("/:id", h.GetCompoundDetail, mw.CheckLanguage())
			compoundDetails.PUT("/:id", h.UpdateCompoundDetail, mw.CheckLanguage())
			compoundDetails.DELETE("/:id", h.DeleteCompoundDetail, mw.CheckLanguage())
			compoundDetails.POST("/:id/restore", h.RestoreCompoundDetail, mw.CheckLanguage())
		}

		ingredientCompounds := api.Group("/ingredients/:ingredient_id/compounds", mw.CheckAuth(h.cfg), mw.TenantMiddleware(h.repo))
		{
			ingredientCompounds.GET("", h.GetCompoundDetailsByIngredient, mw.CheckLanguage())
		}

		compoundStock := api.Group("/compound-stock", mw.CheckAuth(h.cfg), mw.TenantMiddleware(h.repo))
		{
			compoundStock.POST("", h.CreateCompoundStock, mw.CheckLanguage())
			compoundStock.GET("", h.GetAllCompoundStock, mw.CheckLanguage())
			compoundStock.GET("/search", h.GetCompoundStockByBranchAndCompound, mw.CheckLanguage())
			compoundStock.GET("/:id", h.GetCompoundStock, mw.CheckLanguage())
			compoundStock.PUT("/:id", h.UpdateCompoundStock, mw.CheckLanguage())
			compoundStock.POST("/:id/add", h.AddToCompoundStock, mw.CheckLanguage())
			compoundStock.POST("/:id/remove", h.RemoveFromCompoundStock, mw.CheckLanguage())
			compoundStock.DELETE("/:id", h.DeleteCompoundStock, mw.CheckLanguage())
			compoundStock.POST("/:id/restore", h.RestoreCompoundStock, mw.CheckLanguage())
		}

		branchCompoundStock := api.Group("/branches/:branch_id/compound-stock", mw.CheckAuth(h.cfg), mw.TenantMiddleware(h.repo))
		{
			branchCompoundStock.GET("", h.GetCompoundStockByBranch, mw.CheckLanguage())
		}

		// Goods endpoints
		goods := api.Group("/goods", mw.CheckAuth(h.cfg), mw.TenantMiddleware(h.repo))
		{
			goods.POST("", h.CreateGood, mw.CheckLanguage())
			goods.POST("/with-calculations", h.CreateGoodWithCalculations, mw.CheckLanguage())
			goods.GET("", h.GetAllGoods, mw.CheckLanguage())
			goods.GET("/:id/with-calculations", h.GetGoodWithCalculations, mw.CheckLanguage())
			goods.PUT("/:id/with-calculations", h.UpdateGoodWithCalculations, mw.CheckLanguage())
			goods.GET("/:id", h.GetGood, mw.CheckLanguage())
			goods.GET("/search/by-price", h.GetGoodsByPriceRange, mw.CheckLanguage())
			goods.GET("/search", h.SearchGoods, mw.CheckLanguage())
			goods.PUT("/:id", h.UpdateGood, mw.CheckLanguage())
			goods.PUT("/:id/price", h.UpdateGoodPrice, mw.CheckLanguage())
			goods.DELETE("/:id", h.DeleteGood, mw.CheckLanguage())
			goods.POST("/:id/restore", h.RestoreGood, mw.CheckLanguage())
			// Good details endpoints
			goods.GET("/:good_id/details", h.GetGoodDetailsByGood, mw.CheckLanguage())
		}

		// Goods endpoints with language support
		goodsLang := api.Group("/goods-lang", mw.CheckAuth(h.cfg), mw.TenantMiddleware(h.repo))
		{
			goodsLang.GET("/:id", h.GetGoodByIDWithLang, mw.CheckLanguage())
			goodsLang.GET("", h.GetAllGoodsWithLang, mw.CheckLanguage())
		}

		// Good details endpoints
		goodDetails := api.Group("/good-details", mw.CheckAuth(h.cfg), mw.TenantMiddleware(h.repo))
		{
			goodDetails.POST("", h.CreateGoodDetail, mw.CheckLanguage())
			goodDetails.GET("/:id", h.GetGoodDetail, mw.CheckLanguage())
			goodDetails.PUT("/:id", h.UpdateGoodDetail, mw.CheckLanguage())
			goodDetails.PUT("/:id/quantity", h.UpdateGoodDetailQuantity, mw.CheckLanguage())
			goodDetails.DELETE("/:id", h.DeleteGoodDetail, mw.CheckLanguage())
			goodDetails.POST("/:id/restore", h.RestoreGoodDetail, mw.CheckLanguage())
		}

		// Good calculations endpoints
		goodCalcs := api.Group("/goods/calculations", mw.CheckAuth(h.cfg), mw.TenantMiddleware(h.repo))
		{
			goodCalcs.POST("", h.CreateGoodCalculation, mw.CheckLanguage())   // Create: good_id + ingredient_id/compound_to_add_id in body
			goodCalcs.GET("", h.GetGoodCalculations, mw.CheckLanguage())      // Get: good_id in body
			goodCalcs.GET("/:id", h.GetCalculation, mw.CheckLanguage())       // Get by calculation ID
			goodCalcs.PUT("/:id", h.UpdateCalculation, mw.CheckLanguage())    // Update by calculation ID
			goodCalcs.DELETE("/:id", h.DeleteCalculation, mw.CheckLanguage()) // Delete by calculation ID
		}

		// Compound calculations endpoints
		compoundCalcs := api.Group("/compounds/calculations", mw.CheckAuth(h.cfg), mw.TenantMiddleware(h.repo))
		{
			compoundCalcs.POST("", h.CreateCompoundCalculation, mw.CheckLanguage()) // Create: compound_id + ingredient_id/compound_to_add_id in body
			compoundCalcs.GET("", h.GetCompoundCalculations, mw.CheckLanguage())    // Get: compound_id as query parameter
			compoundCalcs.GET("/:id", h.GetCalculation, mw.CheckLanguage())         // Get by calculation ID
			compoundCalcs.PUT("/:id", h.UpdateCalculation, mw.CheckLanguage())      // Update by calculation ID
			compoundCalcs.DELETE("/:id", h.DeleteCalculation, mw.CheckLanguage())   // Delete by calculation ID
		}

		calculations := api.Group("/calculations", mw.CheckAuth(h.cfg), mw.TenantMiddleware(h.repo))
		{
			calculations.POST("/preview", h.PreviewCalculations, mw.CheckLanguage())
		}

		// Category goods endpoints
		categoryGoods := api.Group("/categories/:category_id/goods", mw.CheckAuth(h.cfg), mw.TenantMiddleware(h.repo))
		{
			categoryGoods.GET("", h.GetGoodsByCategory, mw.CheckLanguage())
		}

		// Department goods endpoints
		departmentGoods := api.Group("/departments/:department_id/goods", mw.CheckAuth(h.cfg), mw.TenantMiddleware(h.repo))
		{
			departmentGoods.GET("", h.GetGoodsByDepartment, mw.CheckLanguage())
		}

		// Ingredient goods endpoints
		ingredientGoods := api.Group("/ingredients/:ingredient_id/goods", mw.CheckAuth(h.cfg), mw.TenantMiddleware(h.repo))
		{
			ingredientGoods.GET("", h.GetGoodDetailsByIngredient, mw.CheckLanguage())
		}

		// Compound goods endpoints
		compoundGoods := api.Group("/compounds/:compound_id/goods", mw.CheckAuth(h.cfg), mw.TenantMiddleware(h.repo))
		{
			compoundGoods.GET("", h.GetGoodDetailsByCompound, mw.CheckLanguage())
		}

		// Cafe Table endpoints
		cafeTables := api.Group("/cafe-tables", mw.CheckAuth(h.cfg), mw.TenantMiddleware(h.repo))
		{
			cafeTables.POST("", h.CreateCafeTable, mw.CheckLanguage())
			cafeTables.GET("", h.GetAllCafeTables, mw.CheckLanguage())
			cafeTables.GET("/:id", h.GetCafeTableByID, mw.CheckLanguage())
			cafeTables.GET("/hall/:hall_id", h.GetCafeTablesByHallID, mw.CheckLanguage())
			cafeTables.GET("/status/:status", h.GetCafeTablesByStatus, mw.CheckLanguage())
			cafeTables.GET("/hall-status", h.GetCafeTablesByHallAndStatus, mw.CheckLanguage())
			cafeTables.PUT("/:id", h.UpdateCafeTable, mw.CheckLanguage())
			cafeTables.PATCH("/:id/status", h.UpdateCafeTableStatus, mw.CheckLanguage())
			cafeTables.DELETE("/:id", h.DeleteCafeTable, mw.CheckLanguage())
			cafeTables.POST("/:id/restore", h.RestoreCafeTable, mw.CheckLanguage())
			cafeTables.POST("/:id/set-free", h.SetTableFree, mw.CheckLanguage())
			cafeTables.POST("/:id/set-busy", h.SetTableBusy, mw.CheckLanguage())
			cafeTables.GET("/available/hall/:hall_id", h.GetAvailableTablesByHall, mw.CheckLanguage())
			cafeTables.GET("/available/capacity", h.GetAvailableTablesByCapacity, mw.CheckLanguage())
			cafeTables.GET("/available/hall/:hall_id/capacity", h.GetAvailableTablesByHallAndCapacity, mw.CheckLanguage())
			cafeTables.GET("/stats/occupancy", h.GetTableOccupancyStats, mw.CheckLanguage())
			cafeTables.GET("/search", h.SearchCafeTables, mw.CheckLanguage())
		}

		// Supplier management endpoints
		suppliers := api.Group("/suppliers", mw.CheckAuth(h.cfg), mw.TenantMiddleware(h.repo))
		{
			suppliers.POST("", h.CreateSupplier, mw.CheckLanguage())
			suppliers.GET("", h.GetAllSuppliers, mw.CheckLanguage())
			suppliers.GET("/:id", h.GetSupplier, mw.CheckLanguage())
			suppliers.GET("/search", h.SearchSuppliers, mw.CheckLanguage())
			suppliers.PUT("/:id", h.UpdateSupplier, mw.CheckLanguage())
			suppliers.DELETE("/:id", h.DeleteSupplier, mw.CheckLanguage())
			suppliers.POST("/:id/restore", h.RestoreSupplier, mw.CheckLanguage())
		}

		// Inventory endpoints
		inventories := api.Group("/inventories", mw.CheckAuth(h.cfg), mw.TenantMiddleware(h.repo))
		{
			inventories.POST("", h.CreateInventory, mw.CheckLanguage())
			inventories.POST("/batch", h.CreateInventoryBatch, mw.CheckLanguage())
			inventories.GET("", h.GetAllInventories, mw.CheckLanguage())
			inventories.GET("/search", h.SearchInventories, mw.CheckLanguage())
			inventories.GET("/:id", h.GetInventory, mw.CheckLanguage())
			inventories.POST("/:id/items", h.UpsertInventoryItems, mw.CheckLanguage())
			inventories.PUT("/:id/items/batch", h.UpdateInventoryItemsBatch, mw.CheckLanguage())
			inventories.GET("/:id/items", h.GetInventoryItems, mw.CheckLanguage())
			inventories.POST("/:id/calculate", h.CalculateInventory, mw.CheckLanguage())
			inventories.POST("/:id/apply", h.ApplyInventory, mw.CheckLanguage())
			inventories.PUT("/:id", h.UpdateInventory, mw.CheckLanguage())
			inventories.DELETE("/:id", h.DeleteInventory, mw.CheckLanguage())
			inventories.POST("/:id/restore", h.RestoreInventory, mw.CheckLanguage())
		}

		deductions := api.Group("/deductions", mw.CheckAuth(h.cfg), mw.TenantMiddleware(h.repo))
		{
			deductions.POST("", h.CreateDeduction, mw.CheckLanguage())
			deductions.GET("", h.GetAllDeductions, mw.CheckLanguage())
			deductions.GET("/:id", h.GetDeductionByID, mw.CheckLanguage())
			deductions.PUT("/:id", h.UpdateDeduction, mw.CheckLanguage())
			deductions.DELETE("/:id", h.DeleteDeduction, mw.CheckLanguage())
			deductions.POST("/:id/restore", h.RestoreDeduction, mw.CheckLanguage())

			deductionGroups := deductions.Group("/group")
			{
				deductionGroups.POST("", h.CreateDeductionActGroup, mw.CheckLanguage())
				deductionGroups.GET("", h.GetAllDeductionActGroups, mw.CheckLanguage())
				deductionGroups.GET("/:id", h.GetDeductionActGroupByID, mw.CheckLanguage())
				deductionGroups.PUT("/:id", h.UpdateDeductionActGroup, mw.CheckLanguage())
				deductionGroups.DELETE("/:id", h.DeleteDeductionActGroup, mw.CheckLanguage())
				deductionGroups.POST("/:id/restore", h.RestoreDeductionActGroup, mw.CheckLanguage())
			}
		}

		inventoryItems := api.Group("/inventory-items", mw.CheckAuth(h.cfg), mw.TenantMiddleware(h.repo))
		{
			inventoryItems.GET("", h.GetAllInventoryItems, mw.CheckLanguage())
			inventoryItems.PUT("/:id", h.UpdateInventoryItem, mw.CheckLanguage())
			inventoryItems.DELETE("/:id", h.DeleteInventoryItem, mw.CheckLanguage())
		}

		// Invoice endpoints (supplier invoices)
		invoices := api.Group("/invoices", mw.CheckAuth(h.cfg), mw.TenantMiddleware(h.repo))
		{
			invoices.POST("", h.CreateSupplierInvoice, mw.CheckLanguage())
			invoices.POST("/batch", h.CreateInvoiceWithDetails, mw.CheckLanguage())
			invoices.GET("", h.GetAllInvoices, mw.CheckLanguage())
			invoices.GET("/:id", h.GetInvoice, mw.CheckLanguage())
			invoices.GET("/status/:status", h.GetInvoicesByStatus, mw.CheckLanguage())
			invoices.GET("/supplier/:supplier_id", h.GetInvoicesBySupplier, mw.CheckLanguage())
			invoices.GET("/date-range", h.GetInvoicesByDateRange, mw.CheckLanguage())
			invoices.GET("/search", h.SearchInvoices, mw.CheckLanguage())
			invoices.PUT("/:id", h.UpdateInvoice, mw.CheckLanguage())
			invoices.PATCH("/:id/status", h.UpdateInvoiceStatus, mw.CheckLanguage())
			invoices.POST("/:id/mark-arrived", h.MarkInvoiceArrived, mw.CheckLanguage())
			invoices.POST("/:id/mark-received", h.MarkInvoiceReceived, mw.CheckLanguage())
			invoices.POST("/:id/cancel", h.CancelInvoice, mw.CheckLanguage())
			invoices.DELETE("/:id", h.DeleteInvoice, mw.CheckLanguage())
			invoices.POST("/:id/restore", h.RestoreInvoice, mw.CheckLanguage())
			invoices.GET("/:id/details", h.GetInvoiceWithDetails, mw.CheckLanguage())
			invoices.GET("/stats/supplier", h.GetInvoiceStatsBySupplier, mw.CheckLanguage())
			invoices.GET("/stats/date-range", h.GetInvoiceStatsByDateRange, mw.CheckLanguage())
		}

		// Invoice detail endpoints
		invoiceDetails := api.Group("/invoice-details", mw.CheckAuth(h.cfg), mw.TenantMiddleware(h.repo))
		{
			invoiceDetails.POST("", h.CreateInvoiceDetail, mw.CheckLanguage())
			invoiceDetails.POST("/batch", h.CreateInvoiceDetailsBatch, mw.CheckLanguage())
			invoiceDetails.GET("", h.GetAllInvoiceDetails, mw.CheckLanguage())
			invoiceDetails.GET("/:id", h.GetInvoiceDetail, mw.CheckLanguage())
			invoiceDetails.GET("/invoice/:invoice_id", h.GetInvoiceDetailsByInvoice, mw.CheckLanguage())
			invoiceDetails.GET("/ingredient/:ingredient_id", h.GetInvoiceDetailsByIngredient, mw.CheckLanguage())
			invoiceDetails.PUT("/:id", h.UpdateInvoiceDetail, mw.CheckLanguage())
			invoiceDetails.PUT("/:id/quantity", h.UpdateInvoiceDetailQuantity, mw.CheckLanguage())
			invoiceDetails.DELETE("/:id", h.DeleteInvoiceDetail, mw.CheckLanguage())
			invoiceDetails.POST("/:id/restore", h.RestoreInvoiceDetail, mw.CheckLanguage())
			invoiceDetails.GET("/:id/with-ingredient", h.GetInvoiceDetailWithIngredient, mw.CheckLanguage())
		}

		// Cash register management endpoints
		cashRegisters := api.Group("/cash-registers", mw.CheckAuth(h.cfg), mw.TenantMiddleware(h.repo))
		{
			cashRegisters.POST("", h.CreateCashRegister, mw.CheckLanguage())
			cashRegisters.GET("", h.GetAllCashRegisters, mw.CheckLanguage())
			cashRegisters.GET("/branch/:branchId", h.GetCashRegistersByBranchID, mw.CheckLanguage())
			cashRegisters.GET("/:id", h.GetCashRegister, mw.CheckLanguage())
			cashRegisters.PUT("/:id", h.UpdateCashRegister, mw.CheckLanguage())
			cashRegisters.DELETE("/:id", h.DeleteCashRegister, mw.CheckLanguage())
			cashRegisters.POST("/:id/restore", h.RestoreCashRegister, mw.CheckLanguage())
		}

		// Cash register shift endpoints
		cashRegisterShifts := api.Group("/cash-register-shifts", mw.CheckAuth(h.cfg), mw.TenantMiddleware(h.repo))
		{
			cashRegisterShifts.POST("", h.OpenCashRegisterShift, mw.CheckLanguage())
			cashRegisterShifts.GET("", h.ListCashRegisterShifts, mw.CheckLanguage())
			cashRegisterShifts.GET("/active", h.GetActiveCashRegisterShift, mw.CheckLanguage())
			cashRegisterShifts.GET("/:id", h.GetCashRegisterShift, mw.CheckLanguage())
			cashRegisterShifts.POST("/:id/close", h.CloseCashRegisterShift, mw.CheckLanguage())
			cashRegisterShifts.DELETE("/:id", h.DeleteCashRegisterShift, mw.CheckLanguage())
		}

		// Group transaction management endpoints
		groupTransactions := api.Group("/group-transactions", mw.CheckAuth(h.cfg), mw.TenantMiddleware(h.repo))
		{
			groupTransactions.POST("", h.CreateGroupTransaction, mw.CheckLanguage())
			groupTransactions.GET("", h.GetAllGroupTransactions, mw.CheckLanguage())
			groupTransactions.GET("/search", h.SearchGroupTransactions, mw.CheckLanguage())
			groupTransactions.GET("/:id", h.GetGroupTransactionByID, mw.CheckLanguage())
			groupTransactions.PUT("/:id", h.UpdateGroupTransaction, mw.CheckLanguage())
			groupTransactions.DELETE("/:id", h.DeleteGroupTransaction, mw.CheckLanguage())
			groupTransactions.POST("/:id/restore", h.RestoreGroupTransaction, mw.CheckLanguage())
		}

		// Transaction management endpoints
		transactions := api.Group("/transactions", mw.CheckAuth(h.cfg), mw.TenantMiddleware(h.repo))
		{
			transactions.POST("/income-expense", h.CreateIncomeExpense, mw.CheckLanguage())
			transactions.POST("/transfer", h.CreateCashTransfer, mw.CheckLanguage())
			transactions.GET("/report", h.GetCashReport, mw.CheckLanguage())
			transactions.GET("", h.GetAllTransactions, mw.CheckLanguage())
			transactions.GET("/:id", h.GetTransactionByID, mw.CheckLanguage())
			transactions.PUT("/:id", h.UpdateTransaction, mw.CheckLanguage())
			transactions.DELETE("/:id", h.DeleteTransaction, mw.CheckLanguage())
		}

		// Transfer management endpoints
		transfers := api.Group("/transfers", mw.CheckAuth(h.cfg), mw.TenantMiddleware(h.repo))
		{
			transfers.POST("/batch", h.CreateTransferBatch, mw.CheckLanguage())
			transfers.POST("/items", h.AddTransferItems, mw.CheckLanguage())
			transfers.POST("", h.CreateTransfer, mw.CheckLanguage())
			transfers.GET("", h.GetAllTransfers, mw.CheckLanguage())
			transfers.GET("/:id", h.GetTransferByID, mw.CheckLanguage())
			transfers.DELETE("/:id", h.DeleteTransfer, mw.CheckLanguage())
			transfers.DELETE("/items/:id", h.DeleteTransferItem, mw.CheckLanguage())
		}

		// Shipment endpoints (outgoing stock removal)
		shipments := api.Group("/shipments", mw.CheckAuth(h.cfg), mw.TenantMiddleware(h.repo))
		{
			shipments.POST("", h.CreateShipment, mw.CheckLanguage())
			shipments.POST("/batch", h.CreateShipmentBatch, mw.CheckLanguage())
			shipments.GET("", h.ListShipments, mw.CheckLanguage())
			shipments.GET("/:id", h.GetShipment, mw.CheckLanguage())
			shipments.PUT("/:id", h.UpdateShipment, mw.CheckLanguage())
			shipments.DELETE("/:id", h.DeleteShipment, mw.CheckLanguage())
			shipments.POST("/:id/confirm", h.ConfirmShipment, mw.CheckLanguage())
			shipments.POST("/:id/cancel", h.CancelShipment, mw.CheckLanguage())
			shipments.POST("/:id/items", h.UpsertShipmentItem, mw.CheckLanguage())
			shipments.DELETE("/:id/items/:item_id", h.DeleteShipmentItem, mw.CheckLanguage())
		}

		// Outgoing invoices (расходные накладные)
		outgoingInvoices := api.Group("/outgoing-invoices", mw.CheckAuth(h.cfg), mw.TenantMiddleware(h.repo))
		{
			outgoingInvoices.POST("", h.CreateOutgoingInvoice, mw.CheckLanguage())
			outgoingInvoices.POST("/batch", h.CreateOutgoingInvoiceBatch, mw.CheckLanguage())
			outgoingInvoices.GET("", h.ListOutgoingInvoices, mw.CheckLanguage())
			outgoingInvoices.GET("/:id", h.GetOutgoingInvoice, mw.CheckLanguage())
			outgoingInvoices.PUT("/:id", h.UpdateOutgoingInvoice, mw.CheckLanguage())
			outgoingInvoices.DELETE("/:id", h.DeleteOutgoingInvoice, mw.CheckLanguage())
			outgoingInvoices.POST("/:id/confirm", h.ConfirmOutgoingInvoice, mw.CheckLanguage())
			outgoingInvoices.POST("/:id/cancel", h.CancelOutgoingInvoice, mw.CheckLanguage())
			outgoingInvoices.POST("/:id/items", h.UpsertOutgoingInvoiceItems, mw.CheckLanguage())
			outgoingInvoices.DELETE("/:id/items/:item_id", h.DeleteOutgoingInvoiceItem, mw.CheckLanguage())
		}

		// Separation acts (акты разделки)
		separationActs := api.Group("/separation-acts", mw.CheckAuth(h.cfg), mw.TenantMiddleware(h.repo))
		{
			separationActs.POST("", h.CreateSeparationAct, mw.CheckLanguage())
			separationActs.POST("/batch", h.CreateSeparationActBatch, mw.CheckLanguage())
			separationActs.GET("", h.ListSeparationActs, mw.CheckLanguage())
			separationActs.GET("/:id", h.GetSeparationAct, mw.CheckLanguage())
			separationActs.PUT("/:id", h.UpdateSeparationAct, mw.CheckLanguage())
			separationActs.DELETE("/:id", h.DeleteSeparationAct, mw.CheckLanguage())
			separationActs.POST("/:id/confirm", h.ConfirmSeparationAct, mw.CheckLanguage())
			separationActs.POST("/:id/cancel", h.CancelSeparationAct, mw.CheckLanguage())
			separationActs.POST("/:id/items", h.UpsertSeparationActItems, mw.CheckLanguage())
			separationActs.DELETE("/:id/items/:item_id", h.DeleteSeparationActItem, mw.CheckLanguage())
		}

		// Reports
		reports := api.Group("/reports", mw.CheckAuth(h.cfg), mw.TenantMiddleware(h.repo))
		{
			reports.GET("/goods", h.GoodsReport, mw.CheckLanguage())
		}

		// Brand management endpoints (admin only)
		brands := api.Group("/admin/brands")
		{
			brands.POST("", h.CreateBrand, mw.CheckLanguage(), mw.CheckAuth(h.cfg), mw.RequireGlobalSuperadmin)
			brands.GET("", h.ListBrands, mw.CheckLanguage(), mw.CheckAuth(h.cfg), mw.RequireGlobalSuperadmin)
			brands.GET("/:id", h.GetBrand, mw.CheckLanguage(), mw.CheckAuth(h.cfg), mw.RequireGlobalSuperadmin)
			brands.PUT("/:id", h.UpdateBrand, mw.CheckLanguage(), mw.CheckAuth(h.cfg), mw.RequireGlobalSuperadmin)
			brands.DELETE("/:id", h.DeleteBrand, mw.CheckLanguage(), mw.CheckAuth(h.cfg), mw.RequireGlobalSuperadmin)

			// Brand superadmin management
			brands.POST("/:id/superadmins", h.CreateBrandSuperadmin, mw.CheckLanguage(), mw.CheckAuth(h.cfg), mw.RequireGlobalSuperadmin)
			brands.GET("/:id/superadmins", h.ListBrandSuperadmins, mw.CheckLanguage(), mw.CheckAuth(h.cfg), mw.RequireGlobalSuperadmin)
			brands.GET("/:id/superadmins/:user_id", h.GetBrandSuperadmin, mw.CheckLanguage(), mw.CheckAuth(h.cfg), mw.RequireGlobalSuperadmin)
			brands.PUT("/:id/superadmins/:user_id", h.UpdateBrandSuperadmin, mw.CheckLanguage(), mw.CheckAuth(h.cfg), mw.RequireGlobalSuperadmin)
			brands.DELETE("/:id/superadmins/:user_id", h.DeleteBrandSuperadmin, mw.CheckLanguage(), mw.CheckAuth(h.cfg), mw.RequireGlobalSuperadmin)
		}

	}

}

func New(logger *logger.Logger, cfg *config.Config, service service.I, repo *repository.Repository, fcmClient *notification.FCMClient) *Handler {
	return &Handler{
		logger:    logger,
		service:   service,
		cfg:       cfg,
		repo:      repo,
		fcmClient: fcmClient,
	}
}
