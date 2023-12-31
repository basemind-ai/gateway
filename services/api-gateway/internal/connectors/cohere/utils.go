package cohere

import (
	"encoding/json"
	"fmt"
	cohereconnector "github.com/basemind-ai/monorepo/gen/go/cohere/v1"
	"github.com/basemind-ai/monorepo/services/api-gateway/internal/dto"
	"github.com/basemind-ai/monorepo/services/api-gateway/internal/utils"
	"github.com/basemind-ai/monorepo/shared/go/datatypes"
	"github.com/basemind-ai/monorepo/shared/go/db/models"
	"github.com/basemind-ai/monorepo/shared/go/ptr"
)

var ModelTypeMap = map[models.ModelType]cohereconnector.CohereModel{
	models.ModelTypeCommand:             cohereconnector.CohereModel_COHERE_MODEL_COMMAND,
	models.ModelTypeCommandLight:        cohereconnector.CohereModel_COHERE_MODEL_COMMAND_LIGHT,
	models.ModelTypeCommandNightly:      cohereconnector.CohereModel_COHERE_MODEL_COMMAND_NIGHTLY,
	models.ModelTypeCommandLightNightly: cohereconnector.CohereModel_COHERE_MODEL_COMMAND_LIGHT_NIGHTLY,
}

func GetModelType(modelType models.ModelType) (*cohereconnector.CohereModel, error) {
	value, ok := ModelTypeMap[modelType]
	if !ok {
		return nil, fmt.Errorf("unknown model type {%s}", modelType)
	}

	return &value, nil
}

func parseParameters(
	rawParameters *json.RawMessage,
	connectorParameters *cohereconnector.CohereModelParameters,
) error {
	if rawParameters == nil {
		return nil
	}

	modelParameters := &datatypes.CohereModelParametersDTO{}
	if parametersUnmarshalErr := json.Unmarshal(*rawParameters, modelParameters); parametersUnmarshalErr != nil {
		return fmt.Errorf("failed to unmarshal model parameters - %w", parametersUnmarshalErr)
	}

	if modelParameters.MaxTokens != nil {
		connectorParameters.MaxTokens = ptr.To(uint32(*modelParameters.MaxTokens))
	}

	if modelParameters.Temperature != nil {
		connectorParameters.Temperature = modelParameters.Temperature
	}

	if modelParameters.K != nil {
		connectorParameters.K = modelParameters.K
	}

	if modelParameters.P != nil {
		connectorParameters.P = modelParameters.P
	}

	if modelParameters.FrequencyPenalty != nil {
		connectorParameters.FrequencyPenalty = modelParameters.FrequencyPenalty
	}

	if modelParameters.PresencePenalty != nil {
		connectorParameters.PresencePenalty = modelParameters.PresencePenalty
	}

	return nil
}

func CreatePromptRequest(
	requestConfiguration *dto.RequestConfigurationDTO,
	templateVariables map[string]string,
) (*cohereconnector.CoherePromptRequest, error) {
	model, modelErr := GetModelType(requestConfiguration.PromptConfigData.ModelType)
	if modelErr != nil {
		return nil, modelErr
	}

	modelParameters := &cohereconnector.CohereModelParameters{}
	if parametersParseErr := parseParameters(requestConfiguration.PromptConfigData.ModelParameters, modelParameters); parametersParseErr != nil {
		return nil, fmt.Errorf("failed to unmarshal model parameters - %w", parametersParseErr)
	}

	promptRequest := &cohereconnector.CoherePromptRequest{
		Model:      *model,
		Parameters: modelParameters,
	}

	if parametersUnmarshalErr := json.Unmarshal(
		*requestConfiguration.PromptConfigData.ModelParameters,
		promptRequest.Parameters,
	); parametersUnmarshalErr != nil {
		return nil, fmt.Errorf("failed to unmarshal model parameters - %w", parametersUnmarshalErr)
	}

	var messages []*datatypes.CoherePromptMessageDTO
	if messageUnmarshalErr := json.Unmarshal(*requestConfiguration.PromptConfigData.ProviderPromptMessages, &messages); messageUnmarshalErr != nil {
		return nil, fmt.Errorf("failed to unmarshal prompt message - %w", messageUnmarshalErr)
	}

	if len(messages) == 0 {
		return nil, fmt.Errorf("no prompt messages provided")
	}

	cohereMessageDTO := messages[0]

	message, parseErr := utils.ParseTemplateVariables(
		cohereMessageDTO.Message,
		ptr.Deref(cohereMessageDTO.TemplateVariables, []string{}),
		templateVariables,
	)
	if parseErr != nil {
		return nil, parseErr
	}
	promptRequest.Message = message

	return promptRequest, nil
}
