package goods_report_test

import (
	"context"
	"fmt"
	"testing"
	"time"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/stretchr/testify/require"

	pg "gitlab.yurtal.tech/company/maryai/back/internal/repository/pg/tenantsdb"
)

// TestGoodsReport_SortingByTotalQty tests sorting by total_qty field
func TestGoodsReport_SortingByTotalQty(t *testing.T) {
	ctx := context.Background()

	// Create goods with different quantities
	good1 := newGood(t, ctx, globalEnv.q, "Burger", 10.0)
	good2 := newGood(t, ctx, globalEnv.q, "Pizza", 15.0)
	good3 := newGood(t, ctx, globalEnv.q, "Salad", 8.0)

	// Create orders with different quantities
	now := ts(2026, time.January, 10, 12, 0)
	newOrder(t, ctx, globalEnv.pool, globalEnv.branchID, []orderItem{
		{GoodID: good1, Quantity: 50, Price: 10.0, CostPrice: 5.0},
	}, now)
	newOrder(t, ctx, globalEnv.pool, globalEnv.branchID, []orderItem{
		{GoodID: good2, Quantity: 30, Price: 15.0, CostPrice: 8.0},
	}, now)
	newOrder(t, ctx, globalEnv.pool, globalEnv.branchID, []orderItem{
		{GoodID: good3, Quantity: 100, Price: 8.0, CostPrice: 4.0},
	}, now)

	startTs := pgtype.Timestamptz{Time: ts(2026, time.January, 1, 0, 0), Valid: true}
	endTs := pgtype.Timestamptz{Time: ts(2026, time.January, 15, 0, 0), Valid: true}

	// Test ascending sort
	rows, err := globalEnv.q.GoodsReport(ctx, pg.GoodsReportParams{
		CreatedAt:   startTs,
		CreatedAt_2: endTs,
		Column3:     "",
		Column4:     "",
		Column5:     "",
		Column6:     "",
		Column7:     "",
		Column8:     "",
		Limit:       100,
		Offset:      0,
		GoodIDs:     "",
		SortBy:      "total_qty",
		SortOrder:   "asc",
	})
	require.NoError(t, err)
	require.Len(t, rows, 3)
	require.Equal(t, int64(30), rows[0].TotalQty)
	require.Equal(t, int64(50), rows[1].TotalQty)
	require.Equal(t, int64(100), rows[2].TotalQty)

	// Test descending sort
	rows, err = globalEnv.q.GoodsReport(ctx, pg.GoodsReportParams{
		CreatedAt:   startTs,
		CreatedAt_2: endTs,
		Column3:     "",
		Column4:     "",
		Column5:     "",
		Column6:     "",
		Column7:     "",
		Column8:     "",
		Limit:       100,
		Offset:      0,
		GoodIDs:     "",
		SortBy:      "total_qty",
		SortOrder:   "desc",
	})
	require.NoError(t, err)
	require.Len(t, rows, 3)
	require.Equal(t, int64(100), rows[0].TotalQty)
	require.Equal(t, int64(50), rows[1].TotalQty)
	require.Equal(t, int64(30), rows[2].TotalQty)
}

// TestGoodsReport_SortingByAvgSellPrice tests sorting by avg_sell_price field
func TestGoodsReport_SortingByAvgSellPrice(t *testing.T) {
	ctx := context.Background()

	good1 := newGood(t, ctx, globalEnv.q, "Steak", 25.0)
	good2 := newGood(t, ctx, globalEnv.q, "Chicken", 18.0)
	good3 := newGood(t, ctx, globalEnv.q, "Fish", 12.0)

	now := ts(2026, time.January, 10, 12, 0)
	newOrder(t, ctx, globalEnv.pool, globalEnv.branchID, []orderItem{
		{GoodID: good1, Quantity: 10, Price: 25.0, CostPrice: 15.0},
	}, now)
	newOrder(t, ctx, globalEnv.pool, globalEnv.branchID, []orderItem{
		{GoodID: good2, Quantity: 10, Price: 18.0, CostPrice: 10.0},
	}, now)
	newOrder(t, ctx, globalEnv.pool, globalEnv.branchID, []orderItem{
		{GoodID: good3, Quantity: 10, Price: 12.0, CostPrice: 6.0},
	}, now)

	startTs := pgtype.Timestamptz{Time: ts(2026, time.January, 1, 0, 0), Valid: true}
	endTs := pgtype.Timestamptz{Time: ts(2026, time.January, 15, 0, 0), Valid: true}

	// Test descending sort (highest price first)
	rows, err := globalEnv.q.GoodsReport(ctx, pg.GoodsReportParams{
		CreatedAt:   startTs,
		CreatedAt_2: endTs,
		Column3:     "",
		Column4:     "",
		Column5:     "",
		Column6:     "",
		Column7:     "",
		Column8:     "",
		Limit:       100,
		Offset:      0,
		GoodIDs:     "",
		SortBy:      "avg_sell_price",
		SortOrder:   "desc",
	})
	require.NoError(t, err)
	require.Len(t, rows, 3)
	require.Equal(t, "Steak", rows[0].Name)
	require.Equal(t, "Chicken", rows[1].Name)
	require.Equal(t, "Fish", rows[2].Name)
}

