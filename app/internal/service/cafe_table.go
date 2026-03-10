package service

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"gitlab.yurtal.tech/company/maryai/back/internal/model"
	"gitlab.yurtal.tech/company/maryai/back/internal/repository"
	pg "gitlab.yurtal.tech/company/maryai/back/internal/repository/pg/tenantsdb"
)

type CafeTableS struct {
	repo *repository.Repository
}

func NewCafeTableS(repo *repository.Repository) *CafeTableS {
	return &CafeTableS{repo: repo}
}

func (s *CafeTableS) CreateCafeTable(ctx context.Context, hallID string, number int32, capacity int32, status *string, posX, posY, width, height, rotation *int32) (*model.CafeTableResponse, error) {
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

	finalPosX := int32(0)
	if posX != nil {
		finalPosX = *posX
	}
	finalPosY := int32(0)
	if posY != nil {
		finalPosY = *posY
	}
	finalWidth := int32(0)
	if width != nil {
		finalWidth = *width
	}
	finalHeight := int32(0)
	if height != nil {
		finalHeight = *height
	}
	finalRotation := int32(0)
	if rotation != nil {
		finalRotation = *rotation
	}

	table, err := s.repo.Tenant(ctx).CreateCafeTable(ctx, pg.CreateCafeTableParams{
		ID:       uuid.New(),
		HallID:   hID,
		Number:   number,
		Capacity: capacity,
		Status:   nullStatus,
		PosX:     finalPosX,
		PosY:     finalPosY,
		Width:    finalWidth,
		Height:   finalHeight,
		Rotation: finalRotation,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to create cafe table: %w", err)
	}

	return toCafeTableResponse(table), nil
}

func (s *CafeTableS) GetCafeTableByID(ctx context.Context, tableID string) (*model.CafeTableResponse, error) {
	id, err := uuid.Parse(tableID)
	if err != nil {
		return nil, fmt.Errorf("invalid table ID: %w", err)
	}

	table, err := s.repo.Tenant(ctx).GetCafeTableByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("failed to get cafe table: %w", err)
	}

	return toCafeTableResponse(table), nil
}

// GetAllCafeTables retrieves all cafe tables with pagination
func (s *CafeTableS) GetAllCafeTables(ctx context.Context, limit, offset int32) ([]model.CafeTableResponse, int64, error) {
	total, err := s.repo.Tenant(ctx).CountCafeTables(ctx)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to count cafe tables: %w", err)
	}

	tables, err := s.repo.Tenant(ctx).GetAllCafeTables(ctx, pg.GetAllCafeTablesParams{
		Limit:  limit,
		Offset: offset,
	})
	if err != nil {
		return nil, 0, fmt.Errorf("failed to get cafe tables: %w", err)
	}

	var responses []model.CafeTableResponse
	for _, t := range tables {
		responses = append(responses, *toCafeTableResponse(t))
	}

	return responses, total, nil
}

func (s *CafeTableS) GetCafeTablesByHallID(ctx context.Context, hallID string, limit, offset int32) ([]model.CafeTableResponse, int64, error) {
	hID, err := uuid.Parse(hallID)
	if err != nil {
		return nil, 0, fmt.Errorf("invalid hall ID: %w", err)
	}

	total, err := s.repo.Tenant(ctx).CountCafeTablesByHall(ctx, hID)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to count cafe tables by hall: %w", err)
	}

	tables, err := s.repo.Tenant(ctx).GetCafeTablesByHallID(ctx, hID)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to get cafe tables by hall: %w", err)
	}

	start := offset
	end := offset + limit
	if int32(len(tables)) < start {
		return []model.CafeTableResponse{}, total, nil
	}
	if int32(len(tables)) < end {
		end = int32(len(tables))
	}

	var responses []model.CafeTableResponse
	for _, t := range tables[start:end] {
		responses = append(responses, *toCafeTableResponse(t))
	}

	return responses, total, nil
}

