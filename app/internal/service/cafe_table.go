package service

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
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

func normalizeCafeTableType(input *string, defaultToSimple bool) (string, error) {
	if input == nil || strings.TrimSpace(*input) == "" {
		if defaultToSimple {
			return string(model.TableTypeSimple), nil
		}
		return "", nil
	}

	v := strings.ToLower(strings.TrimSpace(*input))
	switch v {
	case string(model.TableTypeSimple), string(model.TableTypeTimeBased):
		return v, nil
	default:
		return "", fmt.Errorf("invalid table_type: must be simple or time_based")
	}
}

func (s *CafeTableS) CreateCafeTable(
	ctx context.Context,
	hallID string,
	number int32,
	capacity int32,
	status *string,
	posX, posY *float64,
	width, height *int32,
	rotation *int32,
	pricePerHour *int64,
	tableType *string,
	shape *string,
) (*model.CafeTableResponse, error) {
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
	if status != nil && strings.TrimSpace(*status) != "" {
		tableStatus = strings.TrimSpace(*status)
	}

	nullStatus := pg.NullTableStatus{
		TableStatus: pg.TableStatus(tableStatus),
		Valid:       true,
	}

	tableTypeValue, err := normalizeCafeTableType(tableType, true)
	if err != nil {
		return nil, err
	}

	if tableTypeValue == string(model.TableTypeTimeBased) {
		if pricePerHour == nil || *pricePerHour <= 0 {
			return nil, fmt.Errorf("price_per_hour is required and must be greater than 0 for time_based tables")
		}
	}

	shapeValue := "square"
	if shape != nil {
		shapeValue = strings.ToLower(strings.TrimSpace(*shape))
		if shapeValue != "circle" && shapeValue != "square" {
			return nil, fmt.Errorf("invalid shape: must be square or circle")
		}
	}

	finalPosX := 0.0
	if posX != nil {
		finalPosX = *posX
	}

	finalPosY := 0.0
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
		finalRotation = int32(*rotation)
	}

	var pph pgtype.Numeric
	if pricePerHour != nil {
		pph = intToNumeric(*pricePerHour)
	}

	table, err := s.repo.Tenant(ctx).CreateCafeTable(ctx, pg.CreateCafeTableParams{
		ID:           uuid.New(),
		HallID:       hID,
		Number:       number,
		Capacity:     capacity,
		Status:       nullStatus,
		TableType:    tableTypeValue,
		PosX:         finalPosX,
		PosY:         finalPosY,
		Shape:        shapeValue,
		Width:        finalWidth,
		Height:       finalHeight,
		Rotation:     finalRotation,
		PricePerHour: pph,
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

func (s *CafeTableS) GetAllCafeTables(ctx context.Context, filter model.CafeTableListFilter, limit, offset int32) ([]*model.CafeTableResponse, int64, error) {
	if filter.SortBy == "" {
		filter.SortBy = "created_at"
	}
	if filter.SortOrder == "" {
		filter.SortOrder = "desc"
	}

	hallUUID, err := parseOptionalUUID(filter.HallID)
	if err != nil {
		return nil, 0, fmt.Errorf("invalid hall_id: %w", err)
	}

	total, err := s.repo.Tenant(ctx).CountCafeTables(ctx, pg.CountCafeTablesParams{
		Search:    filter.Search,
		HallID:    hallUUID,
		Status:    filter.Status,
		TableType: filter.TableType,
	})
	if err != nil {
		return nil, 0, fmt.Errorf("failed to count cafe tables: %w", err)
	}

	rows, err := s.repo.Tenant(ctx).GetAllCafeTables(ctx, pg.GetAllCafeTablesParams{
		Search:    filter.Search,
		HallID:    hallUUID,
		Status:    filter.Status,
		TableType: filter.TableType,
		SortBy:    filter.SortBy,
		SortOrder: filter.SortOrder,
		Limit:     limit,
		Offset:    offset,
	})
	if err != nil {
		return nil, 0, fmt.Errorf("failed to retrieve cafe tables: %w", err)
	}

	resp := make([]*model.CafeTableResponse, 0, len(rows))
	for _, row := range rows {
		resp = append(resp, toCafeTableResponse(row))
	}

	return resp, total, nil
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
func (s *CafeTableS) UpdateCafeTable(
	ctx context.Context,
	tableID string,
	hallID *string,
	number *int32,
	capacity *int32,
	status *string,
	posX, posY *float64,
	width, height, rotation *int32,
	pricePerHour *string,
	tableType *string,
	shape *string,
) (*model.CafeTableResponse, error) {
	id, err := uuid.Parse(tableID)
	if err != nil {
		return nil, fmt.Errorf("invalid table ID: %w", err)
	}

	currentTable, err := s.repo.Tenant(ctx).GetCafeTableByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("failed to get cafe table: %w", err)
	}

	updatedHallID := currentTable.HallID
	if hallID != nil && strings.TrimSpace(*hallID) != "" {
		hID, err := uuid.Parse(strings.TrimSpace(*hallID))
		if err != nil {
			return nil, fmt.Errorf("invalid hall ID: %w", err)
		}
		updatedHallID = hID
	}

	updatedNumber := currentTable.Number
	if number != nil {
		if *number <= 0 {
			return nil, fmt.Errorf("table number must be greater than 0")
		}
		updatedNumber = *number
	}

	updatedCapacity := currentTable.Capacity
	if capacity != nil {
		if *capacity <= 0 {
			return nil, fmt.Errorf("capacity must be greater than 0")
		}
		updatedCapacity = *capacity
	}

	updatedStatus := currentTable.Status
	if status != nil && strings.TrimSpace(*status) != "" {
		updatedStatus = pg.NullTableStatus{
			TableStatus: pg.TableStatus(strings.TrimSpace(*status)),
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

	updatedPricePerHour := currentTable.PricePerHour
	if pricePerHour != nil {
		updatedPricePerHour = stringToNumeric(*pricePerHour)
	}

	updatedTableType := currentTable.TableType
	if tableType != nil {
		normalizedTableType, err := normalizeCafeTableType(tableType, false)
		if err != nil {
			return nil, err
		}
		if normalizedTableType != "" {
			updatedTableType = normalizedTableType
		}
	}

	updatedShape := currentTable.Shape
	if shape != nil {
		shapeValue := strings.ToLower(strings.TrimSpace(*shape))
		if shapeValue != "circle" && shapeValue != "square" {
			return nil, fmt.Errorf("invalid shape: must be square or circle")
		}
		updatedShape = shapeValue
	}

	table, err := s.repo.Tenant(ctx).UpdateCafeTable(ctx, pg.UpdateCafeTableParams{
		ID:           id,
		HallID:       updatedHallID,
		Number:       updatedNumber,
		Capacity:     updatedCapacity,
		Status:       updatedStatus,
		PosX:         updatedPosX,
		PosY:         updatedPosY,
		Shape:        updatedShape,
		Width:        updatedWidth,
		Height:       updatedHeight,
		Rotation:     updatedRotation,
		PricePerHour: updatedPricePerHour,
		TableType:    updatedTableType,
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

// Helper function to convert database model to response model
func toCafeTableResponse(table any) *model.CafeTableResponse {
	extract := func(
		id, hallID uuid.UUID,
		number, capacity int32,
		status pg.NullTableStatus,
		tableType string,
		posX, posY float64, width, height, rotation int32,
		pricePerHour pgtype.Numeric,
		createdAt, updatedAt pgtype.Timestamptz, shape string,
	) *model.CafeTableResponse {
		var ca, ua *time.Time
		if createdAt.Valid {
			ca = &createdAt.Time
		}
		if updatedAt.Valid {
			ua = &updatedAt.Time
		}

		s := model.TableStatusFree
		if status.Valid {
			s = model.TableStatus(status.TableStatus)
		}

		var pph *string
		if pricePerHour.Valid {
			v := numericToStr(pricePerHour)
			pph = &v
		}

		return &model.CafeTableResponse{
			ID:           id.String(),
			HallID:       hallID.String(),
			Number:       number,
			Capacity:     capacity,
			Status:       s,
			TableType:    tableType,
			PosX:         posX,
			PosY:         posY,
			Shape:        shape,
			Width:        width,
			Height:       height,
			Rotation:     rotation,
			PricePerHour: pph,
			CreatedAt:    ca,
			UpdatedAt:    ua,
		}
	}

	switch t := table.(type) {
	case pg.CafeTable:
		return extract(t.ID, t.HallID, t.Number, t.Capacity, t.Status, t.TableType, t.PosX, t.PosY, t.Width, t.Height, t.Rotation, t.PricePerHour, t.CreatedAt, t.UpdatedAt, t.Shape)

	case pg.CreateCafeTableRow:
		return extract(t.ID, t.HallID, t.Number, t.Capacity, t.Status, t.TableType, t.PosX, t.PosY, t.Width, t.Height, t.Rotation, t.PricePerHour, t.CreatedAt, t.UpdatedAt, t.Shape)

	case pg.GetCafeTableByIDRow:
		return extract(t.ID, t.HallID, t.Number, t.Capacity, t.Status, t.TableType, t.PosX, t.PosY, t.Width, t.Height, t.Rotation, t.PricePerHour, t.CreatedAt, t.UpdatedAt, t.Shape)

	case pg.GetCafeTableByNumberRow:
		return extract(t.ID, t.HallID, t.Number, t.Capacity, t.Status, t.TableType, t.PosX, t.PosY, t.Width, t.Height, t.Rotation, t.PricePerHour, t.CreatedAt, t.UpdatedAt, t.Shape)

	case pg.GetAllCafeTablesRow:
		return extract(t.ID, t.HallID, t.Number, t.Capacity, t.Status, t.TableType, t.PosX, t.PosY, t.Width, t.Height, t.Rotation, t.PricePerHour, t.CreatedAt, t.UpdatedAt, t.Shape)

	case pg.GetCafeTablesByHallIDRow:
		return extract(t.ID, t.HallID, t.Number, t.Capacity, t.Status, t.TableType, t.PosX, t.PosY, t.Width, t.Height, t.Rotation, t.PricePerHour, t.CreatedAt, t.UpdatedAt, t.Shape)

	case pg.GetCafeTablesByStatusRow:
		return extract(t.ID, t.HallID, t.Number, t.Capacity, t.Status, t.TableType, t.PosX, t.PosY, t.Width, t.Height, t.Rotation, t.PricePerHour, t.CreatedAt, t.UpdatedAt, t.Shape)

	case pg.GetCafeTablesByHallAndStatusRow:
		return extract(t.ID, t.HallID, t.Number, t.Capacity, t.Status, t.TableType, t.PosX, t.PosY, t.Width, t.Height, t.Rotation, t.PricePerHour, t.CreatedAt, t.UpdatedAt, t.Shape)

	case pg.GetAvailableTablesByHallRow:
		return extract(t.ID, t.HallID, t.Number, t.Capacity, t.Status, t.TableType, t.PosX, t.PosY, t.Width, t.Height, t.Rotation, t.PricePerHour, t.CreatedAt, t.UpdatedAt, t.Shape)

	case pg.GetAvailableTablesByCapacityRow:
		return extract(t.ID, t.HallID, t.Number, t.Capacity, t.Status, t.TableType, t.PosX, t.PosY, t.Width, t.Height, t.Rotation, t.PricePerHour, t.CreatedAt, t.UpdatedAt, t.Shape)

	case pg.GetAvailableTablesByHallAndCapacityRow:
		return extract(t.ID, t.HallID, t.Number, t.Capacity, t.Status, t.TableType, t.PosX, t.PosY, t.Width, t.Height, t.Rotation, t.PricePerHour, t.CreatedAt, t.UpdatedAt, t.Shape)

	case pg.UpdateCafeTableRow:
		return extract(t.ID, t.HallID, t.Number, t.Capacity, t.Status, t.TableType, t.PosX, t.PosY, t.Width, t.Height, t.Rotation, t.PricePerHour, t.CreatedAt, t.UpdatedAt, t.Shape)

	case pg.UpdateCafeTableStatusRow:
		return extract(t.ID, t.HallID, t.Number, t.Capacity, t.Status, t.TableType, t.PosX, t.PosY, t.Width, t.Height, t.Rotation, t.PricePerHour, t.CreatedAt, t.UpdatedAt, t.Shape)

	case pg.SetTableFreeRow:
		return extract(t.ID, t.HallID, t.Number, t.Capacity, t.Status, t.TableType, t.PosX, t.PosY, t.Width, t.Height, t.Rotation, t.PricePerHour, t.CreatedAt, t.UpdatedAt, t.Shape)

	case pg.SetTableBusyRow:
		return extract(t.ID, t.HallID, t.Number, t.Capacity, t.Status, t.TableType, t.PosX, t.PosY, t.Width, t.Height, t.Rotation, t.PricePerHour, t.CreatedAt, t.UpdatedAt, t.Shape)

	default:
		return nil
	}
}