// TestGoodsReport_FilterByGoodIDs tests filtering by good_ids array
func TestGoodsReport_FilterByGoodIDs(t *testing.T) {
	ctx := context.Background()

	good1 := newGood(t, ctx, globalEnv.q, "Pasta", 12.0)
	good2 := newGood(t, ctx, globalEnv.q, "Rice", 8.0)
	good3 := newGood(t, ctx, globalEnv.q, "Bread", 5.0)

	now := ts(2026, time.January, 10, 12, 0)
	newOrder(t, ctx, globalEnv.pool, globalEnv.branchID, []orderItem{
		{GoodID: good1, Quantity: 20, Price: 12.0, CostPrice: 6.0},
	}, now)
	newOrder(t, ctx, globalEnv.pool, globalEnv.branchID, []orderItem{
		{GoodID: good2, Quantity: 30, Price: 8.0, CostPrice: 4.0},
	}, now)
	newOrder(t, ctx, globalEnv.pool, globalEnv.branchID, []orderItem{
		{GoodID: good3, Quantity: 40, Price: 5.0, CostPrice: 2.0},
	}, now)

	startTs := pgtype.Timestamptz{Time: ts(2026, time.January, 1, 0, 0), Valid: true}
	endTs := pgtype.Timestamptz{Time: ts(2026, time.January, 15, 0, 0), Valid: true}

	// Filter by two specific goods
	goodIDsStr := fmt.Sprintf("%s,%s", good1.String(), good3.String())
	rows, err := globalEnv.q.GoodsReport(ctx, pg.GoodsReportParams{
		CreatedAt:   startTs,
		CreatedAt_2: endTs,
		Column3:     "",
		Column4:     "",
		Column5:     "",
		Column6:     "",
		Column7:     "",
		Column8:     "",
		Limit:       100,
		Offset:      0,
		GoodIDs:     goodIDsStr,
		SortBy:      "",
		SortOrder:   "",
	})
	require.NoError(t, err)
	require.Len(t, rows, 2)

	// Verify only the filtered goods are returned
	goodIDsReturned := make(map[string]bool)
	for _, row := range rows {
		goodIDsReturned[row.GoodID] = true
	}
	require.True(t, goodIDsReturned[good1.String()])
	require.True(t, goodIDsReturned[good3.String()])
	require.False(t, goodIDsReturned[good2.String()])
}

// TestGoodsReport_NoSorting tests default behavior when no sort parameters provided
func TestGoodsReport_NoSorting(t *testing.T) {
	ctx := context.Background()

	good1 := newGood(t, ctx, globalEnv.q, "Zebra", 20.0)
	good2 := newGood(t, ctx, globalEnv.q, "Apple", 15.0)
	good3 := newGood(t, ctx, globalEnv.q, "Mango", 10.0)

	now := ts(2026, time.January, 10, 12, 0)
	newOrder(t, ctx, globalEnv.pool, globalEnv.branchID, []orderItem{
		{GoodID: good1, Quantity: 10, Price: 20.0, CostPrice: 10.0},
	}, now)
	newOrder(t, ctx, globalEnv.pool, globalEnv.branchID, []orderItem{
		{GoodID: good2, Quantity: 10, Price: 15.0, CostPrice: 8.0},
	}, now)
	newOrder(t, ctx, globalEnv.pool, globalEnv.branchID, []orderItem{
		{GoodID: good3, Quantity: 10, Price: 10.0, CostPrice: 5.0},
	}, now)

	startTs := pgtype.Timestamptz{Time: ts(2026, time.January, 1, 0, 0), Valid: true}
	endTs := pgtype.Timestamptz{Time: ts(2026, time.January, 15, 0, 0), Valid: true}

	// No sorting parameters - should default to name
	rows, err := globalEnv.q.GoodsReport(ctx, pg.GoodsReportParams{
		CreatedAt:   startTs,
		CreatedAt_2: endTs,
		Column3:     "",
		Column4:     "",
		Column5:     "",
		Column6:     "",
		Column7:     "",
		Column8:     "",
		Limit:       100,
		Offset:      0,
		GoodIDs:     "",
		SortBy:      "",
		SortOrder:   "",
	})
	require.NoError(t, err)
	require.Len(t, rows, 3)
	require.Equal(t, "Apple", rows[0].Name)
	require.Equal(t, "Mango", rows[1].Name)
	require.Equal(t, "Zebra", rows[2].Name)
}

