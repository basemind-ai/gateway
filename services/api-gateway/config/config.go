package config

import (
	"context"
	"sync"

	"github.com/sethvargo/go-envconfig"
)

type Config struct {
	Port        int    `env:"PORT"`
	Environment string `env:"ENVIRONMENT"`
	BaseUrl     string `env:"BASE_URL"`
	DatabaseUrl string `env:"DATABASE_URL"`
	JWTSecret   string `env:"JWT_SECRET"`
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
