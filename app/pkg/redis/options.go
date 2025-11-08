package redis

import "time"

type Option func(redis *Redis)

func Username(username string) Option {
	return func(c *Redis) {
		c.username = username
	}
}

func Password(password string) Option {
	return func(c *Redis) {
		c.password = password
	}
}

func Host(host string) Option {
	return func(c *Redis) {
		c.host = host
	}
}

func Port(port int) Option {
	return func(c *Redis) {
		c.port = port
	}
}

func Database(database int) Option {
	return func(c *Redis) {
		c.database = database
	}
}

func MinIdleConnections(minIdleConnections int) Option {
	return func(c *Redis) {
		c.minIdleConnections = minIdleConnections
	}
}

func PoolSize(poolSize int) Option {
	return func(c *Redis) {
		c.poolSize = poolSize
	}
}

func PoolTimeout(poolTimeout int) Option {
	return func(c *Redis) {
		c.poolTimeout = poolTimeout
	}
}

func ConnAttempts(attempts int) Option {
	return func(c *Redis) {
		c.connAttempts = attempts
	}
}

func ConnTimeout(timeout time.Duration) Option {
	return func(c *Redis) {
		c.connTimeout = timeout
	}
}
