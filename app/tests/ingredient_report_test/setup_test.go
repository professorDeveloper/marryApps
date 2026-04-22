// Package ingredient_report_test contains integration tests for the ingredient report endpoint.
package ingredient_report_test

import (
	"context"
	"fmt"
	"os"
	"path/filepath"
	"runtime"
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
	q        *pg.Queries
	pool     *pgxpool.Pool
	branchID uuid.UUID
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

	// Seed shared fixtures: a branch
	branchID := uuid.New()
	_, _ = pool.Exec(ctx, `INSERT INTO branches (id, name, deleted_at) VALUES ($1, 'Test Branch', 0)`,
		branchID)

	q := pg.New(pool)
	globalEnv = &testEnv{
		q:        q,
		pool:     pool,
		branchID: branchID,
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
func newIngredient(t *testing.T, ctx context.Context, q *pg.Queries, name string, measurement string) uuid.UUID {
	t.Helper()
	id := uuid.New()
	var measurementVal pg.NullMeasurementType
	if measurement != "" {
		measurementVal.MeasurementType = pg.MeasurementType(measurement)
		measurementVal.Valid = true
	}
	_, err := q.CreateIngredient(ctx, pg.CreateIngredientParams{
		ID:          id,
		Name:        name,
		Measurement: measurementVal,
	})
	require.NoError(t, err)
	return id
}

// newStorage creates a fresh storage for a test.
func newStorage(t *testing.T, ctx context.Context, q *pg.Queries, name string) uuid.UUID {
	t.Helper()
	id := uuid.New()
	_, err := q.CreateStorage(ctx, pg.CreateStorageParams{
		ID:   id,
		Name: name,
	})
	require.NoError(t, err)
	return id
}

// insertMovement inserts an ingredient stock movement for a test.
func insertMovement(t *testing.T, ctx context.Context, pool *pgxpool.Pool, storageID, ingredientID uuid.UUID, eventType string, qtyIn, qtyOut float64, price float64, timestamp time.Time) {
	t.Helper()
	movementID := uuid.New()
	_, err := pool.Exec(ctx, `
		INSERT INTO ingredient_stock_movements (id, storage_id, ingredient_id, event_type, qty_in, qty_out, price_per_unit, effective_at, created_at, deleted_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 0)
	`, movementID, storageID, ingredientID, eventType, qtyIn, qtyOut, price, pgtype.Timestamptz{Time: timestamp, Valid: true}, pgtype.Timestamptz{Time: timestamp, Valid: true})
	require.NoError(t, err)
}

// ts returns a UTC time.Time for convenience in tests.
func ts(year int, month time.Month, day, hour, minute int) time.Time {
	return time.Date(year, month, day, hour, minute, 0, 0, time.UTC)
}
