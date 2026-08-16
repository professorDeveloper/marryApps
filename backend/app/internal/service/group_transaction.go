package service

import (
	"context"
	"fmt"
	"strings"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
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

func (s *GroupTransactionS) getTenantMutationQueries(ctx context.Context) (*pg.Queries, context.Context, pgx.Tx, bool, error) {
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

func (s *GroupTransactionS) CreateGroupTransaction(ctx context.Context, req *model.CreateGroupTransactionRequest) (*model.GroupTransactionResponse, error) {
	q, txCtx, tx, shouldCommit, err := s.getTenantMutationQueries(ctx)
	if err != nil {
		return nil, err
	}
	if shouldCommit {
		defer tx.Rollback(ctx)
	}

	row, err := q.CreateGroupTransaction(txCtx, pg.CreateGroupTransactionParams{
		ID:   uuid.New(),
		Name: req.Name,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to create group transaction: %w", err)
	}

	if shouldCommit {
		if err := tx.Commit(ctx); err != nil {
			return nil, fmt.Errorf("failed to commit transaction: %w", err)
		}
	}

	return toGroupTransactionResponse(row), nil
}

func (s *GroupTransactionS) GetGroupTransactionByID(ctx context.Context, id string) (*model.GroupTransactionResponse, error) {
	uid, err := uuid.Parse(id)
	if err != nil {
		return nil, fmt.Errorf("invalid id: %w", err)
	}

	var row pg.GroupTransaction
	err = withTenantRead(ctx, s.repo, func(ctx context.Context, q *pg.Queries) error {
		var err error
		row, err = q.GetGroupTransactionByID(ctx, uid)
		if err != nil {
			return fmt.Errorf("failed to get group transaction: %w", err)
		}
		return nil
	})
	if err != nil {
		return nil, err
	}
	return toGroupTransactionResponse(row), nil
}

func (s *GroupTransactionS) GetAllGroupTransactions(ctx context.Context, filter model.GroupTransactionListFilter, limit, offset int32) ([]*model.GroupTransactionResponse, int64, error) {
	if filter.SortBy == "" {
		filter.SortBy = "created_at"
	}
	if filter.SortOrder == "" {
		filter.SortOrder = "desc"
	}

	var total int64
	var rows []pg.GroupTransaction
	err := withTenantRead(ctx, s.repo, func(ctx context.Context, q *pg.Queries) error {
		var err error
		total, err = q.CountGroupTransactions(ctx, filter.Search)
		if err != nil {
			return fmt.Errorf("failed to count group transactions: %w", err)
		}

		rows, err = q.GetAllGroupTransactions(ctx, pg.GetAllGroupTransactionsParams{
			Search:    filter.Search,
			SortBy:    filter.SortBy,
			SortOrder: filter.SortOrder,
			Limit:     limit,
			Offset:    offset,
		})
		if err != nil {
			return fmt.Errorf("failed to get group transactions: %w", err)
		}
		return nil
	})
	if err != nil {
		return nil, 0, err
	}

	result := make([]*model.GroupTransactionResponse, 0, len(rows))
	for _, r := range rows {
		result = append(result, toGroupTransactionResponse(r))
	}

	return result, total, nil
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

	q, txCtx, tx, shouldCommit, err := s.getTenantMutationQueries(ctx)
	if err != nil {
		return nil, err
	}
	if shouldCommit {
		defer tx.Rollback(ctx)
	}

	row, err := q.UpdateGroupTransaction(txCtx, pg.UpdateGroupTransactionParams{
		ID:   uid,
		Name: name,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to update group transaction: %w", err)
	}

	if shouldCommit {
		if err := tx.Commit(ctx); err != nil {
			return nil, fmt.Errorf("failed to commit transaction: %w", err)
		}
	}

	return toGroupTransactionResponse(row), nil
}

func (s *GroupTransactionS) DeleteGroupTransaction(ctx context.Context, id string) error {
	uid, err := uuid.Parse(id)
	if err != nil {
		return fmt.Errorf("invalid id: %w", err)
	}

	q, txCtx, tx, shouldCommit, err := s.getTenantMutationQueries(ctx)
	if err != nil {
		return err
	}
	if shouldCommit {
		defer tx.Rollback(ctx)
	}

	if err := q.DeleteGroupTransaction(txCtx, uid); err != nil {
		return fmt.Errorf("failed to delete group transaction: %w", err)
	}

	if shouldCommit {
		if err := tx.Commit(ctx); err != nil {
			return fmt.Errorf("failed to commit transaction: %w", err)
		}
	}

	return nil
}

func (s *GroupTransactionS) RestoreGroupTransaction(ctx context.Context, id string) (*model.GroupTransactionResponse, error) {
	uid, err := uuid.Parse(id)
	if err != nil {
		return nil, fmt.Errorf("invalid id: %w", err)
	}

	q, txCtx, tx, shouldCommit, err := s.getTenantMutationQueries(ctx)
	if err != nil {
		return nil, err
	}
	if shouldCommit {
		defer tx.Rollback(ctx)
	}

	row, err := q.RestoreGroupTransaction(txCtx, uid)
	if err != nil {
		return nil, fmt.Errorf("failed to restore group transaction: %w", err)
	}

	if shouldCommit {
		if err := tx.Commit(ctx); err != nil {
			return nil, fmt.Errorf("failed to commit transaction: %w", err)
		}
	}

	return toGroupTransactionResponse(row), nil
}

func toGroupTransactionResponse(row pg.GroupTransaction) *model.GroupTransactionResponse {
	isDeleted := row.DeletedAt != nil && *row.DeletedAt > 0
	return &model.GroupTransactionResponse{
		ID:        row.ID.String(),
		Name:      row.Name,
		BranchID:  uuidToStr(row.BranchID),
		CreatedAt: timestampToTime(row.CreatedAt),
		UpdatedAt: timestampToTime(row.UpdatedAt),
		IsDeleted: isDeleted,
	}
}
