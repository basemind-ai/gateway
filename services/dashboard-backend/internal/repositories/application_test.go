package repositories_test

import (
	"context"
	"fmt"
	"github.com/basemind-ai/monorepo/e2e/factories"
	"github.com/basemind-ai/monorepo/services/dashboard-backend/internal/repositories"
	"github.com/basemind-ai/monorepo/shared/go/db"
	"github.com/basemind-ai/monorepo/shared/go/db/models"
	"github.com/basemind-ai/monorepo/shared/go/testutils"
	"github.com/basemind-ai/monorepo/shared/go/tokenutils"
	"github.com/stretchr/testify/assert"
	"testing"
	"time"
)

func TestApplicationRepository(t *testing.T) {
	project, _ := factories.CreateProject(context.TODO())

	redisDB, redisMock := testutils.CreateMockRedisClient(t)

	application, _ := factories.CreateApplication(context.TODO(), project.ID)
	promptConfig, _ := factories.CreatePromptConfig(context.TODO(), application.ID)
	_, _ = factories.CreatePromptRequestRecord(context.TODO(), promptConfig.ID)
	fromDate := time.Now().AddDate(0, 0, -1)
	toDate := fromDate.AddDate(0, 0, 2)
	totalTokensUsed := int64(20)

	t.Run("DeleteApplication", func(t *testing.T) {
		t.Run("deletes an application and all of its prompt configs", func(t *testing.T) {
			applicationToDelete, _ := factories.CreateApplication(context.TODO(), project.ID)

			value, err := db.GetQueries().
				RetrieveApplication(context.TODO(), applicationToDelete.ID)
			assert.NoError(t, err)
			assert.Equal(t, applicationToDelete.ID, value.ID)

			promptConfig, _ := factories.CreatePromptConfig(context.TODO(), applicationToDelete.ID)
			promptConfigValue, err := db.
				GetQueries().
				RetrievePromptConfig(context.TODO(), promptConfig.ID)

			assert.NoError(t, err)
			assert.Equal(t, promptConfig.ID, promptConfigValue.ID)

			err = repositories.DeleteApplication(context.TODO(), applicationToDelete.ID)
			assert.NoError(t, err)

			_, err = db.GetQueries().RetrieveApplication(context.TODO(), applicationToDelete.ID)
			assert.Error(t, err)

			_, err = db.GetQueries().RetrievePromptConfig(context.TODO(), promptConfig.ID)
			assert.Error(t, err)
		})

		t.Run("deletes an application that has no prompt configs", func(t *testing.T) {
			applicationToDelete, _ := factories.CreateApplication(context.TODO(), project.ID)

			value, err := db.GetQueries().
				RetrieveApplication(context.TODO(), applicationToDelete.ID)
			assert.NoError(t, err)
			assert.Equal(t, applicationToDelete.ID, value.ID)

			err = repositories.DeleteApplication(context.TODO(), applicationToDelete.ID)
			assert.NoError(t, err)

			_, err = db.GetQueries().RetrieveApplication(context.TODO(), applicationToDelete.ID)
			assert.Error(t, err)
		})

		t.Run("invalidates application caches", func(t *testing.T) {
			applicationToDelete, _ := factories.CreateApplication(context.TODO(), project.ID)
			defaultPromptConfig, _ := factories.CreatePromptConfig(
				context.TODO(),
				applicationToDelete.ID,
			)

			applicationToDeleteID := db.UUIDToString(&applicationToDelete.ID)

			cacheKeys := []string{
				fmt.Sprintf(
					"%s:%s",
					applicationToDeleteID,
					db.UUIDToString(&defaultPromptConfig.ID),
				),
				applicationToDeleteID,
			}

			for _, cacheKey := range cacheKeys {
				redisDB.Set(context.TODO(), cacheKey, "test", 0)
				redisMock.ExpectDel(cacheKey).SetVal(1)
			}

			err := repositories.DeleteApplication(context.TODO(), applicationToDelete.ID)
			assert.NoError(t, err)

			time.Sleep(testutils.GetSleepTimeout())

			assert.NoError(t, redisMock.ExpectationsWereMet())
		})
	})

	t.Run("GetApplicationAPIRequestCountByDateRange", func(t *testing.T) {
		t.Run("get total prompt requests by date range", func(t *testing.T) {
			totalRequests := repositories.GetApplicationAPIRequestCountByDateRange(
				context.TODO(),
				application.ID,
				fromDate,
				toDate,
			)
			assert.Equal(t, int64(1), totalRequests)
		})
	})

	t.Run("GetApplicationTokensCountPerModelTypeByDateRange", func(t *testing.T) {
		t.Run("get token usage for each model types by date range", func(t *testing.T) {
			modelTokenCntMap := repositories.GetApplicationTokensCountPerModelTypeByDateRange(
				context.TODO(),
				application.ID,
				fromDate,
				toDate,
			)
			assert.Equal(t, int64(20), modelTokenCntMap[models.ModelTypeGpt35Turbo])
		})
	})

	t.Run("GetApplicationAnalyticsByDateRange", func(t *testing.T) {
		t.Run("get token usage for each model types by date range", func(t *testing.T) {
			applicationAnalytics := repositories.GetApplicationAnalyticsByDateRange(
				context.TODO(),
				application.ID,
				fromDate,
				toDate,
			)
			assert.Equal(t, int64(1), applicationAnalytics.TotalRequests)
			assert.Equal(
				t,
				tokenutils.GetCostByModelType(totalTokensUsed, models.ModelTypeGpt35Turbo),
				applicationAnalytics.ProjectedCost,
			)
		})
	})
}
