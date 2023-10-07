package api_test

import (
	"context"
	"fmt"
	"github.com/basemind-ai/monorepo/e2e/factories"
	"github.com/basemind-ai/monorepo/services/dashboard-backend/internal/api"
	"github.com/basemind-ai/monorepo/services/dashboard-backend/internal/dto"
	"github.com/basemind-ai/monorepo/shared/go/config/testutils"
	"github.com/basemind-ai/monorepo/shared/go/db"
	"github.com/basemind-ai/monorepo/shared/go/serialization"
	"github.com/stretchr/testify/assert"
	"net/http"
	"strings"
	"testing"
)

func createToken(t *testing.T, applicationID string, tokenName string) db.Token {
	t.Helper()
	appID, _ := db.StringToUUID(applicationID)
	token, err := db.GetQueries().CreateToken(context.TODO(), db.CreateTokenParams{
		ApplicationID: *appID,
		Name:          tokenName,
	})
	assert.NoError(t, err)
	return token
}

func TestTokensAPI(t *testing.T) {
	testutils.SetTestEnv(t)
	projectID := createProject(t)
	applicationID := createApplication(t, projectID)

	firebaseID := factories.RandomString(10)
	testClient := createTestClient(t, firebaseID)

	listURL := fmt.Sprintf(
		"/v1%s",
		strings.ReplaceAll(
			strings.ReplaceAll(api.ApplicationTokensListEndpoint, "{projectId}", projectID),
			"{applicationId}",
			applicationID,
		),
	)

	t.Run(fmt.Sprintf("GET: %s", api.ApplicationTokensListEndpoint), func(t *testing.T) {
		t.Run("returns a list of all application tokens", func(t *testing.T) {
			token1 := createToken(t, applicationID, "token1")
			token2 := createToken(t, applicationID, "token2")

			response, requestErr := testClient.Get(context.TODO(), listURL)
			assert.NoError(t, requestErr)
			assert.Equal(t, http.StatusOK, response.StatusCode)

			data := make([]*dto.ApplicationTokenDTO, 0)
			deserializationErr := serialization.DeserializeJSON(response.Body, &data)
			assert.NoError(t, deserializationErr)

			assert.Len(t, data, 2)
			assert.Equal(t, db.UUIDToString(&token1.ID), data[0].ID) //nolint: gosec
			assert.Equal(t, token1.Name, data[0].Name)               //nolint: gosec
			assert.Nil(t, data[0].Hash)                              //nolint: gosec
			assert.Equal(t, db.UUIDToString(&token2.ID), data[1].ID) //nolint: gosec
			assert.Equal(t, token2.Name, data[1].Name)               //nolint: gosec
			assert.Nil(t, data[1].Hash)                              //nolint: gosec
		})
		t.Run("returns an error if the application id is invalid", func(t *testing.T) {
			response, requestErr := testClient.Get(context.TODO(), fmt.Sprintf(
				"/v1%s",
				strings.ReplaceAll(
					strings.ReplaceAll(api.ApplicationTokensListEndpoint, "{projectId}", projectID),
					"{applicationId}",
					"invalid",
				),
			))
			assert.NoError(t, requestErr)
			assert.Equal(t, http.StatusBadRequest, response.StatusCode)
		})
	})

	t.Run(fmt.Sprintf("POST: %s", api.ApplicationTokensListEndpoint), func(t *testing.T) {
		t.Run("creates a new application token", func(t *testing.T) {
			response, requestErr := testClient.Post(context.TODO(), listURL, map[string]any{
				"name": "test token",
			})
			assert.NoError(t, requestErr)
			assert.Equal(t, http.StatusCreated, response.StatusCode)

			data := dto.ApplicationTokenDTO{}
			deserializationErr := serialization.DeserializeJSON(response.Body, &data)
			assert.NoError(t, deserializationErr)
			assert.NotNil(t, data.ID)
			assert.Equal(t, "test token", data.Name)
			assert.NotNil(t, data.Hash)
			assert.NotEmpty(t, *data.Hash)
		})
		t.Run("returns an error if the application id is invalid", func(t *testing.T) {
			response, requestErr := testClient.Post(context.TODO(), fmt.Sprintf(
				"/v1%s",
				strings.ReplaceAll(
					strings.ReplaceAll(api.ApplicationTokensListEndpoint, "{projectId}", projectID),
					"{applicationId}",
					"invalid",
				),
			), map[string]any{
				"name": "test token",
			})
			assert.NoError(t, requestErr)
			assert.Equal(t, http.StatusBadRequest, response.StatusCode)
		})
	})

	t.Run(fmt.Sprintf("DELETE: %s", api.ApplicationDetailEndpoint), func(t *testing.T) {
		t.Run("deletes an application token", func(t *testing.T) {
			token := createToken(t, applicationID, "test token")
			tokenID := db.UUIDToString(&token.ID)
			url := fmt.Sprintf(
				"/v1%s",
				strings.ReplaceAll(
					strings.ReplaceAll(
						strings.ReplaceAll(
							api.ApplicationTokenDetailEndpoint,
							"{projectId}",
							projectID,
						),
						"{applicationId}",
						applicationID,
					),
					"{tokenId}", tokenID),
			)

			response, requestErr := testClient.Delete(context.TODO(), url)
			assert.NoError(t, requestErr)
			assert.Equal(t, http.StatusNoContent, response.StatusCode)

			tokens, err := db.GetQueries().RetrieveApplicationTokens(context.TODO(), token.ID)
			assert.NoError(t, err)
			for _, dbToken := range tokens {
				assert.NotEqual(t, token.ID, dbToken.ID)
			}
		})
		t.Run("returns an error if the application id is invalid", func(t *testing.T) {
			response, requestErr := testClient.Delete(context.TODO(), fmt.Sprintf(
				"/v1%s",
				strings.ReplaceAll(
					strings.ReplaceAll(
						strings.ReplaceAll(
							api.ApplicationTokenDetailEndpoint,
							"{projectId}",
							projectID,
						),
						"{applicationId}",
						"invalid",
					),
					"{tokenId}", "invalid"),
			))
			assert.NoError(t, requestErr)
			assert.Equal(t, http.StatusBadRequest, response.StatusCode)
		})
	})
}
