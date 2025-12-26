package service

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
	"gitlab.yurtal.tech/company/maryai/back/internal/model"
	"gitlab.yurtal.tech/company/maryai/back/internal/repository"
	pg "gitlab.yurtal.tech/company/maryai/back/internal/repository/pg/tenantsdb"
)

type OrganizationS struct {
	repo *repository.Repository
}

func NewOrganizationS(repo *repository.Repository) *OrganizationS {
	return &OrganizationS{repo: repo}
}

// CreateBranch creates a new branch
func (o *OrganizationS) CreateBranch(ctx context.Context, name string, nameI18n *uuid.UUID, address, phone *string) (*model.BranchResponse, error) {
	if name == "" {
		return nil, fmt.Errorf("branch name is required")
	}

	nameI18nUUID := pgtype.UUID{}
	if nameI18n != nil {
		nameI18nUUID = pgtype.UUID{Bytes: *nameI18n, Valid: true}
	}

	branch, err := o.repo.Tenant(ctx).CreateBranch(ctx, pg.CreateBranchParams{
		ID: uuid.New(), Name: name, NameI18n: nameI18nUUID, Address: address, Phone: phone,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to create branch: %w", err)
	}
	return toBranchResponse(branch), nil
}

// GetBranchByID retrieves a branch by ID
func (o *OrganizationS) GetBranchByID(ctx context.Context, branchID string) (*model.BranchResponse, error) {
	id, err := uuid.Parse(branchID)
	if err != nil {
		return nil, fmt.Errorf("invalid branch ID: %w", err)
	}
	branch, err := o.repo.Tenant(ctx).GetBranchByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("failed to get branch: %w", err)
	}
	return toBranchResponse(branch), nil
}

// GetAllBranches retrieves all branches
func (o *OrganizationS) GetAllBranches(ctx context.Context, limit, offset int32) ([]model.BranchResponse, error) {
	branches, err := o.repo.Tenant(ctx).GetAllBranches(ctx, pg.GetAllBranchesParams{Limit: limit, Offset: offset})
	if err != nil {
		return nil, fmt.Errorf("failed to get branches: %w", err)
	}
	var responses []model.BranchResponse
	for _, b := range branches {
		responses = append(responses, *toBranchResponse(b))
	}
	return responses, nil
}

// DeleteBranch soft deletes a branch
func (o *OrganizationS) DeleteBranch(ctx context.Context, branchID string) error {
	id, err := uuid.Parse(branchID)
	if err != nil {
		return fmt.Errorf("invalid branch ID: %w", err)
	}
	if err := o.repo.Tenant(ctx).DeleteBranch(ctx, id); err != nil {
		return fmt.Errorf("failed to delete branch: %w", err)
	}
	return nil
}

// RestoreBranch restores a deleted branch
func (o *OrganizationS) RestoreBranch(ctx context.Context, branchID string) error {
	id, err := uuid.Parse(branchID)
	if err != nil {
		return fmt.Errorf("invalid branch ID: %w", err)
	}
	if err := o.repo.Tenant(ctx).RestoreBranch(ctx, id); err != nil {
		return fmt.Errorf("failed to restore branch: %w", err)
	}
	return nil
}

// CreateTranslation creates a new translation
func (o *OrganizationS) CreateTranslation(ctx context.Context, uz, ru, en *string) (*model.TranslationResponse, error) {
	translation, err := o.repo.Tenant(ctx).CreateTranslation(ctx, pg.CreateTranslationParams{
		ID: uuid.New(), Uz: uz, Ru: ru, En: en,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to create translation: %w", err)
	}
	return toTranslationResponse(translation), nil
}

// GetTranslationByID retrieves a translation by ID
func (o *OrganizationS) GetTranslationByID(ctx context.Context, translationID string) (*model.TranslationResponse, error) {
	id, err := uuid.Parse(translationID)
	if err != nil {
		return nil, fmt.Errorf("invalid translation ID: %w", err)
	}
	translation, err := o.repo.Tenant(ctx).GetTranslationByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("failed to get translation: %w", err)
	}
	return toTranslationResponse(translation), nil
}

// GetAllTranslations retrieves all translations
func (o *OrganizationS) GetAllTranslations(ctx context.Context, limit, offset int32) ([]model.TranslationResponse, error) {
	translations, err := o.repo.Tenant(ctx).GetAllTranslations(ctx, pg.GetAllTranslationsParams{Limit: limit, Offset: offset})
	if err != nil {
		return nil, fmt.Errorf("failed to get translations: %w", err)
	}
	var responses []model.TranslationResponse
	for _, t := range translations {
		responses = append(responses, *toTranslationResponse(t))
	}
	return responses, nil
}

// DeleteTranslation soft deletes a translation
func (o *OrganizationS) DeleteTranslation(ctx context.Context, translationID string) error {
	id, err := uuid.Parse(translationID)
	if err != nil {
		return fmt.Errorf("invalid translation ID: %w", err)
	}
	if err := o.repo.Tenant(ctx).DeleteTranslation(ctx, id); err != nil {
		return fmt.Errorf("failed to delete translation: %w", err)
	}
	return nil
}

// RestoreTranslation restores a deleted translation
func (o *OrganizationS) RestoreTranslation(ctx context.Context, translationID string) error {
	id, err := uuid.Parse(translationID)
	if err != nil {
		return fmt.Errorf("invalid translation ID: %w", err)
	}
	if err := o.repo.Tenant(ctx).RestoreTranslation(ctx, id); err != nil {
		return fmt.Errorf("failed to restore translation: %w", err)
	}
	return nil
}

// Helper functions
func toBranchResponse(b pg.Branch) *model.BranchResponse {
	if b.ID == uuid.Nil {
		return nil
	}
	var nameI18nStr *string
	if b.NameI18n.Valid {
		uuidStr := uuid.UUID(b.NameI18n.Bytes).String()
		nameI18nStr = &uuidStr
	}

	var createdAt *time.Time
	if b.CreatedAt.Valid {
		createdAt = &b.CreatedAt.Time
	}

	var updatedAt *time.Time
	if b.UpdatedAt.Valid {
		updatedAt = &b.UpdatedAt.Time
	}

	name := b.Name
	return &model.BranchResponse{
		ID:        b.ID.String(),
		Name:      &name,
		NameI18n:  nameI18nStr,
		Address:   b.Address,
		Phone:     b.Phone,
		CreatedAt: createdAt,
		UpdatedAt: updatedAt,
	}
}

func toTranslationResponse(t pg.Translation) *model.TranslationResponse {
	if t.ID == uuid.Nil {
		return nil
	}

	var createdAt *time.Time
	if t.CreatedAt.Valid {
		createdAt = &t.CreatedAt.Time
	}

	var updatedAt *time.Time
	if t.UpdatedAt.Valid {
		updatedAt = &t.UpdatedAt.Time
	}

	return &model.TranslationResponse{
		ID:        t.ID.String(),
		Uz:        t.Uz,
		Ru:        t.Ru,
		En:        t.En,
		CreatedAt: createdAt,
		UpdatedAt: updatedAt,
	}
}
