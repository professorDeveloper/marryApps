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

// UpdateBranch updates a branch
func (o *OrganizationS) UpdateBranch(ctx context.Context, branchID string, name, nameI18n, address, phone *string) (*model.BranchResponse, error) {
	id, err := uuid.Parse(branchID)
	if err != nil {
		return nil, fmt.Errorf("invalid branch ID: %w", err)
	}

	nameStr := ""
	if name != nil {
		nameStr = *name
	}

	nameI18nUUID := pgtype.UUID{}
	if nameI18n != nil && *nameI18n != "" {
		parsed, err := uuid.Parse(*nameI18n)
		if err != nil {
			return nil, fmt.Errorf("invalid name_i18n UUID: %w", err)
		}
		nameI18nUUID = pgtype.UUID{Bytes: parsed, Valid: true}
	}

	branch, err := o.repo.Tenant(ctx).UpdateBranch(ctx, pg.UpdateBranchParams{
		ID:       id,
		Name:     nameStr,
		NameI18n: nameI18nUUID,
		Address:  address,
		Phone:    phone,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to update branch: %w", err)
	}
	return toBranchResponse(branch), nil
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

func (o *OrganizationS) UpdateTranslation(ctx context.Context, translationID string, uz, ru, en *string) (*model.TranslationResponse, error) {
	id, err := uuid.Parse(translationID)
	if err != nil {
		return nil, fmt.Errorf("invalid translation ID: %w", err)
	}

	translation, err := o.repo.Tenant(ctx).UpdateTranslation(ctx, pg.UpdateTranslationParams{
		ID: id,
		Uz: uz,
		Ru: ru,
		En: en,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to update translation: %w", err)
	}

	return toTranslationResponse(translation), nil
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
func toBranchResponse(b any) *model.BranchResponse {
	var (
		id        uuid.UUID
		name      string
		nameI18n  pgtype.UUID
		address   *string
		phone     *string
		createdAt pgtype.Timestamptz
		updatedAt pgtype.Timestamptz
	)

	switch row := b.(type) {
	case pg.Branch:
		id = row.ID
		name = row.Name
		nameI18n = row.NameI18n
		address = row.Address
		phone = row.Phone
		createdAt = row.CreatedAt
		updatedAt = row.UpdatedAt
	case pg.CreateBranchRow:
		id = row.ID
		name = row.Name
		nameI18n = row.NameI18n
		address = row.Address
		phone = row.Phone
		createdAt = row.CreatedAt
		updatedAt = row.UpdatedAt
	case pg.GetBranchByIDRow:
		id = row.ID
		name = row.Name
		nameI18n = row.NameI18n
		address = row.Address
		phone = row.Phone
		createdAt = row.CreatedAt
		updatedAt = row.UpdatedAt
	case pg.GetAllBranchesRow:
		id = row.ID
		name = row.Name
		nameI18n = row.NameI18n
		address = row.Address
		phone = row.Phone
		createdAt = row.CreatedAt
		updatedAt = row.UpdatedAt
	case pg.GetBranchByIDWithLanguageRow:
		id = row.ID
		name = row.Name
		nameI18n = row.NameI18n
		address = row.Address
		phone = row.Phone
		createdAt = row.CreatedAt
		updatedAt = row.UpdatedAt
	case pg.GetAllBranchesWithLanguageRow:
		id = row.ID
		name = row.Name
		nameI18n = row.NameI18n
		address = row.Address
		phone = row.Phone
		createdAt = row.CreatedAt
		updatedAt = row.UpdatedAt
	case pg.SearchBranchesRow:
		id = row.ID
		name = row.Name
		nameI18n = row.NameI18n
		address = row.Address
		phone = row.Phone
		createdAt = row.CreatedAt
		updatedAt = row.UpdatedAt
	case pg.UpdateBranchRow:
		id = row.ID
		name = row.Name
		nameI18n = row.NameI18n
		address = row.Address
		phone = row.Phone
		createdAt = row.CreatedAt
		updatedAt = row.UpdatedAt
	default:
		return nil
	}

	if id == uuid.Nil {
		return nil
	}
	var nameI18nStr *string
	if nameI18n.Valid {
		uuidStr := uuid.UUID(nameI18n.Bytes).String()
		nameI18nStr = &uuidStr
	}

	var createdAtT *time.Time
	if createdAt.Valid {
		createdAtT = &createdAt.Time
	}

	var updatedAtT *time.Time
	if updatedAt.Valid {
		updatedAtT = &updatedAt.Time
	}

	return &model.BranchResponse{
		ID:        id.String(),
		Name:      &name,
		NameI18n:  nameI18nStr,
		Address:   address,
		Phone:     phone,
		CreatedAt: createdAtT,
		UpdatedAt: updatedAtT,
	}
}

// GetBranchByIDWithLang retrieves a branch by ID with language support
func (o *OrganizationS) GetBranchByIDWithLang(ctx context.Context, branchID string, lang string) (*model.BranchResponse, error) {
	id, err := uuid.Parse(branchID)
	if err != nil {
		return nil, fmt.Errorf("invalid branch ID: %w", err)
	}
	branch, err := o.repo.Tenant(ctx).GetBranchByIDWithLanguage(ctx, pg.GetBranchByIDWithLanguageParams{
		ID:      id,
		Column2: lang,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to get branch: %w", err)
	}
	return toBranchResponse(branch), nil
}

// GetAllBranchesWithLang retrieves all branches with language support
func (o *OrganizationS) GetAllBranchesWithLang(ctx context.Context, lang string, limit, offset int32) ([]model.BranchResponse, error) {
	branches, err := o.repo.Tenant(ctx).GetAllBranchesWithLanguage(ctx, pg.GetAllBranchesWithLanguageParams{
		Column1: lang,
		Limit:   limit,
		Offset:  offset,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to get branches: %w", err)
	}
	var responses []model.BranchResponse
	for _, b := range branches {
		responses = append(responses, *toBranchResponse(b))
	}
	return responses, nil
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
