package api_test

import (
	"context"
	"fmt"
	"github.com/basemind-ai/monorepo/e2e/factories"
	"github.com/basemind-ai/monorepo/services/dashboard-backend/internal/api"
	"github.com/basemind-ai/monorepo/services/dashboard-backend/internal/dto"
	"github.com/basemind-ai/monorepo/shared/go/db"
	"github.com/basemind-ai/monorepo/shared/go/serialization"
	"github.com/basemind-ai/monorepo/shared/go/testutils"
	"github.com/stretchr/testify/assert"
	"net/http"
	"strings"
	"testing"
)

func createToken(t *testing.T, applicationID, tokenName string) db.Token {
	t.Helper()
	appID, _ := db.StringToUUID(applicationID)
	token, err := db.GetQueries().CreateToken(context.TODO(), db.CreateTokenParams{
		ApplicationID: *appID,
		Name:          tokenName,
	})
	assert.NoError(t, err)
	return token
}

func TestTokensAPI(t *testing.T) {
	testutils.SetTestEnv(t)
	userAccount, _ := factories.CreateUserAccount(context.TODO())
	projectID := createProject(t)
	applicationID := createApplication(t, projectID)
	createUserProject(t, userAccount.FirebaseID, projectID, db.AccessPermissionTypeADMIN)

	testClient := createTestClient(t, userAccount)

	listURL := fmt.Sprintf(
		"/v1%s",
		strings.ReplaceAll(
			strings.ReplaceAll(api.ApplicationTokensListEndpoint, "{projectId}", projectID),
			"{applicationId}",
			applicationID,
		),
	)

	t.Run(fmt.Sprintf("GET: %s", api.ApplicationTokensListEndpoint), func(t *testing.T) {
		t.Run("returns a list of all application tokens", func(t *testing.T) {
			token1 := createToken(t, applicationID, "token1")
			token2 := createToken(t, applicationID, "token2")

			response, requestErr := testClient.Get(context.TODO(), listURL)
			assert.NoError(t, requestErr)
			assert.Equal(t, http.StatusOK, response.StatusCode)

			data := make([]*dto.ApplicationTokenDTO, 0)
			deserializationErr := serialization.DeserializeJSON(response.Body, &data)
			assert.NoError(t, deserializationErr)

			assert.Len(t, data, 2)
			assert.Equal(t, db.UUIDToString(&token1.ID), data[0].ID)
			assert.Equal(t, token1.Name, data[0].Name)
			assert.Nil(t, data[0].Hash)
			assert.Equal(t, db.UUIDToString(&token2.ID), data[1].ID)
			assert.Equal(t, token2.Name, data[1].Name)
			assert.Nil(t, data[1].Hash)
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
					newUserAccount, _ := factories.CreateUserAccount(context.TODO())
					newProjectID := createProject(t)
					newApplicationID := createApplication(t, newProjectID)
					createUserProject(t, newUserAccount.FirebaseID, newProjectID, permission)

					client := createTestClient(t, newUserAccount)

					response, requestErr := client.Get(context.TODO(), fmt.Sprintf(
						"/v1%s",
						strings.ReplaceAll(
							strings.ReplaceAll(
								api.ApplicationTokensListEndpoint,
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
							api.ApplicationTokensListEndpoint,
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
					strings.ReplaceAll(api.ApplicationTokensListEndpoint, "{projectId}", projectID),
					"{applicationId}",
					"invalid",
				),
			))
			assert.NoError(t, requestErr)
			assert.Equal(t, http.StatusBadRequest, response.StatusCode)
		})
	})

	t.Run(fmt.Sprintf("POST: %s", api.ApplicationTokensListEndpoint), func(t *testing.T) {
		t.Run("creates a new application token", func(t *testing.T) {
			response, requestErr := testClient.Post(context.TODO(), listURL, map[string]any{
				"name": "test token",
			})
			assert.NoError(t, requestErr)
			assert.Equal(t, http.StatusCreated, response.StatusCode)

			data := dto.ApplicationTokenDTO{}
			deserializationErr := serialization.DeserializeJSON(response.Body, &data)
			assert.NoError(t, deserializationErr)
			assert.NotNil(t, data.ID)
			assert.Equal(t, "test token", data.Name)
			assert.NotNil(t, data.Hash)
			assert.NotEmpty(t, *data.Hash)
		})

		for _, permission := range []db.AccessPermissionType{
			db.AccessPermissionTypeMEMBER, db.AccessPermissionTypeADMIN,
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
								api.ApplicationTokensListEndpoint,
								"{projectId}",
								newProjectID,
							),
							"{applicationId}",
							newApplicationID,
						),
					), map[string]any{
						"name": "test token",
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
							api.ApplicationTokensListEndpoint,
							"{projectId}",
							newProjectID,
						),
						"{applicationId}",
						newApplicationID,
					),
				), map[string]any{
					"name": "test token",
				})
				assert.NoError(t, requestErr)
				assert.Equal(t, http.StatusForbidden, response.StatusCode)
			},
		)

		t.Run("returns an error if the application id is invalid", func(t *testing.T) {
			response, requestErr := testClient.Post(context.TODO(), fmt.Sprintf(
				"/v1%s",
				strings.ReplaceAll(
					strings.ReplaceAll(api.ApplicationTokensListEndpoint, "{projectId}", projectID),
					"{applicationId}",
					"invalid",
				),
			), map[string]any{
				"name": "test token",
			})
			assert.NoError(t, requestErr)
			assert.Equal(t, http.StatusBadRequest, response.StatusCode)
		})
	})

	t.Run(fmt.Sprintf("DELETE: %s", api.ApplicationDetailEndpoint), func(t *testing.T) {
		t.Run("deletes an application token", func(t *testing.T) {
			token := createToken(t, applicationID, "test token")
			tokenID := db.UUIDToString(&token.ID)
			url := fmt.Sprintf(
				"/v1%s",
				strings.ReplaceAll(
					strings.ReplaceAll(
						strings.ReplaceAll(
							api.ApplicationTokenDetailEndpoint,
							"{projectId}",
							projectID,
						),
						"{applicationId}",
						applicationID,
					),
					"{tokenId}", tokenID),
			)

			response, requestErr := testClient.Delete(context.TODO(), url)
			assert.NoError(t, requestErr)
			assert.Equal(t, http.StatusNoContent, response.StatusCode)

			tokens, err := db.GetQueries().RetrieveTokens(context.TODO(), token.ID)
			assert.NoError(t, err)
			for _, dbToken := range tokens {
				assert.NotEqual(t, token.ID, dbToken.ID)
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
					db.AccessPermissionTypeMEMBER,
				)

				client := createTestClient(t, newUserAccount)

				token := createToken(t, newApplicationID, "test token")
				tokenID := db.UUIDToString(&token.ID)
				url := fmt.Sprintf(
					"/v1%s",
					strings.ReplaceAll(
						strings.ReplaceAll(
							strings.ReplaceAll(
								api.ApplicationTokenDetailEndpoint,
								"{projectId}",
								newProjectID,
							),
							"{applicationId}",
							newApplicationID,
						),
						"{tokenId}", tokenID),
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

				token := createToken(t, newApplicationID, "test token")
				tokenID := db.UUIDToString(&token.ID)
				url := fmt.Sprintf(
					"/v1%s",
					strings.ReplaceAll(
						strings.ReplaceAll(
							strings.ReplaceAll(
								api.ApplicationTokenDetailEndpoint,
								"{projectId}",
								newProjectID,
							),
							"{applicationId}",
							newApplicationID,
						),
						"{tokenId}", tokenID),
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
							api.ApplicationTokenDetailEndpoint,
							"{projectId}",
							projectID,
						),
						"{applicationId}",
						"invalid",
					),
					"{tokenId}", "invalid"),
			))
			assert.NoError(t, requestErr)
			assert.Equal(t, http.StatusBadRequest, response.StatusCode)
		})
	})
}
