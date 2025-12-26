package middleware

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"strings"

	"github.com/labstack/echo/v4"
	"gitlab.yurtal.tech/company/maryai/back/internal/repository"
	"gitlab.yurtal.tech/company/maryai/back/internal/service"
	"gitlab.yurtal.tech/company/maryai/back/pkg/utils"
)

// TenantMiddleware sets up the multi-tenant context for tenant-scoped requests.
// It:
// 1. Extracts user_id and brand_id from JWT (already done by CheckAuth)
// 2. Resolves tenant configuration from main DB (brand info)
// 3. Creates a request-scoped transaction on the tenant DB
// 4. Sets search_path to tenant schema based on brand_id
// 5. Injects tenant queries into context via repository.WithTenantQueries
//
// This ensures all existing services that call repo.Tenant(ctx) become tenant-safe
// and automatically return only data for the authenticated tenant.
//
// Usage: Apply after CheckAuth to routes that need tenant isolation
//
//	api.Use(TenantMiddleware(repos))
func TenantMiddleware(repo *repository.Repository) echo.MiddlewareFunc {
	resolver := service.NewTenantResolver(repo)

	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			// Global superadmin should NOT be tenant-scoped
			if isGlobal, ok := c.Get("is_global").(bool); ok && isGlobal {
				return next(c)
			}

			// Get brand_id and user_id from context (set by CheckAuth middleware)
			brandIDStr, _ := c.Get("brand_id").(string)
			userIDStr, _ := c.Get("user_id").(string)

			if brandIDStr == "" {
				log.Println("Error: brand_id not found in context (CheckAuth must run before TenantMiddleware)")
				return c.JSON(http.StatusUnauthorized, map[string]interface{}{
					"message": "Unauthorized: tenant context missing",
				})
			}

			// Parse brand_id to UUID
			brandID, err := utils.ParseUUID(brandIDStr)
			if err != nil {
				log.Printf("Invalid brand_id: %v", err)
				return c.JSON(http.StatusBadRequest, map[string]interface{}{
					"message": "Invalid tenant context",
				})
			}

			ctx := c.Request().Context()

			// Step 1: Resolve tenant from main DB (validates brand exists)
			tenantCfg, err := resolver.ResolveTenantByBrandID(ctx, brandID)
			if err != nil {
				log.Printf("Failed to resolve tenant %s: %v", brandID.String(), err)
				return c.JSON(http.StatusForbidden, map[string]interface{}{
					"message": "Tenant not found or access denied",
				})
			}

			// Step 2: Create request-scoped transaction on tenant pool
			tx, err := repo.PgRepo.TenantPool.Begin(ctx)
			if err != nil {
				log.Printf("Failed to begin transaction: %v", err)
				return c.JSON(http.StatusInternalServerError, map[string]interface{}{
					"message": "Internal server error",
				})
			}

			// Step 3: Set search_path for schema isolation
			// Schema name format: tenant_{brand_id}
			schemaName := fmt.Sprintf("tenant_%s", strings.ReplaceAll(brandID.String(), "-", "_"))
			if _, err := tx.Exec(ctx, fmt.Sprintf("SET LOCAL search_path TO \"%s\", public", schemaName)); err != nil {
				log.Printf("Tenant schema %s not found for brand %s: %v", schemaName, brandID.String(), err)
				tx.Rollback(ctx)
				return c.JSON(http.StatusForbidden, map[string]interface{}{
					"message": "Tenant schema not initialized",
				})
			}

			// Step 4: Create tenant queries with transaction
			tenantQueries := repo.Tenant(ctx).WithTx(tx)

			// Step 5: Inject into request context
			tenantCtx := repository.WithTenantQueries(ctx, tenantQueries)
			tenantCtx = context.WithValue(tenantCtx, "brand_id", brandID.String())
			tenantCtx = context.WithValue(tenantCtx, "user_id", userIDStr)
			tenantCtx = context.WithValue(tenantCtx, "tenant_config", tenantCfg)

			// Update request context
			c.SetRequest(c.Request().WithContext(tenantCtx))

			// Execute handler
			err = next(c)

			// Commit transaction on success, rollback on error
			if err == nil {
				if commitErr := tx.Commit(ctx); commitErr != nil {
					log.Printf("Failed to commit transaction: %v", commitErr)
					tx.Rollback(ctx)
					return c.JSON(http.StatusInternalServerError, map[string]interface{}{
						"message": "Internal server error",
					})
				}
			} else {
				// Rollback on error
				tx.Rollback(ctx)
			}

			return err
		}
	}
}

// GetBrandIDFromContext extracts brand_id from echo context
func GetBrandIDFromContext(c echo.Context) string {
	if brandID, ok := c.Get("brand_id").(string); ok {
		return brandID
	}
	return ""
}

// GetUserIDFromContext extracts user_id from echo context
func GetUserIDFromContext(c echo.Context) string {
	if userID, ok := c.Get("user_id").(string); ok {
		return userID
	}
	return ""
}

// GetTenantConfigFromContext extracts tenant config from request context
func GetTenantConfigFromContext(ctx context.Context) *service.TenantConfig {
	if cfg, ok := ctx.Value("tenant_config").(*service.TenantConfig); ok {
		return cfg
	}
	return nil
}
