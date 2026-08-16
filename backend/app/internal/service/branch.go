package service

import (
	"context"
	"fmt"
	"strings"

	"github.com/google/uuid"
)

func branchIDFromContext(ctx context.Context) (string, bool) {
	if ctx == nil {
		return "", false
	}
	if v := ctx.Value("branch_id"); v != nil {
		if s, ok := v.(string); ok {
			s = strings.TrimSpace(s)
			if s != "" {
				return s, true
			}
		}
	}
	return "", false
}

func resolveBranchUUID(ctx context.Context, branchID string) (uuid.UUID, error) {
	branchID = strings.TrimSpace(branchID)
	ctxBranch, hasCtx := branchIDFromContext(ctx)
	if branchID == "" {
		branchID = ctxBranch
	} else if hasCtx && ctxBranch != "" && branchID != ctxBranch {
		return uuid.Nil, fmt.Errorf("branch_id does not match token branch")
	}

	if branchID == "" {
		return uuid.Nil, fmt.Errorf("branch_id is required")
	}

	branchUUID, err := uuid.Parse(branchID)
	if err != nil {
		return uuid.Nil, fmt.Errorf("invalid branch ID: %w", err)
	}
	return branchUUID, nil
}

func validateBranchOverride(ctx context.Context, branchID *string) error {
	if branchID == nil {
		return nil
	}
	value := strings.TrimSpace(*branchID)
	if value == "" {
		return nil
	}
	ctxBranch, hasCtx := branchIDFromContext(ctx)
	if hasCtx && ctxBranch != "" && value != ctxBranch {
		return fmt.Errorf("branch_id does not match token branch")
	}
	return nil
}
