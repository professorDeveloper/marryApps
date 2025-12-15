package handler

import (
	"net/http"

	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
	"gitlab.yurtal.tech/company/blitz/back/internal/model"
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
		return c.JSON(http.StatusUnauthorized, model.ErrorResponse{
			Message: "User not authenticated",
		})
	}
	lang := c.Get("language").(string)

	user, err := h.service.Auth().GetUserByID(c.Request().Context(), userID)
	if err != nil {
		if lang == "de" {
			return c.JSON(http.StatusNotFound, model.ErrorResponse{Message: "Benutzer nicht gefunden"})
		}
		return c.JSON(http.StatusNotFound, model.ErrorResponse{Message: "Foydalanuvchini topib bo'lmadi"})
	}
	return c.JSON(http.StatusOK, user)
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
		return c.JSON(http.StatusUnauthorized, model.ErrorResponse{
			Message: "User not authenticated",
		})
	}
	lang := c.Get("language").(string)

	var req model.UpdateUserRequest
	if err := c.Bind(&req); err != nil {
		if lang == "de" {
			return c.JSON(http.StatusBadRequest, model.ErrorResponse{Message: "Ungültiges Anfrageformat"})
		}
		return c.JSON(http.StatusBadRequest, model.ErrorResponse{Message: "Noto'g'ri formatda so'rov yuborilgan"})
	}

	user, err := h.service.Auth().UpdateUser(c.Request().Context(), req, userID)
	if err != nil {
		if lang == "de" {
			return c.JSON(http.StatusInternalServerError, model.ErrorResponse{Message: "Fehler beim Aktualisieren des Benutzers"})
		}
		return c.JSON(http.StatusInternalServerError, model.ErrorResponse{Message: "Foydalanuvchini ma'lumotlarini yangilab bo'lmadi"})
	}

	return c.JSON(http.StatusOK, user)
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
		return c.JSON(http.StatusUnauthorized, model.ErrorResponse{
			Message: "User not authenticated",
		})
	}

	userUUID, err := uuid.Parse(userID)
	if err != nil {
		return c.JSON(http.StatusBadRequest, model.ErrorResponse{
			Message: "Invalid user ID format",
		})
	}

	var req model.UpdatePasswordRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, model.ErrorResponse{
			Message: "Invalid request format",
		})
	}
	lang := c.Get("language").(string)

	err = h.service.Auth().UpdateUserPassword(c.Request().Context(), userUUID, req.CurrentPassword, req.NewPassword)
	if err != nil {
		if lang == "de" {
			return c.JSON(http.StatusBadRequest, model.ErrorResponse{Message: "Fehler beim Aktualisieren des Passworts"})
		}
		return c.JSON(http.StatusBadRequest, model.ErrorResponse{
			Message: "Parolni yangilab bo'lmadi",
		})
	}

	return c.JSON(http.StatusOK, model.SuccessResponse{
		Message: "Parol yangilandi",
	})
}
