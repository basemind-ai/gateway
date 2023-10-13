package testutils

import (
	"os"
	"testing"
	"time"
)

func SetTestEnv(t *testing.T) {
	t.Helper()
	t.Setenv("DATABASE_URL", "postgresql://basemind:basemind@db:5432/basemind")
	t.Setenv("ENVIRONMENT", "development")
	t.Setenv("JWT_SECRET", "ABC123")
	t.Setenv("PORT", "3000")
	t.Setenv("REDIS_CONNECTION_STRING", "ABC123")
}

func GetSleepTimeout() time.Duration {
	sleepTimeout, err := time.ParseDuration(os.Getenv("TEST_SLEEP_TIMEOUT"))
	if err != nil {
		return 100 * time.Millisecond
	}

	return sleepTimeout
}