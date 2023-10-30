package exc_test

import (
	"github.com/basemind-ai/monorepo/shared/go/exc"
	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"io"
	"testing"
)

type testWriter struct {
	io.Writer
	mock.Mock
}

func (t *testWriter) Write(p []byte) (n int, err error) {
	args := t.Called(p)
	return args.Int(0), args.Error(1)
}

func TestExcUtils(t *testing.T) {
	t.Run("Must", func(t *testing.T) {
		t.Run("should panic if error is not nil", func(t *testing.T) {
			assert.Panics(t, func() {
				exc.Must(assert.AnError)
			})
		})
		t.Run("should not panic if error is nil", func(t *testing.T) {
			assert.NotPanics(t, func() {
				exc.Must(nil)
			})
		})
	})

	t.Run("MustResult", func(t *testing.T) {
		t.Run("should panic if error is not nil", func(t *testing.T) {
			assert.Panics(t, func() {
				exc.MustResult("value", assert.AnError)
			})
		})
		t.Run("should not panic if error is nil", func(t *testing.T) {
			assert.NotPanics(t, func() {
				assert.Equal(t, "value", exc.MustResult("value", nil))
			})
		})
	})

	t.Run("LogIfErr", func(t *testing.T) {
		t.Run("should log if error is not nil", func(t *testing.T) {
			m := testWriter{}
			log.Logger = log.Output(zerolog.ConsoleWriter{Out: &m})
			m.On("Write", mock.Anything).Return(0, nil)
			assert.NotPanics(t, func() {
				exc.LogIfErr(assert.AnError)
			})

			m.AssertExpectations(t)
		})
		t.Run("should not log if error is nil", func(t *testing.T) {
			m := testWriter{}
			log.Logger = log.Output(zerolog.ConsoleWriter{Out: &m})
			assert.NotPanics(t, func() {
				exc.LogIfErr(nil)
			})

			m.AssertNotCalled(t, "Write")
		})
	})
}
