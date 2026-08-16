package service

import (
	"context"
	"fmt"
	"log"
	"strings"
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

func (h *HallS) getTenantMutationQueries(ctx context.Context) (*pg.Queries, context.Context, pgx.Tx, bool, error) {
	if existingTx, ok := repository.TenantTxFromContext(ctx); ok && existingTx != nil {
		if q, ok := repository.TenantQueriesFromContext(ctx); ok && q != nil {
			return q, ctx, existingTx, false, nil
		}
		q := pg.New(existingTx)
		txCtx := repository.WithTenantQueries(ctx, q)
		return q, txCtx, existingTx, false, nil
	}

	tx, err := h.repo.PgRepo.TenantPool.Begin(ctx)
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

// CreateHall creates a new hall
func (h *HallS) CreateHall(ctx context.Context, name string, branchID string, nameI18n *uuid.UUID, width, height *int32) (*model.HallResponse, error) {
	q, txCtx, tx, ownsTx, err := h.getTenantMutationQueries(ctx)
	if err != nil {
		return nil, err
	}
	if ownsTx {
		defer tx.Rollback(ctx)
	}

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

	hall, err := q.CreateHall(txCtx, pg.CreateHallParams{
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

	if ownsTx {
		if err := tx.Commit(ctx); err != nil {
			return nil, fmt.Errorf("failed to commit transaction: %w", err)
		}
	}

	return toHallResponse(hall), nil
}

// GetHallByID retrieves a hall by ID
func (h *HallS) GetHallByID(ctx context.Context, hallID string) (*model.HallResponse, error) {
	id, err := uuid.Parse(hallID)
	if err != nil {
		return nil, fmt.Errorf("invalid hall ID: %w", err)
	}

	var hall pg.Hall
	err = withTenantRead(ctx, h.repo, func(ctx context.Context, q *pg.Queries) error {
		var err error
		hall, err = q.GetHallByID(ctx, id)
		if err != nil {
			if err == pgx.ErrNoRows {
				return fmt.Errorf("hall not found")
			}
			log.Printf("GetHallByID failed: %v", err)
			return fmt.Errorf("failed to retrieve hall: %w", err)
		}
		return nil
	})
	if err != nil {
		return nil, err
	}

	return toHallResponse(hall), nil
}

func (h *HallS) GetAllHalls(ctx context.Context, filter model.HallListFilter, limit, offset int32) ([]*model.HallResponse, int64, error) {
	if filter.SortBy == "" {
		filter.SortBy = "created_at"
	}
	if filter.SortOrder == "" {
		filter.SortOrder = "desc"
	}

	var halls []pg.Hall
	var total int64
	err := withTenantRead(ctx, h.repo, func(ctx context.Context, q *pg.Queries) error {
		var err error
		total, err = q.CountHalls(ctx, filter.Search)
		if err != nil {
			log.Printf("CountHalls failed: %v", err)
			return fmt.Errorf("failed to count halls: %w", err)
		}

		halls, err = q.GetAllHalls(ctx, pg.GetAllHallsParams{
			Search:    filter.Search,
			SortBy:    filter.SortBy,
			SortOrder: filter.SortOrder,
			Limit:     limit,
			Offset:    offset,
		})
		if err != nil {
			log.Printf("GetAllHalls failed: %v", err)
			return fmt.Errorf("failed to retrieve halls: %w", err)
		}
		return nil
	})
	if err != nil {
		return nil, 0, err
	}

	var responses []*model.HallResponse
	for _, hall := range halls {
		responses = append(responses, toHallResponse(hall))
	}
	return responses, total, nil
}

// GetHallsByBranchID retrieves halls by branch ID
func (h *HallS) GetHallsByBranchID(ctx context.Context, branchID string, limit, offset int32) ([]*model.HallResponse, int64, error) {
	id, err := uuid.Parse(branchID)
	if err != nil {
		return nil, 0, fmt.Errorf("invalid branch ID: %w", err)
	}

	var halls []pg.Hall
	var total int64
	err = withTenantRead(ctx, h.repo, func(ctx context.Context, q *pg.Queries) error {
		var err error
		total, err = q.CountHallsByBranch(ctx, id)
		if err != nil {
			log.Printf("CountHallsByBranch failed: %v", err)
			return fmt.Errorf("failed to count halls: %w", err)
		}

		halls, err = q.GetHallsByBranchID(ctx, pg.GetHallsByBranchIDParams{
			BranchID: id,
			Limit:    limit,
			Offset:   offset,
		})
		if err != nil {
			log.Printf("GetHallsByBranchID failed: %v", err)
			return fmt.Errorf("failed to retrieve halls: %w", err)
		}
		return nil
	})
	if err != nil {
		return nil, 0, err
	}

	var responses []*model.HallResponse
	for _, hall := range halls {
		responses = append(responses, toHallResponse(hall))
	}
	return responses, total, nil
}

func (h *HallS) GetAllHallsWithLang(ctx context.Context, lang string, filter model.HallListFilter, limit, offset int32) ([]*model.HallResponse, int64, error) {
	if filter.SortBy == "" {
		filter.SortBy = "created_at"
	}
	if filter.SortOrder == "" {
		filter.SortOrder = "desc"
	}

	var halls []pg.Hall
	var total int64
	err := withTenantRead(ctx, h.repo, func(ctx context.Context, q *pg.Queries) error {
		var err error
		total, err = q.CountHalls(ctx, filter.Search)
		if err != nil {
			log.Printf("CountHalls failed: %v", err)
			return fmt.Errorf("failed to count halls: %w", err)
		}

		halls, err = q.GetAllHallsWithLanguage(ctx, pg.GetAllHallsWithLanguageParams{
			Lang:      lang,
			Search:    filter.Search,
			SortBy:    filter.SortBy,
			SortOrder: filter.SortOrder,
			Limit:     limit,
			Offset:    offset,
		})
		if err != nil {
			log.Printf("GetAllHallsWithLang failed: %v", err)
			return fmt.Errorf("failed to retrieve halls: %w", err)
		}
		return nil
	})
	if err != nil {
		return nil, 0, err
	}

	var responses []*model.HallResponse
	for _, hall := range halls {
		responses = append(responses, toHallResponse(hall))
	}
	return responses, total, nil
}

// GetHallsByBranchIDWithLang retrieves halls by branch ID with language support
func (h *HallS) GetHallsByBranchIDWithLang(ctx context.Context, branchID string, lang string, limit, offset int32) ([]*model.HallResponse, int64, error) {
	id, err := uuid.Parse(branchID)
	if err != nil {
		return nil, 0, fmt.Errorf("invalid branch ID: %w", err)
	}

	var halls []pg.Hall
	var total int64
	err = withTenantRead(ctx, h.repo, func(ctx context.Context, q *pg.Queries) error {
		var err error
		total, err = q.CountHallsByBranch(ctx, id)
		if err != nil {
			log.Printf("CountHallsByBranch failed: %v", err)
			return fmt.Errorf("failed to count halls: %w", err)
		}

		halls, err = q.GetHallsByBranchIDWithLanguage(ctx, pg.GetHallsByBranchIDWithLanguageParams{
			BranchID: id,
			Column2:  lang,
			Limit:    limit,
			Offset:   offset,
		})
		if err != nil {
			log.Printf("GetHallsByBranchIDWithLang failed: %v", err)
			return fmt.Errorf("failed to retrieve halls: %w", err)
		}
		return nil
	})
	if err != nil {
		return nil, 0, err
	}

	var responses []*model.HallResponse
	for _, hall := range halls {
		responses = append(responses, toHallResponse(hall))
	}
	return responses, total, nil
}

// UpdateHall updates a hall
func (h *HallS) UpdateHall(ctx context.Context, hallID string, name *string, branchID *string, nameI18n *string, width, height *int32) (*model.HallResponse, error) {
	q, txCtx, tx, ownsTx, err := h.getTenantMutationQueries(ctx)
	if err != nil {
		return nil, err
	}
	if ownsTx {
		defer tx.Rollback(ctx)
	}

	id, err := uuid.Parse(hallID)
	if err != nil {
		return nil, fmt.Errorf("invalid hall ID: %w", err)
	}

	// Get existing hall
	existing, err := q.GetHallByID(txCtx, id)
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

	hall, err := q.UpdateHall(txCtx, pg.UpdateHallParams{
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

	if ownsTx {
		if err := tx.Commit(ctx); err != nil {
			return nil, fmt.Errorf("failed to commit transaction: %w", err)
		}
	}

	return toHallResponse(hall), nil
}

// DeleteHall soft deletes a hall
func (h *HallS) DeleteHall(ctx context.Context, hallID string) error {
	q, txCtx, tx, ownsTx, err := h.getTenantMutationQueries(ctx)
	if err != nil {
		return err
	}
	if ownsTx {
		defer tx.Rollback(ctx)
	}

	id, err := uuid.Parse(hallID)
	if err != nil {
		return fmt.Errorf("invalid hall ID: %w", err)
	}

	if err := q.DeleteHall(txCtx, id); err != nil {
		log.Printf("DeleteHall failed: %v", err)
		return fmt.Errorf("failed to delete hall: %w", err)
	}

	if ownsTx {
		if err := tx.Commit(ctx); err != nil {
			return fmt.Errorf("failed to commit transaction: %w", err)
		}
	}

	return nil
}

// RestoreHall restores a soft-deleted hall
func (h *HallS) RestoreHall(ctx context.Context, hallID string) (*model.HallResponse, error) {
	q, txCtx, tx, ownsTx, err := h.getTenantMutationQueries(ctx)
	if err != nil {
		return nil, err
	}
	if ownsTx {
		defer tx.Rollback(ctx)
	}

	id, err := uuid.Parse(hallID)
	if err != nil {
		return nil, fmt.Errorf("invalid hall ID: %w", err)
	}

	if err := q.RestoreHall(txCtx, id); err != nil {
		log.Printf("RestoreHall failed: %v", err)
		return nil, fmt.Errorf("failed to restore hall: %w", err)
	}

	if ownsTx {
		if err := tx.Commit(ctx); err != nil {
			return nil, fmt.Errorf("failed to commit transaction: %w", err)
		}
	}

	return toHallResponse(pg.Hall{ID: id}), nil
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
