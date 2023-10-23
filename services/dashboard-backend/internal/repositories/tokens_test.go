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
		t.Run("creates a new token", func(t *testing.T) {
			application, _ := factories.CreateApplication(context.TODO(), project.ID)
			tokenID, err := repositories.GetOrCreateApplicationInternalTokenID(
				context.TODO(),
				db.UUIDToString(&application.ID),
			)
			assert.NoError(t, err)
			assert.NotNil(t, tokenID)
		})
		t.Run("returns existing tokenID", func(t *testing.T) {
			application, _ := factories.CreateApplication(context.TODO(), project.ID)
			token, _ := factories.CreateApplicationInternalToken(context.TODO(), application.ID)
			tokenID, err := repositories.GetOrCreateApplicationInternalTokenID(
				context.TODO(),
				db.UUIDToString(&application.ID),
			)
			assert.NoError(t, err)
			assert.Equal(t, db.UUIDToString(&token.ID), db.UUIDToString(tokenID))
		})
		t.Run("returns error if applicationID is invalid", func(t *testing.T) {
			tokenID, err := repositories.GetOrCreateApplicationInternalTokenID(
				context.TODO(),
				"invalid-application-id",
			)
			assert.Error(t, err)
			assert.Nil(t, tokenID)
		})
		t.Run("returns error if applicationID is not a real FK relation", func(t *testing.T) {
			tokenID, err := repositories.GetOrCreateApplicationInternalTokenID(
				context.TODO(),
				"00000000-0000-0000-0000-000000000000",
			)
			assert.Error(t, err)
			assert.Nil(t, tokenID)
		})
	})
}
