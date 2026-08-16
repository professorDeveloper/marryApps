package service

import (
	"context"
	"errors"
	"fmt"
	"net"
	"net/http"
	"strings"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"

	"gitlab.yurtal.tech/company/maryai/back/internal/model"
	"gitlab.yurtal.tech/company/maryai/back/internal/repository"
	pg "gitlab.yurtal.tech/company/maryai/back/internal/repository/pg/tenantsdb"
)

type SettingsS struct {
	repo *repository.Repository
}

func NewSettingsS(repo *repository.Repository) *SettingsS {
	return &SettingsS{
		repo: repo,
	}
}

func normalizePrinterIP(ip string) string {
	return strings.TrimSpace(ip)
}

func normalizeConnectedEntityIDs(ids []string) []string {
	if len(ids) == 0 {
		return []string{}
	}

	seen := make(map[string]struct{}, len(ids))
	result := make([]string, 0, len(ids))

	for _, id := range ids {
		id = strings.TrimSpace(id)
		if id == "" {
			continue
		}
		if _, ok := seen[id]; ok {
			continue
		}
		seen[id] = struct{}{}
		result = append(result, id)
	}

	return result
}

func normalizeConnectionType(v string) string {
	v = strings.TrimSpace(strings.ToLower(v))
	if v == "" {
		return string(model.PrinterConnectionTypeCable)
	}
	return v
}

func isValidPrinterConnectionType(v string) bool {
	switch v {
	case string(model.PrinterConnectionTypeCable), string(model.PrinterConnectionTypeWLAN):
		return true
	default:
		return false
	}
}

func isValidPrinterSettingType(t string) bool {
	switch t {
	case string(model.PrinterSettingTypeCategory), string(model.PrinterSettingTypeCloseCheck):
		return true
	default:
		return false
	}
}

func validateIP(ip string) bool {
	return net.ParseIP(ip) != nil
}

func isUniqueViolation(err error) bool {
	var pgErr *pgconn.PgError
	if errors.As(err, &pgErr) {
		return pgErr.Code == "23505"
	}
	return false
}
func mapCreatePrinterSettingRow(row pg.CreatePrinterSettingRow) *model.PrinterSettingResponse {
	connectedEntityIDs := make([]string, 0, len(row.ConnectedEntityIds))
	for _, id := range row.ConnectedEntityIds {
		connectedEntityIDs = append(connectedEntityIDs, id.String())
	}

	return &model.PrinterSettingResponse{
		ID:                 row.ID.String(),
		IP:                 row.Ip,
		Port:               row.Port,
		Type:               row.Type,
		ConnectionType:     row.ConnectionType,
		ConnectedEntityIDs: connectedEntityIDs,
		CreatedAt:          row.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
		UpdatedAt:          row.UpdatedAt.Format("2006-01-02T15:04:05Z07:00"),
	}
}

func mapListPrinterSettingsRow(row pg.ListPrinterSettingsRow) *model.PrinterSettingResponse {
	connectedEntityIDs := make([]string, 0, len(row.ConnectedEntityIds))
	for _, id := range row.ConnectedEntityIds {
		connectedEntityIDs = append(connectedEntityIDs, id.String())
	}

	return &model.PrinterSettingResponse{
		ID:                 row.ID.String(),
		IP:                 row.Ip,
		Port:               row.Port,
		Type:               row.Type,
		ConnectionType:     row.ConnectionType,
		ConnectedEntityIDs: connectedEntityIDs,
		CreatedAt:          row.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
		UpdatedAt:          row.UpdatedAt.Format("2006-01-02T15:04:05Z07:00"),
	}
}

func mapGetPrinterSettingByIDRow(row pg.GetPrinterSettingByIDRow) *model.PrinterSettingResponse {
	connectedEntityIDs := make([]string, 0, len(row.ConnectedEntityIds))
	for _, id := range row.ConnectedEntityIds {
		connectedEntityIDs = append(connectedEntityIDs, id.String())
	}

	return &model.PrinterSettingResponse{
		ID:                 row.ID.String(),
		IP:                 row.Ip,
		Port:               row.Port,
		Type:               row.Type,
		ConnectionType:     row.ConnectionType,
		ConnectedEntityIDs: connectedEntityIDs,
		CreatedAt:          row.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
		UpdatedAt:          row.UpdatedAt.Format("2006-01-02T15:04:05Z07:00"),
	}
}

func mapUpdatePrinterSettingRow(row pg.UpdatePrinterSettingRow) *model.PrinterSettingResponse {
	connectedEntityIDs := make([]string, 0, len(row.ConnectedEntityIds))
	for _, id := range row.ConnectedEntityIds {
		connectedEntityIDs = append(connectedEntityIDs, id.String())
	}

	return &model.PrinterSettingResponse{
		ID:                 row.ID.String(),
		IP:                 row.Ip,
		Port:               row.Port,
		Type:               row.Type,
		ConnectionType:     row.ConnectionType,
		ConnectedEntityIDs: connectedEntityIDs,
		CreatedAt:          row.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
		UpdatedAt:          row.UpdatedAt.Format("2006-01-02T15:04:05Z07:00"),
	}
}

