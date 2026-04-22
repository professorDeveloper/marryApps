// Package goods_report_test contains integration tests for the goods report endpoint.
package goods_report_test

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

// newGood creates a fresh good for a test.
func newGood(t *testing.T, ctx context.Context, q *pg.Queries, name string, price float64) uuid.UUID {
	t.Helper()
	id := uuid.New()
	categoryID := uuid.New()

	_, err := q.CreateCategory(ctx, pg.CreateCategoryParams{
		ID:   categoryID,
		Name: name + " Category",
	})
	require.NoError(t, err)

	priceNum := pgtype.Numeric{}
	_ = priceNum.Scan(fmt.Sprintf("%.2f", price))
	cookTime := int32(10)
	categoryIDpg := pgtype.UUID{Bytes: categoryID, Valid: true}

	_, err = q.CreateGood(ctx, pg.CreateGoodParams{
		ID:         id,
		Name:       name,
		CategoryID: categoryIDpg,
		Price:      priceNum,
		CookTime:   &cookTime,
	})
	require.NoError(t, err)
	return id
}

// newOrder creates a paid order with the given goods and quantities.
func newOrder(t *testing.T, ctx context.Context, pool *pgxpool.Pool, branchID uuid.UUID, items []orderItem, orderTime time.Time) uuid.UUID {
	t.Helper()
	orderID := uuid.New()

	// Create order
	_, err := pool.Exec(ctx, `
		INSERT INTO orders (id, branch_id, status, bill_status, total_amount, paid_amount, created_at, deleted_at)
		VALUES ($1, $2, 'closed', 'paid', 0, 0, $3, 0)
	`, orderID, branchID, pgtype.Timestamptz{Time: orderTime, Valid: true})
	require.NoError(t, err)

	// Create order items
	for _, item := range items {
		orderItemID := uuid.New()
		_, err := pool.Exec(ctx, `
			INSERT INTO order_items (id, order_id, good_id, quantity, price, cost_price, created_at, deleted_at)
			VALUES ($1, $2, $3, $4, $5, $6, $7, 0)
		`, orderItemID, orderID, item.GoodID, item.Quantity, item.Price, item.CostPrice, pgtype.Timestamptz{Time: orderTime, Valid: true})
		require.NoError(t, err)
	}

	return orderID
}

type orderItem struct {
	GoodID    uuid.UUID
	Quantity  int64
	Price     float64
	CostPrice float64
}

// ts returns a UTC time.Time for convenience in tests.
func ts(year int, month time.Month, day, hour, minute int) time.Time {
	return time.Date(year, month, day, hour, minute, 0, 0, time.UTC)
}
