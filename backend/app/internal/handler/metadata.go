package handler

import (
	"net/http"
	"strings"

	"github.com/labstack/echo/v4"
	"gitlab.yurtal.tech/company/maryai/back/internal/model"
)

var metadataWhitelist = map[string]string{
	"storages":           "storages",
	"departments":        "departments",
	"categories":         "categories",
	"ingredient_groups":  "ingredient_groups",
	"ingredients":        "ingredients",
	"compounds":          "compounds",
	"menus":              "goods",
	"modifiers":          "modifiers",
	"dedication_groups":  "deduction_act_groups",
	"transaction_groups": "group_transactions",
	"halls":              "halls",
	"users":              "users",
	"admin":              "role_admin",
	"manager":            "role_manager",
	"waiter":             "role_waiter",
	"cashier":            "role_cashier",
	"kitchen":            "role_kitchen",
	"user":               "role_user",
	"superadmin":         "role_superadmin",
}

// GetMetadata godoc
// @Summary Get bulk metadata for dropdown options
// @Description Retrieves {id, name} pairs for multiple entity types in a single request
// @Tags Metadata
// @Accept json
// @Produce json
// @Param include query string false "Comma-separated entity names (e.g., storages,departments,categories)"
// @Success 200 {object} map[string][]model.MetadataItem
// @Failure 400 {object} model.ErrorData "Invalid entity in whitelist"
// @Failure 500 {object} model.ErrorData "Database error"
// @Router /metadata [get]
// @Security ApiKeyAuth
func (h *Handler) GetMetadata(c echo.Context) error {
	includeParam := c.QueryParam("include")
	if includeParam == "" {
		return c.JSON(http.StatusOK, map[string]interface{}{})
	}

	entities := strings.Split(includeParam, ",")
	var validEntities []string

	for _, entity := range entities {
		entity = strings.TrimSpace(entity)
		if entity == "" {
			continue
		}

		if _, exists := metadataWhitelist[entity]; !exists {
			return c.JSON(http.StatusBadRequest, model.NewErrorResponse("Invalid entity", "Entity not found: "+entity, http.StatusBadRequest))
		}

		validEntities = append(validEntities, entity)
	}

	ctx := c.Request().Context()
	result, err := h.service.Metadata().GetMetadata(ctx, validEntities, metadataWhitelist)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("Database error", err.Error(), http.StatusInternalServerError))
	}

	return c.JSON(http.StatusOK, result)
}
