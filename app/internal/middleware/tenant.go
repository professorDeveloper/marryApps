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
)

func TenantMiddleware(repo *repository.Repository) echo.MiddlewareFunc {
	resolver := service.NewTenantResolver(repo)

	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			brandIDStr, _ := c.Get("brand_id").(string)
			isGlobal, _ := c.Get("is_global").(bool)
			userID, _ := c.Get("user_id").(string)

			log.Printf("TenantMiddleware: Initial state - brandIDStr=%q, isGlobal=%v, userID=%q", brandIDStr, isGlobal, userID)

			if brandIDStr == "" && isGlobal {
				brandIDStr = c.Request().Header.Get("X-Brand-Id")
				log.Printf("TenantMiddleware: Global superadmin - trying X-Brand-Id header: %q", brandIDStr)
				if brandIDStr == "" {
					log.Println("TenantMiddleware: Global superadmin: brand_id not found in token or X-Brand-Id header")
					return c.JSON(http.StatusBadRequest, map[string]interface{}{
						"message": "Global superadmin must specify X-Brand-Id header",
					})
				}
				log.Printf("TenantMiddleware: Global superadmin using X-Brand-Id header: %s", brandIDStr)
				c.Set("brand_id", brandIDStr)
			}

			userIDStr, _ := c.Get("user_id").(string)

			if brandIDStr == "" {
				log.Printf("TenantMiddleware: Error: brand_id not found in context (CheckAuth must run before TenantMiddleware), isGlobal=%v", isGlobal)
				return c.JSON(http.StatusUnauthorized, map[string]interface{}{
					"message": "Unauthorized: tenant context missing",
				})
			}

			brandIDStr = strings.TrimSpace(brandIDStr)

			ctx := c.Request().Context()

			tenantCfg, err := resolver.ResolveTenantByBrandID(ctx, brandIDStr)
			if err != nil {
				log.Printf("Failed to resolve tenant %s: %v", brandIDStr, err)
				return c.JSON(http.StatusForbidden, map[string]interface{}{
					"message": "Tenant not found or access denied",
				})
			}

			tx, err := repo.PgRepo.TenantPool.Begin(ctx)
			if err != nil {
				log.Printf("Failed to begin transaction: %v", err)
				return c.JSON(http.StatusInternalServerError, map[string]interface{}{
					"message": "Internal server error",
				})
			}

			schemaName := fmt.Sprintf("tenant_%s", brandIDStr)
			if _, err := tx.Exec(ctx, fmt.Sprintf("SET LOCAL search_path TO \"%s\", public", schemaName)); err != nil {
				log.Printf("Tenant schema %s not found for brand %s: %v", schemaName, brandIDStr, err)
				tx.Rollback(ctx)
				return c.JSON(http.StatusForbidden, map[string]interface{}{
					"message": "Tenant schema not initialized",
				})
			}

			if _, err := tx.Exec(ctx, "SET LOCAL app.brand_id = $1", brandIDStr); err != nil {
				log.Printf("Failed to set app.brand_id for brand %s: %v", brandIDStr, err)
				tx.Rollback(ctx)
				return c.JSON(http.StatusInternalServerError, map[string]interface{}{
					"message": "Internal server error",
				})
			}

			tenantQueries := repo.Tenant(ctx).WithTx(tx)

			tenantCtx := repository.WithTenantQueries(ctx, tenantQueries)
			tenantCtx = repository.WithTenantTx(tenantCtx, tx)
			tenantCtx = context.WithValue(tenantCtx, "brand_id", brandIDStr)
			tenantCtx = context.WithValue(tenantCtx, "user_id", userIDStr)
			tenantCtx = context.WithValue(tenantCtx, "tenant_config", tenantCfg)

			c.SetRequest(c.Request().WithContext(tenantCtx))

			err = next(c)

			// If handler returned an error, rollback and propagate the error.
			if err != nil {
				tx.Rollback(ctx)
				return err
			}

			// If handler already wrote an error response (>=400), do NOT commit.
			// This avoids a second JSON write when a DB statement failed inside the tx.
			if c.Response().Status >= http.StatusBadRequest {
				tx.Rollback(ctx)
				return nil
			}

			if commitErr := tx.Commit(ctx); commitErr != nil {
				log.Printf("Failed to commit transaction: %v", commitErr)
				tx.Rollback(ctx)
				if c.Response().Committed {
					return nil
				}
				return c.JSON(http.StatusInternalServerError, map[string]interface{}{
					"message": "Internal server error",
				})
			}

			return nil
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

func GetTenantConfigFromContext(ctx context.Context) *service.TenantConfig {
	if cfg, ok := ctx.Value("tenant_config").(*service.TenantConfig); ok {
		return cfg
	}
	return nil
}
