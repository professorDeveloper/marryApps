package service

import (
	"context"
	"io"
	"time"

	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
	RealMinio "github.com/minio/minio-go/v7"
	"gitlab.yurtal.tech/company/maryai/back/internal/config"
	"gitlab.yurtal.tech/company/maryai/back/internal/model"
	"gitlab.yurtal.tech/company/maryai/back/internal/repository"
	"gitlab.yurtal.tech/company/maryai/back/pkg/minio"
	"gitlab.yurtal.tech/company/maryai/back/pkg/notification"
	"gitlab.yurtal.tech/company/maryai/back/pkg/paymentClick"
	"gitlab.yurtal.tech/company/maryai/back/pkg/paymentPayme"
)

type AuthI interface {
	Register(ctx context.Context, req model.RegisterRequest) error
	Login(ctx context.Context, req model.LoginRequest, jwtCfg *config.JwtConfig) (model.LoginResponse, error)
	LoginGlobal(ctx context.Context, req model.LoginRequest, jwtCfg *config.JwtConfig) (model.LoginResponse, error)
	LoginWithPincode(ctx context.Context, req model.PincodeLoginRequest, jwtCfg *config.JwtConfig) (model.LoginResponse, error)
	Refresh(ctx context.Context, req model.RefreshRequest, jwtCfg *config.JwtConfig) (model.RefreshResponse, error)
	UpdateUserPassword(ctx context.Context, userID uuid.UUID, currentPassword, newPassword string) error
	GetUserByID(ctx context.Context, userID string) (model.UserResponse, error)
	GetUsers(ctx context.Context, req model.GetUsersRequest) ([]model.UserResponse, int64, error)
	UpdateUser(ctx context.Context, req model.UpdateUserRequest, userID string) (model.UserResponse, error)
	// Additional methods for QR ordering system
	GetUsersByRole(ctx context.Context, role string, limit, offset int32) ([]model.UserResponse, int64, error)
	GetKitchenStaff(ctx context.Context, limit, offset int32) ([]model.UserResponse, int64, error)
	DeleteUser(ctx context.Context, userID string) error
	RestoreUser(ctx context.Context, userID string) error
	SearchUsers(ctx context.Context, query string, limit, offset int32) ([]model.UserResponse, error)
	UpdatePOSPassword(ctx context.Context, brandID, currentPassword, newPassword string) error
	GetPOSPasswordStatus(ctx context.Context, brandID string) (bool, error)
}

type MinioI interface {
	UploadImage(ctx context.Context, file io.Reader, size int64, fileName string, extension string) (string, error)
	GetImage(ctx context.Context, objectName string) (*RealMinio.Object, error)
	UploadVideo(ctx context.Context, file io.Reader, size int64, fileName string, extension string) (string, error)
	GetVideo(ctx context.Context, objectName string) (*RealMinio.Object, error)
}
type PaymentI interface {
	CreateInvoice(c echo.Context, ctx context.Context, planID string) (*model.CheckoutURL, error)
	CreatePaymeInvoice(c echo.Context, ctx context.Context, planID string) (*model.CheckoutURL, error)
}

type SyncI interface {
	Pull(ctx context.Context, lastCursor int64, limit int32) (model.SyncPullResponse, error)
	Push(ctx context.Context, req model.SyncPushRequest) (model.SyncPushResult, error)
	ListChangeLogs(ctx context.Context, filter ChangeLogFilter) (model.ChangeLogListResponse, error)
}

type ShiftI interface {
	CreateShift(ctx context.Context, name string, role *string, workingDays *string, openTime *string, closeTime *string, branchID string) (*ShiftResponse, error)
	GetShiftByID(ctx context.Context, shiftID string) (*ShiftResponse, error)
	GetAllShifts(ctx context.Context) ([]ShiftResponse, error)
	GetShiftsByBranchID(ctx context.Context, branchID string) ([]ShiftResponse, error)
	UpdateShift(ctx context.Context, shiftID string, name *string, role *string, workingDays *string, openTime *string, closeTime *string) (*ShiftResponse, error)
	DeleteShift(ctx context.Context, shiftID string) error
}

type OrganizationI interface {
	CreateBranch(ctx context.Context, name string, nameI18nUUID *uuid.UUID, address *string, phone *string) (*model.BranchResponse, error)
	GetBranchByID(ctx context.Context, branchID string) (*model.BranchResponse, error)
	GetAllBranches(ctx context.Context, limit, offset int32) ([]model.BranchResponse, int64, error)
	GetBranchByIDWithLang(ctx context.Context, branchID string, lang string) (*model.BranchResponse, error)
	GetAllBranchesWithLang(ctx context.Context, lang string, limit, offset int32) ([]model.BranchResponse, int64, error)
	UpdateBranch(ctx context.Context, branchID string, name, nameI18n, address, phone *string) (*model.BranchResponse, error)
	DeleteBranch(ctx context.Context, branchID string) error
	RestoreBranch(ctx context.Context, branchID string) error
	CreateTranslation(ctx context.Context, uz *string, ru *string, en *string) (*model.TranslationResponse, error)
	GetTranslationByID(ctx context.Context, translationID string) (*model.TranslationResponse, error)
	GetAllTranslations(ctx context.Context, limit, offset int32) ([]model.TranslationResponse, error)
	UpdateTranslation(ctx context.Context, translationID string, uz, ru, en *string) (*model.TranslationResponse, error)
	DeleteTranslation(ctx context.Context, translationID string) error
	RestoreTranslation(ctx context.Context, translationID string) error
}

type StorageI interface {
	CreateStorage(ctx context.Context, name string, branchID string, nameI18n *uuid.UUID, pictureUrl *string, colorCode *string) (*model.StorageResponse, error)
	GetStorageByID(ctx context.Context, storageID string) (*model.StorageResponse, error)
	GetAllStorages(ctx context.Context, limit, offset int32) ([]model.StorageResponse, int32, error)
	GetStorageByIDWithLang(ctx context.Context, storageID string, lang string) (*model.StorageResponse, error)
	GetAllStoragesWithLang(ctx context.Context, lang string, limit, offset int32) ([]model.StorageResponse, int32, error)
	GetStoragesByBranchID(ctx context.Context, branchID string, limit, offset int32) ([]model.StorageResponse, int32, error)
	UpdateStorage(ctx context.Context, storageID string, name *string, branchID *string, nameI18n *string, pictureUrl *string, colorCode *string, uz *string, ru *string, en *string) (*model.StorageResponse, error)
	DeleteStorage(ctx context.Context, storageID string) error
	RestoreStorage(ctx context.Context, storageID string) error
	SearchStorages(ctx context.Context, query string, limit, offset int32) ([]model.StorageResponse, error)
}

