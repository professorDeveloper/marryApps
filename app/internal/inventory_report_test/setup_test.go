// Package inventory_report_test contains integration tests for time-aware inventory
// and ingredient report functionality. Tests run against a real Postgres container.
package inventory_report_test

import (
	"context"
	"fmt"
	"os"
	"path/filepath"
	"runtime"
	"strings"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
	_ "github.com/lib/pq"
	"github.com/stretchr/testify/require"
	tcpostgres "github.com/testcontainers/testcontainers-go/modules/postgres"

	"github.com/golang-migrate/migrate/v4"
	"github.com/golang-migrate/migrate/v4/database/postgres"
	_ "github.com/golang-migrate/migrate/v4/source/file"

	"database/sql"

	pg "gitlab.yurtal.tech/company/maryai/back/internal/repository/pg/tenantsdb"
)

// testEnv holds the shared test DB queries object and test data IDs.
type testEnv struct {
	q         *pg.Queries
	pool      *pgxpool.Pool
	storageID uuid.UUID
	branchID  uuid.UUID
}

// globalEnv is initialized once per test binary via TestMain.
var globalEnv *testEnv

func TestMain(m *testing.M) {
	ctx := context.Background()

	pgContainer, err := tcpostgres.Run(ctx,
		"postgres:16-alpine",
		tcpostgres.WithDatabase("testdb"),
		tcpostgres.WithUsername("testuser"),
		tcpostgres.WithPassword("testpass"),
		tcpostgres.BasicWaitStrategies(),
	)
	if err != nil {
		panic(fmt.Sprintf("failed to start postgres container: %v", err))
	}
	defer func() { _ = pgContainer.Terminate(ctx) }()

	dsn, err := pgContainer.ConnectionString(ctx, "sslmode=disable")
	if err != nil {
		panic(fmt.Sprintf("failed to get connection string: %v", err))
	}

	pool, err := pgxpool.New(ctx, dsn)
	if err != nil {
		panic(fmt.Sprintf("failed to create pool: %v", err))
	}
	defer pool.Close()

	// Run tenant migrations
	if err := runMigrations(dsn); err != nil {
		panic(fmt.Sprintf("failed to run migrations: %v", err))
	}

	// Seed shared fixtures: a branch and a storage
	branchID := uuid.New()
	storageID := uuid.New()
	_, _ = pool.Exec(ctx, `INSERT INTO branches (id, name, deleted_at) VALUES ($1, 'Test Branch', 0)`,
		branchID)
	_, _ = pool.Exec(ctx, `INSERT INTO storages (id, name, branch_id, deleted_at) VALUES ($1, 'Test Storage', $2, 0)`,
		storageID, branchID)

	q := pg.New(pool)
	globalEnv = &testEnv{
		q:         q,
		pool:      pool,
		storageID: storageID,
		branchID:  branchID,
	}

	os.Exit(m.Run())
}

// runMigrations applies tenant migrations to the test database.
func runMigrations(dsn string) error {
	// Find migrations/tenants directory relative to this test file.
	_, filename, _, ok := runtime.Caller(0)
	if !ok {
		return fmt.Errorf("could not determine caller file path")
	}
	// Walk up to the app/ root then find migrations/tenants
	appRoot := filepath.Join(filepath.Dir(filename), "..", "..")
	migrationsPath := filepath.Join(appRoot, "migrations", "tenants")

	// Resolve absolute path
	abs, err := filepath.Abs(migrationsPath)
	if err != nil {
		return err
	}

	db, err := sql.Open("postgres", dsn)
	if err != nil {
		return err
	}
	defer db.Close()

	driver, err := postgres.WithInstance(db, &postgres.Config{})
	if err != nil {
		return err
	}

	mg, err := migrate.NewWithDatabaseInstance(
		fmt.Sprintf("file://%s", abs),
		"postgres", driver,
	)
	if err != nil {
		return err
	}

	if err := mg.Up(); err != nil && err != migrate.ErrNoChange {
		return err
	}
	return nil
}

// newIngredient creates a fresh ingredient for a test.
func newIngredient(t *testing.T, ctx context.Context, q *pg.Queries, name string) uuid.UUID {
	t.Helper()
	id := uuid.New()
	_, err := q.CreateIngredient(ctx, pg.CreateIngredientParams{
		ID:   id,
		Name: name,
	})
	require.NoError(t, err)
	return id
}

