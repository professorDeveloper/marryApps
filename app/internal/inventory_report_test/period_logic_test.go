package inventory_report_test

import (
	"context"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/stretchr/testify/require"
	pg "gitlab.yurtal.tech/company/maryai/back/internal/repository/pg/tenantsdb"
)

func TestIngredientReportPeriodLogic(t *testing.T) {
	ctx := context.Background()
	ingredientID := seedAprilPeriodMovements(t, ctx)

	type expectedReport struct {
		beginQty float64
		inQty    float64
		outQty   float64
		endQty   float64
	}

	testCases := []struct {
		name     string
		startDay int
		endDay   int
		expected expectedReport
	}{
		{name: "period starts before any stock exists", startDay: 1, endDay: 14, expected: expectedReport{0, 70, 0, 70}},
		{name: "starts exactly on first movement", startDay: 8, endDay: 8, expected: expectedReport{0, 25, 0, 25}},
		{name: "early past-to-past with 3 invoices", startDay: 8, endDay: 12, expected: expectedReport{0, 70, 0, 70}},
		{name: "starts after some stock (3 before)", startDay: 15, endDay: 16, expected: expectedReport{70, 40, 0, 110}},
		{name: "past1-to-past2 with exactly 3/3/3 invoices", startDay: 15, endDay: 19, expected: expectedReport{70, 95, 10, 155}},
		{name: "starts exactly on a movement date", startDay: 15, endDay: 15, expected: expectedReport{70, 40, 0, 110}},
		{name: "same day report with outgoing movement only", startDay: 19, endDay: 19, expected: expectedReport{165, 0, 10, 155}},
		{name: "same day report with no movement", startDay: 20, endDay: 20, expected: expectedReport{155, 0, 0, 155}},
		{name: "past till now (ends on current day 16 April)", startDay: 1, endDay: 16, expected: expectedReport{0, 110, 0, 110}},
		{name: "past-to-past crossing groups", startDay: 10, endDay: 18, expected: expectedReport{25, 140, 0, 165}},
		{name: "multiple invoices before end date are all included", startDay: 15, endDay: 21, expected: expectedReport{70, 125, 10, 185}},
		{name: "period with only later invoices after out", startDay: 21, endDay: 23, expected: expectedReport{155, 60, 0, 215}},
		{name: "no movements in period after all data", startDay: 24, endDay: 25, expected: expectedReport{215, 0, 0, 215}},
		{name: "period ends before later movements", startDay: 15, endDay: 16, expected: expectedReport{70, 40, 0, 110}},
	}

	for _, tc := range testCases {
		tc := tc
		t.Run(tc.name, func(t *testing.T) {
			report := getReportForInclusiveDays(t, ctx, ingredientID, tc.startDay, tc.endDay)
			require.NotNil(t, report, "report should return a row")

			assertFloat(t, tc.expected.beginQty, numericToFloat(report.BeginQty), "BEGIN quantity must only use stock BEFORE the start date")
			assertFloat(t, tc.expected.inQty, numericToFloat(report.InvoiceInQty), "IN quantity must include ALL incoming stock INSIDE the period")
			assertFloat(t, tc.expected.outQty, numericToFloat(report.OrderOutQty), "OUT quantity must include ALL outgoing stock INSIDE the period")
			assertFloat(t, tc.expected.endQty, numericToFloat(report.EndQty), "END quantity mismatch")
			assertFloat(t, tc.expected.beginQty+tc.expected.inQty-tc.expected.outQty, numericToFloat(report.EndQty), "END quantity formula MUST hold (Begin + In - Out)")
		})
	}
}

func TestIngredientReportPeriodLogicRepeatedRequests(t *testing.T) {
	ctx := context.Background()
	ingredientID := seedAprilPeriodMovements(t, ctx)

	type expectedReport struct {
		beginQty float64
		inQty    float64
		outQty   float64
		endQty   float64
	}

	requests := []struct {
		name     string
		startDay int
		endDay   int
		expected expectedReport
	}{
		{name: "15-16 april", startDay: 15, endDay: 16, expected: expectedReport{70, 40, 0, 110}},
		{name: "15-19 april (3/3/3)", startDay: 15, endDay: 19, expected: expectedReport{70, 95, 10, 155}},
		{name: "19-19 april", startDay: 19, endDay: 19, expected: expectedReport{165, 0, 10, 155}},
		{name: "1-16 april (past till now)", startDay: 1, endDay: 16, expected: expectedReport{0, 110, 0, 110}},
		{name: "10-18 april (crossing groups)", startDay: 10, endDay: 18, expected: expectedReport{25, 140, 0, 165}},
		{name: "24-25 april (empty after all)", startDay: 24, endDay: 25, expected: expectedReport{215, 0, 0, 215}},
	}

	for _, req := range requests {
		report := getReportForInclusiveDays(t, ctx, ingredientID, req.startDay, req.endDay)
		require.NotNil(t, report, "report should return a row for %s", req.name)

		assertFloat(t, req.expected.beginQty, numericToFloat(report.BeginQty), "BEGIN mismatch for %s", req.name)
		assertFloat(t, req.expected.inQty, numericToFloat(report.InvoiceInQty), "IN mismatch for %s", req.name)
		assertFloat(t, req.expected.outQty, numericToFloat(report.OrderOutQty), "OUT mismatch for %s", req.name)
		assertFloat(t, req.expected.endQty, numericToFloat(report.EndQty), "END mismatch for %s", req.name)
	}
}

