package service

import (
	"context"
	"fmt"
	"log"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"gitlab.yurtal.tech/company/maryai/back/internal/model"
	"gitlab.yurtal.tech/company/maryai/back/internal/repository"
	pg "gitlab.yurtal.tech/company/maryai/back/internal/repository/pg/tenantsdb"
)

type HallS struct {
	repo *repository.Repository
}

func NewHallS(repo *repository.Repository) *HallS {
	return &HallS{repo: repo}
}

// CreateHall creates a new hall
func (h *HallS) CreateHall(ctx context.Context, name string, branchID string, nameI18n *uuid.UUID, width, height *int32) (*model.HallResponse, error) {
	if name == "" {
		return nil, fmt.Errorf("hall name is required")
	}
	bID, err := resolveBranchUUID(ctx, branchID)
	if err != nil {
		return nil, err
	}

	nameI18nUUID := pgtype.UUID{}
	if nameI18n != nil {
		nameI18nUUID = pgtype.UUID{Bytes: *nameI18n, Valid: true}
	}

	finalWidth := int32(0)
	if width != nil {
		finalWidth = *width
	}
	finalHeight := int32(0)
	if height != nil {
		finalHeight = *height
	}

	hall, err := h.repo.Tenant(ctx).CreateHall(ctx, pg.CreateHallParams{
		ID:       uuid.New(),
		BranchID: bID,
		Name:     name,
		NameI18n: nameI18nUUID,
		Width:    finalWidth,
		Height:   finalHeight,
	})
	if err != nil {
		log.Printf("CreateHall failed: %v", err)
		return nil, fmt.Errorf("failed to create hall: %w", err)
	}

	return toHallResponse(hall), nil
}

// GetHallByID retrieves a hall by ID
func (h *HallS) GetHallByID(ctx context.Context, hallID string) (*model.HallResponse, error) {
	id, err := uuid.Parse(hallID)
	if err != nil {
		return nil, fmt.Errorf("invalid hall ID: %w", err)
	}

	hall, err := h.repo.Tenant(ctx).GetHallByID(ctx, id)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, fmt.Errorf("hall not found")
		}
		log.Printf("GetHallByID failed: %v", err)
		return nil, fmt.Errorf("failed to retrieve hall: %w", err)
	}

	return toHallResponse(hall), nil
}

// GetAllHalls retrieves all halls with pagination
func (h *HallS) GetAllHalls(ctx context.Context, limit, offset int32) ([]*model.HallResponse, error) {
	halls, err := h.repo.Tenant(ctx).GetAllHalls(ctx, pg.GetAllHallsParams{
		Limit:  limit,
		Offset: offset,
	})
	if err != nil {
		log.Printf("GetAllHalls failed: %v", err)
		return nil, fmt.Errorf("failed to retrieve halls: %w", err)
	}

	var responses []*model.HallResponse
	for _, hall := range halls {
		responses = append(responses, toHallResponse(hall))
	}
	return responses, nil
}

// GetHallsByBranchID retrieves halls by branch ID
func (h *HallS) GetHallsByBranchID(ctx context.Context, branchID string, limit, offset int32) ([]*model.HallResponse, error) {
	id, err := uuid.Parse(branchID)
	if err != nil {
		return nil, fmt.Errorf("invalid branch ID: %w", err)
	}

	halls, err := h.repo.Tenant(ctx).GetHallsByBranchID(ctx, pg.GetHallsByBranchIDParams{
		BranchID: id,
		Limit:    limit,
		Offset:   offset,
	})
	if err != nil {
		log.Printf("GetHallsByBranchID failed: %v", err)
		return nil, fmt.Errorf("failed to retrieve halls: %w", err)
	}

	var responses []*model.HallResponse
	for _, hall := range halls {
		responses = append(responses, toHallResponse(hall))
	}
	return responses, nil
}

// GetAllHallsWithLang retrieves all halls with language support
func (h *HallS) GetAllHallsWithLang(ctx context.Context, lang string, limit, offset int32) ([]*model.HallResponse, error) {
	halls, err := h.repo.Tenant(ctx).GetAllHallsWithLanguage(ctx, pg.GetAllHallsWithLanguageParams{
		Column1: lang,
		Limit:   limit,
		Offset:  offset,
	})
	if err != nil {
		log.Printf("GetAllHallsWithLang failed: %v", err)
		return nil, fmt.Errorf("failed to retrieve halls: %w", err)
	}

	var responses []*model.HallResponse
	for _, hall := range halls {
		responses = append(responses, toHallResponse(hall))
	}
	return responses, nil
}

// GetHallsByBranchIDWithLang retrieves halls by branch ID with language support
func (h *HallS) GetHallsByBranchIDWithLang(ctx context.Context, branchID string, lang string, limit, offset int32) ([]*model.HallResponse, error) {
	id, err := uuid.Parse(branchID)
	if err != nil {
		return nil, fmt.Errorf("invalid branch ID: %w", err)
	}

	halls, err := h.repo.Tenant(ctx).GetHallsByBranchIDWithLanguage(ctx, pg.GetHallsByBranchIDWithLanguageParams{
		BranchID: id,
		Column2:  lang,
		Limit:    limit,
		Offset:   offset,
	})
	if err != nil {
		log.Printf("GetHallsByBranchIDWithLang failed: %v", err)
		return nil, fmt.Errorf("failed to retrieve halls: %w", err)
	}

	var responses []*model.HallResponse
	for _, hall := range halls {
		responses = append(responses, toHallResponse(hall))
	}
	return responses, nil
}

