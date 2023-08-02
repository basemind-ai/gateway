package config

import (
	"context"
	"sync"

	"github.com/sethvargo/go-envconfig"
)

type Config struct {
	Port                int    `env:"PORT"`
	Environment         string `env:"ENVIRONMENT"`
	BaseUrl             string `env:"BASE_URL"`
	FirebaseClientEmail string `env:"FIREBASE_CLIENT_EMAIL"`
	FirebaseProjectId   string `env:"FIREBASE_PROJECT_ID"`
	FirebasePrivateKey  string `env:"FIREBASE_PRIVATE_KEY"`
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
