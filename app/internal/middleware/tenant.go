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
			brandID, err := utils.ParseUUID(brandIDStr)
			if err != nil {
				log.Printf("Invalid brand_id: %v", err)
				return c.JSON(http.StatusBadRequest, map[string]interface{}{
					"message": "Invalid tenant context",
				})
			}

			ctx := c.Request().Context()

			tenantCfg, err := resolver.ResolveTenantByBrandID(ctx, brandID)
			if err != nil {
				log.Printf("Failed to resolve tenant %s: %v", brandID.String(), err)
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

			schemaName := fmt.Sprintf("tenant_%s", strings.ReplaceAll(brandID.String(), "-", "_"))
			if _, err := tx.Exec(ctx, fmt.Sprintf("SET LOCAL search_path TO \"%s\", public", schemaName)); err != nil {
				log.Printf("Tenant schema %s not found for brand %s: %v", schemaName, brandID.String(), err)
				tx.Rollback(ctx)
				return c.JSON(http.StatusForbidden, map[string]interface{}{
					"message": "Tenant schema not initialized",
				})
			}

			tenantQueries := repo.Tenant(ctx).WithTx(tx)

			tenantCtx := repository.WithTenantQueries(ctx, tenantQueries)
			tenantCtx = context.WithValue(tenantCtx, "brand_id", brandID.String())
			tenantCtx = context.WithValue(tenantCtx, "user_id", userIDStr)
			tenantCtx = context.WithValue(tenantCtx, "tenant_config", tenantCfg)

			c.SetRequest(c.Request().WithContext(tenantCtx))

			err = next(c)

			if err == nil {
				if commitErr := tx.Commit(ctx); commitErr != nil {
					log.Printf("Failed to commit transaction: %v", commitErr)
					tx.Rollback(ctx)
					return c.JSON(http.StatusInternalServerError, map[string]interface{}{
						"message": "Internal server error",
					})
				}
			} else {
				tx.Rollback(ctx)
			}

			return err
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
