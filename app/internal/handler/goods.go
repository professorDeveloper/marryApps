package handler

import (
	"log"
	"net/http"
	"strconv"

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

	resp, err := h.service.Goods().CreateGood(c.Request().Context(), req.Name, req.Description, req.NameI18n, req.DescriptionI18n, req.CategoryID, req.DepartmentID, req.Price, req.CookTime, req.PictureUrl, req.ColorCode)
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
// @Description Get all goods with pagination and optional filters
// @Tags Goods
// @Produce json
// @Security BearerAuth
// @Param lang query string false "Language (uz, ru, en)" default(uz)
// @Param limit query int false "Limit" default(20)
// @Param offset query int false "Offset" default(0)
// @Param expand query string false "Expand related fields"
// @Param category_id query string false "Filter by category ID"
// @Param department_id query string false "Filter by department ID"
// @Param storage_id query string false "Filter by storage ID"
// @Param search query string false "Search by name"
// @Success 200 {object} []model.GoodResponse
// @Failure 400 {object} model.ErrorResponse
// @Failure 401 {object} model.ErrorResponse
// @Failure 500 {object} model.ErrorResponse
// @Router /api/v1/goods [get]
func (h *Handler) GetAllGoods(c echo.Context) error {
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

	categoryID := c.QueryParam("category_id")
	departmentID := c.QueryParam("department_id")
	storageID := c.QueryParam("storage_id")
	search := c.QueryParam("search")
	lang := c.QueryParam("lang")

	var goods []*model.GoodResponse
	var total int64
	var err error

	if categoryID != "" || departmentID != "" || storageID != "" || search != "" {
		goods, total, err = h.service.Goods().GetAllGoodsFiltered(c.Request().Context(), categoryID, departmentID, storageID, search, lang, limit, offset)
	} else {
		goods, total, err = h.service.Goods().GetAllGoods(c.Request().Context(), limit, offset)
	}
	if err != nil {
		log.Printf("GetAllGoods failed: %v", err)
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse(
			"Failed to retrieve goods",
			err.Error(),
			http.StatusInternalServerError,
		))
	}

	if maps, expanded, err := h.expandListResponse(c, goods, "goods"); expanded {
		if err != nil {
			return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("expand failed", err.Error(), http.StatusInternalServerError))
		}
		return c.JSON(http.StatusOK, model.NewPaginatedResponse("Goods retrieved successfully", maps, int32(total), limit, offset, http.StatusOK))
	}

	return c.JSON(http.StatusOK, model.NewPaginatedResponse("Goods retrieved successfully", goods, int32(total), limit, offset, http.StatusOK))
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
	departmentID := c.Param("department_id")
	if departmentID == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("department_id is required", "see logs for details", http.StatusInternalServerError))
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

	resp, err := h.service.Goods().GetGoodsByDepartment(c.Request().Context(), departmentID, limit, offset)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("Operation failed", err.Error(), http.StatusInternalServerError))
	}

	return c.JSON(http.StatusOK, resp)
}

// GetGoodsByPriceRange retrieves goods within a price range
// @Summary Get goods by price range
// @Description Get goods within a price range with pagination
// @Tags Goods
// @Produce json
// @Security BearerAuth
// @Param lang query string false "Language (uz, ru, en)" default(uz)
// @Param min_price query string true "Minimum price"
// @Param max_price query string true "Maximum price"
// @Param limit query int false "Limit" default(20)
// @Param offset query int false "Offset" default(0)
// @Success 200 {object} []model.GoodResponse
// @Failure 400 {object} model.ErrorResponse
// @Failure 401 {object} model.ErrorResponse
// @Failure 500 {object} model.ErrorResponse
// @Router /api/v1/goods/search/by-price [get]
func (h *Handler) GetGoodsByPriceRange(c echo.Context) error {
	minPrice := c.QueryParam("min_price")
	maxPrice := c.QueryParam("max_price")

	if minPrice == "" || maxPrice == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("min_price and max_price are required", "see logs for details", http.StatusInternalServerError))
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

	resp, err := h.service.Goods().GetGoodsByPriceRange(c.Request().Context(), minPrice, maxPrice, limit, offset)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("Operation failed", err.Error(), http.StatusInternalServerError))
	}

	return c.JSON(http.StatusOK, resp)
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

	resp, err := h.service.Goods().UpdateGood(c.Request().Context(), id, req.Name, req.Description, req.NameI18n, req.DescriptionI18n, req.CategoryID, req.DepartmentID, req.Price, req.CookTime, req.PictureUrl, req.ColorCode)
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

