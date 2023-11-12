package repositories_test

import (
	"context"
	"github.com/basemind-ai/monorepo/e2e/factories"
	"github.com/basemind-ai/monorepo/services/dashboard-backend/internal/dto"
	"github.com/basemind-ai/monorepo/services/dashboard-backend/internal/repositories"
	"github.com/basemind-ai/monorepo/shared/go/config"
	"github.com/basemind-ai/monorepo/shared/go/cryptoutils"
	"github.com/basemind-ai/monorepo/shared/go/db"
	"github.com/basemind-ai/monorepo/shared/go/db/models"
	"github.com/basemind-ai/monorepo/shared/go/testutils"
	"github.com/stretchr/testify/assert"
	"testing"
	"time"
)

func TestProviderKeyRepositoriy(t *testing.T) {
	t.Run("CreateProviderKey", func(t *testing.T) {
		testutils.SetTestEnv(t)
		unencryptedKey := factories.RandomString(15)

		t.Run("should create a new provider key", func(t *testing.T) {
			project, _ := factories.CreateProject(context.TODO())

			result, err := repositories.CreateProviderKey(
				context.TODO(),
				project.ID,
				dto.ProviderKeyCreateDTO{
					ModelVendor: models.ModelVendorOPENAI,
					Key:         unencryptedKey,
				},
			)

			assert.NoError(t, err)
			assert.Equal(t, models.ModelVendorOPENAI, result.ModelVendor)

			retrieved, retrievalErr := db.GetQueries().
				RetrieveProviderKey(context.TODO(), models.RetrieveProviderKeyParams{
					ProjectID:   project.ID,
					ModelVendor: models.ModelVendorOPENAI,
				})
			assert.NoError(t, retrievalErr)

			decryptedKey := cryptoutils.Decrypt(
				retrieved.EncryptedApiKey,
				config.Get(context.TODO()).CryptoPassKey,
			)
			assert.Equal(t, unencryptedKey, decryptedKey)
		})
		t.Run(
			"should return an error if there is already a key for the given projectID + model vendor",
			func(t *testing.T) {
				project, _ := factories.CreateProject(context.TODO())

				_, firstKeyErr := repositories.CreateProviderKey(
					context.TODO(),
					project.ID,
					dto.ProviderKeyCreateDTO{
						ModelVendor: models.ModelVendorOPENAI,
						Key:         unencryptedKey,
					},
				)
				assert.NoError(t, firstKeyErr)

				_, secondKeyErr := repositories.CreateProviderKey(
					context.TODO(),
					project.ID,
					dto.ProviderKeyCreateDTO{
						ModelVendor: models.ModelVendorOPENAI,
						Key:         factories.RandomString(20),
					},
				)
				assert.Error(t, secondKeyErr)
			},
		)
	})

	t.Run("DeleteProviderKey", func(t *testing.T) {
		t.Run("should delete a provider key", func(t *testing.T) {
			project, _ := factories.CreateProject(context.TODO())
			providerKey, _ := factories.CreateProviderAPIKey(
				context.TODO(),
				project.ID,
				factories.RandomString(10),
				models.ModelVendorOPENAI,
			)

			_, redisMock := testutils.CreateMockRedisClient(t)

			redisMock.ExpectDel(db.UUIDToString(&project.ID)).SetVal(1)

			repositories.DeleteProviderKey(context.TODO(), project.ID, providerKey.ID)

			_, retrievalErr := db.GetQueries().
				RetrieveProviderKey(context.TODO(), models.RetrieveProviderKeyParams{
					ProjectID:   project.ID,
					ModelVendor: models.ModelVendorOPENAI,
				})
			assert.Error(t, retrievalErr)

			time.Sleep(100 * time.Millisecond)

			assert.NoError(t, redisMock.ExpectationsWereMet())
		})
	})
}
