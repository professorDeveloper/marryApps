package middleware

import (
	"context"
	"errors"
	"log"
	"net/http"
	"strings"

	"github.com/labstack/echo/v4"
	"gitlab.yurtal.tech/company/maryai/back/internal/repository"
	"gitlab.yurtal.tech/company/maryai/back/internal/service"
)

func TenantMiddleware(repo *repository.Repository) echo.MiddlewareFunc {
	resolver := service.NewTenantResolver(repo)

	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			// Extract auth context data set by auth middleware
			brandIDStr, _ := c.Get("brand_id").(string)
			branchIDStr, _ := c.Get("branch_id").(string)
			isGlobal, _ := c.Get("is_global").(bool)
			userID, _ := c.Get("user_id").(string)
			role, _ := c.Get("role").(string)

			log.Printf("TenantMiddleware: Initial state - brandIDStr=%q, branchIDStr=%q, isGlobal=%v, role=%q, userID=%q",
				brandIDStr, branchIDStr, isGlobal, role, userID)

			// Brand superadmin (role=superadmin, not global) can pass X-Branch-ID header
			// to scope their request to a specific branch.
			if branchIDStr == "" && !isGlobal && role == "superadmin" {
				if h := c.Request().Header.Get("X-Branch-ID"); h != "" {
					branchIDStr = strings.TrimSpace(h)
					c.Set("branch_id", branchIDStr)
					log.Printf("TenantMiddleware: Brand superadmin using X-Branch-ID header: %s", branchIDStr)
				}
			}

			// Validate brand_id presence (auth middleware must run before this)
			if brandIDStr == "" {
				log.Printf("TenantMiddleware: Error: brand_id not found in context (CheckAuth must run before TenantMiddleware), isGlobal=%v", isGlobal)
				return c.JSON(http.StatusUnauthorized, map[string]interface{}{
					"message": "Unauthorized: tenant context missing",
				})
			}

			brandIDStr = strings.TrimSpace(brandIDStr)
			ctx := c.Request().Context()

			// Resolve tenant configuration from database
			tenantCfg, err := resolver.ResolveTenantByBrandID(ctx, brandIDStr)
			if err != nil {
				log.Printf("Failed to resolve tenant %s: %v", brandIDStr, err)

				// Map resolver sentinel errors to appropriate HTTP status codes
				if errors.Is(err, service.ErrInvalidInput) {
					return c.JSON(http.StatusBadRequest, map[string]interface{}{
						"message": "Invalid request",
					})
				}

				if errors.Is(err, service.ErrTenantNotFound) {
					return c.JSON(http.StatusNotFound, map[string]interface{}{
						"message": "Tenant not found",
					})
				}

				if errors.Is(err, service.ErrTenantInactive) {
					return c.JSON(http.StatusForbidden, map[string]interface{}{
						"message": "Tenant is inactive",
					})
				}

				if errors.Is(err, service.ErrTenantResolveCanceled) {
					return c.JSON(http.StatusRequestTimeout, map[string]interface{}{
						"message": "Request canceled",
					})
				}

				if errors.Is(err, service.ErrTenantResolveTimeout) {
					return c.JSON(http.StatusRequestTimeout, map[string]interface{}{
						"message": "Request timeout while resolving tenant",
					})
				}

				if errors.Is(err, service.ErrTenantResolveDB) {
					return c.JSON(http.StatusInternalServerError, map[string]interface{}{
						"message": "Internal server error",
					})
				}

				// Fallback for any unexpected errors
				return c.JSON(http.StatusInternalServerError, map[string]interface{}{
					"message": "Internal server error",
				})
			}

			// Set tenant metadata in request context for downstream handlers
			// Note: DB transaction and search_path are NOT set here.
			// They should be managed at service/repository layer where actual queries execute.
			tenantCtx := context.WithValue(ctx, "brand_id", brandIDStr)
			tenantCtx = context.WithValue(tenantCtx, "branch_id", branchIDStr)
			tenantCtx = context.WithValue(tenantCtx, "user_id", userID)
			tenantCtx = context.WithValue(tenantCtx, "tenant_config", tenantCfg)

			c.SetRequest(c.Request().WithContext(tenantCtx))

			// Call next handler
			return next(c)
		}
	}
}

func GetBrandIDFromContext(c echo.Context) string {
	if brandID, ok := c.Get("brand_id").(string); ok {
		return brandID
	}
	return ""
}

func GetUserIDFromContext(c echo.Context) string {
	if userID, ok := c.Get("user_id").(string); ok {
		return userID
	}
	return ""
}

func GetBranchIDFromContext(c echo.Context) string {
	if branchID, ok := c.Get("branch_id").(string); ok {
		return branchID
	}
	return ""
}

func GetTenantConfigFromContext(ctx context.Context) *service.TenantConfig {
	if cfg, ok := ctx.Value("tenant_config").(*service.TenantConfig); ok {
		return cfg
	}
	return nil
}