type DepartmentI interface {
	CreateDepartment(ctx context.Context, name string, nameI18n *string, colorCode *string, pictureUrl *string, storageID *string) (*model.DepartmentResponse, error)
	GetDepartmentByID(ctx context.Context, departmentID string) (*model.DepartmentResponse, error)
	GetAllDepartments(ctx context.Context, limit, offset int32) ([]*model.DepartmentResponse, int32, error)
	GetDepartmentByIDWithLang(ctx context.Context, departmentID string, lang string) (*model.DepartmentResponse, error)
	GetAllDepartmentsWithLang(ctx context.Context, lang string, limit, offset int32) ([]*model.DepartmentResponse, int32, error)
	GetDepartmentsByStorageID(ctx context.Context, storageID string, limit, offset int32) ([]*model.DepartmentResponse, int32, error)
	UpdateDepartment(ctx context.Context, departmentID string, name *string, nameI18n *string, colorCode *string, pictureUrl *string, storageID *string, uz *string, ru *string, en *string) (*model.DepartmentResponse, error)
	DeleteDepartment(ctx context.Context, departmentID string) error
	RestoreDepartment(ctx context.Context, departmentID string) (*model.DepartmentResponse, error)
	SearchDepartments(ctx context.Context, query string, limit, offset int32) ([]*model.DepartmentResponse, error)
}

type HallI interface {
	CreateHall(ctx context.Context, name string, branchID string, nameI18n *uuid.UUID, width, height *int32) (*model.HallResponse, error)
	GetHallByID(ctx context.Context, hallID string) (*model.HallResponse, error)
	GetAllHalls(ctx context.Context, limit, offset int32) ([]*model.HallResponse, int64, error)
	GetAllHallsWithLang(ctx context.Context, lang string, limit, offset int32) ([]*model.HallResponse, int64, error)
	GetHallsByBranchID(ctx context.Context, branchID string, limit, offset int32) ([]*model.HallResponse, int64, error)
	GetHallsByBranchIDWithLang(ctx context.Context, branchID string, lang string, limit, offset int32) ([]*model.HallResponse, int64, error)
	UpdateHall(ctx context.Context, hallID string, name *string, branchID *string, nameI18n *string, width, height *int32) (*model.HallResponse, error)
	DeleteHall(ctx context.Context, hallID string) error
	RestoreHall(ctx context.Context, hallID string) (*model.HallResponse, error)
	SearchHalls(ctx context.Context, query string, limit, offset int32) ([]*model.HallResponse, error)
}

type IngredientI interface {
	CreateIngredientGroup(ctx context.Context, name string, nameI18n *uuid.UUID, pictureUrl *string, colorCode *string) (*model.IngredientGroupResponse, error)
	GetIngredientGroupByID(ctx context.Context, groupID string) (*model.IngredientGroupResponse, error)
	GetAllIngredientGroups(ctx context.Context, limit, offset int32) ([]model.IngredientGroupResponse, int64, error)
	SearchIngredientGroups(ctx context.Context, query string, limit, offset int32) ([]model.IngredientGroupResponse, error)
	GetIngredientGroupByIDWithLang(ctx context.Context, groupID string, lang string) (*model.IngredientGroupResponse, error)
	GetAllIngredientGroupsWithLang(ctx context.Context, lang string, limit, offset int32) ([]model.IngredientGroupResponse, int64, error)
	UpdateIngredientGroup(ctx context.Context, groupID string, name *string, nameI18n *string, pictureUrl *string, colorCode *string) (*model.IngredientGroupResponse, error)
	DeleteIngredientGroup(ctx context.Context, groupID string) error
	RestoreIngredientGroup(ctx context.Context, groupID string) error

	CreateIngredient(ctx context.Context, name string, nameI18n *uuid.UUID, groupID *string, measurement *string, pictureUrl *string, colorCode *string) (*model.IngredientResponse, error)
	GetIngredientByID(ctx context.Context, ingredientID string) (*model.IngredientResponse, error)
	GetAllIngredients(ctx context.Context, limit, offset int32) ([]model.IngredientResponse, int64, error)
	SearchIngredients(ctx context.Context, query string, limit, offset int32) ([]model.IngredientResponse, error)
	GetIngredientByIDWithLang(ctx context.Context, ingredientID string, lang string) (*model.IngredientResponse, error)
	GetAllIngredientsWithLang(ctx context.Context, lang string, limit, offset int32) ([]model.IngredientResponse, int64, error)
	GetIngredientsByGroupID(ctx context.Context, groupID string, limit, offset int32) ([]model.IngredientResponse, int64, error)
	UpdateIngredient(ctx context.Context, ingredientID string, name *string, nameI18n *string, groupID *string, measurement *string, pictureUrl *string, brandID *string, colorCode *string, pricePerUnit *string) (*model.IngredientResponse, error)
	DeleteIngredient(ctx context.Context, ingredientID string) error
	RestoreIngredient(ctx context.Context, ingredientID string) error

	CreateIngredientStock(ctx context.Context, ingredientID string, quantity string, branchID *string, storageID *string) (*model.IngredientStockResponse, error)
	GetIngredientStockByID(ctx context.Context, stockID string) (*model.IngredientStockResponse, error)
	GetStockByIngredientAndBranch(ctx context.Context, ingredientID, branchID string) (*model.IngredientStockResponse, error)
	GetAllIngredientStock(ctx context.Context, filter model.IngredientStockFilter, limit, offset int32) ([]model.IngredientStockResponse, int64, error)
	GetStockByBranchID(ctx context.Context, branchID string, limit, offset int32) ([]model.IngredientStockResponse, int64, error)
	GetStockByIngredientID(ctx context.Context, ingredientID string, limit, offset int32) ([]model.IngredientStockResponse, int64, error)
	UpdateIngredientStock(ctx context.Context, stockID string, quantity string) (*model.IngredientStockResponse, error)
	AddToIngredientStock(ctx context.Context, stockID string, quantity string) (*model.IngredientStockResponse, error)
	RemoveFromIngredientStock(ctx context.Context, stockID string, quantity string) (*model.IngredientStockResponse, error)
	DeleteIngredientStock(ctx context.Context, stockID string) error
	RestoreIngredientStock(ctx context.Context, stockID string) error

	GetIngredientReport(ctx context.Context, req model.GetIngredientReportRequest) (*model.IngredientReportResponse, error)
	GetIngredientReportItem(ctx context.Context, req model.GetIngredientReportRequest) (*model.IngredientReportItem, error)
	GetIngredientReportMovements(ctx context.Context, req model.GetIngredientReportMovementsRequest) ([]model.IngredientStockMovementResponse, error)
}

