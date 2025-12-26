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
	"gitlab.yurtal.tech/company/maryai/back/pkg/paymentClick"
	"gitlab.yurtal.tech/company/maryai/back/pkg/paymentPayme"
)

type AuthI interface {
	Register(ctx context.Context, req model.RegisterRequest) error
	Login(ctx context.Context, req model.LoginRequest, jwtCfg *config.JwtConfig) (model.LoginResponse, error)
	LoginGlobal(ctx context.Context, req model.LoginRequest, jwtCfg *config.JwtConfig) (model.LoginResponse, error)
	Refresh(ctx context.Context, req model.RefreshRequest, jwtCfg *config.JwtConfig) (model.RefreshResponse, error)
	UpdateUserPassword(ctx context.Context, userID uuid.UUID, currentPassword, newPassword string) error
	GetUserByID(ctx context.Context, userID string) (model.UserResponse, error)
	UpdateUser(ctx context.Context, req model.UpdateUserRequest, userID string) (model.UserResponse, error)
	// Additional methods for QR ordering system
	GetUsersByRole(ctx context.Context, role string) ([]model.UserResponse, error)
	GetAllStaff(ctx context.Context) ([]model.UserResponse, error)
	GetKitchenStaff(ctx context.Context) ([]model.UserResponse, error)
	GetWaiters(ctx context.Context) ([]model.UserResponse, error)
	GetCashiers(ctx context.Context) ([]model.UserResponse, error)
	DeleteUser(ctx context.Context, userID string) error
	RestoreUser(ctx context.Context, userID string) error
	SearchUsers(ctx context.Context, query string, limit, offset int32) ([]model.UserResponse, error)
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
	GetAllBranches(ctx context.Context, limit, offset int32) ([]model.BranchResponse, error)
	DeleteBranch(ctx context.Context, branchID string) error
	RestoreBranch(ctx context.Context, branchID string) error
	CreateTranslation(ctx context.Context, uz *string, ru *string, en *string) (*model.TranslationResponse, error)
	GetTranslationByID(ctx context.Context, translationID string) (*model.TranslationResponse, error)
	GetAllTranslations(ctx context.Context, limit, offset int32) ([]model.TranslationResponse, error)
	DeleteTranslation(ctx context.Context, translationID string) error
	RestoreTranslation(ctx context.Context, translationID string) error
}

type StorageI interface {
	CreateStorage(ctx context.Context, name string, branchID string, nameI18n *uuid.UUID, pictureUrl *string) (*model.StorageResponse, error)
	GetStorageByID(ctx context.Context, storageID string) (*model.StorageResponse, error)
	GetAllStorages(ctx context.Context, limit, offset int32) ([]model.StorageResponse, error)
	GetStoragesByBranchID(ctx context.Context, branchID string, limit, offset int32) ([]model.StorageResponse, error)
	UpdateStorage(ctx context.Context, storageID string, name *string, branchID *string, nameI18n *string, pictureUrl *string) (*model.StorageResponse, error)
	DeleteStorage(ctx context.Context, storageID string) error
	RestoreStorage(ctx context.Context, storageID string) error
	SearchStorages(ctx context.Context, query string, limit, offset int32) ([]model.StorageResponse, error)
}

type DepartmentI interface {
	CreateDepartment(ctx context.Context, name string, nameI18n *string, storageID *string) (*model.DepartmentResponse, error)
	GetDepartmentByID(ctx context.Context, departmentID string) (*model.DepartmentResponse, error)
	GetAllDepartments(ctx context.Context, limit, offset int32) ([]*model.DepartmentResponse, error)
	GetDepartmentsByStorageID(ctx context.Context, storageID string, limit, offset int32) ([]*model.DepartmentResponse, error)
	UpdateDepartment(ctx context.Context, departmentID string, name *string, nameI18n *string, storageID *string) (*model.DepartmentResponse, error)
	DeleteDepartment(ctx context.Context, departmentID string) error
	RestoreDepartment(ctx context.Context, departmentID string) (*model.DepartmentResponse, error)
	SearchDepartments(ctx context.Context, query string, limit, offset int32) ([]*model.DepartmentResponse, error)
}

