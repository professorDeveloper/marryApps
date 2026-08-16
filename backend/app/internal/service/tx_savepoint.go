package service

import (
	"context"
	"fmt"
	"log"
	"strings"

	"gitlab.yurtal.tech/company/maryai/back/internal/repository"
)

func withTenantSavepoint(ctx context.Context, name string, fn func() error) error {
	tx, ok := repository.TenantTxFromContext(ctx)
	if !ok || tx == nil {
		return fn()
	}

	name = strings.TrimSpace(name)
	if name == "" {
		name = "sp_generic"
	}

	if _, err := tx.Exec(ctx, "SAVEPOINT "+name); err != nil {
		return err
	}

	if err := fn(); err != nil {
		if _, rbErr := tx.Exec(ctx, "ROLLBACK TO SAVEPOINT "+name); rbErr != nil {
			return fmt.Errorf("%v (rollback savepoint error: %w)", err, rbErr)
		}
		if _, relErr := tx.Exec(ctx, "RELEASE SAVEPOINT "+name); relErr != nil {
			log.Printf("release savepoint after rollback failed: %v", relErr)
		}
		return err
	}

	if _, err := tx.Exec(ctx, "RELEASE SAVEPOINT "+name); err != nil {
		return err
	}

	return nil
}