type CategoryI interface {
	CreateCategory(ctx context.Context, name string, nameI18n, departmentID, parent *string, pictureUrl *string, colorCode *string) (*model.CategoryResponse, error)
	GetCategoryByID(ctx context.Context, categoryID string) (*model.CategoryResponse, error)
	GetAllCategories(ctx context.Context, limit, offset int32) ([]*model.CategoryResponse, int64, error)
	GetCategoryByIDWithLang(ctx context.Context, categoryID string, lang string) (*model.CategoryResponse, error)
	GetAllCategoriesWithLang(ctx context.Context, lang string, limit, offset int32) ([]*model.CategoryResponse, int64, error)
	GetCategoriesByDepartmentID(ctx context.Context, departmentID string, limit, offset int32) ([]*model.CategoryResponse, int64, error)
	GetCategoriesByStorageID(ctx context.Context, storageID string, limit, offset int32) ([]*model.CategoryResponse, int64, error)
	GetCategoriesByParentID(ctx context.Context, parentID string, limit, offset int32) ([]*model.CategoryResponse, int64, error)
	GetRootCategories(ctx context.Context, limit, offset int32) ([]*model.CategoryResponse, int64, error)
	UpdateCategory(ctx context.Context, categoryID string, name, nameI18n, departmentID, parent *string, pictureUrl *string, colorCode *string) (*model.CategoryResponse, error)
	DeleteCategory(ctx context.Context, categoryID string) error
	RestoreCategory(ctx context.Context, categoryID string) (*model.CategoryResponse, error)
	SearchCategories(ctx context.Context, query string, limit, offset int32) ([]*model.CategoryResponse, int64, error)
}

type CompoundI interface {
	// Compound methods
	CreateCompound(ctx context.Context, name string, nameI18n, description, descriptionI18n, measurement *string, quantity float64, price *string, pictureUrl *string, colorCode *string, ingredientGroupID *string) (*model.CompoundResponse, error)
	GetCompoundByID(ctx context.Context, compoundID string) (*model.CompoundResponse, error)
	GetAllCompounds(ctx context.Context, limit, offset int32) ([]*model.CompoundResponse, int64, error)
	GetCompoundByIDWithLang(ctx context.Context, compoundID string, lang string) (*model.CompoundResponse, error)
	GetAllCompoundsWithLang(ctx context.Context, lang string, limit, offset int32) ([]*model.CompoundResponse, int64, error)
	UpdateCompound(ctx context.Context, compoundID string, name, nameI18n, description, descriptionI18n, measurement *string, quantity *float64, price *string, pictureUrl *string, colorCode *string, ingredientGroupID *string) (*model.CompoundResponse, error)
	DeleteCompound(ctx context.Context, compoundID string) error
	RestoreCompound(ctx context.Context, compoundID string) (*model.CompoundResponse, error)
	SearchCompounds(ctx context.Context, query string, limit, offset int32) ([]*model.CompoundResponse, error)
	RecalculateCompoundPrice(ctx context.Context, compoundID string) (*model.CompoundResponse, error)

	// CompoundDetail methods
	CreateCompoundDetail(ctx context.Context, compoundID, ingredientID string, quantity int64) (*model.CompoundDetailResponse, error)
	GetCompoundDetailByID(ctx context.Context, detailID string) (*model.CompoundDetailResponse, error)
	GetCompoundDetailsByCompoundID(ctx context.Context, compoundID string) ([]*model.CompoundDetailResponse, error)
	GetCompoundDetailsByIngredientID(ctx context.Context, ingredientID string, limit, offset int32) ([]*model.CompoundDetailResponse, error)
	UpdateCompoundDetail(ctx context.Context, detailID string, compoundID, ingredientID *string, quantity *int64) (*model.CompoundDetailResponse, error)
	DeleteCompoundDetail(ctx context.Context, detailID string) error
	RestoreCompoundDetail(ctx context.Context, detailID string) (*model.CompoundDetailResponse, error)

	// CompoundStock methods
	CreateCompoundStock(ctx context.Context, compoundID, branchID string, quantity int64) (*model.CompoundStockResponse, error)
	GetCompoundStockByID(ctx context.Context, stockID string) (*model.CompoundStockResponse, error)
	GetStockByCompoundAndBranch(ctx context.Context, compoundID, branchID string) (*model.CompoundStockResponse, error)
	GetAllCompoundStock(ctx context.Context, limit, offset int32) ([]*model.CompoundStockResponse, error)
	GetCompoundStockByBranchID(ctx context.Context, branchID string, limit, offset int32) ([]*model.CompoundStockResponse, error)
	GetCompoundStockByCompoundID(ctx context.Context, compoundID string, limit, offset int32) ([]*model.CompoundStockResponse, error)
	UpdateCompoundStock(ctx context.Context, stockID string, quantity int64) (*model.CompoundStockResponse, error)
	AddToCompoundStock(ctx context.Context, stockID string, quantity int64) (*model.CompoundStockResponse, error)
	RemoveFromCompoundStock(ctx context.Context, stockID string, quantity int64) (*model.CompoundStockResponse, error)
	DeleteCompoundStock(ctx context.Context, stockID string) error
	RestoreCompoundStock(ctx context.Context, stockID string) (*model.CompoundStockResponse, error)
}

