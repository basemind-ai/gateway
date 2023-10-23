package config //nolint: testpackage

import (
	"context"
	"github.com/basemind-ai/monorepo/shared/go/testutils"
	"sync"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestConfig(t *testing.T) {
	t.Run("panics if config is not set", func(t *testing.T) {
		testutils.UnsetTestEnv(t)
		assert.Panics(t, func() {
			_ = Get(context.Background())
		})
	})

	t.Run("successfully parses config", func(t *testing.T) {
		testutils.SetTestEnv(t)
		once = sync.Once{}

		cfg := Get(context.TODO())
		assert.Equal(t, cfg.DatabaseURL, "postgresql://basemind:basemind@db:5432/basemind")
		assert.Equal(t, cfg.Environment, "development")
		assert.Equal(t, cfg.JWTSecret, "ABC123")
		assert.Equal(t, cfg.Port, 3000)
		assert.Equal(t, cfg.RedisURL, "ABC123")
	})
}
