package app

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/labstack/echo/v4"
	"gitlab.yurtal.tech/company/blitz/back/internal/config"
	"gitlab.yurtal.tech/company/blitz/back/internal/handler"
	"gitlab.yurtal.tech/company/blitz/back/internal/migrate"
	"gitlab.yurtal.tech/company/blitz/back/internal/repository"
	"gitlab.yurtal.tech/company/blitz/back/internal/service"
	"gitlab.yurtal.tech/company/blitz/back/pkg/logger"
	"gitlab.yurtal.tech/company/blitz/back/pkg/minio"
	pg "gitlab.yurtal.tech/company/blitz/back/pkg/postgres"
)

// Run - runs a new app instance.
func Run(cfg *config.Config) {
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	l := logger.New(cfg.Logger.Level)
	e := echo.New()

	// Postgres Client
	pgClient, err := pg.New(pg.Username(cfg.Postgres.User), pg.Password(cfg.Postgres.Password),
		pg.Host(cfg.Postgres.Host), pg.Port(cfg.Postgres.Port),
		pg.Database(cfg.Postgres.Db), pg.MaxPoolSize(cfg.Postgres.MaxPoolSize))
	if err != nil {
		l.Fatalf("app - Run - pg.New: %v", err)
	}
	defer pgClient.Close()

	// Run migrations
	err = migrate.RunMigrations(ctx, pgClient.Pool)
	if err != nil {
		l.Fatalf("app - Run - RunMigrations: %v", err)
	}

	minioClient, err := minio.New(minio.Endpoint(cfg.Minio.Endpoint), minio.AccessKeyID(cfg.Minio.AccessKey), minio.SecretAccessKey(cfg.Minio.SecretKey))
	if err != nil {
		l.Fatalf("app - Run - minio.New: %v", err)
	}

	// Repositories compiled by sqlc
	repos := repository.New(pgClient, minioClient)

	// Services
	service := service.New(cfg, repos)

	// Handlers
	handler := handler.New(l, cfg, service)
	handler.Register(e)

	errc := make(chan error)

	go func() {
		c := make(chan os.Signal, 1)
		signal.Notify(c, syscall.SIGINT, syscall.SIGTERM)
		errc <- fmt.Errorf("%s", <-c)
	}()

	// Start server
	go func() {
		l.Info("starting server on %s", fmt.Sprintf(":%d", cfg.Server.Http.Port))
		if err := e.Start(fmt.Sprintf(":%d", cfg.Server.Http.Port)); err != nil && err != http.ErrServerClosed {
			l.Fatalf("app - Run - e.Start: %v", err)
		}
	}()

	// Wait for stop signal
	err = <-errc
	l.Infof("shutdown initiated: %v", err)

	cancel() // notify all routines

	ctxShutdown, cancelShutdown := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancelShutdown()

	if err := e.Shutdown(ctxShutdown); err != nil {
		l.Errorf("server shutdown: %v", err)
	}

	l.Info("exited cleanly")
}