type GoodsI interface {
	// Goods methods
	CreateGood(ctx context.Context, name string, description *string, nameI18n, descriptionI18n, categoryID *string, price string, cookTime *int32, pictureUrl *string, colorCode *string) (*model.GoodResponse, error)
	GetGoodByID(ctx context.Context, goodID string) (*model.GoodResponse, error)
	GetAllGoods(ctx context.Context, limit, offset int32) ([]*model.GoodResponse, int64, error)
	GetAllGoodsFiltered(ctx context.Context, categoryID, search, lang string, limit, offset int32) ([]*model.GoodResponse, int64, error)
	GetGoodByIDWithLang(ctx context.Context, goodID string, lang string) (*model.GoodResponse, error)
	GetAllGoodsWithLang(ctx context.Context, lang string, limit, offset int32) ([]*model.GoodResponse, int64, error)
	GetGoodsByCategory(ctx context.Context, categoryID string, limit, offset int32) ([]*model.GoodResponse, error)
	GetGoodsByPriceRange(ctx context.Context, minPrice, maxPrice string, limit, offset int32) ([]*model.GoodResponse, error)
	UpdateGood(ctx context.Context, goodID string, name, description, nameI18n, descriptionI18n, categoryID, price *string, cookTime *int32, pictureUrl *string, colorCode *string) (*model.GoodResponse, error)
	UpdateGoodPrice(ctx context.Context, goodID, price string) (*model.GoodResponse, error)
	DeleteGood(ctx context.Context, goodID string) error
	RestoreGood(ctx context.Context, goodID string) (*model.GoodResponse, error)
	SearchGoods(ctx context.Context, query string, limit, offset int32) ([]*model.GoodResponse, error)

	// Good details methods
	CreateGoodDetail(ctx context.Context, goodID string, ingredientID, compoundID *string, measurement *string, quantity int64) (*model.GoodDetailResponse, error)
	GetGoodDetailByID(ctx context.Context, detailID string) (*model.GoodDetailResponse, error)
	GetGoodDetailsByGood(ctx context.Context, goodID string) ([]*model.GoodDetailResponse, error)
	GetGoodDetailsByIngredient(ctx context.Context, ingredientID string, limit, offset int32) ([]*model.GoodDetailResponse, error)
	GetGoodDetailsByCompound(ctx context.Context, compoundID string, limit, offset int32) ([]*model.GoodDetailResponse, error)
	UpdateGoodDetail(ctx context.Context, detailID string, goodID, ingredientID, compoundID *string, measurement *string, quantity *int64) (*model.GoodDetailResponse, error)
	UpdateGoodDetailQuantity(ctx context.Context, detailID string, quantity int64) (*model.GoodDetailResponse, error)
	DeleteGoodDetail(ctx context.Context, detailID string) error
	RestoreGoodDetail(ctx context.Context, detailID string) (*model.GoodDetailResponse, error)
}

type CafeTableI interface {
	CreateCafeTable(ctx context.Context, hallID string, number int32, capacity int32, status *string, posX, posY, width, height, rotation *int32, pricePerHour *int64, tableType *string) (*model.CafeTableResponse, error)
	GetCafeTableByID(ctx context.Context, tableID string) (*model.CafeTableResponse, error)
	GetAllCafeTables(ctx context.Context, limit, offset int32) ([]model.CafeTableResponse, int64, error)
	GetCafeTablesByHallID(ctx context.Context, hallID string, limit, offset int32) ([]model.CafeTableResponse, int64, error)
	GetCafeTablesByStatus(ctx context.Context, status string, limit, offset int32) ([]model.CafeTableResponse, int64, error)
	GetCafeTablesByHallAndStatus(ctx context.Context, hallID, status string) ([]model.CafeTableResponse, error)
	GetAvailableTablesByHall(ctx context.Context, hallID string) ([]model.CafeTableResponse, error)
	GetAvailableTablesByCapacity(ctx context.Context, capacity, limit, offset int32) ([]model.CafeTableResponse, error)
	GetAvailableTablesByHallAndCapacity(ctx context.Context, hallID string, capacity int32) ([]model.CafeTableResponse, error)
	UpdateCafeTable(ctx context.Context, tableID string, hallID *string, number *int32, capacity *int32, status *string, posX, posY, width, height, rotation *int32, pricePerHour *string, tableType *string) (*model.CafeTableResponse, error)
	UpdateCafeTableStatus(ctx context.Context, tableID string, status string) (*model.CafeTableResponse, error)
	SetTableFree(ctx context.Context, tableID string) (*model.CafeTableResponse, error)
	SetTableBusy(ctx context.Context, tableID string) (*model.CafeTableResponse, error)
	DeleteCafeTable(ctx context.Context, tableID string) error
	RestoreCafeTable(ctx context.Context, tableID string) error
	GetTableOccupancyStats(ctx context.Context) (*model.TableOccupancyStats, error)
	SearchCafeTables(ctx context.Context, query string, limit, offset int32) ([]model.CafeTableResponse, error)
}

type SupplierI interface {
	CreateSupplier(ctx context.Context, req *model.CreateSupplierRequest) (*model.SupplierResponse, error)
	GetSupplierByID(ctx context.Context, id string) (*model.SupplierResponse, error)
	GetAllSuppliers(ctx context.Context, limit, offset int32) ([]*model.SupplierResponse, error)
	UpdateSupplier(ctx context.Context, id string, req *model.UpdateSupplierRequest) (*model.SupplierResponse, error)
	DeleteSupplier(ctx context.Context, id string) error
	RestoreSupplier(ctx context.Context, id string) (*model.SupplierResponse, error)
	SearchSuppliers(ctx context.Context, query string, limit, offset int32) ([]*model.SupplierResponse, error)
}

type InventoryI interface {
	CreateInventory(ctx context.Context, req *model.CreateInventoryRequest) (*model.InventoryResponse, error)
	GetInventoryByID(ctx context.Context, id string) (*model.InventoryResponse, error)
	GetAllInventories(ctx context.Context, limit, offset int32) ([]*model.InventoryResponse, error)
	GetInventoriesFiltered(ctx context.Context, dateFrom, dateTo *time.Time, storageID, ingredientID, status *string, limit, offset int32) (*model.PaginatedInventoriesResponse, error)
	UpdateInventory(ctx context.Context, id string, req *model.UpdateInventoryRequest) (*model.InventoryResponse, error)
	DeleteInventory(ctx context.Context, id string) error
	DeleteInventoriesBatch(ctx context.Context, ids []string) error
	RestoreInventory(ctx context.Context, id string) (*model.InventoryResponse, error)
	SearchInventories(ctx context.Context, query string, limit, offset int32) ([]*model.InventoryResponse, error)

	UpsertInventoryItems(ctx context.Context, inventoryID string, req *model.UpsertInventoryItemsRequest) ([]*model.InventoryItemComputedResponse, error)
	ReplaceInventoryItems(ctx context.Context, inventoryID string, req *model.UpsertInventoryItemsRequest) ([]*model.InventoryItemComputedResponse, error)
	GetInventoryItems(ctx context.Context, inventoryID string) ([]*model.InventoryItemComputedResponse, error)
	GetAllInventoryItems(ctx context.Context, inventoryID *string, limit, offset int32) ([]*model.InventoryItemResponse, error)
	UpdateInventoryItem(ctx context.Context, inventoryItemID string, req *model.UpdateInventoryItemRequest) (*model.InventoryItemResponse, error)
	DeleteInventoryItem(ctx context.Context, inventoryItemID string) error
	DeleteInventoryItemsBatch(ctx context.Context, itemIDs []string) error
	CalculateInventory(ctx context.Context, inventoryID string) (*model.InventoryResponse, error)
	CreateInventoryBatch(ctx context.Context, req *model.CreateInventoryBatchRequest) (*model.CreateInventoryBatchResponse, error)
}

