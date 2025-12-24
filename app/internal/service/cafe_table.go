package service

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"gitlab.yurtal.tech/company/maryai/back/internal/model"
	"gitlab.yurtal.tech/company/maryai/back/internal/repository"
	"gitlab.yurtal.tech/company/maryai/back/internal/repository/pg"
)

type CafeTableS struct {
	repo *repository.Repository
}

func NewCafeTableS(repo *repository.Repository) *CafeTableS {
	return &CafeTableS{repo: repo}
}

// CreateCafeTable creates a new cafe table
func (s *CafeTableS) CreateCafeTable(ctx context.Context, hallID string, number int32, capacity int32, status *string) (*model.CafeTableResponse, error) {
	if hallID == "" {
		return nil, fmt.Errorf("hall_id is required")
	}
	if number <= 0 {
		return nil, fmt.Errorf("table number must be greater than 0")
	}
	if capacity <= 0 {
		return nil, fmt.Errorf("capacity must be greater than 0")
	}

	hID, err := uuid.Parse(hallID)
	if err != nil {
		return nil, fmt.Errorf("invalid hall ID: %w", err)
	}

	tableStatus := "free"
	if status != nil && *status != "" {
		tableStatus = *status
	}

	nullStatus := pg.NullTableStatus{
		TableStatus: pg.TableStatus(tableStatus),
		Valid:       true,
	}

	table, err := s.repo.PgRepo.Repo.CreateCafeTable(ctx, pg.CreateCafeTableParams{
		ID:       uuid.New(),
		HallID:   hID,
		Number:   number,
		Capacity: capacity,
		Status:   nullStatus,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to create cafe table: %w", err)
	}

	return toCafeTableResponse(table), nil
}

// GetCafeTableByID retrieves a cafe table by ID
func (s *CafeTableS) GetCafeTableByID(ctx context.Context, tableID string) (*model.CafeTableResponse, error) {
	id, err := uuid.Parse(tableID)
	if err != nil {
		return nil, fmt.Errorf("invalid table ID: %w", err)
	}

	table, err := s.repo.PgRepo.Repo.GetCafeTableByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("failed to get cafe table: %w", err)
	}

	return toCafeTableResponse(table), nil
}

