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

func TestProjectUsersAPI(t *testing.T) { //nolint: revive
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
			_, _ = db.GetQueries().CreateUserProject(context.TODO(), db.CreateUserProjectParams{
				ProjectID:  project.ID,
				UserID:     requestingUserAccount.ID,
				Permission: db.AccessPermissionTypeADMIN,
			})
			otherUserAccount, _ := factories.CreateUserAccount(context.TODO())
			_, _ = db.GetQueries().CreateUserProject(context.TODO(), db.CreateUserProjectParams{
				ProjectID:  project.ID,
				UserID:     otherUserAccount.ID,
				Permission: db.AccessPermissionTypeMEMBER,
			})

			testClient := createTestClient(t, requestingUserAccount)

			response, requestErr := testClient.Get(
				context.TODO(),
				fmtListEndpoint(db.UUIDToString(&project.ID)),
			)
			assert.NoError(t, requestErr)
			assert.Equal(t, http.StatusOK, response.StatusCode)

			data := make([]db.UserAccount, 2)
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

		for _, permission := range []db.AccessPermissionType{
			db.AccessPermissionTypeMEMBER, db.AccessPermissionTypeADMIN,
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
						CreateUserProject(context.TODO(), db.CreateUserProjectParams{
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
		t.Run("adds a user to the project using userID", func(t *testing.T) {
			project, _ := factories.CreateProject(context.TODO())
			projectID := db.UUIDToString(&project.ID)

			requestUserAccount, _ := factories.CreateUserAccount(context.TODO())
			createUserProject(
				t,
				requestUserAccount.FirebaseID,
				projectID,
				db.AccessPermissionTypeADMIN,
			)

			testClient := createTestClient(t, requestUserAccount)

			addedUserAccount, _ := factories.CreateUserAccount(context.TODO())

			response, requestErr := testClient.Post(
				context.TODO(),
				fmtListEndpoint(projectID),
				dto.AddUserAccountToProjectDTO{
					UserID:     db.UUIDToString(&addedUserAccount.ID),
					Permission: db.AccessPermissionTypeMEMBER,
				},
			)

			assert.NoError(t, requestErr)
			assert.Equal(t, http.StatusCreated, response.StatusCode)

			retrievedUserProject, retrievalErr := db.GetQueries().
				RetrieveUserProject(context.TODO(), db.RetrieveUserProjectParams{
					ProjectID:  project.ID,
					FirebaseID: addedUserAccount.FirebaseID,
				})
			assert.NoError(t, retrievalErr)
			assert.Equal(t, db.AccessPermissionTypeMEMBER, retrievedUserProject.Permission)
		})

		t.Run("adds a user to the project using email", func(t *testing.T) {
			project, _ := factories.CreateProject(context.TODO())
			projectID := db.UUIDToString(&project.ID)

			requestUserAccount, _ := factories.CreateUserAccount(context.TODO())
			createUserProject(
				t,
				requestUserAccount.FirebaseID,
				projectID,
				db.AccessPermissionTypeADMIN,
			)

			testClient := createTestClient(t, requestUserAccount)

			addedUserAccount, _ := factories.CreateUserAccount(context.TODO())

			response, requestErr := testClient.Post(
				context.TODO(),
				fmtListEndpoint(projectID),
				dto.AddUserAccountToProjectDTO{
					Email:      addedUserAccount.Email,
					Permission: db.AccessPermissionTypeMEMBER,
				},
			)

			assert.NoError(t, requestErr)
			assert.Equal(t, http.StatusCreated, response.StatusCode)

			retrievedUserProject, retrievalErr := db.GetQueries().
				RetrieveUserProject(context.TODO(), db.RetrieveUserProjectParams{
					ProjectID:  project.ID,
					FirebaseID: addedUserAccount.FirebaseID,
				})
			assert.NoError(t, retrievalErr)
			assert.Equal(t, db.AccessPermissionTypeMEMBER, retrievedUserProject.Permission)
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
					db.AccessPermissionTypeMEMBER,
				)

				testClient := createTestClient(t, requestUserAccount)

				addedUserAccount, _ := factories.CreateUserAccount(context.TODO())

				response, requestErr := testClient.Post(
					context.TODO(),
					fmtListEndpoint(projectID),
					dto.AddUserAccountToProjectDTO{
						UserID:     db.UUIDToString(&addedUserAccount.ID),
						Permission: db.AccessPermissionTypeMEMBER,
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
						UserID:     db.UUIDToString(&addedUserAccount.ID),
						Permission: db.AccessPermissionTypeMEMBER,
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
					UserID:     "non-existent-user-id",
					Permission: db.AccessPermissionTypeMEMBER,
				},
			},
			{
				Name: "responds with status 400 BAD REQUEST if the permission is invalid",
				RequestBody: dto.AddUserAccountToProjectDTO{
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
					db.AccessPermissionTypeADMIN,
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
					db.AccessPermissionTypeADMIN,
				)

				addedUserAccount, _ := factories.CreateUserAccount(context.TODO())
				createUserProject(
					t,
					addedUserAccount.FirebaseID,
					projectID,
					db.AccessPermissionTypeMEMBER,
				)

				testClient := createTestClient(t, requestUserAccount)

				response, requestErr := testClient.Post(
					context.TODO(),
					fmtListEndpoint(projectID),
					dto.AddUserAccountToProjectDTO{
						UserID:     db.UUIDToString(&addedUserAccount.ID),
						Permission: db.AccessPermissionTypeMEMBER,
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
					db.AccessPermissionTypeADMIN,
				)

				testClient := createTestClient(t, requestUserAccount)

				response, requestErr := testClient.Post(
					context.TODO(),
					fmtListEndpoint(projectID),
					dto.AddUserAccountToProjectDTO{
						UserID:     "9768fc28-cf97-4847-becc-07fc9fcdd230",
						Permission: db.AccessPermissionTypeMEMBER,
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
					db.AccessPermissionTypeADMIN,
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
				db.AccessPermissionTypeADMIN,
			)

			updatedUserAccount, _ := factories.CreateUserAccount(context.TODO())
			createUserProject(
				t,
				updatedUserAccount.FirebaseID,
				projectID,
				db.AccessPermissionTypeMEMBER,
			)

			testClient := createTestClient(t, requestUserAccount)

			response, requestErr := testClient.Patch(
				context.TODO(),
				fmtListEndpoint(projectID),
				dto.UpdateUserAccountProjectPermissionDTO{
					UserID:     db.UUIDToString(&updatedUserAccount.ID),
					Permission: db.AccessPermissionTypeADMIN,
				},
			)

			assert.NoError(t, requestErr)
			assert.Equal(t, http.StatusOK, response.StatusCode)

			retrievedUserProject, retrievalErr := db.GetQueries().
				RetrieveUserProject(context.TODO(), db.RetrieveUserProjectParams{
					ProjectID:  project.ID,
					FirebaseID: updatedUserAccount.FirebaseID,
				})
			assert.NoError(t, retrievalErr)
			assert.Equal(t, db.AccessPermissionTypeADMIN, retrievedUserProject.Permission)
		})

		t.Run("responds with status 400 BAD REQUEST for invalid request body", func(t *testing.T) {
			project, _ := factories.CreateProject(context.TODO())
			projectID := db.UUIDToString(&project.ID)

			requestUserAccount, _ := factories.CreateUserAccount(context.TODO())
			createUserProject(
				t,
				requestUserAccount.FirebaseID,
				projectID,
				db.AccessPermissionTypeADMIN,
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
					db.AccessPermissionTypeMEMBER,
				)

				updatedUserAccount, _ := factories.CreateUserAccount(context.TODO())
				createUserProject(
					t,
					updatedUserAccount.FirebaseID,
					projectID,
					db.AccessPermissionTypeMEMBER,
				)

				testClient := createTestClient(t, requestUserAccount)

				response, requestErr := testClient.Patch(
					context.TODO(),
					fmtListEndpoint(projectID),
					dto.UpdateUserAccountProjectPermissionDTO{
						UserID:     db.UUIDToString(&updatedUserAccount.ID),
						Permission: db.AccessPermissionTypeADMIN,
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
					db.AccessPermissionTypeMEMBER,
				)

				testClient := createTestClient(t, requestUserAccount)

				response, requestErr := testClient.Patch(
					context.TODO(),
					fmtListEndpoint(projectID),
					dto.UpdateUserAccountProjectPermissionDTO{
						UserID:     db.UUIDToString(&updatedUserAccount.ID),
						Permission: db.AccessPermissionTypeADMIN,
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
					Permission: db.AccessPermissionTypeMEMBER,
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
					db.AccessPermissionTypeADMIN,
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
					db.AccessPermissionTypeADMIN,
				)

				updatedUserAccount, _ := factories.CreateUserAccount(context.TODO())

				testClient := createTestClient(t, requestUserAccount)

				response, requestErr := testClient.Patch(
					context.TODO(),
					fmtListEndpoint(projectID),
					dto.UpdateUserAccountProjectPermissionDTO{
						UserID:     db.UUIDToString(&updatedUserAccount.ID),
						Permission: db.AccessPermissionTypeADMIN,
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
					db.AccessPermissionTypeADMIN,
				)

				testClient := createTestClient(t, requestUserAccount)

				response, requestErr := testClient.Patch(
					context.TODO(),
					fmtListEndpoint(projectID),
					dto.UpdateUserAccountProjectPermissionDTO{
						UserID:     "9768fc28-cf97-4847-becc-07fc9fcdd230",
						Permission: db.AccessPermissionTypeMEMBER,
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
					db.AccessPermissionTypeADMIN,
				)

				testClient := createTestClient(t, requestUserAccount)

				response, requestErr := testClient.Patch(
					context.TODO(),
					fmtListEndpoint(projectID),
					dto.UpdateUserAccountProjectPermissionDTO{
						UserID:     db.UUIDToString(&requestUserAccount.ID),
						Permission: db.AccessPermissionTypeMEMBER,
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
				db.AccessPermissionTypeADMIN,
			)

			removedUserAccount, _ := factories.CreateUserAccount(context.TODO())
			createUserProject(
				t,
				removedUserAccount.FirebaseID,
				projectID,
				db.AccessPermissionTypeMEMBER,
			)

			testClient := createTestClient(t, requestUserAccount)

			response, requestErr := testClient.Delete(
				context.TODO(),
				fmtDetailEndpoint(projectID, db.UUIDToString(&removedUserAccount.ID)),
			)

			assert.NoError(t, requestErr)
			assert.Equal(t, http.StatusNoContent, response.StatusCode)

			_, retrievalErr := db.GetQueries().
				RetrieveUserProject(context.TODO(), db.RetrieveUserProjectParams{
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
					db.AccessPermissionTypeMEMBER,
				)

				removedUserAccount, _ := factories.CreateUserAccount(context.TODO())
				createUserProject(
					t,
					removedUserAccount.FirebaseID,
					projectID,
					db.AccessPermissionTypeMEMBER,
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
					db.AccessPermissionTypeMEMBER,
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
					db.AccessPermissionTypeADMIN,
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
					db.AccessPermissionTypeADMIN,
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
					db.AccessPermissionTypeADMIN,
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
