package redis

import (
	"context"
	"fmt"
	"log"
	"time"

	"github.com/go-redis/redis/v8"
)

const (
	_defaultConnAttempts = 10
	_defaultConnTimeout  = time.Second
)

type Redis struct {
	username           string
	password           string
	host               string
	port               int
	database           int
	minIdleConnections int
	poolSize           int
	poolTimeout        int

	connAttempts int
	connTimeout  time.Duration

	Pool *redis.Client
}

func New(opts ...Option) (rds *Redis, err error) {
	rds = &Redis{
		connAttempts: _defaultConnAttempts,
		connTimeout:  _defaultConnTimeout,
	}

	for _, opt := range opts {
		opt(rds)
	}

	addr := fmt.Sprintf("%s:%d", rds.host, rds.port)
	connConfig := &redis.Options{
		Addr:         addr,
		MinIdleConns: rds.minIdleConnections,
		PoolSize:     rds.poolSize,
		PoolTimeout:  time.Duration(rds.poolTimeout) * time.Second,
		Username:     rds.username,
		Password:     rds.password,
		DB:           rds.database,
	}

	for rds.connAttempts > 0 {
		rds.Pool = redis.NewClient(connConfig)
		_, err = rds.Pool.Ping(context.Background()).Result()
		if err == nil {
			break
		}

		log.Printf("PostgresConfig is trying to connect, attempts left: %d", rds.connAttempts)

		time.Sleep(rds.connTimeout)

		rds.connAttempts--
	}

	if err != nil {
		return nil, fmt.Errorf("redis - New - connAttempts == 0: %w", err)
	}

	return rds, nil
}

func (p *Redis) Close() {
	if p.Pool != nil {
		p.Pool.Close()
	}
}
