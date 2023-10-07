package openai_test

import (
	"context"
	"github.com/basemind-ai/monorepo/e2e/factories"
	openaiconnector "github.com/basemind-ai/monorepo/gen/go/openai/v1"
	"github.com/basemind-ai/monorepo/services/api-gateway/internal/dto"
	"github.com/basemind-ai/monorepo/shared/go/datatypes"
	"github.com/basemind-ai/monorepo/shared/go/db"
	"github.com/stretchr/testify/assert"
	"testing"
)

func TestRequestPrompt(t *testing.T) {
	project, _ := factories.CreateProject(context.TODO())
	application, _ := factories.CreateApplication(context.TODO(), project.ID)

	promptConfig, _ := factories.CreatePromptConfig(
		context.TODO(),
		application.ID,
	)

	requestConfigurationDTO := &dto.RequestConfigurationDTO{
		ApplicationIDString: db.UUIDToString(&application.ID),
		ApplicationID:       application.ID,
		ProjectID:           project.ID,
		PromptConfigID:      promptConfig.ID,
		PromptConfigData: datatypes.PromptConfigDTO{
			ID:                        db.UUIDToString(&promptConfig.ID),
			Name:                      promptConfig.Name,
			ModelType:                 promptConfig.ModelType,
			ModelVendor:               promptConfig.ModelVendor,
			ModelParameters:           promptConfig.ModelParameters,
			ProviderPromptMessages:    promptConfig.ProviderPromptMessages,
			ExpectedTemplateVariables: promptConfig.ExpectedTemplateVariables,
			IsDefault:                 promptConfig.IsDefault,
			CreatedAt:                 promptConfig.CreatedAt.Time,
			UpdatedAt:                 promptConfig.UpdatedAt.Time,
		},
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
			ApplicationId: &requestConfigurationDTO.ApplicationIDString,
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
			context.TODO(),
			requestConfigurationDTO,
			templateVariables,
		)
		assert.NoError(t, result.Error)
		assert.Equal(t, "Response content", *result.Content)
		assert.NotNil(t, result.RequestRecord)
	})

	t.Run("returns an error if the request fails", func(t *testing.T) {
		client, mockService := CreateClientAndService(t)

		mockService.Error = assert.AnError

		result := client.RequestPrompt(
			context.TODO(),
			requestConfigurationDTO,
			templateVariables,
		)
		assert.Error(t, result.Error)
	})

	t.Run("returns an error if a prompt variable is missing", func(t *testing.T) {
		client, _ := CreateClientAndService(t)

		result := client.RequestPrompt(
			context.TODO(),
			requestConfigurationDTO,
			map[string]string{},
		)
		assert.Errorf(t, result.Error, "missing template variable {userInput}")
	})
}
