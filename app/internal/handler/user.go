package handler

import (
	"log"
	"net/http"

	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
	"gitlab.yurtal.tech/company/maryai/back/internal/model"
)

// GetUser godoc
// @Summary Get current user profile
// @Description Get the profile of the currently authenticated user
// @Tags users
// @Accept json
// @Produce json
// @Security BearerAuth
// @Success 200 {object} model.UserResponse "User profile retrieved successfully"
// @Failure 401 {object} model.ErrorResponse "Unauthorized"
// @Failure 404 {object} model.ErrorResponse "User not found"
// @Router /api/v1/user/me [get]
func (h *Handler) GetUser(c echo.Context) error {
	userID := c.Get("user_id").(string)
	if userID == "" {
		return c.JSON(http.StatusUnauthorized, model.NewErrorResponse(
			"User not authenticated",
			"missing user_id in context",
			http.StatusUnauthorized,
		))
	}
	lang := c.Get("language").(string)

	user, err := h.service.Auth().GetUserByID(c.Request().Context(), userID)
	if err != nil {
		message := model.GetLocalizedMessage(lang, "user_not_found")
		return c.JSON(http.StatusNotFound, model.NewErrorResponse(message, err.Error(), http.StatusNotFound))
	}
	log.Printf("GetUser: responseType=%T userID=%s is_active=%v", user, user.ID, user.IsActive)
	return c.JSON(http.StatusOK, model.NewSuccessResponse("User profile retrieved successfully", user, http.StatusOK))
}

// UpdateUser godoc
// @Summary Update current user profile
// @Description Update the profile information of the currently authenticated user
// @Tags users
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param request body model.UpdateUserRequest true "User update data"
// @Success 200 {object} model.UserResponse "User profile updated successfully"
// @Failure 400 {object} model.ErrorResponse "Invalid request format"
// @Failure 401 {object} model.ErrorResponse "Unauthorized"
// @Failure 500 {object} model.ErrorResponse "Failed to update user"
// @Router /api/v1/user/update [put]
func (h *Handler) UpdateUser(c echo.Context) error {
	userID := c.Get("user_id").(string)
	if userID == "" {
		return c.JSON(http.StatusUnauthorized, model.NewErrorResponse(
			"User not authenticated",
			"missing user_id in context",
			http.StatusUnauthorized,
		))
	}
	lang := c.Get("language").(string)

	var req model.UpdateUserRequest
	if err := c.Bind(&req); err != nil {
		message := model.GetLocalizedMessage(lang, "bad_request")
		log.Printf("Bind error: %v", err)
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(message, err.Error(), http.StatusBadRequest))
	}

	log.Printf("UpdateUserRequest: %+v", req)

	user, err := h.service.Auth().UpdateUser(c.Request().Context(), req, userID)
	if err != nil {
		log.Printf("UpdateUser error: %v", err)
		message := model.GetLocalizedMessage(lang, "user_info_cannot_be_reached")
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse(message, err.Error(), http.StatusInternalServerError))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse("User profile updated successfully", user, http.StatusOK))
}

// UpdatePassword updates user password
// @Summary Update user password
// @Description Update the password of the currently authenticated user
// @Tags users
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param request body model.UpdatePasswordRequest true "Password update data"
// @Success 200 {object} model.SuccessResponse "Password updated successfully"
// @Failure 400 {object} model.ErrorResponse "Invalid request format or user ID"
// @Failure 401 {object} model.ErrorResponse "Unauthorized"
// @Failure 500 {object} model.ErrorResponse "Failed to update password"
// @Router /api/v1/user/password-update [put]
func (h *Handler) UpdatePassword(c echo.Context) error {
	userID, ok := c.Get("user_id").(string)
	if !ok || userID == "" {
		return c.JSON(http.StatusUnauthorized, model.NewErrorResponse(
			"User not authenticated",
			"missing user_id in context",
			http.StatusUnauthorized,
		))
	}

	userUUID, err := uuid.Parse(userID)
	if err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"Invalid user ID format",
			err.Error(),
			http.StatusBadRequest,
		))
	}

	var req model.UpdatePasswordRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"Invalid request format",
			err.Error(),
			http.StatusBadRequest,
		))
	}

	err = h.service.Auth().UpdateUserPassword(c.Request().Context(), userUUID, req.CurrentPassword, req.NewPassword)
	if err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"Failed to update password",
			err.Error(),
			http.StatusBadRequest,
		))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse("Password updated successfully", map[string]interface{}{}, http.StatusOK))
}
