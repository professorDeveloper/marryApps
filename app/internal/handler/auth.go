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

// Login handles user login
// @Summary User login
// @Description Authenticate user using username, password, and brand_id (slug) and return access token
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
			return c.JSON(http.StatusBadRequest, model.NewErrorResponse("invalid request body", "see logs for details", http.StatusBadRequest))
		}
	} else {
		if err := c.Bind(&req); err != nil {
			log.Printf("Failed to bind login request: %v", err)
			return c.JSON(http.StatusBadRequest, model.NewErrorResponse("invalid request body", "see logs for details", http.StatusBadRequest))
		}
	}
	// lang := c.Get("language").(string)

	resp, err := h.service.Auth().Login(c.Request().Context(), req, &h.cfg.Jwt)
	if err != nil {
		log.Printf("Login failed: %v", err)
		return c.JSON(http.StatusUnauthorized, model.NewErrorResponse(
			"Login failed",
			err.Error(),
			http.StatusUnauthorized,
		))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse(
		"Successfully logged in",
		resp,
		http.StatusOK,
	))
}

// LoginWithPincode handles POS staff login using brand_id + role password + pincode (for kitchen, terminals, cashiers).
// The supplied password must match one of the configured role passwords (superadmin / admin / manager) for the brand.
// @Summary POS staff login with pincode
// @Description Authenticate POS staff using brand_id, a role password (superadmin/admin/manager), and pincode
// @Tags auth
// @Accept json
// @Produce json
// @Param request body model.PincodeLoginRequest true "POS login credentials"
// @Success 200 {object} model.LoginResponse "Successfully logged in"
// @Failure 400 {object} model.ErrorResponse "Invalid request format"
// @Failure 401 {object} model.ErrorResponse "Unauthorized"
// @Router /api/v1/auth/login-pincode [post]
func (h *Handler) LoginWithPincode(c echo.Context) error {
	var req model.PincodeLoginRequest
	if err := c.Bind(&req); err != nil {
		log.Printf("Failed to bind pincode login request: %v", err)
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("invalid request body", "see logs for details", http.StatusBadRequest))
	}

	if req.BrandID == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("brand_id is required", "see logs for details", http.StatusBadRequest))
	}

	if req.Password == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("password is required", "see logs for details", http.StatusBadRequest))
	}

	if req.Pincode == nil || *req.Pincode == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("pincode is required", "see logs for details", http.StatusBadRequest))
	}

	resp, err := h.service.Auth().LoginWithPincode(c.Request().Context(), req, &h.cfg.Jwt)
	if err != nil {
		log.Printf("Pincode login failed: %v", err)
		return c.JSON(http.StatusUnauthorized, model.NewErrorResponse(
			"Pincode login failed",
			err.Error(),
			http.StatusUnauthorized,
		))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse(
		"Successfully logged in with pincode",
		resp,
		http.StatusOK,
	))
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
			return c.JSON(http.StatusBadRequest, model.NewErrorResponse("invalid request body", "see logs for details", http.StatusBadRequest))
		}
	} else {
		if err := c.Bind(&req); err != nil {
			log.Printf("Failed to bind login request: %v", err)
			return c.JSON(http.StatusBadRequest, model.NewErrorResponse("invalid request body", "see logs for details", http.StatusBadRequest))
		}
	}
	// lang := c.Get("language").(string)

	resp, err := h.service.Auth().LoginGlobal(c.Request().Context(), req, &h.cfg.Jwt)
	if err != nil {
		log.Printf("Global login failed: %v", err)
		return c.JSON(http.StatusUnauthorized, model.NewErrorResponse(
			"Global login failed",
			err.Error(),
			http.StatusUnauthorized,
		))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse(
		"Successfully logged in as superadmin",
		resp,
		http.StatusOK,
	))
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
	fmt.Println("came to register api ------------")

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
	if err := c.Bind(&req); err != nil {
		log.Printf("Failed to bind refresh request: %v", err)
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"Noto'g'ri so'rov formati",
			"see logs for details",
			http.StatusBadRequest,
		))
	}

	resp, err := h.service.Auth().Refresh(c.Request().Context(), req, &h.cfg.Jwt)
	if err != nil {
		log.Printf("Refresh failed: %v", err)
		return c.JSON(http.StatusUnauthorized, model.NewErrorResponse(
			"Refresh token noto'g'ri yoki eskirgan",
			"see logs for details",
			http.StatusUnauthorized,
		))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse(
		"Token muvaffaqiyatli yangilandi",
		resp,
		http.StatusOK,
	))
}

