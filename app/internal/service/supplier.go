package service

import (
	"context"
	"fmt"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
	"gitlab.yurtal.tech/company/maryai/back/internal/model"
	"gitlab.yurtal.tech/company/maryai/back/internal/repository"
	pg "gitlab.yurtal.tech/company/maryai/back/internal/repository/pg/tenantsdb"
)

type SupplierS struct {
	repo *repository.Repository
}

func NewSupplierS(repo *repository.Repository) *SupplierS {
	return &SupplierS{
		repo: repo,
	}
}

// CreateSupplier creates a new supplier
func (s *SupplierS) CreateSupplier(ctx context.Context, req *model.CreateSupplierRequest) (*model.SupplierResponse, error) {
	id := uuid.New()

	params := pg.CreateSupplierParams{
		ID:          id,
		Name:        req.Name,
		PhoneNumber: req.PhoneNumber,
		Location:    req.Location,
	}

	supplier, err := s.repo.Tenant(ctx).CreateSupplier(ctx, params)
	if err != nil {
		return nil, fmt.Errorf("failed to create supplier: %w", err)
	}

	return toSupplierResponse(supplier), nil
}

// GetSupplierByID retrieves a supplier by ID
func (s *SupplierS) GetSupplierByID(ctx context.Context, id string) (*model.SupplierResponse, error) {
	supplierID, err := uuid.Parse(id)
	if err != nil {
		return nil, fmt.Errorf("invalid supplier id: %w", err)
	}

	supplier, err := s.repo.Tenant(ctx).GetSupplierByID(ctx, supplierID)
	if err != nil {
		return nil, fmt.Errorf("failed to get supplier: %w", err)
	}

	return toSupplierResponse(supplier), nil
}

// GetAllSuppliers retrieves all suppliers with pagination
func (s *SupplierS) GetAllSuppliers(ctx context.Context, limit, offset int32) ([]*model.SupplierResponse, error) {
	suppliers, err := s.repo.Tenant(ctx).GetAllSuppliers(ctx, pg.GetAllSuppliersParams{
		Limit:  limit,
		Offset: offset,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to get suppliers: %w", err)
	}

	var responses []*model.SupplierResponse
	for _, supplier := range suppliers {
		responses = append(responses, toSupplierResponse(supplier))
	}

	return responses, nil
}

// UpdateSupplier updates a supplier
func (s *SupplierS) UpdateSupplier(ctx context.Context, id string, req *model.UpdateSupplierRequest) (*model.SupplierResponse, error) {
	supplierID, err := uuid.Parse(id)
	if err != nil {
		return nil, fmt.Errorf("invalid supplier id: %w", err)
	}

	// Fetch current supplier
	supplier, err := s.repo.Tenant(ctx).GetSupplierByID(ctx, supplierID)
	if err != nil {
		return nil, fmt.Errorf("failed to get supplier: %w", err)
	}

	// Update only provided fields
	name := supplier.Name
	if req.Name != nil {
		name = *req.Name
	}

	phoneNumber := supplier.PhoneNumber
	if req.PhoneNumber != nil {
		phoneNumber = req.PhoneNumber
	}

	location := supplier.Location
	if req.Location != nil {
		location = req.Location
	}

	params := pg.UpdateSupplierParams{
		ID:          supplierID,
		Name:        name,
		PhoneNumber: phoneNumber,
		Location:    location,
	}

	updated, err := s.repo.Tenant(ctx).UpdateSupplier(ctx, params)
	if err != nil {
		return nil, fmt.Errorf("failed to update supplier: %w", err)
	}

	return toSupplierResponse(updated), nil
}

// DeleteSupplier soft-deletes a supplier
func (s *SupplierS) DeleteSupplier(ctx context.Context, id string) error {
	supplierID, err := uuid.Parse(id)
	if err != nil {
		return fmt.Errorf("invalid supplier id: %w", err)
	}

	err = s.repo.Tenant(ctx).DeleteSupplier(ctx, supplierID)
	if err != nil {
		return fmt.Errorf("failed to delete supplier: %w", err)
	}

	return nil
}

// RestoreSupplier restores a soft-deleted supplier
func (s *SupplierS) RestoreSupplier(ctx context.Context, id string) (*model.SupplierResponse, error) {
	supplierID, err := uuid.Parse(id)
	if err != nil {
		return nil, fmt.Errorf("invalid supplier id: %w", err)
	}

	supplier, err := s.repo.Tenant(ctx).RestoreSupplier(ctx, supplierID)
	if err != nil {
		return nil, fmt.Errorf("failed to restore supplier: %w", err)
	}

	return toSupplierResponse(supplier), nil
}

// SearchSuppliers searches suppliers by name
func (s *SupplierS) SearchSuppliers(ctx context.Context, query string, limit, offset int32) ([]*model.SupplierResponse, error) {
	suppliers, err := s.repo.Tenant(ctx).SearchSuppliers(ctx, pg.SearchSuppliersParams{
		Name:   "%" + query + "%",
		Limit:  limit,
		Offset: offset,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to search suppliers: %w", err)
	}

	var responses []*model.SupplierResponse
	for _, supplier := range suppliers {
		responses = append(responses, toSupplierResponse(supplier))
	}

	return responses, nil
}

// Helper function to convert pg.Supplier to model.SupplierResponse
func toSupplierResponse(supplier any) *model.SupplierResponse {
	var (
		id        uuid.UUID
		name      string
		phone     *string
		location  *string
		createdAt pgtype.Timestamptz
		updatedAt pgtype.Timestamptz
	)

	switch row := supplier.(type) {
	case pg.Supplier:
		id = row.ID
		name = row.Name
		phone = row.PhoneNumber
		location = row.Location
		createdAt = row.CreatedAt
		updatedAt = row.UpdatedAt
	default:
		return nil
	}

	response := &model.SupplierResponse{
		ID:          id.String(),
		Name:        name,
		PhoneNumber: phone,
		Location:    location,
	}

	if createdAt.Valid {
		response.CreatedAt = &createdAt.Time
	}

	if updatedAt.Valid {
		response.UpdatedAt = &updatedAt.Time
	}

	return response
}
