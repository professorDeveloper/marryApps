package config

import (
	"fmt"
	"os"
	"path/filepath"

	"github.com/ilyakaznacheev/cleanenv"
)

type (
	Config struct {
		App      AppConfig      `yaml:"app"`
		Server   ServerConfig   `yaml:"server"`
		Postgres PostgresConfig `yaml:"postgres"`
		Redis    RedisConfig    `yaml:"redis"`
		Minio    MinioConfig    `yaml:"minio"`
		Security SecurityConfig `yaml:"security"`
		Cookie   CookieConfig   `yaml:"cookie"`
		Session  SessionConfig  `yaml:"session"`
		Metrics  MetricsConfig  `yaml:"metrics"`
		Logger   LoggerConfig   `yaml:"logger"`
		Jwt      JwtConfig      `yaml:"jwt"`
		Google   GoogleConfig   `yaml:"google"`
	}

	AppConfig struct {
		Name          string `yaml:"name"    env:"APP_NAME"`
		Version       string `yaml:"version" env:"APP_VERSION"`
		IsDebug       bool   `yaml:"is-debug" env:"APP_IS_DEBUG"`
		IsDevelopment bool   `yaml:"is-development" env:"APP_IS_DEVELOPMENT"`
	}
	GoogleConfig struct {
		AndroidClientId string `yaml:"android-client-id" env:"GOOGLE_ANDROID_CLIENT_ID"`
		IOSClientId string `yaml:"ios-client-id" env:"GOOGLE_IOS_CLIENT_ID"`
		WebClientId string `yaml:"web-client-id" env:"GOOGLE_WEB_CLIENT_ID"`
		WebClientSecret string `yaml:"web-client-secret" env:"GOOGLE_WEB_CLIENT_SECRET"`
	}
	ServerConfig struct {
		Http              HttpConfig `yaml:"http"`
		CtxDefaultTimeout int        `yaml:"ctx-default-timeout" env:"SERVER_CTX_DEFAULT_TIMEOUT"`
		MaxConnectionIdle int        `yaml:"max-connection-idle" env:"SERVER_MAX_CONNECTION_IDLE"`
		Timeout           int        `yaml:"timeout" env:"SERVER_TIMEOUT"`
		MaxConnectionAge  int        `yaml:"max-connection-age" env:"SERVER_MAX_CONNECTION_AGE"`
	}

	HttpConfig struct {
		Ip           string     `yaml:"ip" env:"HTTP_IP"`
		Port         int        `yaml:"port" env:"HTTP_PORT"`
		ReadTimeout  int        `yaml:"read-timeout" env:"HTTP_READ_TIMEOUT"`
		WriteTimeout int        `yaml:"write-timeout" env:"HTTP_WRITE_TIMEOUT"`
		Cors         CorsConfig `yaml:"cors"`
		Ssl          bool       `yaml:"ssl" env:"HTTP_SSL"`
	}

	CorsConfig struct {
		AllowedMethods     []string `yaml:"allowed-methods" env:"HTTP_CORS_ALLOWED_METHODS"`
		AllowedOrigins     []string `yaml:"allowed-origins" env:"HTTP_CORS_ALLOWED_ORIGINS"`
		AllowCredentials   bool     `yaml:"allow-credentials" env:"HTTP_CORS_ALLOW_CREDENTIALS"`
		AllowedHeaders     []string `yaml:"allowed-headers" env:"HTTP_CORS_ALLOWED_HEADERS"`
		OptionsPassThrough bool     `yaml:"options-pass-through" env:"HTTP_CORS_OPTIONS_PASS_THROUGH"`
		ExposedHeaders     []string `yaml:"exposed-headers" env:"HTTP_CORS_EXPOSED_HEADERS"`
		Debug              bool     `yaml:"debug" env:"HTTP_CORS_DEBUG"`
	}

	JwtConfig struct {
		AccessToken  AccessTokenConfig  `yaml:"access-token"`
		RefreshToken RefreshTokenConfig `yaml:"refresh-token"`
		SecretKey    string             `yaml:"secret-key" env:"JWT_SECRET_KEY"`
	}

	AccessTokenConfig struct {
		PrivateKey string `yaml:"private-key" env:"JWT_ACCESS_TOKEN_PRIVATE_KEY"`
		PublicKey  string `yaml:"public-key" env:"JWT_ACCESS_TOKEN_PUBLIC_KEY"`
		ExpiresIn  int    `yaml:"expires-in" env:"JWT_ACCESS_TOKEN_EXPIRES_IN"`
		MaxAge     int    `yaml:"max-age" env:"JWT_ACCESS_TOKEN_MAX_AGE"`
	}

	RefreshTokenConfig struct {
		PrivateKey string `yaml:"private-key" env:"JWT_REFRESH_TOKEN_PRIVATE_KEY"`
		PublicKey  string `yaml:"public-key" env:"JWT_REFRESH_TOKEN_PUBLIC_KEY"`
		ExpiresIn  int    `yaml:"expires-in" env:"JWT_REFRESH_TOKEN_EXPIRES_IN"`
		MaxAge     int    `yaml:"max-age" env:"JWT_REFRESH_TOKEN_MAX_AGE"`
	}

	LoggerConfig struct {
		Level string `yaml:"level" env:"LOGGER_LEVEL"`
	}

	PostgresConfig struct {
		Host        string `yaml:"host" env:"POSTGRES_HOST"`
		Port        int    `yaml:"port" env:"POSTGRES_PORT"`
		User        string `yaml:"user" env:"POSTGRES_USER"`
		Db          string `yaml:"db" env:"POSTGRES_DB"`
		Password    string `yaml:"password" env:"POSTGRES_PASSWORD"`
		Ssl         bool   `yaml:"ssl" env:"POSTGRES_SSL"`
		MaxPoolSize int32  `yaml:"max-pool-size" env:"POSTGRES_MAX_POOL_SIZE"`
		Driver      string `yaml:"driver" env:"POSTGRES_DRIVER"`
	}

	RedisConfig struct {
		Username           string `yaml:"username" env:"REDIS_USERNAME"`
		Host               string `yaml:"host" env:"REDIS_HOST"`
		Password           string `yaml:"password" env:"REDIS_PASSWORD"`
		Port               int    `yaml:"port" env:"REDIS_PORT"`
		Db                 int    `yaml:"db" env:"REDIS_DB"`
		MinIdleConnections int    `yaml:"min-idle-connections" env:"REDIS_MIN_IDLE_CONNECTIONS"`
		PoolSize           int    `yaml:"pool-size" env:"REDIS_POOL_SIZE"`
		PoolTimeout        int    `yaml:"pool-timeout" env:"REDIS_POOL_TIMEOUT"`
	}

	MinioConfig struct {
		Endpoint  string `yaml:"endpoint" env:"MINIO_ENDPOINT"`
		AccessKey string `env:"MINIO_ACCESS_KEY"`
		SecretKey string `env:"MINIO_SECRET_KEY"`
		UseSSL    bool   `yaml:"use-ssl" env:"MINIO_USE_SSL"`
	}

	SecurityConfig struct {
		PasswordEncryptKey string `yaml:"password-encrypt-key" env:"PASSWORD_ENCRYPT_KEY"`
	}

	CookieConfig struct {
		Name     string `yaml:"name" env:"COOKIE_NAME"`
		MaxAge   int    `yaml:"max-age" env:"COOKIE_MAX_AGE"`
		Secure   bool   `yaml:"secure" env:"COOKIE_SECURE"`
		HttpOnly bool   `yaml:"http-only" env:"COOKIE_HTTP_ONLY"`
	}

	SessionConfig struct {
		Prefix string `yaml:"prefix" env:"SESSION_PREFIX"`
		Name   string `yaml:"name" env:"SESSION_NAME"`
		Expire int    `yaml:"expire" env:"SESSION_EXPIRE"`
	}

	MetricsConfig struct {
		Host        string `yaml:"host" env:"METRICS_HOST"`
		Port        int    `yaml:"port" env:"METRICS_PORT"`
		ServiceName string `yaml:"service-name" env:"METRICS_SERVICE_NAME"`
	}
)

