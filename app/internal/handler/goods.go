package handler

import (
	"fmt"
	"log"
	"net/http"
	"strconv"
	"strings"

	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
	"gitlab.yurtal.tech/company/maryai/back/internal/model"
)

// CreateGood creates a new good/menu item
// @Summary Create good
// @Description Create a new good/menu item
// @Tags Goods
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param lang query string false "Language (uz, ru, en)" default(uz)
// @Param request body model.CreateGoodRequest true "Create good request"
// @Success 201 {object} model.GoodResponse
// @Failure 400 {object} model.ErrorResponse
// @Failure 401 {object} model.ErrorResponse
// @Failure 500 {object} model.ErrorResponse
// @Router /api/v1/goods [post]
func (h *Handler) CreateGood(c echo.Context) error {
	var req model.CreateGoodRequest
	if err := c.Bind(&req); err != nil {
		log.Printf("Failed to bind create good request: %v", err)
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"Invalid request format",
			err.Error(),
			http.StatusBadRequest,
		))
	}

	resp, err := h.service.Goods().CreateGood(c.Request().Context(), req.Name, req.Description, req.NameI18n, req.DescriptionI18n, req.CategoryID, req.Price, req.CookTime, req.PictureUrl, req.ColorCode)
	if err != nil {
		log.Printf("CreateGood failed: %v", err)
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse(
			"Failed to create good",
			err.Error(),
			http.StatusInternalServerError,
		))
	}

	return c.JSON(http.StatusCreated, model.NewSuccessResponse(
		"Good created successfully",
		resp,
		http.StatusCreated,
	))
}

// GetGood retrieves a good by ID
// @Summary Get good
// @Description Get good by ID
// @Tags Goods
// @Produce json
// @Security BearerAuth
// @Param lang query string false "Language (uz, ru, en)" default(uz)
// @Param id path string true "Good ID"
// @Success 200 {object} model.GoodResponse
// @Failure 400 {object} model.ErrorResponse
// @Failure 401 {object} model.ErrorResponse
// @Failure 404 {object} model.ErrorResponse
// @Failure 500 {object} model.ErrorResponse
// @Router /api/v1/goods/{id} [get]
func (h *Handler) GetGood(c echo.Context) error {
	id := c.Param("id")
	if id == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"Good ID is required",
			"missing path parameter: id",
			http.StatusBadRequest,
		))
	}

	resp, err := h.service.Goods().GetGoodByID(c.Request().Context(), id)
	if err != nil {
		log.Printf("GetGood failed for ID %s: %v", id, err)
		return c.JSON(http.StatusNotFound, model.NewErrorResponse(
			"Good not found",
			err.Error(),
			http.StatusNotFound,
		))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse(
		"Good retrieved successfully",
		resp,
		http.StatusOK,
	))
}

// GetAllGoods retrieves all goods with pagination and optional filters
// @Summary Get all goods
// @Description Get all goods with pagination, search, filters and sorting
// @Tags Goods
// @Produce json
// @Security BearerAuth
// @Param lang query string false "Language (uz, ru, en)"
// @Param limit query int false "Limit" default(20)
// @Param offset query int false "Offset" default(0)
// @Param expand query string false "Expand related fields"
// @Param category_id query string false "Filter by category ID"
// @Param department_id query string false "Filter by department ID"
// @Param storage_id query string false "Filter by storage ID"
// @Param search query string false "Search by name or description"
// @Param min_price query string false "Minimum price"
// @Param max_price query string false "Maximum price"
// @Param sort_by query string false "Sort by field" Enums(name,price,created_at) default(created_at)
// @Param sort_order query string false "Sort order" Enums(asc,desc) default(desc)
// @Success 200 {object} model.PaginatedGoodsResponse
// @Failure 400 {object} model.ErrorResponse
// @Failure 401 {object} model.ErrorResponse
// @Failure 500 {object} model.ErrorResponse
// @Router /api/v1/goods [get]
func (h *Handler) GetAllGoods(c echo.Context) error {
	return h.getGoodsList(c, "")
}

