package handler

import (
	"fmt"
	"log"
	"net/http"

	"github.com/labstack/echo/v4"
	"gitlab.yurtal.tech/company/maryai/back/internal/model"
)

// Login handles user login
// @Summary User login
// @Description Authenticate user and return access token and password gonna be YYYYMMDD
// @Tags auth
// @Accept json
// @Produce json
// @Param request body model.LoginRequest true "Login credentials"
// @Success 200 {object} model.LoginResponse "Successfully logged in"
// @Failure 400 {object} model.ErrorResponse "Invalid request format"
// @Failure 401 {object} model.ErrorResponse "Unauthorized"
// @Router /api/v1/auth/login [post]
func (h *Handler) Login(c echo.Context) error {
	var req model.LoginRequest
	if v := c.Get("loginBody"); v != nil {
		if r, ok := v.(model.LoginRequest); ok {
			req = r
		} else {
			return c.JSON(http.StatusBadRequest, model.ErrorResponse{Message: "invalid request body"})
		}
	} else {
		if err := c.Bind(&req); err != nil {
			log.Printf("Failed to bind login request: %v", err)
			return c.JSON(http.StatusBadRequest, model.ErrorResponse{Message: "invalid request body"})
		}
	}
	lang := c.Get("language").(string)

	resp, err := h.service.Auth().Login(c.Request().Context(), req, &h.cfg.Jwt)
	if err != nil {
		log.Printf("Login failed: %v", err)

		if lang == "ru" {
			return c.JSON(http.StatusUnauthorized, model.ErrorResponse{Message: "Ungültige Anmeldeinformationen"})
		}
		return c.JSON(http.StatusUnauthorized, model.ErrorResponse{Message: "ru: Xatolik login qilishda"})
	}

	return c.JSON(http.StatusOK, resp)
}

// LoginGlobal handles global (main DB) superadmin login
// @Summary Global superadmin login
// @Description Authenticate global superadmin (main DB) and return access and refresh tokens
// @Tags auth
// @Accept json
// @Produce json
// @Param request body model.GlobalLoginRequest true "Login credentials"
// @Success 200 {object} model.LoginResponse "Successfully logged in"
// @Failure 400 {object} model.ErrorResponse "Invalid request format"
// @Failure 401 {object} model.ErrorResponse "Unauthorized"
// @Router /api/v1/auth/global/login [post]
func (h *Handler) LoginGlobal(c echo.Context) error {
	var req model.LoginRequest
	if v := c.Get("loginBody"); v != nil {
		if r, ok := v.(model.LoginRequest); ok {
			req = r
		} else {
			return c.JSON(http.StatusBadRequest, model.ErrorResponse{Message: "invalid request body"})
		}
	} else {
		if err := c.Bind(&req); err != nil {
			log.Printf("Failed to bind login request: %v", err)
			return c.JSON(http.StatusBadRequest, model.ErrorResponse{Message: "invalid request body"})
		}
	}
	lang := c.Get("language").(string)

	resp, err := h.service.Auth().LoginGlobal(c.Request().Context(), req, &h.cfg.Jwt)
	if err != nil {
		log.Printf("Global login failed: %v", err)
		if lang == "ru" {
			return c.JSON(http.StatusUnauthorized, model.ErrorResponse{Message: "Ungültige Anmeldeinformationen"})
		}
		return c.JSON(http.StatusUnauthorized, model.ErrorResponse{Message: "ru: Xatolik login qilishda"})
	}

	return c.JSON(http.StatusOK, resp)
}