type HallI interface {
	CreateHall(ctx context.Context, name string, branchID string, nameI18n *uuid.UUID) (*model.HallResponse, error)
	GetHallByID(ctx context.Context, hallID string) (*model.HallResponse, error)
	GetAllHalls(ctx context.Context, limit, offset int32) ([]*model.HallResponse, error)
	GetHallsByBranchID(ctx context.Context, branchID string, limit, offset int32) ([]*model.HallResponse, error)
	UpdateHall(ctx context.Context, hallID string, name *string, branchID *string, nameI18n *string) (*model.HallResponse, error)
	DeleteHall(ctx context.Context, hallID string) error
	RestoreHall(ctx context.Context, hallID string) (*model.HallResponse, error)
	SearchHalls(ctx context.Context, query string, limit, offset int32) ([]*model.HallResponse, error)
}

type IngredientI interface {
	CreateIngredientGroup(ctx context.Context, name string, nameI18n *uuid.UUID, pictureUrl *string) (*model.IngredientGroupResponse, error)
	GetIngredientGroupByID(ctx context.Context, groupID string) (*model.IngredientGroupResponse, error)
	GetAllIngredientGroups(ctx context.Context, limit, offset int32) ([]model.IngredientGroupResponse, error)
	UpdateIngredientGroup(ctx context.Context, groupID string, name *string, nameI18n *string, pictureUrl *string) (*model.IngredientGroupResponse, error)
	DeleteIngredientGroup(ctx context.Context, groupID string) error
	RestoreIngredientGroup(ctx context.Context, groupID string) error

	CreateIngredient(ctx context.Context, name string, nameI18n *uuid.UUID, groupID *string, measurement *string, pictureUrl *string, brandID *string) (*model.IngredientResponse, error)
	GetIngredientByID(ctx context.Context, ingredientID string) (*model.IngredientResponse, error)
	GetAllIngredients(ctx context.Context, limit, offset int32) ([]model.IngredientResponse, error)
	GetIngredientsByGroupID(ctx context.Context, groupID string, limit, offset int32) ([]model.IngredientResponse, error)
	UpdateIngredient(ctx context.Context, ingredientID string, name *string, nameI18n *string, groupID *string, measurement *string, pictureUrl *string, brandID *string) (*model.IngredientResponse, error)
	DeleteIngredient(ctx context.Context, ingredientID string) error
	RestoreIngredient(ctx context.Context, ingredientID string) error

	CreateIngredientStock(ctx context.Context, ingredientID string, quantity int64, branchID string) (*model.IngredientStockResponse, error)
	GetIngredientStockByID(ctx context.Context, stockID string) (*model.IngredientStockResponse, error)
	GetStockByIngredientAndBranch(ctx context.Context, ingredientID, branchID string) (*model.IngredientStockResponse, error)
	GetAllIngredientStock(ctx context.Context, limit, offset int32) ([]model.IngredientStockResponse, error)
	GetStockByBranchID(ctx context.Context, branchID string, limit, offset int32) ([]model.IngredientStockResponse, error)
	GetStockByIngredientID(ctx context.Context, ingredientID string, limit, offset int32) ([]model.IngredientStockResponse, error)
	UpdateIngredientStock(ctx context.Context, stockID string, quantity int64) (*model.IngredientStockResponse, error)
	AddToIngredientStock(ctx context.Context, stockID string, quantity int64) (*model.IngredientStockResponse, error)
	RemoveFromIngredientStock(ctx context.Context, stockID string, quantity int64) (*model.IngredientStockResponse, error)
	DeleteIngredientStock(ctx context.Context, stockID string) error
	RestoreIngredientStock(ctx context.Context, stockID string) error
}

