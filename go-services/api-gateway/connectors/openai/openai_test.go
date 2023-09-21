package openai_test

import (
	"context"
	"encoding/json"
	openaiconnector "github.com/basemind-ai/monorepo/gen/go/openai/v1"
	"github.com/basemind-ai/monorepo/go-services/api-gateway/connectors/openai"
	"github.com/basemind-ai/monorepo/go-shared/datatypes"
	"github.com/basemind-ai/monorepo/go-shared/db"
	"github.com/basemind-ai/monorepo/go-shared/grpcutils/testutils"
	"github.com/stretchr/testify/assert"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
	"net"
	"testing"
)

type MockOpenAIService struct {
	openaiconnector.UnimplementedOpenAIServiceServer
	Context         context.Context
	Error           error
	ExpectedRequest *openaiconnector.OpenAIPromptRequest
	Response        *openaiconnector.OpenAIPromptResponse
	Stream          []*openaiconnector.OpenAIStreamResponse
	T               *testing.T
}

func (m MockOpenAIService) OpenAIPrompt(_ context.Context, request *openaiconnector.OpenAIPromptRequest) (*openaiconnector.OpenAIPromptResponse, error) {
	if m.Error != nil {
		return nil, m.Error
	}

	assert.NotNil(m.T, m.Response)

	if m.ExpectedRequest != nil {
		assert.Equal(m.T, m.ExpectedRequest.Model, request.Model)
		assert.Equal(m.T, m.ExpectedRequest.ApplicationId, request.ApplicationId)

		for i, message := range m.ExpectedRequest.Messages {
			assert.Equal(m.T, message.Role, request.Messages[i].Role)
			assert.Equal(m.T, message.Content, request.Messages[i].Content)
		}

		assert.Equal(m.T, m.ExpectedRequest.Parameters, request.Parameters)
	}

	return m.Response, nil
}

func (m MockOpenAIService) OpenAIStream(request *openaiconnector.OpenAIPromptRequest, stream openaiconnector.OpenAIService_OpenAIStreamServer) error {
	if m.Error != nil {
		return m.Error
	}

	assert.NotNil(m.T, m.Stream)

	if m.ExpectedRequest != nil {
		assert.Equal(m.T, m.ExpectedRequest.Model, request.Model)
		assert.Equal(m.T, m.ExpectedRequest.ApplicationId, request.ApplicationId)

		for i, message := range m.ExpectedRequest.Messages {
			assert.Equal(m.T, message.Role, request.Messages[i].Role)
			assert.Equal(m.T, message.Content, request.Messages[i].Content)
		}

		assert.Equal(m.T, m.ExpectedRequest.Parameters, request.Parameters)
	}

	for _, response := range m.Stream {
		_ = stream.Send(response)
	}

	return nil
}

func CreateClientAndService(t *testing.T) (*openai.Client, *MockOpenAIService) {
	mockService := &MockOpenAIService{T: t}
	listener := testutils.CreateTestServer[openaiconnector.OpenAIServiceServer](t, openaiconnector.RegisterOpenAIServiceServer, mockService)
	client, clientErr := openai.New(
		"",
		grpc.WithTransportCredentials(insecure.NewCredentials()),
		grpc.WithContextDialer(
			func(context.Context, string) (net.Conn, error) {
				return listener.Dial()
			},
		),
	)

	assert.NoError(t, clientErr)
	return client, mockService
}

func CreatePromptMessages(t *testing.T, systemMessage string, userMessage string) []byte {
	s, createPromptMessageErr := datatypes.CreatePromptTemplateMessage(make([]string, 0), map[string]interface{}{
		"content": systemMessage,
		"role":    openaiconnector.OpenAIMessageRole_OPEN_AI_MESSAGE_ROLE_SYSTEM,
	})
	assert.NoError(t, createPromptMessageErr)
	u, createPromptMessageErr := datatypes.CreatePromptTemplateMessage([]string{"userInput"}, map[string]interface{}{
		"content": userMessage,
		"role":    openaiconnector.OpenAIMessageRole_OPEN_AI_MESSAGE_ROLE_USER,
	})
	assert.NoError(t, createPromptMessageErr)

	promptMessages, marshalErr := json.Marshal([]datatypes.PromptTemplateMessage{
		*s, *u,
	})
	assert.NoError(t, marshalErr)

	return promptMessages
}

func CreateModelParameters(t *testing.T) []byte {
	modelParameters, marshalErr := json.Marshal(map[string]float32{
		"temperature":       1,
		"top_p":             1,
		"max_tokens":        1,
		"presence_penalty":  1,
		"frequency_penalty": 1,
	})
	assert.NoError(t, marshalErr)

	return modelParameters
}

