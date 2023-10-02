package openai_test

import (
	"context"
	"github.com/basemind-ai/monorepo/e2e/factories"
	openaiconnector "github.com/basemind-ai/monorepo/gen/go/openai/v1"
	"github.com/basemind-ai/monorepo/services/api-gateway/connectors/openai"
	openaitestutils "github.com/basemind-ai/monorepo/services/api-gateway/connectors/openai/testutils"
	dbTestUtils "github.com/basemind-ai/monorepo/shared/go/db/testutils"
	"github.com/basemind-ai/monorepo/shared/go/grpcutils/testutils"
	"github.com/stretchr/testify/assert"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
	"net"
	"testing"
)

func CreateClientAndService(t *testing.T) (*openai.Client, *openaitestutils.MockOpenAIService) {
	mockService := &openaitestutils.MockOpenAIService{T: t}
	listener := testutils.CreateTestServer[openaiconnector.OpenAIServiceServer](
		t,
		openaiconnector.RegisterOpenAIServiceServer,
		mockService,
	)
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

func TestOpenAIConnectorClient(t *testing.T) {
	dbTestUtils.CreateTestDB(t)

	ctx := context.Background()

	promptConfig, applicationId, promptConfigCreateErr := factories.CreateApplicationPromptConfig(
		context.TODO(),
	)
	assert.NoError(t, promptConfigCreateErr)

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

			systemMessage := "You are a helpful chat bot."

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

			response, err := client.RequestPrompt(
				ctx,
				applicationId,
				promptConfig,
				templateVariables,
			)
			assert.NoError(t, err)
			assert.Equal(t, "Response content", response)
		})

		t.Run("returns an error if the request fails", func(t *testing.T) {
			client, mockService := CreateClientAndService(t)

			mockService.Error = assert.AnError

			_, err := client.RequestPrompt(ctx, applicationId, promptConfig, templateVariables)
			assert.Error(t, err)
		})

		t.Run("returns an error if a prompt variable is missing", func(t *testing.T) {
			client, _ := CreateClientAndService(t)

			_, err := client.RequestPrompt(ctx, applicationId, promptConfig, map[string]string{})
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
				client.RequestStream(
					ctx,
					applicationId,
					promptConfig,
					templateVariables,
					contentChannel,
					errChannel,
				)
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
				client.RequestStream(
					ctx,
					applicationId,
					promptConfig,
					templateVariables,
					contentChannel,
					errChannel,
				)
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
				client.RequestStream(
					ctx,
					applicationId,
					promptConfig,
					map[string]string{},
					contentChannel,
					errChannel,
				)
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
