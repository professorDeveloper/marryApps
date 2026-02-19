package service

import (
	"context"
	"fmt"

	"github.com/google/uuid"
	"gitlab.yurtal.tech/company/maryai/back/internal/model"
	"gitlab.yurtal.tech/company/maryai/back/internal/repository"
	pg "gitlab.yurtal.tech/company/maryai/back/internal/repository/pg/tenantsdb"
)

type GroupTransactionS struct {
	repo *repository.Repository
}

func NewGroupTransactionS(repo *repository.Repository) *GroupTransactionS {
	return &GroupTransactionS{repo: repo}
}

func (s *GroupTransactionS) CreateGroupTransaction(ctx context.Context, req *model.CreateGroupTransactionRequest) (*model.GroupTransactionResponse, error) {
	row, err := s.repo.Tenant(ctx).CreateGroupTransaction(ctx, pg.CreateGroupTransactionParams{
		ID:   uuid.New(),
		Name: req.Name,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to create group transaction: %w", err)
	}
	return toGroupTransactionResponse(row), nil
}

func (s *GroupTransactionS) GetGroupTransactionByID(ctx context.Context, id string) (*model.GroupTransactionResponse, error) {
	uid, err := uuid.Parse(id)
	if err != nil {
		return nil, fmt.Errorf("invalid id: %w", err)
	}
	row, err := s.repo.Tenant(ctx).GetGroupTransactionByID(ctx, uid)
	if err != nil {
		return nil, fmt.Errorf("failed to get group transaction: %w", err)
	}
	return toGroupTransactionResponse(row), nil
}

func (s *GroupTransactionS) GetAllGroupTransactions(ctx context.Context, limit, offset int32) ([]*model.GroupTransactionResponse, error) {
	rows, err := s.repo.Tenant(ctx).GetAllGroupTransactions(ctx, pg.GetAllGroupTransactionsParams{
		Limit:  limit,
		Offset: offset,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to get group transactions: %w", err)
	}
	var result []*model.GroupTransactionResponse
	for _, r := range rows {
		result = append(result, toGroupTransactionResponse(r))
	}
	return result, nil
}

func (s *GroupTransactionS) UpdateGroupTransaction(ctx context.Context, id string, req *model.UpdateGroupTransactionRequest) (*model.GroupTransactionResponse, error) {
	uid, err := uuid.Parse(id)
	if err != nil {
		return nil, fmt.Errorf("invalid id: %w", err)
	}
	name := ""
	if req.Name != nil {
		name = *req.Name
	}
	row, err := s.repo.Tenant(ctx).UpdateGroupTransaction(ctx, pg.UpdateGroupTransactionParams{
		ID:   uid,
		Name: name,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to update group transaction: %w", err)
	}
	return toGroupTransactionResponse(row), nil
}

func (s *GroupTransactionS) DeleteGroupTransaction(ctx context.Context, id string) error {
	uid, err := uuid.Parse(id)
	if err != nil {
		return fmt.Errorf("invalid id: %w", err)
	}
	if err := s.repo.Tenant(ctx).DeleteGroupTransaction(ctx, uid); err != nil {
		return fmt.Errorf("failed to delete group transaction: %w", err)
	}
	return nil
}

func (s *GroupTransactionS) RestoreGroupTransaction(ctx context.Context, id string) (*model.GroupTransactionResponse, error) {
	uid, err := uuid.Parse(id)
	if err != nil {
		return nil, fmt.Errorf("invalid id: %w", err)
	}
	row, err := s.repo.Tenant(ctx).RestoreGroupTransaction(ctx, uid)
	if err != nil {
		return nil, fmt.Errorf("failed to restore group transaction: %w", err)
	}
	return toGroupTransactionResponse(row), nil
}

func (s *GroupTransactionS) SearchGroupTransactions(ctx context.Context, query string, limit, offset int32) ([]*model.GroupTransactionResponse, error) {
	rows, err := s.repo.Tenant(ctx).SearchGroupTransactions(ctx, pg.SearchGroupTransactionsParams{
		Column1: &query,
		Limit:   limit,
		Offset:  offset,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to search group transactions: %w", err)
	}
	var result []*model.GroupTransactionResponse
	for _, r := range rows {
		result = append(result, toGroupTransactionResponse(r))
	}
	return result, nil
}

func toGroupTransactionResponse(row pg.GroupTransaction) *model.GroupTransactionResponse {
	return &model.GroupTransactionResponse{
		ID:        row.ID.String(),
		Name:      row.Name,
		BranchID:  uuidToStr(row.BranchID),
		CreatedAt: timestampToTime(row.CreatedAt),
		UpdatedAt: timestampToTime(row.UpdatedAt),
	}
}
