package config

import (
	"context"
	"sync"

	"github.com/sethvargo/go-envconfig"
)

type Config struct {
	DatabaseURL string `env:"DATABASE_URL,required"`
	Environment string `env:"ENVIRONMENT,default=test"`
	Port        int    `env:"PORT,required"`
	RedisURL    string `env:"REDIS_CONNECTION_STRING,required"`
	JWTSecret   string `env:"JWT_SECRET,required"`
}

var (
	config Config
	once   sync.Once
	err    error
)

func Get(ctx context.Context) (Config, error) {
	once.Do(func() {
		err = envconfig.Process(ctx, &config)
	})
	return config, err
}
