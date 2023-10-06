package api_test

import (
	"context"
	"fmt"
	"github.com/basemind-ai/monorepo/e2e/factories"
	"github.com/basemind-ai/monorepo/services/dashboard-backend/internal/api"
	"github.com/basemind-ai/monorepo/shared/go/db"
	"github.com/basemind-ai/monorepo/shared/go/serialization"
	"github.com/stretchr/testify/assert"
	"net/http"
	"strings"
	"testing"
)

func TestApplicationsAPI(t *testing.T) {
	projectId := createProject(t)
	firebaseId := factories.RandomString(10)
	testClient := createTestClient(t, firebaseId)

	t.Run(fmt.Sprintf("POST: %s", api.ApplicationsListEndpoint), func(t *testing.T) {
		t.Run("creates a new application", func(t *testing.T) {
			response, requestErr := testClient.Post(
				context.TODO(),
				fmt.Sprintf(
					"/v1%s",
					strings.ReplaceAll(api.ApplicationsListEndpoint, "{projectId}", projectId),
				),
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
				fmt.Sprintf(
					"/v1%s",
					strings.ReplaceAll(api.ApplicationsListEndpoint, "{projectId}", "invalid"),
				),
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
				fmt.Sprintf(
					"/v1%s",
					strings.ReplaceAll(api.ApplicationsListEndpoint, "{projectId}", projectId),
				),
				"invalid",
			)
			assert.NoError(t, requestErr)
			assert.Equal(t, http.StatusBadRequest, response.StatusCode)
		})
	})

	t.Run(fmt.Sprintf("GET: %s", api.ApplicationDetailEndpoint), func(t *testing.T) {
		t.Run("retrieves an existing application", func(t *testing.T) {
			applicationId := createApplication(t, projectId)

			response, requestErr := testClient.Get(
				context.TODO(),
				fmt.Sprintf(
					"/v1%s",
					strings.ReplaceAll(
						api.ApplicationDetailEndpoint,
						"{applicationId}",
						applicationId,
					),
				),
			)
			assert.NoError(t, requestErr)
			assert.Equal(t, http.StatusOK, response.StatusCode)

			uuidId, _ := db.StringToUUID(applicationId)

			application, _ := db.GetQueries().FindApplicationById(context.TODO(), *uuidId)

			responseApplication := db.Application{}
			deserializationErr := serialization.DeserializeJson(
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
						api.ApplicationDetailEndpoint,
						"{applicationId}",
						"invalid",
					),
				),
			)
			assert.NoError(t, requestErr)
			assert.Equal(t, http.StatusBadRequest, response.StatusCode)
		})
	})

	t.Run(fmt.Sprintf("PATCH: %s", api.ApplicationDetailEndpoint), func(t *testing.T) {
		t.Run("updates an existing application", func(t *testing.T) {
			applicationId := createApplication(t, projectId)

			response, requestErr := testClient.Patch(
				context.TODO(),
				fmt.Sprintf(
					"/v1%s",
					strings.ReplaceAll(
						api.ApplicationDetailEndpoint,
						"{applicationId}",
						applicationId,
					),
				),
				map[string]interface{}{
					"name":        "updated app",
					"description": "updated app description",
				},
			)
			assert.NoError(t, requestErr)
			assert.Equal(t, http.StatusOK, response.StatusCode)

			responseApplication := db.Application{}
			deserializationErr := serialization.DeserializeJson(
				response.Body,
				&responseApplication,
			)

			uuidId, _ := db.StringToUUID(applicationId)

			assert.NoError(t, deserializationErr)
			assert.Equal(t, *uuidId, responseApplication.ID)
			assert.Equal(t, "updated app", responseApplication.Name)
			assert.Equal(t, "updated app description", responseApplication.Description)
		})

		t.Run("returns an error if the application id is invalid", func(t *testing.T) {
			response, requestErr := testClient.Patch(
				context.TODO(),
				fmt.Sprintf(
					"/v1%s",
					strings.ReplaceAll(
						api.ApplicationDetailEndpoint,
						"{applicationId}",
						"invalid",
					),
				),
				map[string]interface{}{
					"name":        "updated app",
					"description": "updated app description",
				},
			)
			assert.NoError(t, requestErr)
			assert.Equal(t, http.StatusBadRequest, response.StatusCode)
		})

		t.Run("returns an error if the request body is invalid", func(t *testing.T) {
			applicationId := createApplication(t, projectId)
			response, requestErr := testClient.Patch(
				context.TODO(),
				fmt.Sprintf(
					"/v1%s",
					strings.ReplaceAll(
						api.ApplicationDetailEndpoint,
						"{applicationId}",
						applicationId,
					),
				),
				"invalid",
			)
			assert.NoError(t, requestErr)
			assert.Equal(t, http.StatusBadRequest, response.StatusCode)
		})
	})

	t.Run(fmt.Sprintf("DELETE: %s", api.ApplicationDetailEndpoint), func(t *testing.T) {
		t.Run("deletes an existing application", func(t *testing.T) {
			applicationId := createApplication(t, projectId)

			response, requestErr := testClient.Delete(
				context.TODO(),
				fmt.Sprintf(
					"/v1%s",
					strings.ReplaceAll(
						api.ApplicationDetailEndpoint,
						"{applicationId}",
						applicationId,
					),
				),
			)
			assert.NoError(t, requestErr)
			assert.Equal(t, http.StatusNoContent, response.StatusCode)

			uuidId, _ := db.StringToUUID(applicationId)
			_, applicationRetrieveErr := db.GetQueries().
				FindApplicationById(context.TODO(), *uuidId)

			assert.Error(t, applicationRetrieveErr)
		})

		t.Run("returns an error if the application id is invalid", func(t *testing.T) {
			response, requestErr := testClient.Delete(
				context.TODO(),
				fmt.Sprintf(
					"/v1%s",
					strings.ReplaceAll(
						api.ApplicationDetailEndpoint,
						"{applicationId}",
						"invalid",
					),
				),
			)
			assert.NoError(t, requestErr)
			assert.Equal(t, http.StatusBadRequest, response.StatusCode)
		})
	})
}
