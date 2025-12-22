package service

import (
	"context"
	"io"

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
	PutAvatar(ctx context.Context, file io.Reader, size int64, userID string) (string, error)
	GetAvatar(ctx context.Context, objectName string) (*RealMinio.Object, error)
	PutVideo(ctx context.Context, file io.Reader, size int64, fileName string, extension string) (string, error)
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
	CreateStorage(ctx context.Context, name string, branchID string, nameI18n *uuid.UUID) (*model.StorageResponse, error)
	GetStorageByID(ctx context.Context, storageID string) (*model.StorageResponse, error)
	GetAllStorages(ctx context.Context, limit, offset int32) ([]model.StorageResponse, error)
	GetStoragesByBranchID(ctx context.Context, branchID string, limit, offset int32) ([]model.StorageResponse, error)
	UpdateStorage(ctx context.Context, storageID string, name *string, branchID *string, nameI18n *string) (*model.StorageResponse, error)
	DeleteStorage(ctx context.Context, storageID string) error
	RestoreStorage(ctx context.Context, storageID string) error
	SearchStorages(ctx context.Context, query string, limit, offset int32) ([]model.StorageResponse, error)
}

type DepartmentI interface {
	CreateDepartment(ctx context.Context, name string, nameI18n *uuid.UUID, storageID *string) (*model.DepartmentResponse, error)
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
	CreateIngredientGroup(ctx context.Context, name string, nameI18n *uuid.UUID) (*model.IngredientGroupResponse, error)
	GetIngredientGroupByID(ctx context.Context, groupID string) (*model.IngredientGroupResponse, error)
	GetAllIngredientGroups(ctx context.Context, limit, offset int32) ([]model.IngredientGroupResponse, error)
	UpdateIngredientGroup(ctx context.Context, groupID string, name *string, nameI18n *string) (*model.IngredientGroupResponse, error)
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
	CreateCategory(ctx context.Context, name string, nameI18n, departmentID, storageID, parent *string) (*model.CategoryResponse, error)
	GetCategoryByID(ctx context.Context, categoryID string) (*model.CategoryResponse, error)
	GetAllCategories(ctx context.Context, limit, offset int32) ([]*model.CategoryResponse, error)
	GetCategoriesByDepartmentID(ctx context.Context, departmentID string, limit, offset int32) ([]*model.CategoryResponse, error)
	GetCategoriesByStorageID(ctx context.Context, storageID string, limit, offset int32) ([]*model.CategoryResponse, error)
	GetCategoriesByParentID(ctx context.Context, parentID string, limit, offset int32) ([]*model.CategoryResponse, error)
	GetRootCategories(ctx context.Context, limit, offset int32) ([]*model.CategoryResponse, error)
	UpdateCategory(ctx context.Context, categoryID string, name, nameI18n, departmentID, storageID, parent *string) (*model.CategoryResponse, error)
	DeleteCategory(ctx context.Context, categoryID string) error
	RestoreCategory(ctx context.Context, categoryID string) (*model.CategoryResponse, error)
	SearchCategories(ctx context.Context, query string, limit, offset int32) ([]*model.CategoryResponse, error)
}

type CompoundI interface {
	// Compound methods
	CreateCompound(ctx context.Context, name string, nameI18n, description, descriptionI18n, measurement, departmentID *string, quantity int32, price *string) (*model.CompoundResponse, error)
	GetCompoundByID(ctx context.Context, compoundID string) (*model.CompoundResponse, error)
	GetAllCompounds(ctx context.Context, limit, offset int32) ([]*model.CompoundResponse, error)
	GetCompoundsByDepartmentID(ctx context.Context, departmentID string, limit, offset int32) ([]*model.CompoundResponse, error)
	UpdateCompound(ctx context.Context, compoundID string, name, nameI18n, description, descriptionI18n, measurement, departmentID *string, quantity *int32, price *string) (*model.CompoundResponse, error)
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
	CreateGood(ctx context.Context, name string, description *string, nameI18n, descriptionI18n, categoryID, departmentID *string, price string, cookTime *int32) (*model.GoodResponse, error)
	GetGoodByID(ctx context.Context, goodID string) (*model.GoodResponse, error)
	GetAllGoods(ctx context.Context, limit, offset int32) ([]*model.GoodResponse, error)
	GetGoodsByCategory(ctx context.Context, categoryID string, limit, offset int32) ([]*model.GoodResponse, error)
	GetGoodsByDepartment(ctx context.Context, departmentID string, limit, offset int32) ([]*model.GoodResponse, error)
	GetGoodsByPriceRange(ctx context.Context, minPrice, maxPrice string, limit, offset int32) ([]*model.GoodResponse, error)
	UpdateGood(ctx context.Context, goodID string, name, description, nameI18n, descriptionI18n, categoryID, departmentID, price *string, cookTime *int32) (*model.GoodResponse, error)
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
