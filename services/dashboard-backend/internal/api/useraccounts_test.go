package api_test

import (
	"context"
	"fmt"
	"github.com/basemind-ai/monorepo/e2e/factories"
	"github.com/basemind-ai/monorepo/services/dashboard-backend/internal/api"
	"github.com/basemind-ai/monorepo/shared/go/db"
	"github.com/basemind-ai/monorepo/shared/go/db/models"
	"github.com/basemind-ai/monorepo/shared/go/testutils"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"net/http"
	"testing"
	"time"
)

func TestUserAccountsAPI(t *testing.T) {
	t.Run("Deletes user account from DB and firebase", func(t *testing.T) {
		userAccount, _ := factories.CreateUserAccount(context.TODO())
		testClient := createTestClient(t, userAccount)
		mockAuth := testutils.MockFirebaseAuth(t)

		mockAuth.On("DeleteUser", mock.Anything, userAccount.FirebaseID).Return(nil)

		response, requestErr := testClient.Delete(
			context.TODO(),
			fmt.Sprintf("/v1%s", api.UserAccountDetailEndpoint),
		)

		assert.NoError(t, requestErr)
		assert.Equal(t, http.StatusNoContent, response.StatusCode)

		time.Sleep(100 * time.Millisecond)
		mockAuth.AssertExpectations(t)
	})

	t.Run("does not allow delete if user is the only admin of a project", func(t *testing.T) {
		project, _ := factories.CreateProject(context.TODO())
		userAccount, _ := factories.CreateUserAccount(context.TODO())
		_, _ = db.GetQueries().CreateUserProject(context.TODO(), models.CreateUserProjectParams{
			UserID:     userAccount.ID,
			ProjectID:  project.ID,
			Permission: models.AccessPermissionTypeADMIN,
		})

		testClient := createTestClient(t, userAccount)
		mockAuth := testutils.MockFirebaseAuth(t)

		response, requestErr := testClient.Delete(
			context.TODO(),
			fmt.Sprintf("/v1%s", api.UserAccountDetailEndpoint),
		)

		assert.NoError(t, requestErr)
		assert.Equal(t, http.StatusBadRequest, response.StatusCode)

		mockAuth.AssertNotCalled(t, "DeleteUser", mock.Anything, userAccount.FirebaseID)
	})

	t.Run("allows delete if there is another admin for a project", func(t *testing.T) {
		project, _ := factories.CreateProject(context.TODO())
		userAccount, _ := factories.CreateUserAccount(context.TODO())
		_, _ = db.GetQueries().CreateUserProject(context.TODO(), models.CreateUserProjectParams{
			UserID:     userAccount.ID,
			ProjectID:  project.ID,
			Permission: models.AccessPermissionTypeADMIN,
		})

		otherUserAccount, _ := factories.CreateUserAccount(context.TODO())
		_, _ = db.GetQueries().CreateUserProject(context.TODO(), models.CreateUserProjectParams{
			UserID:     otherUserAccount.ID,
			ProjectID:  project.ID,
			Permission: models.AccessPermissionTypeADMIN,
		})

		testClient := createTestClient(t, userAccount)
		mockAuth := testutils.MockFirebaseAuth(t)

		mockAuth.On("DeleteUser", mock.Anything, userAccount.FirebaseID).Return(nil)

		response, requestErr := testClient.Delete(
			context.TODO(),
			fmt.Sprintf("/v1%s", api.UserAccountDetailEndpoint),
		)

		assert.NoError(t, requestErr)
		assert.Equal(t, http.StatusNoContent, response.StatusCode)

		time.Sleep(100 * time.Millisecond)
		mockAuth.AssertExpectations(t)
	})
}
