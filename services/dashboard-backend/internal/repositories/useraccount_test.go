package repositories_test

import (
	"context"
	"github.com/basemind-ai/monorepo/e2e/factories"
	"github.com/basemind-ai/monorepo/services/dashboard-backend/internal/repositories"
	"github.com/basemind-ai/monorepo/shared/go/db"
	"github.com/stretchr/testify/assert"
	"testing"
)

func TestUserAccountRepository(t *testing.T) {
	t.Run("GetOrCreateUserAccount", func(t *testing.T) {
		t.Run("should return a user account data if it exists", func(t *testing.T) {
			userAccount, _ := factories.CreateUserAccount(context.TODO())

			retrievedUserAccount, err := repositories.GetOrCreateUserAccount(
				context.TODO(),
				userAccount.FirebaseID,
			)
			assert.NoError(t, err)

			assert.Equal(
				t,
				db.UUIDToString(&userAccount.ID),
				db.UUIDToString(&retrievedUserAccount.ID),
			)
			assert.Equal(t, userAccount.FirebaseID, retrievedUserAccount.FirebaseID)
		})
		t.Run("should create a user account data if it does not exist", func(t *testing.T) {
			userAccount, err := repositories.GetOrCreateUserAccount(context.TODO(), "firebase-id")
			assert.NoError(t, err)

			assert.NotEmpty(t, userAccount.ID)
			assert.Equal(t, "firebase-id", userAccount.FirebaseID)
		})
	})
}
