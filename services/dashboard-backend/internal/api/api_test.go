package api_test

import (
	"context"
	"github.com/basemind-ai/monorepo/services/dashboard-backend/internal/api"
	"github.com/basemind-ai/monorepo/services/dashboard-backend/internal/middleware"
	"github.com/basemind-ai/monorepo/shared/go/httpclient"
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

func createProject(t *testing.T) string {
	t.Helper()
	project, _ := factories.CreateProject(context.TODO())
	return db.UUIDToString(&project.ID)
}

func createApplication(t *testing.T, projectId string) string {
	t.Helper()
	uuidId, _ := db.StringToUUID(projectId)
	application, _ := factories.CreateApplication(context.TODO(), *uuidId)
	applicationId := db.UUIDToString(&application.ID)
	return applicationId
}

func createTestClient(t *testing.T, firebaseId string) httpclient.Client {
	t.Helper()
	r := router.New(router.Options{
		Environment:      "test",
		ServiceName:      "test",
		RegisterHandlers: api.RegisterHandlers,
		Middlewares: []func(next http.Handler) http.Handler{
			middleware.CreateMockFirebaseAuthMiddleware(firebaseId),
		},
	})

	return httpTestUtils.CreateTestClient(t, r)
}