// TestGoodsReport_SortingByTotalSell tests sorting by total_sell field
func TestGoodsReport_SortingByTotalSell(t *testing.T) {
	ctx := context.Background()

	good1 := newGood(t, ctx, globalEnv.q, "Lobster", 50.0)
	good2 := newGood(t, ctx, globalEnv.q, "Shrimp", 30.0)
	good3 := newGood(t, ctx, globalEnv.q, "Crab", 40.0)

	now := ts(2026, time.January, 10, 12, 0)
	newOrder(t, ctx, globalEnv.pool, globalEnv.branchID, []orderItem{
		{GoodID: good1, Quantity: 5, Price: 50.0, CostPrice: 30.0}, // total: 250
	}, now)
	newOrder(t, ctx, globalEnv.pool, globalEnv.branchID, []orderItem{
		{GoodID: good2, Quantity: 10, Price: 30.0, CostPrice: 18.0}, // total: 300
	}, now)
	newOrder(t, ctx, globalEnv.pool, globalEnv.branchID, []orderItem{
		{GoodID: good3, Quantity: 8, Price: 40.0, CostPrice: 25.0}, // total: 320
	}, now)

	startTs := pgtype.Timestamptz{Time: ts(2026, time.January, 1, 0, 0), Valid: true}
	endTs := pgtype.Timestamptz{Time: ts(2026, time.January, 15, 0, 0), Valid: true}

	rows, err := globalEnv.q.GoodsReport(ctx, pg.GoodsReportParams{
		CreatedAt:   startTs,
		CreatedAt_2: endTs,
		Column3:     "",
		Column4:     "",
		Column5:     "",
		Column6:     "",
		Column7:     "",
		Column8:     "",
		Limit:       100,
		Offset:      0,
		GoodIDs:     "",
		SortBy:      "total_sell",
		SortOrder:   "desc",
	})
	require.NoError(t, err)
	require.Len(t, rows, 3)
	require.Equal(t, "Crab", rows[0].Name)
	require.Equal(t, "Shrimp", rows[1].Name)
	require.Equal(t, "Lobster", rows[2].Name)
}

// TestGoodsReport_CombinedFilterAndSort tests combining good_ids filter with sorting
func TestGoodsReport_CombinedFilterAndSort(t *testing.T) {
	ctx := context.Background()

	good1 := newGood(t, ctx, globalEnv.q, "Beef", 20.0)
	good2 := newGood(t, ctx, globalEnv.q, "Pork", 18.0)
	good3 := newGood(t, ctx, globalEnv.q, "Chicken", 15.0)

	now := ts(2026, time.January, 10, 12, 0)
	newOrder(t, ctx, globalEnv.pool, globalEnv.branchID, []orderItem{
		{GoodID: good1, Quantity: 40, Price: 20.0, CostPrice: 12.0},
	}, now)
	newOrder(t, ctx, globalEnv.pool, globalEnv.branchID, []orderItem{
		{GoodID: good2, Quantity: 30, Price: 18.0, CostPrice: 10.0},
	}, now)
	newOrder(t, ctx, globalEnv.pool, globalEnv.branchID, []orderItem{
		{GoodID: good3, Quantity: 20, Price: 15.0, CostPrice: 8.0},
	}, now)

	startTs := pgtype.Timestamptz{Time: ts(2026, time.January, 1, 0, 0), Valid: true}
	endTs := pgtype.Timestamptz{Time: ts(2026, time.January, 15, 0, 0), Valid: true}

	// Filter by beef and pork, sort by total_qty desc
	goodIDsStr := fmt.Sprintf("%s,%s", good1.String(), good2.String())
	rows, err := globalEnv.q.GoodsReport(ctx, pg.GoodsReportParams{
		CreatedAt:   startTs,
		CreatedAt_2: endTs,
		Column3:     "",
		Column4:     "",
		Column5:     "",
		Column6:     "",
		Column7:     "",
		Column8:     "",
		Limit:       100,
		Offset:      0,
		GoodIDs:     goodIDsStr,
		SortBy:      "total_qty",
		SortOrder:   "desc",
	})
	require.NoError(t, err)
	require.Len(t, rows, 2)
	require.Equal(t, "Beef", rows[0].Name)
	require.Equal(t, int64(40), rows[0].TotalQty)
	require.Equal(t, "Pork", rows[1].Name)
	require.Equal(t, int64(30), rows[1].TotalQty)
}
