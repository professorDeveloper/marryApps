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

		// Global login
		auth.POST("/global/login", h.LoginGlobal, mw.LoginRateLimiter(), mw.CheckLanguage(), mw.ValidateLoginInput)
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
			media.POST("/video/download", h.DownloadVideo, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
			media.POST("/image", h.UploadImage, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
			media.POST("/image/download", h.DownloadImage, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
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

		orders := api.Group("/orders")
		{
			orders.POST("", h.CreateOrder, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
			orders.GET("", h.GetAllOrders, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
			orders.GET("/:id", h.GetOrderByID, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
			orders.PUT("/:id", h.UpdateOrder, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
			orders.DELETE("/:id", h.DeleteOrder, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
			orders.POST("/:id/restore", h.RestoreOrder, mw.CheckLanguage(), mw.CheckAuth(h.cfg))

			orders.PUT("/:id/status", h.UpdateOrderStatus, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
			orders.POST("/:id/pay", h.MarkOrderPaid, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
			orders.POST("/:id/cancel", h.CancelOrder, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
			orders.POST("/:id/cooking", h.MarkOrderCooking, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
			orders.POST("/:id/ready", h.MarkOrderReady, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
			orders.POST("/:id/served", h.MarkOrderServed, mw.CheckLanguage(), mw.CheckAuth(h.cfg))

			orders.GET("/status/:status", h.GetOrdersByStatus, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
			orders.GET("/table/:tableId", h.GetOrdersByTableID, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
			orders.GET("/waiter/:waiterId", h.GetOrdersByWaiterID, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
			orders.POST("/:id/assign-waiter/:waiterId", h.AssignWaiterToOrder, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
			orders.POST("/:id/assign-cashier/:cashierId", h.AssignCashierToOrder, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
		}

		orderItems := api.Group("/order-items")
		{
			orderItems.POST("", h.CreateOrderItem, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
			orderItems.GET("", h.GetAllOrderItems, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
			orderItems.GET("/:id", h.GetOrderItemByID, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
			orderItems.PUT("/:id", h.UpdateOrderItem, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
			orderItems.DELETE("/:id", h.DeleteOrderItem, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
			orderItems.POST("/:id/restore", h.RestoreOrderItem, mw.CheckLanguage(), mw.CheckAuth(h.cfg))

			orderItems.GET("/order/:orderId", h.GetOrderItemsByOrderID, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
			orderItems.GET("/status/:status", h.GetOrderItemsByStatus, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
			orderItems.PUT("/:id/quantity", h.UpdateOrderItemQuantity, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
			orderItems.PUT("/:id/status", h.UpdateOrderItemStatus, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
			orderItems.POST("/:id/cancel", h.CancelOrderItem, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
			orderItems.POST("/:id/cooking", h.MarkOrderItemCooking, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
			orderItems.POST("/:id/ready", h.MarkOrderItemReady, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
		}

		// kitchen := api.Group("/kitchen")
		// {
		// 	kitchen.GET("/queue", h.GetKitchenQueue, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
		// }

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

		compounds := api.Group("/compounds")
		{
			compounds.POST("", h.CreateCompound, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
			compounds.GET("", h.GetAllCompounds, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
			compounds.GET("/:id", h.GetCompoundByID, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
			compounds.GET("/department/:departmentId", h.GetCompoundsByDepartmentID, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
			compounds.PUT("/:id", h.UpdateCompound, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
			compounds.DELETE("/:id", h.DeleteCompound, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
			compounds.POST("/:id/restore", h.RestoreCompound, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
			compounds.GET("/search", h.SearchCompounds, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
			// Compound details endpoints
			compounds.GET("/:compound_id/details", h.GetCompoundDetailsByCompound, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
			// Compound stock endpoints
			compounds.GET("/:compound_id/stock", h.GetCompoundStockByCompound, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
		}

		compoundDetails := api.Group("/compound-details")
		{
			compoundDetails.POST("", h.CreateCompoundDetail, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
			compoundDetails.GET("/:id", h.GetCompoundDetail, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
			compoundDetails.PUT("/:id", h.UpdateCompoundDetail, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
			compoundDetails.DELETE("/:id", h.DeleteCompoundDetail, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
			compoundDetails.POST("/:id/restore", h.RestoreCompoundDetail, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
		}

		ingredientCompounds := api.Group("/ingredients/:ingredient_id/compounds")
		{
			ingredientCompounds.GET("", h.GetCompoundDetailsByIngredient, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
		}

		compoundStock := api.Group("/compound-stock")
		{
			compoundStock.POST("", h.CreateCompoundStock, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
			compoundStock.GET("", h.GetAllCompoundStock, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
			compoundStock.GET("/search", h.GetCompoundStockByBranchAndCompound, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
			compoundStock.GET("/:id", h.GetCompoundStock, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
			compoundStock.PUT("/:id", h.UpdateCompoundStock, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
			compoundStock.POST("/:id/add", h.AddToCompoundStock, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
			compoundStock.POST("/:id/remove", h.RemoveFromCompoundStock, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
			compoundStock.DELETE("/:id", h.DeleteCompoundStock, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
			compoundStock.POST("/:id/restore", h.RestoreCompoundStock, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
		}

		branchCompoundStock := api.Group("/branches/:branch_id/compound-stock")
		{
			branchCompoundStock.GET("", h.GetCompoundStockByBranch, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
		}

		// Goods endpoints
		goods := api.Group("/goods")
		{
			goods.POST("", h.CreateGood, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
			goods.GET("", h.GetAllGoods, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
			goods.GET("/:id", h.GetGood, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
			goods.GET("/search/by-price", h.GetGoodsByPriceRange, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
			goods.GET("/search", h.SearchGoods, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
			goods.PUT("/:id", h.UpdateGood, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
			goods.PUT("/:id/price", h.UpdateGoodPrice, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
			goods.DELETE("/:id", h.DeleteGood, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
			goods.POST("/:id/restore", h.RestoreGood, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
			// Good details endpoints
			goods.GET("/:good_id/details", h.GetGoodDetailsByGood, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
		}

		// Good details endpoints
		goodDetails := api.Group("/good-details")
		{
			goodDetails.POST("", h.CreateGoodDetail, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
			goodDetails.GET("/:id", h.GetGoodDetail, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
			goodDetails.PUT("/:id", h.UpdateGoodDetail, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
			goodDetails.PUT("/:id/quantity", h.UpdateGoodDetailQuantity, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
			goodDetails.DELETE("/:id", h.DeleteGoodDetail, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
			goodDetails.POST("/:id/restore", h.RestoreGoodDetail, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
		}

		// Category goods endpoints
		categoryGoods := api.Group("/categories/:category_id/goods")
		{
			categoryGoods.GET("", h.GetGoodsByCategory, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
		}

		// Department goods endpoints
		departmentGoods := api.Group("/departments/:department_id/goods")
		{
			departmentGoods.GET("", h.GetGoodsByDepartment, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
		}

		// Ingredient goods endpoints
		ingredientGoods := api.Group("/ingredients/:ingredient_id/goods")
		{
			ingredientGoods.GET("", h.GetGoodDetailsByIngredient, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
		}

		// Compound goods endpoints
		compoundGoods := api.Group("/compounds/:compound_id/goods")
		{
			compoundGoods.GET("", h.GetGoodDetailsByCompound, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
		}

		// Cafe Table endpoints
		cafeTables := api.Group("/cafe-tables")
		{
			cafeTables.POST("", h.CreateCafeTable, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
			cafeTables.GET("", h.GetAllCafeTables, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
			cafeTables.GET("/:id", h.GetCafeTableByID, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
			cafeTables.GET("/hall/:hall_id", h.GetCafeTablesByHallID, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
			cafeTables.GET("/status/:status", h.GetCafeTablesByStatus, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
			cafeTables.GET("/hall-status", h.GetCafeTablesByHallAndStatus, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
			cafeTables.PUT("/:id", h.UpdateCafeTable, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
			cafeTables.PATCH("/:id/status", h.UpdateCafeTableStatus, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
			cafeTables.DELETE("/:id", h.DeleteCafeTable, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
			cafeTables.POST("/:id/restore", h.RestoreCafeTable, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
			cafeTables.POST("/:id/set-free", h.SetTableFree, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
			cafeTables.POST("/:id/set-busy", h.SetTableBusy, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
			cafeTables.GET("/available/hall/:hall_id", h.GetAvailableTablesByHall, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
			cafeTables.GET("/available/capacity", h.GetAvailableTablesByCapacity, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
			cafeTables.GET("/available/hall/:hall_id/capacity", h.GetAvailableTablesByHallAndCapacity, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
			cafeTables.GET("/stats/occupancy", h.GetTableOccupancyStats, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
			cafeTables.GET("/search", h.SearchCafeTables, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
		}

		// Invoice endpoints (supplier invoices)
		invoices := api.Group("/invoices")
		{
			invoices.POST("", h.CreateSupplierInvoice, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
			invoices.GET("", h.GetAllInvoices, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
			invoices.GET("/:id", h.GetInvoice, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
			invoices.GET("/status/:status", h.GetInvoicesByStatus, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
			invoices.GET("/supplier/:supplier_id", h.GetInvoicesBySupplier, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
			invoices.GET("/date-range", h.GetInvoicesByDateRange, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
			invoices.GET("/search", h.SearchInvoices, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
			invoices.PUT("/:id", h.UpdateInvoice, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
			invoices.PATCH("/:id/status", h.UpdateInvoiceStatus, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
			invoices.POST("/:id/mark-arrived", h.MarkInvoiceArrived, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
			invoices.POST("/:id/mark-received", h.MarkInvoiceReceived, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
			invoices.POST("/:id/cancel", h.CancelInvoice, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
			invoices.DELETE("/:id", h.DeleteInvoice, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
			invoices.POST("/:id/restore", h.RestoreInvoice, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
			invoices.GET("/:id/details", h.GetInvoiceWithDetails, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
			invoices.GET("/stats/supplier", h.GetInvoiceStatsBySupplier, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
			invoices.GET("/stats/date-range", h.GetInvoiceStatsByDateRange, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
		}

		// Invoice detail endpoints
		invoiceDetails := api.Group("/invoice-details")
		{
			invoiceDetails.POST("", h.CreateInvoiceDetail, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
			invoiceDetails.GET("", h.GetAllInvoiceDetails, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
			invoiceDetails.GET("/:id", h.GetInvoiceDetail, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
			invoiceDetails.GET("/invoice/:invoice_id", h.GetInvoiceDetailsByInvoice, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
			invoiceDetails.GET("/ingredient/:ingredient_id", h.GetInvoiceDetailsByIngredient, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
			invoiceDetails.PUT("/:id", h.UpdateInvoiceDetail, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
			invoiceDetails.PUT("/:id/quantity", h.UpdateInvoiceDetailQuantity, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
			invoiceDetails.DELETE("/:id", h.DeleteInvoiceDetail, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
			invoiceDetails.POST("/:id/restore", h.RestoreInvoiceDetail, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
			invoiceDetails.GET("/:id/with-ingredient", h.GetInvoiceDetailWithIngredient, mw.CheckLanguage(), mw.CheckAuth(h.cfg))
		}

		// Brand management endpoints (admin only)
		brands := api.Group("/admin/brands")
		{
			brands.POST("", h.CreateBrand, mw.CheckLanguage(), mw.CheckAuth(h.cfg), mw.RequireGlobalSuperadmin)
			brands.GET("", h.ListBrands, mw.CheckLanguage(), mw.CheckAuth(h.cfg), mw.RequireGlobalSuperadmin)
			brands.GET("/:id", h.GetBrand, mw.CheckLanguage(), mw.CheckAuth(h.cfg), mw.RequireGlobalSuperadmin)
			brands.PUT("/:id", h.UpdateBrand, mw.CheckLanguage(), mw.CheckAuth(h.cfg), mw.RequireGlobalSuperadmin)
			brands.DELETE("/:id", h.DeleteBrand, mw.CheckLanguage(), mw.CheckAuth(h.cfg), mw.RequireGlobalSuperadmin)
			brands.POST("/:id/init-schema", h.InitializeTenantSchema, mw.CheckLanguage(), mw.CheckAuth(h.cfg), mw.RequireGlobalSuperadmin)
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
