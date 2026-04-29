package service

import (
	"context"
	"fmt"
	"strconv"
	"strings"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"gitlab.yurtal.tech/company/maryai/back/internal/repository"
	pg "gitlab.yurtal.tech/company/maryai/back/internal/repository/pg/tenantsdb"
)

type ShiftS struct {
	repo *repository.Repository
}

func NewShiftS(repo *repository.Repository) *ShiftS {
	return &ShiftS{
		repo: repo,
	}
}

func (s *ShiftS) getTenantMutationQueries(ctx context.Context) (*pg.Queries, context.Context, pgx.Tx, bool, error) {
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
		return nil, ctx, nil, false, fmt.Errorf("failed to begin transaction: %w", err)
	}

	q := pg.New(tx)
	txCtx := repository.WithTenantQueries(ctx, q)
	return q, txCtx, tx, true, nil
}

// CreateShift creates a new work shift
func (s *ShiftS) CreateShift(ctx context.Context, name string, role *string, workingDays *string, openTime *string, closeTime *string, branchID string) (*ShiftResponse, error) {
	if name == "" {
		return nil, fmt.Errorf("shift name is required")
	}

	branchUUID, err := resolveBranchUUID(ctx, branchID)
	if err != nil {
		return nil, err
	}

	openTimeInt := parseTimeToSeconds(openTime)
	closeTimeInt := parseTimeToSeconds(closeTime)

	var roleValue *string
	if role != nil {
		roleStr := strings.TrimSpace(strings.ToLower(*role))
		if roleStr != "" {
			roleValue = &roleStr
		}
	}

	q, txCtx, tx, shouldCommit, err := s.getTenantMutationQueries(ctx)
	if err != nil {
		return nil, err
	}
	if shouldCommit {
		defer tx.Rollback(ctx)
	}

	params := pg.CreateShiftParams{
		ID:          uuid.New(),
		Name:        name,
		Role:        roleValue,
		WorkingDays: workingDays,
		OpenTime:    openTimeInt,
		CloseTime:   closeTimeInt,
		BranchID: pgtype.UUID{
			Bytes: branchUUID,
			Valid: true,
		},
	}

	shift, err := q.CreateShift(txCtx, params)
	if err != nil {
		return nil, fmt.Errorf("failed to create shift: %w", err)
	}

	if shouldCommit {
		if err := tx.Commit(ctx); err != nil {
			return nil, fmt.Errorf("failed to commit transaction: %w", err)
		}
	}

	return toShiftResponse(shift), nil
}

// GetShiftByID retrieves a shift by ID
func (s *ShiftS) GetShiftByID(ctx context.Context, shiftID string) (*ShiftResponse, error) {
	shiftUUID, err := uuid.Parse(shiftID)
	if err != nil {
		return nil, fmt.Errorf("invalid shift ID: %w", err)
	}

	var shift pg.Shift
	err = withTenantRead(ctx, s.repo, func(ctx context.Context, q *pg.Queries) error {
		var err error
		shift, err = q.GetShiftByID(ctx, shiftUUID)
		return err
	})
	if err != nil {
		return nil, fmt.Errorf("failed to get shift: %w", err)
	}

	return toShiftResponse(shift), nil
}

// GetAllShifts retrieves all shifts
func (s *ShiftS) GetAllShifts(ctx context.Context) ([]ShiftResponse, error) {
	var shifts []pg.Shift
	err := withTenantRead(ctx, s.repo, func(ctx context.Context, q *pg.Queries) error {
		var err error
		shifts, err = q.GetAllShifts(ctx)
		return err
	})
	if err != nil {
		return nil, fmt.Errorf("failed to get shifts: %w", err)
	}

	var responses []ShiftResponse
	for _, shift := range shifts {
		responses = append(responses, *toShiftResponse(shift))
	}
	return responses, nil
}

// GetShiftsByBranchID retrieves all shifts for a specific branch
func (s *ShiftS) GetShiftsByBranchID(ctx context.Context, branchID string) ([]ShiftResponse, error) {
	branchUUID, err := uuid.Parse(branchID)
	if err != nil {
		return nil, fmt.Errorf("invalid branch ID: %w", err)
	}

	var shifts []pg.Shift
	err = withTenantRead(ctx, s.repo, func(ctx context.Context, q *pg.Queries) error {
		var err error
		shifts, err = q.GetShiftsByBranchID(ctx, pgtype.UUID{
			Bytes: branchUUID,
			Valid: true,
		})
		return err
	})
	if err != nil {
		return nil, fmt.Errorf("failed to get shifts for branch: %w", err)
	}

	var responses []ShiftResponse
	for _, shift := range shifts {
		responses = append(responses, *toShiftResponse(shift))
	}
	return responses, nil
}

