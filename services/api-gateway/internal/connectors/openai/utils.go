package openai

import (
	"encoding/json"
	"fmt"
	"github.com/basemind-ai/monorepo/shared/go/datatypes"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	"strings"

	"github.com/basemind-ai/monorepo/shared/go/db"

	openaiconnector "github.com/basemind-ai/monorepo/gen/go/openai/v1"
)

var ModelTypeMap = map[db.ModelType]openaiconnector.OpenAIModel{
	db.ModelTypeGpt35Turbo:    openaiconnector.OpenAIModel_OPEN_AI_MODEL_GPT3_5_TURBO_4K,
	db.ModelTypeGpt35Turbo16k: openaiconnector.OpenAIModel_OPEN_AI_MODEL_GPT3_5_TURBO_16K,
	db.ModelTypeGpt4:          openaiconnector.OpenAIModel_OPEN_AI_MODEL_GPT4_8K,
	db.ModelTypeGpt432k:       openaiconnector.OpenAIModel_OPEN_AI_MODEL_GPT4_32K,
}

func GetModelType(modelType db.ModelType) (*openaiconnector.OpenAIModel, error) {
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

func ParseTemplateVariables(
	content string,
	expectedVariables []string,
	templateVariables map[string]string,
) (string, error) {
	for _, expectedVariable := range expectedVariables {
		value, ok := templateVariables[expectedVariable]

		if !ok {
			return "", status.Errorf(
				codes.InvalidArgument,
				"missing template variable {%s}",
				expectedVariable,
			)
		}

		content = strings.ReplaceAll(content, fmt.Sprintf("{%s}", expectedVariable), value)
	}

	return content, nil
}

func CreatePromptRequest(
	applicationId string,
	modelType db.ModelType,
	modelParameters []byte,
	promptMessages []byte,
	templateVariables map[string]string,
) (*openaiconnector.OpenAIPromptRequest, error) {
	model, modelErr := GetModelType(modelType)
	if modelErr != nil {
		return nil, modelErr
	}

	promptRequest := &openaiconnector.OpenAIPromptRequest{
		Model:         *model,
		ApplicationId: &applicationId,
		Parameters:    &openaiconnector.OpenAIModelParameters{},
		Messages:      []*openaiconnector.OpenAIMessage{},
	}

	if parametersUnmarshalErr := json.Unmarshal(modelParameters, promptRequest.Parameters); parametersUnmarshalErr != nil {
		return nil, fmt.Errorf("failed to unmarshal model parameters - %w", parametersUnmarshalErr)
	}

	var openAIPromptMessageDTOs []*datatypes.OpenAIPromptMessageDTO
	if messagesUnmarshalErr := json.Unmarshal(promptMessages, &openAIPromptMessageDTOs); messagesUnmarshalErr != nil {
		return nil, fmt.Errorf("failed to unmarshal prompt messages - %w", messagesUnmarshalErr)
	}

	for _, dto := range openAIPromptMessageDTOs {
		messageRole, roleErr := GetMessageRole(dto.Role)
		if roleErr != nil {
			return nil, roleErr
		}
		openAIMessage := &openaiconnector.OpenAIMessage{
			Role: *messageRole,
			Name: dto.Name,
		}
		if dto.Content != nil {
			if dto.TemplateVariables != nil {
				parsedContent, parseErr := ParseTemplateVariables(
					*dto.Content,
					*dto.TemplateVariables,
					templateVariables,
				)
				if parseErr != nil {
					return nil, parseErr
				}
				openAIMessage.Content = &parsedContent
			} else {
				openAIMessage.Content = dto.Content
			}
		}

		if dto.FunctionArguments != nil {
			openAIMessage.FunctionCall = &openaiconnector.OpenAIFunctionCall{
				Name:      *dto.Name,
				Arguments: strings.Join(*dto.FunctionArguments, ","),
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