type CategoryI interface {
	CreateCategory(ctx context.Context, name string, nameI18n, departmentID, storageID, parent *string, pictureUrl *string) (*model.CategoryResponse, error)
	GetCategoryByID(ctx context.Context, categoryID string) (*model.CategoryResponse, error)
	GetAllCategories(ctx context.Context, limit, offset int32) ([]*model.CategoryResponse, error)
	GetCategoriesByDepartmentID(ctx context.Context, departmentID string, limit, offset int32) ([]*model.CategoryResponse, error)
	GetCategoriesByStorageID(ctx context.Context, storageID string, limit, offset int32) ([]*model.CategoryResponse, error)
	GetCategoriesByParentID(ctx context.Context, parentID string, limit, offset int32) ([]*model.CategoryResponse, error)
	GetRootCategories(ctx context.Context, limit, offset int32) ([]*model.CategoryResponse, error)
	UpdateCategory(ctx context.Context, categoryID string, name, nameI18n, departmentID, storageID, parent *string, pictureUrl *string) (*model.CategoryResponse, error)
	DeleteCategory(ctx context.Context, categoryID string) error
	RestoreCategory(ctx context.Context, categoryID string) (*model.CategoryResponse, error)
	SearchCategories(ctx context.Context, query string, limit, offset int32) ([]*model.CategoryResponse, error)
}

type CompoundI interface {
	// Compound methods
	CreateCompound(ctx context.Context, name string, nameI18n, description, descriptionI18n, measurement, departmentID *string, quantity int32, price *string, pictureUrl *string) (*model.CompoundResponse, error)
	GetCompoundByID(ctx context.Context, compoundID string) (*model.CompoundResponse, error)
	GetAllCompounds(ctx context.Context, limit, offset int32) ([]*model.CompoundResponse, error)
	GetCompoundsByDepartmentID(ctx context.Context, departmentID string, limit, offset int32) ([]*model.CompoundResponse, error)
	UpdateCompound(ctx context.Context, compoundID string, name, nameI18n, description, descriptionI18n, measurement, departmentID *string, quantity *int32, price *string, pictureUrl *string) (*model.CompoundResponse, error)
	DeleteCompound(ctx context.Context, compoundID string) error
	RestoreCompound(ctx context.Context, compoundID string) (*model.CompoundResponse, error)
	SearchCompounds(ctx context.Context, query string, limit, offset int32) ([]*model.CompoundResponse, error)

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
	CreateGood(ctx context.Context, name string, description *string, nameI18n, descriptionI18n, categoryID, departmentID *string, price string, cookTime *int32, pictureUrl *string) (*model.GoodResponse, error)
	GetGoodByID(ctx context.Context, goodID string) (*model.GoodResponse, error)
	GetAllGoods(ctx context.Context, limit, offset int32) ([]*model.GoodResponse, error)
	GetGoodsByCategory(ctx context.Context, categoryID string, limit, offset int32) ([]*model.GoodResponse, error)
	GetGoodsByDepartment(ctx context.Context, departmentID string, limit, offset int32) ([]*model.GoodResponse, error)
	GetGoodsByPriceRange(ctx context.Context, minPrice, maxPrice string, limit, offset int32) ([]*model.GoodResponse, error)
	UpdateGood(ctx context.Context, goodID string, name, description, nameI18n, descriptionI18n, categoryID, departmentID, price *string, cookTime *int32, pictureUrl *string) (*model.GoodResponse, error)
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
	CreateCafeTable(ctx context.Context, hallID string, number int32, capacity int32, status *string) (*model.CafeTableResponse, error)
	GetCafeTableByID(ctx context.Context, tableID string) (*model.CafeTableResponse, error)
	GetAllCafeTables(ctx context.Context, limit, offset int32) ([]model.CafeTableResponse, error)
	GetCafeTablesByHallID(ctx context.Context, hallID string, limit, offset int32) ([]model.CafeTableResponse, error)
	GetCafeTablesByStatus(ctx context.Context, status string, limit, offset int32) ([]model.CafeTableResponse, error)
	GetCafeTablesByHallAndStatus(ctx context.Context, hallID, status string) ([]model.CafeTableResponse, error)
	GetAvailableTablesByHall(ctx context.Context, hallID string) ([]model.CafeTableResponse, error)
	GetAvailableTablesByCapacity(ctx context.Context, capacity, limit, offset int32) ([]model.CafeTableResponse, error)
	GetAvailableTablesByHallAndCapacity(ctx context.Context, hallID string, capacity int32) ([]model.CafeTableResponse, error)
	UpdateCafeTable(ctx context.Context, tableID string, hallID *string, number *int32, capacity *int32, status *string) (*model.CafeTableResponse, error)
	UpdateCafeTableStatus(ctx context.Context, tableID string, status string) (*model.CafeTableResponse, error)
	SetTableFree(ctx context.Context, tableID string) (*model.CafeTableResponse, error)
	SetTableBusy(ctx context.Context, tableID string) (*model.CafeTableResponse, error)
	DeleteCafeTable(ctx context.Context, tableID string) error
	RestoreCafeTable(ctx context.Context, tableID string) error
	GetTableOccupancyStats(ctx context.Context) (*model.TableOccupancyStats, error)
	SearchCafeTables(ctx context.Context, query string, limit, offset int32) ([]model.CafeTableResponse, error)
}

