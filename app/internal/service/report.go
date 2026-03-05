package service

import (
	"context"
	"fmt"
	"log"
	"time"

	"github.com/jackc/pgx/v5/pgtype"

	"gitlab.yurtal.tech/company/maryai/back/internal/model"
	pg "gitlab.yurtal.tech/company/maryai/back/internal/repository/pg/tenantsdb"
	"gitlab.yurtal.tech/company/maryai/back/internal/repository"
)

type ReportI interface {
	GoodsReport(ctx context.Context,
		startDate, endDate string,
		departmentID, categoryID, goodID, waiterID, hallID, tableID *string,
		limit, offset int32,
	) (*model.GoodsReportResponse, error)
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
