package migrate

import (
	"context"
	"database/sql"
	"fmt"
	"log"
	"os"
	"path/filepath"

	"github.com/golang-migrate/migrate/v4"
	"github.com/golang-migrate/migrate/v4/database/postgres"
	"github.com/jackc/pgx/v5/pgxpool"

	_ "github.com/golang-migrate/migrate/v4/source/file"
	_ "github.com/lib/pq"
)

func RunMigrations(ctx context.Context, pool *pgxpool.Pool) error {
	fmt.Println("Running migrations for main database...")

	pgConfig := pool.Config()
	connString := pgConfig.ConnString()
	connString += "?sslmode=disable"

	db, err := sql.Open("postgres", connString)
	if err != nil {
		return fmt.Errorf("error creating db, sql.Open: %w", err)
	}

	driver, err := postgres.WithInstance(db, &postgres.Config{})
	if err != nil {
		return fmt.Errorf("error creating main DB driver: %w", err)
	}

	migrationsPath := getMigrationsFolderPath()
	m, err := migrate.NewWithDatabaseInstance(
		fmt.Sprintf("file://%s", migrationsPath),
		"postgres", driver,
	)
	if err != nil {
		return fmt.Errorf("error creating migration instance: %w", err)
	}

	if err := m.Up(); err != nil && err != migrate.ErrNoChange {
		return fmt.Errorf("error running migrations: %w", err)
	}

	fmt.Println("Main DB migrations applied successfully.")
	return nil
}

// getMigrationsFolderPath gets absolute migration folder path
func getMigrationsFolderPath() string {
	basePath, err := os.Getwd()
	if err != nil {
		log.Fatal("Error getting current directory:", err)
	}
	return filepath.Join(basePath, "migrations")
}
