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
	t.Setenv("GCP_PROJECT_ID", "basemind-ai-development")
	t.Setenv("JWT_SECRET", "ABC123")
	t.Setenv("PORT", "3000")
	t.Setenv("REDIS_CONNECTION_STRING", "ABC123")
	t.Setenv("URL_SIGNING_SECRET", "ABC123")
}

func UnsetTestEnv(t *testing.T) {
	t.Helper()
	_ = os.Unsetenv("DATABASE_URL")
	_ = os.Unsetenv("ENVIRONMENT")
	_ = os.Unsetenv("GCP_PROJECT_ID")
	_ = os.Unsetenv("JWT_SECRET")
	_ = os.Unsetenv("PORT")
	_ = os.Unsetenv("REDIS_CONNECTION_STRING")
	_ = os.Unsetenv("URL_SIGNING_SECRET")
}

func GetSleepTimeout() time.Duration {
	sleepTimeout, err := time.ParseDuration(os.Getenv("TEST_SLEEP_TIMEOUT"))
	if err != nil {
		return 100 * time.Millisecond
	}

	return sleepTimeout
}
