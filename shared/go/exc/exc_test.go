package exc_test

import (
	"github.com/basemind-ai/monorepo/shared/go/exc"
	"github.com/stretchr/testify/assert"
	"testing"
)

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
}
