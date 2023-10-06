package repositories_test

import (
	"context"
	"github.com/basemind-ai/monorepo/e2e/factories"
	"github.com/basemind-ai/monorepo/services/dashboard-backend/internal/repositories"
	"github.com/basemind-ai/monorepo/shared/go/db"
	"github.com/stretchr/testify/assert"
	"testing"
)

func TestApplicationRepository(t *testing.T) {
	project, _ := factories.CreateProject(context.TODO())

	t.Run("deletes an application and all of its prompt configs", func(t *testing.T) {
		application, _ := factories.CreateApplication(context.TODO(), project.ID)

		value, err := db.GetQueries().FindApplicationById(context.Background(), application.ID)
		assert.NoError(t, err)
		assert.Equal(t, application.ID, value.ID)

		promptConfig, _ := factories.CreatePromptConfig(context.TODO(), application.ID)
		promptConfigValue, err := db.GetQueries().
			FindPromptConfigById(context.Background(), promptConfig.ID)
		assert.NoError(t, err)
		assert.Equal(t, promptConfig.ID, promptConfigValue.ID)

		err = repositories.DeleteApplication(context.Background(), application.ID)
		assert.NoError(t, err)

		_, err = db.GetQueries().FindApplicationById(context.Background(), application.ID)
		assert.Error(t, err)

		_, err = db.GetQueries().FindPromptConfigById(context.Background(), promptConfig.ID)
		assert.Error(t, err)
	})
}
