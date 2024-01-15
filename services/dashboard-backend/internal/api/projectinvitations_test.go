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
	"github.com/stretchr/testify/assert"
	"net/http"
	"strings"
	"testing"
)

func TestProjectInvitationsAPI(t *testing.T) {
	t.Run(fmt.Sprintf("GET: %s", api.ProjectInvitationListEndpoint), func(t *testing.T) {
		t.Run("retrieves a slice of project invitations", func(t *testing.T) {
			userAccount, _ := factories.CreateUserAccount(context.TODO())
			projectID := createProject(t)
			createUserProject(
				t,
				userAccount.FirebaseID,
				projectID,
				models.AccessPermissionTypeADMIN,
			)

			testClient := createTestClient(t, userAccount)

			projectUUID, _ := db.StringToUUID(projectID)
			invite1, err := db.GetQueries().
				UpsertProjectInvitation(context.Background(), models.UpsertProjectInvitationParams{
					Email:      "a@example.com",
					ProjectID:  *projectUUID,
					Permission: models.AccessPermissionTypeADMIN,
				})
			assert.NoError(t, err)

			invite2, err := db.GetQueries().
				UpsertProjectInvitation(context.TODO(), models.UpsertProjectInvitationParams{
					Email:      "b@example.com",
					ProjectID:  *projectUUID,
					Permission: models.AccessPermissionTypeADMIN,
				})
			assert.NoError(t, err)

			response, requestErr := testClient.Get(
				context.TODO(),
				fmt.Sprintf(
					"/v1%s",
					strings.ReplaceAll(api.ProjectInvitationListEndpoint, "{projectId}", projectID),
				))
			assert.NoError(t, requestErr)
			assert.Equal(t, 200, response.StatusCode)

			data := make([]dto.ProjectInvitationDTO, 0)
			deserializationErr := serialization.DeserializeJSON(response.Body, &data)
			assert.NoError(t, deserializationErr)

			assert.Len(t, data, 2)
			assert.Equal(t, db.UUIDToString(&invite1.ID), data[0].ID)
			assert.Equal(t, db.UUIDToString(&invite2.ID), data[1].ID)
		})

		t.Run("handles empty slice of project invitations", func(t *testing.T) {
			userAccount, _ := factories.CreateUserAccount(context.Background())
			projectID := createProject(t)
			createUserProject(
				t,
				userAccount.FirebaseID,
				projectID,
				models.AccessPermissionTypeADMIN,
			)

			testClient := createTestClient(t, userAccount)

			response, requestErr := testClient.Get(
				context.TODO(),
				fmt.Sprintf(
					"/v1%s",
					strings.ReplaceAll(api.ProjectInvitationListEndpoint, "{projectId}", projectID),
				))
			assert.NoError(t, requestErr)
			assert.Equal(t, 200, response.StatusCode)

			data := make([]dto.ProjectInvitationDTO, 0)
			deserializationErr := serialization.DeserializeJSON(response.Body, &data)
			assert.NoError(t, deserializationErr)

			assert.Len(t, data, 0)
		})

		t.Run(
			"responds with status 403 Forbidden if no project matching the ID is found",
			func(t *testing.T) {
				userAccount, _ := factories.CreateUserAccount(context.Background())
				testClient := createTestClient(t, userAccount)

				response, requestErr := testClient.Get(
					context.TODO(),
					fmt.Sprintf(
						"/v1%s",
						strings.ReplaceAll(
							api.ProjectInvitationListEndpoint,
							"{projectId}",
							"c79cb68d-1484-4c0d-ac3d-1fa2c91c8082",
						),
					))
				assert.NoError(t, requestErr)
				assert.Equal(t, http.StatusForbidden, response.StatusCode)
			},
		)

		t.Run(
			"responds with status 403 Forbidden if the user does not have access to the project",
			func(t *testing.T) {
				userAccount, _ := factories.CreateUserAccount(context.Background())
				projectID := createProject(t)
				testClient := createTestClient(t, userAccount)

				response, requestErr := testClient.Get(
					context.TODO(),
					fmt.Sprintf(
						"/v1%s",
						strings.ReplaceAll(
							api.ProjectInvitationListEndpoint,
							"{projectId}",
							projectID,
						),
					))
				assert.NoError(t, requestErr)
				assert.Equal(t, http.StatusForbidden, response.StatusCode)
			},
		)
	})

	t.Run(fmt.Sprintf("DELETE: %s", api.ProjectInvitationDetailEndpoint), func(t *testing.T) {
		t.Run("deletes a project invitation", func(t *testing.T) {
			userAccount, _ := factories.CreateUserAccount(context.Background())
			projectID := createProject(t)
			createUserProject(
				t,
				userAccount.FirebaseID,
				projectID,
				models.AccessPermissionTypeADMIN,
			)

			testClient := createTestClient(t, userAccount)

			projectUUID, _ := db.StringToUUID(projectID)
			invite, err := db.GetQueries().
				UpsertProjectInvitation(context.Background(), models.UpsertProjectInvitationParams{
					Email:      "x@example.com",
					ProjectID:  *projectUUID,
					Permission: models.AccessPermissionTypeADMIN,
				})
			assert.NoError(t, err)

			url := fmt.Sprintf(
				"/v1%s", strings.ReplaceAll(
					strings.ReplaceAll(
						api.ProjectInvitationDetailEndpoint,
						"{projectId}",
						projectID,
					),
					"{projectInvitationId}",
					db.UUIDToString(&invite.ID),
				))

			response, requestErr := testClient.Delete(
				context.TODO(),
				url,
			)
			assert.NoError(t, requestErr)
			assert.Equal(t, http.StatusNoContent, response.StatusCode)
		})

		t.Run("responds with status 401 UNAUTHORIZED if the user does not have ADMIN permission",
			func(t *testing.T) {
				userAccount, _ := factories.CreateUserAccount(context.Background())
				projectID := createProject(t)
				createUserProject(
					t,
					userAccount.FirebaseID,
					projectID,
					models.AccessPermissionTypeMEMBER,
				)

				testClient := createTestClient(t, userAccount)

				projectUUID, _ := db.StringToUUID(projectID)
				invite, err := db.GetQueries().
					UpsertProjectInvitation(context.Background(), models.UpsertProjectInvitationParams{
						Email:      "x@example.com",
						ProjectID:  *projectUUID,
						Permission: models.AccessPermissionTypeADMIN,
					})
				assert.NoError(t, err)

				url := fmt.Sprintf(
					"/v1%s", strings.ReplaceAll(
						strings.ReplaceAll(
							api.ProjectInvitationDetailEndpoint,
							"{projectId}",
							projectID,
						),
						"{projectInvitationId}",
						db.UUIDToString(&invite.ID),
					))

				response, requestErr := testClient.Delete(
					context.TODO(),
					url,
				)
				assert.NoError(t, requestErr)
				assert.Equal(t, http.StatusUnauthorized, response.StatusCode)
			})
	})
}