// RegisterUser handles user registration
// @Summary Register a new user account
// @Description Register a new user. User role defaults to 'user' if not provided.
// @Tags auth
// @Accept json
// @Produce json
// @Param input body model.RegisterRequest true "User registration data"
// @Success 201 {object} model.RegisterResponse "User successfully registered"
// @Failure 400 {object} model.ErrorResponse "Bad request - invalid input, missing required fields, or user already exists with phone number"
// @Failure 500 {object} model.ErrorResponse "Internal server error"
// @Router /api/v1/auth/register [post]
func (h *Handler) RegisterUser(c echo.Context) error {
	var req model.RegisterRequest

	if v := c.Get("register_request"); v != nil {
		if r, ok := v.(*model.RegisterRequest); ok {
			req = *r
		} else {
			log.Printf("Failed to parse register request from context")
			return c.JSON(http.StatusBadRequest, model.ErrorResponse{
				Message: "invalid request data",
			})
		}
	} else {
		if err := c.Bind(&req); err != nil {
			log.Printf("Failed to bind register request: %v", err)
			return c.JSON(http.StatusBadRequest, model.ErrorResponse{
				Message: "invalid request format",
			})
		}

		if req.PhoneNumber == "" {
			return c.JSON(http.StatusBadRequest, model.ErrorResponse{
				Message: "phone number is required",
			})
		}

		if req.FullName == "" {
			return c.JSON(http.StatusBadRequest, model.ErrorResponse{
				Message: "full name is required",
			})
		}

	}

	log.Printf("Register request received - Phone: %s, Name: %s", req.PhoneNumber, req.FullName)

	err := h.service.Auth().Register(c.Request().Context(), req)
	if err != nil {
		log.Printf("Registration failed for phone %s: %v", req.PhoneNumber, err)
		return c.JSON(http.StatusBadRequest, model.ErrorResponse{
			Message: "registration failed: " + err.Error(),
		})
	}

	log.Printf("User successfully registered with phone: %s", req.PhoneNumber)
	return c.JSON(http.StatusCreated, model.RegisterResponse{
		Message: "User registered successfully",
	})
}

// Refresh handles token refresh
// @Summary Token refresh
// @Description Refresh access token using refresh token
// @Tags auth
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param input body model.RefreshRequest true "Refresh token"
// @Success 200 {object} model.RefreshResponse "Token refreshed successfully"
// @Failure 400 {object} model.ErrorResponse "Invalid request format"
// @Failure 401 {object} model.ErrorResponse "Invalid or expired refresh token"
// @Router /api/v1/auth/refresh [post]
func (h *Handler) Refresh(c echo.Context) error {
	var req model.RefreshRequest
	if v := c.Get("refreshBody"); v != nil {
		if r, ok := v.(model.RefreshRequest); ok {
			req = r
		} else {
			return c.JSON(http.StatusBadRequest, model.ErrorResponse{Message: "invalid request body"})
		}
	} else {
		if err := c.Bind(&req); err != nil {
			return c.JSON(http.StatusBadRequest, model.ErrorResponse{Message: "invalid request body"})
		}
	}
	lang := c.Get("language").(string)
	resp, err := h.service.Auth().Refresh(c.Request().Context(), req, &h.cfg.Jwt)
	if err != nil {
		fmt.Println(err)
		if lang == "ru" {
			return c.JSON(http.StatusUnauthorized, model.ErrorResponse{Message: "ru: Xatolik login qilishda"})
		}
		return c.JSON(http.StatusUnauthorized, model.ErrorResponse{Message: "Login qilishda xatolik"})
	}

	return c.JSON(http.StatusOK, resp)
}

// GetUsersByRole retrieves users by their role
// @Summary Get users by role
// @Description Retrieve all users with a specific role (requires authentication)
// @Tags users
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param role query string true "User role (admin, manager, cashier, waiter, kitchen, user, superadmin)"
// @Success 200 {array} model.UserResponse "List of users with the specified role"
// @Failure 400 {object} model.ErrorResponse "Invalid role parameter"
// @Failure 401 {object} model.ErrorResponse "Unauthorized"
// @Router /api/v1/users/by-role [get]
func (h *Handler) GetUsersByRole(c echo.Context) error {
	role := c.QueryParam("role")
	if role == "" {
		return c.JSON(http.StatusBadRequest, model.ErrorResponse{Message: "role parameter is required"})
	}

	users, err := h.service.Auth().GetUsersByRole(c.Request().Context(), role)
	if err != nil {
		log.Printf("GetUsersByRole failed: %v", err)
		return c.JSON(http.StatusInternalServerError, model.ErrorResponse{Message: "failed to fetch users"})
	}

	return c.JSON(http.StatusOK, users)
}