func (h *Handler) getGoodsList(c echo.Context, defaultLang string) error {
	limit := int32(20)
	if l := strings.TrimSpace(c.QueryParam("limit")); l != "" {
		val, err := strconv.Atoi(l)
		if err != nil || val <= 0 {
			return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
				"Invalid limit",
				"limit must be a positive integer",
				http.StatusBadRequest,
			))
		}
		limit = int32(val)
	}

	offset := int32(0)
	if o := strings.TrimSpace(c.QueryParam("offset")); o != "" {
		val, err := strconv.Atoi(o)
		if err != nil || val < 0 {
			return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
				"Invalid offset",
				"offset must be a non-negative integer",
				http.StatusBadRequest,
			))
		}
		offset = int32(val)
	}

	lang := strings.TrimSpace(c.QueryParam("lang"))
	if lang == "" {
		lang = defaultLang
	}

	if lang != "" {
		validLangs := map[string]bool{"uz": true, "ru": true, "en": true}
		if !validLangs[lang] {
			return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
				"Invalid language code",
				"valid values: uz, ru, en",
				http.StatusBadRequest,
			))
		}
	}

	filter := model.GoodsListFilter{
		CategoryID:   strings.TrimSpace(c.QueryParam("category_id")),
		DepartmentID: strings.TrimSpace(c.QueryParam("department_id")),
		StorageID:    strings.TrimSpace(c.QueryParam("storage_id")),
		Search:       strings.TrimSpace(c.QueryParam("search")),
		MinPrice:     strings.TrimSpace(c.QueryParam("min_price")),
		MaxPrice:     strings.TrimSpace(c.QueryParam("max_price")),
		SortBy:       strings.TrimSpace(c.QueryParam("sort_by")),
		SortOrder:    strings.TrimSpace(c.QueryParam("sort_order")),
	}

	if filter.SortBy == "" {
		filter.SortBy = "created_at"
	}
	if filter.SortOrder == "" {
		filter.SortOrder = "desc"
	}

	allowedSortBy := map[string]bool{
		"name":       true,
		"price":      true,
		"created_at": true,
	}
	if !allowedSortBy[filter.SortBy] {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"Invalid sort_by",
			"allowed values: name, price, created_at",
			http.StatusBadRequest,
		))
	}

	allowedSortOrder := map[string]bool{
		"asc":  true,
		"desc": true,
	}
	if !allowedSortOrder[filter.SortOrder] {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"Invalid sort_order",
			"allowed values: asc, desc",
			http.StatusBadRequest,
		))
	}

	for field, value := range map[string]string{
		"category_id":   filter.CategoryID,
		"department_id": filter.DepartmentID,
		"storage_id":    filter.StorageID,
	} {
		if value == "" {
			continue
		}
		if _, err := uuid.Parse(value); err != nil {
			return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
				"Invalid query parameter",
				field+" must be a valid UUID",
				http.StatusBadRequest,
			))
		}
	}

	var minPriceFloat float64
	var maxPriceFloat float64
	var err error

	if filter.MinPrice != "" {
		minPriceFloat, err = strconv.ParseFloat(filter.MinPrice, 64)
		if err != nil {
			return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
				"Invalid min_price",
				"min_price must be a valid number",
				http.StatusBadRequest,
			))
		}
	}

	if filter.MaxPrice != "" {
		maxPriceFloat, err = strconv.ParseFloat(filter.MaxPrice, 64)
		if err != nil {
			return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
				"Invalid max_price",
				"max_price must be a valid number",
				http.StatusBadRequest,
			))
		}
	}

	if filter.MinPrice != "" && filter.MaxPrice != "" && minPriceFloat > maxPriceFloat {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"Invalid price range",
			"min_price cannot be greater than max_price",
			http.StatusBadRequest,
		))
	}

	goods, total, err := h.service.Goods().GetGoodsList(c.Request().Context(), filter, lang, limit, offset)
	if err != nil {
		log.Printf("GetGoodsList failed: %v", err)
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse(
			"Failed to retrieve goods",
			err.Error(),
			http.StatusInternalServerError,
		))
	}

	if maps, expanded, err := h.expandListResponse(c, goods, "goods"); expanded {
		if err != nil {
			return c.JSON(http.StatusInternalServerError, model.NewErrorResponse(
				"expand failed",
				err.Error(),
				http.StatusInternalServerError,
			))
		}
		return c.JSON(http.StatusOK, model.NewPaginatedResponse(
			"Goods retrieved successfully",
			maps,
			int32(total),
			limit,
			offset,
			http.StatusOK,
		))
	}

	return c.JSON(http.StatusOK, model.NewPaginatedResponse(
		"Goods retrieved successfully",
		goods,
		int32(total),
		limit,
		offset,
		http.StatusOK,
	))
}

