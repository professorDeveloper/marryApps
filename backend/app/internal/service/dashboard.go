package service

import (
	"context"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5/pgtype"
	"gitlab.yurtal.tech/company/maryai/back/internal/model"
	"gitlab.yurtal.tech/company/maryai/back/internal/repository"
	pg "gitlab.yurtal.tech/company/maryai/back/internal/repository/pg/tenantsdb"
)

type DashboardS struct {
	repo *repository.Repository
}

func NewDashboardS(repo *repository.Repository) *DashboardS {
	return &DashboardS{repo: repo}
}

func (s *DashboardS) GetDashboardOverview(ctx context.Context, req model.DashboardOverviewRequest) (*model.DashboardOverviewResponse, error) {
	// Validate and set defaults
	if req.GroupBy == "" {
		req.GroupBy = model.DashboardGroupByDay
	}
	if req.DishMetric == "" {
		req.DishMetric = model.DashboardDishMetricRevenue
	}
	if req.DishSort == "" {
		req.DishSort = model.DashboardSortDesc
	}
	if req.Limit <= 0 {
		req.Limit = 10
	}
	if req.Limit > 100 {
		req.Limit = 100
	}
	if req.Lang == "" {
		req.Lang = "ru"
	}

	// Validate date range
	if req.Start.After(req.End) || req.Start.Equal(req.End) {
		return nil, fmt.Errorf("start date must be before end date")
	}

	// Calculate previous period for KPI comparison
	duration := req.End.Sub(req.Start)
	previousStart := req.Start.Add(-duration)
	previousEnd := req.Start

	var response model.DashboardOverviewResponse

	// Set period info
	response.Period = model.DashboardPeriod{
		Start:         req.Start,
		End:           req.End,
		GroupBy:       req.GroupBy,
		PreviousStart: &previousStart,
		PreviousEnd:   &previousEnd,
	}

	// Execute all dashboard queries in a single tenant read transaction
	err := withTenantRead(ctx, s.repo, func(tenantCtx context.Context, q *pg.Queries) error {
		// Get KPIs for current period
		kpis, err := s.getDashboardKPIs(tenantCtx, q, req.Start, req.End, previousStart, previousEnd)
		if err != nil {
			return fmt.Errorf("failed to get dashboard KPIs: %w", err)
		}
		response.KPIs = kpis

		// Get sales dynamics
		salesDynamics, err := s.getSalesDynamics(tenantCtx, q, req.Start, req.End, req.GroupBy)
		if err != nil {
			return fmt.Errorf("failed to get sales dynamics: %w", err)
		}
		response.SalesDynamics = salesDynamics

		// Get revenue by payment types
		revenueByPaymentTypes, err := s.getRevenueByPaymentTypes(tenantCtx, q, req.Start, req.End)
		if err != nil {
			return fmt.Errorf("failed to get revenue by payment types: %w", err)
		}
		response.RevenueByPaymentTypes = revenueByPaymentTypes

		// Get revenue by categories
		revenueByCategories, err := s.getRevenueByCategories(tenantCtx, q, req.Start, req.End, req.Lang)
		if err != nil {
			return fmt.Errorf("failed to get revenue by categories: %w", err)
		}
		response.RevenueByCategories = revenueByCategories

		// Get dish sales
		dishSales, err := s.getDishSales(tenantCtx, q, req.Start, req.End, req.DishMetric, req.DishSort, req.Limit)
		if err != nil {
			return fmt.Errorf("failed to get dish sales: %w", err)
		}
		response.DishSales = dishSales

		return nil
	})

	if err != nil {
		return nil, err
	}

	return &response, nil
}

