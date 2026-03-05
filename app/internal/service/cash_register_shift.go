package service

import (
	"context"
	"fmt"
	"strings"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
	"gitlab.yurtal.tech/company/maryai/back/internal/model"
	"gitlab.yurtal.tech/company/maryai/back/internal/repository"
	pg "gitlab.yurtal.tech/company/maryai/back/internal/repository/pg/tenantsdb"
)

type CashRegisterShiftS struct {
	repo *repository.Repository
}

func NewCashRegisterShiftS(repo *repository.Repository) *CashRegisterShiftS {
	return &CashRegisterShiftS{repo: repo}
}

func (s *CashRegisterShiftS) OpenShift(ctx context.Context, req model.OpenCashRegisterShiftRequest) (*model.CashRegisterShiftResponse, error) {
	cashRegisterID, err := uuid.Parse(req.CashRegisterID)
	if err != nil {
		return nil, fmt.Errorf("invalid cash_register_id: %w", err)
	}
	cashierID, err := uuid.Parse(req.CashierID)
	if err != nil {
		return nil, fmt.Errorf("invalid cashier_id: %w", err)
	}

	openingCash := pgtype.Numeric{}
	if err := openingCash.Scan(req.OpeningCash); err != nil {
		return nil, fmt.Errorf("invalid opening_cash: %w", err)
	}

	openingCard := pgtype.Numeric{}
	if req.OpeningCard != nil {
		if err := openingCard.Scan(*req.OpeningCard); err != nil {
			return nil, fmt.Errorf("invalid opening_card: %w", err)
		}
	}

	row, err := s.repo.Tenant(ctx).OpenCashRegisterShift(ctx, pg.OpenCashRegisterShiftParams{
		CashRegisterID: cashRegisterID,
		CashierID:      cashierID,
		OpeningCash:    openingCash,
		OpeningCard:    openingCard,
	})
	if err != nil {
		if strings.Contains(err.Error(), "idx_cash_register_shifts_active") {
			return nil, fmt.Errorf("cash register already has an open shift")
		}
		return nil, fmt.Errorf("failed to open shift: %w", err)
	}

	return toCashRegisterShiftResponse(row), nil
}

func (s *CashRegisterShiftS) CloseShift(ctx context.Context, id string, req model.CloseCashRegisterShiftRequest) (*model.CashRegisterShiftResponse, error) {
	shiftID, err := uuid.Parse(id)
	if err != nil {
		return nil, fmt.Errorf("invalid shift id: %w", err)
	}

	closingCash := pgtype.Numeric{}
	if err := closingCash.Scan(req.ClosingCash); err != nil {
		return nil, fmt.Errorf("invalid closing_cash: %w", err)
	}

	closingCard := pgtype.Numeric{}
	if req.ClosingCard != nil {
		if err := closingCard.Scan(*req.ClosingCard); err != nil {
			return nil, fmt.Errorf("invalid closing_card: %w", err)
		}
	}

	row, err := s.repo.Tenant(ctx).CloseCashRegisterShift(ctx, pg.CloseCashRegisterShiftParams{
		ID:          shiftID,
		ClosingCash: closingCash,
		ClosingCard: closingCard,
		Notes:       req.Notes,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to close shift: %w", err)
	}

	return toCashRegisterShiftResponse(row), nil
}

func (s *CashRegisterShiftS) GetShift(ctx context.Context, id string) (*model.CashRegisterShiftResponse, error) {
	shiftID, err := uuid.Parse(id)
	if err != nil {
		return nil, fmt.Errorf("invalid shift id: %w", err)
	}

	row, err := s.repo.Tenant(ctx).GetCashRegisterShiftByID(ctx, shiftID)
	if err != nil {
		return nil, fmt.Errorf("shift not found: %w", err)
	}

	return toCashRegisterShiftResponse(row), nil
}

func (s *CashRegisterShiftS) GetActiveShift(ctx context.Context, cashRegisterID string) (*model.CashRegisterShiftResponse, error) {
	id, err := uuid.Parse(cashRegisterID)
	if err != nil {
		return nil, fmt.Errorf("invalid cash_register_id: %w", err)
	}

	row, err := s.repo.Tenant(ctx).GetActiveShiftByCashRegister(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("no active shift found: %w", err)
	}

	return toCashRegisterShiftResponse(row), nil
}

func (s *CashRegisterShiftS) ListShifts(ctx context.Context, cashRegisterID, cashierID, status *string, limit, offset int32) ([]*model.CashRegisterShiftResponse, int64, error) {
	crID := ""
	if cashRegisterID != nil {
		crID = *cashRegisterID
	}
	cID := ""
	if cashierID != nil {
		cID = *cashierID
	}
	st := ""
	if status != nil {
		st = *status
	}

	count, err := s.repo.Tenant(ctx).CountCashRegisterShifts(ctx, pg.CountCashRegisterShiftsParams{
		Column1: crID,
		Column2: cID,
		Column3: st,
	})
	if err != nil {
		return nil, 0, fmt.Errorf("failed to count shifts: %w", err)
	}

	rows, err := s.repo.Tenant(ctx).ListCashRegisterShifts(ctx, pg.ListCashRegisterShiftsParams{
		Column1: crID,
		Column2: cID,
		Column3: st,
		Limit:   limit,
		Offset:  offset,
	})
	if err != nil {
		return nil, 0, fmt.Errorf("failed to list shifts: %w", err)
	}

	result := make([]*model.CashRegisterShiftResponse, 0, len(rows))
	for _, row := range rows {
		result = append(result, toCashRegisterShiftResponse(row))
	}

	return result, count, nil
}

func (s *CashRegisterShiftS) DeleteShift(ctx context.Context, id string) error {
	shiftID, err := uuid.Parse(id)
	if err != nil {
		return fmt.Errorf("invalid shift id: %w", err)
	}

	if err := s.repo.Tenant(ctx).DeleteCashRegisterShift(ctx, shiftID); err != nil {
		return fmt.Errorf("failed to delete shift: %w", err)
	}

	return nil
}

func toCashRegisterShiftResponse(row pg.CashRegisterShift) *model.CashRegisterShiftResponse {
	resp := &model.CashRegisterShiftResponse{
		ID:             row.ID.String(),
		CashRegisterID: row.CashRegisterID.String(),
		CashierID:      row.CashierID.String(),
		BranchID:       row.BranchID.String(),
		OpenedAt:       row.OpenedAt,
		OpeningCash:    pgNumericToStr(row.OpeningCash),
		Status:         "open",
		Notes:          row.Notes,
	}

	if row.ClosedAt.Valid {
		t := row.ClosedAt.Time
		resp.ClosedAt = &t
		resp.Status = "closed"
	}

	if row.CreatedAt.Valid {
		t := row.CreatedAt.Time
		resp.CreatedAt = &t
	}
	if row.UpdatedAt.Valid {
		t := row.UpdatedAt.Time
		resp.UpdatedAt = &t
	}

	if row.DeletedAt != nil && *row.DeletedAt > 0 {
		resp.Status = "deleted"
	}

	if row.OpeningCard.Valid {
		s := pgNumericToStr(row.OpeningCard)
		resp.OpeningCard = &s
	}
	if row.ClosingCash.Valid {
		s := pgNumericToStr(row.ClosingCash)
		resp.ClosingCash = &s
	}
	if row.ClosingCard.Valid {
		s := pgNumericToStr(row.ClosingCard)
		resp.ClosingCard = &s
	}

	return resp
}
