package openai

import (
	"encoding/json"
	"fmt"
	"github.com/basemind-ai/monorepo/services/api-gateway/internal/dto"
	"github.com/basemind-ai/monorepo/services/api-gateway/internal/utils"
	"github.com/basemind-ai/monorepo/shared/go/datatypes"
	"github.com/basemind-ai/monorepo/shared/go/db/models"
	"github.com/basemind-ai/monorepo/shared/go/ptr"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	"strings"

	"github.com/basemind-ai/monorepo/shared/go/db"

	openaiconnector "github.com/basemind-ai/monorepo/gen/go/openai/v1"
)

var ModelTypeMap = map[models.ModelType]openaiconnector.OpenAIModel{
	models.ModelTypeGpt35Turbo:    openaiconnector.OpenAIModel_OPEN_AI_MODEL_GPT3_5_TURBO_4K,
	models.ModelTypeGpt35Turbo16k: openaiconnector.OpenAIModel_OPEN_AI_MODEL_GPT3_5_TURBO_16K,
	models.ModelTypeGpt4:          openaiconnector.OpenAIModel_OPEN_AI_MODEL_GPT4_8K,
	models.ModelTypeGpt432k:       openaiconnector.OpenAIModel_OPEN_AI_MODEL_GPT4_32K,
}

func GetModelType(modelType models.ModelType) (*openaiconnector.OpenAIModel, error) {
	value, ok := ModelTypeMap[modelType]
	if !ok {
		return nil, fmt.Errorf("unknown model type {%s}", modelType)
	}

	return &value, nil
}

func GetMessageRole(role string) (*openaiconnector.OpenAIMessageRole, error) {
	switch role {
	case "system":
		return openaiconnector.OpenAIMessageRole_OPEN_AI_MESSAGE_ROLE_SYSTEM.Enum(), nil
	case "user":
		return openaiconnector.OpenAIMessageRole_OPEN_AI_MESSAGE_ROLE_USER.Enum(), nil
	case "assistant":
		return openaiconnector.OpenAIMessageRole_OPEN_AI_MESSAGE_ROLE_ASSISTANT.Enum(), nil
	case "function":
		return openaiconnector.OpenAIMessageRole_OPEN_AI_MESSAGE_ROLE_FUNCTION.Enum(), nil
	default:
		return nil, status.Errorf(codes.InvalidArgument, "unknown message role {%s}", role)
	}
}

func parseParameters(
	rawParameters *json.RawMessage,
	connectorParameters *openaiconnector.OpenAIModelParameters,
) error {
	if rawParameters == nil {
		return nil
	}

	modelParameters := &datatypes.OpenAIModelParametersDTO{}
	if parametersUnmarshalErr := json.Unmarshal(*rawParameters, modelParameters); parametersUnmarshalErr != nil {
		return fmt.Errorf("failed to unmarshal model parameters - %w", parametersUnmarshalErr)
	}

	if modelParameters.MaxTokens != nil {
		connectorParameters.MaxTokens = ptr.To(uint32(*modelParameters.MaxTokens))
	}

	if modelParameters.Temperature != nil {
		connectorParameters.Temperature = modelParameters.Temperature
	}

	if modelParameters.TopP != nil {
		connectorParameters.TopP = modelParameters.TopP
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
) (*openaiconnector.OpenAIPromptRequest, error) {
	model, modelErr := GetModelType(requestConfiguration.PromptConfigData.ModelType)
	if modelErr != nil {
		return nil, modelErr
	}

	applicationIDString := db.UUIDToString(&requestConfiguration.ApplicationID)

	modelParameters := &openaiconnector.OpenAIModelParameters{}
	if parametersParseErr := parseParameters(requestConfiguration.PromptConfigData.ModelParameters, modelParameters); parametersParseErr != nil {
		return nil, fmt.Errorf("failed to unmarshal model parameters - %w", parametersParseErr)
	}

	promptRequest := &openaiconnector.OpenAIPromptRequest{
		Model:         *model,
		ApplicationId: &applicationIDString,
		Parameters:    modelParameters,
		Messages:      []*openaiconnector.OpenAIMessage{},
	}

	var openAIPromptMessageDTOs []*datatypes.OpenAIPromptMessageDTO
	if messagesUnmarshalErr := json.Unmarshal(*requestConfiguration.PromptConfigData.ProviderPromptMessages, &openAIPromptMessageDTOs); messagesUnmarshalErr != nil {
		return nil, fmt.Errorf("failed to unmarshal prompt messages - %w", messagesUnmarshalErr)
	}

	for _, dtoInstance := range openAIPromptMessageDTOs {
		messageRole, roleErr := GetMessageRole(dtoInstance.Role)
		if roleErr != nil {
			return nil, roleErr
		}
		openAIMessage := &openaiconnector.OpenAIMessage{
			Role: *messageRole,
			Name: dtoInstance.Name,
		}
		if dtoInstance.Content != nil {
			if dtoInstance.TemplateVariables != nil {
				parsedContent, parseErr := utils.ParseTemplateVariables(
					*dtoInstance.Content,
					*dtoInstance.TemplateVariables,
					templateVariables,
				)
				if parseErr != nil {
					return nil, parseErr
				}
				openAIMessage.Content = &parsedContent
			} else {
				openAIMessage.Content = dtoInstance.Content
			}
		}

		if dtoInstance.FunctionArguments != nil {
			openAIMessage.FunctionCall = &openaiconnector.OpenAIFunctionCall{
				Name:      *dtoInstance.Name,
				Arguments: strings.Join(*dtoInstance.FunctionArguments, ","),
			}
		}

		promptRequest.Messages = append(promptRequest.Messages, openAIMessage)
	}

	return promptRequest, nil
}

func GetRequestPromptString(messages []*openaiconnector.OpenAIMessage) string {
	var promptMessages string
	for _, message := range messages {
		if message.Content != nil {
			promptMessages += *message.Content
			promptMessages += "\n"
		}
	}

	return strings.TrimRight(promptMessages, "\n")
}