// GetCafeTablesByStatus retrieves tables with a specific status
func (s *CafeTableS) GetCafeTablesByStatus(ctx context.Context, status string, limit, offset int32) ([]model.CafeTableResponse, int64, error) {
	if status == "" {
		return nil, 0, fmt.Errorf("status is required")
	}

	nullStatus := pg.NullTableStatus{
		TableStatus: pg.TableStatus(status),
		Valid:       true,
	}

	total, err := s.repo.Tenant(ctx).CountCafeTablesByStatus(ctx, nullStatus)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to count cafe tables by status: %w", err)
	}

	tables, err := s.repo.Tenant(ctx).GetCafeTablesByStatus(ctx, pg.GetCafeTablesByStatusParams{
		Status: nullStatus,
		Limit:  limit,
		Offset: offset,
	})
	if err != nil {
		return nil, 0, fmt.Errorf("failed to get cafe tables by status: %w", err)
	}

	var responses []model.CafeTableResponse
	for _, t := range tables {
		responses = append(responses, *toCafeTableResponse(t))
	}

	return responses, total, nil
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

	tables, err := s.repo.Tenant(ctx).GetCafeTablesByHallAndStatus(ctx, pg.GetCafeTablesByHallAndStatusParams{
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

	tables, err := s.repo.Tenant(ctx).GetAvailableTablesByHall(ctx, hID)
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

	tables, err := s.repo.Tenant(ctx).GetAvailableTablesByCapacity(ctx, pg.GetAvailableTablesByCapacityParams{
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

	tables, err := s.repo.Tenant(ctx).GetAvailableTablesByHallAndCapacity(ctx, pg.GetAvailableTablesByHallAndCapacityParams{
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
func (s *CafeTableS) UpdateCafeTable(ctx context.Context, tableID string, hallID *string, number *int32, capacity *int32, status *string, posX, posY, width, height, rotation *int32) (*model.CafeTableResponse, error) {
	id, err := uuid.Parse(tableID)
	if err != nil {
		return nil, fmt.Errorf("invalid table ID: %w", err)
	}

	// Get current table to use as defaults
	currentTable, err := s.repo.Tenant(ctx).GetCafeTableByID(ctx, id)
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

	updatedPosX := currentTable.PosX
	if posX != nil {
		updatedPosX = *posX
	}
	updatedPosY := currentTable.PosY
	if posY != nil {
		updatedPosY = *posY
	}
	updatedWidth := currentTable.Width
	if width != nil {
		updatedWidth = *width
	}
	updatedHeight := currentTable.Height
	if height != nil {
		updatedHeight = *height
	}
	updatedRotation := currentTable.Rotation
	if rotation != nil {
		updatedRotation = *rotation
	}

	table, err := s.repo.Tenant(ctx).UpdateCafeTable(ctx, pg.UpdateCafeTableParams{
		ID:       id,
		HallID:   updatedHallID,
		Number:   updatedNumber,
		Capacity: updatedCapacity,
		Status:   updatedStatus,
		PosX:     updatedPosX,
		PosY:     updatedPosY,
		Width:    updatedWidth,
		Height:   updatedHeight,
		Rotation: updatedRotation,
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

	table, err := s.repo.Tenant(ctx).UpdateCafeTableStatus(ctx, pg.UpdateCafeTableStatusParams{
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

	table, err := s.repo.Tenant(ctx).SetTableFree(ctx, id)
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

	table, err := s.repo.Tenant(ctx).SetTableBusy(ctx, id)
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

	if err := s.repo.Tenant(ctx).DeleteCafeTable(ctx, id); err != nil {
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

	if err := s.repo.Tenant(ctx).RestoreCafeTable(ctx, id); err != nil {
		return fmt.Errorf("failed to restore cafe table: %w", err)
	}

	return nil
}

// GetTableOccupancyStats returns occupancy statistics for all tables
func (s *CafeTableS) GetTableOccupancyStats(ctx context.Context) (*model.TableOccupancyStats, error) {
	stats, err := s.repo.Tenant(ctx).GetTableOccupancyStats(ctx)
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
	tables, err := s.repo.Tenant(ctx).GetAllCafeTables(ctx, pg.GetAllCafeTablesParams{
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
		PosX:      table.PosX,
		PosY:      table.PosY,
		Width:     table.Width,
		Height:    table.Height,
		Rotation:  table.Rotation,
		CreatedAt: createdAt,
		UpdatedAt: updatedAt,
	}
}
