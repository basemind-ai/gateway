package ws_test

import (
	"context"
	"encoding/json"
	"fmt"
	"github.com/basemind-ai/monorepo/e2e/factories"
	"github.com/basemind-ai/monorepo/services/dashboard-backend/internal/api"
	"github.com/basemind-ai/monorepo/services/dashboard-backend/internal/dto"
	"github.com/basemind-ai/monorepo/services/dashboard-backend/internal/middleware"
	"github.com/basemind-ai/monorepo/shared/go/db"
	"github.com/basemind-ai/monorepo/shared/go/router"
	"github.com/basemind-ai/monorepo/shared/go/testutils"
	"github.com/lxzan/gws"
	"github.com/stretchr/testify/assert"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestMain(m *testing.M) {
	cleanup := testutils.CreateNamespaceTestDBModule("api-test")
	defer cleanup()
	m.Run()
}

func createTestServer(t *testing.T, userAccount *db.UserAccount) *httptest.Server {
	t.Helper()
	r := router.New(router.Options{
		Environment:      "test",
		ServiceName:      "test",
		RegisterHandlers: api.RegisterHandlers,
		Middlewares: []func(next http.Handler) http.Handler{
			middleware.CreateMockFirebaseAuthMiddleware(userAccount),
		},
	})

	server := httptest.NewServer(r)

	t.Cleanup(func() {
		server.CloseClientConnections()
		server.Close()
	})

	return server
}

type ClientHandler struct {
	gws.BuiltinEventHandler
	t *testing.T
}

func (c ClientHandler) OnMessage(socket *gws.Conn, message *gws.Message) {
	defer func() {
		_ = message.Close()
	}()
	if writeErr := socket.WriteMessage(message.Opcode, message.Bytes()); writeErr != nil {
		c.t.Fatal(writeErr)
	}
}

func TestPromptTestingAPI(t *testing.T) {
	userAccount, _ := factories.CreateUserAccount(context.TODO())
	project, _ := factories.CreateProject(context.TODO())
	application, _ := factories.CreateApplication(context.TODO(), project.ID)
	_, _ = db.GetQueries().CreateUserProject(context.TODO(), db.CreateUserProjectParams{
		UserID:     userAccount.ID,
		ProjectID:  project.ID,
		Permission: db.AccessPermissionTypeADMIN,
	})
	promptConfig, _ := factories.CreatePromptConfig(context.TODO(), application.ID)

	projectID := db.UUIDToString(&project.ID)
	applicationID := db.UUIDToString(&application.ID)

	createWSUrl := func(serverURL string) string {
		endpointPath := fmt.Sprintf(
			"/v1%s",
			strings.ReplaceAll(
				strings.ReplaceAll(
					api.PromptConfigTestingEndpoint,
					"{projectId}",
					projectID),
				"{applicationId}",
				applicationID,
			),
		)
		return fmt.Sprintf("%s%s", strings.ReplaceAll(serverURL, "http:", "ws:"), endpointPath)
	}

	t.Run("establishes web socket connection", func(t *testing.T) {
		testServer := createTestServer(t, userAccount)
		client, response, err := gws.NewClient(
			ClientHandler{},
			&gws.ClientOption{Addr: createWSUrl(testServer.URL)},
		)
		assert.NoError(t, err)
		assert.Equal(t, http.StatusSwitchingProtocols, response.StatusCode)

		data := &dto.PromptConfigTestDTO{
			ModelVendor:            promptConfig.ModelVendor,
			ModelType:              promptConfig.ModelType,
			ModelParameters:        promptConfig.ModelParameters,
			ProviderPromptMessages: promptConfig.ProviderPromptMessages,
		}

		serializedDTO, serializationErr := json.Marshal(data)
		assert.NoError(t, serializationErr)

		writeErr := client.WriteMessage(gws.OpcodeText, serializedDTO)
		assert.NoError(t, writeErr)
	})

	t.Run(
		"responds with status 403 FORBIDDEN if the user does not have projects access",
		func(t *testing.T) {
			userWithoutProjectsAccess, _ := factories.CreateUserAccount(context.TODO())
			testServer := createTestServer(t, userWithoutProjectsAccess)
			_, response, err := gws.NewClient(
				ClientHandler{},
				&gws.ClientOption{Addr: createWSUrl(testServer.URL)},
			)
			assert.Error(t, err)
			assert.Equal(t, http.StatusForbidden, response.StatusCode)
		},
	)
}
