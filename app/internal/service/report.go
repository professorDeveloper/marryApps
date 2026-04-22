package service

import (
	"context"
	"fmt"
	"log"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"

	"gitlab.yurtal.tech/company/maryai/back/internal/model"
	"gitlab.yurtal.tech/company/maryai/back/internal/repository"
	pg "gitlab.yurtal.tech/company/maryai/back/internal/repository/pg/tenantsdb"
)

type ReportI interface {
	GoodsReport(ctx context.Context,
		startDate, endDate string,
		departmentID, categoryID, goodID, waiterID, hallID, tableID *string,
		sortBy, sortOrder, goodIDs *string,
		limit, offset int32,
	) (*model.GoodsReportResponse, error)
	GoodOrdersReport(ctx context.Context,
		goodID, startDate, endDate string,
		waiterID, hallID, tableID *string,
		limit, offset int32,
	) (*model.GoodOrdersReportResponse, error)
}

type ReportS struct {
	repo *repository.Repository
}

func NewReportS(repo *repository.Repository) *ReportS {
	return &ReportS{repo: repo}
}

func (s *ReportS) GoodsReport(ctx context.Context,
	startDate, endDate string,
	departmentID, categoryID, goodID, waiterID, hallID, tableID *string,
	sortBy, sortOrder, goodIDs *string,
	limit, offset int32,
) (*model.GoodsReportResponse, error) {
	start, err := parseReportDate(startDate)
	if err != nil {
		return nil, fmt.Errorf("invalid start_date: %w", err)
	}
	end, err := parseReportDate(endDate)
	if err != nil {
		return nil, fmt.Errorf("invalid end_date: %w", err)
	}
	// If end_date was given as plain date (no time), make it inclusive by adding 1 day
	if len(endDate) <= 10 {
		end = end.AddDate(0, 0, 1)
	}

	startTs := pgtype.Timestamptz{Time: start, Valid: true}
	endTs := pgtype.Timestamptz{Time: end, Valid: true}

	params := pg.GoodsReportParams{
		CreatedAt:   startTs,
		CreatedAt_2: endTs,
		Column3:     strOrEmpty(departmentID),
		Column4:     strOrEmpty(categoryID),
		Column5:     strOrEmpty(goodID),
		Column6:     strOrEmpty(waiterID),
		Column7:     strOrEmpty(hallID),
		Column8:     strOrEmpty(tableID),
		Limit:       limit,
		Offset:      offset,
		GoodIDs:     strOrEmpty(goodIDs),
		SortBy:      strOrEmpty(sortBy),
		SortOrder:   strOrEmpty(sortOrder),
	}
	totalsParams := pg.GoodsReportTotalsParams{
		CreatedAt:   startTs,
		CreatedAt_2: endTs,
		Column3:     strOrEmpty(departmentID),
		Column4:     strOrEmpty(categoryID),
		Column5:     strOrEmpty(goodID),
		Column6:     strOrEmpty(waiterID),
		Column7:     strOrEmpty(hallID),
		Column8:     strOrEmpty(tableID),
	}

	rows, err := s.repo.Tenant(ctx).GoodsReport(ctx, params)
	if err != nil {
		return nil, fmt.Errorf("failed to get goods report: %w", err)
	}
	totalsRow, err := s.repo.Tenant(ctx).GoodsReportTotals(ctx, totalsParams)
	if err != nil {
		return nil, fmt.Errorf("failed to get goods report totals: %w", err)
	}

	data := make([]model.GoodsReportRow, 0, len(rows))
	for _, r := range rows {
		data = append(data, model.GoodsReportRow{
			GoodID:       r.GoodID,
			Name:         r.Name,
			TotalQty:     r.TotalQty,
			AvgSellPrice: pgNumericToStr(r.AvgSellPrice),
			TotalSell:    ifaceToStr(r.TotalSell),
			AvgCostPrice: pgNumericToStr(r.AvgCostPrice),
			TotalCost:    ifaceToStr(r.TotalCost),
			AvgMarkup:    pgNumericToStr(r.AvgMarkup),
			TotalMarkup:  ifaceToStr(r.TotalMarkup),
			AvgMarkupPct: pgNumericToStr(r.AvgMarkupPct),
		})
	}

	return &model.GoodsReportResponse{
		Data: data,
		Totals: model.GoodsReportTotals{
			TotalQty:     totalsRow.TotalQty,
			TotalSell:    ifaceToStr(totalsRow.TotalSell),
			TotalCost:    ifaceToStr(totalsRow.TotalCost),
			TotalMarkup:  ifaceToStr(totalsRow.TotalMarkup),
			AvgMarkupPct: pgNumericToStr(totalsRow.AvgMarkupPct),
			TotalCount:   totalsRow.TotalCount,
		},
		Limit:  limit,
		Offset: offset,
	}, nil
}