// UpdateShift updates a shift
func (s *ShiftS) UpdateShift(ctx context.Context, shiftID string, name *string, role *string, workingDays *string, openTime *string, closeTime *string) (*ShiftResponse, error) {
	shiftUUID, err := uuid.Parse(shiftID)
	if err != nil {
		return nil, fmt.Errorf("invalid shift ID: %w", err)
	}

	// Get existing shift to preserve values
	var existingShift pg.Shift
	err = withTenantRead(ctx, s.repo, func(ctx context.Context, q *pg.Queries) error {
		var err error
		existingShift, err = q.GetShiftByID(ctx, shiftUUID)
		return err
	})
	if err != nil {
		return nil, fmt.Errorf("shift not found: %w", err)
	}

	// Use provided values or existing ones
	finalName := existingShift.Name
	if name != nil {
		finalName = *name
	}

	finalRole := existingShift.Role
	if role != nil {
		roleStr := strings.TrimSpace(strings.ToLower(*role))
		if roleStr != "" {
			finalRole = &roleStr
		}
	}

	finalWorkingDays := existingShift.WorkingDays
	if workingDays != nil {
		finalWorkingDays = workingDays
	}

	finalOpenTime := existingShift.OpenTime
	if openTime != nil {
		finalOpenTime = parseTimeToSeconds(openTime)
	}
	finalCloseTime := existingShift.CloseTime
	if closeTime != nil {
		finalCloseTime = parseTimeToSeconds(closeTime)
	}

	q, txCtx, tx, shouldCommit, err := s.getTenantMutationQueries(ctx)
	if err != nil {
		return nil, err
	}
	if shouldCommit {
		defer tx.Rollback(ctx)
	}

	params := pg.UpdateShiftParams{
		ID:          shiftUUID,
		Name:        finalName,
		Role:        finalRole,
		WorkingDays: finalWorkingDays,
		OpenTime:    finalOpenTime,
		CloseTime:   finalCloseTime,
		BranchID:    existingShift.BranchID,
	}

	shift, err := q.UpdateShift(txCtx, params)
	if err != nil {
		return nil, fmt.Errorf("failed to update shift: %w", err)
	}

	if shouldCommit {
		if err := tx.Commit(ctx); err != nil {
			return nil, fmt.Errorf("failed to commit transaction: %w", err)
		}
	}

	return toShiftResponse(shift), nil
}

// DeleteShift performs soft delete on a shift
func (s *ShiftS) DeleteShift(ctx context.Context, shiftID string) error {
	shiftUUID, err := uuid.Parse(shiftID)
	if err != nil {
		return fmt.Errorf("invalid shift ID: %w", err)
	}

	q, txCtx, tx, shouldCommit, err := s.getTenantMutationQueries(ctx)
	if err != nil {
		return err
	}
	if shouldCommit {
		defer tx.Rollback(ctx)
	}

	_, err = q.SoftDeleteShift(txCtx, shiftUUID)
	if err != nil {
		return fmt.Errorf("failed to delete shift: %w", err)
	}

	if shouldCommit {
		if err := tx.Commit(ctx); err != nil {
			return fmt.Errorf("failed to commit transaction: %w", err)
		}
	}

	return nil
}

// Response models
type ShiftResponse struct {
	ID          string  `json:"id"`
	Name        string  `json:"name"`
	Role        *string `json:"role"`
	WorkingDays *string `json:"working_days"`
	OpenTime    *string `json:"open_time"`
	CloseTime   *string `json:"close_time"`
	BranchID    string  `json:"branch_id,omitempty"`
}

func toShiftResponse(shift pg.Shift) *ShiftResponse {
	var branchID string
	if shift.BranchID.Valid {
		branchID = shift.BranchID.String()
	}

	var role *string
	if roleStr, ok := roleToString(shift.Role); ok {
		role = &roleStr
	}

	return &ShiftResponse{
		ID:          shift.ID.String(),
		Name:        shift.Name,
		Role:        role,
		WorkingDays: shift.WorkingDays,
		OpenTime:    secondsToTimeStr(shift.OpenTime),
		CloseTime:   secondsToTimeStr(shift.CloseTime),
		BranchID:    branchID,
	}
}

// secondsToTimeStr converts seconds since midnight back to "HH:MM:SS".
func secondsToTimeStr(secs *int64) *string {
	if secs == nil {
		return nil
	}
	total := *secs
	h := total / 3600
	m := (total % 3600) / 60
	s := total % 60
	str := fmt.Sprintf("%02d:%02d:%02d", h, m, s)
	return &str
}

// parseTimeToSeconds parses "HH:MM:SS" or "HH:MM" into seconds since midnight.
func parseTimeToSeconds(t *string) *int64 {
	if t == nil || *t == "" {
		return nil
	}
	parts := strings.Split(*t, ":")
	if len(parts) < 2 {
		return nil
	}
	h, err1 := strconv.ParseInt(parts[0], 10, 64)
	m, err2 := strconv.ParseInt(parts[1], 10, 64)
	if err1 != nil || err2 != nil {
		return nil
	}
	var s int64
	if len(parts) >= 3 {
		s, _ = strconv.ParseInt(parts[2], 10, 64)
	}
	total := h*3600 + m*60 + s
	return &total
}