type DeductionI interface {
	CreateDeductionActGroup(ctx context.Context, req *model.CreateDeductionActGroupRequest) (*model.DeductionActGroupResponse, error)
	GetAllDeductionActGroups(ctx context.Context, limit, offset int32) ([]*model.DeductionActGroupResponse, error)
	GetDeductionActGroupByID(ctx context.Context, id string) (*model.DeductionActGroupResponse, error)
	UpdateDeductionActGroup(ctx context.Context, id string, req *model.UpdateDeductionActGroupRequest) (*model.DeductionActGroupResponse, error)
	DeleteDeductionActGroup(ctx context.Context, id string) error
	RestoreDeductionActGroup(ctx context.Context, id string) (*model.DeductionActGroupResponse, error)

	CreateDeduction(ctx context.Context, req *model.CreateDeductionRequest) (*model.DeductionResponse, error)
	GetDeductionByID(ctx context.Context, id string) (*model.DeductionResponse, error)
	GetAllDeductions(ctx context.Context, filter model.DeductionFilter, limit, offset int32) (*model.PaginatedDeductionsResponse, error)
	UpdateDeduction(ctx context.Context, id string, req *model.UpdateDeductionRequest) (*model.DeductionResponse, error)
	DeleteDeduction(ctx context.Context, id string) error
	DeleteDeductionsBatch(ctx context.Context, req *model.DeleteDeductionsBatchRequest) error
	RestoreDeduction(ctx context.Context, id string) (*model.DeductionResponse, error)
	UpsertDeductionItems(ctx context.Context, deductionID string, req *model.UpsertDeductionItemsRequest) (*model.DeductionResponse, error)
	DeleteDeductionItem(ctx context.Context, deductionID, itemID string) (*model.DeductionResponse, error)
	DeleteDeductionItemsBatch(ctx context.Context, deductionID string, req *model.DeleteDeductionItemsBatchRequest) (*model.DeductionResponse, error)
}

type InvoiceI interface {
	// Invoice methods
	CreateInvoice(ctx context.Context, req *model.CreateInvoiceRequest) (*model.InvoiceResponse, error)
	CreateInvoiceWithDetails(ctx context.Context, req *model.CreateInvoiceWithDetailsRequest) (*model.CreateInvoiceWithDetailsResponse, error)
	GetInvoiceByID(ctx context.Context, id string) (*model.InvoiceResponse, error)
	GetAllInvoices(ctx context.Context, filter model.InvoiceFilter, limit, offset int32) ([]*model.InvoiceResponse, int64, error)
	UpdateInvoice(ctx context.Context, id string, req *model.UpdateInvoiceRequest) (*model.InvoiceResponse, error)
	UpdateInvoiceStatus(ctx context.Context, id string, status string) (*model.InvoiceResponse, error)
	DeleteInvoice(ctx context.Context, id string) error
	DeleteInvoicesBatch(ctx context.Context, req *model.DeleteInvoicesBatchRequest) error
	RestoreInvoice(ctx context.Context, id string) error
	SearchInvoices(ctx context.Context, query string, limit, offset int32) ([]*model.InvoiceResponse, error)
	GetInvoiceWithDetails(ctx context.Context, id string) (*model.InvoiceGetWithDetailsResponse, error)
	// Invoice detail methods
	CreateInvoiceDetail(ctx context.Context, invoiceID string, req *model.CreateInvoiceDetailRequest) (*model.InvoiceDetailResponse, error)
	CreateInvoiceDetailsBatch(ctx context.Context, invoiceID string, req *model.CreateInvoiceDetailBatchRequest) (*model.InvoiceDetailBatchResponse, error)
	GetInvoiceDetailByID(ctx context.Context, id string) (*model.InvoiceDetailResponse, error)
	GetAllInvoiceDetails(ctx context.Context, limit, offset int32) ([]*model.InvoiceDetailResponse, int64, error)
	GetInvoiceDetailsByInvoiceID(ctx context.Context, invoiceID string, limit, offset int32) ([]*model.InvoiceDetailResponse, int64, error)
	GetInvoiceDetailsByIngredientID(ctx context.Context, ingredientID string, limit, offset int32) ([]*model.InvoiceDetailResponse, int64, error)
	UpdateInvoiceDetail(ctx context.Context, id string, req *model.UpdateInvoiceDetailRequest) (*model.InvoiceDetailResponse, error)
	UpdateInvoiceDetailQuantity(ctx context.Context, id string, quantity string) (*model.InvoiceDetailResponse, error)
	DeleteInvoiceDetail(ctx context.Context, id string) error
	DeleteInvoiceDetailsBatch(ctx context.Context, req *model.DeleteInvoiceDetailsBatchRequest) error
	RestoreInvoiceDetail(ctx context.Context, id string) error
	DeleteInvoiceDetailsByInvoiceID(ctx context.Context, invoiceID string) error
	UpsertInvoiceDetails(ctx context.Context, invoiceID string, req *model.UpsertInvoiceDetailsRequest) (*model.UpsertInvoiceDetailsResponse, error)
	CountInvoiceDetails(ctx context.Context) (int64, error)
	CountInvoiceDetailsByInvoice(ctx context.Context, invoiceID string) (int64, error)
	GetInvoiceDetailWithIngredient(ctx context.Context, id string) (*model.InvoiceDetailWithIngredientResponse, error)
}

