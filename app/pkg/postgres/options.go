package postgres

import "time"

type Option func(*Postgres)

func Username(username string) Option {
	return func(c *Postgres) {
		c.username = username
	}
}

func Password(password string) Option {
	return func(c *Postgres) {
		c.password = password
	}
}

func Host(host string) Option {
	return func(c *Postgres) {
		c.host = host
	}
}

func Port(port int) Option {
	return func(c *Postgres) {
		c.port = port
	}
}

func Database(database string) Option {
	return func(c *Postgres) {
		c.database = database
	}
}

func MaxPoolSize(size int32) Option {
	return func(c *Postgres) {
		c.maxPoolSize = size
	}
}

func ConnAttempts(attempts int) Option {
	return func(c *Postgres) {
		c.connAttempts = attempts
	}
}

func ConnTimeout(timeout time.Duration) Option {
	return func(c *Postgres) {
		c.connTimeout = timeout
	}
}
