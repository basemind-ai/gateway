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
	"github.com/basemind-ai/monorepo/shared/go/db/models"
	"github.com/basemind-ai/monorepo/shared/go/ptr"
	"github.com/basemind-ai/monorepo/shared/go/router"
	"github.com/basemind-ai/monorepo/shared/go/serialization"
	"github.com/basemind-ai/monorepo/shared/go/testutils"
	"github.com/lxzan/gws"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"google.golang.org/grpc"
	"net"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"
)

type mockSocket struct {
	api.Socket
	mock.Mock
}

func (m *mockSocket) WriteMessage(opcode gws.Opcode, payload []byte) error {
	args := m.Called(opcode, payload)
	return args.Error(0)
}

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
	client := ptestingclient.New(
		"",
		grpc.WithContextDialer(
			func(context.Context, string) (net.Conn, error) {
				return listener.Dial()
			},
		),
	)

	ptestingclient.SetClient(client)
	return mockService
}

func createOTP(t *testing.T, userAccount *models.UserAccount, projectID string) string {
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

type mockSessionStorage struct {
	gws.SessionStorage
	mock.Mock
}

func (s *mockSessionStorage) Load(key string) (value any, exist bool) {
	args := s.Called(key)
	return args.Get(0), args.Bool(1)
}
func (s *mockSessionStorage) Delete(key string) {
	s.Called(key)
}
func (s *mockSessionStorage) Store(key string, value any) {
	s.Called(key, value)
}
func (s *mockSessionStorage) Range(f func(key string, value any) bool) {
	s.Called(f)
}

func TestPromptTestingAPI(t *testing.T) { //nolint: revive
	testutils.SetTestEnv(t)
	userAccount, _ := factories.CreateUserAccount(context.TODO())
	project, _ := factories.CreateProject(context.TODO())
	application, _ := factories.CreateApplication(context.TODO(), project.ID)
	_, _ = db.GetQueries().CreateUserProject(context.TODO(), models.CreateUserProjectParams{
		UserID:     userAccount.ID,
		ProjectID:  project.ID,
		Permission: models.AccessPermissionTypeADMIN,
	})
	promptConfig, _ := factories.CreatePromptConfig(context.TODO(), application.ID)
	promptRequestRecord, _ := factories.CreatePromptRequestRecord(context.TODO(), promptConfig.ID)
	templateVariables := map[string]string{"userInput": "test"}

	projectID := db.UUIDToString(&project.ID)
	applicationID := db.UUIDToString(&application.ID)
	promptConfigID := db.UUIDToString(&promptConfig.ID)
	promptRequestRecordID := db.UUIDToString(&promptRequestRecord.ID)

	data := &dto.PromptConfigTestDTO{
		ModelVendor:            promptConfig.ModelVendor,
		ModelType:              promptConfig.ModelType,
		ModelParameters:        ptr.To(json.RawMessage(promptConfig.ModelParameters)),
		ProviderPromptMessages: ptr.To(json.RawMessage(promptConfig.ProviderPromptMessages)),
		TemplateVariables:      templateVariables,
		PromptConfigID:         &promptConfigID,
	}

	serializedDTO := serialization.SerializeJSON(data)

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

			assert.Equal(t, promptTestRecord.Response, "123")

			serializedTemplateVariables := serialization.SerializeJSON(templateVariables)
			assert.Equal(
				t,
				promptTestRecord.VariableValues,
				serializedTemplateVariables,
			)
		})

		t.Run("sends error message as expected", func(t *testing.T) {
			channel := make(chan *dto.PromptConfigTestResultDTO)
			errChannel := make(chan error)
			mockService := createMockGRPCServer(t)

			finishReason := "error"

			mockService.Error = assert.AnError
			testServer := createTestServer(t)
			handler := ClientHandler{T: t, Channel: channel, ErrChannel: errChannel}
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

			closeErr := <-errChannel
			assert.Error(t, closeErr)

			gwsErr := &gws.CloseError{}

			if ok := errors.As(closeErr, &gwsErr); ok {
				assert.Equal(t, gwsErr.Code, uint16(api.StatusWSServerError))
			} else {
				assert.Fail(t, "expected error to be gws.ErrConnClosed")
			}
		})

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
	})

	t.Run("CreatePayloadFromMessage", func(t *testing.T) {
		t.Run(
			"should create the expected payload when PromptRequestRecordId is nil",
			func(t *testing.T) {
				data := &dto.PromptConfigTestDTO{
					ModelVendor: models.ModelVendorOPENAI,
					ModelType:   models.ModelTypeGpt4,
					ProviderPromptMessages: ptr.To(
						json.RawMessage(promptConfig.ProviderPromptMessages),
					),
					ModelParameters:   ptr.To(json.RawMessage(promptConfig.ModelParameters)),
					TemplateVariables: templateVariables,
				}
				msg := &ptesting.PromptTestingStreamingPromptResponse{
					Content: "test",
				}
				builder := strings.Builder{}
				expectedResult := serialization.SerializeJSON(dto.PromptConfigTestResultDTO{
					Content:      &msg.Content,
					FinishReason: nil,
				})
				result := api.CreatePayloadFromMessage(
					context.TODO(),
					data,
					msg,
					&builder,
				)
				assert.Equal(t, expectedResult, result)
			},
		)

		t.Run(
			"should create the expected payload when PromptRequestRecordId is not nil",
			func(t *testing.T) {
				promptRequestRecord, _ := factories.CreatePromptRequestRecord(
					context.TODO(),
					promptConfig.ID,
				)
				data := &dto.PromptConfigTestDTO{
					ModelVendor: models.ModelVendorOPENAI,
					ModelType:   models.ModelTypeGpt4,
					ProviderPromptMessages: ptr.To(
						json.RawMessage(promptConfig.ProviderPromptMessages),
					),
					ModelParameters:   ptr.To(json.RawMessage(promptConfig.ModelParameters)),
					TemplateVariables: templateVariables,
				}
				msg := &ptesting.PromptTestingStreamingPromptResponse{
					Content:               "test",
					PromptRequestRecordId: ptr.To(db.UUIDToString(&promptRequestRecord.ID)),
					FinishReason:          ptr.To("done"),
				}
				builder := strings.Builder{}
				builder.WriteString("first string")
				builder.WriteString("second string")

				result := api.CreatePayloadFromMessage(
					context.TODO(),
					data,
					msg,
					&builder,
				)

				deserializedData := dto.PromptConfigTestResultDTO{}
				err := json.Unmarshal(result, &deserializedData)
				assert.NoError(t, err)

				assert.Equal(t, msg.Content, *deserializedData.Content)
				assert.Equal(t, *msg.FinishReason, *deserializedData.FinishReason)
				assert.NotNil(t, deserializedData.PromptTestRecordID)

				promptTestRecordID, _ := db.StringToUUID(*deserializedData.PromptTestRecordID)
				promptTestRecord, retrievalErr := db.GetQueries().
					RetrievePromptTestRecord(context.TODO(), *promptTestRecordID)
				assert.NoError(t, retrievalErr)
				assert.Equal(t, promptTestRecord.Response, builder.String())
			},
		)
	})

	t.Run("StreamGRPCMessages", func(t *testing.T) {
		t.Run("should write error payload when receiving an error", func(t *testing.T) {
			m := &mockSocket{}
			data := &dto.PromptConfigTestDTO{
				ModelVendor: models.ModelVendorOPENAI,
				ModelType:   models.ModelTypeGpt4,
				ProviderPromptMessages: ptr.To(
					json.RawMessage(promptConfig.ProviderPromptMessages),
				),
				ModelParameters:   ptr.To(json.RawMessage(promptConfig.ModelParameters)),
				TemplateVariables: templateVariables,
			}
			errChannel := make(chan error)
			responseChannel := make(chan *ptesting.PromptTestingStreamingPromptResponse)
			outgoingErrChannel := make(chan error)

			errMessage := assert.AnError.Error()
			finishReason := "error"

			expectedData := serialization.SerializeJSON(dto.PromptConfigTestResultDTO{
				ErrorMessage: &errMessage,
				FinishReason: &finishReason,
			})

			m.On("WriteMessage", gws.OpcodeText, expectedData).Return(nil)

			go func() {
				streamErr := api.StreamGRPCMessages(
					context.TODO(),
					m,
					data,
					responseChannel,
					errChannel,
				)
				outgoingErrChannel <- streamErr
			}()

			errChannel <- assert.AnError

			select {
			case <-time.After(100 * time.Millisecond):
				assert.Fail(t, "expected error to be written")
			case err := <-outgoingErrChannel:
				assert.Equal(t, err, assert.AnError)
			}

			m.AssertExpectations(t)
		})

		t.Run("should return error on write error", func(t *testing.T) {
			m := &mockSocket{}
			data := &dto.PromptConfigTestDTO{
				ModelVendor: models.ModelVendorOPENAI,
				ModelType:   models.ModelTypeGpt4,
				ProviderPromptMessages: ptr.To(
					json.RawMessage(promptConfig.ProviderPromptMessages),
				),
				ModelParameters:   ptr.To(json.RawMessage(promptConfig.ModelParameters)),
				TemplateVariables: templateVariables,
			}
			errChannel := make(chan error)
			responseChannel := make(chan *ptesting.PromptTestingStreamingPromptResponse)
			outgoingErrChannel := make(chan error)

			m.On("WriteMessage", gws.OpcodeText, mock.Anything).Return(assert.AnError)

			go func() {
				streamErr := api.StreamGRPCMessages(
					context.TODO(),
					m,
					data,
					responseChannel,
					errChannel,
				)
				outgoingErrChannel <- streamErr
			}()

			responseChannel <- &ptesting.PromptTestingStreamingPromptResponse{
				Content: "test",
			}

			select {
			case <-time.After(100 * time.Millisecond):
				assert.Fail(t, "expected error to be written")
			case err := <-outgoingErrChannel:
				assert.Error(t, err)
			}

			m.AssertExpectations(t)
		})

		t.Run("should write payload when receiving a message", func(t *testing.T) {
			m := &mockSocket{}

			errChannel := make(chan error)
			responseChannel := make(chan *ptesting.PromptTestingStreamingPromptResponse)
			outgoingErrChannel := make(chan error)

			data := &dto.PromptConfigTestDTO{
				ModelVendor: models.ModelVendorOPENAI,
				ModelType:   models.ModelTypeGpt4,
				ProviderPromptMessages: ptr.To(
					json.RawMessage(promptConfig.ProviderPromptMessages),
				),
				ModelParameters:   ptr.To(json.RawMessage(promptConfig.ModelParameters)),
				TemplateVariables: templateVariables,
			}
			content := "is it tuesday?"
			msg := &ptesting.PromptTestingStreamingPromptResponse{
				Content:               content,
				FinishReason:          nil,
				PromptRequestRecordId: nil,
			}

			expectedData := serialization.SerializeJSON(dto.PromptConfigTestResultDTO{
				Content:            &content,
				ErrorMessage:       nil,
				FinishReason:       nil,
				PromptConfigID:     nil,
				PromptTestRecordID: nil,
			})

			m.On("WriteMessage", gws.OpcodeText, expectedData).Return(nil)

			go func() {
				streamErr := api.StreamGRPCMessages(
					context.TODO(),
					m,
					data,
					responseChannel,
					errChannel,
				)
				outgoingErrChannel <- streamErr
			}()

			responseChannel <- msg

			time.Sleep(100 * time.Millisecond)

			m.AssertExpectations(t)

			assert.Len(t, outgoingErrChannel, 0)
		})
		t.Run("should return nil when channel is closed", func(t *testing.T) {
			m := &mockSocket{}

			errChannel := make(chan error)
			responseChannel := make(chan *ptesting.PromptTestingStreamingPromptResponse)
			outgoingErrChannel := make(chan error)

			data := &dto.PromptConfigTestDTO{
				ModelVendor: models.ModelVendorOPENAI,
				ModelType:   models.ModelTypeGpt4,
				ProviderPromptMessages: ptr.To(
					json.RawMessage(promptConfig.ProviderPromptMessages),
				),
				ModelParameters:   ptr.To(json.RawMessage(promptConfig.ModelParameters)),
				TemplateVariables: templateVariables,
			}

			go func() {
				streamErr := api.StreamGRPCMessages(
					context.TODO(),
					m,
					data,
					responseChannel,
					errChannel,
				)
				outgoingErrChannel <- streamErr
			}()

			close(responseChannel)

			time.Sleep(100 * time.Millisecond)

			m.AssertExpectations(t)

			assert.Len(t, outgoingErrChannel, 0)
		})
		t.Run("should return error when there is a write error", func(t *testing.T) {
			m := &mockSocket{}

			errChannel := make(chan error)
			responseChannel := make(chan *ptesting.PromptTestingStreamingPromptResponse)
			outgoingErrChannel := make(chan error)

			data := &dto.PromptConfigTestDTO{
				ModelVendor: models.ModelVendorOPENAI,
				ModelType:   models.ModelTypeGpt4,
				ProviderPromptMessages: ptr.To(
					json.RawMessage(promptConfig.ProviderPromptMessages),
				),
				ModelParameters:   ptr.To(json.RawMessage(promptConfig.ModelParameters)),
				TemplateVariables: templateVariables,
			}

			m.On("WriteMessage", gws.OpcodeText, mock.Anything).Return(assert.AnError)

			go func() {
				streamErr := api.StreamGRPCMessages(
					context.TODO(),
					m,
					data,
					responseChannel,
					errChannel,
				)
				outgoingErrChannel <- streamErr
			}()

			responseChannel <- &ptesting.PromptTestingStreamingPromptResponse{
				Content: "test",
			}

			time.Sleep(100 * time.Millisecond)

			m.AssertExpectations(t)

			assert.Error(t, <-outgoingErrChannel)
		})
		t.Run("should return nil if finish reason is not nil", func(t *testing.T) {
			m := &mockSocket{}

			errChannel := make(chan error)
			responseChannel := make(chan *ptesting.PromptTestingStreamingPromptResponse)
			outgoingErrChannel := make(chan error)

			data := &dto.PromptConfigTestDTO{
				ModelVendor: models.ModelVendorOPENAI,
				ModelType:   models.ModelTypeGpt4,
				ProviderPromptMessages: ptr.To(
					json.RawMessage(promptConfig.ProviderPromptMessages),
				),
				ModelParameters:   ptr.To(json.RawMessage(promptConfig.ModelParameters)),
				TemplateVariables: templateVariables,
			}

			m.On("WriteMessage", gws.OpcodeText, mock.Anything).Return(nil)

			isFinished := false

			go func() {
				streamErr := api.StreamGRPCMessages(
					context.TODO(),
					m,
					data,
					responseChannel,
					errChannel,
				)
				isFinished = true
				outgoingErrChannel <- streamErr
			}()

			responseChannel <- &ptesting.PromptTestingStreamingPromptResponse{
				Content:      "test",
				FinishReason: ptr.To("done"),
			}

			time.Sleep(100 * time.Millisecond)

			m.AssertExpectations(t)

			assert.True(t, isFinished)
			assert.Len(t, outgoingErrChannel, 0)
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
					Name: "should return error when model vendor is invalid",
					Data: dto.PromptConfigTestDTO{
						ModelVendor: models.ModelVendor("invalid"),
						ModelType:   models.ModelTypeGpt4,
						ProviderPromptMessages: ptr.To(
							json.RawMessage(promptConfig.ProviderPromptMessages),
						),
						ModelParameters: ptr.To(
							json.RawMessage(promptConfig.ModelParameters),
						),
						TemplateVariables: templateVariables,
					},
				},
				{
					Name: "should return error when model type is invalid",
					Data: dto.PromptConfigTestDTO{
						ModelVendor: models.ModelVendorOPENAI,
						ModelType:   models.ModelType("invalid"),
						ProviderPromptMessages: ptr.To(
							json.RawMessage(promptConfig.ProviderPromptMessages),
						),
						ModelParameters: ptr.To(
							json.RawMessage(promptConfig.ModelParameters),
						),
						TemplateVariables: templateVariables,
					},
				},
				{
					Name: "should return error when provider prompt messages are empty",
					Data: dto.PromptConfigTestDTO{
						ModelVendor:            models.ModelVendorOPENAI,
						ModelType:              models.ModelTypeGpt432k,
						ProviderPromptMessages: ptr.To(json.RawMessage(nil)),
						ModelParameters: ptr.To(
							json.RawMessage(promptConfig.ModelParameters),
						),
						TemplateVariables: templateVariables,
					},
				},
				{
					Name: "should return error when model Parameters are empty",
					Data: dto.PromptConfigTestDTO{
						ModelVendor: models.ModelVendorOPENAI,
						ModelType:   models.ModelTypeGpt432k,
						ProviderPromptMessages: ptr.To(
							json.RawMessage(promptConfig.ProviderPromptMessages),
						),
						ModelParameters:   nil,
						TemplateVariables: templateVariables,
					},
				},
				{
					Name: "should return error when promptConfigID is not a uuid4",
					Data: dto.PromptConfigTestDTO{
						ModelVendor: models.ModelVendorOPENAI,
						ModelType:   models.ModelTypeGpt432k,
						ProviderPromptMessages: ptr.To(
							json.RawMessage(promptConfig.ProviderPromptMessages),
						),
						ModelParameters: ptr.To(
							json.RawMessage(promptConfig.ModelParameters),
						),
						TemplateVariables: templateVariables,
						PromptConfigID:    &invalidID,
					},
				},
			}

			for _, testCase := range testCases {
				t.Run(testCase.Name, func(t *testing.T) {
					serializedData := serialization.SerializeJSON(testCase.Data)
					message := &gws.Message{Data: bytes.NewBuffer(serializedData)}
					_, err := api.ParseMessageData(message, application.ID)
					assert.Error(t, err)
				})
			}
		})

		t.Run("should create a new prompt config when prompt config id is nil", func(t *testing.T) {
			d := dto.PromptConfigTestDTO{
				ModelVendor: models.ModelVendorOPENAI,
				ModelType:   models.ModelTypeGpt432k,
				ProviderPromptMessages: ptr.To(
					json.RawMessage(promptConfig.ProviderPromptMessages),
				),
				ModelParameters:   ptr.To(json.RawMessage(promptConfig.ModelParameters)),
				TemplateVariables: templateVariables,
				PromptConfigID:    nil,
			}
			serializedData := serialization.SerializeJSON(d)
			message := &gws.Message{Data: bytes.NewBuffer(serializedData)}
			result, err := api.ParseMessageData(message, application.ID)
			assert.NoError(t, err)
			assert.NotNil(t, result.PromptConfigID)

			uuid, _ := db.StringToUUID(*result.PromptConfigID)
			pc, retrieveErr := db.GetQueries().RetrievePromptConfig(context.TODO(), *uuid)
			assert.NoError(t, retrieveErr)
			assert.NotEmpty(t, pc.Name)
			assert.Equal(t, pc.ModelVendor, d.ModelVendor)
			assert.Equal(t, pc.ModelType, d.ModelType)
			assert.Equal(t, pc.ModelParameters, []byte(*d.ModelParameters))
			assert.Equal(t, pc.ProviderPromptMessages, []byte(*d.ProviderPromptMessages))
			assert.Equal(t, pc.IsTestConfig, true)
		})
	})

	t.Run("ExtractIDs", func(t *testing.T) {
		t.Run("extracts values from session and parses IDs", func(t *testing.T) {
			session := &mockSessionStorage{}
			session.On("Load", api.ApplicationIDSessionKey).Return(application.ID, true)
			session.On("Load", api.ProjectIDSessionKey).Return(project.ID, true)

			result, err := api.ExtractIDS(session)

			assert.NoError(t, err)
			assert.NotNil(t, result)
		})

		t.Run("returns error if projectID is not set in session", func(t *testing.T) {
			session := &mockSessionStorage{}
			session.On("Load", api.ApplicationIDSessionKey).Return(application.ID, true)
			session.On("Load", api.ProjectIDSessionKey).Return(nil, false)

			result, err := api.ExtractIDS(session)

			assert.Error(t, err)
			assert.Nil(t, result)
		})

		t.Run("returns error if applicationID is not set in session", func(t *testing.T) {
			session := &mockSessionStorage{}
			session.On("Load", api.ApplicationIDSessionKey).Return(nil, false)
			session.On("Load", api.ProjectIDSessionKey).Return(project.ID, true)

			result, err := api.ExtractIDS(session)

			assert.Error(t, err)
			assert.Nil(t, result)
		})

		t.Run("returns error if applicationID is invalid", func(t *testing.T) {
			session := &mockSessionStorage{}
			session.On("Load", api.ApplicationIDSessionKey).Return("invalid", true)
			session.On("Load", api.ProjectIDSessionKey).Return(project.ID, true)

			result, err := api.ExtractIDS(session)

			assert.Error(t, err)
			assert.Nil(t, result)
		})

		t.Run("returns error if projectID is invalid", func(t *testing.T) {
			session := &mockSessionStorage{}
			session.On("Load", api.ApplicationIDSessionKey).Return(application.ID, true)
			session.On("Load", api.ProjectIDSessionKey).Return("invalid", true)

			result, err := api.ExtractIDS(session)

			assert.Error(t, err)
			assert.Nil(t, result)
		})
	})
}