type OrderI interface {
	CreateOrder(ctx context.Context, req model.CreateOrderRequest) (*model.OrderResponse, error)
	AddOrderItems(ctx context.Context, orderID string, req model.AddOrderItemsRequest) (*model.AddOrderItemsResponse, error)
	GetOrderByID(ctx context.Context, orderID string) (*model.OrderResponse, error)
	GetAllOrders(ctx context.Context, req model.GetOrdersRequest) ([]model.OrderResponse, error)
	GetOrdersByStatus(ctx context.Context, status string, limit, offset int32) ([]model.OrderResponse, error)
	GetOrdersByWaiterID(ctx context.Context, waiterID string, limit, offset int32) ([]model.OrderResponse, error)
	GetOrdersByTableID(ctx context.Context, tableID string) ([]model.OrderResponse, error)
	GetMyOrders(ctx context.Context, waiterID string, req model.GetMyOrdersRequest) ([]model.WaiterOrderListItem, error)
	UpdateOrder(ctx context.Context, orderID string, req model.UpdateOrderRequest) (*model.OrderResponse, error)
	UpdateOrderStatus(ctx context.Context, orderID string, status string) (*model.OrderResponse, error)
	MarkOrderPaid(ctx context.Context, orderID string, cashierID string, cashRegisterID *string, paymentType *string, discountPercent *string, discountAmount *string, discountComment *string, customerPaidAmount *string, tableCharge *string, cashAmount *string, cardAmount *string) (*model.OrderResponse, error)
	AssignWaiterToOrder(ctx context.Context, orderID string, waiterID string) (*model.OrderResponse, error)
	AssignCashierToOrder(ctx context.Context, orderID string, cashierID string) (*model.OrderResponse, error)
	CancelOrder(ctx context.Context, orderID string) (*model.OrderResponse, error)
	MarkOrderCooking(ctx context.Context, orderID string) (*model.OrderResponse, error)
	MarkOrderReady(ctx context.Context, orderID string) (*model.OrderResponse, error)
	MarkOrderServed(ctx context.Context, orderID string) (*model.OrderResponse, error)
	DeleteOrder(ctx context.Context, orderID string) error
	RestoreOrder(ctx context.Context, orderID string) error
	ActivateOrder(ctx context.Context, orderID string) (*model.OrderResponse, error)
	RescheduleOrder(ctx context.Context, orderID string, req model.RescheduleOrderRequest) (*model.OrderResponse, error)

	GetBills(ctx context.Context, req model.GetBillsRequest) (*model.BillListResponse, error)
	GetBillDetails(ctx context.Context, billID string) (*model.BillDetails, error)

	CreateOrderItems(ctx context.Context, req model.CreateOrderItemRequest) ([]model.OrderItemResponse, error)
	GetOrderItemByID(ctx context.Context, itemID string) (*model.OrderItemDetailResponse, error)
	GetAllOrderItems(ctx context.Context, limit, offset int32) ([]model.OrderItemResponse, error)
	GetOrderItemsByOrderID(ctx context.Context, orderID string, lang string) ([]model.OrderItemWithGoodResponse, error)
	GetOrderItemsByStatus(ctx context.Context, status string, limit, offset int32) ([]model.OrderItemResponse, error)
	UpdateOrderItem(ctx context.Context, itemID string, req model.UpdateOrderItemRequest) (*model.OrderItemResponse, error)
	UpdateOrderItemQuantity(ctx context.Context, itemID string, quantity int32) (*model.OrderItemResponse, error)
	UpdateOrderItemStatus(ctx context.Context, itemID string, status string) (*model.OrderItemResponse, error)
	CancelOrderItem(ctx context.Context, itemID string) (*model.OrderItemResponse, error)
	MarkOrderItemCooking(ctx context.Context, itemID string) (*model.OrderItemResponse, error)
	MarkOrderItemReady(ctx context.Context, itemID string) (*model.OrderItemResponse, error)
	DeleteOrderItem(ctx context.Context, itemID string) error
	RestoreOrderItem(ctx context.Context, itemID string) error

	GetKitchenQueue(ctx context.Context) ([]KitchenQueueItem, error)

	// SendNotificationByStatus sends a status-based notification to an arbitrary device token
	SendNotificationByStatus(ctx context.Context, fcmClient *notification.FCMClient, deviceToken string, orderID string, status string, tableNumber string) error
}

type TableTimerI interface {
	StartTableTimerIfNeeded(ctx context.Context, orderID string, actorUserID string, actorRole string) (*model.TableTimerResponse, error)
	GetTableTimerState(ctx context.Context, orderID string) (*model.TableTimerResponse, error)
	PauseTableTimer(ctx context.Context, orderID string, actorUserID string, actorRole string) (*model.TableTimerResponse, error)
	ResumeTableTimer(ctx context.Context, orderID string, actorUserID string, actorRole string) (*model.TableTimerResponse, error)
	CloseTableTimer(ctx context.Context, orderID string, actorUserID string, actorRole string) (*model.TableTimerResponse, error)
}

type CalculationI interface {
	CreateCalculation(ctx context.Context, goodID, ingredientID, quantity string) (*model.CalculationResponse, error)
	CreateCalculationForCompound(ctx context.Context, compoundID, ingredientID, quantity string) (*model.CalculationResponse, error)
	CreateCalculationWithCompound(ctx context.Context, goodID, compoundID, quantity string) (*model.CalculationResponse, error)
	CreateCalculationCompoundToCompound(ctx context.Context, parentCompoundID, childCompoundID, quantity string) (*model.CalculationResponse, error)
	PreviewCalculations(ctx context.Context, req *model.PreviewCalculationsRequest) (*model.PreviewCalculationsResponse, error)
	GetCalculationByID(ctx context.Context, calculationID string) (*model.CalculationResponse, error)
	GetCalculationsByGoodID(ctx context.Context, goodID string) ([]*model.CalculationResponse, error)
	GetCalculationsByCompoundID(ctx context.Context, compoundID string) ([]*model.CalculationResponse, error)
	GetTotalCostByGoodID(ctx context.Context, goodID string) (string, error)
	GetTotalCostByCompoundID(ctx context.Context, compoundID string) (string, error)
	UpdateCalculation(ctx context.Context, calculationID string, quantity *string) (*model.CalculationResponse, error)
	DeleteCalculation(ctx context.Context, calculationID string) error
	DeleteCalculationsByGoodID(ctx context.Context, goodID string) error
	DeleteCalculationsByCompoundID(ctx context.Context, compoundID string) error
	GetGoodWithCalculations(ctx context.Context, goodID string) (*model.GoodCalculationResponse, error)
	GetCompoundWithCalculations(ctx context.Context, compoundID string) (*model.CompoundCalculationResponse, error)
}

