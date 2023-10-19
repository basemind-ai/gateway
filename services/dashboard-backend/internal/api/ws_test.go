package api_test

import (
	"context"
	"encoding/json"
	"fmt"
	"github.com/basemind-ai/monorepo/e2e/factories"
	"github.com/basemind-ai/monorepo/gen/go/prompttesting/v1"
	"github.com/basemind-ai/monorepo/services/dashboard-backend/internal/api"
	"github.com/basemind-ai/monorepo/services/dashboard-backend/internal/dto"
	"github.com/basemind-ai/monorepo/services/dashboard-backend/internal/middleware"
	"github.com/basemind-ai/monorepo/services/dashboard-backend/internal/ptgrpcclient"
	"github.com/basemind-ai/monorepo/shared/go/db"
	"github.com/basemind-ai/monorepo/shared/go/router"
	"github.com/basemind-ai/monorepo/shared/go/serialization"
	"github.com/basemind-ai/monorepo/shared/go/testutils"
	"github.com/lxzan/gws"
	"github.com/stretchr/testify/assert"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
	"net"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"
)

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
	T       *testing.T
	Channel chan *dto.PromptConfigTestResultDTO
}

func (c ClientHandler) OnMessage(_ *gws.Conn, message *gws.Message) {
	value := &dto.PromptConfigTestResultDTO{}
	_ = serialization.DeserializeJSON(message, value)
	c.Channel <- value
}

func createMockGRPCServer(
	t *testing.T,
) *testutils.MockPromptTestingService {
	t.Helper()
	mockService := &testutils.MockPromptTestingService{T: t}
	listener := testutils.CreateTestGRPCServer[prompttesting.PromptTestingServiceServer](
		t,
		prompttesting.RegisterPromptTestingServiceServer,
		mockService,
	)
	client, clientErr := ptgrpcclient.New(
		"",
		grpc.WithTransportCredentials(insecure.NewCredentials()),
		grpc.WithContextDialer(
			func(context.Context, string) (net.Conn, error) {
				return listener.Dial()
			},
		),
	)

	assert.NoError(t, clientErr)

	ptgrpcclient.SetClient(client)
	return mockService
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
	promptRequestRecord, _ := factories.CreatePromptRequestRecord(context.TODO(), promptConfig.ID)
	templateVariables, _ := json.Marshal(map[string]string{"userInput": "test"})

	projectID := db.UUIDToString(&project.ID)
	applicationID := db.UUIDToString(&application.ID)
	promptConfigID := db.UUIDToString(&promptConfig.ID)
	promptRequestRecordID := db.UUIDToString(&promptRequestRecord.ID)

	data := &dto.PromptConfigTestDTO{
		Name:                   "test",
		ModelVendor:            promptConfig.ModelVendor,
		ModelType:              promptConfig.ModelType,
		ModelParameters:        promptConfig.ModelParameters,
		ProviderPromptMessages: promptConfig.ProviderPromptMessages,
		TemplateVariables:      templateVariables,
		PromptConfigID:         &promptConfigID,
	}

	serializedDTO, serializationErr := json.Marshal(data)
	assert.NoError(t, serializationErr)

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
		channel := make(chan *dto.PromptConfigTestResultDTO)
		testServer := createTestServer(t, userAccount)
		client, response, err := gws.NewClient(
			ClientHandler{T: t, Channel: channel},
			&gws.ClientOption{Addr: createWSUrl(testServer.URL)},
		)
		assert.NoError(t, err)
		assert.Equal(t, http.StatusSwitchingProtocols, response.StatusCode)

		writeErr := client.WriteMessage(gws.OpcodeText, serializedDTO)
		assert.NoError(t, writeErr)
	})

	t.Run("streams responses", func(t *testing.T) {
		channel := make(chan *dto.PromptConfigTestResultDTO)
		mockService := createMockGRPCServer(t)

		finishReason := "done"

		mockService.Stream = []*prompttesting.PromptTestingStreamingPromptResponse{
			{Content: "1"},
			{Content: "2"},
			{
				Content:               "3",
				FinishReason:          &finishReason,
				PromptRequestRecordId: &promptRequestRecordID,
			},
		}
		testServer := createTestServer(t, userAccount)
		handler := ClientHandler{T: t, Channel: channel}
		client, response, err := gws.NewClient(
			&handler,
			&gws.ClientOption{Addr: createWSUrl(testServer.URL)},
		)
		assert.NoError(t, err)
		assert.Equal(t, http.StatusSwitchingProtocols, response.StatusCode)

		writeErr := client.WriteMessage(gws.OpcodeText, serializedDTO)
		assert.NoError(t, writeErr)

		go client.ReadLoop()

		time.Sleep(1 * time.Second)

		chunks := make([]*dto.PromptConfigTestResultDTO, 0)

		for chunk := range channel {
			chunks = append(chunks, chunk)
			if len(chunks) == 3 {
				break
			}
		}

		assert.Len(t, chunks, 3)
		assert.Equal(t, &mockService.Stream[0].Content, chunks[0].Content) //nolint: gosec
		assert.Nil(t, chunks[0].FinishReason)                              //nolint: gosec
		assert.Nil(t, chunks[0].PromptTestRecordID)                        //nolint: gosec
		assert.Equal(t, &mockService.Stream[1].Content, chunks[1].Content) //nolint: gosec
		assert.Nil(t, chunks[1].FinishReason)                              //nolint: gosec
		assert.Nil(t, chunks[1].PromptTestRecordID)                        //nolint: gosec
		assert.Equal(t, &mockService.Stream[2].Content, chunks[2].Content) //nolint: gosec
		assert.Equal(t, finishReason, *chunks[2].FinishReason)             //nolint: gosec
		assert.NotNil(t, *chunks[2].PromptTestRecordID)                    //nolint: gosec

		promptTestRecordID, parseErr := db.StringToUUID(
			*chunks[2].PromptTestRecordID, //nolint: gosec
		)
		assert.NoError(t, parseErr)

		promptTestRecord, retrieveErr := db.GetQueries().
			RetrievePromptTestRecord(context.TODO(), *promptTestRecordID)
		assert.NoError(t, retrieveErr)

		assert.Equal(t, promptTestRecord.Name, data.Name)
		assert.Equal(t, promptTestRecord.Response, "123")
		assert.Equal(t, json.RawMessage(promptTestRecord.VariableValues), data.TemplateVariables)
	})

	t.Run("sends error message as expected", func(t *testing.T) {
		channel := make(chan *dto.PromptConfigTestResultDTO)
		mockService := createMockGRPCServer(t)

		finishReason := "error"

		mockService.Error = assert.AnError
		testServer := createTestServer(t, userAccount)
		handler := ClientHandler{T: t, Channel: channel}
		client, response, err := gws.NewClient(
			&handler,
			&gws.ClientOption{Addr: createWSUrl(testServer.URL)},
		)
		assert.NoError(t, err)
		assert.Equal(t, http.StatusSwitchingProtocols, response.StatusCode)

		writeErr := client.WriteMessage(gws.OpcodeText, serializedDTO)
		assert.NoError(t, writeErr)

		go client.ReadLoop()

		time.Sleep(1 * time.Second)

		chunks := make([]*dto.PromptConfigTestResultDTO, 0)

		for chunk := range channel {
			chunks = append(chunks, chunk)
			break
		}

		assert.NotNil(t, chunks[0].ErrorMessage)               //nolint: gosec
		assert.Equal(t, *chunks[0].FinishReason, finishReason) //nolint: gosec
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
