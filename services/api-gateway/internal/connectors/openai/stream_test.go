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

func TestRequestStream(t *testing.T) {
	project, projectCreateErr := factories.CreateProject(context.TODO())
	assert.NoError(t, projectCreateErr)

	application, applicationCreateErr := factories.CreateApplication(context.TODO(), project.ID)
	assert.NoError(t, applicationCreateErr)

	promptConfig, promptConfigCreateErr := factories.CreatePromptConfig(
		context.TODO(),
		application.ID,
	)
	assert.NoError(t, promptConfigCreateErr)

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
	t.Run("handles a stream response", func(t *testing.T) {
		client, mockService := CreateClientAndService(t)

		channel := make(chan dto.PromptResultDTO)

		finishReason := "done"
		mockService.Stream = []*openaiconnector.OpenAIStreamResponse{
			{Content: "1"},
			{Content: "2"},
			{Content: "3", FinishReason: &finishReason},
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