type TransferI interface {
	CreateTransferBatch(ctx context.Context, req model.CreateTransferBatchRequest) (*model.TransferResponse, error)
	CreateTransfer(ctx context.Context, req model.CreateTransferRequest) (*model.TransferResponse, error)
	AddTransferItems(ctx context.Context, req model.CreateTransferItemsRequest) (*model.TransferResponse, error)
	GetTransferByID(ctx context.Context, transferID string) (*model.TransferResponse, error)
	GetAllTransfers(ctx context.Context, filter model.TransferFilter, expand bool, limit, offset int32) (*model.PaginatedTransfersResponse, error)
	DeleteTransfer(ctx context.Context, transferID string) error
	DeleteTransferItem(ctx context.Context, itemID string) error
	DeleteTransfersBatch(ctx context.Context, req *model.DeleteTransfersBatchRequest) error
	UpsertTransferItems(ctx context.Context, transferID string, req model.UpsertTransferItemsRequest) (*model.TransferResponse, error)
}

type CashRegisterI interface {
	CreateCashRegister(ctx context.Context, req model.CashRegisterRequest) (model.CashRegisterResponse, error)
	GetCashRegisterByID(ctx context.Context, id uuid.UUID) (model.CashRegisterResponse, error)
	GetAllCashRegisters(ctx context.Context, search string, limit, offset int32) ([]model.CashRegisterResponse, int64, error)
	GetCashRegistersByBranchID(ctx context.Context, branchID uuid.UUID, limit, offset int32) ([]model.CashRegisterResponse, error)
	UpdateCashRegister(ctx context.Context, id uuid.UUID, req model.CashRegisterRequest) (model.CashRegisterResponse, error)
	DeleteCashRegister(ctx context.Context, id uuid.UUID) error
	RestoreCashRegister(ctx context.Context, id uuid.UUID) error
}

type CashRegisterShiftI interface {
	OpenShift(ctx context.Context, req model.OpenCashRegisterShiftRequest) (*model.CashRegisterShiftResponse, error)
	CloseShift(ctx context.Context, id string, req model.CloseCashRegisterShiftRequest) (*model.CashRegisterShiftResponse, error)
	GetShift(ctx context.Context, id string) (*model.CashRegisterShiftResponse, error)
	GetActiveShift(ctx context.Context, cashRegisterID string) (*model.CashRegisterShiftResponse, error)
	ListShifts(ctx context.Context, cashRegisterID, cashierID, status *string, limit, offset int32) ([]*model.CashRegisterShiftResponse, int64, error)
	DeleteShift(ctx context.Context, id string) error
}

type GroupTransactionI interface {
	CreateGroupTransaction(ctx context.Context, req *model.CreateGroupTransactionRequest) (*model.GroupTransactionResponse, error)
	GetGroupTransactionByID(ctx context.Context, id string) (*model.GroupTransactionResponse, error)
	GetAllGroupTransactions(ctx context.Context, limit, offset int32) ([]*model.GroupTransactionResponse, error)
	UpdateGroupTransaction(ctx context.Context, id string, req *model.UpdateGroupTransactionRequest) (*model.GroupTransactionResponse, error)
	DeleteGroupTransaction(ctx context.Context, id string) error
	RestoreGroupTransaction(ctx context.Context, id string) (*model.GroupTransactionResponse, error)
	SearchGroupTransactions(ctx context.Context, query string, limit, offset int32) ([]*model.GroupTransactionResponse, error)
}

type TransactionI interface {
	CreateIncomeExpense(ctx context.Context, userID string, req model.CreateIncomeExpenseRequest) (*model.TransactionResponse, error)
	CreateTransfer(ctx context.Context, userID string, req model.CreateCashTransferRequest) (*model.TransactionResponse, error)
	GetTransactionByID(ctx context.Context, id uuid.UUID) (*model.TransactionResponse, error)
	GetAllTransactions(ctx context.Context, limit, offset int32) ([]model.TransactionResponse, error)
	GetTransactionsByType(ctx context.Context, txType string, limit, offset int32) ([]model.TransactionResponse, error)
	GetTransactionsByCashRegister(ctx context.Context, cashRegisterID string, limit, offset int32) ([]model.TransactionResponse, error)
	GetTransactionsByDateRange(ctx context.Context, from, to time.Time, limit, offset int32) ([]model.TransactionResponse, error)
	GetTransactionsByGroup(ctx context.Context, groupID string, limit, offset int32) ([]model.TransactionResponse, error)
	UpdateTransaction(ctx context.Context, id uuid.UUID, req model.UpdateTransactionRequest) (*model.TransactionResponse, error)
	DeleteTransaction(ctx context.Context, id uuid.UUID) error
	GetCashReport(ctx context.Context, req model.CashReportRequest) (*model.CashReportResponse, error)
}

type ModifierI interface {
	CreateModifier(ctx context.Context, req model.CreateModifierRequest) (*model.ModifierResponse, error)
	GetModifierByID(ctx context.Context, modifierID string) (*model.ModifierResponse, error)
	GetAllModifiers(ctx context.Context, limit, offset int32) ([]*model.ModifierResponse, error)
	UpdateModifier(ctx context.Context, modifierID string, req model.UpdateModifierRequest) (*model.ModifierResponse, error)
	DeleteModifier(ctx context.Context, modifierID string) error
	RestoreModifier(ctx context.Context, modifierID string) error
	SearchModifiers(ctx context.Context, query string, limit, offset int32) ([]*model.ModifierResponse, error)
}

type GoodsModifierI interface {
	AttachModifiersToGood(ctx context.Context, goodID string, req model.AttachModifiersToGoodRequest) error
	ReplaceModifiersForGood(ctx context.Context, goodID string, req model.AttachModifiersToGoodRequest) error
	GetModifiersByGoodID(ctx context.Context, goodID string) ([]*model.GoodModifierResponse, error)
	DetachModifierFromGood(ctx context.Context, goodID, modifierID string) error
}

type SettingsI interface {
	ListPrinterSettings(ctx context.Context, brandID string) ([]model.PrinterSettingResponse, error)
	GetPrinterSettingByID(ctx context.Context, brandID, id string) (*model.PrinterSettingResponse, error)
	CreatePrinterSetting(ctx context.Context, brandID string, req model.CreatePrinterSettingRequest) (*model.PrinterSettingResponse, error)
	UpdatePrinterSetting(ctx context.Context, brandID, id string, req model.UpdatePrinterSettingRequest) (*model.PrinterSettingResponse, error)
}