// UpdateHall updates a hall
func (h *HallS) UpdateHall(ctx context.Context, hallID string, name *string, branchID *string, nameI18n *string, width, height *int32) (*model.HallResponse, error) {
	id, err := uuid.Parse(hallID)
	if err != nil {
		return nil, fmt.Errorf("invalid hall ID: %w", err)
	}

	// Get existing hall
	existing, err := h.repo.Tenant(ctx).GetHallByID(ctx, id)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, fmt.Errorf("hall not found")
		}
		return nil, fmt.Errorf("failed to get hall: %w", err)
	}

	finalName := existing.Name
	if name != nil && *name != "" {
		finalName = *name
	}

	finalBranchID := existing.BranchID
	if err := validateBranchOverride(ctx, branchID); err != nil {
		return nil, err
	}
	if branchID != nil && *branchID != "" {
		branchUUID, err := uuid.Parse(*branchID)
		if err != nil {
			return nil, fmt.Errorf("invalid branch_id: %w", err)
		}
		finalBranchID = branchUUID
	}

	finalNameI18n := existing.NameI18n
	if nameI18n != nil && *nameI18n != "" {
		nameI18nUUID, err := uuid.Parse(*nameI18n)
		if err != nil {
			return nil, fmt.Errorf("invalid name_i18n UUID: %w", err)
		}
		finalNameI18n = pgtype.UUID{Bytes: nameI18nUUID, Valid: true}
	}

	finalWidth := existing.Width
	if width != nil {
		finalWidth = *width
	}
	finalHeight := existing.Height
	if height != nil {
		finalHeight = *height
	}

	hall, err := h.repo.Tenant(ctx).UpdateHall(ctx, pg.UpdateHallParams{
		ID:       id,
		BranchID: finalBranchID,
		Name:     finalName,
		NameI18n: finalNameI18n,
		Width:    finalWidth,
		Height:   finalHeight,
	})
	if err != nil {
		log.Printf("UpdateHall failed: %v", err)
		return nil, fmt.Errorf("failed to update hall: %w", err)
	}

	return toHallResponse(hall), nil
}

// DeleteHall soft deletes a hall
func (h *HallS) DeleteHall(ctx context.Context, hallID string) error {
	id, err := uuid.Parse(hallID)
	if err != nil {
		return fmt.Errorf("invalid hall ID: %w", err)
	}

	if err := h.repo.Tenant(ctx).DeleteHall(ctx, id); err != nil {
		log.Printf("DeleteHall failed: %v", err)
		return fmt.Errorf("failed to delete hall: %w", err)
	}
	return nil
}

// RestoreHall restores a soft-deleted hall
func (h *HallS) RestoreHall(ctx context.Context, hallID string) (*model.HallResponse, error) {
	id, err := uuid.Parse(hallID)
	if err != nil {
		return nil, fmt.Errorf("invalid hall ID: %w", err)
	}

	if err := h.repo.Tenant(ctx).RestoreHall(ctx, id); err != nil {
		log.Printf("RestoreHall failed: %v", err)
		return nil, fmt.Errorf("failed to restore hall: %w", err)
	}
	return toHallResponse(pg.Hall{ID: id}), nil
}

// SearchHalls searches for halls by name
func (h *HallS) SearchHalls(ctx context.Context, query string, limit, offset int32) ([]*model.HallResponse, error) {
	if query == "" {
		return nil, fmt.Errorf("search query is required")
	}

	q := query
	halls, err := h.repo.Tenant(ctx).SearchHalls(ctx, pg.SearchHallsParams{
		Column1: &q,
		Limit:   limit,
		Offset:  offset,
	})
	if err != nil {
		log.Printf("SearchHalls failed: %v", err)
		return nil, fmt.Errorf("failed to search halls: %w", err)
	}

	var responses []*model.HallResponse
	for _, hall := range halls {
		responses = append(responses, toHallResponse(hall))
	}
	return responses, nil
}

// Helper function to convert database hall to response model
func toHallResponse(hall pg.Hall) *model.HallResponse {
	var nameI18nStr *string
	if hall.NameI18n.Valid {
		str := hall.NameI18n.String()
		nameI18nStr = &str
	}

	var createdAt *time.Time
	if hall.CreatedAt.Valid {
		createdAt = &hall.CreatedAt.Time
	}

	var updatedAt *time.Time
	if hall.UpdatedAt.Valid {
		updatedAt = &hall.UpdatedAt.Time
	}

	name := hall.Name
	branchID := hall.BranchID.String()

	return &model.HallResponse{
		ID:        hall.ID.String(),
		BranchID:  branchID,
		Name:      &name,
		NameI18n:  nameI18nStr,
		Width:     hall.Width,
		Height:    hall.Height,
		CreatedAt: createdAt,
		UpdatedAt: updatedAt,
	}
}