// GetGoodsByCategory retrieves goods by category
// @Summary Get goods by category
// @Description Get goods by category with pagination
// @Tags Goods
// @Produce json
// @Security BearerAuth
// @Param lang query string false "Language (uz, ru, en)" default(uz)
// @Param category_id path string true "Category ID"
// @Param limit query int false "Limit" default(20)
// @Param offset query int false "Offset" default(0)
// @Success 200 {object} []model.GoodResponse
// @Failure 400 {object} model.ErrorResponse
// @Failure 401 {object} model.ErrorResponse
// @Failure 500 {object} model.ErrorResponse
// @Router /api/v1/categories/{category_id}/goods [get]
func (h *Handler) GetGoodsByCategory(c echo.Context) error {
	categoryID := c.Param("category_id")
	if categoryID == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("category_id is required", "see logs for details", http.StatusInternalServerError))
	}

	limit := int32(20)
	if l := c.QueryParam("limit"); l != "" {
		if val, err := strconv.Atoi(l); err == nil {
			limit = int32(val)
		}
	}

	offset := int32(0)
	if o := c.QueryParam("offset"); o != "" {
		if val, err := strconv.Atoi(o); err == nil {
			offset = int32(val)
		}
	}

	resp, err := h.service.Goods().GetGoodsByCategory(c.Request().Context(), categoryID, limit, offset)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("Operation failed", err.Error(), http.StatusInternalServerError))
	}

	return c.JSON(http.StatusOK, resp)
}

// GetGoodsByDepartment retrieves goods by department
// @Summary Get goods by department
// @Description Get goods by department with pagination
// @Tags Goods
// @Produce json
// @Security BearerAuth
// @Param lang query string false "Language (uz, ru, en)" default(uz)
// @Param department_id path string true "Department ID"
// @Param limit query int false "Limit" default(20)
// @Param offset query int false "Offset" default(0)
// @Success 200 {object} []model.GoodResponse
// @Failure 400 {object} model.ErrorResponse
// @Failure 401 {object} model.ErrorResponse
// @Failure 500 {object} model.ErrorResponse
// @Router /api/v1/departments/{department_id}/goods [get]
func (h *Handler) GetGoodsByDepartment(c echo.Context) error {
	return c.JSON(http.StatusGone, model.NewErrorResponse("Endpoint deprecated", "Use GET /api/v1/goods with category_id filter instead", http.StatusGone))
}

// UpdateGood updates a good
// @Summary Update good
// @Description Update good details
// @Tags Goods
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param lang query string false "Language (uz, ru, en)" default(uz)
// @Param id path string true "Good ID"
// @Param request body model.UpdateGoodRequest true "Update good request"
// @Success 200 {object} model.GoodResponse
// @Failure 400 {object} model.ErrorResponse
// @Failure 401 {object} model.ErrorResponse
// @Failure 404 {object} model.ErrorResponse
// @Failure 500 {object} model.ErrorResponse
// @Router /api/v1/goods/{id} [put]
func (h *Handler) UpdateGood(c echo.Context) error {
	id := c.Param("id")
	if id == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("id is required", "see logs for details", http.StatusInternalServerError))
	}

	var req model.UpdateGoodRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("invalid request", "see logs for details", http.StatusInternalServerError))
	}

	resp, err := h.service.Goods().UpdateGood(c.Request().Context(), id, req.Name, req.Description, req.NameI18n, req.DescriptionI18n, req.CategoryID, req.Price, req.CookTime, req.PictureUrl, req.ColorCode)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("Operation failed", err.Error(), http.StatusInternalServerError))
	}

	return c.JSON(http.StatusOK, resp)
}

