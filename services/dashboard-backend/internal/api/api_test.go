package api_test

import (
	"context"
	"github.com/basemind-ai/monorepo/services/dashboard-backend/internal/api"
	"github.com/basemind-ai/monorepo/services/dashboard-backend/internal/middleware"
	"github.com/basemind-ai/monorepo/shared/go/httpclient"
	"github.com/stretchr/testify/assert"
	"net/http"
	"testing"

	"github.com/basemind-ai/monorepo/e2e/factories"
	"github.com/basemind-ai/monorepo/shared/go/db"
	dbTestUtils "github.com/basemind-ai/monorepo/shared/go/db/testutils"
	httpTestUtils "github.com/basemind-ai/monorepo/shared/go/httpclient/testutils"
	"github.com/basemind-ai/monorepo/shared/go/router"
)

func TestMain(m *testing.M) {
	cleanup := dbTestUtils.CreateNamespaceTestDBModule("api-test")
	defer cleanup()
	m.Run()
}

func createUser(t *testing.T) string {
	t.Helper()
	user, _ := factories.CreateUserAccount(context.TODO())

	return user.FirebaseID
}

func createProject(t *testing.T) string {
	t.Helper()
	project, _ := factories.CreateProject(context.TODO())
	return db.UUIDToString(&project.ID)
}

func createUserProject(
	t *testing.T,
	firebaseID string,
	projectID string,
	permission db.AccessPermissionType,
) {
	t.Helper()
	userAccount, err := db.GetQueries().
		FindUserAccountByFirebaseID(context.Background(), firebaseID)
	assert.NoError(t, err)

	projectIDUUID, err := db.StringToUUID(projectID)
	assert.NoError(t, err)

	_, err = db.GetQueries().CreateUserProject(context.Background(), db.CreateUserProjectParams{
		UserID:     userAccount.ID,
		ProjectID:  *projectIDUUID,
		Permission: permission,
	})
	assert.NoError(t, err)
}

func createApplication(t *testing.T, projectID string) string {
	t.Helper()
	uuidID, _ := db.StringToUUID(projectID)
	application, _ := factories.CreateApplication(context.TODO(), *uuidID)
	applicationID := db.UUIDToString(&application.ID)
	return applicationID
}

func createTestClient(t *testing.T, firebaseID string) httpclient.Client {
	t.Helper()
	r := router.New(router.Options{
		Environment:      "test",
		ServiceName:      "test",
		RegisterHandlers: api.RegisterHandlers,
		Middlewares: []func(next http.Handler) http.Handler{
			middleware.CreateMockFirebaseAuthMiddleware(firebaseID),
		},
	})

	return httpTestUtils.CreateTestClient(t, r)
}
