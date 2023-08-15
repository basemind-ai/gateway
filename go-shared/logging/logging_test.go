package logging_test

import (
	"testing"

	"github.com/stretchr/testify/assert"

	"github.com/basemind-ai/backend-services/go-shared/logging"
	"github.com/rs/zerolog"
)

func TestConfigLogger(t *testing.T) {
	t.Run("it sets global debug level when passed isDebug == true", func(t *testing.T) {
		logging.Configure(true)
		assert.Equal(t, zerolog.GlobalLevel(), zerolog.DebugLevel)
	})
	t.Run("it sets global info level when passed isDebug == false", func(t *testing.T) {
		logging.Configure(false)
		assert.Equal(t, zerolog.GlobalLevel(), zerolog.InfoLevel)
	})
}