// SearchGoods searches for goods
// @Summary Search goods
// @Description Search goods by name or description
// @Tags Goods
// @Produce json
// @Security BearerAuth
// @Param lang query string false "Language (uz, ru, en)" default(uz)
// @Param query query string true "Search query"
// @Param limit query int false "Limit" default(20)
// @Param offset query int false "Offset" default(0)
// @Success 200 {object} []model.GoodResponse
// @Failure 400 {object} model.ErrorResponse
// @Failure 401 {object} model.ErrorResponse
// @Failure 500 {object} model.ErrorResponse
// @Router /api/v1/goods/search [get]
func (h *Handler) SearchGoods(c echo.Context) error {
	query := c.QueryParam("query")
	if query == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("query is required", "see logs for details", http.StatusInternalServerError))
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

	resp, err := h.service.Goods().SearchGoods(c.Request().Context(), query, limit, offset)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("Operation failed", err.Error(), http.StatusInternalServerError))
	}

	return c.JSON(http.StatusOK, resp)
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
// @Description   ]
// @Description }
// @Description ```
// @Tags Goods
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param lang query string false "Language (uz, ru, en)" default(uz)
// @Param request body model.CreateGoodWithCalculationsRequest true "Good + ingredients + compounds"
// @Success 201 {object} model.GoodWithCalculationsResponse "Good and all calculations created successfully"
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

	ctx := c.Request().Context()

	// Step 1: Create the good
	goodResp, err := h.service.Goods().CreateGood(
		ctx,
		req.Good.Name,
		req.Good.Description,
		req.Good.NameI18n,
		req.Good.DescriptionI18n,
		req.Good.CategoryID,
		req.Good.DepartmentID,
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

	response := model.GoodWithCalculationsResponse{
		Good:         updatedGood,
		Calculations: calculations,
	}

	return c.JSON(http.StatusCreated, model.NewSuccessResponse(
		"Good created successfully",
		response,
		http.StatusCreated,
	))
}

// UpdateGoodWithCalculations updates a good and replaces all calculations in one transaction
// @Summary Update good with multiple ingredients and compounds (One Save)
// @Description Update a good/menu item and replace all its ingredient/compound calculations in one atomic transaction.
// @Description
// @Description **How it works:**
// @Description - Update the good first
// @Description - Delete all existing calculations for this good
// @Description - Create the new ingredient calculations (price from invoice_detail)
// @Description - Create the new compound calculations (price from compound.price)
// @Description - If any step fails, everything is rolled back
// @Tags Goods
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param lang query string false "Language (uz, ru, en)" default(uz)
// @Param id path string true "Good ID"
// @Param request body model.UpdateGoodWithCalculationsRequest true "Good update + ingredients + compounds"
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
		req.Good.DepartmentID,
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

	response := model.GoodWithCalculationsResponse{
		Good:         updatedGood,
		Calculations: calculations,
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
// @Description Retrieve all goods/menu items with names and descriptions translated to specified language
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
// @Param search query string false "Search by name"
// @Success 200 {array} model.GoodResponse "Goods retrieved successfully"
// @Failure 400 {object} model.ErrorResponse "Invalid request parameters"
// @Failure 401 {object} model.ErrorResponse "Unauthorized"
// @Failure 500 {object} model.ErrorResponse "Internal server error"
// @Router /api/v1/goods-lang [get]
func (h *Handler) GetAllGoodsWithLang(c echo.Context) error {
	var limit int32 = 20
	var offset int32 = 0

	if limitStr := c.QueryParam("limit"); limitStr != "" {
		if l, err := strconv.ParseInt(limitStr, 10, 32); err == nil && l > 0 {
			limit = int32(l)
		}
	}

	if offsetStr := c.QueryParam("offset"); offsetStr != "" {
		if o, err := strconv.ParseInt(offsetStr, 10, 32); err == nil && o >= 0 {
			offset = int32(o)
		}
	}

	lang := c.QueryParam("lang")
	if lang == "" {
		lang = "uz"
	}

	validLangs := map[string]bool{"uz": true, "ru": true, "en": true}
	if !validLangs[lang] {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("invalid language code", "valid values: uz, ru, en", http.StatusBadRequest))
	}

	categoryID := c.QueryParam("category_id")
	departmentID := c.QueryParam("department_id")
	storageID := c.QueryParam("storage_id")
	search := c.QueryParam("search")

	var goods []*model.GoodResponse
	var total int64
	var err error

	if categoryID != "" || departmentID != "" || storageID != "" || search != "" {
		goods, total, err = h.service.Goods().GetAllGoodsFiltered(c.Request().Context(), categoryID, departmentID, storageID, search, lang, limit, offset)
	} else {
		goods, total, err = h.service.Goods().GetAllGoodsWithLang(c.Request().Context(), lang, limit, offset)
	}
	if err != nil {
		log.Printf("GetAllGoodsWithLang failed: %v", err)
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("failed to get goods", "see logs for details", http.StatusInternalServerError))
	}

	if maps, expanded, err := h.expandListResponse(c, goods, "goods"); expanded {
		if err != nil {
			return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("expand failed", err.Error(), http.StatusInternalServerError))
		}
		return c.JSON(http.StatusOK, model.NewPaginatedResponse("Goods retrieved successfully", maps, int32(total), limit, offset, http.StatusOK))
	}

	return c.JSON(http.StatusOK, model.NewPaginatedResponse("Goods retrieved successfully", goods, int32(total), limit, offset, http.StatusOK))
}