// GetAllCafeTables retrieves all cafe tables with pagination
func (s *CafeTableS) GetAllCafeTables(ctx context.Context, limit, offset int32) ([]model.CafeTableResponse, error) {
	tables, err := s.repo.PgRepo.Repo.GetAllCafeTables(ctx, pg.GetAllCafeTablesParams{
		Limit:  limit,
		Offset: offset,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to get cafe tables: %w", err)
	}

	var responses []model.CafeTableResponse
	for _, t := range tables {
		responses = append(responses, *toCafeTableResponse(t))
	}

	return responses, nil
}

// GetCafeTablesByHallID retrieves all tables in a specific hall with pagination
func (s *CafeTableS) GetCafeTablesByHallID(ctx context.Context, hallID string, limit, offset int32) ([]model.CafeTableResponse, error) {
	hID, err := uuid.Parse(hallID)
	if err != nil {
		return nil, fmt.Errorf("invalid hall ID: %w", err)
	}

	tables, err := s.repo.PgRepo.Repo.GetCafeTablesByHallID(ctx, hID)
	if err != nil {
		return nil, fmt.Errorf("failed to get cafe tables by hall: %w", err)
	}

	// Apply pagination manually since SQLC doesn't support it for this method
	start := offset
	end := offset + limit
	if int32(len(tables)) < start {
		return []model.CafeTableResponse{}, nil
	}
	if int32(len(tables)) < end {
		end = int32(len(tables))
	}

	var responses []model.CafeTableResponse
	for _, t := range tables[start:end] {
		responses = append(responses, *toCafeTableResponse(t))
	}

	return responses, nil
}

// GetCafeTablesByStatus retrieves tables with a specific status
func (s *CafeTableS) GetCafeTablesByStatus(ctx context.Context, status string, limit, offset int32) ([]model.CafeTableResponse, error) {
	if status == "" {
		return nil, fmt.Errorf("status is required")
	}

	nullStatus := pg.NullTableStatus{
		TableStatus: pg.TableStatus(status),
		Valid:       true,
	}

	tables, err := s.repo.PgRepo.Repo.GetCafeTablesByStatus(ctx, pg.GetCafeTablesByStatusParams{
		Status: nullStatus,
		Limit:  limit,
		Offset: offset,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to get cafe tables by status: %w", err)
	}

	var responses []model.CafeTableResponse
	for _, t := range tables {
		responses = append(responses, *toCafeTableResponse(t))
	}

	return responses, nil
}

// GetCafeTablesByHallAndStatus retrieves tables by hall and status
func (s *CafeTableS) GetCafeTablesByHallAndStatus(ctx context.Context, hallID, status string) ([]model.CafeTableResponse, error) {
	hID, err := uuid.Parse(hallID)
	if err != nil {
		return nil, fmt.Errorf("invalid hall ID: %w", err)
	}

	nullStatus := pg.NullTableStatus{
		TableStatus: pg.TableStatus(status),
		Valid:       true,
	}

	tables, err := s.repo.PgRepo.Repo.GetCafeTablesByHallAndStatus(ctx, pg.GetCafeTablesByHallAndStatusParams{
		HallID: hID,
		Status: nullStatus,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to get cafe tables: %w", err)
	}

	var responses []model.CafeTableResponse
	for _, t := range tables {
		responses = append(responses, *toCafeTableResponse(t))
	}

	return responses, nil
}

// GetAvailableTablesByHall retrieves available tables in a specific hall
func (s *CafeTableS) GetAvailableTablesByHall(ctx context.Context, hallID string) ([]model.CafeTableResponse, error) {
	hID, err := uuid.Parse(hallID)
	if err != nil {
		return nil, fmt.Errorf("invalid hall ID: %w", err)
	}

	tables, err := s.repo.PgRepo.Repo.GetAvailableTablesByHall(ctx, hID)
	if err != nil {
		return nil, fmt.Errorf("failed to get available tables: %w", err)
	}

	var responses []model.CafeTableResponse
	for _, t := range tables {
		responses = append(responses, *toCafeTableResponse(t))
	}

	return responses, nil
}

// GetAvailableTablesByCapacity retrieves available tables with required capacity
func (s *CafeTableS) GetAvailableTablesByCapacity(ctx context.Context, capacity, limit, offset int32) ([]model.CafeTableResponse, error) {
	if capacity <= 0 {
		return nil, fmt.Errorf("capacity must be greater than 0")
	}

	tables, err := s.repo.PgRepo.Repo.GetAvailableTablesByCapacity(ctx, pg.GetAvailableTablesByCapacityParams{
		Capacity: capacity,
		Limit:    limit,
		Offset:   offset,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to get available tables: %w", err)
	}

	var responses []model.CafeTableResponse
	for _, t := range tables {
		responses = append(responses, *toCafeTableResponse(t))
	}

	return responses, nil
}

// GetAvailableTablesByHallAndCapacity retrieves available tables by hall and capacity
func (s *CafeTableS) GetAvailableTablesByHallAndCapacity(ctx context.Context, hallID string, capacity int32) ([]model.CafeTableResponse, error) {
	hID, err := uuid.Parse(hallID)
	if err != nil {
		return nil, fmt.Errorf("invalid hall ID: %w", err)
	}

	tables, err := s.repo.PgRepo.Repo.GetAvailableTablesByHallAndCapacity(ctx, pg.GetAvailableTablesByHallAndCapacityParams{
		HallID:   hID,
		Capacity: capacity,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to get available tables: %w", err)
	}

	var responses []model.CafeTableResponse
	for _, t := range tables {
		responses = append(responses, *toCafeTableResponse(t))
	}

	return responses, nil
}

// UpdateCafeTable updates a cafe table
func (s *CafeTableS) UpdateCafeTable(ctx context.Context, tableID string, hallID *string, number *int32, capacity *int32, status *string) (*model.CafeTableResponse, error) {
	id, err := uuid.Parse(tableID)
	if err != nil {
		return nil, fmt.Errorf("invalid table ID: %w", err)
	}

	// Get current table to use as defaults
	currentTable, err := s.repo.PgRepo.Repo.GetCafeTableByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("failed to get cafe table: %w", err)
	}

	updatedHallID := currentTable.HallID
	if hallID != nil && *hallID != "" {
		hID, err := uuid.Parse(*hallID)
		if err != nil {
			return nil, fmt.Errorf("invalid hall ID: %w", err)
		}
		updatedHallID = hID
	}

	updatedNumber := currentTable.Number
	if number != nil && *number > 0 {
		updatedNumber = *number
	}

	updatedCapacity := currentTable.Capacity
	if capacity != nil && *capacity > 0 {
		updatedCapacity = *capacity
	}

	updatedStatus := currentTable.Status
	if status != nil && *status != "" {
		updatedStatus = pg.NullTableStatus{
			TableStatus: pg.TableStatus(*status),
			Valid:       true,
		}
	}

	table, err := s.repo.PgRepo.Repo.UpdateCafeTable(ctx, pg.UpdateCafeTableParams{
		ID:       id,
		HallID:   updatedHallID,
		Number:   updatedNumber,
		Capacity: updatedCapacity,
		Status:   updatedStatus,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to update cafe table: %w", err)
	}

	return toCafeTableResponse(table), nil
}

// UpdateCafeTableStatus updates only the status of a cafe table
func (s *CafeTableS) UpdateCafeTableStatus(ctx context.Context, tableID string, status string) (*model.CafeTableResponse, error) {
	if status == "" {
		return nil, fmt.Errorf("status is required")
	}

	id, err := uuid.Parse(tableID)
	if err != nil {
		return nil, fmt.Errorf("invalid table ID: %w", err)
	}

	nullStatus := pg.NullTableStatus{
		TableStatus: pg.TableStatus(status),
		Valid:       true,
	}

	table, err := s.repo.PgRepo.Repo.UpdateCafeTableStatus(ctx, pg.UpdateCafeTableStatusParams{
		ID:     id,
		Status: nullStatus,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to update cafe table status: %w", err)
	}

	return toCafeTableResponse(table), nil
}

// SetTableFree marks a table as free
func (s *CafeTableS) SetTableFree(ctx context.Context, tableID string) (*model.CafeTableResponse, error) {
	id, err := uuid.Parse(tableID)
	if err != nil {
		return nil, fmt.Errorf("invalid table ID: %w", err)
	}

	table, err := s.repo.PgRepo.Repo.SetTableFree(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("failed to set table free: %w", err)
	}

	return toCafeTableResponse(table), nil
}

// SetTableBusy marks a table as busy
func (s *CafeTableS) SetTableBusy(ctx context.Context, tableID string) (*model.CafeTableResponse, error) {
	id, err := uuid.Parse(tableID)
	if err != nil {
		return nil, fmt.Errorf("invalid table ID: %w", err)
	}

	table, err := s.repo.PgRepo.Repo.SetTableBusy(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("failed to set table busy: %w", err)
	}

	return toCafeTableResponse(table), nil
}

// DeleteCafeTable soft deletes a cafe table
func (s *CafeTableS) DeleteCafeTable(ctx context.Context, tableID string) error {
	id, err := uuid.Parse(tableID)
	if err != nil {
		return fmt.Errorf("invalid table ID: %w", err)
	}

	if err := s.repo.PgRepo.Repo.DeleteCafeTable(ctx, id); err != nil {
		return fmt.Errorf("failed to delete cafe table: %w", err)
	}

	return nil
}

// RestoreCafeTable restores a soft deleted cafe table
func (s *CafeTableS) RestoreCafeTable(ctx context.Context, tableID string) error {
	id, err := uuid.Parse(tableID)
	if err != nil {
		return fmt.Errorf("invalid table ID: %w", err)
	}

	if err := s.repo.PgRepo.Repo.RestoreCafeTable(ctx, id); err != nil {
		return fmt.Errorf("failed to restore cafe table: %w", err)
	}

	return nil
}

// GetTableOccupancyStats returns occupancy statistics for all tables
func (s *CafeTableS) GetTableOccupancyStats(ctx context.Context) (*model.TableOccupancyStats, error) {
	stats, err := s.repo.PgRepo.Repo.GetTableOccupancyStats(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to get occupancy stats: %w", err)
	}

	return &model.TableOccupancyStats{
		TotalTables:    stats.TotalTables,
		FreeTables:     stats.FreeTables,
		BusyTables:     stats.BusyTables,
		FreePercentage: stats.FreePercentage,
		BusyPercentage: stats.BusyPercentage,
		TotalCapacity:  stats.TotalCapacity,
		AvailableSeats: stats.AvailableSeats,
	}, nil
}

// SearchCafeTables searches for cafe tables by query
func (s *CafeTableS) SearchCafeTables(ctx context.Context, query string, limit, offset int32) ([]model.CafeTableResponse, error) {
	// Get all tables and filter by number/hall
	tables, err := s.repo.PgRepo.Repo.GetAllCafeTables(ctx, pg.GetAllCafeTablesParams{
		Limit:  9999, // Get all tables
		Offset: 0,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to search cafe tables: %w", err)
	}

	// Filter tables based on query (table number or other criteria)
	var filtered []pg.CafeTable
	for _, t := range tables {
		// Simple search by table number
		if fmt.Sprintf("%d", t.Number) == query || query == "" {
			filtered = append(filtered, t)
		}
	}

	// Apply pagination
	start := offset
	end := offset + limit
	if int32(len(filtered)) < start {
		return []model.CafeTableResponse{}, nil
	}
	if int32(len(filtered)) < end {
		end = int32(len(filtered))
	}

	var responses []model.CafeTableResponse
	for _, t := range filtered[start:end] {
		responses = append(responses, *toCafeTableResponse(t))
	}

	return responses, nil
}

// Helper function to convert database model to response model
func toCafeTableResponse(table pg.CafeTable) *model.CafeTableResponse {
	var createdAt *time.Time
	if table.CreatedAt.Valid {
		createdAt = &table.CreatedAt.Time
	}

	var updatedAt *time.Time
	if table.UpdatedAt.Valid {
		updatedAt = &table.UpdatedAt.Time
	}

	status := model.TableStatusFree
	if table.Status.Valid {
		status = model.TableStatus(table.Status.TableStatus)
	}

	return &model.CafeTableResponse{
		ID:        table.ID.String(),
		HallID:    table.HallID.String(),
		Number:    table.Number,
		Capacity:  table.Capacity,
		Status:    status,
		CreatedAt: createdAt,
		UpdatedAt: updatedAt,
	}
}