func (s *DashboardS) getDashboardKPIs(ctx context.Context, q *pg.Queries, start, end, previousStart, previousEnd time.Time) (model.DashboardKPIs, error) {
	// Get current period KPIs
	currentKPIs, err := q.GetDashboardKPIs(ctx, pg.GetDashboardKPIsParams{
		CreatedAt:   pgtype.Timestamptz{Time: start, Valid: true},
		CreatedAt_2: pgtype.Timestamptz{Time: end, Valid: true},
	})
	if err != nil {
		return model.DashboardKPIs{}, err
	}

	// Get previous period KPIs
	previousKPIs, err := q.GetDashboardKPIs(ctx, pg.GetDashboardKPIsParams{
		CreatedAt:   pgtype.Timestamptz{Time: previousStart, Valid: true},
		CreatedAt_2: pgtype.Timestamptz{Time: previousEnd, Valid: true},
	})
	if err != nil {
		return model.DashboardKPIs{}, err
	}

	kpis := model.DashboardKPIs{
		Revenue:         s.calculateKPIValue(currentKPIs.Revenue, previousKPIs.Revenue),
		ChecksCount:     s.calculateKPIValueInt(currentKPIs.ChecksCount, previousKPIs.ChecksCount),
		AverageCheck:    s.calculateKPIValue(currentKPIs.AverageCheck, previousKPIs.AverageCheck),
		ReturnsCount:    s.calculateKPIValueInt(currentKPIs.ReturnsCount, previousKPIs.ReturnsCount),
		DiscountsAmount: s.calculateKPIValue(currentKPIs.DiscountsAmount, previousKPIs.DiscountsAmount),
		VATAmount:       s.calculateKPIValue(currentKPIs.VatAmount, previousKPIs.VatAmount),
	}

	return kpis, nil
}

func (s *DashboardS) calculateKPIValue(current, previous pgtype.Numeric) model.DashboardKPIValue {
	currentStr := numericToStr(current)
	previousStr := numericToStr(previous)

	changePercent, trend := s.calculateChangePercent(current, previous)

	return model.DashboardKPIValue{
		Value:         currentStr,
		PreviousValue: previousStr,
		ChangePercent: changePercent,
		Trend:         trend,
	}
}

func (s *DashboardS) calculateKPIValueInt(current, previous int64) model.DashboardKPIValue {
	currentStr := fmt.Sprintf("%d", current)
	previousStr := fmt.Sprintf("%d", previous)

	changePercent, trend := s.calculateChangePercentInt(current, previous)

	return model.DashboardKPIValue{
		Value:         currentStr,
		PreviousValue: previousStr,
		ChangePercent: changePercent,
		Trend:         trend,
	}
}

func (s *DashboardS) calculateChangePercent(current, previous pgtype.Numeric) (string, string) {
	currentVal := parseNumeric(numericToStr(current))
	previousVal := parseNumeric(numericToStr(previous))

	if previousVal == 0 {
		if currentVal > 0 {
			return "100.00", "up"
		}
		return "0.00", "same"
	}

	change := (currentVal - previousVal) / previousVal * 100
	changeStr := fmt.Sprintf("%.2f", change)

	if change > 0 {
		return changeStr, "up"
	} else if change < 0 {
		return changeStr, "down"
	}
	return changeStr, "same"
}

func (s *DashboardS) calculateChangePercentInt(current, previous int64) (string, string) {
	if previous == 0 {
		if current > 0 {
			return "100.00", "up"
		}
		return "0.00", "same"
	}

	change := float64(current-previous) / float64(previous) * 100
	changeStr := fmt.Sprintf("%.2f", change)

	if change > 0 {
		return changeStr, "up"
	} else if change < 0 {
		return changeStr, "down"
	}
	return changeStr, "same"
}

func (s *DashboardS) getSalesDynamics(ctx context.Context, q *pg.Queries, start, end time.Time, groupBy model.DashboardGroupBy) ([]model.DashboardSalesDynamicsItem, error) {
	rows, err := q.GetDashboardSalesDynamics(ctx, pg.GetDashboardSalesDynamicsParams{
		CreatedAt:   pgtype.Timestamptz{Time: start, Valid: true},
		CreatedAt_2: pgtype.Timestamptz{Time: end, Valid: true},
		Column3:     string(groupBy),
	})
	if err != nil {
		return nil, err
	}

	items := make([]model.DashboardSalesDynamicsItem, 0, len(rows))
	for _, row := range rows {
		period := ""
		if row.Period != nil {
			period = fmt.Sprintf("%v", row.Period)
		}
		label := ""
		if row.Label != nil {
			label = fmt.Sprintf("%v", row.Label)
		}
		items = append(items, model.DashboardSalesDynamicsItem{
			Period:       period,
			Label:        label,
			Revenue:      numericToStr(row.Revenue),
			ChecksCount:  row.ChecksCount,
			AverageCheck: numericToStr(row.AverageCheck),
		})
	}

	return items, nil
}

