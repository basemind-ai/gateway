package api_test

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"github.com/basemind-ai/monorepo/e2e/factories"
	"github.com/basemind-ai/monorepo/gen/go/ptesting/v1"
	"github.com/basemind-ai/monorepo/services/dashboard-backend/internal/api"
	"github.com/basemind-ai/monorepo/services/dashboard-backend/internal/dto"
	"github.com/basemind-ai/monorepo/services/dashboard-backend/internal/middleware"
	"github.com/basemind-ai/monorepo/services/dashboard-backend/internal/ptestingclient"
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

func createTestServer(t *testing.T) *httptest.Server {
	t.Helper()
	r := router.New(router.Options{
		Environment:      "test",
		ServiceName:      "test",
		RegisterHandlers: api.RegisterHandlers,
		Middlewares: []func(next http.Handler) http.Handler{
			middleware.FirebaseAuthMiddleware,
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
	T          *testing.T
	Channel    chan *dto.PromptConfigTestResultDTO
	ErrChannel chan error
}

func (c ClientHandler) OnMessage(_ *gws.Conn, message *gws.Message) {
	value := &dto.PromptConfigTestResultDTO{}
	_ = serialization.DeserializeJSON(message, value)
	c.Channel <- value
}

func (c ClientHandler) OnClose(_ *gws.Conn, err error) {
	c.ErrChannel <- err
}

func createMockGRPCServer(
	t *testing.T,
) *testutils.MockPromptTestingService {
	t.Helper()
	mockService := &testutils.MockPromptTestingService{T: t}
	listener := testutils.CreateTestGRPCServer[ptesting.PromptTestingServiceServer](
		t,
		ptesting.RegisterPromptTestingServiceServer,
		mockService,
	)
	client, clientErr := ptestingclient.New(
		"",
		grpc.WithTransportCredentials(insecure.NewCredentials()),
		grpc.WithContextDialer(
			func(context.Context, string) (net.Conn, error) {
				return listener.Dial()
			},
		),
	)

	assert.NoError(t, clientErr)

	ptestingclient.SetClient(client)
	return mockService
}

func createOTP(t *testing.T, userAccount *db.UserAccount, projectID string) string {
	t.Helper()
	testClient := createTestClient(t, userAccount)

	url := fmt.Sprintf(
		"/v1%s",
		strings.ReplaceAll(api.ProjectOTPEndpoint, "{projectId}", projectID),
	)

	response, requestErr := testClient.Get(context.TODO(), url)
	assert.NoError(t, requestErr)

	data := dto.OtpDTO{}
	deserializationErr := serialization.DeserializeJSON(response.Body, &data)
	assert.NoError(t, deserializationErr)

	return data.OTP
}

func TestPromptTestingAPI(t *testing.T) {
	testutils.SetTestEnv(t)
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
	templateVariables := map[string]string{"userInput": "test"}

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

	createWSUrl := func(serverURL string, otp string) string {
		endpointPath := fmt.Sprintf(
			"/v1%s?otp=%s",
			strings.ReplaceAll(
				strings.ReplaceAll(
					api.PromptConfigTestingEndpoint,
					"{projectId}",
					projectID),
				"{applicationId}",
				applicationID,
			),
			otp,
		)
		return fmt.Sprintf(
			"%s%s",
			strings.ReplaceAll(serverURL, "http:", "ws:"),
			endpointPath,
		)
	}

	t.Run("OnMessage", func(t *testing.T) {
		t.Run("establishes web socket connection", func(t *testing.T) {
			channel := make(chan *dto.PromptConfigTestResultDTO)
			testServer := createTestServer(t)
			client, response, err := gws.NewClient(
				ClientHandler{T: t, Channel: channel},
				&gws.ClientOption{
					Addr: createWSUrl(testServer.URL, createOTP(t, userAccount, projectID)),
				},
			)
			assert.NoError(t, err)
			assert.Equal(t, http.StatusSwitchingProtocols, response.StatusCode)

			writeErr := client.WriteMessage(gws.OpcodeText, serializedDTO)
			assert.NoError(t, writeErr)
		})

		t.Run("handles pings", func(t *testing.T) {
			channel := make(chan *dto.PromptConfigTestResultDTO)
			testServer := createTestServer(t)
			client, response, err := gws.NewClient(
				ClientHandler{T: t, Channel: channel},
				&gws.ClientOption{
					Addr: createWSUrl(testServer.URL, createOTP(t, userAccount, projectID)),
				},
			)
			assert.NoError(t, err)
			assert.Equal(t, http.StatusSwitchingProtocols, response.StatusCode)

			// we intentionally use the text opcode here, because the browser cannot send proper ping messages with
			// the correct opcode.
			writeErr := client.WriteMessage(gws.OpcodeText, []byte("ping"))
			assert.NoError(t, writeErr)
		})

		t.Run("streams responses", func(t *testing.T) {
			channel := make(chan *dto.PromptConfigTestResultDTO)
			mockService := createMockGRPCServer(t)

			finishReason := "done"

			mockService.Stream = []*ptesting.PromptTestingStreamingPromptResponse{
				{Content: "1"},
				{Content: "2"},
				{
					Content:               "3",
					FinishReason:          &finishReason,
					PromptRequestRecordId: &promptRequestRecordID,
				},
			}
			testServer := createTestServer(t)
			handler := ClientHandler{T: t, Channel: channel}
			client, response, err := gws.NewClient(
				&handler,
				&gws.ClientOption{
					Addr: createWSUrl(testServer.URL, createOTP(t, userAccount, projectID)),
				},
			)
			assert.NoError(t, err)
			assert.Equal(t, http.StatusSwitchingProtocols, response.StatusCode)

			writeErr := client.WriteMessage(gws.OpcodeText, serializedDTO)
			assert.NoError(t, writeErr)

			go client.ReadLoop()

			time.Sleep(100 * time.Millisecond)

			chunks := make([]*dto.PromptConfigTestResultDTO, 0)

			for chunk := range channel {
				chunks = append(chunks, chunk)
				if len(chunks) == 3 {
					break
				}
			}

			assert.Len(t, chunks, 3)
			assert.Equal(t, &mockService.Stream[0].Content, chunks[0].Content)
			assert.Nil(t, chunks[0].FinishReason)
			assert.Nil(t, chunks[0].PromptTestRecordID)
			assert.Equal(t, &mockService.Stream[1].Content, chunks[1].Content)
			assert.Nil(t, chunks[1].FinishReason)
			assert.Nil(t, chunks[1].PromptTestRecordID)
			assert.Equal(t, &mockService.Stream[2].Content, chunks[2].Content)
			assert.Equal(t, finishReason, *chunks[2].FinishReason)
			assert.NotNil(t, *chunks[2].PromptTestRecordID)

			promptTestRecordID, parseErr := db.StringToUUID(
				*chunks[2].PromptTestRecordID,
			)
			assert.NoError(t, parseErr)

			promptTestRecord, retrieveErr := db.GetQueries().
				RetrievePromptTestRecord(context.TODO(), *promptTestRecordID)
			assert.NoError(t, retrieveErr)

			assert.Equal(t, promptTestRecord.Name, data.Name)
			assert.Equal(t, promptTestRecord.Response, "123")

			serializedTemplateVariables, _ := json.Marshal(templateVariables)
			assert.Equal(
				t,
				json.RawMessage(promptTestRecord.VariableValues),
				json.RawMessage(serializedTemplateVariables),
			)
		})

		t.Run("sends error message as expected", func(t *testing.T) {
			channel := make(chan *dto.PromptConfigTestResultDTO)
			mockService := createMockGRPCServer(t)

			finishReason := "error"

			mockService.Error = assert.AnError
			testServer := createTestServer(t)
			handler := ClientHandler{T: t, Channel: channel}
			client, response, err := gws.NewClient(
				&handler,
				&gws.ClientOption{
					Addr: createWSUrl(testServer.URL, createOTP(t, userAccount, projectID)),
				},
			)
			assert.NoError(t, err)
			assert.Equal(t, http.StatusSwitchingProtocols, response.StatusCode)

			writeErr := client.WriteMessage(gws.OpcodeText, serializedDTO)
			assert.NoError(t, writeErr)

			go client.ReadLoop()

			time.Sleep(100 * time.Millisecond)

			chunks := make([]*dto.PromptConfigTestResultDTO, 0)

			for chunk := range channel {
				chunks = append(chunks, chunk)
				break
			}

			assert.NotNil(t, chunks[0].ErrorMessage)
			assert.Equal(t, *chunks[0].FinishReason, finishReason)
		})

		t.Run(
			"responds with status 401 NOT AUTHORIZED if the user does not have projects access",
			func(t *testing.T) {
				userWithoutProjectsAccess, _ := factories.CreateUserAccount(context.TODO())
				testServer := createTestServer(t)
				_, response, err := gws.NewClient(
					ClientHandler{},
					&gws.ClientOption{
						Addr: createWSUrl(
							testServer.URL,
							createOTP(t, userWithoutProjectsAccess, projectID),
						),
					},
				)
				assert.Error(t, err)
				assert.Equal(t, http.StatusUnauthorized, response.StatusCode)
			},
		)

		t.Run("handles parse error", func(t *testing.T) {
			errChannel := make(chan error)
			testServer := createTestServer(t)
			client, response, err := gws.NewClient(
				ClientHandler{T: t, ErrChannel: errChannel},
				&gws.ClientOption{
					Addr: createWSUrl(testServer.URL, createOTP(t, userAccount, projectID)),
				},
			)
			assert.NoError(t, err)
			assert.Equal(t, http.StatusSwitchingProtocols, response.StatusCode)

			writeErr := client.WriteMessage(gws.OpcodeText, []byte("invalid"))
			assert.NoError(t, writeErr)

			go client.ReadLoop()

			time.Sleep(100 * time.Millisecond)

			closeErr := <-errChannel
			assert.Error(t, closeErr)

			gwsErr := &gws.CloseError{}

			if ok := errors.As(closeErr, &gwsErr); ok {
				assert.Equal(t, gwsErr.Code, uint16(api.StatusWSUnsupportedPayload))
			} else {
				assert.Fail(t, "expected error to be gws.ErrConnClosed")
			}
		})
	})

	t.Run("ParseMessageData", func(t *testing.T) {
		t.Run("should return error when parsing invalid JSON", func(t *testing.T) {
			message := &gws.Message{Data: bytes.NewBuffer([]byte("invalid"))}
			_, err := api.ParseMessageData(message, application.ID)
			assert.Error(t, err)
		})

		t.Run("should validate the incoming data", func(t *testing.T) {
			invalidID := "invalid"
			testCases := []struct {
				Data dto.PromptConfigTestDTO
				Name string
			}{
				{
					Name: "should return error when name is empty",
					Data: dto.PromptConfigTestDTO{
						Name:                   "",
						ModelVendor:            db.ModelVendorOPENAI,
						ModelType:              db.ModelTypeGpt4,
						ProviderPromptMessages: promptConfig.ProviderPromptMessages,
						ModelParameters:        promptConfig.ModelParameters,
						TemplateVariables:      templateVariables,
					},
				},
				{
					Name: "should return error when model vendor is invalid",
					Data: dto.PromptConfigTestDTO{
						Name:                   "test",
						ModelVendor:            db.ModelVendor("invalid"),
						ModelType:              db.ModelTypeGpt4,
						ProviderPromptMessages: promptConfig.ProviderPromptMessages,
						ModelParameters:        promptConfig.ModelParameters,
						TemplateVariables:      templateVariables,
					},
				},
				{
					Name: "should return error when model type is invalid",
					Data: dto.PromptConfigTestDTO{
						Name:                   "test",
						ModelVendor:            db.ModelVendorOPENAI,
						ModelType:              db.ModelType("invalid"),
						ProviderPromptMessages: promptConfig.ProviderPromptMessages,
						ModelParameters:        promptConfig.ModelParameters,
						TemplateVariables:      templateVariables,
					},
				},
				{
					Name: "should return error when provider prompt messages are empty",
					Data: dto.PromptConfigTestDTO{
						Name:                   "test",
						ModelVendor:            db.ModelVendorOPENAI,
						ModelType:              db.ModelTypeGpt432k,
						ProviderPromptMessages: nil,
						ModelParameters:        promptConfig.ModelParameters,
						TemplateVariables:      templateVariables,
					},
				},
				{
					Name: "should return error when model Parametersare empty",
					Data: dto.PromptConfigTestDTO{
						Name:                   "test",
						ModelVendor:            db.ModelVendorOPENAI,
						ModelType:              db.ModelTypeGpt432k,
						ProviderPromptMessages: promptConfig.ProviderPromptMessages,
						ModelParameters:        nil,
						TemplateVariables:      templateVariables,
					},
				},
				{
					Name: "should return error when promptConfigID is not a uuid4",
					Data: dto.PromptConfigTestDTO{
						Name:                   "test",
						ModelVendor:            db.ModelVendorOPENAI,
						ModelType:              db.ModelTypeGpt432k,
						ProviderPromptMessages: promptConfig.ProviderPromptMessages,
						ModelParameters:        promptConfig.ModelParameters,
						TemplateVariables:      templateVariables,
						PromptConfigID:         &invalidID,
					},
				},
			}

			for _, testCase := range testCases {
				t.Run(testCase.Name, func(t *testing.T) {
					serializedData, _ := json.Marshal(testCase.Data)
					message := &gws.Message{Data: bytes.NewBuffer(serializedData)}
					_, err := api.ParseMessageData(message, application.ID)
					assert.Error(t, err)
				})
			}
		})

		t.Run("should create a new prompt config when prompt config id is nil", func(t *testing.T) {
			d := dto.PromptConfigTestDTO{
				Name:                   factories.RandomString(10),
				ModelVendor:            db.ModelVendorOPENAI,
				ModelType:              db.ModelTypeGpt432k,
				ProviderPromptMessages: promptConfig.ProviderPromptMessages,
				ModelParameters:        promptConfig.ModelParameters,
				TemplateVariables:      templateVariables,
				PromptConfigID:         nil,
			}
			serializedData, _ := json.Marshal(d)
			message := &gws.Message{Data: bytes.NewBuffer(serializedData)}
			result, err := api.ParseMessageData(message, application.ID)
			assert.NoError(t, err)
			assert.NotNil(t, result.PromptConfigID)

			uuid, _ := db.StringToUUID(*result.PromptConfigID)
			pc, retrieveErr := db.GetQueries().RetrievePromptConfig(context.TODO(), *uuid)
			assert.NoError(t, retrieveErr)
			assert.Equal(t, pc.Name, fmt.Sprintf("prompt config for test: %s", d.Name))
			assert.Equal(t, pc.ModelVendor, d.ModelVendor)
			assert.Equal(t, pc.ModelType, d.ModelType)
			assert.Equal(t, json.RawMessage(pc.ModelParameters), d.ModelParameters)
			assert.Equal(t, json.RawMessage(pc.ProviderPromptMessages), d.ProviderPromptMessages)
			assert.Equal(t, pc.IsTestConfig, true)
		})
	})
}
