package openai_test

import (
	"context"
	"encoding/json"
	"fmt"
	"github.com/basemind-ai/monorepo/services/api-gateway/internal/connectors/openai"
	"github.com/basemind-ai/monorepo/services/api-gateway/internal/dto"
	"github.com/basemind-ai/monorepo/services/api-gateway/internal/services"
	"github.com/basemind-ai/monorepo/shared/go/datatypes"
	"github.com/basemind-ai/monorepo/shared/go/db/models"
	"github.com/basemind-ai/monorepo/shared/go/ptr"
	"github.com/basemind-ai/monorepo/shared/go/serialization"
	"github.com/shopspring/decimal"
	"testing"

	"github.com/basemind-ai/monorepo/e2e/factories"
	"github.com/basemind-ai/monorepo/shared/go/db"
	"github.com/stretchr/testify/assert"

	openaiconnector "github.com/basemind-ai/monorepo/gen/go/openai/v1"
)

func TestUtils(t *testing.T) {
	_ = factories.CreateProviderPricingModels(context.TODO())

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

	t.Run("CreatePromptRequest", func(t *testing.T) {
		project, _ := factories.CreateProject(context.TODO())
		application, _ := factories.CreateApplication(context.TODO(), project.ID)

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
		applicationID := db.UUIDToString(&application.ID)
		modelType := models.ModelTypeGpt35Turbo

		modelParameters := factories.CreateModelParameters()
		promptMessages := factories.CreateOpenAIPromptMessages(
			systemMessage,
			userMessage,
			&expectedTemplateVariables,
		)

		userInput := "Please write me a short poem about cheese."
		templateVariables := map[string]string{"userInput": userInput}
		content := fmt.Sprintf("This is what the user asked for: %s", userInput)

		requestConfig := &dto.RequestConfigurationDTO{
			ApplicationID: application.ID,
			PromptConfigData: datatypes.PromptConfigDTO{
				ModelType:                 modelType,
				ModelParameters:           modelParameters,
				ProviderPromptMessages:    promptMessages,
				ExpectedTemplateVariables: expectedTemplateVariables,
			},
		}

		t.Run("creates a prompt request correctly", func(t *testing.T) {
			expectedPromptRequest := &openaiconnector.OpenAIPromptRequest{
				Model:         openaiconnector.OpenAIModel_OPEN_AI_MODEL_GPT3_5_TURBO_4K,
				ApplicationId: &applicationID,
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
				requestConfig,
				templateVariables,
			)
			assert.NoError(t, err)

			assert.Equal(t, expectedPromptRequest, promptRequest)
		})

		t.Run("handles function message correctly", func(t *testing.T) {
			functionName := "sum"
			promptMessages := serialization.SerializeJSON([]*datatypes.OpenAIPromptMessageDTO{{
				Role:              "function",
				Name:              &functionName,
				FunctionArguments: &[]string{"value1", "value2"},
			}})

			functionCall := openaiconnector.OpenAIFunctionCall{
				Arguments: "value1,value2",
				Name:      functionName,
			}

			expectedPromptRequest := &openaiconnector.OpenAIPromptRequest{
				Model:         openaiconnector.OpenAIModel_OPEN_AI_MODEL_GPT3_5_TURBO_4K,
				ApplicationId: &applicationID,
				Parameters:    expectedModelParameters,
				Messages: []*openaiconnector.OpenAIMessage{
					{
						Role:         openaiconnector.OpenAIMessageRole_OPEN_AI_MESSAGE_ROLE_FUNCTION,
						Name:         &functionName,
						FunctionCall: &functionCall,
					},
				},
			}

			copied := *requestConfig
			copied.PromptConfigData.ProviderPromptMessages = ptr.To(json.RawMessage(promptMessages))

			promptRequest, err := openai.CreatePromptRequest(
				&copied,
				templateVariables,
			)
			assert.NoError(t, err)

			assert.Equal(t, expectedPromptRequest, promptRequest)
		})

		t.Run("returns error for unknown model type", func(t *testing.T) {
			modelType := "unknown"
			modelParameters := []byte(`{}`)
			promptMessages := []byte(`[]`)
			templateVariables := map[string]string{}

			copied := *requestConfig
			copied.PromptConfigData.ModelType = models.ModelType(modelType)
			copied.PromptConfigData.ModelParameters = ptr.To(json.RawMessage(modelParameters))
			copied.PromptConfigData.ProviderPromptMessages = ptr.To(json.RawMessage(promptMessages))

			_, err := openai.CreatePromptRequest(
				&copied,
				templateVariables,
			)
			assert.Error(t, err)

			expectedError := "unknown model type {unknown}"
			assert.Equal(t, expectedError, err.Error())
		})

		t.Run("returns error for unknown message role", func(t *testing.T) {
			modelType := models.ModelTypeGpt35Turbo
			modelParameters := []byte(`{}`)
			promptMessages := []byte(`[{"role": "unknown"}]`)
			templateVariables := map[string]string{}

			copied := *requestConfig
			copied.PromptConfigData.ModelType = modelType
			copied.PromptConfigData.ModelParameters = ptr.To(json.RawMessage(modelParameters))
			copied.PromptConfigData.ProviderPromptMessages = ptr.To(json.RawMessage(promptMessages))

			_, err := openai.CreatePromptRequest(
				&copied,
				templateVariables,
			)
			assert.Error(t, err)
		})

		t.Run("returns error if model parameters is invalid json", func(t *testing.T) {
			modelType := models.ModelTypeGpt35Turbo
			modelParameters := []byte(`invalid_json`)
			promptMessages := []byte(`[]`)
			templateVariables := make(map[string]string)

			copied := *requestConfig
			copied.PromptConfigData.ModelType = modelType
			copied.PromptConfigData.ModelParameters = ptr.To(json.RawMessage(modelParameters))
			copied.PromptConfigData.ProviderPromptMessages = ptr.To(json.RawMessage(promptMessages))

			_, err := openai.CreatePromptRequest(
				&copied,
				templateVariables,
			)
			assert.Error(t, err)
		})

		t.Run("returns error if prompt messages is invalid json", func(t *testing.T) {
			modelType := models.ModelTypeGpt35Turbo
			modelParameters := []byte(`{"temperature": 0.8}`)
			promptMessages := []byte(`invalid_json`)
			templateVariables := map[string]string{
				"userInput": "Please write me a short poem about cheese.",
			}

			copied := *requestConfig
			copied.PromptConfigData.ModelType = modelType
			copied.PromptConfigData.ModelParameters = ptr.To(json.RawMessage(modelParameters))
			copied.PromptConfigData.ProviderPromptMessages = ptr.To(json.RawMessage(promptMessages))

			_, err := openai.CreatePromptRequest(
				&copied,
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
			applicationID := "12345"
			userInput := "Please write an essay on Dogs."
			content := fmt.Sprintf("This is what the user asked for: %s", userInput)

			promptRequest := &openaiconnector.OpenAIPromptRequest{
				Model:         openaiconnector.OpenAIModel_OPEN_AI_MODEL_GPT3_5_TURBO_4K,
				ApplicationId: &applicationID,
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
	t.Run("GetStringTokenCount", func(t *testing.T) {
		testCases := []struct {
			input    string
			expected int32
		}{
			{
				input:    "Hello world!",
				expected: 3,
			},
			{
				input:    "",
				expected: 0,
			},
			{
				input:    "Goodbye world!",
				expected: 4,
			},
		}

		for _, testCase := range testCases {
			t.Run(fmt.Sprintf("Test: '%d' token count", testCase.expected), func(t *testing.T) {
				count := openai.GetStringTokenCount(testCase.input, models.ModelTypeGpt35Turbo)
				assert.Equal(t, testCase.expected, count)
			})
		}
	})

	t.Run("CalculateTokenCountsAndCosts", func(t *testing.T) {
		promptInputValue := "you are a helpful chatbot."
		promptOutputValue := "trees are green, sky is blue, i am a machine, and so are you."
		expectedInputTokenCount := int32(7)
		expectedOutputTokenCount := int32(18)
		testCases := []struct {
			modelType               models.ModelType
			expectedInputTokenCost  decimal.Decimal
			expectedOutputTokenCost decimal.Decimal
		}{
			{
				modelType:               models.ModelTypeGpt35Turbo,
				expectedInputTokenCost:  decimal.RequireFromString("0.0000105"),
				expectedOutputTokenCost: decimal.RequireFromString("0.000036"),
			},
			{
				modelType:               models.ModelTypeGpt35Turbo16k,
				expectedInputTokenCost:  decimal.RequireFromString("0.000021"),
				expectedOutputTokenCost: decimal.RequireFromString("0.000072"),
			},
			{
				modelType:               models.ModelTypeGpt4,
				expectedInputTokenCost:  decimal.RequireFromString("0.00021"),
				expectedOutputTokenCost: decimal.RequireFromString("0.000108"),
			},
			{
				modelType:               models.ModelTypeGpt432k,
				expectedInputTokenCost:  decimal.RequireFromString("0.00042"),
				expectedOutputTokenCost: decimal.RequireFromString("0.000216"),
			},
		}

		for _, testCase := range testCases {
			t.Run(fmt.Sprintf("Test: '%s'", testCase.modelType), func(t *testing.T) {
				modelPricingDTO := services.RetrieveProviderModelPricing(
					context.TODO(),
					testCase.modelType,
					models.ModelVendorOPENAI,
				)

				result := openai.CalculateTokenCountsAndCosts(
					promptInputValue,
					promptOutputValue,
					modelPricingDTO,
					testCase.modelType,
				)

				assert.Equal(t, expectedInputTokenCount, result.InputTokenCount)
				assert.Equal(t, expectedOutputTokenCount, result.OutputTokenCount)
				assert.Equal(
					t,
					testCase.expectedInputTokenCost.String(),
					result.InputTokenCost.String(),
				)
				assert.Equal(
					t,
					testCase.expectedOutputTokenCost.String(),
					result.OutputTokenCost.String(),
				)
			})
		}
	})
}