// UpdateGoodPrice updates the price of a good
// @Summary Update good price
// @Description Update good price
// @Tags Goods
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param lang query string false "Language (uz, ru, en)" default(uz)
// @Param id path string true "Good ID"
// @Param request body model.UpdateGoodPriceRequest true "Update good price request"
// @Success 200 {object} model.GoodResponse
// @Failure 400 {object} model.ErrorResponse
// @Failure 401 {object} model.ErrorResponse
// @Failure 404 {object} model.ErrorResponse
// @Failure 500 {object} model.ErrorResponse
// @Router /api/v1/goods/{id}/price [put]
func (h *Handler) UpdateGoodPrice(c echo.Context) error {
	id := c.Param("id")
	if id == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("id is required", "see logs for details", http.StatusInternalServerError))
	}

	var req model.UpdateGoodPriceRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("invalid request", "see logs for details", http.StatusInternalServerError))
	}

	resp, err := h.service.Goods().UpdateGoodPrice(c.Request().Context(), id, req.Price)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("Operation failed", err.Error(), http.StatusInternalServerError))
	}

	return c.JSON(http.StatusOK, resp)
}

// DeleteGood deletes a good
// @Summary Delete good
// @Description Delete a good (soft delete)
// @Tags Goods
// @Security BearerAuth
// @Param lang query string false "Language (uz, ru, en)" default(uz)
// @Param id path string true "Good ID"
// @Success 204
// @Failure 400 {object} model.ErrorResponse
// @Failure 401 {object} model.ErrorResponse
// @Failure 404 {object} model.ErrorResponse
// @Failure 500 {object} model.ErrorResponse
// @Router /api/v1/goods/{id} [delete]
func (h *Handler) DeleteGood(c echo.Context) error {
	id := c.Param("id")
	if id == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("id is required", "see logs for details", http.StatusInternalServerError))
	}

	if err := h.service.Goods().DeleteGood(c.Request().Context(), id); err != nil {
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("Operation failed", err.Error(), http.StatusInternalServerError))
	}

	return c.NoContent(http.StatusNoContent)
}

// RestoreGood restores a deleted good
// @Summary Restore good
// @Description Restore a deleted good
// @Tags Goods
// @Produce json
// @Security BearerAuth
// @Param lang query string false "Language (uz, ru, en)" default(uz)
// @Param id path string true "Good ID"
// @Success 200 {object} model.GoodResponse
// @Failure 400 {object} model.ErrorResponse
// @Failure 401 {object} model.ErrorResponse
// @Failure 404 {object} model.ErrorResponse
// @Failure 500 {object} model.ErrorResponse
// @Router /api/v1/goods/{id}/restore [post]
func (h *Handler) RestoreGood(c echo.Context) error {
	id := c.Param("id")
	if id == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("id is required", "see logs for details", http.StatusInternalServerError))
	}

	resp, err := h.service.Goods().RestoreGood(c.Request().Context(), id)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("Operation failed", err.Error(), http.StatusInternalServerError))
	}

	return c.JSON(http.StatusOK, resp)
}


func validateModifierItems(items []model.AttachModifierItem) error {
	for i, item := range items {
		if item.ModifierID == "" {
			return fmt.Errorf("modifiers[%d]: modifier_id is required", i)
		}
	}
	return nil
}