// withTenantRead executes a read operation with tenant context.
// It manages transaction lifecycle, search_path setup, and tenant queries context.
// The transaction is always rolled back (read-only).
func (s *SettingsS) withTenantRead(ctx context.Context, brandID string, fn func(context.Context, *pg.Queries) error) error {
	brandID = strings.TrimSpace(brandID)
	if brandID == "" {
		return errors.New("brand_id is required")
	}

	schemaName := fmt.Sprintf("tenant_%s", brandID)

	tx, err := s.repo.PgRepo.TenantPool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	if _, err := tx.Exec(ctx, fmt.Sprintf(`SET LOCAL search_path TO "%s", public`, schemaName)); err != nil {
		return errors.New(http.StatusText(http.StatusUnauthorized))
	}

	// Set up tenant queries in context for repository contract
	q := pg.New(tx)
	tenantCtx := repository.WithTenantQueries(ctx, q)

	return fn(tenantCtx, q)
}

// withTenantWrite executes a write operation with tenant context.
// It manages transaction lifecycle, search_path setup, and tenant queries context.
// The transaction is committed if the callback succeeds, otherwise rolled back.
func (s *SettingsS) withTenantWrite(ctx context.Context, brandID string, fn func(context.Context, *pg.Queries) error) error {
	brandID = strings.TrimSpace(brandID)
	if brandID == "" {
		return errors.New("brand_id is required")
	}

	schemaName := fmt.Sprintf("tenant_%s", brandID)

	tx, err := s.repo.PgRepo.TenantPool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	if _, err := tx.Exec(ctx, fmt.Sprintf(`SET LOCAL search_path TO "%s", public`, schemaName)); err != nil {
		return errors.New(http.StatusText(http.StatusUnauthorized))
	}

	// Set up tenant queries and transaction in context for repository contract
	q := pg.New(tx)
	tenantCtx := repository.WithTenantQueries(ctx, q)
	tenantCtx = repository.WithTenantTx(tenantCtx, tx)

	if err := fn(tenantCtx, q); err != nil {
		return err
	}

	return tx.Commit(ctx)
}

func (s *SettingsS) CreatePrinterSetting(ctx context.Context, brandID string, req model.CreatePrinterSettingRequest) (*model.PrinterSettingResponse, error) {
	brandID = strings.TrimSpace(brandID)
	req.IP = normalizePrinterIP(req.IP)
	req.Type = strings.TrimSpace(req.Type)
	req.ConnectionType = normalizeConnectionType(req.ConnectionType)
	req.ConnectedEntityIDs = normalizeConnectedEntityIDs(req.ConnectedEntityIDs)

	if brandID == "" {
		return nil, errors.New("brand_id is required")
	}
	if req.IP == "" {
		return nil, errors.New("ip is required")
	}
	if !validateIP(req.IP) {
		return nil, errors.New("invalid ip format")
	}
	if req.Port <= 0 || req.Port > 65535 {
		return nil, errors.New("port must be between 1 and 65535")
	}
	if req.Type == "" {
		return nil, errors.New("type is required")
	}
	if !isValidPrinterConnectionType(req.ConnectionType) {
		return nil, errors.New("connection_type must be one of: cable, wlan")
	}
	if !isValidPrinterSettingType(req.Type) {
		return nil, errors.New("type must be one of: category, close_check")
	}

	connectedEntityIDs := make([]string, 0, len(req.ConnectedEntityIDs))
	for i, id := range req.ConnectedEntityIDs {
		parsedID, err := uuid.Parse(id)
		if err != nil {
			return nil, fmt.Errorf("invalid connected_entity_ids[%d]: %w", i, err)
		}
		connectedEntityIDs = append(connectedEntityIDs, parsedID.String())
	}

	var result pg.CreatePrinterSettingRow
	err := s.withTenantWrite(ctx, brandID, func(tenantCtx context.Context, q *pg.Queries) error {
		if req.Type == string(model.PrinterSettingTypeCategory) && len(connectedEntityIDs) > 0 {
			count, err := q.CountCategoriesByIDs(tenantCtx, connectedEntityIDs)
			if err != nil {
				return err
			}
			if count != int64(len(connectedEntityIDs)) {
				return errors.New("one or more connected_entity_ids are invalid categories for current tenant")
			}
		}

		row, err := q.CreatePrinterSetting(tenantCtx, pg.CreatePrinterSettingParams{
			Ip:                 req.IP,
			Port:               req.Port,
			Type:               req.Type,
			ConnectionType:     req.ConnectionType,
			ConnectedEntityIds: connectedEntityIDs,
		})
		if err != nil {
			if isUniqueViolation(err) {
				return errors.New("printer setting with this ip, port and type already exists")
			}
			return err
		}
		result = row
		return nil
	})

	if err != nil {
		return nil, err
	}

	return mapCreatePrinterSettingRow(result), nil
}
func (s *SettingsS) ListPrinterSettings(ctx context.Context, brandID string) ([]model.PrinterSettingResponse, error) {
	var rows []pg.ListPrinterSettingsRow
	err := s.withTenantRead(ctx, brandID, func(tenantCtx context.Context, q *pg.Queries) error {
		var err error
		rows, err = q.ListPrinterSettings(tenantCtx)
		return err
	})

	if err != nil {
		return nil, err
	}

	resp := make([]model.PrinterSettingResponse, 0, len(rows))
	for _, row := range rows {
		resp = append(resp, *mapListPrinterSettingsRow(row))
	}

	return resp, nil
}

