package repositories_test

import (
	"context"
	"fmt"
	"github.com/basemind-ai/monorepo/e2e/factories"
	"github.com/basemind-ai/monorepo/services/dashboard-backend/internal/repositories"
	"github.com/basemind-ai/monorepo/shared/go/db"
	"github.com/basemind-ai/monorepo/shared/go/testutils"
	"github.com/stretchr/testify/assert"
	"testing"
	"time"
)

func TestApplicationRepository(t *testing.T) {
	project, _ := factories.CreateProject(context.TODO())
	redisDB, redisMock := testutils.CreateMockRedisClient(t)

	t.Run("deletes an application and all of its prompt configs", func(t *testing.T) {
		application, _ := factories.CreateApplication(context.TODO(), project.ID)

		value, err := db.GetQueries().RetrieveApplication(context.TODO(), application.ID)
		assert.NoError(t, err)
		assert.Equal(t, application.ID, value.ID)

		promptConfig, _ := factories.CreatePromptConfig(context.TODO(), application.ID)
		promptConfigValue, err := db.
			GetQueries().
			RetrievePromptConfig(context.TODO(), promptConfig.ID)

		assert.NoError(t, err)
		assert.Equal(t, promptConfig.ID, promptConfigValue.ID)

		err = repositories.DeleteApplication(context.TODO(), application.ID)
		assert.NoError(t, err)

		_, err = db.GetQueries().RetrieveApplication(context.TODO(), application.ID)
		assert.Error(t, err)

		_, err = db.GetQueries().RetrievePromptConfig(context.TODO(), promptConfig.ID)
		assert.Error(t, err)
	})

	t.Run("deletes an application that has no prompt configs", func(t *testing.T) {
		application, _ := factories.CreateApplication(context.TODO(), project.ID)

		value, err := db.GetQueries().RetrieveApplication(context.TODO(), application.ID)
		assert.NoError(t, err)
		assert.Equal(t, application.ID, value.ID)

		err = repositories.DeleteApplication(context.TODO(), application.ID)
		assert.NoError(t, err)

		_, err = db.GetQueries().RetrieveApplication(context.TODO(), application.ID)
		assert.Error(t, err)
	})

	t.Run("invalidates application caches", func(t *testing.T) {
		application, _ := factories.CreateApplication(context.TODO(), project.ID)
		defaultPromptConfig, _ := factories.CreatePromptConfig(context.TODO(), application.ID)

		applicationID := db.UUIDToString(&application.ID)

		cacheKeys := []string{
			fmt.Sprintf("%s:%s", applicationID, db.UUIDToString(&defaultPromptConfig.ID)),
			applicationID,
		}

		for _, cacheKey := range cacheKeys {
			redisDB.Set(context.TODO(), cacheKey, "test", 0)
			redisMock.ExpectDel(cacheKey).SetVal(1)
		}

		err := repositories.DeleteApplication(context.TODO(), application.ID)
		assert.NoError(t, err)

		time.Sleep(100 * time.Millisecond)

		assert.NoError(t, redisMock.ExpectationsWereMet())
	})
}
