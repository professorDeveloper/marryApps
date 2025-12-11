package handler

import (
	"net/http"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/labstack/echo/v4"
	"gitlab.yurtal.tech/company/blitz/back/internal/model"
	"gitlab.yurtal.tech/company/blitz/back/internal/repository/pg"
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
// @Router /user/me [get]
func (h *Handler) getUser(c echo.Context) error {
	userID := c.Get("user_id").(string)
	if userID == "" {
		return c.JSON(http.StatusUnauthorized, model.ErrorResponse{
			Message: "User not authenticated",
		})
	}

	user, err := h.service.Repository().PgRepo.Repo.GetUserByID(c.Request().Context(), userID)
	if err != nil {
		return c.JSON(http.StatusNotFound, model.ErrorResponse{
			Message: "User not found",
		})
	}

	return c.JSON(http.StatusOK, model.UserResponse{
		ID:          user.ID,
		FullName:    user.FullName,
		Email:       user.Email,
		PhoneNumber: user.PhoneNumber,
		Level:       user.Level,
		XP:          user.XP,
		Balance:     user.Balance,
		Group:       user.Group,
		Photo:       user.Photo,
		Status:      user.Status,
	})
}

// UpdateUser godoc
// @Summary Update user profile
// @Description Update the profile of the currently authenticated user
// @Tags users
// @Accept  json
// @Produce  json
// @Security ApiKeyAuth
// @Param request body model.UpdateUserRequest true "User update data"
// @Success 200 {object} model.UserResponse
// @Failure 400 {object} model.ErrorResponse
// @Failure 401 {object} model.ErrorResponse
// @Failure 500 {object} model.ErrorResponse
// @Router /user/update [put]
func (h *Handler) updateUser(c echo.Context) error {
	userID := c.Get("user_id").(string)
	if userID == "" {
		return c.JSON(http.StatusUnauthorized, model.ErrorResponse{
			Message: "User not authenticated",
		})
	}

	var req model.UpdateUserRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, model.ErrorResponse{
			Message: "Invalid request format",
		})
	}

	updateParams := pg.UpdateUserParams{
		ID:                      userID,
		FullName:                req.FullName,
		Email:                   req.Email,
		PhoneNumber:             req.PhoneNumber,
		Group:                   req.Group,
		Photo:                   req.Photo,
		XP:                      req.XP,
		Balance:                 req.Balance,
		Level:                   req.Level,
		Status:                  req.Status,
		Gender:                  req.Gender,
		FirebaseToken:           req.FirebaseToken,
		GoogleId:                req.GoogleId,
		IsVerified:              req.IsVerified,
		IsAgreedForUserContract: req.IsAgreedForUserContract,
		PasswordHash:            req.PasswordHash,
		Role:                    req.Role,
		DateOfBirth:             pgtype.Timestamp{Time: req.DateOfBirth},
	}

	user, err := h.service.Repository().PgRepo.Repo.UpdateUser(c.Request().Context(), updateParams)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, model.ErrorResponse{
			Message: "Failed to update user",
		})
	}

	return c.JSON(http.StatusOK, model.UserResponse{
		ID:          user.ID,
		FullName:    user.FullName,
		Email:       user.Email,
		PhoneNumber: user.PhoneNumber,
		Level:       user.Level,
		XP:          user.XP,
		Balance:     user.Balance,
		Group:       user.Group,
		Photo:       user.Photo,
		Status:      user.Status,
	})
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
// @Router /user/password [put]
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

	err = h.service.Auth().UpdateUserPassword(c.Request().Context(), userUUID, req.CurrentPassword, req.NewPassword)
	if err != nil {
		return c.JSON(http.StatusBadRequest, model.ErrorResponse{
			Message: "Failed to update password: " + err.Error(),
		})
	}

	return c.JSON(http.StatusOK, model.SuccessResponse{
		Message: "Password updated successfully",
	})
}