func TestOpenAIConnectorClient(t *testing.T) {
	ctx := context.Background()
	applicationId := "123"

	systemMessage := "You are a helpful chat bot."
	userMessage := "This is what the user asked for: {userInput}"

	promptMessages := CreatePromptMessages(t, systemMessage, userMessage)
	modelParameters := CreateModelParameters(t)

	application := db.Application{
		ModelType:       db.ModelTypeGpt35Turbo,
		ModelParameters: modelParameters,
		PromptMessages:  promptMessages,
	}
	templateVariables := map[string]string{"userInput": "abc"}

	expectedParsedContent := "This is what the user asked for: abc"

	floatValue := float32(1)
	uintValue := uint32(1)
	expectedModelParameters := &openaiconnector.OpenAIModelParameters{
		Temperature:      &floatValue,
		TopP:             &floatValue,
		MaxTokens:        &uintValue,
		PresencePenalty:  &floatValue,
		FrequencyPenalty: &floatValue,
	}

	t.Run("RequestPrompt", func(t *testing.T) {
		t.Run("returns a prompt response", func(t *testing.T) {
			client, mockService := CreateClientAndService(t)

			mockService.Response = &openaiconnector.OpenAIPromptResponse{
				Content:          "Response content",
				CompletionTokens: 2,
				TotalTokens:      2,
				PromptTokens:     2,
			}

			mockService.ExpectedRequest = &openaiconnector.OpenAIPromptRequest{
				Model:         openaiconnector.OpenAIModel_OPEN_AI_MODEL_GPT3_5_TURBO_4K,
				ApplicationId: &applicationId,
				Parameters:    expectedModelParameters,
				Messages: []*openaiconnector.OpenAIMessage{
					{
						Content: &systemMessage,
						Role:    openaiconnector.OpenAIMessageRole_OPEN_AI_MESSAGE_ROLE_SYSTEM,
					},
					{
						Content: &expectedParsedContent,
						Role:    openaiconnector.OpenAIMessageRole_OPEN_AI_MESSAGE_ROLE_USER,
					},
				},
			}

			response, err := client.RequestPrompt(ctx, applicationId, application, templateVariables)
			assert.NoError(t, err)
			assert.Equal(t, "Response content", response)
		})

		t.Run("returns an error if the request fails", func(t *testing.T) {
			client, mockService := CreateClientAndService(t)

			mockService.Error = assert.AnError

			_, err := client.RequestPrompt(ctx, applicationId, application, templateVariables)
			assert.Error(t, err)
		})

		t.Run("returns an error if a prompt variable is missing", func(t *testing.T) {
			client, _ := CreateClientAndService(t)

			_, err := client.RequestPrompt(ctx, applicationId, application, map[string]string{})
			assert.Errorf(t, err, "missing template variable {userInput}")
		})
	})

	t.Run("RequestStream", func(t *testing.T) {
		t.Run("handles a stream response", func(t *testing.T) {
			client, mockService := CreateClientAndService(t)

			contentChannel := make(chan string)
			errChannel := make(chan error)

			finishReason := "done"
			mockService.Stream = []*openaiconnector.OpenAIStreamResponse{
				{Content: "1"},
				{Content: "2"},
				{Content: "3", FinishReason: &finishReason},
			}

			go func() {
				client.RequestStream(ctx, applicationId, application, templateVariables, contentChannel, errChannel)
			}()

			chunks := make([]string, 0)

			for {
				select {
				case chunk, isOpen := <-contentChannel:
					if isOpen {
						chunks = append(chunks, chunk)
					} else {
						contentChannel = nil
						errChannel = nil
					}

				case err := <-errChannel:
					assert.Fail(t, "Received unexpected error:", err)
					contentChannel = nil
					errChannel = nil
				}

				if contentChannel == nil && errChannel == nil {
					break
				}
			}

			assert.Equal(t, []string{"1", "2", "3"}, chunks)
		})

		t.Run("returns an error if the request fails", func(t *testing.T) {
			client, mockService := CreateClientAndService(t)

			contentChannel := make(chan string)
			errChannel := make(chan error)

			mockService.Error = assert.AnError

			go func() {
				client.RequestStream(ctx, applicationId, application, templateVariables, contentChannel, errChannel)
			}()

			for {
				select {
				case <-contentChannel:
					assert.Fail(t, "Did not received the expected error")
					contentChannel = nil
					errChannel = nil

				case err := <-errChannel:
					assert.Error(t, err)
					contentChannel = nil
					errChannel = nil
				}

				if contentChannel == nil && errChannel == nil {
					break
				}
			}
		})
		t.Run("returns an error when a template variable is missing", func(t *testing.T) {
			client, mockService := CreateClientAndService(t)

			contentChannel := make(chan string)
			errChannel := make(chan error)

			mockService.Error = assert.AnError

			go func() {
				client.RequestStream(ctx, applicationId, application, map[string]string{}, contentChannel, errChannel)
			}()

			for {
				select {
				case <-contentChannel:
					assert.Fail(t, "Did not received the expected error")
					contentChannel = nil
					errChannel = nil

				case err := <-errChannel:
					assert.Errorf(t, err, "missing template variable {userInput}")
					contentChannel = nil
					errChannel = nil
				}

				if contentChannel == nil && errChannel == nil {
					break
				}
			}
		})
	})
}
