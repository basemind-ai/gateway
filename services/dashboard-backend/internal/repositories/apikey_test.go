package repositories_test

import (
	"context"
	"github.com/basemind-ai/monorepo/e2e/factories"
	"github.com/basemind-ai/monorepo/services/dashboard-backend/internal/repositories"
	"github.com/basemind-ai/monorepo/shared/go/db"
	"github.com/stretchr/testify/assert"
	"testing"
)

func TestTokensRepository(t *testing.T) {
	project, _ := factories.CreateProject(context.TODO())
	t.Run("GetOrCreateToken", func(t *testing.T) {
		t.Run("creates a new apiKey", func(t *testing.T) {
			application, _ := factories.CreateApplication(context.TODO(), project.ID)
			apiKeyID, err := repositories.GetOrCreateApplicationInternalAPIKeyID(
				context.TODO(),
				db.UUIDToString(&application.ID),
			)
			assert.NoError(t, err)
			assert.NotNil(t, apiKeyID)
		})
		t.Run("returns existing apiKeyID", func(t *testing.T) {
			application, _ := factories.CreateApplication(context.TODO(), project.ID)
			apiKey, _ := factories.CreateApplicationInternalAPIKey(context.TODO(), application.ID)
			apiKeyID, err := repositories.GetOrCreateApplicationInternalAPIKeyID(
				context.TODO(),
				db.UUIDToString(&application.ID),
			)
			assert.NoError(t, err)
			assert.Equal(t, db.UUIDToString(&apiKey.ID), db.UUIDToString(apiKeyID))
		})
		t.Run("returns error if applicationID is invalid", func(t *testing.T) {
			apiKeyID, err := repositories.GetOrCreateApplicationInternalAPIKeyID(
				context.TODO(),
				"invalid-application-id",
			)
			assert.Error(t, err)
			assert.Nil(t, apiKeyID)
		})
		t.Run("returns error if applicationID is not a real FK relation", func(t *testing.T) {
			apiKeyID, err := repositories.GetOrCreateApplicationInternalAPIKeyID(
				context.TODO(),
				"00000000-0000-0000-0000-000000000000",
			)
			assert.Error(t, err)
			assert.Nil(t, apiKeyID)
		})
	})
}
