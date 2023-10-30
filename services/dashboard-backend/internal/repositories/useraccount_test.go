package repositories_test

import (
	"context"
	"firebase.google.com/go/v4/auth"
	"github.com/basemind-ai/monorepo/e2e/factories"
	"github.com/basemind-ai/monorepo/services/dashboard-backend/internal/repositories"
	"github.com/basemind-ai/monorepo/shared/go/db"
	"github.com/basemind-ai/monorepo/shared/go/testutils"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"testing"
	"time"
)

func TestUserAccountRepository(t *testing.T) {
	t.Run("GetOrCreateUserAccount", func(t *testing.T) {
		t.Run("should return a user account data if it exists", func(t *testing.T) {
			userAccount, _ := factories.CreateUserAccount(context.TODO())

			retrievedUserAccount := repositories.GetOrCreateUserAccount(
				context.TODO(),
				userAccount.FirebaseID,
			)

			assert.Equal(
				t,
				db.UUIDToString(&userAccount.ID),
				db.UUIDToString(&retrievedUserAccount.ID),
			)
			assert.Equal(t, userAccount.FirebaseID, retrievedUserAccount.FirebaseID)
		})
		t.Run("should create a user account data if it does not exist", func(t *testing.T) {
			mockAuth := testutils.MockFirebaseAuth(t)

			mockAuth.On("GetUser", mock.Anything, "firebase-id").Return(&auth.UserRecord{
				UserInfo: &auth.UserInfo{
					DisplayName: "Test User",
					Email:       "test@example.com",
					PhoneNumber: "123456789",
					PhotoURL:    "https://example.com/photo.jpg",
				},
			}, nil)

			userAccount := repositories.GetOrCreateUserAccount(context.TODO(), "firebase-id")

			assert.NotEmpty(t, userAccount.ID)
			assert.Equal(t, "firebase-id", userAccount.FirebaseID)
			assert.Equal(t, "Test User", userAccount.DisplayName)
			assert.Equal(t, "test@example.com", userAccount.Email)
			assert.Equal(t, "123456789", userAccount.PhoneNumber)
			assert.Equal(t, "https://example.com/photo.jpg", userAccount.PhotoUrl)
		})
	})

	t.Run("DeleteUserAccount", func(t *testing.T) {
		t.Run("deletes user account and expunges it from firebase", func(t *testing.T) {
			project, _ := factories.CreateProject(context.TODO())
			userAccount, _ := factories.CreateUserAccount(context.TODO())
			_, _ = db.GetQueries().CreateUserProject(context.TODO(), db.CreateUserProjectParams{
				UserID:     userAccount.ID,
				ProjectID:  project.ID,
				Permission: db.AccessPermissionTypeADMIN,
			})

			otherUserAccount, _ := factories.CreateUserAccount(context.TODO())
			_, _ = db.GetQueries().CreateUserProject(context.TODO(), db.CreateUserProjectParams{
				UserID:     otherUserAccount.ID,
				ProjectID:  project.ID,
				Permission: db.AccessPermissionTypeADMIN,
			})

			mockAuth := testutils.MockFirebaseAuth(t)

			mockAuth.On("DeleteUser", mock.Anything, userAccount.FirebaseID).Return(nil)

			err := repositories.DeleteUserAccount(context.TODO(), *userAccount)
			assert.NoError(t, err)

			time.Sleep(100 * time.Millisecond)

			mockAuth.AssertExpectations(t)
		})

		t.Run("does not allow delete if user is sole ADMIN of project", func(t *testing.T) {
			project, _ := factories.CreateProject(context.TODO())
			userAccount, _ := factories.CreateUserAccount(context.TODO())
			_, _ = db.GetQueries().CreateUserProject(context.TODO(), db.CreateUserProjectParams{
				UserID:     userAccount.ID,
				ProjectID:  project.ID,
				Permission: db.AccessPermissionTypeADMIN,
			})

			mockAuth := testutils.MockFirebaseAuth(t)

			err := repositories.DeleteUserAccount(context.TODO(), *userAccount)
			assert.Error(t, err)

			mockAuth.AssertNotCalled(t, "DeleteUser", mock.Anything, userAccount.FirebaseID)
		})
	})
}
