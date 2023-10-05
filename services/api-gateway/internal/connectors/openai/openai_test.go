package openai_test

import (
	"context"
	"github.com/basemind-ai/monorepo/e2e/factories"
	openaiconnector "github.com/basemind-ai/monorepo/gen/go/openai/v1"
	"github.com/basemind-ai/monorepo/services/api-gateway/internal/connectors/openai"
	openaitestutils "github.com/basemind-ai/monorepo/services/api-gateway/internal/connectors/openai/testutils"
	"github.com/basemind-ai/monorepo/shared/go/datatypes"
	dbTestUtils "github.com/basemind-ai/monorepo/shared/go/db/testutils"
	"github.com/basemind-ai/monorepo/shared/go/grpcutils/testutils"
	"github.com/stretchr/testify/assert"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
	"net"
	"testing"
)

func CreateClientAndService(t *testing.T) (*openai.Client, *openaitestutils.MockOpenAIService) {
	t.Helper()
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

			result := client.RequestPrompt(
				ctx,
				applicationId,
				promptConfig,
				templateVariables,
			)
			assert.NoError(t, result.Error)
			assert.Equal(t, "Response content", *result.Content)
			assert.NotNil(t, result.RequestRecord)
		})

		t.Run("returns an error if the request fails", func(t *testing.T) {
			client, mockService := CreateClientAndService(t)

			mockService.Error = assert.AnError

			result := client.RequestPrompt(ctx, applicationId, promptConfig, templateVariables)
			assert.Error(t, result.Error)
		})

		t.Run("returns an error if a prompt variable is missing", func(t *testing.T) {
			client, _ := CreateClientAndService(t)

			result := client.RequestPrompt(ctx, applicationId, promptConfig, map[string]string{})
			assert.Errorf(t, result.Error, "missing template variable {userInput}")
		})
	})

	t.Run("RequestStream", func(t *testing.T) {
		t.Run("handles a stream response", func(t *testing.T) {
			client, mockService := CreateClientAndService(t)

			channel := make(chan datatypes.PromptResult)

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
					channel,
				)
			}()

			chunks := make([]datatypes.PromptResult, 0)

			for chunk := range channel {
				chunks = append(chunks, chunk)
			}

			assert.Len(t, chunks, 4)
			assert.Equal(t, "1", *chunks[0].Content)  //nolint: gosec
			assert.Nil(t, chunks[0].RequestRecord)    //nolint: gosec
			assert.Nil(t, chunks[0].Error)            //nolint: gosec
			assert.Equal(t, "2", *chunks[1].Content)  //nolint: gosec
			assert.Nil(t, chunks[1].RequestRecord)    //nolint: gosec
			assert.Nil(t, chunks[1].Error)            //nolint: gosec
			assert.Equal(t, "3", *chunks[2].Content)  //nolint: gosec
			assert.Nil(t, chunks[2].RequestRecord)    //nolint: gosec
			assert.Nil(t, chunks[2].Error)            //nolint: gosec
			assert.Nil(t, chunks[3].Content)          //nolint: gosec
			assert.Nil(t, chunks[3].Error)            //nolint: gosec
			assert.NotNil(t, chunks[3].RequestRecord) //nolint: gosec
		})

		t.Run("returns an error if the request fails", func(t *testing.T) {
			client, mockService := CreateClientAndService(t)

			channel := make(chan datatypes.PromptResult)

			mockService.Error = assert.AnError

			go func() {
				client.RequestStream(
					ctx,
					applicationId,
					promptConfig,
					templateVariables,
					channel,
				)
			}()

			var result datatypes.PromptResult

			for value := range channel {
				result = value
			}
			assert.Error(t, result.Error)
			assert.NotNil(t, result.RequestRecord)
		})

		t.Run("returns an error when a template variable is missing", func(t *testing.T) {
			client, mockService := CreateClientAndService(t)

			channel := make(chan datatypes.PromptResult)

			mockService.Error = assert.AnError

			go func() {
				client.RequestStream(
					ctx,
					applicationId,
					promptConfig,
					map[string]string{},
					channel,
				)
			}()

			var result datatypes.PromptResult

			for value := range channel {
				result = value
			}
			assert.Errorf(t, result.Error, "missing template variable {userInput}")
			assert.Nil(t, result.RequestRecord)
		})
	})
}