// TestBackdatedInvoiceEndQtyConsistency reproduces the exact production bug:
// When Invoice A (April 16) is entered first and Invoice B (April 8, backdated) is
// entered second, the service writes stock_before/stock_after based on live stock at
// insertion time. This makes the stored running totals inconsistent with the effective
// date order. begin_qty and end_qty must NOT rely on stock_before/stock_after; they
// must be derived from raw qty_in/qty_out sums.
func TestBackdatedInvoiceEndQtyConsistency(t *testing.T) {
	ctx := context.Background()

	ingredientID := newIngredient(t, ctx, globalEnv.q, "backdated-invoice-bug-"+uuid.NewString())

	// Step 1: Invoice A (April 16, +20 units) entered first when live stock = 0
	//         → stock_before=0, stock_after=20 at effective_at=April 16
	insertMovementWithStockLevels(t, ctx, ingredientID,
		"invoice_in", 20, 0, 0, 20, ts(2026, 4, 16, 10, 32))

	// Step 2: Invoice B (April 8 backdated, +40 units) entered second when live stock = 20
	//         The service uses live stock (20) as baseline, NOT historically correct stock at April 8.
	//         So it stores stock_before=20, stock_after=60 with effective_at=April 8.
	//         This is INCONSISTENT: sorted by effective_at, April 8 appears before April 16
	//         but its stock_before (20) is higher than April 16's stock_before (0).
	insertMovementWithStockLevels(t, ctx, ingredientID,
		"invoice_in", 40, 0, 20, 60, ts(2026, 4, 8, 10, 33))

	// Report period: April 7 to April 16 (end_ts = April 17 00:00, inclusive of both invoices).
	// Both invoices fall in [April 7, April 17), so invoice_in_qty must be 60.
	// Correct end_qty = 0 (begin before April 7) + 60 (in) = 60.
	report := getReport(t, ctx, globalEnv.q, globalEnv.storageID, ingredientID,
		ts(2026, 4, 7, 0, 0), ts(2026, 4, 17, 0, 0))

	require.NotNil(t, report, "report must return a row")

	assertFloat(t, 60, numericToFloat(report.InvoiceInQty),
		"invoice_in_qty must sum both invoices (40+20=60)")

	// Before the fix: end_qty returned 20 (stale stock_after from Invoice A, never
	// updated when Invoice B was backdated). Correct value is 60.
	assertFloat(t, 0, numericToFloat(report.BeginQty),
		"begin_qty must be 0 (no movements before April 7)")
	assertFloat(t, 60, numericToFloat(report.EndQty),
		"end_qty must be 60 = begin(0) + in(60) - out(0), not the stale stock_after=20")
}

// ==================== SEED DATA (3 invoices in every bucket) ====================
func seedAprilPeriodMovements(t *testing.T, ctx context.Context) uuid.UUID {
	t.Helper()
	ingredientID := newIngredient(t, ctx, globalEnv.q, "april-period-logic-"+uuid.NewString())

	// 3 invoices BEFORE any "past1" (used for BeginQty when start=15)
	insertMovement(t, ctx, globalEnv.q, globalEnv.storageID, ingredientID, "invoice_in", 25, 0, 0, 25, aprilDate(8))
	insertMovement(t, ctx, globalEnv.q, globalEnv.storageID, ingredientID, "invoice_in", 20, 0, 25, 45, aprilDate(10))
	insertMovement(t, ctx, globalEnv.q, globalEnv.storageID, ingredientID, "invoice_in", 25, 0, 45, 70, aprilDate(12))

	// 3 invoices INSIDE 15-19 period
	insertMovement(t, ctx, globalEnv.q, globalEnv.storageID, ingredientID, "invoice_in", 40, 0, 70, 110, aprilDate(15))
	insertMovement(t, ctx, globalEnv.q, globalEnv.storageID, ingredientID, "invoice_in", 35, 0, 110, 145, aprilDate(17))
	insertMovement(t, ctx, globalEnv.q, globalEnv.storageID, ingredientID, "invoice_in", 20, 0, 145, 165, aprilDate(18))

	// outgoing on 19
	insertMovement(t, ctx, globalEnv.q, globalEnv.storageID, ingredientID, "order_out", 0, 10, 165, 155, aprilDate(19))

	// 3 invoices AFTER 19
	insertMovement(t, ctx, globalEnv.q, globalEnv.storageID, ingredientID, "invoice_in", 30, 0, 155, 185, aprilDate(21))
	insertMovement(t, ctx, globalEnv.q, globalEnv.storageID, ingredientID, "invoice_in", 15, 0, 185, 200, aprilDate(22))
	insertMovement(t, ctx, globalEnv.q, globalEnv.storageID, ingredientID, "invoice_in", 15, 0, 200, 215, aprilDate(23))

	return ingredientID
}

// (keep your existing helper functions unchanged)
func getReportForInclusiveDays(t *testing.T, ctx context.Context, ingredientID uuid.UUID, startDay, endDay int) *pg.IngredientReportRow {
	t.Helper()
	start := aprilDayStart(startDay)
	endExclusive := aprilDayStart(endDay + 1)
	return getReport(t, ctx, globalEnv.q, globalEnv.storageID, ingredientID, start, endExclusive)
}

func aprilDate(day int) time.Time {
	return ts(2026, time.April, day, 10, 0)
}

func aprilDayStart(day int) time.Time {
	return ts(2026, time.April, day, 0, 0)
}