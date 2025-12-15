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
// @Accept  json
// @Produce  json
// @Security ApiKeyAuth
// @Success 200 {object} model.UserResponse
// @Failure 401 {object} model.ErrorResponse
// @Failure 404 {object} model.ErrorResponse
// @Router /api/v1/user/me [get]

func (h *Handler) getUser(c echo.Context) error {
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

// GetMe godoc
// @Summary Get current user profile
// @Description Get the profile of the currently authenticated user with all user details
// @Tags users
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param Accept-Language header string false "Language preference (e.g., 'de' for German, default: 'en')"
// @Success 200 {object} model.UserResponse "User profile retrieved successfully"
// @Success 200 {object} model.UserResponse "Benutzerprofil erfolgreich abgerufen" "de"
// @Success 200 {object} model.UserResponse "Foydalanuvchi profili muvaffaqiyatli yuklandi" "uz"
// @Failure 401 {object} model.ErrorResponse "Unauthorized"
// @Failure 401 {object} model.ErrorResponse "Nicht autorisiert" "de"
// @Failure 401 {object} model.ErrorResponse "Avtorizatsiyadan o'tilmagan" "uz"
// @Failure 404 {object} model.ErrorResponse "User not found"
// @Failure 404 {object} model.ErrorResponse "Benutzer nicht gefunden" "de"
// @Failure 404 {object} model.ErrorResponse "Foydalanuvchi topilmadi" "uz"
// @Router /api/v1/user/me [get]
// 
// Response Example:
// {
//   "id": "550e8400-e29b-41d4-a716-446655440000",
//   "fullName": "John Doe",
//   "email": "john.doe@example.com",
//   "phoneNumber": "+1234567890",
//   "role": ('admin', 'moderator', 'user'),
//   "gender": ("male","female","not_specified"),
//   "status": ("active", "blocked", "onhold"),
//   "photo": "https://example.com/avatars/john.jpg",
//   "level": "B1", "B2", "C1", "C2", "not_specified",
//   "xp": 100,
//   "balance": 1000,
//   "group": "premium", "basic",
//   "isVerified": true,
//   "isAgreedForUserContract": true,
//   "dateOfBirth": "1990-01-01T00:00:00Z"
// }
func (h *Handler) updateUser(c echo.Context) error {
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
			return c.JSON(http.StatusBadRequest, model.ErrorResponse{Message: "Ungültige Anfrageformat"})
		}
		return c.JSON(http.StatusBadRequest, model.ErrorResponse{Message: "Noto'ri formatda so'rov yuborilgan"})
	}

	user, err := h.service.Auth().UpdateUser(c.Request().Context(), req, userID)
	if err != nil {
		if lang == "de" {
			return c.JSON(http.StatusInternalServerError, model.ErrorResponse{Message: "Fehler beim Aktualisieren des Benutzers"})
		}
		return c.JSON(http.StatusInternalServerError, model.ErrorResponse{Message: "Foydalanuvchini ma'lumotlarini  yangilab bo'lmadi"})
	}

	return c.JSON(http.StatusOK, user)
}

// UpdatePassword godoc
// @Summary Update user password
// @Description Update the password of the currently authenticated user
// @Tags users
// @Accept  json
// @Produce  json
// @Security ApiKeyAuth
// @Param request body model.UpdatePasswordRequest true "Password update data"
// @Success 200 {object} model.SuccessResponse
// @Failure 400 {object} model.ErrorResponse
// @Failure 401 {object} model.ErrorResponse
// @Router /api/v1/user/password-update [put]
func (h *Handler) updatePassword(c echo.Context) error {
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
