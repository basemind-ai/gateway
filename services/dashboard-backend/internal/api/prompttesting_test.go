package api_test

import (
	"context"
	"encoding/json"
	"fmt"
	"github.com/basemind-ai/monorepo/e2e/factories"
	"github.com/basemind-ai/monorepo/services/dashboard-backend/internal/api"
	dto2 "github.com/basemind-ai/monorepo/services/dashboard-backend/internal/dto"
	"github.com/basemind-ai/monorepo/shared/go/db"
	"github.com/lxzan/gws"
	"github.com/stretchr/testify/assert"
	"net/http"
	"strings"
	"testing"
)

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
	projectID := createProject(t)
	applicationID := createApplication(t, projectID)

	createUserProject(t, userAccount.FirebaseID, projectID, db.AccessPermissionTypeADMIN)

	appID, _ := db.StringToUUID(applicationID)
	promptConfig, _ := factories.CreatePromptConfig(context.TODO(), *appID)

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

		dto := &dto2.PromptConfigTestDTO{
			ModelVendor:            promptConfig.ModelVendor,
			ModelType:              promptConfig.ModelType,
			ModelParameters:        promptConfig.ModelParameters,
			ProviderPromptMessages: promptConfig.ProviderPromptMessages,
		}

		serializedDTO, serializationErr := json.Marshal(dto)
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
