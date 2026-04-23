package middleware

import (
	"context"
	"errors"
	"fmt"
	"log"
	"net/http"
	"strings"

	"github.com/jackc/pgx/v5"
	"github.com/labstack/echo/v4"
	"gitlab.yurtal.tech/company/maryai/back/internal/repository"
	"gitlab.yurtal.tech/company/maryai/back/internal/service"
)

func TenantMiddleware(repo *repository.Repository) echo.MiddlewareFunc {
	resolver := service.NewTenantResolver(repo)

	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			brandIDStr, _ := c.Get("brand_id").(string)
			branchIDStr, _ := c.Get("branch_id").(string)
			isGlobal, _ := c.Get("is_global").(bool)
			userID, _ := c.Get("user_id").(string)

			log.Printf("TenantMiddleware: Initial state - brandIDStr=%q, branchIDStr=%q, isGlobal=%v, role=%q, userID=%q",
				brandIDStr, branchIDStr, isGlobal, c.Get("role"), userID)

			if branchIDStr == "" && !isGlobal {
				role, _ := c.Get("role").(string)
				if role == "superadmin" {
					if h := c.Request().Header.Get("X-Branch-ID"); h != "" {
						branchIDStr = h
						c.Set("branch_id", branchIDStr)
						log.Printf("TenantMiddleware: Brand superadmin using X-Branch-ID header: %s", branchIDStr)
					}
				}
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
				if errors.Is(err, pgx.ErrNoRows) {
					return c.JSON(http.StatusForbidden, map[string]interface{}{
						"message": "Tenant not found",
					})
				}
				return c.JSON(http.StatusInternalServerError, map[string]interface{}{
					"message": "DB error resolving tenant",
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
				return c.JSON(http.StatusInternalServerError, map[string]interface{}{
					"message": "DB error setting search path",
				})
			}

			if _, err := tx.Exec(ctx, "SET LOCAL app.brand_id = $1", brandIDStr); err != nil {
				log.Printf("Failed to set app.brand_id for brand %s: %v", brandIDStr, err)
				tx.Rollback(ctx)
				return c.JSON(http.StatusInternalServerError, map[string]interface{}{
					"message": "Internal server error",
				})
			}
			// Brand superadmin (role=superadmin, not global) can pass X-Branch-ID header
			// to scope their request to a specific branch.
			if branchIDStr == "" && !isGlobal {
				role, _ := c.Get("role").(string)
				if role == "superadmin" {
					if h := c.Request().Header.Get("X-Branch-ID"); h != "" {
						branchIDStr = strings.TrimSpace(h)
						c.Set("branch_id", branchIDStr)
						log.Printf("TenantMiddleware: Brand superadmin using X-Branch-ID header: %s", branchIDStr)
					}
				}
			}

			if branchIDStr != "" {
				if _, err := tx.Exec(ctx, "SET LOCAL app.branch_id = $1", branchIDStr); err != nil {
					log.Printf("Failed to set app.branch_id: %v", err)
					tx.Rollback(ctx)
					return c.JSON(http.StatusInternalServerError, map[string]interface{}{
						"message": "Internal server error",
					})
				}
				log.Printf("TenantMiddleware: Set app.branch_id = %s", branchIDStr)
			} else {
				log.Printf("TenantMiddleware: branchIDStr is empty, app.branch_id not set")
			}

			tenantQueries := repo.Tenant(ctx).WithTx(tx)

			tenantCtx := repository.WithTenantQueries(ctx, tenantQueries)
			tenantCtx = repository.WithTenantTx(tenantCtx, tx)
			tenantCtx = context.WithValue(tenantCtx, "brand_id", brandIDStr)
			tenantCtx = context.WithValue(tenantCtx, "branch_id", branchIDStr)
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
