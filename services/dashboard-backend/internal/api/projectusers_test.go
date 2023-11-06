package api_test

import (
	"cloud.google.com/go/pubsub"
	"context"
	"encoding/json"
	"fmt"
	"github.com/basemind-ai/monorepo/cloud-functions/emailsender"
	"github.com/basemind-ai/monorepo/e2e/factories"
	"github.com/basemind-ai/monorepo/services/dashboard-backend/internal/api"
	"github.com/basemind-ai/monorepo/services/dashboard-backend/internal/dto"
	"github.com/basemind-ai/monorepo/shared/go/db"
	"github.com/basemind-ai/monorepo/shared/go/db/models"
	"github.com/basemind-ai/monorepo/shared/go/pubsubutils"
	"github.com/basemind-ai/monorepo/shared/go/serialization"
	"github.com/basemind-ai/monorepo/shared/go/testutils"
	"github.com/stretchr/testify/assert"
	"net/http"
	"strings"
	"testing"
	"time"
)

func TestProjectUsersAPI(t *testing.T) { //nolint: revive
	testutils.SetTestEnv(t)

	fmtListEndpoint := func(projectID string) string {
		return fmt.Sprintf(
			"/v1%s",
			strings.ReplaceAll(
				api.ProjectUserListEndpoint,
				"{projectId}",
				projectID),
		)
	}

	fmtDetailEndpoint := func(projectID string, userID string) string {
		return fmt.Sprintf(
			"/v1%s",
			strings.ReplaceAll(
				strings.ReplaceAll(
					api.ProjectUserDetailEndpoint,
					"{projectId}",
					projectID,
				),
				"{userId}",
				userID,
			),
		)
	}
	t.Run(fmt.Sprintf("GET: %s", api.ProjectUserListEndpoint), func(t *testing.T) {
		t.Run("returns a list of project users", func(t *testing.T) {
			project, _ := factories.CreateProject(context.TODO())
			requestingUserAccount, _ := factories.CreateUserAccount(context.TODO())
			_, _ = db.GetQueries().CreateUserProject(context.TODO(), models.CreateUserProjectParams{
				ProjectID:  project.ID,
				UserID:     requestingUserAccount.ID,
				Permission: models.AccessPermissionTypeADMIN,
			})
			otherUserAccount, _ := factories.CreateUserAccount(context.TODO())
			_, _ = db.GetQueries().CreateUserProject(context.TODO(), models.CreateUserProjectParams{
				ProjectID:  project.ID,
				UserID:     otherUserAccount.ID,
				Permission: models.AccessPermissionTypeMEMBER,
			})

			testClient := createTestClient(t, requestingUserAccount)

			response, requestErr := testClient.Get(
				context.TODO(),
				fmtListEndpoint(db.UUIDToString(&project.ID)),
			)
			assert.NoError(t, requestErr)
			assert.Equal(t, http.StatusOK, response.StatusCode)

			data := make([]models.UserAccount, 2)
			serializationErr := serialization.DeserializeJSON(response.Body, &data)
			assert.NoError(t, serializationErr)

			assert.Len(t, data, 2)
			assert.Equal(
				t,
				db.UUIDToString(&requestingUserAccount.ID),
				db.UUIDToString(&data[0].ID),
			)
			assert.Equal(t, db.UUIDToString(&otherUserAccount.ID), db.UUIDToString(&data[1].ID))
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
					project, _ := factories.CreateProject(context.TODO())
					requestingUserAccount, _ := factories.CreateUserAccount(context.TODO())
					_, _ = db.GetQueries().
						CreateUserProject(context.TODO(), models.CreateUserProjectParams{
							ProjectID:  project.ID,
							UserID:     requestingUserAccount.ID,
							Permission: permission,
						})

					testClient := createTestClient(t, requestingUserAccount)

					response, requestErr := testClient.Get(
						context.TODO(),
						fmtListEndpoint(db.UUIDToString(&project.ID)),
					)
					assert.NoError(t, requestErr)
					assert.Equal(t, http.StatusOK, response.StatusCode)
				},
			)
		}

		t.Run(
			"responds with status 403 FORBIDDEN if the user does not have projects access",
			func(t *testing.T) {
				project, _ := factories.CreateProject(context.TODO())
				requestingUserAccount, _ := factories.CreateUserAccount(context.TODO())

				testClient := createTestClient(t, requestingUserAccount)

				response, requestErr := testClient.Get(
					context.TODO(),
					fmtListEndpoint(db.UUIDToString(&project.ID)),
				)
				assert.NoError(t, requestErr)
				assert.Equal(t, http.StatusForbidden, response.StatusCode)
			},
		)
	})

	t.Run(fmt.Sprintf("POST: %s", api.ProjectUserListEndpoint), func(t *testing.T) {
		t.Run("sends invite emails to users", func(t *testing.T) {
			topic := pubsubutils.GetTopic(context.TODO(), pubsubutils.EmailSenderPubSubTopicID)
			subscription := pubsubutils.GetSubscription(context.TODO(), "test-subscription", topic)

			project, _ := factories.CreateProject(context.TODO())
			projectID := db.UUIDToString(&project.ID)

			requestUserAccount, _ := factories.CreateUserAccount(context.TODO())
			createUserProject(
				t,
				requestUserAccount.FirebaseID,
				projectID,
				models.AccessPermissionTypeADMIN,
			)

			testClient := createTestClient(t, requestUserAccount)

			msgChannel := make(chan *pubsub.Message, 2)

			go func() {
				ctx, cancel := context.WithTimeout(context.TODO(), 1*time.Minute)
				defer cancel()

				subErr := subscription.Receive(ctx, func(_ context.Context, msg *pubsub.Message) {
					msg.Ack()
					assert.NotNil(t, msg)
					msgChannel <- msg
				})

				assert.NoError(t, subErr)
			}()

			data := []dto.AddUserAccountToProjectDTO{
				{Email: "moishe@zuchmir.com", Permission: models.AccessPermissionTypeMEMBER},
				{Email: "bugs@bunny.com", Permission: models.AccessPermissionTypeMEMBER},
			}

			response, requestErr := testClient.Post(
				context.TODO(),
				fmtListEndpoint(projectID),
				data,
			)

			assert.NoError(t, requestErr)
			assert.Equal(t, http.StatusCreated, response.StatusCode)

			count := 0
			for msg := range msgChannel {
				count++

				assert.NotNil(t, msg)

				emailSenderData := emailsender.SendEmailRequestDTO{}
				_ = json.Unmarshal(msg.Data, &emailSenderData)

				assert.Equal(t, emailSenderData.FromName, "BaseMind.AI")
				assert.Equal(t, emailSenderData.FromAddress, api.SupportEmailAddress)
				assert.Equal(t, emailSenderData.ToName, "")
				assert.True(
					t,
					emailSenderData.ToAddress == data[0].Email ||
						emailSenderData.ToAddress == data[1].Email,
				)
				assert.Equal(t, emailSenderData.TemplateID, api.UserInvitationEmailTemplateID)
				assert.Equal(
					t,
					emailSenderData.TemplateVariables["invitingUserFullName"],
					requestUserAccount.DisplayName,
				)
				assert.Equal(t, emailSenderData.TemplateVariables["projectName"], project.Name)
				assert.NotEmpty(t, emailSenderData.TemplateVariables["invitationUrl"])

				if count == 2 {
					break
				}
			}
		})

		t.Run(
			"responds with status 401 UNAUTHORIZED if the user does not have ADMIN permission",
			func(t *testing.T) {
				project, _ := factories.CreateProject(context.TODO())
				projectID := db.UUIDToString(&project.ID)

				requestUserAccount, _ := factories.CreateUserAccount(context.TODO())
				createUserProject(
					t,
					requestUserAccount.FirebaseID,
					projectID,
					models.AccessPermissionTypeMEMBER,
				)

				testClient := createTestClient(t, requestUserAccount)

				addedUserAccount, _ := factories.CreateUserAccount(context.TODO())

				response, requestErr := testClient.Post(
					context.TODO(),
					fmtListEndpoint(projectID),
					dto.AddUserAccountToProjectDTO{
						Email:      addedUserAccount.Email,
						Permission: models.AccessPermissionTypeMEMBER,
					},
				)

				assert.NoError(t, requestErr)
				assert.Equal(t, http.StatusUnauthorized, response.StatusCode)
			},
		)

		t.Run(
			"responds with status 403 FORBIDDEN if the user does not have projects access",
			func(t *testing.T) {
				project, _ := factories.CreateProject(context.TODO())
				projectID := db.UUIDToString(&project.ID)

				requestUserAccount, _ := factories.CreateUserAccount(context.TODO())

				testClient := createTestClient(t, requestUserAccount)

				addedUserAccount, _ := factories.CreateUserAccount(context.TODO())

				response, requestErr := testClient.Post(
					context.TODO(),
					fmtListEndpoint(projectID),
					dto.AddUserAccountToProjectDTO{
						Email:      addedUserAccount.Email,
						Permission: models.AccessPermissionTypeMEMBER,
					},
				)

				assert.NoError(t, requestErr)
				assert.Equal(t, http.StatusForbidden, response.StatusCode)
			},
		)

		testCases := []struct {
			Name        string
			RequestBody dto.AddUserAccountToProjectDTO
		}{
			{
				Name: "responds with status 400 BAD REQUEST if the user does not exist",
				RequestBody: dto.AddUserAccountToProjectDTO{
					Email:      "non-existent-user@zuchmir.com",
					Permission: models.AccessPermissionTypeMEMBER,
				},
			},
			{
				Name: "responds with status 400 BAD REQUEST if the permission is invalid",
				RequestBody: dto.AddUserAccountToProjectDTO{
					Email:      "non-existent-user@zuchmir.com",
					Permission: "invalid-permission",
				},
			},
		}

		for _, testCase := range testCases {
			t.Run(testCase.Name, func(t *testing.T) {
				project, _ := factories.CreateProject(context.TODO())
				projectID := db.UUIDToString(&project.ID)

				requestUserAccount, _ := factories.CreateUserAccount(context.TODO())
				createUserProject(
					t,
					requestUserAccount.FirebaseID,
					projectID,
					models.AccessPermissionTypeADMIN,
				)

				testClient := createTestClient(t, requestUserAccount)

				response, requestErr := testClient.Post(
					context.TODO(),
					fmtListEndpoint(projectID),
					testCase.RequestBody,
				)
				assert.NoError(t, requestErr)
				assert.Equal(t, http.StatusBadRequest, response.StatusCode)
			})
		}

		t.Run(
			"responds with status 400 BAD REQUEST if the user is already in the project",
			func(t *testing.T) {
				project, _ := factories.CreateProject(context.TODO())
				projectID := db.UUIDToString(&project.ID)

				requestUserAccount, _ := factories.CreateUserAccount(context.TODO())
				createUserProject(
					t,
					requestUserAccount.FirebaseID,
					projectID,
					models.AccessPermissionTypeADMIN,
				)

				addedUserAccount, _ := factories.CreateUserAccount(context.TODO())
				createUserProject(
					t,
					addedUserAccount.FirebaseID,
					projectID,
					models.AccessPermissionTypeMEMBER,
				)

				testClient := createTestClient(t, requestUserAccount)

				response, requestErr := testClient.Post(
					context.TODO(),
					fmtListEndpoint(projectID),
					dto.AddUserAccountToProjectDTO{
						Email:      addedUserAccount.Email,
						Permission: models.AccessPermissionTypeMEMBER,
					},
				)

				assert.NoError(t, requestErr)
				assert.Equal(t, http.StatusBadRequest, response.StatusCode)
			},
		)

		t.Run(
			"responds with status 400 BAD REQUEST if the user does not exist",
			func(t *testing.T) {
				project, _ := factories.CreateProject(context.TODO())
				projectID := db.UUIDToString(&project.ID)

				requestUserAccount, _ := factories.CreateUserAccount(context.TODO())
				createUserProject(
					t,
					requestUserAccount.FirebaseID,
					projectID,
					models.AccessPermissionTypeADMIN,
				)

				testClient := createTestClient(t, requestUserAccount)

				response, requestErr := testClient.Post(
					context.TODO(),
					fmtListEndpoint(projectID),
					dto.AddUserAccountToProjectDTO{
						Email:      "invalid@zuchmir.com",
						Permission: models.AccessPermissionTypeMEMBER,
					},
				)

				assert.NoError(t, requestErr)
				assert.Equal(t, http.StatusBadRequest, response.StatusCode)
			},
		)

		t.Run(
			"responds with status 400 BAD REQUEST if the request body is invalid",
			func(t *testing.T) {
				project, _ := factories.CreateProject(context.TODO())
				projectID := db.UUIDToString(&project.ID)

				requestUserAccount, _ := factories.CreateUserAccount(context.TODO())
				createUserProject(
					t,
					requestUserAccount.FirebaseID,
					projectID,
					models.AccessPermissionTypeADMIN,
				)

				testClient := createTestClient(t, requestUserAccount)

				response, requestErr := testClient.Post(
					context.TODO(),
					fmtListEndpoint(projectID),
					"invalid",
				)

				assert.NoError(t, requestErr)
				assert.Equal(t, http.StatusBadRequest, response.StatusCode)
			},
		)
	})

	t.Run(fmt.Sprintf("PATCH: %s", api.ProjectUserListEndpoint), func(t *testing.T) {
		t.Run("allows changing a user permission", func(t *testing.T) {
			project, _ := factories.CreateProject(context.TODO())
			projectID := db.UUIDToString(&project.ID)

			requestUserAccount, _ := factories.CreateUserAccount(context.TODO())
			createUserProject(
				t,
				requestUserAccount.FirebaseID,
				projectID,
				models.AccessPermissionTypeADMIN,
			)

			updatedUserAccount, _ := factories.CreateUserAccount(context.TODO())
			createUserProject(
				t,
				updatedUserAccount.FirebaseID,
				projectID,
				models.AccessPermissionTypeMEMBER,
			)

			testClient := createTestClient(t, requestUserAccount)

			response, requestErr := testClient.Patch(
				context.TODO(),
				fmtListEndpoint(projectID),
				dto.UpdateUserAccountProjectPermissionDTO{
					UserID:     db.UUIDToString(&updatedUserAccount.ID),
					Permission: models.AccessPermissionTypeADMIN,
				},
			)

			assert.NoError(t, requestErr)
			assert.Equal(t, http.StatusOK, response.StatusCode)

			retrievedUserProject, retrievalErr := db.GetQueries().
				RetrieveUserProject(context.TODO(), models.RetrieveUserProjectParams{
					ProjectID:  project.ID,
					FirebaseID: updatedUserAccount.FirebaseID,
				})
			assert.NoError(t, retrievalErr)
			assert.Equal(t, models.AccessPermissionTypeADMIN, retrievedUserProject.Permission)
		})

		t.Run("responds with status 400 BAD REQUEST for invalid request body", func(t *testing.T) {
			project, _ := factories.CreateProject(context.TODO())
			projectID := db.UUIDToString(&project.ID)

			requestUserAccount, _ := factories.CreateUserAccount(context.TODO())
			createUserProject(
				t,
				requestUserAccount.FirebaseID,
				projectID,
				models.AccessPermissionTypeADMIN,
			)
			testClient := createTestClient(t, requestUserAccount)

			response, requestErr := testClient.Patch(
				context.TODO(),
				fmtListEndpoint(projectID),
				"invalid",
			)

			assert.NoError(t, requestErr)
			assert.Equal(t, http.StatusBadRequest, response.StatusCode)
		})

		t.Run(
			"responds with status 401 UNAUTHORIZED if the user does not have ADMIN permission",
			func(t *testing.T) {
				project, _ := factories.CreateProject(context.TODO())
				projectID := db.UUIDToString(&project.ID)

				requestUserAccount, _ := factories.CreateUserAccount(context.TODO())
				createUserProject(
					t,
					requestUserAccount.FirebaseID,
					projectID,
					models.AccessPermissionTypeMEMBER,
				)

				updatedUserAccount, _ := factories.CreateUserAccount(context.TODO())
				createUserProject(
					t,
					updatedUserAccount.FirebaseID,
					projectID,
					models.AccessPermissionTypeMEMBER,
				)

				testClient := createTestClient(t, requestUserAccount)

				response, requestErr := testClient.Patch(
					context.TODO(),
					fmtListEndpoint(projectID),
					dto.UpdateUserAccountProjectPermissionDTO{
						UserID:     db.UUIDToString(&updatedUserAccount.ID),
						Permission: models.AccessPermissionTypeADMIN,
					},
				)

				assert.NoError(t, requestErr)
				assert.Equal(t, http.StatusUnauthorized, response.StatusCode)
			},
		)

		t.Run(
			"responds with status 403 FORBIDDEN if the user does not have projects access",
			func(t *testing.T) {
				project, _ := factories.CreateProject(context.TODO())
				projectID := db.UUIDToString(&project.ID)

				requestUserAccount, _ := factories.CreateUserAccount(context.TODO())

				updatedUserAccount, _ := factories.CreateUserAccount(context.TODO())
				createUserProject(
					t,
					updatedUserAccount.FirebaseID,
					projectID,
					models.AccessPermissionTypeMEMBER,
				)

				testClient := createTestClient(t, requestUserAccount)

				response, requestErr := testClient.Patch(
					context.TODO(),
					fmtListEndpoint(projectID),
					dto.UpdateUserAccountProjectPermissionDTO{
						UserID:     db.UUIDToString(&updatedUserAccount.ID),
						Permission: models.AccessPermissionTypeADMIN,
					},
				)

				assert.NoError(t, requestErr)
				assert.Equal(t, http.StatusForbidden, response.StatusCode)
			},
		)

		testCases := []struct {
			Name        string
			RequestBody dto.UpdateUserAccountProjectPermissionDTO
		}{
			{
				Name: "responds with status 400 BAD REQUEST if the user does not exist",
				RequestBody: dto.UpdateUserAccountProjectPermissionDTO{
					UserID:     "non-existent-user-id",
					Permission: models.AccessPermissionTypeMEMBER,
				},
			},
			{
				Name: "responds with status 400 BAD REQUEST if the permission is invalid",
				RequestBody: dto.UpdateUserAccountProjectPermissionDTO{
					UserID:     "non-existent-user-id",
					Permission: "invalid-permission",
				},
			},
		}

		for _, testCase := range testCases {
			t.Run(testCase.Name, func(t *testing.T) {
				project, _ := factories.CreateProject(context.TODO())
				projectID := db.UUIDToString(&project.ID)

				requestUserAccount, _ := factories.CreateUserAccount(context.TODO())
				createUserProject(
					t,
					requestUserAccount.FirebaseID,
					projectID,
					models.AccessPermissionTypeADMIN,
				)

				testClient := createTestClient(t, requestUserAccount)

				response, requestErr := testClient.Patch(
					context.TODO(),
					fmtListEndpoint(projectID),
					testCase.RequestBody,
				)
				assert.NoError(t, requestErr)
				assert.Equal(t, http.StatusBadRequest, response.StatusCode)
			})
		}

		t.Run(
			"responds with status 400 BAD REQUEST if the user is not in the project",
			func(t *testing.T) {
				project, _ := factories.CreateProject(context.TODO())
				projectID := db.UUIDToString(&project.ID)

				requestUserAccount, _ := factories.CreateUserAccount(context.TODO())
				createUserProject(
					t,
					requestUserAccount.FirebaseID,
					projectID,
					models.AccessPermissionTypeADMIN,
				)

				updatedUserAccount, _ := factories.CreateUserAccount(context.TODO())

				testClient := createTestClient(t, requestUserAccount)

				response, requestErr := testClient.Patch(
					context.TODO(),
					fmtListEndpoint(projectID),
					dto.UpdateUserAccountProjectPermissionDTO{
						UserID:     db.UUIDToString(&updatedUserAccount.ID),
						Permission: models.AccessPermissionTypeADMIN,
					},
				)

				assert.NoError(t, requestErr)
				assert.Equal(t, http.StatusBadRequest, response.StatusCode)
			},
		)
		t.Run(
			"responds with status 400 BAD REQUEST if the user does not exist",
			func(t *testing.T) {
				project, _ := factories.CreateProject(context.TODO())
				projectID := db.UUIDToString(&project.ID)

				requestUserAccount, _ := factories.CreateUserAccount(context.TODO())
				createUserProject(
					t,
					requestUserAccount.FirebaseID,
					projectID,
					models.AccessPermissionTypeADMIN,
				)

				testClient := createTestClient(t, requestUserAccount)

				response, requestErr := testClient.Patch(
					context.TODO(),
					fmtListEndpoint(projectID),
					dto.UpdateUserAccountProjectPermissionDTO{
						UserID:     "9768fc28-cf97-4847-becc-07fc9fcdd230",
						Permission: models.AccessPermissionTypeMEMBER,
					},
				)

				assert.NoError(t, requestErr)
				assert.Equal(t, http.StatusBadRequest, response.StatusCode)
			},
		)

		t.Run(
			"responds with status 400 BAD REQUEST if the user is trying to remove him or her self",
			func(t *testing.T) {
				project, _ := factories.CreateProject(context.TODO())
				projectID := db.UUIDToString(&project.ID)

				requestUserAccount, _ := factories.CreateUserAccount(context.TODO())
				createUserProject(
					t,
					requestUserAccount.FirebaseID,
					projectID,
					models.AccessPermissionTypeADMIN,
				)

				testClient := createTestClient(t, requestUserAccount)

				response, requestErr := testClient.Patch(
					context.TODO(),
					fmtListEndpoint(projectID),
					dto.UpdateUserAccountProjectPermissionDTO{
						UserID:     db.UUIDToString(&requestUserAccount.ID),
						Permission: models.AccessPermissionTypeMEMBER,
					},
				)

				assert.NoError(t, requestErr)
				assert.Equal(t, http.StatusBadRequest, response.StatusCode)
			},
		)
	})

	t.Run(fmt.Sprintf("DELETE: %s", api.ProjectUserDetailEndpoint), func(t *testing.T) {
		t.Run("removes a user from the project", func(t *testing.T) {
			project, _ := factories.CreateProject(context.TODO())
			projectID := db.UUIDToString(&project.ID)

			requestUserAccount, _ := factories.CreateUserAccount(context.TODO())
			createUserProject(
				t,
				requestUserAccount.FirebaseID,
				projectID,
				models.AccessPermissionTypeADMIN,
			)

			removedUserAccount, _ := factories.CreateUserAccount(context.TODO())
			createUserProject(
				t,
				removedUserAccount.FirebaseID,
				projectID,
				models.AccessPermissionTypeMEMBER,
			)

			testClient := createTestClient(t, requestUserAccount)

			response, requestErr := testClient.Delete(
				context.TODO(),
				fmtDetailEndpoint(projectID, db.UUIDToString(&removedUserAccount.ID)),
			)

			assert.NoError(t, requestErr)
			assert.Equal(t, http.StatusNoContent, response.StatusCode)

			_, retrievalErr := db.GetQueries().
				RetrieveUserProject(context.TODO(), models.RetrieveUserProjectParams{
					ProjectID:  project.ID,
					FirebaseID: removedUserAccount.FirebaseID,
				})
			assert.Error(t, retrievalErr)
		})

		t.Run(
			"responds with status 401 UNAUTHORIZED if the user does not have ADMIN permission",
			func(t *testing.T) {
				project, _ := factories.CreateProject(context.TODO())
				projectID := db.UUIDToString(&project.ID)

				requestUserAccount, _ := factories.CreateUserAccount(context.TODO())
				createUserProject(
					t,
					requestUserAccount.FirebaseID,
					projectID,
					models.AccessPermissionTypeMEMBER,
				)

				removedUserAccount, _ := factories.CreateUserAccount(context.TODO())
				createUserProject(
					t,
					removedUserAccount.FirebaseID,
					projectID,
					models.AccessPermissionTypeMEMBER,
				)

				testClient := createTestClient(t, requestUserAccount)

				response, requestErr := testClient.Delete(
					context.TODO(),
					fmtDetailEndpoint(projectID, db.UUIDToString(&removedUserAccount.ID)),
				)

				assert.NoError(t, requestErr)
				assert.Equal(t, http.StatusUnauthorized, response.StatusCode)
			},
		)

		t.Run(
			"responds with status 403 FORBIDDEN if the user does not have projects access",
			func(t *testing.T) {
				project, _ := factories.CreateProject(context.TODO())
				projectID := db.UUIDToString(&project.ID)

				requestUserAccount, _ := factories.CreateUserAccount(context.TODO())

				removedUserAccount, _ := factories.CreateUserAccount(context.TODO())
				createUserProject(
					t,
					removedUserAccount.FirebaseID,
					projectID,
					models.AccessPermissionTypeMEMBER,
				)

				testClient := createTestClient(t, requestUserAccount)

				response, requestErr := testClient.Delete(
					context.TODO(),
					fmtDetailEndpoint(projectID, db.UUIDToString(&removedUserAccount.ID)),
				)

				assert.NoError(t, requestErr)
				assert.Equal(t, http.StatusForbidden, response.StatusCode)
			},
		)

		t.Run(
			"responds with status 400 BAD REQUEST if the user is not in the project",
			func(t *testing.T) {
				project, _ := factories.CreateProject(context.TODO())
				projectID := db.UUIDToString(&project.ID)

				requestUserAccount, _ := factories.CreateUserAccount(context.TODO())
				createUserProject(
					t,
					requestUserAccount.FirebaseID,
					projectID,
					models.AccessPermissionTypeADMIN,
				)

				removedUserAccount, _ := factories.CreateUserAccount(context.TODO())

				testClient := createTestClient(t, requestUserAccount)

				response, requestErr := testClient.Delete(
					context.TODO(),
					fmtDetailEndpoint(projectID, db.UUIDToString(&removedUserAccount.ID)),
				)

				assert.NoError(t, requestErr)
				assert.Equal(t, http.StatusBadRequest, response.StatusCode)
			},
		)
		t.Run(
			"responds with status 400 BAD REQUEST if the user does not exist",
			func(t *testing.T) {
				project, _ := factories.CreateProject(context.TODO())
				projectID := db.UUIDToString(&project.ID)

				requestUserAccount, _ := factories.CreateUserAccount(context.TODO())
				createUserProject(
					t,
					requestUserAccount.FirebaseID,
					projectID,
					models.AccessPermissionTypeADMIN,
				)

				testClient := createTestClient(t, requestUserAccount)

				response, requestErr := testClient.Delete(
					context.TODO(),
					fmtDetailEndpoint(projectID, "9768fc28-cf97-4847-becc-07fc9fcdd230"),
				)

				assert.NoError(t, requestErr)
				assert.Equal(t, http.StatusBadRequest, response.StatusCode)
			},
		)
		t.Run(
			"responds with status 400 BAD REQUEST if the user is trying to remove him or her self",
			func(t *testing.T) {
				project, _ := factories.CreateProject(context.TODO())
				projectID := db.UUIDToString(&project.ID)

				requestUserAccount, _ := factories.CreateUserAccount(context.TODO())
				createUserProject(
					t,
					requestUserAccount.FirebaseID,
					projectID,
					models.AccessPermissionTypeADMIN,
				)

				testClient := createTestClient(t, requestUserAccount)

				response, requestErr := testClient.Delete(
					context.TODO(),
					fmtDetailEndpoint(projectID, db.UUIDToString(&requestUserAccount.ID)),
				)

				assert.NoError(t, requestErr)
				assert.Equal(t, http.StatusBadRequest, response.StatusCode)
			},
		)
	})
}