type InvoiceI interface {
	// Invoice methods
	CreateInvoice(ctx context.Context, req *model.CreateInvoiceRequest) (*model.InvoiceResponse, error)
	GetInvoiceByID(ctx context.Context, id string) (*model.InvoiceResponse, error)
	GetAllInvoices(ctx context.Context, limit, offset int32) ([]*model.InvoiceResponse, error)
	GetInvoicesByStatus(ctx context.Context, status string, limit, offset int32) ([]*model.InvoiceResponse, error)
	GetInvoicesBySupplier(ctx context.Context, supplierName string, limit, offset int32) ([]*model.InvoiceResponse, error)
	GetInvoicesByDateRange(ctx context.Context, startDate, endDate time.Time, limit, offset int32) ([]*model.InvoiceResponse, error)
	UpdateInvoice(ctx context.Context, id string, req *model.UpdateInvoiceRequest) (*model.InvoiceResponse, error)
	UpdateInvoiceStatus(ctx context.Context, id string, status string) (*model.InvoiceResponse, error)
	MarkInvoiceArrived(ctx context.Context, id string) (*model.InvoiceResponse, error)
	MarkInvoiceReceived(ctx context.Context, id string) (*model.InvoiceResponse, error)
	CancelInvoice(ctx context.Context, id string) (*model.InvoiceResponse, error)
	DeleteInvoice(ctx context.Context, id string) error
	RestoreInvoice(ctx context.Context, id string) error
	CountInvoices(ctx context.Context) (int64, error)
	CountInvoicesByStatus(ctx context.Context, status string) (int64, error)
	SearchInvoices(ctx context.Context, query string, limit, offset int32) ([]*model.InvoiceResponse, error)
	GetInvoiceWithDetails(ctx context.Context, id string) (*model.InvoiceWithDetailsResponse, error)
	GetInvoiceStatsBySupplier(ctx context.Context, limit, offset int32) ([]*model.InvoiceStatsBySupplierResponse, error)
	GetInvoiceStatsByDateRange(ctx context.Context, startDate, endDate time.Time) (*model.InvoiceStatsByDateRangeResponse, error)
	// Invoice detail methods
	CreateInvoiceDetail(ctx context.Context, invoiceID string, req *model.CreateInvoiceDetailRequest) (*model.InvoiceDetailResponse, error)
	GetInvoiceDetailByID(ctx context.Context, id string) (*model.InvoiceDetailResponse, error)
	GetAllInvoiceDetails(ctx context.Context, limit, offset int32) ([]*model.InvoiceDetailResponse, error)
	GetInvoiceDetailsByInvoiceID(ctx context.Context, invoiceID string) ([]*model.InvoiceDetailResponse, error)
	GetInvoiceDetailsByIngredientID(ctx context.Context, ingredientID string, limit, offset int32) ([]*model.InvoiceDetailResponse, error)
	UpdateInvoiceDetail(ctx context.Context, id string, req *model.UpdateInvoiceDetailRequest) (*model.InvoiceDetailResponse, error)
	UpdateInvoiceDetailQuantity(ctx context.Context, id string, quantity int64) (*model.InvoiceDetailResponse, error)
	DeleteInvoiceDetail(ctx context.Context, id string) error
	RestoreInvoiceDetail(ctx context.Context, id string) error
	DeleteInvoiceDetailsByInvoiceID(ctx context.Context, invoiceID string) error
	CountInvoiceDetails(ctx context.Context) (int64, error)
	CountInvoiceDetailsByInvoice(ctx context.Context, invoiceID string) (int64, error)
	GetInvoiceDetailWithIngredient(ctx context.Context, id string) (*model.InvoiceDetailWithIngredientResponse, error)
}