func (s *DashboardS) getRevenueByPaymentTypes(ctx context.Context, q *pg.Queries, start, end time.Time) (model.DashboardRevenueByPaymentTypes, error) {
	rows, err := q.GetDashboardRevenueByPaymentTypes(ctx, pg.GetDashboardRevenueByPaymentTypesParams{
		CreatedAt:   pgtype.Timestamptz{Time: start, Valid: true},
		CreatedAt_2: pgtype.Timestamptz{Time: end, Valid: true},
	})
	if err != nil {
		return model.DashboardRevenueByPaymentTypes{}, err
	}

	var total float64
	items := make([]model.DashboardRevenueByPaymentTypeItem, 0, len(rows))
	for _, row := range rows {
		revenue := parseNumeric(numericToStr(row.Revenue))
		total += revenue
		paymentType := "unknown"
		if row.PaymentType != nil {
			paymentType = fmt.Sprintf("%v", row.PaymentType)
		}
		items = append(items, model.DashboardRevenueByPaymentTypeItem{
			PaymentType: paymentType,
			Revenue:     numericToStr(row.Revenue),
			Percent:     numericToStr(row.Percent),
		})
	}

	return model.DashboardRevenueByPaymentTypes{
		Total: fmt.Sprintf("%.2f", total),
		Items: items,
	}, nil
}

func (s *DashboardS) getRevenueByCategories(ctx context.Context, q *pg.Queries, start, end time.Time, lang string) (model.DashboardRevenueByCategories, error) {
	rows, err := q.GetDashboardRevenueByCategories(ctx, pg.GetDashboardRevenueByCategoriesParams{
		CreatedAt:   pgtype.Timestamptz{Time: start, Valid: true},
		CreatedAt_2: pgtype.Timestamptz{Time: end, Valid: true},
		Column3:     lang,
	})
	if err != nil {
		return model.DashboardRevenueByCategories{}, err
	}

	var total float64
	items := make([]model.DashboardRevenueByCategoryItem, 0, len(rows))
	for _, row := range rows {
		revenue := parseNumeric(numericToStr(row.Revenue))
		total += revenue

		var categoryID *string
		if row.CategoryID != "" {
			catID := row.CategoryID
			categoryID = &catID
		}

		items = append(items, model.DashboardRevenueByCategoryItem{
			CategoryID:   categoryID,
			CategoryName: row.CategoryName,
			Revenue:      numericToStr(row.Revenue),
			Percent:      numericToStr(row.Percent),
		})
	}

	return model.DashboardRevenueByCategories{
		Total: fmt.Sprintf("%.2f", total),
		Items: items,
	}, nil
}

func (s *DashboardS) getDishSales(ctx context.Context, q *pg.Queries, start, end time.Time, metric model.DashboardDishMetric, sort model.DashboardSort, limit int32) (model.DashboardDishSales, error) {
	rows, err := q.GetDashboardDishSales(ctx, pg.GetDashboardDishSalesParams{
		CreatedAt:   pgtype.Timestamptz{Time: start, Valid: true},
		CreatedAt_2: pgtype.Timestamptz{Time: end, Valid: true},
		Column3:     string(metric),
		Column4:     string(sort),
		Limit:       limit,
	})
	if err != nil {
		return model.DashboardDishSales{}, err
	}

	items := make([]model.DashboardDishSalesItem, 0, len(rows))
	for _, row := range rows {
		items = append(items, model.DashboardDishSalesItem{
			GoodID:   row.GoodID,
			GoodName: row.GoodName,
			Revenue:  numericToStr(row.Revenue),
			Quantity: numericToStr(row.Quantity),
		})
	}

	return model.DashboardDishSales{
		Metric: string(metric),
		Sort:   string(sort),
		Items:  items,
	}, nil
}

func parseNumeric(s string) float64 {
	var f float64
	fmt.Sscanf(s, "%f", &f)
	return f
}
