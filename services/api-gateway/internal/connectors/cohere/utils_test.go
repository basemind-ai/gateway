package cohere_test

import (
	"context"
	"encoding/json"
	"fmt"
	"github.com/basemind-ai/monorepo/services/api-gateway/internal/connectors/cohere"
	"github.com/basemind-ai/monorepo/services/api-gateway/internal/dto"
	"github.com/basemind-ai/monorepo/shared/go/datatypes"
	"github.com/basemind-ai/monorepo/shared/go/db/models"
	"github.com/basemind-ai/monorepo/shared/go/ptr"
	"github.com/basemind-ai/monorepo/shared/go/serialization"
	"testing"

	"github.com/basemind-ai/monorepo/e2e/factories"
	"github.com/stretchr/testify/assert"

	cohereconnector "github.com/basemind-ai/monorepo/gen/go/cohere/v1"
)

func TestUtils(t *testing.T) {
	_ = factories.CreateProviderPricingModels(context.TODO())

	t.Run("GetModelType", func(t *testing.T) {
		t.Run("returns the expected models", func(t *testing.T) {
			for modelType, expected := range cohere.ModelTypeMap {
				result, err := cohere.GetModelType(modelType)

				assert.NoError(t, err)
				assert.Equal(t, expected, *result)
			}
		})

		t.Run("panics with unknown model type if not in modelTypeMap", func(t *testing.T) {
			modelType, err := cohere.GetModelType("unknown")
			assert.Error(t, err)
			assert.Nil(t, modelType)
		})
	})

	t.Run("CreatePromptRequest", func(t *testing.T) {
		project, _ := factories.CreateProject(context.TODO())
		application, _ := factories.CreateApplication(context.TODO(), project.ID)

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

		promptMessage := "This is what the user asked for: {userInput}"
		expectedTemplateVariables := []string{"userInput"}

		modelType := models.ModelTypeCommand

		userInput := "Please write me a short poem about cheese."
		templateVariables := map[string]string{"userInput": userInput}

		expectedPromptMessage := fmt.Sprintf("This is what the user asked for: %s", userInput)

		requestConfig := &dto.RequestConfigurationDTO{
			ApplicationID: application.ID,
			PromptConfigData: datatypes.PromptConfigDTO{
				ModelType:       modelType,
				ModelVendor:     models.ModelVendorCOHERE,
				ModelParameters: factories.CreateCohereModelParameters(),
				ProviderPromptMessages: ptr.To(
					json.RawMessage(serialization.SerializeJSON(datatypes.CoherePromptMessageDTO{
						Content:           promptMessage,
						TemplateVariables: &expectedTemplateVariables,
					})),
				),
				ExpectedTemplateVariables: expectedTemplateVariables,
			},
		}

		t.Run("creates a prompt request correctly", func(t *testing.T) {
			expectedPromptRequest := &cohereconnector.CoherePromptRequest{
				Model:      cohereconnector.CohereModel_COHERE_MODEL_COMMAND,
				Parameters: expectedModelParameters,
				Message:    expectedPromptMessage,
			}

			promptRequest, err := cohere.CreatePromptRequest(
				requestConfig,
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

			_, err := cohere.CreatePromptRequest(
				&copied,
				templateVariables,
			)
			assert.Error(t, err)

			expectedError := "unknown model type {unknown}"
			assert.Equal(t, expectedError, err.Error())
		})

		t.Run("returns error for unknown message role", func(t *testing.T) {
			modelType := models.ModelTypeCommand
			modelParameters := []byte(`{}`)
			promptMessages := []byte(`[{"role": "unknown"}]`)
			templateVariables := map[string]string{}

			copied := *requestConfig
			copied.PromptConfigData.ModelType = modelType
			copied.PromptConfigData.ModelParameters = ptr.To(json.RawMessage(modelParameters))
			copied.PromptConfigData.ProviderPromptMessages = ptr.To(json.RawMessage(promptMessages))

			_, err := cohere.CreatePromptRequest(
				&copied,
				templateVariables,
			)
			assert.Error(t, err)
		})

		t.Run("returns error if model parameters is invalid json", func(t *testing.T) {
			modelType := models.ModelTypeCommand
			modelParameters := []byte(`invalid_json`)
			promptMessages := []byte(`[]`)
			templateVariables := make(map[string]string)

			copied := *requestConfig
			copied.PromptConfigData.ModelType = modelType
			copied.PromptConfigData.ModelParameters = ptr.To(json.RawMessage(modelParameters))
			copied.PromptConfigData.ProviderPromptMessages = ptr.To(json.RawMessage(promptMessages))

			_, err := cohere.CreatePromptRequest(
				&copied,
				templateVariables,
			)
			assert.Error(t, err)
		})

		t.Run("returns error if prompt messages is invalid json", func(t *testing.T) {
			modelType := models.ModelTypeCommand
			modelParameters := []byte(`{"temperature": 0.8}`)
			promptMessages := []byte(`invalid_json`)
			templateVariables := map[string]string{
				"userInput": "Please write me a short poem about cheese.",
			}

			copied := *requestConfig
			copied.PromptConfigData.ModelType = modelType
			copied.PromptConfigData.ModelParameters = ptr.To(json.RawMessage(modelParameters))
			copied.PromptConfigData.ProviderPromptMessages = ptr.To(json.RawMessage(promptMessages))

			_, err := cohere.CreatePromptRequest(
				&copied,
				templateVariables,
			)
			assert.Error(t, err)
		})
	})
}
