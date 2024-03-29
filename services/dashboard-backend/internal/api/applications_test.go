package api_test

import (
	"context"
	"fmt"
	"github.com/basemind-ai/monorepo/services/dashboard-backend/internal/api"
	"github.com/basemind-ai/monorepo/shared/go/db/models"
	"net/http"
	"strings"
	"testing"
	"time"

	"github.com/basemind-ai/monorepo/shared/go/testutils"
	"github.com/stretchr/testify/assert"

	"github.com/basemind-ai/monorepo/e2e/factories"
	"github.com/basemind-ai/monorepo/services/dashboard-backend/internal/dto"
	"github.com/basemind-ai/monorepo/services/dashboard-backend/internal/repositories"
	"github.com/basemind-ai/monorepo/shared/go/db"
	"github.com/basemind-ai/monorepo/shared/go/serialization"
)

func TestApplicationsAPI(t *testing.T) { //nolint: revive
	userAccount, _ := factories.CreateUserAccount(context.TODO())
	projectID := createProject(t)
	createUserProject(t, userAccount.FirebaseID, projectID, models.AccessPermissionTypeADMIN)

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

			application := models.Application{}
			deserializationErr := serialization.DeserializeJSON(response.Body, &application)
			assert.NoError(t, deserializationErr)
			assert.NotNil(t, application.ID)
			assert.Equal(t, "test app", application.Name)
			assert.Equal(t, "test app description", application.Description)
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
					createUserProject(t, newUserAccount.FirebaseID, newProjectID, permission)

					newTestClient := createTestClient(t, newUserAccount)
					response, requestErr := newTestClient.Post(
						context.TODO(),
						fmt.Sprintf(
							"/v1%s",
							strings.ReplaceAll(
								api.ApplicationsListEndpoint,
								"{projectId}",
								newProjectID,
							),
						),
						map[string]any{
							"name":        "test app",
							"description": "test app description",
						},
					)
					assert.NoError(t, requestErr)
					assert.Equal(t, http.StatusCreated, response.StatusCode)
				},
			)
		}

		t.Run(
			"responds with status 403 FORBIDDEN if the user does not have projects access",
			func(t *testing.T) {
				newProjectID := createProject(t)

				response, requestErr := testClient.Post(
					context.TODO(),
					fmt.Sprintf(
						"/v1%s",
						strings.ReplaceAll(
							api.ApplicationsListEndpoint,
							"{projectId}",
							newProjectID,
						),
					),
					map[string]any{
						"name":        "test app",
						"description": "test app description",
					},
				)
				assert.NoError(t, requestErr)
				assert.Equal(t, http.StatusForbidden, response.StatusCode)
			},
		)

		t.Run(
			"responds with status 400 BAD REQUEST if the project id is invalid",
			func(t *testing.T) {
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
			},
		)

		t.Run(
			"responds with status 400 BAD REQUEST if the request body is invalid",
			func(t *testing.T) {
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
			},
		)

		t.Run(
			"responds with status 400 BAD REQUEST if the application name is empty",
			func(t *testing.T) {
				response, requestErr := testClient.Post(
					context.TODO(),
					fmt.Sprintf(
						"/v1%s",
						strings.ReplaceAll(api.ApplicationsListEndpoint, "{projectId}", projectID),
					),
					map[string]string{
						"name":        "",
						"description": "test app description",
					},
				)
				assert.NoError(t, requestErr)
				assert.Equal(t, http.StatusBadRequest, response.StatusCode)
			},
		)

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

	t.Run(fmt.Sprintf("GET: %s", api.ApplicationsListEndpoint), func(t *testing.T) {
		for _, permission := range []models.AccessPermissionType{
			models.AccessPermissionTypeMEMBER, models.AccessPermissionTypeADMIN,
		} {
			t.Run(
				fmt.Sprintf(
					"responds with status 200 OK if the user has %s permission and retrieves applications",
					permission,
				),
				func(t *testing.T) {
					newUserAccount, _ := factories.CreateUserAccount(context.TODO())
					newProjectID := createProject(t)
					createUserProject(t, newUserAccount.FirebaseID, newProjectID, permission)
					_ = createApplication(t, newProjectID)
					_ = createApplication(t, newProjectID)
					newTestClient := createTestClient(t, newUserAccount)

					response, requestErr := newTestClient.Get(
						context.TODO(),
						fmt.Sprintf(
							"/v1%s",
							strings.ReplaceAll(
								api.ApplicationsListEndpoint,
								"{projectId}",
								newProjectID,
							),
						),
					)
					assert.NoError(t, requestErr)
					assert.Equal(t, http.StatusOK, response.StatusCode)

					data := &[]dto.ApplicationDTO{}
					deserializationErr := serialization.DeserializeJSON(response.Body, data)
					assert.NoError(t, deserializationErr)

					assert.Len(t, *data, 2)
				},
			)
		}

		t.Run(
			"responds with status 403 FORBIDDEN if the user does not have project access",
			func(t *testing.T) {
				newProjectID := createProject(t)

				response, requestErr := testClient.Get(
					context.TODO(),
					fmt.Sprintf(
						"/v1%s",
						strings.ReplaceAll(
							api.ApplicationsListEndpoint,
							"{projectId}",
							newProjectID,
						),
					),
				)
				assert.NoError(t, requestErr)
				assert.Equal(t, http.StatusForbidden, response.StatusCode)
			},
		)
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

			responseApplication := models.Application{}
			deserializationErr := serialization.DeserializeJSON(
				response.Body,
				&responseApplication,
			)
			assert.NoError(t, deserializationErr)
			assert.Equal(t, application.ID, responseApplication.ID)
			assert.Equal(t, application.Name, responseApplication.Name)
			assert.Equal(t, application.Description, responseApplication.Description)
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
					createUserProject(t, newUserAccount.FirebaseID, newProjectID, permission)
					newApplicationID := createApplication(t, newProjectID)

					newTestClient := createTestClient(t, newUserAccount)

					response, requestErr := newTestClient.Get(
						context.TODO(),
						fmt.Sprintf(
							"/v1%s",
							strings.ReplaceAll(
								strings.ReplaceAll(
									api.ApplicationDetailEndpoint,
									"{projectId}",
									newProjectID,
								),
								"{applicationId}",
								newApplicationID,
							),
						),
					)
					assert.NoError(t, requestErr)
					assert.Equal(t, http.StatusOK, response.StatusCode)
				},
			)
		}

		t.Run(
			"responds with status 403 FORBIDDEN if the user does not have projects access",
			func(t *testing.T) {
				newProjectID := createProject(t)
				newApplicationID := createApplication(t, newProjectID)

				response, requestErr := testClient.Get(
					context.TODO(),
					fmt.Sprintf(
						"/v1%s",
						strings.ReplaceAll(
							strings.ReplaceAll(
								api.ApplicationDetailEndpoint,
								"{projectId}",
								newProjectID,
							),
							"{applicationId}",
							newApplicationID,
						),
					),
				)
				assert.NoError(t, requestErr)
				assert.Equal(t, http.StatusForbidden, response.StatusCode)
			},
		)

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
							"05f3095d-408a-4d7b-9722-8200673a3f4f",
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

			responseApplication := models.Application{}
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

		t.Run(
			"responds with status 401 UNAUTHORIZED if the user does not have ADMIN permission",
			func(t *testing.T) {},
		)
		t.Run(
			"responds with status 403 FORBIDDEN if the user does not have projects access",
			func(t *testing.T) {},
		)

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

		t.Run(
			"responds with status 400 BAD REQUEST if the application id is invalid",
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

		t.Run(
			"responds with status 400 BAD REQUEST if the request body is invalid",
			func(t *testing.T) {
				applicationID := createApplication(t, projectID)
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
							applicationID,
						),
					),
					"invalid",
				)
				assert.NoError(t, requestErr)
				assert.Equal(t, http.StatusBadRequest, response.StatusCode)
			},
		)

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

		t.Run(
			"responds with status 400 BAD REQUEST if the application name is empty",
			func(t *testing.T) {
				applicationID := createApplication(t, projectID)
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
							applicationID,
						),
					),
					map[string]string{
						"name":        "",
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

		t.Run(
			"responds with status 401 UNAUTHORIZED if the user does not have ADMIN permission",
			func(t *testing.T) {},
		)
		t.Run(
			"responds with status 403 FORBIDDEN if the user does not have projects access",
			func(t *testing.T) {},
		)

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

		t.Run(
			"responds with status 400 BAD REQUEST if the application id is invalid",
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

	t.Run(fmt.Sprintf("GET: %s", api.ApplicationAnalyticsEndpoint), func(t *testing.T) {
		invalidUUID := "invalid"
		applicationID := createApplication(t, projectID)
		promptConfigID := createPromptConfig(t, applicationID)
		createPromptRequestRecord(t, promptConfigID)

		fromDate := time.Now().AddDate(0, 0, -1)
		toDate := fromDate.AddDate(0, 0, 2)

		t.Run("retrieves application analytics", func(t *testing.T) {
			response, requestErr := testClient.Get(
				context.TODO(),
				fmt.Sprintf(
					"/v1%s",
					strings.ReplaceAll(
						strings.ReplaceAll(
							api.ApplicationAnalyticsEndpoint,
							"{projectId}",
							projectID,
						),
						"{applicationId}",
						applicationID,
					),
				),
			)
			assert.NoError(t, requestErr)
			assert.Equal(t, http.StatusOK, response.StatusCode)

			applicationUUID, _ := db.StringToUUID(applicationID)
			promptReqAnalytics := repositories.GetApplicationAnalyticsByDateRange(
				context.TODO(),
				*applicationUUID,
				fromDate,
				toDate,
			)

			responseAnalytics := dto.AnalyticsDTO{}
			deserializationErr := serialization.DeserializeJSON(
				response.Body,
				&responseAnalytics,
			)

			assert.NoError(t, deserializationErr)
			assert.Equal(t, promptReqAnalytics.TotalAPICalls, responseAnalytics.TotalAPICalls)
			assert.Equal(t, promptReqAnalytics.TokenCost, responseAnalytics.TokenCost)
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
					createUserProject(t, newUserAccount.FirebaseID, newProjectID, permission)
					newApplicationID := createApplication(t, newProjectID)

					newTestClient := createTestClient(t, newUserAccount)

					response, requestErr := newTestClient.Get(
						context.TODO(),
						fmt.Sprintf(
							"/v1%s",
							strings.ReplaceAll(
								strings.ReplaceAll(
									api.ApplicationAnalyticsEndpoint,
									"{projectId}",
									newProjectID,
								),
								"{applicationId}",
								newApplicationID,
							),
						),
					)
					assert.NoError(t, requestErr)
					assert.Equal(t, http.StatusOK, response.StatusCode)
				},
			)
		}

		t.Run(
			"responds with status 403 FORBIDDEN if the user does not have projects access",
			func(t *testing.T) {
				newProjectID := createProject(t)
				newApplicationID := createApplication(t, newProjectID)

				response, requestErr := testClient.Get(
					context.TODO(),
					fmt.Sprintf(
						"/v1%s",
						strings.ReplaceAll(
							strings.ReplaceAll(
								api.ApplicationAnalyticsEndpoint,
								"{projectId}",
								newProjectID,
							),
							"{applicationId}",
							newApplicationID,
						),
					),
				)
				assert.NoError(t, requestErr)
				assert.Equal(t, http.StatusForbidden, response.StatusCode)
			},
		)

		t.Run("responds with status 400 BAD REQUEST if projectID is invalid", func(t *testing.T) {
			response, requestErr := testClient.Get(
				context.TODO(),
				fmt.Sprintf(
					"/v1%s",
					strings.ReplaceAll(
						strings.ReplaceAll(
							api.ApplicationAnalyticsEndpoint,
							"{projectId}",
							invalidUUID,
						),
						"{applicationId}",
						applicationID,
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
								api.ApplicationAnalyticsEndpoint,
								"{projectId}",
								projectID,
							),
							"{applicationId}",
							invalidUUID,
						),
					),
				)
				assert.NoError(t, requestErr)
				assert.Equal(t, http.StatusBadRequest, response.StatusCode)
			},
		)
	})
}
