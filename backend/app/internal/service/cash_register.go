package service

import (
	"context"
	"fmt"
	"log"
	"strings"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"gitlab.yurtal.tech/company/maryai/back/internal/model"
	"gitlab.yurtal.tech/company/maryai/back/internal/repository"
	pg "gitlab.yurtal.tech/company/maryai/back/internal/repository/pg/tenantsdb"
)

type CashRegisterS struct {
	repo *repository.Repository
}

func NewCashRegisterS(repo *repository.Repository) *CashRegisterS {
	return &CashRegisterS{
		repo: repo,
	}
}

func (s *CashRegisterS) getTenantMutationQueries(ctx context.Context) (*pg.Queries, context.Context, pgx.Tx, bool, error) {
	if existingTx, ok := repository.TenantTxFromContext(ctx); ok && existingTx != nil {
		if q, ok := repository.TenantQueriesFromContext(ctx); ok && q != nil {
			return q, ctx, existingTx, false, nil
		}
		q := pg.New(existingTx)
		txCtx := repository.WithTenantQueries(ctx, q)
		return q, txCtx, existingTx, false, nil
	}

	tx, err := s.repo.PgRepo.TenantPool.Begin(ctx)
	if err != nil {
		return nil, nil, nil, false, fmt.Errorf("failed to begin transaction: %w", err)
	}

	brandID, _ := ctx.Value("brand_id").(string)
	brandID = strings.TrimSpace(brandID)
	if brandID == "" {
		tx.Rollback(ctx)
		return nil, nil, nil, false, fmt.Errorf("brand_id is missing in context")
	}

	schemaName := fmt.Sprintf("tenant_%s", brandID)
	if _, err := tx.Exec(ctx, fmt.Sprintf(`SET LOCAL search_path TO "%s", public`, schemaName)); err != nil {
		tx.Rollback(ctx)
		return nil, nil, nil, false, fmt.Errorf("failed to set tenant search_path: %w", err)
	}

	if _, err := tx.Exec(ctx, "SET LOCAL app.brand_id = $1", brandID); err != nil {
		tx.Rollback(ctx)
		return nil, nil, nil, false, fmt.Errorf("failed to set app.brand_id: %w", err)
	}

	if branchID, _ := ctx.Value("branch_id").(string); strings.TrimSpace(branchID) != "" {
		if _, err := tx.Exec(ctx, "SET LOCAL app.branch_id = $1", strings.TrimSpace(branchID)); err != nil {
			tx.Rollback(ctx)
			return nil, nil, nil, false, fmt.Errorf("failed to set app.branch_id: %w", err)
		}
	}

	q := pg.New(tx)
	txCtx := repository.WithTenantQueries(ctx, q)

	return q, txCtx, tx, true, nil
}

// CreateCashRegister creates a new cash register
func (s *CashRegisterS) CreateCashRegister(ctx context.Context, req model.CashRegisterRequest) (model.CashRegisterResponse, error) {
	branchIDStr := ctx.Value("branch_id").(string)
	if branchIDStr == "" {
		return model.CashRegisterResponse{}, fmt.Errorf("branch_id not found in context")
	}

	branchID, err := uuid.Parse(branchIDStr)
	if err != nil {
		return model.CashRegisterResponse{}, fmt.Errorf("invalid branch_id: %w", err)
	}

	q, txCtx, tx, shouldCommit, err := s.getTenantMutationQueries(ctx)
	if err != nil {
		return model.CashRegisterResponse{}, err
	}
	if shouldCommit {
		defer tx.Rollback(ctx)
	}

	cashRegister, err := q.CreateCashRegister(txCtx, pg.CreateCashRegisterParams{
		ID:       uuid.New(),
		Name:     req.Name,
		BranchID: branchID,
	})
	if err != nil {
		log.Printf("Failed to create cash register: %v", err)
		return model.CashRegisterResponse{}, fmt.Errorf("failed to create cash register: %w", err)
	}

	if shouldCommit {
		if err := tx.Commit(ctx); err != nil {
			return model.CashRegisterResponse{}, fmt.Errorf("failed to commit transaction: %w", err)
		}
	}

	return toCashRegisterResponse(cashRegister), nil
}

// GetCashRegisterByID retrieves a cash register by ID
func (s *CashRegisterS) GetCashRegisterByID(ctx context.Context, id uuid.UUID) (model.CashRegisterResponse, error) {
	var cashRegister pg.CashRegister
	err := withTenantRead(ctx, s.repo, func(ctx context.Context, q *pg.Queries) error {
		var err error
		cashRegister, err = q.GetCashRegisterByID(ctx, id)
		if err != nil {
			log.Printf("Failed to get cash register: %v", err)
			return fmt.Errorf("cash register not found: %w", err)
		}
		return nil
	})
	if err != nil {
		return model.CashRegisterResponse{}, err
	}

	return toCashRegisterResponse(cashRegister), nil
}

