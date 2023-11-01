package api_test

import (
	"context"
	"fmt"
	"github.com/basemind-ai/monorepo/e2e/factories"
	"github.com/basemind-ai/monorepo/services/dashboard-backend/internal/api"
	"github.com/basemind-ai/monorepo/services/dashboard-backend/internal/dto"
	"github.com/basemind-ai/monorepo/shared/go/db"
	"github.com/basemind-ai/monorepo/shared/go/db/models"
	"github.com/basemind-ai/monorepo/shared/go/serialization"
	"github.com/basemind-ai/monorepo/shared/go/testutils"
	"github.com/stretchr/testify/assert"
	"net/http"
	"strings"
	"testing"
)

func createAPIKey(t *testing.T, applicationID, apiKeyName string) models.ApiKey {
	t.Helper()
	appID, _ := db.StringToUUID(applicationID)
	apiKey, err := db.GetQueries().CreateAPIKey(context.TODO(), models.CreateAPIKeyParams{
		ApplicationID: *appID,
		Name:          apiKeyName,
	})
	assert.NoError(t, err)
	return apiKey
}

func TestAPIKeyAPI(t *testing.T) {
	testutils.SetTestEnv(t)
	userAccount, _ := factories.CreateUserAccount(context.TODO())
	projectID := createProject(t)
	applicationID := createApplication(t, projectID)
	createUserProject(t, userAccount.FirebaseID, projectID, models.AccessPermissionTypeADMIN)

	testClient := createTestClient(t, userAccount)

	listURL := fmt.Sprintf(
		"/v1%s",
		strings.ReplaceAll(
			strings.ReplaceAll(api.ApplicationAPIKeysListEndpoint, "{projectId}", projectID),
			"{applicationId}",
			applicationID,
		),
	)

	t.Run(fmt.Sprintf("GET: %s", api.ApplicationAPIKeysListEndpoint), func(t *testing.T) {
		t.Run("returns a list of all application apiKeys", func(t *testing.T) {
			apiKey1 := createAPIKey(t, applicationID, "apiKey1")
			apiKey2 := createAPIKey(t, applicationID, "apiKey2")

			response, requestErr := testClient.Get(context.TODO(), listURL)
			assert.NoError(t, requestErr)
			assert.Equal(t, http.StatusOK, response.StatusCode)

			data := make([]*dto.ApplicationAPIKeyDTO, 0)
			deserializationErr := serialization.DeserializeJSON(response.Body, &data)
			assert.NoError(t, deserializationErr)

			assert.Len(t, data, 2)
			assert.Equal(t, db.UUIDToString(&apiKey1.ID), data[0].ID)
			assert.Equal(t, apiKey1.Name, data[0].Name)
			assert.Nil(t, data[0].Hash)
			assert.Equal(t, db.UUIDToString(&apiKey2.ID), data[1].ID)
			assert.Equal(t, apiKey2.Name, data[1].Name)
			assert.Nil(t, data[1].Hash)
		})

		for _, permission := range []models.AccessPermissionType{
			models.AccessPermissionTypeMEMBER, models.AccessPermissionTypeADMIN,
		} {
			t.Run(
				fmt.Sprintf(
					"responds with status 200 OK if the user has %s permission",
					permission,
				),
				func(t *testing.T) {
					newUserAccount, _ := factories.CreateUserAccount(context.TODO())
					newProjectID := createProject(t)
					newApplicationID := createApplication(t, newProjectID)
					createUserProject(t, newUserAccount.FirebaseID, newProjectID, permission)

					client := createTestClient(t, newUserAccount)

					response, requestErr := client.Get(context.TODO(), fmt.Sprintf(
						"/v1%s",
						strings.ReplaceAll(
							strings.ReplaceAll(
								api.ApplicationAPIKeysListEndpoint,
								"{projectId}",
								newProjectID,
							),
							"{applicationId}",
							newApplicationID,
						),
					))
					assert.NoError(t, requestErr)
					assert.Equal(t, http.StatusOK, response.StatusCode)
				},
			)
		}

		t.Run(
			"responds with status 403 FORBIDDEN if the user does not have projects access",
			func(t *testing.T) {
				newUserAccount, _ := factories.CreateUserAccount(context.TODO())
				newProjectID := createProject(t)
				newApplicationID := createApplication(t, newProjectID)

				client := createTestClient(t, newUserAccount)

				response, requestErr := client.Get(context.TODO(), fmt.Sprintf(
					"/v1%s",
					strings.ReplaceAll(
						strings.ReplaceAll(
							api.ApplicationAPIKeysListEndpoint,
							"{projectId}",
							newProjectID,
						),
						"{applicationId}",
						newApplicationID,
					),
				))
				assert.NoError(t, requestErr)
				assert.Equal(t, http.StatusForbidden, response.StatusCode)
			},
		)

		t.Run("returns an error if the application id is invalid", func(t *testing.T) {
			response, requestErr := testClient.Get(context.TODO(), fmt.Sprintf(
				"/v1%s",
				strings.ReplaceAll(
					strings.ReplaceAll(
						api.ApplicationAPIKeysListEndpoint,
						"{projectId}",
						projectID,
					),
					"{applicationId}",
					"invalid",
				),
			))
			assert.NoError(t, requestErr)
			assert.Equal(t, http.StatusBadRequest, response.StatusCode)
		})
	})

	t.Run(fmt.Sprintf("POST: %s", api.ApplicationAPIKeysListEndpoint), func(t *testing.T) {
		t.Run("creates a new application apiKey", func(t *testing.T) {
			response, requestErr := testClient.Post(context.TODO(), listURL, map[string]any{
				"name": "test apiKey",
			})
			assert.NoError(t, requestErr)
			assert.Equal(t, http.StatusCreated, response.StatusCode)

			data := dto.ApplicationAPIKeyDTO{}
			deserializationErr := serialization.DeserializeJSON(response.Body, &data)
			assert.NoError(t, deserializationErr)
			assert.NotNil(t, data.ID)
			assert.Equal(t, "test apiKey", data.Name)
			assert.NotNil(t, data.Hash)
			assert.NotEmpty(t, *data.Hash)
		})

		for _, permission := range []models.AccessPermissionType{
			models.AccessPermissionTypeMEMBER, models.AccessPermissionTypeADMIN,
		} {
			t.Run(
				fmt.Sprintf(
					"responds with status 201 CREATED if the user has %s permission",
					permission,
				),
				func(t *testing.T) {
					newUserAccount, _ := factories.CreateUserAccount(context.TODO())
					newProjectID := createProject(t)
					newApplicationID := createApplication(t, newProjectID)
					createUserProject(t, newUserAccount.FirebaseID, newProjectID, permission)

					client := createTestClient(t, newUserAccount)

					response, requestErr := client.Post(context.TODO(), fmt.Sprintf(
						"/v1%s",
						strings.ReplaceAll(
							strings.ReplaceAll(
								api.ApplicationAPIKeysListEndpoint,
								"{projectId}",
								newProjectID,
							),
							"{applicationId}",
							newApplicationID,
						),
					), map[string]any{
						"name": "test apiKey",
					})
					assert.NoError(t, requestErr)
					assert.Equal(t, http.StatusCreated, response.StatusCode)
				},
			)
		}

		t.Run(
			"responds with status 403 FORBIDDEN if the user does not have projects access",
			func(t *testing.T) {
				newUserAccount, _ := factories.CreateUserAccount(context.TODO())
				newProjectID := createProject(t)
				newApplicationID := createApplication(t, newProjectID)

				client := createTestClient(t, newUserAccount)

				response, requestErr := client.Post(context.TODO(), fmt.Sprintf(
					"/v1%s",
					strings.ReplaceAll(
						strings.ReplaceAll(
							api.ApplicationAPIKeysListEndpoint,
							"{projectId}",
							newProjectID,
						),
						"{applicationId}",
						newApplicationID,
					),
				), map[string]any{
					"name": "test apiKey",
				})
				assert.NoError(t, requestErr)
				assert.Equal(t, http.StatusForbidden, response.StatusCode)
			},
		)

		t.Run(
			"responds with status 400 BAD REQUEST if the application id is invalid",
			func(t *testing.T) {
				response, requestErr := testClient.Post(context.TODO(), fmt.Sprintf(
					"/v1%s",
					strings.ReplaceAll(
						strings.ReplaceAll(
							api.ApplicationAPIKeysListEndpoint,
							"{projectId}",
							projectID,
						),
						"{applicationId}",
						"invalid",
					),
				), map[string]any{
					"name": "test apiKey",
				})
				assert.NoError(t, requestErr)
				assert.Equal(t, http.StatusBadRequest, response.StatusCode)
			},
		)

		t.Run("responds with status 400 BAD REQUEST if the name is missing", func(t *testing.T) {
			response, requestErr := testClient.Post(context.TODO(), listURL, map[string]any{
				"name": "",
			})
			assert.NoError(t, requestErr)
			assert.Equal(t, http.StatusBadRequest, response.StatusCode)
		})

		t.Run(
			"responds with status 400 BAD REQUEST if the body cannot be deserialized",
			func(t *testing.T) {
				response, requestErr := testClient.Post(context.TODO(), listURL, "invalid")
				assert.NoError(t, requestErr)
				assert.Equal(t, http.StatusBadRequest, response.StatusCode)
			},
		)
	})

	t.Run(fmt.Sprintf("DELETE: %s", api.ApplicationDetailEndpoint), func(t *testing.T) {
		t.Run("deletes an application apiKey", func(t *testing.T) {
			apiKey := createAPIKey(t, applicationID, "test apiKey")
			apiKeyID := db.UUIDToString(&apiKey.ID)
			url := fmt.Sprintf(
				"/v1%s",
				strings.ReplaceAll(
					strings.ReplaceAll(
						strings.ReplaceAll(
							api.ApplicationAPIKeyDetailEndpoint,
							"{projectId}",
							projectID,
						),
						"{applicationId}",
						applicationID,
					),
					"{apiKeyId}", apiKeyID),
			)

			response, requestErr := testClient.Delete(context.TODO(), url)
			assert.NoError(t, requestErr)
			assert.Equal(t, http.StatusNoContent, response.StatusCode)

			apiKeys, err := db.GetQueries().RetrieveAPIKeys(context.TODO(), apiKey.ID)
			assert.NoError(t, err)
			for _, dbToken := range apiKeys {
				assert.NotEqual(t, apiKey.ID, dbToken.ID)
			}
		})

		t.Run(
			"responds with status 401 UNAUTHORIZED if the user does not have ADMIN permission",
			func(t *testing.T) {
				newUserAccount, _ := factories.CreateUserAccount(context.TODO())
				newProjectID := createProject(t)
				newApplicationID := createApplication(t, newProjectID)
				createUserProject(
					t,
					newUserAccount.FirebaseID,
					newProjectID,
					models.AccessPermissionTypeMEMBER,
				)

				client := createTestClient(t, newUserAccount)

				apiKey := createAPIKey(t, newApplicationID, "test apiKey")
				apiKeyID := db.UUIDToString(&apiKey.ID)
				url := fmt.Sprintf(
					"/v1%s",
					strings.ReplaceAll(
						strings.ReplaceAll(
							strings.ReplaceAll(
								api.ApplicationAPIKeyDetailEndpoint,
								"{projectId}",
								newProjectID,
							),
							"{applicationId}",
							newApplicationID,
						),
						"{apiKeyId}", apiKeyID),
				)

				response, requestErr := client.Delete(context.TODO(), url)
				assert.NoError(t, requestErr)
				assert.Equal(t, http.StatusUnauthorized, response.StatusCode)
			},
		)
		t.Run(
			"responds with status 403 FORBIDDEN if the user does not have projects access",
			func(t *testing.T) {
				newUserAccount, _ := factories.CreateUserAccount(context.TODO())
				newProjectID := createProject(t)
				newApplicationID := createApplication(t, newProjectID)

				client := createTestClient(t, newUserAccount)

				apiKey := createAPIKey(t, newApplicationID, "test apiKey")
				apiKeyID := db.UUIDToString(&apiKey.ID)
				url := fmt.Sprintf(
					"/v1%s",
					strings.ReplaceAll(
						strings.ReplaceAll(
							strings.ReplaceAll(
								api.ApplicationAPIKeyDetailEndpoint,
								"{projectId}",
								newProjectID,
							),
							"{applicationId}",
							newApplicationID,
						),
						"{apiKeyId}", apiKeyID),
				)

				response, requestErr := client.Delete(context.TODO(), url)
				assert.NoError(t, requestErr)
				assert.Equal(t, http.StatusForbidden, response.StatusCode)
			},
		)

		t.Run("returns an error if the application id is invalid", func(t *testing.T) {
			response, requestErr := testClient.Delete(context.TODO(), fmt.Sprintf(
				"/v1%s",
				strings.ReplaceAll(
					strings.ReplaceAll(
						strings.ReplaceAll(
							api.ApplicationAPIKeyDetailEndpoint,
							"{projectId}",
							projectID,
						),
						"{applicationId}",
						"invalid",
					),
					"{apiKeyId}", "invalid"),
			))
			assert.NoError(t, requestErr)
			assert.Equal(t, http.StatusBadRequest, response.StatusCode)
		})
	})
}
