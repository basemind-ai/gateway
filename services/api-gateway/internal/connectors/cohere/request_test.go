package cohere_test

import (
	"context"
	"encoding/json"
	"github.com/basemind-ai/monorepo/e2e/factories"
	cohereconnector "github.com/basemind-ai/monorepo/gen/go/cohere/v1"
	"github.com/basemind-ai/monorepo/services/api-gateway/internal/dto"
	"github.com/basemind-ai/monorepo/services/api-gateway/internal/services"
	"github.com/basemind-ai/monorepo/shared/go/datatypes"
	"github.com/basemind-ai/monorepo/shared/go/db"
	"github.com/basemind-ai/monorepo/shared/go/ptr"
	"github.com/stretchr/testify/assert"
	"testing"
)

func TestRequestPrompt(t *testing.T) {
	_ = factories.CreateProviderPricingModels(context.TODO())

	project, _ := factories.CreateProject(context.TODO())
	application, _ := factories.CreateApplication(context.TODO(), project.ID)

	promptConfig, _ := factories.CreateCoherePromptConfig(
		context.TODO(),
		application.ID,
	)

	modelPricing := services.RetrieveProviderModelPricing(
		context.TODO(),
		promptConfig.ModelType,
		promptConfig.ModelVendor,
	)

	requestConfigurationDTO := &dto.RequestConfigurationDTO{
		ApplicationID:  application.ID,
		PromptConfigID: promptConfig.ID,
		PromptConfigData: datatypes.PromptConfigDTO{
			ID:                        db.UUIDToString(&promptConfig.ID),
			Name:                      promptConfig.Name,
			ModelType:                 promptConfig.ModelType,
			ModelVendor:               promptConfig.ModelVendor,
			ModelParameters:           ptr.To(json.RawMessage(promptConfig.ModelParameters)),
			ProviderPromptMessages:    ptr.To(json.RawMessage(promptConfig.ProviderPromptMessages)),
			ExpectedTemplateVariables: promptConfig.ExpectedTemplateVariables,
			IsDefault:                 promptConfig.IsDefault,
			CreatedAt:                 promptConfig.CreatedAt.Time,
			UpdatedAt:                 promptConfig.UpdatedAt.Time,
		},
		ProviderModelPricing: modelPricing,
	}

	templateVariables := map[string]string{"userInput": "abc"}
	expectedParsedContent := "This is what the user asked for: abc"

	floatValue := float32(0)
	uintValue := uint32(0)

	expectedModelParameters := &cohereconnector.CohereModelParameters{
		Temperature:      &floatValue,
		K:                &uintValue,
		P:                &floatValue,
		FrequencyPenalty: &floatValue,
		PresencePenalty:  &floatValue,
		MaxTokens:        &uintValue,
	}

	t.Run("returns a prompt response", func(t *testing.T) {
		client, mockService := CreateClientAndService(t)

		content := "Response content"

		mockService.Response = &cohereconnector.CoherePromptResponse{
			Content:             content,
			FinishReason:        "DONE",
			RequestTokensCount:  10,
			ResponseTokensCount: 10,
		}

		mockService.ExpectedRequest = &cohereconnector.CoherePromptRequest{
			Model:      cohereconnector.CohereModel_COHERE_MODEL_COMMAND,
			Parameters: expectedModelParameters,
			Message:    expectedParsedContent,
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