// GetAllCashRegisters retrieves all cash registers for a branch with optional search and pagination
func (s *CashRegisterS) GetAllCashRegisters(ctx context.Context, search string, limit, offset int32) ([]model.CashRegisterResponse, int64, error) {
	var total int64
	var cashRegisters []pg.CashRegister
	err := withTenantRead(ctx, s.repo, func(ctx context.Context, q *pg.Queries) error {
		var err error
		total, err = q.CountCashRegisters(ctx, search)
		if err != nil {
			log.Printf("Failed to count cash registers: %v", err)
			return fmt.Errorf("failed to count cash registers: %w", err)
		}

		cashRegisters, err = q.GetAllCashRegisters(ctx, pg.GetAllCashRegistersParams{
			Column1: search,
			Limit:   limit,
			Offset:  offset,
		})
		if err != nil {
			log.Printf("Failed to get cash registers: %v", err)
			return fmt.Errorf("failed to get cash registers: %w", err)
		}
		return nil
	})
	if err != nil {
		return nil, 0, err
	}

	responses := make([]model.CashRegisterResponse, len(cashRegisters))
	for i, cr := range cashRegisters {
		responses[i] = toCashRegisterResponse(cr)
	}

	return responses, total, nil
}

// UpdateCashRegister updates a cash register
func (s *CashRegisterS) UpdateCashRegister(ctx context.Context, id uuid.UUID, req model.CashRegisterRequest) (model.CashRegisterResponse, error) {
	q, txCtx, tx, shouldCommit, err := s.getTenantMutationQueries(ctx)
	if err != nil {
		return model.CashRegisterResponse{}, err
	}
	if shouldCommit {
		defer tx.Rollback(ctx)
	}

	cashRegister, err := q.UpdateCashRegister(txCtx, pg.UpdateCashRegisterParams{
		ID:   id,
		Name: req.Name,
	})
	if err != nil {
		log.Printf("Failed to update cash register: %v", err)
		return model.CashRegisterResponse{}, fmt.Errorf("failed to update cash register: %w", err)
	}

	if shouldCommit {
		if err := tx.Commit(ctx); err != nil {
			return model.CashRegisterResponse{}, fmt.Errorf("failed to commit transaction: %w", err)
		}
	}

	return toCashRegisterResponse(cashRegister), nil
}

// DeleteCashRegister soft deletes a cash register
func (s *CashRegisterS) DeleteCashRegister(ctx context.Context, id uuid.UUID) error {
	q, txCtx, tx, shouldCommit, err := s.getTenantMutationQueries(ctx)
	if err != nil {
		return err
	}
	if shouldCommit {
		defer tx.Rollback(ctx)
	}

	_, err = q.SoftDeleteCashRegister(txCtx, id)
	if err != nil {
		log.Printf("Failed to delete cash register: %v", err)
		return fmt.Errorf("failed to delete cash register: %w", err)
	}

	if shouldCommit {
		if err := tx.Commit(ctx); err != nil {
			return fmt.Errorf("failed to commit transaction: %w", err)
		}
	}

	return nil
}

// RestoreCashRegister restores a soft-deleted cash register
func (s *CashRegisterS) RestoreCashRegister(ctx context.Context, id uuid.UUID) error {
	q, txCtx, tx, shouldCommit, err := s.getTenantMutationQueries(ctx)
	if err != nil {
		return err
	}
	if shouldCommit {
		defer tx.Rollback(ctx)
	}

	_, err = q.RestoreCashRegister(txCtx, id)
	if err != nil {
		log.Printf("Failed to restore cash register: %v", err)
		return fmt.Errorf("failed to restore cash register: %w", err)
	}

	if shouldCommit {
		if err := tx.Commit(ctx); err != nil {
			return fmt.Errorf("failed to commit transaction: %w", err)
		}
	}

	return nil
}

// GetCashRegistersByBranchID retrieves all cash registers for an explicit branch_id
func (s *CashRegisterS) GetCashRegistersByBranchID(ctx context.Context, branchID uuid.UUID, limit, offset int32) ([]model.CashRegisterResponse, error) {
	var cashRegisters []pg.CashRegister
	err := withTenantRead(ctx, s.repo, func(ctx context.Context, q *pg.Queries) error {
		var err error
		cashRegisters, err = q.GetCashRegistersByBranchID(ctx, pg.GetCashRegistersByBranchIDParams{
			BranchID: branchID,
			Limit:    limit,
			Offset:   offset,
		})
		if err != nil {
			return fmt.Errorf("failed to get cash registers: %w", err)
		}
		return nil
	})
	if err != nil {
		return nil, err
	}

	responses := make([]model.CashRegisterResponse, len(cashRegisters))
	for i, cr := range cashRegisters {
		responses[i] = toCashRegisterResponse(cr)
	}

	return responses, nil
}

// Helper function to convert database model to response model
func toCashRegisterResponse(cr pg.CashRegister) model.CashRegisterResponse {
	return model.CashRegisterResponse{
		ID:        cr.ID.String(),
		Name:      cr.Name,
		BranchID:  cr.BranchID.String(),
		CreatedAt: cr.CreatedAt.Time,
		UpdatedAt: cr.UpdatedAt.Time,
	}
}
