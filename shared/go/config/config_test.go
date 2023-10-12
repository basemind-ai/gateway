package config_test

import (
	"context"
	"github.com/basemind-ai/monorepo/shared/go/config"
	"github.com/basemind-ai/monorepo/shared/go/testutils"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestConfigGet(t *testing.T) {
	t.Run("successfully parses config", func(t *testing.T) {
		testutils.SetTestEnv(t)
		cfg, err := config.Get(context.TODO())
		assert.Nil(t, err)
		assert.Equal(t, cfg.DatabaseURL, "postgresql://basemind:basemind@db:5432/basemind")
		assert.Equal(t, cfg.Environment, "development")
		assert.Equal(t, cfg.JWTSecret, "ABC123")
		assert.Equal(t, cfg.Port, 3000)
		assert.Equal(t, cfg.RedisURL, "ABC123")
	})
}
