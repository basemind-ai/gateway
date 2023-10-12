package timeutils_test

import (
	"testing"
	"time"

	"github.com/basemind-ai/monorepo/shared/go/timeutils"
	"gotest.tools/v3/assert"
)

func TestGetFirstDayOfMonth(t *testing.T) {
	now := time.Now()
	year, month, _ := now.Date()
	location := now.Location()

	t.Run("get first day of the month", func(t *testing.T) {
		assert.Equal(t, time.Date(year, month, 1, 0, 0, 0, 0, location), timeutils.GetFirstDayOfMonth())
	})
}
