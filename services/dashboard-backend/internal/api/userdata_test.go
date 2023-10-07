package api_test

import (
	"context"
	"fmt"
	"github.com/basemind-ai/monorepo/e2e/factories"
	"github.com/basemind-ai/monorepo/services/dashboard-backend/internal/api"
	"github.com/basemind-ai/monorepo/services/dashboard-backend/internal/dto"
	"github.com/basemind-ai/monorepo/services/dashboard-backend/internal/repositories"
	"github.com/basemind-ai/monorepo/shared/go/serialization"
	"github.com/stretchr/testify/assert"
	"net/http"
	"testing"
)

func TestUserDataAPI(t *testing.T) {
	t.Run(fmt.Sprintf("GET: %s", api.UserAccountEndpoint), func(t *testing.T) {
		t.Run("creates a new user and returns its default project", func(t *testing.T) {
			firebaseID := factories.RandomString(10)
			testClient := createTestClient(t, firebaseID)

			response, requestErr := testClient.Get(
				context.TODO(),
				fmt.Sprintf("/v1%s", api.UserAccountEndpoint),
			)
			assert.NoError(t, requestErr)
			assert.Equal(t, http.StatusOK, response.StatusCode)

			userData := &dto.UserAccountDTO{}
			deserializationErr := serialization.DeserializeJSON(response.Body, userData)

			assert.NoError(t, deserializationErr)
			assert.NotEmpty(t, userData.ID)
			assert.Equal(t, firebaseID, userData.FirebaseID)
			assert.Len(t, userData.Projects, 1)
			assert.NotEmpty(t, userData.Projects[0].ID)
		})

		t.Run("retrieves projects for existing user", func(t *testing.T) {
			firebaseID := factories.RandomString(10)
			testClient := createTestClient(t, firebaseID)

			_, userCreateErr := repositories.CreateDefaultUserAccountData(
				context.Background(),
				firebaseID,
			)
			assert.NoError(t, userCreateErr)

			response, requestErr := testClient.Get(
				context.TODO(),
				fmt.Sprintf("/v1%s", api.UserAccountEndpoint),
			)
			assert.NoError(t, requestErr)
			assert.Equal(t, http.StatusOK, response.StatusCode)

			userData := &dto.UserAccountDTO{}
			deserializationErr := serialization.DeserializeJSON(response.Body, userData)
			assert.NoError(t, deserializationErr)
			assert.NotEmpty(t, userData.ID)
			assert.Equal(t, firebaseID, userData.FirebaseID)
			assert.Len(t, userData.Projects, 1)
			assert.NotEmpty(t, userData.Projects[0].ID)
		})
	})
}