// GetUserByID retrieves a user by ID
// @Summary Get user by ID
// @Description Retrieve a single user by their UUID
// @Tags users
// @Produce json
// @Security BearerAuth
// @Param id path string true "User ID"
// @Success 200 {object} model.UserResponse
// @Failure 400 {object} model.ErrorResponse
// @Failure 404 {object} model.ErrorResponse
// @Failure 500 {object} model.ErrorResponse
// @Router /api/v1/users/{id} [get]
func (h *Handler) GetUserByID(c echo.Context) error {
	id := c.Param("id")
	if id == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("user id is required", "missing path parameter: id", http.StatusBadRequest))
	}

	user, err := h.service.Auth().GetUserByID(c.Request().Context(), id)
	if err != nil {
		log.Printf("GetUserByID failed for id %s: %v", id, err)
		return c.JSON(http.StatusNotFound, model.NewErrorResponse("user not found", err.Error(), http.StatusNotFound))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse("Data retrieved successfully", user, http.StatusOK))
}

// GetUsers retrieves users with unified filters
// @Summary Get users
// @Description Get users with query, role, staff and branch_id filters
// @Tags users
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param query query string false "Search by full_name, username, phone_number"
// @Param role query string false "Role filter"
// @Param staff query bool false "Only staff users (exclude admin and superadmin)"
// @Param branch_id query string false "Branch ID filter (superadmin only)"
// @Param limit query int false "Limit results (default: 20)" default(20)
// @Param offset query int false "Offset for pagination (default: 0)" default(0)
// @Success 200 {array} model.UserResponse
// @Failure 400 {object} model.ErrorResponse
// @Failure 403 {object} model.ErrorResponse
// @Failure 500 {object} model.ErrorResponse
// @Router /api/v1/users [get]
func (h *Handler) GetUsers(c echo.Context) error {
	req := model.GetUsersRequest{
		Limit:  20,
		Offset: 0,
	}

	roleFromToken, _ := c.Get("role").(string)

	if v := strings.TrimSpace(c.QueryParam("query")); v != "" {
		req.Query = &v
	}

	if v := strings.TrimSpace(c.QueryParam("role")); v != "" {
		v = strings.ToLower(v)
		switch v {
		case model.RoleSuperAdmin,
			model.RoleAdmin,
			model.RoleManager,
			model.RoleCashier,
			model.RoleWaiter,
			model.RoleKitchen,
			model.RoleUser:
			req.Role = &v
		default:
			return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
				"invalid role",
				"allowed values: superadmin, admin, manager, cashier, waiter, kitchen, user",
				http.StatusBadRequest,
			))
		}
	}

	if v := strings.TrimSpace(c.QueryParam("staff")); v != "" {
		staff, err := strconv.ParseBool(v)
		if err != nil {
			return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
				"invalid staff value",
				"staff must be true or false",
				http.StatusBadRequest,
			))
		}
		req.Staff = staff
	}

	if v := strings.TrimSpace(c.QueryParam("branch_id")); v != "" {
		if roleFromToken != model.RoleSuperAdmin {
			return c.JSON(http.StatusForbidden, model.NewErrorResponse(
				"branch_id filter is allowed only for superadmin",
				"forbidden",
				http.StatusForbidden,
			))
		}

		if _, err := uuid.Parse(v); err != nil {
			return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
				"invalid branch_id format",
				err.Error(),
				http.StatusBadRequest,
			))
		}

		req.BranchID = &v
	}

	if v := strings.TrimSpace(c.QueryParam("limit")); v != "" {
		limit, err := strconv.ParseInt(v, 10, 32)
		if err != nil || limit <= 0 {
			return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
				"invalid limit",
				"limit must be a positive integer",
				http.StatusBadRequest,
			))
		}
		req.Limit = int32(limit)
	}

	if v := strings.TrimSpace(c.QueryParam("offset")); v != "" {
		offset, err := strconv.ParseInt(v, 10, 32)
		if err != nil || offset < 0 {
			return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
				"invalid offset",
				"offset must be a non-negative integer",
				http.StatusBadRequest,
			))
		}
		req.Offset = int32(offset)
	}

	users, total, err := h.service.Auth().GetUsers(c.Request().Context(), req)
	if err != nil {
		log.Printf("GetUsers failed: %v", err)
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse(
			"failed to fetch users",
			err.Error(),
			http.StatusInternalServerError,
		))
	}

	return c.JSON(http.StatusOK, model.NewPaginatedResponse(
		"Data retrieved successfully",
		users,
		int32(total),
		req.Limit,
		req.Offset,
		http.StatusOK,
	))
}

