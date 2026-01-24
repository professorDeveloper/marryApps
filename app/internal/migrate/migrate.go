package migrate

import (
	"context"
	"database/sql"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"strings"

	"github.com/golang-migrate/migrate/v4"
	"github.com/golang-migrate/migrate/v4/database/postgres"
	"github.com/jackc/pgx/v5/pgxpool"

	_ "github.com/golang-migrate/migrate/v4/source/file"
	_ "github.com/lib/pq"
)

func RunMigrations(ctx context.Context, pool *pgxpool.Pool) error {
	return RunMigrationsFromSubdir(ctx, pool, "")
}

func RunMigrationsFromSubdir(ctx context.Context, pool *pgxpool.Pool, migrationsSubdir string) error {
	fmt.Println("Running migrations...")

	pgConfig := pool.Config()
	connString := pgConfig.ConnString()
	sep := "?"
	if strings.Contains(connString, "?") {
		sep = "&"
	}
	connString += sep + "sslmode=disable"

	db, err := sql.Open("postgres", connString)
	if err != nil {
		return fmt.Errorf("error creating db, sql.Open: %w", err)
	}
	defer db.Close()

	driver, err := postgres.WithInstance(db, &postgres.Config{})
	if err != nil {
		return fmt.Errorf("error creating postgres driver: %w", err)
	}

	migrationsPath := getMigrationsFolderPath(migrationsSubdir)
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

	fmt.Println("postgres migrations applied successfully.")
	return nil
}

// CreateTenantSchema creates a new schema for a tenant
func CreateTenantSchema(ctx context.Context, pool *pgxpool.Pool, schemaName string) error {
	query := fmt.Sprintf("CREATE SCHEMA IF NOT EXISTS %s", schemaName)
	if _, err := pool.Exec(ctx, query); err != nil {
		return fmt.Errorf("failed to create schema %s: %w", schemaName, err)
	}
	fmt.Printf("Schema %s created successfully.\n", schemaName)
	return nil
}

// RunMigrationsInSchema runs migrations in a specific schema
// This creates a temporary connection with search_path set to the target schema
func RunMigrationsInSchema(ctx context.Context, pool *pgxpool.Pool, schemaName string) error {
	fmt.Printf("Running migrations in schema %s...\n", schemaName)

	pgConfig := pool.Config()
	connString := pgConfig.ConnString()
	sep := "?"
	if strings.Contains(connString, "?") {
		sep = "&"
	}
	connString += sep + "sslmode=disable&search_path=" + schemaName

	db, err := sql.Open("postgres", connString)
	if err != nil {
		return fmt.Errorf("error creating db, sql.Open: %w", err)
	}
	defer db.Close()

	driver, err := postgres.WithInstance(db, &postgres.Config{
		SchemaName: schemaName,
	})
	if err != nil {
		return fmt.Errorf("error creating postgres driver: %w", err)
	}

	migrationsPath := getMigrationsFolderPath("tenants")
	m, err := migrate.NewWithDatabaseInstance(
		fmt.Sprintf("file://%s", migrationsPath),
		"postgres", driver,
	)
	if err != nil {
		return fmt.Errorf("error creating migration instance: %w", err)
	}

	if err := m.Up(); err != nil && err != migrate.ErrNoChange {
		return fmt.Errorf("error running migrations in schema %s: %w", schemaName, err)
	}

	fmt.Printf("Migrations in schema %s applied successfully.\n", schemaName)
	return nil
}

func RunMigrationsForAllTenantSchemas(ctx context.Context, mainPool *pgxpool.Pool, tenantPool *pgxpool.Pool) error {
	rows, err := mainPool.Query(ctx, "SELECT brand_id FROM brands")
	if err != nil {
		return fmt.Errorf("failed to list brands: %w", err)
	}
	defer rows.Close()

	for rows.Next() {
		var brandID string
		if err := rows.Scan(&brandID); err != nil {
			return fmt.Errorf("failed to scan brand_id: %w", err)
		}

		schemaName := fmt.Sprintf("tenant_%s", brandID)
		if err := CreateTenantSchema(ctx, tenantPool, schemaName); err != nil {
			return err
		}
		if err := RunMigrationsInSchema(ctx, tenantPool, schemaName); err != nil {
			return err
		}
	}

	if err := rows.Err(); err != nil {
		return fmt.Errorf("failed to iterate brands: %w", err)
	}

	return nil
}

// getMigrationsFolderPath gets absolute migration folder path
func getMigrationsFolderPath(migrationsSubdir string) string {
	basePath, err := os.Getwd()
	if err != nil {
		log.Fatal("Error getting current directory:", err)
	}
	if migrationsSubdir == "" {
		return filepath.Join(basePath, "migrations")
	}
	return filepath.Join(basePath, "migrations", migrationsSubdir)
}
