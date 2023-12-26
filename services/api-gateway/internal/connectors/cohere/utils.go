package cohere

import (
	"encoding/json"
	"fmt"
	cohereconnector "github.com/basemind-ai/monorepo/gen/go/cohere/v1"
	"github.com/basemind-ai/monorepo/services/api-gateway/internal/dto"
	"github.com/basemind-ai/monorepo/services/api-gateway/internal/utils"
	"github.com/basemind-ai/monorepo/shared/go/datatypes"
	"github.com/basemind-ai/monorepo/shared/go/db"
	"github.com/basemind-ai/monorepo/shared/go/db/models"
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

func CreatePromptRequest(
	requestConfiguration *dto.RequestConfigurationDTO,
	templateVariables map[string]string,
) (*cohereconnector.CoherePromptRequest, error) {
	model, modelErr := GetModelType(requestConfiguration.PromptConfigData.ModelType)
	if modelErr != nil {
		return nil, modelErr
	}

	applicationID := db.UUIDToString(&requestConfiguration.ApplicationID)

	promptRequest := &cohereconnector.CoherePromptRequest{
		Model:          *model,
		Parameters:     &cohereconnector.CohereModelParameters{},
		ConversationId: &applicationID,
	}

	if parametersUnmarshalErr := json.Unmarshal(
		*requestConfiguration.PromptConfigData.ModelParameters,
		promptRequest.Parameters,
	); parametersUnmarshalErr != nil {
		return nil, fmt.Errorf("failed to unmarshal model parameters - %w", parametersUnmarshalErr)
	}

	cohereMessageDTO := datatypes.CoherePromptMessageDTO{}
	if messageUnmarshalErr := json.Unmarshal(*requestConfiguration.PromptConfigData.ProviderPromptMessages, &cohereMessageDTO); messageUnmarshalErr != nil {
		return nil, fmt.Errorf("failed to unmarshal prompt message - %w", messageUnmarshalErr)
	}

	message, parseErr := utils.ParseTemplateVariables(
		cohereMessageDTO.Content,
		*cohereMessageDTO.TemplateVariables,
		templateVariables,
	)
	if parseErr != nil {
		return nil, parseErr
	}
	promptRequest.Message = message

	return promptRequest, nil
}
