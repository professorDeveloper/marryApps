package app

import (
	"context"
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/labstack/echo/v4"
	echoSwagger "github.com/swaggo/echo-swagger"
	"gitlab.yurtal.tech/company/maryai/back/internal/config"
	"gitlab.yurtal.tech/company/maryai/back/internal/handler"
	"gitlab.yurtal.tech/company/maryai/back/internal/migrate"
	"gitlab.yurtal.tech/company/maryai/back/internal/repository"
	"gitlab.yurtal.tech/company/maryai/back/internal/service"
	"gitlab.yurtal.tech/company/maryai/back/pkg/logger"
	"gitlab.yurtal.tech/company/maryai/back/pkg/minio"
	"gitlab.yurtal.tech/company/maryai/back/pkg/paymentClick"
	"gitlab.yurtal.tech/company/maryai/back/pkg/paymentPayme"
	pg "gitlab.yurtal.tech/company/maryai/back/pkg/postgres"
	"gitlab.yurtal.tech/company/maryai/back/pkg/validate"

	_ "gitlab.yurtal.tech/company/maryai/back/internal/api/docs"
)

// @title MaryAI API
// @version 1.0
// @description MaryAI API server with multi-language support (uz, ru, en)
// @host back.maryai.yurtal.tech
// @BasePath /
// @schemes https

// @securityDefinitions.apiKey BearerAuth
// @in header
// @name Authorization
// @description Type "Bearer" followed by a space and your JWT token

func Run(cfg *config.Config) {
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	l := logger.New(cfg.Logger.Level)

	validate.Init()

	clickClient := paymentClick.NewClient(slog.Default(), http.DefaultClient, paymentClick.BaseUrl(cfg.Click.Url), paymentClick.MerchantUserId(cfg.Click.MerchantUserID), paymentClick.SecretKey(cfg.Click.SecretKey), paymentClick.ServiceId(cfg.Click.ServiceID), paymentClick.MerchantId(cfg.Click.MerchantID), paymentClick.ReturnUrl(cfg.Click.ReturnUrl))
	paymeClient := paymentPayme.NewClient(slog.Default(), http.DefaultClient, paymentPayme.BaseUrl(cfg.Payme.Url), paymentPayme.ClientKey(cfg.Payme.ClientKey), paymentPayme.MerchantId(cfg.Payme.MerchantID), paymentPayme.Login(cfg.Payme.Login), paymentPayme.Password(cfg.Payme.Password), paymentPayme.ReturnUrl(cfg.Payme.ReturnUrl))

	e := echo.New()

	mainPgClient, err := pg.New(pg.Username(cfg.MainPostgres.User), pg.Password(cfg.MainPostgres.Password),
		pg.Host(cfg.MainPostgres.Host), pg.Port(cfg.MainPostgres.Port),
		pg.Database(cfg.MainPostgres.Db), pg.MaxPoolSize(cfg.MainPostgres.MaxPoolSize))
	if err != nil {
		l.Fatalf("app - Run - pg.New(main): %v", err)
	}
	defer mainPgClient.Close()

	tenantPgClient, err := pg.New(pg.Username(cfg.Postgres.User), pg.Password(cfg.Postgres.Password),
		pg.Host(cfg.Postgres.Host), pg.Port(cfg.Postgres.Port),
		pg.Database(cfg.Postgres.Db), pg.MaxPoolSize(cfg.Postgres.MaxPoolSize))
	if err != nil {
		l.Fatalf("app - Run - pg.New(tenant): %v", err)
	}
	defer tenantPgClient.Close()

	err = migrate.RunMigrationsFromSubdir(ctx, mainPgClient.Pool, "main")
	if err != nil {
		l.Fatalf("app - Run - RunMigrations(main): %v", err)
	}

	globalUsername := cfg.GlobalSA.Username
	globalPassword := cfg.GlobalSA.Password
	globalEmail := cfg.GlobalSA.Email
	if globalUsername != "" && globalPassword != "" && globalEmail != "" {
		_, sErr := mainPgClient.Pool.Exec(
			ctx,
			"INSERT INTO users (username, password, email, role) VALUES ($1, $2, $3, 'superadmin') ON CONFLICT (username) DO UPDATE SET password = EXCLUDED.password, email = EXCLUDED.email, role = 'superadmin', updated_at = NOW()",
			globalUsername,
			globalPassword,
			globalEmail,
		)
		if sErr != nil {
			l.Fatalf("app - Run - seed global superadmin: %v", sErr)
		}
		l.Info("seeded global superadmin in main DB")
	}

	err = migrate.RunMigrationsFromSubdir(ctx, tenantPgClient.Pool, "tenants")
	if err != nil {
		l.Fatalf("app - Run - RunMigrations(tenants): %v", err)
	}

	minioClient, err := minio.New(minio.Endpoint(cfg.Minio.Endpoint), minio.AccessKeyID(cfg.Minio.AccessKey), minio.SecretAccessKey(cfg.Minio.SecretKey), minio.UseSSL(cfg.Minio.UseSSL))
	if err != nil {
		l.Fatalf("app - Run - minio.New: %v", err)
	}

	repos := repository.New(mainPgClient.Pool, tenantPgClient.Pool, minioClient)

	service := service.New(cfg, repos, clickClient, paymeClient, minioClient)

	handler := handler.New(l, cfg, service, repos)
	handler.Register(e)

	e.GET("/swagger/*", echoSwagger.WrapHandler)

	errc := make(chan error)

	go func() {
		c := make(chan os.Signal, 1)
		signal.Notify(c, syscall.SIGINT, syscall.SIGTERM)
		errc <- fmt.Errorf("%s", <-c)
	}()

	go func() {
		l.Info("starting server on %s", fmt.Sprintf(":%d", cfg.Server.Http.Port))
		if err := e.Start(fmt.Sprintf(":%d", cfg.Server.Http.Port)); err != nil && err != http.ErrServerClosed {
			l.Fatalf("app - Run - e.Start: %v", err)
		}
	}()

	err = <-errc
	l.Infof("shutdown initiated: %v", err)

	cancel()

	ctxShutdown, cancelShutdown := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancelShutdown()

	if err := e.Shutdown(ctxShutdown); err != nil {
		l.Errorf("server shutdown: %v", err)
	}

	l.Info("exited cleanly")
}