type I interface {
	Auth() AuthI
	Payment() PaymentI
	Sync() SyncI
	Repository() *repository.Repository
	Minio() MinioI
	Shift() ShiftI
	Organization() OrganizationI
	Ingredient() IngredientI
	Storage() StorageI
	Department() DepartmentI
	Hall() HallI
	Category() CategoryI
	Compound() CompoundI
	Goods() GoodsI
	CafeTable() CafeTableI
	Supplier() SupplierI
	Inventory() InventoryI
	Invoice() InvoiceI
	Order() OrderI
	TableTimer() TableTimerI
	Brand() BrandI
	Calculation() CalculationI
	Deduction() DeductionI
	Transfer() TransferI
	Cash() CashRegisterI
	CashRegisterShift() CashRegisterShiftI
	GroupTransaction() GroupTransactionI
	Transaction() TransactionI
	Shipment() ShipmentI
	OutgoingInvoice() OutgoingInvoiceI
	Report() ReportI
	SeparationAct() SeparationActI
	Modifier() ModifierI
	GoodsModifier() GoodsModifierI
	Settings() SettingsI
}

type Service struct {
	auth              AuthI
	payment           PaymentI
	sync              SyncI
	repo              *repository.Repository
	minio             MinioI
	shift             ShiftI
	organization      OrganizationI
	ingredient        IngredientI
	storage           StorageI
	department        DepartmentI
	hall              HallI
	category          CategoryI
	compound          CompoundI
	goods             GoodsI
	cafeTable         CafeTableI
	supplier          SupplierI
	inventory         InventoryI
	invoice           InvoiceI
	order             OrderI
	tableTimer        TableTimerI
	brand             BrandI
	calculation       CalculationI
	deduction         DeductionI
	transfer          TransferI
	cash              CashRegisterI
	cashRegisterShift CashRegisterShiftI
	groupTransaction  GroupTransactionI
	transaction       TransactionI
	shipment          ShipmentI
	outgoingInvoice   OutgoingInvoiceI
	report            ReportI
	separationAct     SeparationActI
	modifier          ModifierI
	goodsModifier     GoodsModifierI
	settings          SettingsI
}

func New(cfg *config.Config, repo *repository.Repository, clickClient *paymentClick.Client, paymeClient *paymentPayme.Client, minioClient *minio.Minio) *Service {
	return &Service{
		auth:              NewAuthS(cfg, repo),
		payment:           NewPaymentS(cfg, repo, clickClient, paymeClient),
		sync:              NewSyncS(repo),
		repo:              repo,
		minio:             NewMinioS(cfg, minioClient),
		shift:             NewShiftS(repo),
		organization:      NewOrganizationS(repo),
		ingredient:        NewIngredientS(repo),
		storage:           NewStorageS(repo),
		department:        NewDepartmentS(repo),
		hall:              NewHallS(repo),
		category:          NewCategoryS(repo),
		compound:          NewCompoundS(repo),
		goods:             NewGoodsS(repo),
		cafeTable:         NewCafeTableS(repo),
		supplier:          NewSupplierS(repo),
		inventory:         NewInventoryS(repo),
		invoice:           NewInvoiceS(repo),
		order:             NewOrderS(repo),
		tableTimer:        NewTableTimerS(repo),
		brand:             NewBrandS(repo),
		calculation:       NewCalculationS(repo),
		deduction:         NewDeductionS(repo),
		transfer:          NewTransferS(repo),
		cash:              NewCashRegisterS(repo),
		cashRegisterShift: NewCashRegisterShiftS(repo),
		groupTransaction:  NewGroupTransactionS(repo),
		transaction:       NewTransactionS(repo),
		shipment:          NewShipmentS(repo),
		outgoingInvoice:   NewOutgoingInvoiceS(repo),
		report:            NewReportS(repo),
		separationAct:     NewSeparationActS(repo),
		modifier:          NewModifierS(repo),
		goodsModifier:     NewGoodsModifierS(repo),
		settings:          NewSettingsS(repo),
	}
}

func (s *Service) Minio() MinioI {
	return s.minio
}

func (s *Service) Shift() ShiftI {
	return s.shift
}

func (s *Service) Organization() OrganizationI {
	return s.organization
}

func (s *Service) Ingredient() IngredientI {
	return s.ingredient
}

func (s *Service) Storage() StorageI {
	return s.storage
}

func (s *Service) Auth() AuthI {
	return s.auth
}
func (s *Service) Payment() PaymentI {
	return s.payment
}

func (s *Service) Sync() SyncI {
	return s.sync
}

func (s *Service) Repository() *repository.Repository {
	return s.repo
}

func (s *Service) Department() DepartmentI {
	return s.department
}

func (s *Service) Hall() HallI {
	return s.hall
}

func (s *Service) Category() CategoryI {
	return s.category
}

func (s *Service) Compound() CompoundI {
	return s.compound
}

func (s *Service) Goods() GoodsI {
	return s.goods
}

func (s *Service) CafeTable() CafeTableI {
	return s.cafeTable
}

func (s *Service) Supplier() SupplierI {
	return s.supplier
}

func (s *Service) Inventory() InventoryI {
	return s.inventory
}

func (s *Service) Invoice() InvoiceI {
	return s.invoice
}

func (s *Service) Order() OrderI {
	return s.order
}

func (s *Service) TableTimer() TableTimerI {
	return s.tableTimer
}

func (s *Service) Brand() BrandI {
	return s.brand
}

func (s *Service) Calculation() CalculationI {
	return s.calculation
}

func (s *Service) Deduction() DeductionI {
	return s.deduction
}

func (s *Service) Transfer() TransferI {
	return s.transfer
}

func (s *Service) Cash() CashRegisterI {
	return s.cash
}

func (s *Service) CashRegisterShift() CashRegisterShiftI {
	return s.cashRegisterShift
}

func (s *Service) GroupTransaction() GroupTransactionI {
	return s.groupTransaction
}

func (s *Service) Transaction() TransactionI {
	return s.transaction
}

func (s *Service) Shipment() ShipmentI {
	return s.shipment
}

func (s *Service) OutgoingInvoice() OutgoingInvoiceI {
	return s.outgoingInvoice
}

func (s *Service) Report() ReportI {
	return s.report
}

func (s *Service) SeparationAct() SeparationActI {
	return s.separationAct
}

func (s *Service) Modifier() ModifierI {
	return s.modifier
}

func (s *Service) GoodsModifier() GoodsModifierI {
	return s.goodsModifier
}

func (s *Service) Settings() SettingsI {
	return s.settings
}
