package config

import (
	"context"
	"github.com/sethvargo/go-envconfig"
)

//goland:noinspection GoUnnecessarilyExportedIdentifiers
type Config struct {
	DatabaseURL string `env:"DATABASE_URL,required"`
	Environment string `env:"ENVIRONMENT,default=test"`
	Port        int    `env:"PORT,required"`
	RedisURL    string `env:"REDIS_CONNECTION_STRING,required"`
	JWTSecret   string `env:"JWT_SECRET,required"`
}

var (
	config *Config
	err    error
)

func Set(cfg *Config) {
	config = cfg
}

func Get(ctx context.Context) (*Config, error) {
	if config == nil {
		cfg := Config{}
		err = envconfig.Process(ctx, &cfg)
		Set(&cfg)
	}

	return config, err
}