// GetAllStaff retrieves all staff members
// @Summary Get all staff members
// @Description Retrieve all staff members (non-user role employees)
// @Tags users
// @Accept json
// @Produce json
// @Security BearerAuth
// @Success 200 {array} model.UserResponse "List of all staff members"
// @Failure 401 {object} model.ErrorResponse "Unauthorized"
// @Failure 500 {object} model.ErrorResponse "Internal server error"
// @Router /api/v1/users/staff [get]
func (h *Handler) GetAllStaff(c echo.Context) error {
	staff, err := h.service.Auth().GetAllStaff(c.Request().Context())
	if err != nil {
		log.Printf("GetAllStaff failed: %v", err)
		return c.JSON(http.StatusInternalServerError, model.ErrorResponse{Message: "failed to fetch staff"})
	}

	return c.JSON(http.StatusOK, staff)
}

// GetKitchenStaff retrieves kitchen staff
// @Summary Get kitchen staff
// @Description Retrieve all kitchen staff members
// @Tags users
// @Accept json
// @Produce json
// @Security BearerAuth
// @Success 200 {array} model.UserResponse "List of kitchen staff"
// @Failure 401 {object} model.ErrorResponse "Unauthorized"
// @Failure 500 {object} model.ErrorResponse "Internal server error"
// @Router /api/v1/users/kitchen-staff [get]
func (h *Handler) GetKitchenStaff(c echo.Context) error {
	staff, err := h.service.Auth().GetKitchenStaff(c.Request().Context())
	if err != nil {
		log.Printf("GetKitchenStaff failed: %v", err)
		return c.JSON(http.StatusInternalServerError, model.ErrorResponse{Message: "failed to fetch kitchen staff"})
	}

	return c.JSON(http.StatusOK, staff)
}

// GetWaiters retrieves waiter staff
// @Summary Get waiters
// @Description Retrieve all waiter staff members
// @Tags users
// @Accept json
// @Produce json
// @Security BearerAuth
// @Success 200 {array} model.UserResponse "List of waiters"
// @Failure 401 {object} model.ErrorResponse "Unauthorized"
// @Failure 500 {object} model.ErrorResponse "Internal server error"
// @Router /api/v1/users/waiters [get]
func (h *Handler) GetWaiters(c echo.Context) error {
	waiters, err := h.service.Auth().GetWaiters(c.Request().Context())
	if err != nil {
		log.Printf("GetWaiters failed: %v", err)
		return c.JSON(http.StatusInternalServerError, model.ErrorResponse{Message: "failed to fetch waiters"})
	}

	return c.JSON(http.StatusOK, waiters)
}

// GetCashiers retrieves cashier staff
// @Summary Get cashiers
// @Description Retrieve all cashier staff members
// @Tags users
// @Accept json
// @Produce json
// @Security BearerAuth
// @Success 200 {array} model.UserResponse "List of cashiers"
// @Failure 401 {object} model.ErrorResponse "Unauthorized"
// @Failure 500 {object} model.ErrorResponse "Internal server error"
// @Router /api/v1/users/cashiers [get]
func (h *Handler) GetCashiers(c echo.Context) error {
	cashiers, err := h.service.Auth().GetCashiers(c.Request().Context())
	if err != nil {
		log.Printf("GetCashiers failed: %v", err)
		return c.JSON(http.StatusInternalServerError, model.ErrorResponse{Message: "failed to fetch cashiers"})
	}

	return c.JSON(http.StatusOK, cashiers)
}

