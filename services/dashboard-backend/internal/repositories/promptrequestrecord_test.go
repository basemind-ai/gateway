package repositories_test

import (
	"context"
	"testing"
	"time"

	"github.com/basemind-ai/monorepo/e2e/factories"
	"github.com/basemind-ai/monorepo/services/dashboard-backend/internal/repositories"
	"github.com/basemind-ai/monorepo/shared/go/db"
	"github.com/basemind-ai/monorepo/shared/go/tokenutils"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/stretchr/testify/assert"
)

func TestPromptRequestRecordRepository(t *testing.T) {
	project, _ := factories.CreateProject(context.TODO())
	application, _ := factories.CreateApplication(context.TODO(), project.ID)
	promptConfig, _ := factories.CreatePromptConfig(context.TODO(), application.ID)
	factories.CreatePromptRequestRecord(context.TODO(), promptConfig.ID)

	fromDate := time.Now().AddDate(0, 0, -1)
	toDate := fromDate.AddDate(0, 0, 2)
	totalTokensUsed := int64(20)

	t.Run("GetPromptRequestCountByDateRange", func(t *testing.T) {
		t.Run("get total prompt requests by date range", func(t *testing.T) {
			totalRequests, dbErr := repositories.GetPromptRequestCountByDateRange(
				context.TODO(),
				application.ID,
				fromDate,
				toDate,
			)
			assert.NoError(t, dbErr)
			assert.Equal(t, int64(1), totalRequests)
		})

		t.Run("fails to get total prompt requests for invalid application id", func(t *testing.T) {
			invalidAppId := pgtype.UUID{Bytes: [16]byte{}, Valid: false}
			totalRequests, _ := repositories.GetPromptRequestCountByDateRange(
				context.TODO(),
				invalidAppId,
				fromDate,
				toDate,
			)
			assert.Equal(t, int64(0), totalRequests)
		})
	})

	t.Run("GetTokenUsagePerModelTypeByDateRange", func(t *testing.T) {
		t.Run("get token usage for each model types by date range", func(t *testing.T) {
			modelTokenCntMap, dbErr := repositories.GetTokenUsagePerModelTypeByDateRange(
				context.TODO(),
				application.ID,
				fromDate,
				toDate,
			)
			assert.NoError(t, dbErr)
			assert.Equal(t, int64(20), modelTokenCntMap[db.ModelTypeGpt35Turbo])
		})

		t.Run("fails to get token usage for invalid application id", func(t *testing.T) {
			invalidAppId := pgtype.UUID{Bytes: [16]byte{}, Valid: false}
			modelTokenCntMap, _ := repositories.GetTokenUsagePerModelTypeByDateRange(
				context.TODO(),
				invalidAppId,
				fromDate,
				toDate,
			)
			assert.Equal(t, int64(0), modelTokenCntMap[db.ModelTypeGpt35Turbo])
		})
	})

	t.Run("GetPromptRequestAnalyticsByDateRange", func(t *testing.T) {
		t.Run("get token usage for each model types by date range", func(t *testing.T) {
			applicationAnalytics, dbErr := repositories.GetPromptRequestAnalyticsByDateRange(
				context.TODO(),
				application.ID,
				fromDate,
				toDate,
			)
			assert.NoError(t, dbErr)
			assert.Equal(t, int64(1), applicationAnalytics.TotalRequests)
			assert.Equal(
				t,
				tokenutils.GetCostByModelType(totalTokensUsed, db.ModelTypeGpt35Turbo),
				applicationAnalytics.ProjectedCost,
			)
		})
	})
}
