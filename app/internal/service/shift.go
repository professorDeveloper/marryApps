package service

import (
	"context"
	"fmt"
	"strings"

	"github.com/google/uuid"
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

// CreateShift creates a new work shift
func (s *ShiftS) CreateShift(ctx context.Context, name string, role *string, workingDays *string, openTime *string, closeTime *string, branchID string) (*ShiftResponse, error) {
	if name == "" {
		return nil, fmt.Errorf("shift name is required")
	}

	branchUUID, err := resolveBranchUUID(ctx, branchID)
	if err != nil {
		return nil, err
	}

	// Convert time strings to int64 if provided (time_to_unix conversion can happen in DB)
	var openTimeInt *int64
	var closeTimeInt *int64

	// For now, we'll leave them as nil and let the DB handle defaults
	// In production, you might want to parse time.Time and convert to unix timestamp

	var roleValue *string
	if role != nil {
		roleStr := strings.TrimSpace(strings.ToLower(*role))
		if roleStr != "" {
			roleValue = &roleStr
		}
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

	shift, err := s.repo.Tenant(ctx).CreateShift(ctx, params)
	if err != nil {
		return nil, fmt.Errorf("failed to create shift: %w", err)
	}

	return toShiftResponse(shift), nil
}

// GetShiftByID retrieves a shift by ID
func (s *ShiftS) GetShiftByID(ctx context.Context, shiftID string) (*ShiftResponse, error) {
	shiftUUID, err := uuid.Parse(shiftID)
	if err != nil {
		return nil, fmt.Errorf("invalid shift ID: %w", err)
	}

	shift, err := s.repo.Tenant(ctx).GetShiftByID(ctx, shiftUUID)
	if err != nil {
		return nil, fmt.Errorf("failed to get shift: %w", err)
	}

	return toShiftResponse(shift), nil
}

// GetAllShifts retrieves all shifts
func (s *ShiftS) GetAllShifts(ctx context.Context) ([]ShiftResponse, error) {
	shifts, err := s.repo.Tenant(ctx).GetAllShifts(ctx)
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

	shifts, err := s.repo.Tenant(ctx).GetShiftsByBranchID(ctx, pgtype.UUID{
		Bytes: branchUUID,
		Valid: true,
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
	existingShift, err := s.repo.Tenant(ctx).GetShiftByID(ctx, shiftUUID)
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
	finalCloseTime := existingShift.CloseTime

	params := pg.UpdateShiftParams{
		ID:          shiftUUID,
		Name:        finalName,
		Role:        finalRole,
		WorkingDays: finalWorkingDays,
		OpenTime:    finalOpenTime,
		CloseTime:   finalCloseTime,
		BranchID:    existingShift.BranchID,
	}

	shift, err := s.repo.Tenant(ctx).UpdateShift(ctx, params)
	if err != nil {
		return nil, fmt.Errorf("failed to update shift: %w", err)
	}

	return toShiftResponse(shift), nil
}

// DeleteShift performs soft delete on a shift
func (s *ShiftS) DeleteShift(ctx context.Context, shiftID string) error {
	shiftUUID, err := uuid.Parse(shiftID)
	if err != nil {
		return fmt.Errorf("invalid shift ID: %w", err)
	}

	_, err = s.repo.Tenant(ctx).SoftDeleteShift(ctx, shiftUUID)
	if err != nil {
		return fmt.Errorf("failed to delete shift: %w", err)
	}

	return nil
}

// Response models
type ShiftResponse struct {
	ID          string  `json:"id"`
	Name        string  `json:"name"`
	Role        *string `json:"role"`
	WorkingDays *string `json:"working_days"`
	OpenTime    *int64  `json:"open_time"`
	CloseTime   *int64  `json:"close_time"`
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
		OpenTime:    shift.OpenTime,
		CloseTime:   shift.CloseTime,
		BranchID:    branchID,
	}
}