type OrderI interface {
	CreateOrder(ctx context.Context, req model.CreateOrderRequest) (*model.OrderResponse, error)
	GetOrderByID(ctx context.Context, orderID string) (*model.OrderResponse, error)
	GetAllOrders(ctx context.Context, limit, offset int32) ([]model.OrderResponse, error)
	GetOrdersByStatus(ctx context.Context, status string, limit, offset int32) ([]model.OrderResponse, error)
	GetOrdersByWaiterID(ctx context.Context, waiterID string, limit, offset int32) ([]model.OrderResponse, error)
	GetOrdersByTableID(ctx context.Context, tableID string) ([]model.OrderResponse, error)
	UpdateOrder(ctx context.Context, orderID string, req model.UpdateOrderRequest) (*model.OrderResponse, error)
	UpdateOrderStatus(ctx context.Context, orderID string, status string) (*model.OrderResponse, error)
	MarkOrderPaid(ctx context.Context, orderID string, cashierID string) (*model.OrderResponse, error)
	AssignWaiterToOrder(ctx context.Context, orderID string, waiterID string) (*model.OrderResponse, error)
	AssignCashierToOrder(ctx context.Context, orderID string, cashierID string) (*model.OrderResponse, error)
	CancelOrder(ctx context.Context, orderID string) (*model.OrderResponse, error)
	MarkOrderCooking(ctx context.Context, orderID string) (*model.OrderResponse, error)
	MarkOrderReady(ctx context.Context, orderID string) (*model.OrderResponse, error)
	MarkOrderServed(ctx context.Context, orderID string) (*model.OrderResponse, error)
	DeleteOrder(ctx context.Context, orderID string) error
	RestoreOrder(ctx context.Context, orderID string) error

	CreateOrderItem(ctx context.Context, req model.CreateOrderItemRequest) (*model.OrderItemResponse, error)
	GetOrderItemByID(ctx context.Context, itemID string) (*model.OrderItemResponse, error)
	GetAllOrderItems(ctx context.Context, limit, offset int32) ([]model.OrderItemResponse, error)
	GetOrderItemsByOrderID(ctx context.Context, orderID string) ([]model.OrderItemResponse, error)
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
}

type I interface {
	Auth() AuthI
	Payment() PaymentI
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
	Invoice() InvoiceI
	Order() OrderI
	Brand() BrandI
}

type Service struct {
	auth         AuthI
	payment      PaymentI
	repo         *repository.Repository
	minio        MinioI
	shift        ShiftI
	organization OrganizationI
	ingredient   IngredientI
	storage      StorageI
	department   DepartmentI
	hall         HallI
	category     CategoryI
	compound     CompoundI
	goods        GoodsI
	cafeTable    CafeTableI
	invoice      InvoiceI
	order        OrderI
	brand        BrandI
}

func New(cfg *config.Config, repo *repository.Repository, clickClient *paymentClick.Client, paymeClient *paymentPayme.Client, minioClient *minio.Minio) *Service {
	return &Service{
		auth:         NewAuthS(cfg, repo),
		payment:      NewPaymentS(cfg, repo, clickClient, paymeClient),
		repo:         repo,
		minio:        NewMinioS(cfg, minioClient),
		shift:        NewShiftS(repo),
		organization: NewOrganizationS(repo),
		ingredient:   NewIngredientS(repo),
		storage:      NewStorageS(repo),
		department:   NewDepartmentS(repo),
		hall:         NewHallS(repo),
		category:     NewCategoryS(repo),
		compound:     NewCompoundS(repo),
		goods:        NewGoodsS(repo),
		cafeTable:    NewCafeTableS(repo),
		invoice:      NewInvoiceS(repo),
		order:        NewOrderS(repo),
		brand:        NewBrandS(repo),
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

func (s *Service) Invoice() InvoiceI {
	return s.invoice
}

func (s *Service) Order() OrderI {
	return s.order
}

func (s *Service) Brand() BrandI {
	return s.brand
}
