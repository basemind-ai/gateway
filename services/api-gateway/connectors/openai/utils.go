package openai

import (
	"encoding/json"
	"fmt"
	"strings"

	"github.com/basemind-ai/monorepo/shared/go/datatypes"
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

func ParseTemplateVariables(content string, expectedVariables []string, templateVariables map[string]string) (string, error) {
	for _, expectedVariable := range expectedVariables {
		value, ok := templateVariables[expectedVariable]

		if !ok {
			return "", fmt.Errorf("missing template variable {%s}", expectedVariable)
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
		Messages:      make([]*openaiconnector.OpenAIMessage, 0),
	}

	if parametersUnmarshalErr := json.Unmarshal(modelParameters, promptRequest.Parameters); parametersUnmarshalErr != nil {
		return nil, parametersUnmarshalErr
	}

	messages := make([]datatypes.PromptTemplateMessage, 0)

	if messagesUnmarshalErr := json.Unmarshal(promptMessages, &messages); messagesUnmarshalErr != nil {
		return nil, messagesUnmarshalErr
	}
	for _, message := range messages {
		openaiMessage := &openaiconnector.OpenAIMessage{}
		if unmarshalErr := json.Unmarshal(message.ProviderMessage, openaiMessage); unmarshalErr != nil {
			return nil, unmarshalErr
		}

		if openaiMessage.Content != nil {
			parsedContent, parseErr := ParseTemplateVariables(*openaiMessage.Content, message.ExpectedTemplateVariables, templateVariables)
			if parseErr != nil {
				return nil, parseErr
			}
			openaiMessage.Content = &parsedContent
		}

		promptRequest.Messages = append(promptRequest.Messages, openaiMessage)
	}

	return promptRequest, nil
}

func GetRequestPromptString(messages []*openaiconnector.OpenAIMessage) string {
	var promptMessages string
	for _, message := range messages {
		promptMessages += *message.Content
		promptMessages += "\n"
	}
	return strings.TrimRight(promptMessages, "\n")
}
