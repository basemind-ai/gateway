package logging

import (
	"os"
	"time"

	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"
)

// Configure configures the logger to print to console when cfg.Debug is true,
// otherwise use the zerolog structured logging.
func Configure(isDebug bool) {
	zerolog.TimeFieldFormat = zerolog.TimeFormatUnix
	if isDebug {
		zerolog.SetGlobalLevel(zerolog.DebugLevel)
		log.Logger = zerolog.New(zerolog.ConsoleWriter{Out: os.Stderr, TimeFormat: time.RFC3339})
	} else {
		zerolog.SetGlobalLevel(zerolog.InfoLevel)
		log.Logger = zerolog.New(os.Stderr).With().Timestamp().Logger()
	}
}