func New() (*Config, error) {
	cfg := &Config{}

	moduleDir, err := filepath.Abs(".")
	if err != nil {
		return nil, fmt.Errorf("failed to resolve config directory: %w", err)
	}

	configDir := filepath.Join(moduleDir, "internal", "config")
	configPath := filepath.Join(configDir, "config.yml")
	envPath := filepath.Join(moduleDir, ".env")

	if fileExists(configPath) {
		err = cleanenv.ReadConfig(configPath, cfg)
		if err != nil {
			return nil, fmt.Errorf("config error while reading from yml: %w", err)
		}
	} else {
		fmt.Println("Warning: config.yml not found, skipping...")
	}

	if fileExists(envPath) {
		err = cleanenv.ReadConfig(envPath, cfg)
		if err != nil {
			return nil, fmt.Errorf("config error while reading from .env: %w", err)
		}
	} else {
		fmt.Println("Warning: .env file not found, skipping...")
	}

	err = cleanenv.ReadEnv(cfg)
	if err != nil {
		return nil, err
	}
	fmt.Printf("App Config Loaded: %s (Debug: %v)\n", cfg.App.Name, cfg.App.IsDebug)

	return cfg, nil
}

func fileExists(filename string) bool {
	_, err := os.Stat(filename)
	return err == nil
}
