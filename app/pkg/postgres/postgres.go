package postgres

import (
	"context"
	"fmt"
	"log"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

const (
	_defaultMaxPoolSize  = 10
	_defaultConnAttempts = 10
	_defaultConnTimeout  = time.Second
)

type Postgres struct {
	username string
	password string
	host     string
	port     int
	database string

	simpleProtocol bool

	maxPoolSize  int32
	connAttempts int
	connTimeout  time.Duration

	Pool *pgxpool.Pool
}

func New(opts ...Option) (*Postgres, error) {
	pool, err := openPoolWithOptions(opts...)
	pg := &Postgres{
		Pool: pool,
	}
	return pg, err
}

func (p *Postgres) Close() {
	if p.Pool != nil {
		p.Pool.Close()
	}
}

func tryToConnectWithAttempts(ctx context.Context, maxAttempts int, maxPoolSize int32, maxDelay time.Duration, simpleProtocol bool, dsn string) (pool *pgxpool.Pool, err error) {
	poolConfig, err := pgxpool.ParseConfig(dsn)
	if err != nil {
		log.Fatalf("Unable to parse config: %v\n", err)
	}
	poolConfig.MaxConns = maxPoolSize
	poolConfig.MinConns = 2
	poolConfig.MaxConnIdleTime = 5 * time.Minute
	poolConfig.MaxConnLifetime = 30 * time.Minute
	poolConfig.HealthCheckPeriod = 1 * time.Minute
	if simpleProtocol {
		poolConfig.ConnConfig.DefaultQueryExecMode = pgx.QueryExecModeSimpleProtocol
	}

	for maxAttempts > 0 {
		pool, err = pgxpool.NewWithConfig(ctx, poolConfig)
		if err == nil {
			break
		}

		log.Printf("trying to connect to postgres, attempts left: %d\n", maxAttempts)

		time.Sleep(maxDelay)

		maxAttempts--
	}

	if err != nil {
		return nil, fmt.Errorf("postgres - New - connAttempts == 0: %w", err)
	}

	return pool, err
}

func openPoolWithOptions(opts ...Option) (*pgxpool.Pool, error) {
	pg := &Postgres{
		maxPoolSize:  _defaultMaxPoolSize,
		connAttempts: _defaultConnAttempts,
		connTimeout:  _defaultConnTimeout,
	}
	for _, opt := range opts {
		opt(pg)
	}

	dsn := fmt.Sprintf(
		"postgresql://%s:%s@%s:%d/%s?sslmode=require",
		pg.username, pg.password,
		pg.host, pg.port, pg.database,
	)

	return tryToConnectWithAttempts(context.Background(), pg.connAttempts, pg.maxPoolSize, pg.connTimeout, pg.simpleProtocol, dsn)
}
