package api_test

import (
	"context"
	"fmt"
	"github.com/basemind-ai/monorepo/services/dashboard-backend/api"
	"github.com/basemind-ai/monorepo/services/dashboard-backend/middleware"
	"github.com/basemind-ai/monorepo/shared/go/db"
	dbTestUtils "github.com/basemind-ai/monorepo/shared/go/db/testutils"
	httpTestUtils "github.com/basemind-ai/monorepo/shared/go/httpclient/testutils"
	"github.com/basemind-ai/monorepo/shared/go/router"
	"github.com/basemind-ai/monorepo/shared/go/serialization"
	"github.com/stretchr/testify/assert"
	"net/http"
	"strings"
	"testing"
)

func TestAPI(t *testing.T) {
	dbTestUtils.CreateTestDB(t)

	t.Run("Project CRUD", func(t *testing.T) {
		t.Run("HandleDashboardUserPostLogin", func(t *testing.T) {
			t.Run("creates a new user and returns its default project", func(t *testing.T) {
				userId := "123abc"
				r := router.New(router.Options{
					Environment:      "test",
					ServiceName:      "test",
					RegisterHandlers: api.RegisterHandlers,
					Middlewares: []func(next http.Handler) http.Handler{
						middleware.CreateMockFirebaseAuthMiddleware(userId),
					},
				})

				testClient := httpTestUtils.CreateTestClient(t, r)

				response, requestErr := testClient.Get(context.TODO(), fmt.Sprintf("/v1%s", api.ProjectsListEndpoint))
				assert.NoError(t, requestErr)
				assert.Equal(t, http.StatusOK, response.StatusCode)

				projects := make([]db.FindProjectsByUserIdRow, 0)
				deserializationErr := serialization.DeserializeJson(response.Body, &projects)
				assert.NoError(t, deserializationErr)
				assert.Len(t, projects, 1)
				assert.Equal(t, "Default Project", projects[0].Name)        //nolint:gosec
				assert.Equal(t, "Default Project", projects[0].Description) //nolint:gosec
			})

			t.Run("retrieves projects for existing user", func(t *testing.T) {
				userId := "xxx123"

				_, userCreateErr := api.GetOrCreateUser(context.Background(), db.GetQueries(), userId)
				assert.NoError(t, userCreateErr)

				r := router.New(router.Options{
					Environment:      "test",
					ServiceName:      "test",
					RegisterHandlers: api.RegisterHandlers,
					Middlewares: []func(next http.Handler) http.Handler{
						middleware.CreateMockFirebaseAuthMiddleware(userId),
					},
				})

				testClient := httpTestUtils.CreateTestClient(t, r)

				response, requestErr := testClient.Get(context.TODO(), fmt.Sprintf("/v1%s", api.ProjectsListEndpoint))
				assert.NoError(t, requestErr)
				assert.Equal(t, http.StatusOK, response.StatusCode)

				projects := make([]db.FindProjectsByUserIdRow, 0)
				deserializationErr := serialization.DeserializeJson(response.Body, &projects)
				assert.NoError(t, deserializationErr)
				assert.Len(t, projects, 1)
				assert.Equal(t, "Default Project", projects[0].Name)        //nolint:gosec
				assert.Equal(t, "Default Project", projects[0].Description) //nolint:gosec
			})

			t.Run("returns error when a user exists without projects", func(t *testing.T) {
				userId := "zzz123"

				_, userCreateErr := db.GetQueries().CreateUser(context.TODO(), userId)
				assert.NoError(t, userCreateErr)

				r := router.New(router.Options{
					Environment:      "test",
					ServiceName:      "test",
					RegisterHandlers: api.RegisterHandlers,
					Middlewares: []func(next http.Handler) http.Handler{
						middleware.CreateMockFirebaseAuthMiddleware(userId),
					},
				})

				testClient := httpTestUtils.CreateTestClient(t, r)

				response, requestErr := testClient.Get(context.TODO(), fmt.Sprintf("/v1%s", api.ProjectsListEndpoint))
				assert.NoError(t, requestErr)
				assert.Equal(t, http.StatusInternalServerError, response.StatusCode)
			})
		})
	})

	t.Run("Application CRUD", func(t *testing.T) {
		project, createProjectErr := db.GetQueries().CreateProject(context.TODO(), db.CreateProjectParams{
			Name:        "test project",
			Description: "test project description",
		})
		assert.NoError(t, createProjectErr)

		projectId := db.UUIDToString(&project.ID)

		userId := "123abc"
		r := router.New(router.Options{
			Environment:      "test",
			ServiceName:      "test",
			RegisterHandlers: api.RegisterHandlers,
			Middlewares: []func(next http.Handler) http.Handler{
				middleware.CreateMockFirebaseAuthMiddleware(userId),
			},
		})
		testClient := httpTestUtils.CreateTestClient(t, r)

		t.Run("HandleCreateApplication", func(t *testing.T) {
			t.Run("creates a new application", func(t *testing.T) {
				response, requestErr := testClient.Post(
					context.TODO(),
					fmt.Sprintf("/v1%s", strings.ReplaceAll(api.ApplicationsListEndpoint, "{projectId}", projectId)),
					map[string]interface{}{
						"name":        "test app",
						"description": "test app description",
					},
				)
				assert.NoError(t, requestErr)
				assert.Equal(t, http.StatusCreated, response.StatusCode)

				application := db.Application{}
				deserializationErr := serialization.DeserializeJson(response.Body, &application)
				assert.NoError(t, deserializationErr)
				assert.NotNil(t, application.ID)
				assert.Equal(t, "test app", application.Name)
				assert.Equal(t, "test app description", application.Description)
			})

			t.Run("returns an error if the project id is invalid", func(t *testing.T) {
				response, requestErr := testClient.Post(
					context.TODO(),
					fmt.Sprintf("/v1%s", strings.ReplaceAll(api.ApplicationsListEndpoint, "{projectId}", "invalid")),
					map[string]interface{}{
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
					fmt.Sprintf("/v1%s", strings.ReplaceAll(api.ApplicationsListEndpoint, "{projectId}", projectId)),
					map[string]interface{}{
						"name":        "",
						"description": "test app description",
					},
				)
				assert.NoError(t, requestErr)
				assert.Equal(t, http.StatusBadRequest, response.StatusCode)
			})
		})

		t.Run("HandleRetrieveApplication", func(t *testing.T) {
			t.Run("retrieves an existing application", func(t *testing.T) {
				application, applicationCreateErr := db.GetQueries().CreateApplication(context.TODO(), db.CreateApplicationParams{
					ProjectID: project.ID,
				})
				assert.NoError(t, applicationCreateErr)

				applicationId := db.UUIDToString(&application.ID)
				response, requestErr := testClient.Get(
					context.TODO(),
					fmt.Sprintf("/v1%s", strings.ReplaceAll(api.ApplicationDetailEndpoint, "{applicationId}", applicationId)),
				)
				assert.NoError(t, requestErr)
				assert.Equal(t, http.StatusOK, response.StatusCode)

				responseApplication := db.Application{}
				deserializationErr := serialization.DeserializeJson(response.Body, &responseApplication)
				assert.NoError(t, deserializationErr)
				assert.Equal(t, application.ID, responseApplication.ID)
				assert.Equal(t, application.Name, responseApplication.Name)
				assert.Equal(t, application.Description, responseApplication.Description)
			})

			t.Run("returns an error if the application id is invalid", func(t *testing.T) {
				response, requestErr := testClient.Get(
					context.TODO(),
					fmt.Sprintf("/v1%s", strings.ReplaceAll(api.ApplicationDetailEndpoint, "{applicationId}", "invalid")),
				)
				assert.NoError(t, requestErr)
				assert.Equal(t, http.StatusBadRequest, response.StatusCode)
			})
		})

		t.Run("HandleUpdateApplication", func(t *testing.T) {
			t.Run("updates an existing application", func(t *testing.T) {
				application, applicationCreateErr := db.GetQueries().CreateApplication(context.TODO(), db.CreateApplicationParams{
					ProjectID: project.ID,
				})
				assert.NoError(t, applicationCreateErr)

				applicationId := db.UUIDToString(&application.ID)
				response, requestErr := testClient.Patch(
					context.TODO(),
					fmt.Sprintf("/v1%s", strings.ReplaceAll(api.ApplicationDetailEndpoint, "{applicationId}", applicationId)),
					map[string]interface{}{
						"name":        "updated app",
						"description": "updated app description",
					},
				)
				assert.NoError(t, requestErr)
				assert.Equal(t, http.StatusOK, response.StatusCode)

				responseApplication := db.Application{}
				deserializationErr := serialization.DeserializeJson(response.Body, &responseApplication)
				assert.NoError(t, deserializationErr)
				assert.Equal(t, application.ID, responseApplication.ID)
				assert.Equal(t, "updated app", responseApplication.Name)
				assert.Equal(t, "updated app description", responseApplication.Description)
			})

			t.Run("returns an error if the application id is invalid", func(t *testing.T) {
				response, requestErr := testClient.Patch(
					context.TODO(),
					fmt.Sprintf("/v1%s", strings.ReplaceAll(api.ApplicationDetailEndpoint, "{applicationId}", "invalid")),
					map[string]interface{}{
						"name":        "updated app",
						"description": "updated app description",
					},
				)
				assert.NoError(t, requestErr)
				assert.Equal(t, http.StatusBadRequest, response.StatusCode)
			})
		})

		t.Run("HandleDeleteApplication", func(t *testing.T) {
			t.Run("deletes an existing application", func(t *testing.T) {
				application, applicationCreateErr := db.GetQueries().CreateApplication(context.TODO(), db.CreateApplicationParams{
					ProjectID: project.ID,
				})
				assert.NoError(t, applicationCreateErr)

				applicationId := db.UUIDToString(&application.ID)
				response, requestErr := testClient.Delete(
					context.TODO(),
					fmt.Sprintf("/v1%s", strings.ReplaceAll(api.ApplicationDetailEndpoint, "{applicationId}", applicationId)),
				)
				assert.NoError(t, requestErr)
				assert.Equal(t, http.StatusNoContent, response.StatusCode)

				_, applicationRetrieveErr := db.GetQueries().FindApplicationById(context.TODO(), application.ID)
				assert.Error(t, applicationRetrieveErr)
			})

			t.Run("returns an error if the application id is invalid", func(t *testing.T) {
				response, requestErr := testClient.Delete(
					context.TODO(),
					fmt.Sprintf("/v1%s", strings.ReplaceAll(api.ApplicationDetailEndpoint, "{applicationId}", "invalid")),
				)
				assert.NoError(t, requestErr)
				assert.Equal(t, http.StatusBadRequest, response.StatusCode)
			})
		})
	})
}