// CreateGoodWithCalculations creates a new good with calculations in one transaction
// @Summary Create good with multiple ingredients and compounds (One Save)
// @Description Create a new good/menu item with its ingredient/compound calculations in one atomic transaction.
// @Description
// @Description **How it works:**
// @Description - Create the good first
// @Description - Then create all ingredient calculations (price from invoice_detail)
// @Description - Then create all compound calculations (price from compound.price)
// @Description - If any calculation fails, everything is rolled back (good won't be created)
// @Description
// @Description **Example Request:**
// @Description ```json
// @Description {
// @Description   "good": { "name": "Osh", "price": "85000.00" },
// @Description   "ingredient_calculations": [
// @Description     { "ingredient_id": "sabzi-uuid", "quantity": "2.5" },
// @Description     { "ingredient_id": "guruch-uuid", "quantity": "0.5" }
// @Description   ],
// @Description   "compound_calculations": [
// @Description     { "compound_id": "salad-uuid", "quantity": "3" },
// @Description     { "compound_id": "xamir-uuid", "quantity": "1" }
// @Description   ],
// @Description   "modifiers": [
// @Description     { "modifier_id": "modifier-uuid-1", "is_required": false, "sort_order": 1 },
// @Description     { "modifier_id": "modifier-uuid-2", "is_required": true, "sort_order": 2 }
// @Description   ]
// @Description }
// @Description ```
// @Tags Goods
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param lang query string false "Language (uz, ru, en)" default(uz)
// @Param request body model.CreateGoodWithCalculationsRequest true "Good + ingredient calculations + compound calculations + modifiers"
// @Success 201 {object} model.GoodWithCalculationsResponse "Good, calculations, and modifiers created successfully"
// @Failure 400 {object} model.ErrorResponse "Invalid request (missing fields, invalid UUIDs, etc.)"
// @Failure 401 {object} model.ErrorResponse "Unauthorized"
// @Failure 500 {object} model.ErrorResponse "Internal error (ingredient not found, no invoice for ingredient, etc.)"
// @Router /api/v1/goods/with-calculations [post]
func (h *Handler) CreateGoodWithCalculations(c echo.Context) error {
	var req model.CreateGoodWithCalculationsRequest
	if err := c.Bind(&req); err != nil {
		log.Printf("Failed to bind create good with calculations request: %v", err)
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"Invalid request format",
			err.Error(),
			http.StatusBadRequest,
		))
	}

	// Validate good request
	if req.Good.Name == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"Good name is required",
			"missing required field: good.name",
			http.StatusBadRequest,
		))
	}

	if req.Good.Price == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"Good price is required",
			"missing required field: good.price",
			http.StatusBadRequest,
		))
	}

	// Validate ingredient calculations
	for i, calc := range req.IngredientCalculations {
		if calc.IngredientID == "" {
			return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
				"Invalid ingredient calculation",
				"ingredient_calculations["+strconv.Itoa(i)+"]: ingredient_id is required",
				http.StatusBadRequest,
			))
		}
		if calc.Quantity == "" {
			return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
				"Invalid ingredient calculation",
				"ingredient_calculations["+strconv.Itoa(i)+"]: quantity is required",
				http.StatusBadRequest,
			))
		}
	}

	// Validate compound calculations
	for i, calc := range req.CompoundCalculations {
		if calc.CompoundID == "" {
			return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
				"Invalid compound calculation",
				"compound_calculations["+strconv.Itoa(i)+"]: compound_id is required",
				http.StatusBadRequest,
			))
		}
		if calc.Quantity == "" {
			return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
				"Invalid compound calculation",
				"compound_calculations["+strconv.Itoa(i)+"]: quantity is required",
				http.StatusBadRequest,
			))
		}
	}

	if err := validateModifierItems(req.Modifiers); err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"Invalid modifiers payload",
			err.Error(),
			http.StatusBadRequest,
		))
	}

	ctx := c.Request().Context()

	// Step 1: Create the good
	goodResp, err := h.service.Goods().CreateGood(
		ctx,
		req.Good.Name,
		req.Good.Description,
		req.Good.NameI18n,
		req.Good.DescriptionI18n,
		req.Good.CategoryID,
		req.Good.Price,
		req.Good.CookTime,
		req.Good.PictureUrl,
		req.Good.ColorCode,
	)
	if err != nil {
		log.Printf("CreateGoodWithCalculations: failed to create good: %v", err)
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse(
			"Failed to create good",
			err.Error(),
			http.StatusInternalServerError,
		))
	}

	var calculations []model.CalculationResponse

	// Step 2: Create ingredient calculations
	for i, calc := range req.IngredientCalculations {
		calcResp, calcErr := h.service.Calculation().CreateCalculation(ctx, goodResp.ID, calc.IngredientID, calc.Quantity)
		if calcErr != nil {
			log.Printf("CreateGoodWithCalculations: failed to create ingredient calculation[%d]: %v", i, calcErr)
			return c.JSON(http.StatusInternalServerError, model.NewErrorResponse(
				"Failed to create ingredient calculation",
				"ingredient_calculations["+strconv.Itoa(i)+"]: "+calcErr.Error(),
				http.StatusInternalServerError,
			))
		}
		if calcResp != nil {
			calculations = append(calculations, *calcResp)
		}
	}

	// Step 3: Create compound calculations
	for i, calc := range req.CompoundCalculations {
		calcResp, calcErr := h.service.Calculation().CreateCalculationWithCompound(ctx, goodResp.ID, calc.CompoundID, calc.Quantity)
		if calcErr != nil {
			log.Printf("CreateGoodWithCalculations: failed to create compound calculation[%d]: %v", i, calcErr)
			return c.JSON(http.StatusInternalServerError, model.NewErrorResponse(
				"Failed to create compound calculation",
				"compound_calculations["+strconv.Itoa(i)+"]: "+calcErr.Error(),
				http.StatusInternalServerError,
			))
		}
		if calcResp != nil {
			calculations = append(calculations, *calcResp)
		}
	}

	// Fetch updated good (cost fields should be updated now)
	updatedGood, gErr := h.service.Goods().GetGoodByID(ctx, goodResp.ID)
	if gErr != nil {
		log.Printf("CreateGoodWithCalculations: failed to fetch updated good: %v", gErr)
		updatedGood = goodResp
	}

	// Step 4: Replace modifiers for this good in the same transaction
	if err := h.service.GoodsModifier().ReplaceModifiersForGood(ctx, goodResp.ID, model.AttachModifiersToGoodRequest{
		Modifiers: req.Modifiers,
	}); err != nil {
		log.Printf("CreateGoodWithCalculations: failed to replace modifiers: %v", err)
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse(
			"Failed to attach modifiers",
			err.Error(),
			http.StatusInternalServerError,
		))
	}

	modifiers, mErr := h.service.GoodsModifier().GetModifiersByGoodID(ctx, goodResp.ID)
	if mErr != nil {
		log.Printf("CreateGoodWithCalculations: failed to fetch modifiers: %v", mErr)
		modifiers = nil
	}

	response := model.GoodWithCalculationsResponse{
		Good:         updatedGood,
		Calculations: calculations,
		Modifiers:    modifiers,
	}

	return c.JSON(http.StatusCreated, model.NewSuccessResponse(
		"Good created successfully",
		response,
		http.StatusCreated,
	))
}

