package service

import (
	"context"
	"fmt"
	"log"

	"github.com/google/uuid"
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

	cashRegister, err := s.repo.Tenant(ctx).CreateCashRegister(ctx, pg.CreateCashRegisterParams{
		ID:       uuid.New(),
		Name:     req.Name,
		BranchID: branchID,
	})
	if err != nil {
		log.Printf("Failed to create cash register: %v", err)
		return model.CashRegisterResponse{}, fmt.Errorf("failed to create cash register: %w", err)
	}

	return toCashRegisterResponse(cashRegister), nil
}

// GetCashRegisterByID retrieves a cash register by ID
func (s *CashRegisterS) GetCashRegisterByID(ctx context.Context, id uuid.UUID) (model.CashRegisterResponse, error) {
	cashRegister, err := s.repo.Tenant(ctx).GetCashRegisterByID(ctx, id)
	if err != nil {
		log.Printf("Failed to get cash register: %v", err)
		return model.CashRegisterResponse{}, fmt.Errorf("cash register not found: %w", err)
	}

	return toCashRegisterResponse(cashRegister), nil
}

// GetAllCashRegisters retrieves all cash registers for a branch with pagination
func (s *CashRegisterS) GetAllCashRegisters(ctx context.Context, limit, offset int32) ([]model.CashRegisterResponse, error) {
	cashRegisters, err := s.repo.Tenant(ctx).GetAllCashRegisters(ctx, pg.GetAllCashRegistersParams{
		Limit:  limit,
		Offset: offset,
	})
	if err != nil {
		log.Printf("Failed to get cash registers: %v", err)
		return nil, fmt.Errorf("failed to get cash registers: %w", err)
	}

	responses := make([]model.CashRegisterResponse, len(cashRegisters))
	for i, cr := range cashRegisters {
		responses[i] = toCashRegisterResponse(cr)
	}

	return responses, nil
}

// UpdateCashRegister updates a cash register
func (s *CashRegisterS) UpdateCashRegister(ctx context.Context, id uuid.UUID, req model.CashRegisterRequest) (model.CashRegisterResponse, error) {
	cashRegister, err := s.repo.Tenant(ctx).UpdateCashRegister(ctx, pg.UpdateCashRegisterParams{
		ID:   id,
		Name: req.Name,
	})
	if err != nil {
		log.Printf("Failed to update cash register: %v", err)
		return model.CashRegisterResponse{}, fmt.Errorf("failed to update cash register: %w", err)
	}

	return toCashRegisterResponse(cashRegister), nil
}

// DeleteCashRegister soft deletes a cash register
func (s *CashRegisterS) DeleteCashRegister(ctx context.Context, id uuid.UUID) error {
	_, err := s.repo.Tenant(ctx).SoftDeleteCashRegister(ctx, id)
	if err != nil {
		log.Printf("Failed to delete cash register: %v", err)
		return fmt.Errorf("failed to delete cash register: %w", err)
	}

	return nil
}

// RestoreCashRegister restores a soft-deleted cash register
func (s *CashRegisterS) RestoreCashRegister(ctx context.Context, id uuid.UUID) error {
	_, err := s.repo.Tenant(ctx).RestoreCashRegister(ctx, id)
	if err != nil {
		log.Printf("Failed to restore cash register: %v", err)
		return fmt.Errorf("failed to restore cash register: %w", err)
	}

	return nil
}

// GetCashRegistersByBranchID retrieves all cash registers for an explicit branch_id
func (s *CashRegisterS) GetCashRegistersByBranchID(ctx context.Context, branchID uuid.UUID, limit, offset int32) ([]model.CashRegisterResponse, error) {
	cashRegisters, err := s.repo.Tenant(ctx).GetCashRegistersByBranchID(ctx, pg.GetCashRegistersByBranchIDParams{
		BranchID: branchID,
		Limit:    limit,
		Offset:   offset,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to get cash registers: %w", err)
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