func (s *SettingsS) GetPrinterSettingByID(ctx context.Context, brandID, id string) (*model.PrinterSettingResponse, error) {
	brandID = strings.TrimSpace(brandID)
	id = strings.TrimSpace(id)

	if brandID == "" {
		return nil, errors.New("brand_id is required")
	}
	if id == "" {
		return nil, errors.New("id is required")
	}

	printerID, err := uuid.Parse(id)
	if err != nil {
		return nil, errors.New("invalid printer setting id")
	}

	var result pg.GetPrinterSettingByIDRow
	err = s.withTenantRead(ctx, brandID, func(tenantCtx context.Context, q *pg.Queries) error {
		var err error
		result, err = q.GetPrinterSettingByID(tenantCtx, printerID)
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				return errors.New("printer setting not found")
			}
			return err
		}
		return nil
	})

	if err != nil {
		return nil, err
	}

	return mapGetPrinterSettingByIDRow(result), nil
}

func (s *SettingsS) UpdatePrinterSetting(ctx context.Context, brandID, id string, req model.UpdatePrinterSettingRequest) (*model.PrinterSettingResponse, error) {
	brandID = strings.TrimSpace(brandID)
	id = strings.TrimSpace(id)

	req.IP = normalizePrinterIP(req.IP)
	req.Type = strings.TrimSpace(req.Type)
	req.ConnectionType = normalizeConnectionType(req.ConnectionType)
	req.ConnectedEntityIDs = normalizeConnectedEntityIDs(req.ConnectedEntityIDs)

	if brandID == "" {
		return nil, errors.New("brand_id is required")
	}
	if id == "" {
		return nil, errors.New("id is required")
	}

	printerID, err := uuid.Parse(id)
	if err != nil {
		return nil, errors.New("invalid printer setting id")
	}

	if req.IP == "" {
		return nil, errors.New("ip is required")
	}
	if !validateIP(req.IP) {
		return nil, errors.New("invalid ip format")
	}
	if req.Port <= 0 || req.Port > 65535 {
		return nil, errors.New("port must be between 1 and 65535")
	}
	if req.Type == "" {
		return nil, errors.New("type is required")
	}
	if !isValidPrinterConnectionType(req.ConnectionType) {
		return nil, errors.New("connection_type must be one of: cable, wlan")
	}
	if !isValidPrinterSettingType(req.Type) {
		return nil, errors.New("type must be one of: category, close_check")
	}

	connectedEntityIDs := make([]string, 0, len(req.ConnectedEntityIDs))
	for i, id := range req.ConnectedEntityIDs {
		parsedID, err := uuid.Parse(id)
		if err != nil {
			return nil, fmt.Errorf("invalid connected_entity_ids[%d]: %w", i, err)
		}
		connectedEntityIDs = append(connectedEntityIDs, parsedID.String())
	}

	var result pg.UpdatePrinterSettingRow
	err = s.withTenantWrite(ctx, brandID, func(tenantCtx context.Context, q *pg.Queries) error {
		if req.Type == string(model.PrinterSettingTypeCategory) && len(connectedEntityIDs) > 0 {
			count, err := q.CountCategoriesByIDs(tenantCtx, connectedEntityIDs)
			if err != nil {
				return err
			}
			if count != int64(len(connectedEntityIDs)) {
				return errors.New("one or more connected_entity_ids are invalid categories")
			}
		}

		row, err := q.UpdatePrinterSetting(tenantCtx, pg.UpdatePrinterSettingParams{
			ID:                 printerID,
			Ip:                 req.IP,
			Port:               req.Port,
			Type:               req.Type,
			ConnectionType:     req.ConnectionType,
			ConnectedEntityIds: connectedEntityIDs,
		})
		if err != nil {
			if isUniqueViolation(err) {
				return errors.New("printer setting with this ip, port and type already exists")
			}
			return err
		}
		result = row
		return nil
	})

	if err != nil {
		return nil, err
	}

	return mapUpdatePrinterSettingRow(result), nil
}

func (s *SettingsS) DeletePrinterSetting(ctx context.Context, brandID, id string) error {
	brandID = strings.TrimSpace(brandID)
	id = strings.TrimSpace(id)

	if brandID == "" {
		return errors.New("brand_id is required")
	}
	if id == "" {
		return errors.New("id is required")
	}

	printerID, err := uuid.Parse(id)
	if err != nil {
		return errors.New("invalid printer setting id")
	}

	err = s.withTenantWrite(ctx, brandID, func(tenantCtx context.Context, q *pg.Queries) error {
		rowsAffected, err := q.DeletePrinterSetting(tenantCtx, printerID)
		if err != nil {
			return err
		}
		if rowsAffected == 0 {
			return errors.New("printer setting not found")
		}
		return nil
	})

	return err
}