// UpdateGoodWithCalculations updates a good and replaces all calculations in one transaction
// @Summary Update good with calculations and modifiers (One Save)
// @Description Update a good/menu item and replace all its ingredient calculations, compound calculations, and modifiers in one atomic transaction.
// @Description
// @Description **How it works:**
// @Description - Update the good first
// @Description - Delete all existing calculations for this good
// @Description - Create the new ingredient calculations (price from invoice_detail)
// @Description - Create the new compound calculations (price from compound.price)
// @Description - Replace all good modifiers
// @Description - If any step fails, everything is rolled back
// @Param request body model.UpdateGoodWithCalculationsRequest true "Good update + ingredient calculations + compound calculations + modifiers"
// @Success 200 {object} model.GoodWithCalculationsResponse "Good, calculations, and modifiers updated successfully"
// @Success 200 {object} model.GoodWithCalculationsResponse "Good and all calculations updated successfully"
// @Failure 400 {object} model.ErrorResponse "Invalid request (missing fields, invalid UUIDs, etc.)"
// @Failure 401 {object} model.ErrorResponse "Unauthorized"
// @Failure 500 {object} model.ErrorResponse "Internal error (ingredient not found, no invoice for ingredient, etc.)"
// @Router /api/v1/goods/{id}/with-calculations [put]
func (h *Handler) UpdateGoodWithCalculations(c echo.Context) error {
	goodID := c.Param("id")
	if goodID == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"Good id is required",
			"missing path parameter: id",
			http.StatusBadRequest,
		))
	}

	var req model.UpdateGoodWithCalculationsRequest
	if err := c.Bind(&req); err != nil {
		log.Printf("Failed to bind update good with calculations request: %v", err)
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"Invalid request format",
			err.Error(),
			http.StatusBadRequest,
		))
	}

	// Validate ingredient calculations
	for i, calc := range req.IngredientCalculations {
		if calc.IngredientID == "" {
			return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
				"Invalid ingredient calculation",
				"ingredient_calculations["+strconv.Itoa(i)+"]: ingredient_id is required",
				http.StatusBadRequest,
			))
		}
		if calc.Quantity == "" {
			return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
				"Invalid ingredient calculation",
				"ingredient_calculations["+strconv.Itoa(i)+"]: quantity is required",
				http.StatusBadRequest,
			))
		}
	}

	// Validate compound calculations
	for i, calc := range req.CompoundCalculations {
		if calc.CompoundID == "" {
			return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
				"Invalid compound calculation",
				"compound_calculations["+strconv.Itoa(i)+"]: compound_id is required",
				http.StatusBadRequest,
			))
		}
		if calc.Quantity == "" {
			return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
				"Invalid compound calculation",
				"compound_calculations["+strconv.Itoa(i)+"]: quantity is required",
				http.StatusBadRequest,
			))
		}
	}

	if err := validateModifierItems(req.Modifiers); err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"Invalid modifiers payload",
			err.Error(),
			http.StatusBadRequest,
		))
	}

	ctx := c.Request().Context()

	// Step 1: Update the good
	goodResp, err := h.service.Goods().UpdateGood(
		ctx,
		goodID,
		req.Good.Name,
		req.Good.Description,
		req.Good.NameI18n,
		req.Good.DescriptionI18n,
		req.Good.CategoryID,
		req.Good.Price,
		req.Good.CookTime,
		req.Good.PictureUrl,
		req.Good.ColorCode,
	)
	if err != nil {
		log.Printf("UpdateGoodWithCalculations: failed to update good: %v", err)
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse(
			"Failed to update good",
			err.Error(),
			http.StatusInternalServerError,
		))
	}

	// Step 2: Delete all existing calculations for this good
	if err := h.service.Calculation().DeleteCalculationsByGoodID(ctx, goodID); err != nil {
		log.Printf("UpdateGoodWithCalculations: failed to delete old calculations: %v", err)
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse(
			"Failed to delete old calculations",
			err.Error(),
			http.StatusInternalServerError,
		))
	}

	var calculations []model.CalculationResponse

	// Step 3: Create ingredient calculations
	for i, calc := range req.IngredientCalculations {
		calcResp, calcErr := h.service.Calculation().CreateCalculation(ctx, goodID, calc.IngredientID, calc.Quantity)
		if calcErr != nil {
			log.Printf("UpdateGoodWithCalculations: failed to create ingredient calculation[%d]: %v", i, calcErr)
			return c.JSON(http.StatusInternalServerError, model.NewErrorResponse(
				"Failed to create ingredient calculation",
				"ingredient_calculations["+strconv.Itoa(i)+"]: "+calcErr.Error(),
				http.StatusInternalServerError,
			))
		}
		if calcResp != nil {
			calculations = append(calculations, *calcResp)
		}
	}

	// Step 4: Create compound calculations
	for i, calc := range req.CompoundCalculations {
		calcResp, calcErr := h.service.Calculation().CreateCalculationWithCompound(ctx, goodID, calc.CompoundID, calc.Quantity)
		if calcErr != nil {
			log.Printf("UpdateGoodWithCalculations: failed to create compound calculation[%d]: %v", i, calcErr)
			return c.JSON(http.StatusInternalServerError, model.NewErrorResponse(
				"Failed to create compound calculation",
				"compound_calculations["+strconv.Itoa(i)+"]: "+calcErr.Error(),
				http.StatusInternalServerError,
			))
		}
		if calcResp != nil {
			calculations = append(calculations, *calcResp)
		}
	}

	// Fetch updated good (cost fields should be updated now)
	updatedGood, gErr := h.service.Goods().GetGoodByID(ctx, goodID)
	if gErr != nil {
		log.Printf("UpdateGoodWithCalculations: failed to fetch updated good: %v", gErr)
		updatedGood = goodResp
	}

	// Step 5: Replace modifiers for this good in the same transaction
	if err := h.service.GoodsModifier().ReplaceModifiersForGood(ctx, goodID, model.AttachModifiersToGoodRequest{
		Modifiers: req.Modifiers,
	}); err != nil {
		log.Printf("UpdateGoodWithCalculations: failed to replace modifiers: %v", err)
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse(
			"Failed to replace modifiers",
			err.Error(),
			http.StatusInternalServerError,
		))
	}

	modifiers, mErr := h.service.GoodsModifier().GetModifiersByGoodID(ctx, goodID)
	if mErr != nil {
		log.Printf("UpdateGoodWithCalculations: failed to fetch modifiers: %v", mErr)
		modifiers = nil
	}

	response := model.GoodWithCalculationsResponse{
		Good:         updatedGood,
		Calculations: calculations,
		Modifiers:    modifiers,
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse(
		"Good updated successfully",
		response,
		http.StatusOK,
	))
}

