package exc

import (
	"github.com/rs/zerolog/log"
	"strings"
)

// MustResult - panics if the error is not nil, otherwise returns the result.
func MustResult[T any](value T, err error, messages ...string) T {
	if err != nil {
		log.Error().Err(err).Msg(strings.Join(messages, " "))
		panic(err)
	}
	return value
}

// Must - panics if the error is not nil.
func Must(err error, messages ...string) {
	if err != nil {
		log.Error().Err(err).Msg(strings.Join(messages, " "))
		panic(err)
	}
}

// LogIfErr - logs the error if it is not nil.
func LogIfErr(err error, messages ...string) {
	if err != nil {
		log.Error().Err(err).Msg(strings.Join(messages, " "))
	}
}