// SearchUsers searches users by query
// @Summary Search users
// @Description Search users by name, phone, or username with pagination
// @Tags users
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param query query string true "Search query (name, phone, or username)"
// @Param limit query int false "Limit results (default: 20)" default(20)
// @Param offset query int false "Offset for pagination (default: 0)" default(0)
// @Success 200 {array} model.UserResponse "List of matching users"
// @Failure 400 {object} model.ErrorResponse "Invalid query parameter"
// @Failure 401 {object} model.ErrorResponse "Unauthorized"
// @Failure 500 {object} model.ErrorResponse "Internal server error"
// @Router /api/v1/users/search [get]
func (h *Handler) SearchUsers(c echo.Context) error {
	query := c.QueryParam("query")
	if query == "" {
		return c.JSON(http.StatusBadRequest, model.ErrorResponse{Message: "query parameter is required"})
	}

	limitStr := c.QueryParam("limit")
	offsetStr := c.QueryParam("offset")

	limit := int32(20)
	offset := int32(0)

	if limitStr != "" {
		var l int32
		if _, err := fmt.Sscanf(limitStr, "%d", &l); err == nil && l > 0 {
			limit = l
		}
	}

	if offsetStr != "" {
		var o int32
		if _, err := fmt.Sscanf(offsetStr, "%d", &o); err == nil && o >= 0 {
			offset = o
		}
	}

	users, err := h.service.Auth().SearchUsers(c.Request().Context(), query, limit, offset)
	if err != nil {
		log.Printf("SearchUsers failed: %v", err)
		return c.JSON(http.StatusInternalServerError, model.ErrorResponse{Message: "failed to search users"})
	}

	return c.JSON(http.StatusOK, users)
}

// DeleteUser soft deletes a user
// @Summary Delete user
// @Description Soft delete a user (mark as deleted without removing from database)
// @Tags users
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "User ID"
// @Success 200 {object} model.SuccessResponse "User deleted successfully"
// @Failure 400 {object} model.ErrorResponse "Invalid user ID"
// @Failure 401 {object} model.ErrorResponse "Unauthorized"
// @Failure 500 {object} model.ErrorResponse "Internal server error"
// @Router /api/v1/users/{id} [delete]
func (h *Handler) DeleteUser(c echo.Context) error {
	userID := c.Param("id")
	if userID == "" {
		return c.JSON(http.StatusBadRequest, model.ErrorResponse{Message: "user id is required"})
	}

	if err := h.service.Auth().DeleteUser(c.Request().Context(), userID); err != nil {
		log.Printf("DeleteUser failed for id %s: %v", userID, err)
		return c.JSON(http.StatusInternalServerError, model.ErrorResponse{Message: "failed to delete user"})
	}

	return c.JSON(http.StatusOK, model.SuccessResponse{Message: "User deleted successfully"})
}

// RestoreUser restores a soft-deleted user
// @Summary Restore user
// @Description Restore a previously deleted user
// @Tags users
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "User ID"
// @Success 200 {object} model.SuccessResponse "User restored successfully"
// @Failure 400 {object} model.ErrorResponse "Invalid user ID"
// @Failure 401 {object} model.ErrorResponse "Unauthorized"
// @Failure 500 {object} model.ErrorResponse "Internal server error"
// @Router /api/v1/users/{id}/restore [post]
func (h *Handler) RestoreUser(c echo.Context) error {
	userID := c.Param("id")
	if userID == "" {
		return c.JSON(http.StatusBadRequest, model.ErrorResponse{Message: "user id is required"})
	}

	if err := h.service.Auth().RestoreUser(c.Request().Context(), userID); err != nil {
		log.Printf("RestoreUser failed for id %s: %v", userID, err)
		return c.JSON(http.StatusInternalServerError, model.ErrorResponse{Message: "failed to restore user"})
	}

	return c.JSON(http.StatusOK, model.SuccessResponse{Message: "User restored successfully"})
}