// insertMovement directly inserts a stock movement with explicit effective_at.
func insertMovement(t *testing.T, ctx context.Context, q *pg.Queries,
	storageID, ingredientID uuid.UUID,
	eventType string,
	qtyIn, qtyOut, stockBefore, stockAfter float64,
	effectiveAt time.Time,
) {
	t.Helper()

	sourceType := "invoice"
	err := q.InsertIngredientStockMovement(ctx, pg.InsertIngredientStockMovementParams{
		ID:           uuid.New(),
		StorageID:    storageID,
		IngredientID: ingredientID,
		EventType:    eventType,
		QtyIn:        numericFromFloat(qtyIn),
		QtyOut:       numericFromFloat(qtyOut),
		StockBefore:  numericFromFloat(stockBefore),
		StockAfter:   numericFromFloat(stockAfter),
		PricePerUnit: numericFromFloat(0),
		SourceType:   &sourceType,
		EffectiveAt:  &pgtype.Timestamptz{Time: effectiveAt, Valid: true},
	})
	require.NoError(t, err)
}

// setLiveStock updates the ingredient_stock table to the given value.
// It upserts: creates if not exists, overwrites if exists.
func setLiveStock(t *testing.T, ctx context.Context, pool *pgxpool.Pool,
	storageID, ingredientID uuid.UUID, qty float64,
) {
	t.Helper()
	_, err := pool.Exec(ctx, `
		INSERT INTO ingredient_stock (id, ingredient_id, storage_id, branch_id, quantity, deleted_at)
		VALUES ($1, $2, $3, $4, $5, 0)
		ON CONFLICT (ingredient_id, storage_id)
		DO UPDATE SET quantity = EXCLUDED.quantity, updated_at = NOW()
	`, uuid.New(), ingredientID, storageID, globalEnv.branchID, fmt.Sprintf("%f", qty))
	require.NoError(t, err)
}

// getLiveStock reads ingredient_stock.quantity directly.
func getLiveStock(t *testing.T, ctx context.Context, pool *pgxpool.Pool,
	storageID, ingredientID uuid.UUID,
) float64 {
	t.Helper()
	var qty string
	err := pool.QueryRow(ctx,
		`SELECT COALESCE(quantity::text, '0') FROM ingredient_stock
		 WHERE ingredient_id = $1 AND storage_id = $2 AND deleted_at = 0`,
		ingredientID, storageID,
	).Scan(&qty)
	if err != nil {
		return 0
	}
	var f float64
	fmt.Sscanf(qty, "%f", &f)
	return f
}

// getSystemQtyFromMovements returns the point-in-time balance for an ingredient at a given time.
func getSystemQtyFromMovements(t *testing.T, ctx context.Context, pool *pgxpool.Pool,
	storageID, ingredientID uuid.UUID, asOf time.Time,
) float64 {
	t.Helper()
	var qty string
	err := pool.QueryRow(ctx, `
		SELECT COALESCE(stock_after::text, '0')
		FROM ingredient_stock_movements
		WHERE ingredient_id = $1 AND storage_id = $2
		  AND COALESCE(effective_at, created_at) <= $3
		ORDER BY COALESCE(effective_at, created_at) DESC, id DESC
		LIMIT 1
	`, ingredientID, storageID, asOf).Scan(&qty)
	if err != nil {
		return 0
	}
	var f float64
	fmt.Sscanf(qty, "%f", &f)
	return f
}

// createInventory inserts an inventory record and returns its ID.
func createInventory(t *testing.T, ctx context.Context, pool *pgxpool.Pool,
	storageID uuid.UUID, date time.Time, status string,
) uuid.UUID {
	t.Helper()
	id := uuid.New()
	_, err := pool.Exec(ctx, `
		INSERT INTO inventories (id, date, storage_id, status, surplus_amount, shortage_amount, remaining_amount, deleted_at)
		VALUES ($1, $2, $3, $4, 0, 0, 0, 0)
	`, id, pgtype.Date{Time: date, Valid: true}, storageID, status)
	require.NoError(t, err)
	return id
}

// upsertInventoryItem inserts or updates an inventory item.
func upsertInventoryItem(t *testing.T, ctx context.Context, pool *pgxpool.Pool,
	inventoryID, ingredientID uuid.UUID, counted, system float64,
) {
	t.Helper()
	_, err := pool.Exec(ctx, `
		INSERT INTO inventory_items (id, inventory_id, ingredient_id, counted_quantity, system_quantity, deleted_at)
		VALUES ($1, $2, $3, $4, $5, 0)
		ON CONFLICT (inventory_id, ingredient_id) DO UPDATE
		SET counted_quantity = EXCLUDED.counted_quantity,
		    system_quantity   = EXCLUDED.system_quantity,
		    updated_at        = NOW(), deleted_at = 0
	`, uuid.New(), inventoryID, ingredientID, fmt.Sprintf("%f", counted), fmt.Sprintf("%f", system))
	require.NoError(t, err)
}

