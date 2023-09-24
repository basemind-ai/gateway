package config_test

import (
	"context"
	"github.com/basemind-ai/monorepo/shared/go/config"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestConfigGet(t *testing.T) {
	t.Run("successfully parses config", func(t *testing.T) {
		t.Setenv("DATABASE_URL", "postgresql://basemind:basemind@db:5432/basemind")
		t.Setenv("ENVIRONMENT", "development")
		t.Setenv("JWT_SECRET", "ABC123")
		t.Setenv("PORT", "3000")
		t.Setenv("REDIS_CONNECTION_STRING", "ABC123")

		cfg, err := config.Get(context.TODO())
		assert.Nil(t, err)
		assert.Equal(t, cfg.DatabaseUrl, "postgresql://basemind:basemind@db:5432/basemind")
		assert.Equal(t, cfg.Environment, "development")
		assert.Equal(t, cfg.JWTSecret, "ABC123")
		assert.Equal(t, cfg.Port, 3000)
		assert.Equal(t, cfg.RedisUrl, "ABC123")
	})
}
