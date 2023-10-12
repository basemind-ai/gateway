package repositories_test

import (
	"context"
	"testing"
	"time"

	"github.com/basemind-ai/monorepo/e2e/factories"
	"github.com/basemind-ai/monorepo/services/dashboard-backend/internal/repositories"
	"github.com/stretchr/testify/assert"
)

func TestPromptRequestRecordRepository(t *testing.T) {
	project, _ := factories.CreateProject(context.TODO())
	application, _ := factories.CreateApplication(context.TODO(), project.ID)
	promptConfig, _ := factories.CreatePromptConfig(context.TODO(), application.ID)
	factories.CreatePromptRequestRecord(context.TODO(), promptConfig.ID)

	t.Run("get total prompt request by date range", func(t *testing.T) {
		fromDate := time.Now().AddDate(0, 0, -1)
		toDate := fromDate.AddDate(0, 0, 2)

		_, dbErr := repositories.GetPromptRequestCountByDateRange(context.TODO(), application.ID, fromDate, toDate)
		assert.NoError(t, dbErr)
		// assert.Equal(t, int64(2), totalRequests)
	})
}
