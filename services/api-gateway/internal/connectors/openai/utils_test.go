package openai_test

import (
	"fmt"
	"github.com/basemind-ai/monorepo/services/api-gateway/internal/connectors/openai"
	"testing"

	"github.com/basemind-ai/monorepo/e2e/factories"
	"github.com/basemind-ai/monorepo/shared/go/db"
	"github.com/stretchr/testify/assert"

	openaiconnector "github.com/basemind-ai/monorepo/gen/go/openai/v1"
)

func TestUtils(t *testing.T) {
	t.Run("GetModelType", func(t *testing.T) {
		t.Run("returns the expected models", func(t *testing.T) {
			for modelType, expected := range openai.ModelTypeMap {
				result, err := openai.GetModelType(modelType)

				assert.NoError(t, err)
				assert.Equal(t, expected, *result)
			}
		})
		t.Run("panics with unknown model type if not in modelTypeMap", func(t *testing.T) {
			modelType, err := openai.GetModelType("unknown")
			assert.Error(t, err)
			assert.Nil(t, modelType)
		})
	})

	t.Run("GetMessageRole", func(t *testing.T) {
		testCases := []struct {
			Role     string
			Expected openaiconnector.OpenAIMessageRole
		}{{
			Role:     "user",
			Expected: openaiconnector.OpenAIMessageRole_OPEN_AI_MESSAGE_ROLE_USER,
		},
			{
				Role:     "system",
				Expected: openaiconnector.OpenAIMessageRole_OPEN_AI_MESSAGE_ROLE_SYSTEM,
			},
			{
				Role:     "assistant",
				Expected: openaiconnector.OpenAIMessageRole_OPEN_AI_MESSAGE_ROLE_ASSISTANT,
			},
			{
				Role:     "function",
				Expected: openaiconnector.OpenAIMessageRole_OPEN_AI_MESSAGE_ROLE_FUNCTION,
			},
		}
		for _, testCase := range testCases {
			t.Run(
				fmt.Sprintf("returns the expected message role for %s", testCase.Role),
				func(t *testing.T) {
					result, err := openai.GetMessageRole(testCase.Role)
					assert.NoError(t, err)
					assert.Equal(t, testCase.Expected, *result)
				},
			)
		}

		t.Run("returns an error for unknown message role", func(t *testing.T) {
			_, err := openai.GetMessageRole("unknown")
			assert.Error(t, err)
		})
	})

	t.Run("ParseTemplateVariables", func(t *testing.T) {
		t.Run("replaces all expected variables", func(t *testing.T) {
			content := "Hello {name}, your age is {age}. How are you {name}?"
			expectedVariables := []string{"name", "age"}
			templateVariables := map[string]string{"name": "John", "age": "30"}

			result, err := openai.ParseTemplateVariables(
				content,
				expectedVariables,
				templateVariables,
			)
			assert.NoError(t, err)

			expected := "Hello John, your age is 30. How are you John?"
			assert.Equal(t, expected, result)
		})
		t.Run(
			"returns the content string with no errors when there are no expected variables",
			func(t *testing.T) {
				content := "Hello {name}, your age is {age}. How are you {name}?"
				expectedVariables := make([]string, 0)
				templateVariables := map[string]string{"name": "John", "age": "30"}

				result, err := openai.ParseTemplateVariables(
					content,
					expectedVariables,
					templateVariables,
				)
				assert.NoError(t, err)

				assert.Equal(t, content, result)
			},
		)
		t.Run("returns an error when an expected variable is missing", func(t *testing.T) {
			content := "Hello {name}, your age is {age}."
			expectedVariables := []string{"name", "age"}
			templateVariables := map[string]string{"name": "John"}

			_, err := openai.ParseTemplateVariables(content, expectedVariables, templateVariables)
			assert.Error(t, err)

			expectedError := "missing template variable {age}"
			assert.Contains(t, err.Error(), expectedError)
		})
		t.Run("handles empty template variable", func(t *testing.T) {
			content := "Hello {name}, how are you?"
			expectedVariables := []string{"name"}
			templateVariables := map[string]string{"name": ""}

			result, err := openai.ParseTemplateVariables(
				content,
				expectedVariables,
				templateVariables,
			)
			assert.NoError(t, err)

			expected := "Hello , how are you?"
			assert.Equal(t, expected, result)
		})
	})

	t.Run("CreatePromptRequest", func(t *testing.T) {
		t.Run("creates a prompt request correctly", func(t *testing.T) {
			floatValue := float32(1)
			uintValue := uint32(1)

			expectedModelParameters := &openaiconnector.OpenAIModelParameters{
				Temperature:      &floatValue,
				TopP:             &floatValue,
				MaxTokens:        &uintValue,
				PresencePenalty:  &floatValue,
				FrequencyPenalty: &floatValue,
			}

			systemMessage := "You are a helpful chat bot."
			userMessage := "This is what the user asked for: {userInput}"
			expectedTemplateVariables := []string{"userInput"}
			applicationId := "12345"
			modelType := db.ModelTypeGpt35Turbo

			modelParameters, modelParametersErr := factories.CreateModelParameters()
			assert.NoError(t, modelParametersErr)

			promptMessages, promptMessagesErr := factories.CreateOpenAIPromptMessages(
				systemMessage,
				userMessage,
				&expectedTemplateVariables,
			)
			assert.NoError(t, promptMessagesErr)

			userInput := "Please write me a short poem about cheese."
			templateVariables := map[string]string{"userInput": userInput}

			content := fmt.Sprintf("This is what the user asked for: %s", userInput)

			expectedPromptRequest := &openaiconnector.OpenAIPromptRequest{
				Model:         openaiconnector.OpenAIModel_OPEN_AI_MODEL_GPT3_5_TURBO_4K,
				ApplicationId: &applicationId,
				Parameters:    expectedModelParameters,
				Messages: []*openaiconnector.OpenAIMessage{
					{
						Content: &systemMessage,
						Role:    openaiconnector.OpenAIMessageRole_OPEN_AI_MESSAGE_ROLE_SYSTEM,
					},
					{
						Content: &content,
						Role:    openaiconnector.OpenAIMessageRole_OPEN_AI_MESSAGE_ROLE_USER,
					},
				},
			}

			promptRequest, err := openai.CreatePromptRequest(
				applicationId,
				modelType,
				modelParameters,
				promptMessages,
				templateVariables,
			)
			assert.NoError(t, err)

			assert.Equal(t, expectedPromptRequest, promptRequest)
		})
		t.Run("returns error for unknown model type", func(t *testing.T) {
			applicationId := "12345"
			modelType := "unknown"
			modelParameters := []byte(`{}`)
			promptMessages := []byte(`[]`)
			templateVariables := map[string]string{}

			_, err := openai.CreatePromptRequest(
				applicationId,
				db.ModelType(modelType),
				modelParameters,
				promptMessages,
				templateVariables,
			)
			assert.Error(t, err)

			expectedError := "unknown model type {unknown}"
			assert.Equal(t, expectedError, err.Error())
		})
		t.Run("returns error if model parameters is invalid json", func(t *testing.T) {
			applicationId := "12345"
			modelType := db.ModelTypeGpt35Turbo
			modelParameters := []byte(`invalid_json`)
			promptMessages := []byte(`[]`)
			templateVariables := make(map[string]string)

			_, err := openai.CreatePromptRequest(
				applicationId,
				modelType,
				modelParameters,
				promptMessages,
				templateVariables,
			)
			assert.Error(t, err)
		})

		t.Run("returns error if prompt messages is invalid json", func(t *testing.T) {
			applicationId := "12345"
			modelType := db.ModelTypeGpt35Turbo
			modelParameters := []byte(`{"temperature": 0.8}`)
			promptMessages := []byte(`invalid_json`)
			templateVariables := map[string]string{
				"userInput": "Please write me a short poem about cheese.",
			}

			_, err := openai.CreatePromptRequest(
				applicationId,
				modelType,
				modelParameters,
				promptMessages,
				templateVariables,
			)
			assert.Error(t, err)
		})
	})

	t.Run("GetRequestPromptString", func(t *testing.T) {
		t.Run("returns the request prompt as string", func(t *testing.T) {
			floatValue := float32(1)
			uintValue := uint32(1)

			expectedModelParameters := &openaiconnector.OpenAIModelParameters{
				Temperature:      &floatValue,
				TopP:             &floatValue,
				MaxTokens:        &uintValue,
				PresencePenalty:  &floatValue,
				FrequencyPenalty: &floatValue,
			}

			systemMessage := "You are a helpful chat bot."
			applicationId := "12345"
			userInput := "Please write an essay on Dogs."
			content := fmt.Sprintf("This is what the user asked for: %s", userInput)

			promptRequest := &openaiconnector.OpenAIPromptRequest{
				Model:         openaiconnector.OpenAIModel_OPEN_AI_MODEL_GPT3_5_TURBO_4K,
				ApplicationId: &applicationId,
				Parameters:    expectedModelParameters,
				Messages: []*openaiconnector.OpenAIMessage{
					{
						Content: &systemMessage,
						Role:    openaiconnector.OpenAIMessageRole_OPEN_AI_MESSAGE_ROLE_SYSTEM,
					},
					{
						Content: &content,
						Role:    openaiconnector.OpenAIMessageRole_OPEN_AI_MESSAGE_ROLE_USER,
					},
				},
			}
			reqPromptString := openai.GetRequestPromptString(promptRequest.Messages)
			assert.Equal(
				t,
				"You are a helpful chat bot.\nThis is what the user asked for: Please write an essay on Dogs.",
				reqPromptString,
			)
		})
	})
}
