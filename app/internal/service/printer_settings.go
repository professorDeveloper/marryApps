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

func mapPrinterSettingResponse(row pg.PrinterSetting) *model.PrinterSettingResponse {
	connectedEntityIDs := make([]string, 0, len(row.ConnectedEntityIds))
	for _, id := range row.ConnectedEntityIds {
		connectedEntityIDs = append(connectedEntityIDs, id.String())
	}

	return &model.PrinterSettingResponse{
		ID:                 row.ID.String(),
		IP:                 row.Ip,
		Port:               row.Port,
		Type:               row.Type,
		ConnectedEntityIDs: connectedEntityIDs,
		CreatedAt:          row.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
		UpdatedAt:          row.UpdatedAt.Format("2006-01-02T15:04:05Z07:00"),
	}
}

func (s *SettingsS) CreatePrinterSetting(ctx context.Context, brandID string, req model.CreatePrinterSettingRequest) (*model.PrinterSettingResponse, error) {
	brandID = strings.TrimSpace(brandID)
	req.IP = normalizePrinterIP(req.IP)
	req.Type = strings.TrimSpace(req.Type)
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

	schemaName := fmt.Sprintf("tenant_%s", brandID)

	tx, err := s.repo.PgRepo.TenantPool.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(ctx)

	if _, err := tx.Exec(ctx, fmt.Sprintf(`SET LOCAL search_path TO "%s", public`, schemaName)); err != nil {
		return nil, errors.New(http.StatusText(http.StatusUnauthorized))
	}

	q := s.repo.Tenant(ctx).WithTx(tx)

	if req.Type == string(model.PrinterSettingTypeCategory) && len(connectedEntityIDs) > 0 {
		count, err := q.CountCategoriesByIDs(ctx, connectedEntityIDs)
		if err != nil {
			return nil, err
		}
		if count != int64(len(connectedEntityIDs)) {
			return nil, errors.New("one or more connected_entity_ids are invalid categories for current tenant")
		}
	}

	row, err := q.CreatePrinterSetting(ctx, pg.CreatePrinterSettingParams{
		Ip:                 req.IP,
		Port:               req.Port,
		Type:               req.Type,
		ConnectedEntityIds: connectedEntityIDs,
	})
	if err != nil {
		if isUniqueViolation(err) {
			return nil, errors.New("printer setting with this ip, port and type already exists")
		}
		return nil, err
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}

	return mapPrinterSettingResponse(row), nil
}
func (s *SettingsS) ListPrinterSettings(ctx context.Context, brandID string) ([]model.PrinterSettingResponse, error) {
	brandID = strings.TrimSpace(brandID)
	if brandID == "" {
		return nil, errors.New("brand_id is required")
	}

	schemaName := fmt.Sprintf("tenant_%s", brandID)

	tx, err := s.repo.PgRepo.TenantPool.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(ctx)

	if _, err := tx.Exec(ctx, fmt.Sprintf(`SET LOCAL search_path TO "%s", public`, schemaName)); err != nil {
		return nil, errors.New(http.StatusText(http.StatusUnauthorized))
	}

	q := s.repo.Tenant(ctx).WithTx(tx)

	rows, err := q.ListPrinterSettings(ctx)
	if err != nil {
		return nil, err
	}

	resp := make([]model.PrinterSettingResponse, 0, len(rows))
	for _, row := range rows {
		resp = append(resp, *mapPrinterSettingResponse(row))
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

	schemaName := fmt.Sprintf("tenant_%s", brandID)

	tx, err := s.repo.PgRepo.TenantPool.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(ctx)

	if _, err := tx.Exec(ctx, fmt.Sprintf(`SET LOCAL search_path TO "%s", public`, schemaName)); err != nil {
		return nil, errors.New(http.StatusText(http.StatusUnauthorized))
	}

	q := s.repo.Tenant(ctx).WithTx(tx)

	row, err := q.GetPrinterSettingByID(ctx, printerID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, errors.New("printer setting not found")
		}
		return nil, err
	}

	return mapPrinterSettingResponse(row), nil
}

func (s *SettingsS) UpdatePrinterSetting(ctx context.Context, brandID, id string, req model.UpdatePrinterSettingRequest) (*model.PrinterSettingResponse, error) {
	brandID = strings.TrimSpace(brandID)
	id = strings.TrimSpace(id)

	req.IP = normalizePrinterIP(req.IP)
	req.Type = strings.TrimSpace(req.Type)
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

	schemaName := fmt.Sprintf("tenant_%s", brandID)

	tx, err := s.repo.PgRepo.TenantPool.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(ctx)

	if _, err := tx.Exec(ctx, fmt.Sprintf(`SET LOCAL search_path TO "%s", public`, schemaName)); err != nil {
		return nil, errors.New(http.StatusText(http.StatusUnauthorized))
	}

	q := s.repo.Tenant(ctx).WithTx(tx)

	if req.Type == string(model.PrinterSettingTypeCategory) && len(connectedEntityIDs) > 0 {
		count, err := q.CountCategoriesByIDs(ctx, connectedEntityIDs)
		if err != nil {
			return nil, err
		}
		if count != int64(len(connectedEntityIDs)) {
			return nil, errors.New("one or more connected_entity_ids are invalid categories")
		}
	}

	row, err := q.UpdatePrinterSetting(ctx, pg.UpdatePrinterSettingParams{
		ID:                 printerID,
		Ip:                 req.IP,
		Port:               req.Port,
		Type:               req.Type,
		ConnectedEntityIds: connectedEntityIDs,
	})
	if err != nil {
		if isUniqueViolation(err) {
			return nil, errors.New("printer setting with this ip, port and type already exists")
		}
		return nil, err
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}

	return mapPrinterSettingResponse(row), nil
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

	schemaName := fmt.Sprintf("tenant_%s", brandID)

	tx, err := s.repo.PgRepo.TenantPool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	if _, err := tx.Exec(ctx, fmt.Sprintf(`SET LOCAL search_path TO "%s", public`, schemaName)); err != nil {
		return errors.New(http.StatusText(http.StatusUnauthorized))
	}

	q := s.repo.Tenant(ctx).WithTx(tx)

	rowsAffected, err := q.DeletePrinterSetting(ctx, printerID)
	if err != nil {
		return err
	}
	if rowsAffected == 0 {
		return errors.New("printer setting not found")
	}

	if err := tx.Commit(ctx); err != nil {
		return err
	}

	return nil
}
