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
	"github.com/basemind-ai/monorepo/shared/go/testutils"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/stretchr/testify/assert"
	"net/http"
	"strings"
	"testing"
)

func TestProviderKeysAPI(t *testing.T) {
	testutils.SetTestEnv(t)

	modelVendor := models.ModelVendorOPENAI
	unencryptedKey := factories.RandomString(32)

	userAccount, _ := factories.CreateUserAccount(context.TODO())
	testClient := createTestClient(t, userAccount)

	listEndpointURL := func(projectID pgtype.UUID) string {
		return fmt.Sprintf(
			"/v1%s",
			strings.ReplaceAll(
				api.ProjectProviderKeyListEndpoint,
				"{projectId}",
				db.UUIDToString(&projectID),
			),
		)
	}

	detailEndpointURL := func(projectID pgtype.UUID, providerKeyID pgtype.UUID) string {
		return fmt.Sprintf(
			"/v1%s",
			strings.ReplaceAll(
				strings.ReplaceAll(
					api.ProjectProviderKeyDetailEndpoint,
					"{projectId}",
					db.UUIDToString(&projectID),
				),
				"{providerKeyId}",
				db.UUIDToString(&providerKeyID),
			),
		)
	}

	t.Run(fmt.Sprintf("GET: %s", api.ProjectProviderKeyListEndpoint), func(t *testing.T) {
		t.Run("retrieves provider keys", func(t *testing.T) {
			project, _ := factories.CreateProject(context.TODO())
			_, _ = db.GetQueries().CreateUserProject(context.TODO(), models.CreateUserProjectParams{
				UserID:     userAccount.ID,
				ProjectID:  project.ID,
				Permission: models.AccessPermissionTypeMEMBER,
			})

			providerKeyOne, _ := db.GetQueries().
				CreateProviderKey(context.TODO(), models.CreateProviderKeyParams{
					ProjectID:   project.ID,
					ModelVendor: models.ModelVendorOPENAI,
					ApiKey:      unencryptedKey,
				})

			providerKeyTwo, _ := db.GetQueries().
				CreateProviderKey(context.TODO(), models.CreateProviderKeyParams{
					ProjectID:   project.ID,
					ModelVendor: models.ModelVendorCOHERE,
					ApiKey:      unencryptedKey,
				})

			response, requestErr := testClient.Get(
				context.TODO(),
				listEndpointURL(project.ID),
			)
			assert.NoError(t, requestErr)
			assert.Equal(t, http.StatusOK, response.StatusCode)

			data := make([]*dto.ProviderKeyDTO, 0)
			_ = serialization.DeserializeJSON(response.Body, &data)

			assert.Equal(t, 2, len(data))

			assert.Equal(t, db.UUIDToString(&providerKeyOne.ID), data[0].ID)
			assert.Equal(t, db.UUIDToString(&providerKeyTwo.ID), data[1].ID)
		})
		t.Run("returns empty JSON array when no provider keys exist", func(t *testing.T) {
			project, _ := factories.CreateProject(context.TODO())
			_, _ = db.GetQueries().CreateUserProject(context.TODO(), models.CreateUserProjectParams{
				UserID:     userAccount.ID,
				ProjectID:  project.ID,
				Permission: models.AccessPermissionTypeMEMBER,
			})

			response, requestErr := testClient.Get(
				context.TODO(),
				listEndpointURL(project.ID),
			)
			assert.NoError(t, requestErr)
			assert.Equal(t, http.StatusOK, response.StatusCode)

			data := make([]*dto.ProviderKeyDTO, 0)
			_ = serialization.DeserializeJSON(response.Body, &data)

			assert.Equal(t, 0, len(data))
		})
		t.Run(
			"responds with status 403 FORBIDDEN if the user does not have projects access",
			func(t *testing.T) {
				project, _ := factories.CreateProject(context.TODO())

				response, requestErr := testClient.Get(
					context.TODO(),
					listEndpointURL(project.ID),
				)
				assert.NoError(t, requestErr)
				assert.Equal(t, http.StatusForbidden, response.StatusCode)
			},
		)
	})

	t.Run(fmt.Sprintf("POST: %s", api.ProjectProviderKeyListEndpoint), func(t *testing.T) {
		t.Run("creates a provider key", func(t *testing.T) {
			project, _ := factories.CreateProject(context.TODO())
			_, _ = db.GetQueries().CreateUserProject(context.TODO(), models.CreateUserProjectParams{
				UserID:     userAccount.ID,
				ProjectID:  project.ID,
				Permission: models.AccessPermissionTypeMEMBER,
			})

			data := dto.ProviderKeyCreateDTO{
				ModelVendor: modelVendor,
				Key:         unencryptedKey,
			}

			response, requestErr := testClient.Post(
				context.TODO(),
				listEndpointURL(project.ID),
				data,
			)
			assert.NoError(t, requestErr)
			assert.Equal(t, http.StatusCreated, response.StatusCode)

			created := &dto.ProviderKeyDTO{}
			_ = serialization.DeserializeJSON(response.Body, created)

			assert.NotEmpty(t, created.ID)
			assert.Equal(t, modelVendor, created.ModelVendor)
			assert.NotEmpty(t, created.CreatedAt)
		})
		t.Run("responds with 400 BAD REQUEST if the request body is invalid", func(t *testing.T) {
			project, _ := factories.CreateProject(context.TODO())
			_, _ = db.GetQueries().CreateUserProject(context.TODO(), models.CreateUserProjectParams{
				UserID:     userAccount.ID,
				ProjectID:  project.ID,
				Permission: models.AccessPermissionTypeMEMBER,
			})

			response, requestErr := testClient.Post(
				context.TODO(),
				listEndpointURL(project.ID),
				"invalid",
			)
			assert.NoError(t, requestErr)
			assert.Equal(t, http.StatusBadRequest, response.StatusCode)
		})
		t.Run(
			"responds with 400 BAD REQUEST if the request body fails validation due to missing key",
			func(t *testing.T) {
				project, _ := factories.CreateProject(context.TODO())
				_, _ = db.GetQueries().
					CreateUserProject(context.TODO(), models.CreateUserProjectParams{
						UserID:     userAccount.ID,
						ProjectID:  project.ID,
						Permission: models.AccessPermissionTypeMEMBER,
					})

				data := dto.ProviderKeyCreateDTO{
					ModelVendor: modelVendor,
				}

				response, requestErr := testClient.Post(
					context.TODO(),
					listEndpointURL(project.ID),
					data,
				)
				assert.NoError(t, requestErr)
				assert.Equal(t, http.StatusBadRequest, response.StatusCode)
			},
		)
		t.Run(
			"responds with 400 BAD REQUEST if the request body fails validation due to missing model vendor",
			func(t *testing.T) {
				project, _ := factories.CreateProject(context.TODO())
				_, _ = db.GetQueries().
					CreateUserProject(context.TODO(), models.CreateUserProjectParams{
						UserID:     userAccount.ID,
						ProjectID:  project.ID,
						Permission: models.AccessPermissionTypeMEMBER,
					})

				data := dto.ProviderKeyCreateDTO{
					Key: unencryptedKey,
				}

				response, requestErr := testClient.Post(
					context.TODO(),
					listEndpointURL(project.ID),
					data,
				)
				assert.NoError(t, requestErr)
				assert.Equal(t, http.StatusBadRequest, response.StatusCode)
			},
		)
		t.Run(
			"responds with 400 BAD REQUEST if there is already an existing provider key for the projectID + model vendor",
			func(t *testing.T) {
				project, _ := factories.CreateProject(context.TODO())
				_, _ = db.GetQueries().
					CreateUserProject(context.TODO(), models.CreateUserProjectParams{
						UserID:     userAccount.ID,
						ProjectID:  project.ID,
						Permission: models.AccessPermissionTypeMEMBER,
					})

				_, _ = db.GetQueries().
					CreateProviderKey(context.TODO(), models.CreateProviderKeyParams{
						ProjectID:   project.ID,
						ModelVendor: modelVendor,
						ApiKey:      unencryptedKey,
					})

				data := dto.ProviderKeyCreateDTO{
					ModelVendor: modelVendor,
					Key:         unencryptedKey,
				}

				response, requestErr := testClient.Post(
					context.TODO(),
					listEndpointURL(project.ID),
					data,
				)
				assert.NoError(t, requestErr)
				assert.Equal(t, http.StatusBadRequest, response.StatusCode)
			},
		)
		t.Run(
			"responds with status 403 FORBIDDEN if the user does not have projects access",
			func(t *testing.T) {},
		)
	})

	t.Run(fmt.Sprintf("DELETE: %s", api.ProjectProviderKeyDetailEndpoint), func(t *testing.T) {
		t.Run("deletes a provider key", func(t *testing.T) {
			project, _ := factories.CreateProject(context.TODO())
			_, _ = db.GetQueries().CreateUserProject(context.TODO(), models.CreateUserProjectParams{
				UserID:     userAccount.ID,
				ProjectID:  project.ID,
				Permission: models.AccessPermissionTypeADMIN,
			})

			providerKey, _ := db.GetQueries().
				CreateProviderKey(context.TODO(), models.CreateProviderKeyParams{
					ProjectID:   project.ID,
					ModelVendor: modelVendor,
					ApiKey:      unencryptedKey,
				})

			response, requestErr := testClient.Delete(
				context.TODO(),
				detailEndpointURL(project.ID, providerKey.ID),
			)
			assert.NoError(t, requestErr)
			assert.Equal(t, http.StatusNoContent, response.StatusCode)

			_, err := db.GetQueries().
				RetrieveProviderKey(context.TODO(), models.RetrieveProviderKeyParams{
					ModelVendor: modelVendor,
					ProjectID:   project.ID,
				})
			assert.Error(t, err)
		})
		t.Run(
			"responds with status 401 UNAUTHORIZED if the user is not an admin",
			func(t *testing.T) {
				project, _ := factories.CreateProject(context.TODO())
				_, _ = db.GetQueries().
					CreateUserProject(context.TODO(), models.CreateUserProjectParams{
						UserID:     userAccount.ID,
						ProjectID:  project.ID,
						Permission: models.AccessPermissionTypeMEMBER,
					})

				providerKey, _ := db.GetQueries().
					CreateProviderKey(context.TODO(), models.CreateProviderKeyParams{
						ProjectID:   project.ID,
						ModelVendor: modelVendor,
						ApiKey:      unencryptedKey,
					})

				response, requestErr := testClient.Delete(
					context.TODO(),
					detailEndpointURL(project.ID, providerKey.ID),
				)
				assert.NoError(t, requestErr)
				assert.Equal(t, http.StatusUnauthorized, response.StatusCode)
			},
		)
		t.Run(
			"responds with status 403 FORBIDDEN if the user does not have projects access",
			func(t *testing.T) {
				project, _ := factories.CreateProject(context.TODO())

				providerKey, _ := db.GetQueries().
					CreateProviderKey(context.TODO(), models.CreateProviderKeyParams{
						ProjectID:   project.ID,
						ModelVendor: modelVendor,
						ApiKey:      unencryptedKey,
					})

				response, requestErr := testClient.Delete(
					context.TODO(),
					detailEndpointURL(project.ID, providerKey.ID),
				)
				assert.NoError(t, requestErr)
				assert.Equal(t, http.StatusForbidden, response.StatusCode)
			},
		)
	})
}
