package service

import (
	"context"
	"fmt"
	"strings"

	"gitlab.yurtal.tech/company/maryai/back/internal/repository"
	pg "gitlab.yurtal.tech/company/maryai/back/internal/repository/pg/tenantsdb"
)

// withTenantRead is a shared package-level helper for read-only tenant-scoped operations.
// It creates a read-only transaction with tenant context (search_path, brand_id, branch_id)
// and executes the provided callback function with tenant queries.
// The transaction is always rolled back (read-only).
func withTenantRead(ctx context.Context, repo *repository.Repository, fn func(context.Context, *pg.Queries) error) error {
	tx, err := repo.PgRepo.TenantPool.Begin(ctx)
	if err != nil {
		return fmt.Errorf("failed to begin read transaction: %w", err)
	}
	defer tx.Rollback(ctx)

	brandID, _ := ctx.Value("brand_id").(string)
	brandID = strings.TrimSpace(brandID)
	if brandID == "" {
		return fmt.Errorf("brand_id is missing in context")
	}

	schemaName := fmt.Sprintf("tenant_%s", brandID)
	if _, err := tx.Exec(ctx, fmt.Sprintf(`SET LOCAL search_path TO "%s", public`, schemaName)); err != nil {
		return fmt.Errorf("failed to set tenant search_path: %w", err)
	}

	if _, err := tx.Exec(ctx, "SET LOCAL app.brand_id = $1", brandID); err != nil {
		return fmt.Errorf("failed to set app.brand_id: %w", err)
	}

	if branchID, _ := ctx.Value("branch_id").(string); strings.TrimSpace(branchID) != "" {
		if _, err := tx.Exec(ctx, "SET LOCAL app.branch_id = $1", strings.TrimSpace(branchID)); err != nil {
			return fmt.Errorf("failed to set app.branch_id: %w", err)
		}
	}

	q := pg.New(tx)
	txCtx := repository.WithTenantQueries(ctx, q)

	if err := fn(txCtx, q); err != nil {
		return err
	}

	return nil
}
