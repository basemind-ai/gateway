package openai_test

import (
	"context"
	"encoding/json"
	"github.com/basemind-ai/monorepo/e2e/factories"
	openaiconnector "github.com/basemind-ai/monorepo/gen/go/openai/v1"
	"github.com/basemind-ai/monorepo/services/api-gateway/internal/dto"
	"github.com/basemind-ai/monorepo/services/api-gateway/internal/services"
	"github.com/basemind-ai/monorepo/shared/go/datatypes"
	"github.com/basemind-ai/monorepo/shared/go/db"
	"github.com/basemind-ai/monorepo/shared/go/ptr"
	"github.com/stretchr/testify/assert"
	"testing"
)

func TestRequestStream(t *testing.T) {
	_ = factories.CreateProviderPricingModels(context.TODO())
	project, _ := factories.CreateProject(context.TODO())
	application, _ := factories.CreateApplication(context.TODO(), project.ID)
	promptConfig, _ := factories.CreateOpenAIPromptConfig(
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
	t.Run("handles a stream response", func(t *testing.T) {
		client, mockService := CreateClientAndService(t)

		channel := make(chan dto.PromptResultDTO)

		finishReason := "DONE"
		tokens := uint32(10)
		mockService.Stream = []*openaiconnector.OpenAIStreamResponse{
			{Content: "1"},
			{Content: "2"},
			{
				Content: "3",
			},
			{
				Content:             "",
				FinishReason:        &finishReason,
				RequestTokensCount:  &tokens,
				ResponseTokensCount: &tokens,
			},
		}

		go func() {
			client.RequestStream(
				context.TODO(),
				requestConfigurationDTO,
				templateVariables,
				channel,
			)
		}()

		chunks := make([]dto.PromptResultDTO, 0)

		for chunk := range channel {
			chunks = append(chunks, chunk)
		}

		assert.Len(t, chunks, 4)
		assert.Equal(t, "1", *chunks[0].Content)
		assert.Nil(t, chunks[0].RequestRecord)
		assert.Nil(t, chunks[0].Error)
		assert.Equal(t, "2", *chunks[1].Content)
		assert.Nil(t, chunks[1].RequestRecord)
		assert.Nil(t, chunks[1].Error)
		assert.Equal(t, "3", *chunks[2].Content)
		assert.Nil(t, chunks[2].RequestRecord)
		assert.Nil(t, chunks[2].Error)
		assert.Nil(t, chunks[3].Content)
		assert.Nil(t, chunks[3].Error)
		assert.NotNil(t, chunks[3].RequestRecord)
		assert.NotNil(t, chunks[3].RequestRecord.FinishReason)
	})

	t.Run("returns an error if the request fails", func(t *testing.T) {
		client, mockService := CreateClientAndService(t)

		channel := make(chan dto.PromptResultDTO)

		mockService.Error = assert.AnError

		go func() {
			client.RequestStream(
				context.TODO(),
				requestConfigurationDTO,
				templateVariables,
				channel,
			)
		}()

		var result dto.PromptResultDTO

		for value := range channel {
			result = value
		}
		assert.Error(t, result.Error)
		assert.NotNil(t, result.RequestRecord)
	})

	t.Run("returns an error when a template variable is missing", func(t *testing.T) {
		client, mockService := CreateClientAndService(t)

		channel := make(chan dto.PromptResultDTO)

		mockService.Error = assert.AnError

		go func() {
			client.RequestStream(
				context.TODO(),
				requestConfigurationDTO,
				map[string]string{},
				channel,
			)
		}()

		var result dto.PromptResultDTO

		for value := range channel {
			result = value
		}
		assert.Errorf(t, result.Error, "missing template variable {userInput}")
		assert.Nil(t, result.RequestRecord)
	})
}