// applyInventoryMovement writes an inventory correction movement and updates live stock.
// surplusOrShortage: positive = surplus (in), negative = shortage (out).
func applyInventoryMovement(t *testing.T, ctx context.Context, pool *pgxpool.Pool,
	storageID, ingredientID, inventoryID uuid.UUID,
	stockBefore, stockAfter float64,
	inventoryDate time.Time,
) {
	t.Helper()

	var eventType string
	if stockAfter > stockBefore {
		eventType = "inventory_surplus_in"
	} else {
		eventType = "inventory_shortage_out"
	}
	sourceType := "inventory"
	_, err := pool.Exec(ctx, `
		INSERT INTO ingredient_stock_movements
			(id, storage_id, ingredient_id, event_type, qty_in, qty_out, stock_before, stock_after, price_per_unit, source_type, source_id, effective_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 0, $9, $10, $11)
	`,
		uuid.New(), storageID, ingredientID, eventType,
		fmt.Sprintf("%f", max(0, stockAfter-stockBefore)),
		fmt.Sprintf("%f", max(0, stockBefore-stockAfter)),
		fmt.Sprintf("%f", stockBefore),
		fmt.Sprintf("%f", stockAfter),
		sourceType, inventoryID,
		pgtype.Timestamptz{Time: inventoryDate, Valid: true},
	)
	require.NoError(t, err)

	// Also update live stock to the corrected quantity
	_, err = pool.Exec(ctx, `
		INSERT INTO ingredient_stock (id, ingredient_id, storage_id, branch_id, quantity, deleted_at)
		VALUES ($1, $2, $3, $4, $5, 0)
		ON CONFLICT (ingredient_id, storage_id)
		DO UPDATE SET quantity = EXCLUDED.quantity, updated_at = NOW()
	`, uuid.New(), ingredientID, storageID, globalEnv.branchID, fmt.Sprintf("%f", stockAfter))
	require.NoError(t, err)
}

func max(a, b float64) float64 {
	if a > b {
		return a
	}
	return b
}

// getReport runs the ingredient report query and returns the first row for the ingredient.
func getReport(t *testing.T, ctx context.Context, q *pg.Queries,
	storageID, ingredientID uuid.UUID,
	start, end time.Time,
) *pg.IngredientReportRow {
	t.Helper()
	rows, err := q.GetIngredientReport(ctx, pg.GetIngredientReportParams{
		StorageID:    storageID,
		Start:        pgtype.Timestamptz{Time: start, Valid: true},
		End:          pgtype.Timestamptz{Time: end, Valid: true},
		IngredientID: &ingredientID,
		Limit:        100,
		Offset:       0,
	})
	require.NoError(t, err)
	if len(rows) == 0 {
		return nil
	}
	r := rows[0]
	return &r
}

// numericFromFloat converts float64 to pgtype.Numeric.
func numericFromFloat(f float64) pgtype.Numeric {
	n := pgtype.Numeric{}
	_ = n.Scan(fmt.Sprintf("%.6f", f))
	return n
}

// numericToFloat converts pgtype.Numeric to float64.
func numericToFloat(n pgtype.Numeric) float64 {
	if !n.Valid {
		return 0
	}
	v, _ := n.Float64Value()
	return v.Float64
}

// ts returns a UTC time.Time for convenience in tests.
func ts(year int, month time.Month, day, hour, minute int) time.Time {
	return time.Date(year, month, day, hour, minute, 0, 0, time.UTC)
}

// Reference Monday, Wednesday, Thursday used across tests.
// Using a fixed week so tests are deterministic.
var (
	monday    = ts(2026, time.January, 5, 0, 0)
	tuesday   = ts(2026, time.January, 6, 0, 0)
	wednesday = ts(2026, time.January, 7, 0, 0)
	thursday  = ts(2026, time.January, 8, 0, 0)
	friday    = ts(2026, time.January, 2, 0, 0)  // previous Friday
	saturday  = ts(2026, time.January, 3, 0, 0)  // previous Saturday
	sunday    = ts(2026, time.January, 4, 0, 0)  // previous Sunday
)

// assertFloat asserts that a float64 matches expected within 0.0001 tolerance.
func assertFloat(t *testing.T, expected, actual float64, msgAndArgs ...interface{}) {
	t.Helper()
	diff := expected - actual
	if diff < 0 {
		diff = -diff
	}
	require.True(t, diff < 0.001,
		fmt.Sprintf("expected %.6f, got %.6f: %v", expected, actual, strings.Join(toStringSlice(msgAndArgs), " ")))
}

func toStringSlice(args []interface{}) []string {
	var out []string
	for _, a := range args {
		out = append(out, fmt.Sprintf("%v", a))
	}
	return out
}
