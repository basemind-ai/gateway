package api_test

import (
	"context"
	"fmt"
	"github.com/basemind-ai/monorepo/e2e/factories"
	"github.com/basemind-ai/monorepo/services/dashboard-backend/internal/api"
	"github.com/basemind-ai/monorepo/shared/go/db"
	"github.com/basemind-ai/monorepo/shared/go/serialization"
	"github.com/basemind-ai/monorepo/shared/go/testutils"
	"github.com/stretchr/testify/assert"
	"net/http"
	"strings"
	"testing"
	"time"
)

func TestApplicationsAPI(t *testing.T) {
	userAccount, _ := factories.CreateUserAccount(context.TODO())
	projectID := createProject(t)
	createUserProject(t, userAccount.FirebaseID, projectID, db.AccessPermissionTypeADMIN)

	testClient := createTestClient(t, userAccount)

	redisDB, redisMock := testutils.CreateMockRedisClient(t)

	t.Run(fmt.Sprintf("POST: %s", api.ApplicationsListEndpoint), func(t *testing.T) {
		t.Run("creates a new application", func(t *testing.T) {
			response, requestErr := testClient.Post(
				context.TODO(),
				fmt.Sprintf(
					"/v1%s",
					strings.ReplaceAll(api.ApplicationsListEndpoint, "{projectId}", projectID),
				),
				map[string]any{
					"name":        "test app",
					"description": "test app description",
				},
			)
			assert.NoError(t, requestErr)
			assert.Equal(t, http.StatusCreated, response.StatusCode)

			application := db.Application{}
			deserializationErr := serialization.DeserializeJSON(response.Body, &application)
			assert.NoError(t, deserializationErr)
			assert.NotNil(t, application.ID)
			assert.Equal(t, "test app", application.Name)
			assert.Equal(t, "test app description", application.Description)
		})

		t.Run("returns an error if the project id is invalid", func(t *testing.T) {
			response, requestErr := testClient.Post(
				context.TODO(),
				fmt.Sprintf(
					"/v1%s",
					strings.ReplaceAll(api.ApplicationsListEndpoint, "{projectId}", "invalid"),
				),
				map[string]any{
					"name":        "test app",
					"description": "test app description",
				},
			)
			assert.NoError(t, requestErr)
			assert.Equal(t, http.StatusBadRequest, response.StatusCode)
		})

		t.Run("returns an error if the request body is invalid", func(t *testing.T) {
			response, requestErr := testClient.Post(
				context.TODO(),
				fmt.Sprintf(
					"/v1%s",
					strings.ReplaceAll(api.ApplicationsListEndpoint, "{projectId}", projectID),
				),
				"invalid",
			)
			assert.NoError(t, requestErr)
			assert.Equal(t, http.StatusBadRequest, response.StatusCode)
		})

		t.Run("responds with status 400 BAD REQUEST if projectID is invalid", func(t *testing.T) {
			response, requestErr := testClient.Post(
				context.TODO(),
				fmt.Sprintf(
					"/v1%s",
					strings.ReplaceAll(api.ApplicationsListEndpoint, "{projectId}", "invalid"),
				),
				map[string]any{
					"name":        "test app",
					"description": "test app description",
				},
			)
			assert.NoError(t, requestErr)
			assert.Equal(t, http.StatusBadRequest, response.StatusCode)
		})
	})

	t.Run(fmt.Sprintf("GET: %s", api.ApplicationDetailEndpoint), func(t *testing.T) {
		t.Run("retrieves an existing application", func(t *testing.T) {
			applicationID := createApplication(t, projectID)

			response, requestErr := testClient.Get(
				context.TODO(),
				fmt.Sprintf(
					"/v1%s",
					strings.ReplaceAll(
						strings.ReplaceAll(api.ApplicationDetailEndpoint, "{projectId}", projectID),
						"{applicationId}",
						applicationID,
					),
				),
			)
			assert.NoError(t, requestErr)
			assert.Equal(t, http.StatusOK, response.StatusCode)

			uuidID, _ := db.StringToUUID(applicationID)

			application, _ := db.GetQueries().RetrieveApplication(context.TODO(), *uuidID)

			responseApplication := db.Application{}
			deserializationErr := serialization.DeserializeJSON(
				response.Body,
				&responseApplication,
			)
			assert.NoError(t, deserializationErr)
			assert.Equal(t, application.ID, responseApplication.ID)
			assert.Equal(t, application.Name, responseApplication.Name)
			assert.Equal(t, application.Description, responseApplication.Description)
		})

		t.Run("returns an error if the application id is invalid", func(t *testing.T) {
			response, requestErr := testClient.Get(
				context.TODO(),
				fmt.Sprintf(
					"/v1%s",
					strings.ReplaceAll(
						strings.ReplaceAll(api.ApplicationDetailEndpoint, "{projectId}", projectID),
						"{applicationId}",
						"invalid",
					),
				),
			)
			assert.NoError(t, requestErr)
			assert.Equal(t, http.StatusBadRequest, response.StatusCode)
		})

		t.Run("responds with status 400 BAD REQUEST if projectID is invalid", func(t *testing.T) {
			response, requestErr := testClient.Get(
				context.TODO(),
				fmt.Sprintf(
					"/v1%s",
					strings.ReplaceAll(
						strings.ReplaceAll(api.ApplicationDetailEndpoint, "{projectId}", "invalid"),
						"{applicationId}",
						"invalid",
					),
				),
			)
			assert.NoError(t, requestErr)
			assert.Equal(t, http.StatusBadRequest, response.StatusCode)
		})

		t.Run(
			"responds with status 400 BAD REQUEST if applicationID is invalid",
			func(t *testing.T) {
				response, requestErr := testClient.Get(
					context.TODO(),
					fmt.Sprintf(
						"/v1%s",
						strings.ReplaceAll(
							strings.ReplaceAll(
								api.ApplicationDetailEndpoint,
								"{projectId}",
								projectID,
							),
							"{applicationId}",
							"invalid",
						),
					),
				)
				assert.NoError(t, requestErr)
				assert.Equal(t, http.StatusBadRequest, response.StatusCode)
			},
		)
	})

	t.Run(fmt.Sprintf("PATCH: %s", api.ApplicationDetailEndpoint), func(t *testing.T) {
		t.Run("updates an existing application", func(t *testing.T) {
			applicationID := createApplication(t, projectID)

			response, requestErr := testClient.Patch(
				context.TODO(),
				fmt.Sprintf(
					"/v1%s",
					strings.ReplaceAll(
						strings.ReplaceAll(api.ApplicationDetailEndpoint, "{projectId}", projectID),
						"{applicationId}",
						applicationID,
					),
				),
				map[string]any{
					"name":        "updated app",
					"description": "updated app description",
				},
			)
			assert.NoError(t, requestErr)
			assert.Equal(t, http.StatusOK, response.StatusCode)

			responseApplication := db.Application{}
			deserializationErr := serialization.DeserializeJSON(
				response.Body,
				&responseApplication,
			)

			uuidID, _ := db.StringToUUID(applicationID)

			assert.NoError(t, deserializationErr)
			assert.Equal(t, *uuidID, responseApplication.ID)
			assert.Equal(t, "updated app", responseApplication.Name)
			assert.Equal(t, "updated app description", responseApplication.Description)
		})
		t.Run("invalidates application prompt-config default cache", func(t *testing.T) {
			applicationID := createApplication(t, projectID)

			redisDB.Set(context.TODO(), applicationID, "test", 0)
			redisMock.ExpectDel(applicationID).SetVal(1)

			response, requestErr := testClient.Patch(
				context.TODO(),
				fmt.Sprintf(
					"/v1%s",
					strings.ReplaceAll(
						strings.ReplaceAll(api.ApplicationDetailEndpoint, "{projectId}", projectID),
						"{applicationId}",
						applicationID,
					),
				),
				map[string]any{
					"name":        "updated app",
					"description": "updated app description",
				},
			)
			assert.NoError(t, requestErr)
			assert.Equal(t, http.StatusOK, response.StatusCode)

			time.Sleep(testutils.GetSleepTimeout())

			assert.NoError(t, redisMock.ExpectationsWereMet())
		})

		t.Run("returns an error if the application id is invalid", func(t *testing.T) {
			response, requestErr := testClient.Patch(
				context.TODO(),
				fmt.Sprintf(
					"/v1%s",
					strings.ReplaceAll(
						strings.ReplaceAll(api.ApplicationDetailEndpoint, "{projectId}", projectID),
						"{applicationId}",
						"invalid",
					),
				),
				map[string]any{
					"name":        "updated app",
					"description": "updated app description",
				},
			)
			assert.NoError(t, requestErr)
			assert.Equal(t, http.StatusBadRequest, response.StatusCode)
		})

		t.Run("returns an error if the request body is invalid", func(t *testing.T) {
			applicationID := createApplication(t, projectID)
			response, requestErr := testClient.Patch(
				context.TODO(),
				fmt.Sprintf(
					"/v1%s",
					strings.ReplaceAll(
						strings.ReplaceAll(api.ApplicationDetailEndpoint, "{projectId}", projectID),
						"{applicationId}",
						applicationID,
					),
				),
				"invalid",
			)
			assert.NoError(t, requestErr)
			assert.Equal(t, http.StatusBadRequest, response.StatusCode)
		})

		t.Run("responds with status 400 BAD REQUEST if projectID is invalid", func(t *testing.T) {
			response, requestErr := testClient.Patch(
				context.TODO(),
				fmt.Sprintf(
					"/v1%s",
					strings.ReplaceAll(
						strings.ReplaceAll(api.ApplicationDetailEndpoint, "{projectId}", "invalid"),
						"{applicationId}",
						"invalid",
					),
				),
				map[string]any{
					"name":        "updated app",
					"description": "updated app description",
				},
			)
			assert.NoError(t, requestErr)
			assert.Equal(t, http.StatusBadRequest, response.StatusCode)
		})

		t.Run(
			"responds with status 400 BAD REQUEST if applicationID is invalid",
			func(t *testing.T) {
				response, requestErr := testClient.Patch(
					context.TODO(),
					fmt.Sprintf(
						"/v1%s",
						strings.ReplaceAll(
							strings.ReplaceAll(
								api.ApplicationDetailEndpoint,
								"{projectId}",
								projectID,
							),
							"{applicationId}",
							"invalid",
						),
					),
					map[string]any{
						"name":        "updated app",
						"description": "updated app description",
					},
				)
				assert.NoError(t, requestErr)
				assert.Equal(t, http.StatusBadRequest, response.StatusCode)
			},
		)
	})

	t.Run(fmt.Sprintf("DELETE: %s", api.ApplicationDetailEndpoint), func(t *testing.T) {
		t.Run("deletes an existing application", func(t *testing.T) {
			applicationID := createApplication(t, projectID)

			response, requestErr := testClient.Delete(
				context.TODO(),
				fmt.Sprintf(
					"/v1%s",
					strings.ReplaceAll(
						strings.ReplaceAll(api.ApplicationDetailEndpoint, "{projectId}", projectID),
						"{applicationId}",
						applicationID,
					),
				),
			)
			assert.NoError(t, requestErr)
			assert.Equal(t, http.StatusNoContent, response.StatusCode)

			uuidID, _ := db.StringToUUID(applicationID)
			_, applicationRetrieveErr := db.GetQueries().
				RetrieveApplication(context.TODO(), *uuidID)

			assert.Error(t, applicationRetrieveErr)
		})

		t.Run("invalidates application prompt-config default cache", func(t *testing.T) {
			applicationID := createApplication(t, projectID)

			redisDB.Set(context.TODO(), applicationID, "test", 0)
			redisMock.ExpectDel(applicationID).SetVal(1)

			response, requestErr := testClient.Delete(
				context.TODO(),
				fmt.Sprintf(
					"/v1%s",
					strings.ReplaceAll(
						strings.ReplaceAll(api.ApplicationDetailEndpoint, "{projectId}", projectID),
						"{applicationId}",
						applicationID,
					),
				),
			)

			assert.NoError(t, requestErr)
			assert.Equal(t, http.StatusNoContent, response.StatusCode)

			time.Sleep(testutils.GetSleepTimeout())

			assert.NoError(t, redisMock.ExpectationsWereMet())
		})

		t.Run("returns an error if the application id is invalid", func(t *testing.T) {
			response, requestErr := testClient.Delete(
				context.TODO(),
				fmt.Sprintf(
					"/v1%s",
					strings.ReplaceAll(
						strings.ReplaceAll(api.ApplicationDetailEndpoint, "{projectId}", projectID),
						"{applicationId}",
						"invalid",
					),
				),
			)
			assert.NoError(t, requestErr)
			assert.Equal(t, http.StatusBadRequest, response.StatusCode)
		})

		t.Run("responds with status 400 BAD REQUEST if projectID is invalid", func(t *testing.T) {
			response, requestErr := testClient.Delete(
				context.TODO(),
				fmt.Sprintf(
					"/v1%s",
					strings.ReplaceAll(
						strings.ReplaceAll(api.ApplicationDetailEndpoint, "{projectId}", "invalid"),
						"{applicationId}",
						"invalid",
					),
				),
			)
			assert.NoError(t, requestErr)
			assert.Equal(t, http.StatusBadRequest, response.StatusCode)
		})
		t.Run(
			"responds with status 400 BAD REQUEST if applicationID is invalid",
			func(t *testing.T) {
				response, requestErr := testClient.Delete(
					context.TODO(),
					fmt.Sprintf(
						"/v1%s",
						strings.ReplaceAll(
							strings.ReplaceAll(
								api.ApplicationDetailEndpoint,
								"{projectId}",
								projectID,
							),
							"{applicationId}",
							"invalid",
						),
					),
				)
				assert.NoError(t, requestErr)
				assert.Equal(t, http.StatusBadRequest, response.StatusCode)
			},
		)
	})
}