// GetUsersByRole retrieves users by their role
// @Summary Get users by role
// @Description Retrieve all users with a specific role with pagination and optional expand
// @Tags users
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param role query string true "User role (admin, manager, cashier, waiter, kitchen, user, superadmin)"
// @Param limit query int false "Limit results (default: 20)" default(20)
// @Param offset query int false "Offset for pagination (default: 0)" default(0)
// @Param expand query string false "Expand related fields (e.g. shift,branch)"
// @Success 200 {array} model.UserResponse "Paginated list of users"
// @Failure 400 {object} model.ErrorResponse "Invalid role parameter"
// @Failure 401 {object} model.ErrorResponse "Unauthorized"
// @Failure 500 {object} model.ErrorResponse "Internal server error"
// @Router /api/v1/users/by-role [get]
func (h *Handler) GetUsersByRole(c echo.Context) error {
	role := c.QueryParam("role")
	if role == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("role parameter is required", "see logs for details", http.StatusBadRequest))
	}

	limit, offset := parseLimitOffset(c)

	users, total, err := h.service.Auth().GetUsersByRole(c.Request().Context(), role, limit, offset)
	if err != nil {
		log.Printf("GetUsersByRole failed: %v", err)
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("failed to fetch users", "see logs for details", http.StatusInternalServerError))
	}

	if maps, expanded, err := h.expandListResponse(c, users, "users"); expanded {
		if err != nil {
			return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("expand failed", err.Error(), http.StatusInternalServerError))
		}
		return c.JSON(http.StatusOK, model.NewPaginatedResponse("Data retrieved successfully", maps, int32(total), limit, offset, http.StatusOK))
	}

	return c.JSON(http.StatusOK, model.NewPaginatedResponse("Data retrieved successfully", users, int32(total), limit, offset, http.StatusOK))
}

// GetStaffes retrieves all staff (excluding admin and superadmin)
// @Summary Get staff users
// @Description Retrieve all staff members (excluding admin/superadmin) with pagination
// @Tags users
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param limit query int false "Limit results (default: 20)" default(20)
// @Param offset query int false "Offset for pagination (default: 0)" default(0)
// @Param expand query string false "Expand related fields (e.g. shift,branch)"
// @Success 200 {array} model.UserResponse "Paginated list of staff"
// @Failure 401 {object} model.ErrorResponse "Unauthorized"
// @Failure 500 {object} model.ErrorResponse "Internal server error"
// @Router /api/v1/users/staff [get]
func (h *Handler) GetKitchenStaff(c echo.Context) error {
	limit, offset := parseLimitOffset(c)

	staff, total, err := h.service.Auth().GetKitchenStaff(c.Request().Context(), limit, offset)
	if err != nil {
		log.Printf("GetKitchenStaff failed: %v", err)
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("failed to fetch kitchen staff", "see logs for details", http.StatusInternalServerError))
	}

	if maps, expanded, err := h.expandListResponse(c, staff, "users"); expanded {
		if err != nil {
			return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("expand failed", err.Error(), http.StatusInternalServerError))
		}
		return c.JSON(http.StatusOK, model.NewPaginatedResponse("Data retrieved successfully", maps, int32(total), limit, offset, http.StatusOK))
	}

	return c.JSON(http.StatusOK, model.NewPaginatedResponse("Data retrieved successfully", staff, int32(total), limit, offset, http.StatusOK))
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
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("query parameter is required", "see logs for details", http.StatusBadRequest))
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
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("failed to search users", "see logs for details", http.StatusInternalServerError))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse("Data retrieved successfully", users, http.StatusOK))
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
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("user id is required", "see logs for details", http.StatusBadRequest))
	}

	if err := h.service.Auth().DeleteUser(c.Request().Context(), userID); err != nil {
		log.Printf("DeleteUser failed for id %s: %v", userID, err)
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse(
			"Failed to delete user",
			err.Error(),
			http.StatusInternalServerError,
		))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse(
		"User deleted successfully",
		map[string]interface{}{},
		http.StatusOK,
	))
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
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("user id is required", "see logs for details", http.StatusBadRequest))
	}

	if err := h.service.Auth().RestoreUser(c.Request().Context(), userID); err != nil {
		log.Printf("RestoreUser failed for id %s: %v", userID, err)
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse(
			"Failed to restore user",
			err.Error(),
			http.StatusInternalServerError,
		))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse(
		"User restored successfully",
		map[string]interface{}{},
		http.StatusOK,
	))
}
