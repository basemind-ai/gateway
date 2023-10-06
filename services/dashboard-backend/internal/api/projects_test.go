package api_test

import (
	"context"
	"fmt"
	"github.com/basemind-ai/monorepo/services/dashboard-backend/internal/api"
	"github.com/basemind-ai/monorepo/services/dashboard-backend/internal/dto"
	"github.com/basemind-ai/monorepo/shared/go/db"
	"github.com/basemind-ai/monorepo/shared/go/serialization"
	"github.com/stretchr/testify/assert"
	"net/http"
	"strings"
	"testing"
)

func TestProjectsAPI(t *testing.T) {
	firebaseId := createUser(t)
	testClient := createTestClient(t, firebaseId)

	t.Run(fmt.Sprintf("POST: %s", api.ProjectsListEndpoint), func(t *testing.T) {
		t.Run("creates a new project and sets the user as ADMIN", func(t *testing.T) {
			body := &dto.ProjectDTO{
				Name:        "Test Project",
				Description: "Test Description",
			}
			response, requestErr := testClient.Post(
				context.Background(),
				api.ProjectsListEndpoint,
				body,
			)
			assert.NoError(t, requestErr)
			assert.Equal(t, http.StatusCreated, response.StatusCode)

			data := &dto.ProjectDTO{}
			deserializationErr := serialization.DeserializeJson(response.Body, data)
			assert.NoError(t, deserializationErr)

			assert.NotEmpty(t, data.ID)
			assert.Equal(t, body.Name, data.Name)
			assert.Equal(t, body.Description, data.Description)
			assert.Equal(t, true, data.IsUserDefaultProject)
			assert.Equal(t, "ADMIN", data.Permission)
		})
		t.Run(
			"responds with status 400 BAD REQUEST if the request body is invalid",
			func(t *testing.T) {
				body := &dto.ProjectDTO{
					Name: "",
				}
				response, requestErr := testClient.Post(
					context.Background(),
					api.ProjectsListEndpoint,
					body,
				)
				assert.NoError(t, requestErr)
				assert.Equal(t, http.StatusBadRequest, response.StatusCode)
			},
		)
	})
	t.Run(fmt.Sprintf("PATCH: %s", api.ProjectDetailEndpoint), func(t *testing.T) {
		t.Run("allows updating the name and description of a project", func(t *testing.T) {
			projectId := createProject(t)
			createUserProject(t, firebaseId, projectId, db.AccessPermissionTypeADMIN)

			body := &dto.ProjectDTO{
				Name:        "New Name",
				Description: "New Description",
			}
			url := fmt.Sprintf(
				"/v1%s",
				strings.ReplaceAll(api.ProjectDetailEndpoint, "{projectId}", projectId),
			)
			response, requestErr := testClient.Patch(context.Background(), url, body)
			assert.NoError(t, requestErr)
			assert.Equal(t, http.StatusOK, response.StatusCode)

			data := &dto.ProjectDTO{}
			deserializationErr := serialization.DeserializeJson(response.Body, data)
			assert.NoError(t, deserializationErr)

			assert.Equal(t, projectId, data.ID)
			assert.Equal(t, body.Name, data.Name)
			assert.Equal(t, body.Description, data.Description)
		})
		t.Run(
			"responds with status 403 FORBIDDEN if user does not have ADMIN permission",
			func(t *testing.T) {
				projectId := createProject(t)
				createUserProject(t, firebaseId, projectId, db.AccessPermissionTypeMEMBER)

				body := &dto.ProjectDTO{
					Name:        "New Name",
					Description: "New Description",
				}
				url := fmt.Sprintf(
					"/v1%s",
					strings.ReplaceAll(api.ProjectDetailEndpoint, "{projectId}", projectId),
				)
				response, requestErr := testClient.Patch(context.Background(), url, body)
				assert.NoError(t, requestErr)
				assert.Equal(t, http.StatusForbidden, response.StatusCode)
			},
		)
		t.Run(
			"responds with status 400 BAD REQUEST if the request body is invalid",
			func(t *testing.T) {
				projectId := createProject(t)
				createUserProject(t, firebaseId, projectId, db.AccessPermissionTypeADMIN)

				body := &dto.ProjectDTO{
					Name: "",
				}
				url := fmt.Sprintf(
					"/v1%s",
					strings.ReplaceAll(api.ProjectDetailEndpoint, "{projectId}", projectId),
				)
				response, requestErr := testClient.Patch(context.Background(), url, body)
				assert.NoError(t, requestErr)
				assert.Equal(t, http.StatusBadRequest, response.StatusCode)
			},
		)
		t.Run(
			"responds with status 404 NOT FOUND if the projectId is invalid",
			func(t *testing.T) {
				body := &dto.ProjectDTO{
					Name:        "New Name",
					Description: "New Description",
				}
				url := fmt.Sprintf(
					"/v1%s",
					strings.ReplaceAll(api.ProjectDetailEndpoint, "{projectId}", "invalid"),
				)
				response, requestErr := testClient.Patch(context.Background(), url, body)
				assert.NoError(t, requestErr)
				assert.Equal(t, http.StatusNotFound, response.StatusCode)
			},
		)
	})
	t.Run(fmt.Sprintf("DELETE: %s", api.ProjectDetailEndpoint), func(t *testing.T) {
		t.Run(
			"deletes a project and all associated applications by setting the deleted_at timestamp on these",
			func(t *testing.T) {
				projectId := createProject(t)
				createUserProject(t, firebaseId, projectId, db.AccessPermissionTypeADMIN)
				applicationId := createApplication(t, projectId)

				url := fmt.Sprintf(
					"/v1%s",
					strings.ReplaceAll(api.ProjectDetailEndpoint, "{projectId}", projectId),
				)
				response, requestErr := testClient.Delete(context.Background(), url)
				assert.NoError(t, requestErr)
				assert.Equal(t, http.StatusNoContent, response.StatusCode)

				projectUUID, _ := db.StringToUUID(projectId)
				_, err := db.GetQueries().FindProjectById(context.Background(), *projectUUID)
				assert.Error(t, err)

				applicationUUID, _ := db.StringToUUID(applicationId)
				_, err = db.GetQueries().FindApplicationById(context.Background(), *applicationUUID)
				assert.Error(t, err)
			},
		)
		t.Run(
			"responds with status 403 FORBIDDEN if user does not have ADMIN permission",
			func(t *testing.T) {
				projectId := createProject(t)
				createUserProject(t, firebaseId, projectId, db.AccessPermissionTypeMEMBER)

				url := fmt.Sprintf(
					"/v1%s",
					strings.ReplaceAll(api.ProjectDetailEndpoint, "{projectId}", projectId),
				)
				response, requestErr := testClient.Delete(context.Background(), url)
				assert.NoError(t, requestErr)
				assert.Equal(t, http.StatusForbidden, response.StatusCode)
			},
		)
		t.Run(
			"responds with status 404 NOT FOUND if the projectId is invalid",
			func(t *testing.T) {
				url := fmt.Sprintf(
					"/v1%s",
					strings.ReplaceAll(api.ProjectDetailEndpoint, "{projectId}", "invalid"),
				)
				response, requestErr := testClient.Delete(context.Background(), url)
				assert.NoError(t, requestErr)
				assert.Equal(t, http.StatusNotFound, response.StatusCode)
			},
		)
	})
}