// ==================== GOODS WITH LANGUAGE HANDLERS ====================

// GetGoodByIDWithLang retrieves a good/menu item by ID with language support
// @Summary Get good by ID with language support
// @Description Retrieve a specific good/menu item by its ID with names and descriptions translated to specified language
// @Tags Goods
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "Good ID"
// @Param lang query string false "Language code (uz, ru, en - default: uz)"
// @Success 200 {object} model.GoodResponse "Good details"
// @Failure 400 {object} model.ErrorResponse "Invalid request parameters"
// @Failure 401 {object} model.ErrorResponse "Unauthorized"
// @Failure 404 {object} model.ErrorResponse "Good not found"
// @Failure 500 {object} model.ErrorResponse "Internal server error"
// @Router /api/v1/goods-lang/{id} [get]
func (h *Handler) GetGoodByIDWithLang(c echo.Context) error {
	goodID := c.Param("id")
	if goodID == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("good id is required", "see logs for details", http.StatusBadRequest))
	}

	lang := c.QueryParam("lang")
	if lang == "" {
		lang = "uz"
	}

	validLangs := map[string]bool{"uz": true, "ru": true, "en": true}
	if !validLangs[lang] {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("invalid language code", "valid values: uz, ru, en", http.StatusBadRequest))
	}

	good, err := h.service.Goods().GetGoodByIDWithLang(c.Request().Context(), goodID, lang)
	if err != nil {
		log.Printf("GetGoodByIDWithLang failed: %v", err)
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("failed to get good", "see logs for details", http.StatusInternalServerError))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse("Good retrieved successfully", good, http.StatusOK))
}

