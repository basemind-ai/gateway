package config

import (
	"context"
	"github.com/sethvargo/go-envconfig"
	"sync"
)

// Config - the shared configuration object.
//
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
	once   sync.Once
)

// Get - returns the config object.
// Panics if the config is not initialized.
// This function is idempotent.
func Get(ctx context.Context) *Config {
	once.Do(func() {
		config = &Config{}
		if err := envconfig.Process(ctx, config); err != nil {
			panic(err)
		}
	})

	return config
}
