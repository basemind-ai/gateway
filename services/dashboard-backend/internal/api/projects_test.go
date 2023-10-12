package api_test

import (
	"context"
	"fmt"
	"github.com/basemind-ai/monorepo/e2e/factories"
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
	userAccount, _ := factories.CreateUserAccount(context.TODO())
	testClient := createTestClient(t, userAccount)

	t.Run(fmt.Sprintf("POST: %s", api.ProjectsListEndpoint), func(t *testing.T) {
		t.Run("creates a new project and sets the user as ADMIN", func(t *testing.T) {
			body := &dto.ProjectDTO{
				Name:        "Test Project",
				Description: "Test Description",
			}
			response, requestErr := testClient.Post(
				context.TODO(),
				fmt.Sprintf("/v1%s", api.ProjectsListEndpoint),
				body,
			)
			assert.NoError(t, requestErr)
			assert.Equal(t, http.StatusCreated, response.StatusCode)

			data := &dto.ProjectDTO{}
			deserializationErr := serialization.DeserializeJSON(response.Body, data)
			assert.NoError(t, deserializationErr)

			assert.NotEmpty(t, data.ID)
			assert.Equal(t, body.Name, data.Name)
			assert.Equal(t, body.Description, data.Description)
			assert.Equal(t, "ADMIN", data.Permission)
		})

		t.Run(
			"responds with status 400 BAD REQUEST if the request body is invalid",
			func(t *testing.T) {
				body := &dto.ProjectDTO{
					Name: "",
				}
				response, requestErr := testClient.Post(
					context.TODO(),
					fmt.Sprintf("/v1%s", api.ProjectsListEndpoint),
					body,
				)
				assert.NoError(t, requestErr)
				assert.Equal(t, http.StatusBadRequest, response.StatusCode)
			},
		)
	})
	t.Run(fmt.Sprintf("GET: %s", api.ProjectsListEndpoint), func(t *testing.T) {
		t.Run("retrieves all projects for the user", func(t *testing.T) {
			newUserAccount, _ := factories.CreateUserAccount(context.TODO())
			project1ID := createProject(t)
			project2ID := createProject(t)
			createUserProject(
				t,
				newUserAccount.FirebaseID,
				project1ID,
				db.AccessPermissionTypeADMIN,
			)
			createUserProject(
				t,
				newUserAccount.FirebaseID,
				project2ID,
				db.AccessPermissionTypeMEMBER,
			)

			client := createTestClient(t, newUserAccount)

			response, requestErr := client.Get(
				context.TODO(),
				fmt.Sprintf("/v1%s", api.ProjectsListEndpoint),
			)
			assert.NoError(t, requestErr)
			assert.Equal(t, http.StatusOK, response.StatusCode)

			data := &[]dto.ProjectDTO{}
			deserializationErr := serialization.DeserializeJSON(response.Body, data)
			assert.NoError(t, deserializationErr)

			assert.Len(t, *data, 2)
		})
	})

	t.Run(fmt.Sprintf("PATCH: %s", api.ProjectDetailEndpoint), func(t *testing.T) {
		t.Run("allows updating the name and description of a project", func(t *testing.T) {
			projectID := createProject(t)
			createUserProject(t, userAccount.FirebaseID, projectID, db.AccessPermissionTypeADMIN)

			body := &dto.ProjectDTO{
				Name:        "New Name",
				Description: "New Description",
			}
			url := fmt.Sprintf(
				"/v1%s",
				strings.ReplaceAll(api.ProjectDetailEndpoint, "{projectId}", projectID),
			)
			response, requestErr := testClient.Patch(context.TODO(), url, body)
			assert.NoError(t, requestErr)
			assert.Equal(t, http.StatusOK, response.StatusCode)

			data := &dto.ProjectDTO{}
			deserializationErr := serialization.DeserializeJSON(response.Body, data)
			assert.NoError(t, deserializationErr)

			assert.Equal(t, projectID, data.ID)
			assert.Equal(t, body.Name, data.Name)
			assert.Equal(t, body.Description, data.Description)
		})

		t.Run(
			"responds with status 401 UNAUTHORIZED if user does not have ADMIN permission",
			func(t *testing.T) {
				projectID := createProject(t)
				createUserProject(
					t,
					userAccount.FirebaseID,
					projectID,
					db.AccessPermissionTypeMEMBER,
				)

				body := &dto.ProjectDTO{
					Name:        "New Name",
					Description: "New Description",
				}
				url := fmt.Sprintf(
					"/v1%s",
					strings.ReplaceAll(api.ProjectDetailEndpoint, "{projectId}", projectID),
				)
				response, requestErr := testClient.Patch(context.TODO(), url, body)
				assert.NoError(t, requestErr)
				assert.Equal(t, http.StatusUnauthorized, response.StatusCode)
			},
		)

		t.Run(
			"responds with status 400 BAD REQUEST if the projectID is invalid",
			func(t *testing.T) {
				body := &dto.ProjectDTO{
					Name:        "New Name",
					Description: "New Description",
				}
				url := fmt.Sprintf(
					"/v1%s",
					strings.ReplaceAll(api.ProjectDetailEndpoint, "{projectId}", "invalid"),
				)
				response, requestErr := testClient.Patch(context.TODO(), url, body)
				assert.NoError(t, requestErr)
				assert.Equal(t, http.StatusBadRequest, response.StatusCode)
			},
		)

		t.Run(
			"responds with status 403 Forbidden if no project matching the ID is found",
			func(t *testing.T) {
				projectID := createProject(t)
				createUserProject(
					t,
					userAccount.FirebaseID,
					projectID,
					db.AccessPermissionTypeADMIN,
				)

				uuidID, _ := db.StringToUUID(projectID)
				_ = db.GetQueries().DeleteProject(context.TODO(), *uuidID)

				body := &dto.ProjectDTO{
					Name:        "New Name",
					Description: "New Description",
				}
				url := fmt.Sprintf(
					"/v1%s",
					strings.ReplaceAll(api.ProjectDetailEndpoint, "{projectId}", projectID),
				)
				response, requestErr := testClient.Patch(context.TODO(), url, body)
				assert.NoError(t, requestErr)
				assert.Equal(t, http.StatusForbidden, response.StatusCode)
			},
		)
	})

	t.Run(fmt.Sprintf("DELETE: %s", api.ProjectDetailEndpoint), func(t *testing.T) {
		t.Run(
			"deletes a project and all associated applications by setting the deleted_at timestamp on these",
			func(t *testing.T) {
				projectID := createProject(t)
				createUserProject(
					t,
					userAccount.FirebaseID,
					projectID,
					db.AccessPermissionTypeADMIN,
				)
				applicationID := createApplication(t, projectID)

				url := fmt.Sprintf(
					"/v1%s",
					strings.ReplaceAll(api.ProjectDetailEndpoint, "{projectId}", projectID),
				)
				response, requestErr := testClient.Delete(context.TODO(), url)
				assert.NoError(t, requestErr)
				assert.Equal(t, http.StatusNoContent, response.StatusCode)

				projectUUID, _ := db.StringToUUID(projectID)
				_, err := db.GetQueries().RetrieveProject(context.TODO(), db.RetrieveProjectParams{
					ID:         *projectUUID,
					FirebaseID: userAccount.FirebaseID,
				})
				assert.Error(t, err)

				applicationUUID, _ := db.StringToUUID(applicationID)
				_, err = db.GetQueries().
					RetrieveApplication(context.TODO(), *applicationUUID)
				assert.Error(t, err)
			},
		)
		t.Run(
			"responds with status 401 UNAUTHORIZED if user does not have ADMIN permission",
			func(t *testing.T) {
				projectID := createProject(t)
				createUserProject(
					t,
					userAccount.FirebaseID,
					projectID,
					db.AccessPermissionTypeMEMBER,
				)

				url := fmt.Sprintf(
					"/v1%s",
					strings.ReplaceAll(api.ProjectDetailEndpoint, "{projectId}", projectID),
				)
				response, requestErr := testClient.Delete(context.TODO(), url)
				assert.NoError(t, requestErr)
				assert.Equal(t, http.StatusUnauthorized, response.StatusCode)
			},
		)
		t.Run(
			"responds with status 400 BAD REQUEST if the projectID is invalid",
			func(t *testing.T) {
				url := fmt.Sprintf(
					"/v1%s",
					strings.ReplaceAll(api.ProjectDetailEndpoint, "{projectId}", "invalid"),
				)
				response, requestErr := testClient.Delete(context.TODO(), url)
				assert.NoError(t, requestErr)
				assert.Equal(t, http.StatusBadRequest, response.StatusCode)
			},
		)

		t.Run(
			"responds with status 403 FORBIDDEN if no project matching the ID is found",
			func(t *testing.T) {
				projectID := createProject(t)
				createUserProject(
					t,
					userAccount.FirebaseID,
					projectID,
					db.AccessPermissionTypeADMIN,
				)

				uuidID, _ := db.StringToUUID(projectID)
				_ = db.GetQueries().DeleteProject(context.TODO(), *uuidID)

				url := fmt.Sprintf(
					"/v1%s",
					strings.ReplaceAll(api.ProjectDetailEndpoint, "{projectId}", projectID),
				)
				response, requestErr := testClient.Delete(context.TODO(), url)
				assert.NoError(t, requestErr)
				assert.Equal(t, http.StatusForbidden, response.StatusCode)
			},
		)
	})
}