// GetAllGoodsWithLang retrieves all goods/menu items with language support and optional filters
// @Summary Get all goods with language support
// @Description Retrieve all goods/menu items with names and descriptions translated to specified language, including search, filters and sorting
// @Tags Goods
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param lang query string false "Language code (uz, ru, en - default: uz)"
// @Param limit query int false "Limit (default: 20)"
// @Param offset query int false "Offset (default: 0)"
// @Param expand query string false "Expand related fields"
// @Param category_id query string false "Filter by category ID"
// @Param department_id query string false "Filter by department ID"
// @Param storage_id query string false "Filter by storage ID"
// @Param search query string false "Search by name or description"
// @Param min_price query string false "Minimum price"
// @Param max_price query string false "Maximum price"
// @Param sort_by query string false "Sort by field" Enums(name,price,created_at) default(created_at)
// @Param sort_order query string false "Sort order" Enums(asc,desc) default(desc)
// @Success 200 {object} model.PaginatedGoodsResponse
// @Failure 400 {object} model.ErrorResponse
// @Failure 401 {object} model.ErrorResponse
// @Failure 500 {object} model.ErrorResponse
// @Router /api/v1/goods-lang [get]
func (h *Handler) GetAllGoodsWithLang(c echo.Context) error {
	return h.getGoodsList(c, "uz")
}