func (s *ReportS) GoodOrdersReport(ctx context.Context,
	goodID, startDate, endDate string,
	waiterID, hallID, tableID *string,
	limit, offset int32,
) (*model.GoodOrdersReportResponse, error) {
	gID, err := uuid.Parse(goodID)
	if err != nil {
		return nil, fmt.Errorf("invalid good_id: %w", err)
	}
	start, err := parseReportDate(startDate)
	if err != nil {
		return nil, fmt.Errorf("invalid start_date: %w", err)
	}
	end, err := parseReportDate(endDate)
	if err != nil {
		return nil, fmt.Errorf("invalid end_date: %w", err)
	}
	if len(endDate) <= 10 {
		end = end.AddDate(0, 0, 1)
	}
	startTs := pgtype.Timestamptz{Time: start, Valid: true}
	endTs := pgtype.Timestamptz{Time: end, Valid: true}

	params := pg.GoodOrdersReportParams{
		GoodID:      gID,
		CreatedAt:   startTs,
		CreatedAt_2: endTs,
		Column4:     strOrEmpty(waiterID),
		Column5:     strOrEmpty(hallID),
		Column6:     strOrEmpty(tableID),
		Limit:       limit,
		Offset:      offset,
	}
	totalsParams := pg.GoodOrdersReportTotalsParams{
		GoodID:      gID,
		CreatedAt:   startTs,
		CreatedAt_2: endTs,
		Column4:     strOrEmpty(waiterID),
		Column5:     strOrEmpty(hallID),
		Column6:     strOrEmpty(tableID),
	}

	rows, err := s.repo.Tenant(ctx).GoodOrdersReport(ctx, params)
	if err != nil {
		return nil, fmt.Errorf("failed to get good orders report: %w", err)
	}
	totalsRow, err := s.repo.Tenant(ctx).GoodOrdersReportTotals(ctx, totalsParams)
	if err != nil {
		return nil, fmt.Errorf("failed to get good orders report totals: %w", err)
	}

	data := make([]model.GoodOrdersReportRow, 0, len(rows))
	for _, r := range rows {
		row := model.GoodOrdersReportRow{
			OrderID:      r.OrderID,
			BillNo:       r.BillNo,
			BillStatus:   r.BillStatus,
			WaiterName:   r.WaiterName,
			HallName:     r.HallName,
			TableNumber:  ifaceToStr(r.TableNumber),
			TotalQty:     r.TotalQty,
			AvgSellPrice: pgNumericToStr(r.AvgSellPrice),
			TotalSell:    ifaceToStr(r.TotalSell),
			AvgCostPrice: pgNumericToStr(r.AvgCostPrice),
			TotalCost:    ifaceToStr(r.TotalCost),
			AvgMarkup:    pgNumericToStr(r.AvgMarkup),
			TotalMarkup:  ifaceToStr(r.TotalMarkup),
			AvgMarkupPct: pgNumericToStr(r.AvgMarkupPct),
		}
		if r.OpenedAt.Valid {
			t := r.OpenedAt.Time.Format(time.RFC3339)
			row.OpenedAt = &t
		}
		if r.ClosedAt.Valid {
			t := r.ClosedAt.Time.Format(time.RFC3339)
			row.ClosedAt = &t
		}
		data = append(data, row)
	}

	return &model.GoodOrdersReportResponse{
		Data: data,
		Totals: model.GoodOrdersReportTotals{
			TotalQty:     totalsRow.TotalQty,
			TotalSell:    ifaceToStr(totalsRow.TotalSell),
			TotalCost:    ifaceToStr(totalsRow.TotalCost),
			TotalMarkup:  ifaceToStr(totalsRow.TotalMarkup),
			AvgMarkupPct: pgNumericToStr(totalsRow.AvgMarkupPct),
			TotalOrders:  totalsRow.TotalOrders,
		},
		Limit:  limit,
		Offset: offset,
	}, nil
}

// withSavepoint wraps fn in a PostgreSQL SAVEPOINT.
// If fn returns an error (including a PostgreSQL error), the savepoint is rolled back
// so the main transaction stays alive. This is used for best-effort side-effects.
func withSavepoint(ctx context.Context, name string, fn func() error) {
	tx, ok := repository.TenantTxFromContext(ctx)
	if !ok {
		// No transaction in context — just run best-effort
		if err := fn(); err != nil {
			log.Printf("withSavepoint[%s] (no-tx) error: %v", name, err)
		}
		return
	}
	_, _ = tx.Exec(ctx, "SAVEPOINT "+name)
	if err := fn(); err != nil {
		log.Printf("withSavepoint[%s] error: %v", name, err)
		_, _ = tx.Exec(ctx, "ROLLBACK TO SAVEPOINT "+name)
	}
	_, _ = tx.Exec(ctx, "RELEASE SAVEPOINT "+name)
}

func strOrEmpty(s *string) string {
	if s == nil {
		return ""
	}
	return *s
}

// parseReportDate accepts RFC3339 ("2026-02-24T00:00:00Z") or plain date ("2026-02-24").
func parseReportDate(s string) (time.Time, error) {
	if t, err := time.Parse(time.RFC3339, s); err == nil {
		return t, nil
	}
	if t, err := time.ParseInLocation("2006-01-02", s, time.UTC); err == nil {
		return t, nil
	}
	return time.Time{}, fmt.Errorf("expected YYYY-MM-DD or RFC3339, got %q", s)
}

// ifaceToStr converts interface{} returned by sqlc for COALESCE(numeric) columns.
func ifaceToStr(v interface{}) string {
	if v == nil {
		return "0"
	}
	switch val := v.(type) {
	case pgtype.Numeric:
		return pgNumericToStr(val)
	case float64:
		return fmt.Sprintf("%g", val)
	case string:
		return val
	default:
		return fmt.Sprintf("%v", val)
	}
}
