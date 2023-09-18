package openai

import (
	"encoding/json"
	openaiconnector "github.com/basemind-ai/monorepo/gen/go/openai/v1"
	"github.com/basemind-ai/monorepo/go-shared/datatypes"
	"github.com/basemind-ai/monorepo/go-shared/db"
)

var modelTypeMap = map[db.ModelType]openaiconnector.OpenAIModel{
	db.ModelTypeGpt35Turbo:    openaiconnector.OpenAIModel_OPEN_AI_MODEL_GPT3_5_TURBO_4K,
	db.ModelTypeGpt35Turbo16k: openaiconnector.OpenAIModel_OPEN_AI_MODEL_GPT3_5_TURBO_16K,
	db.ModelTypeGpt4:          openaiconnector.OpenAIModel_OPEN_AI_MODEL_GPT4_8K,
	db.ModelTypeGpt432k:       openaiconnector.OpenAIModel_OPEN_AI_MODEL_GPT4_32K,
}

func GetModelType(modelType db.ModelType) openaiconnector.OpenAIModel {
	value, ok := modelTypeMap[modelType]
	if !ok {
		panic("unknown model type")
	}
	return value
}

func CreatePromptRequest(
	applicationId string,
	modelType db.ModelType,
	modelParameters []byte,
	promptMessages []byte,
	templateVariables map[string]string,
) (*openaiconnector.OpenAIPromptRequest, error) {
	promptRequest := &openaiconnector.OpenAIPromptRequest{
		Model:         GetModelType(modelType),
		ApplicationId: &applicationId,
	}

	if parametersUnmarshalErr := json.Unmarshal(modelParameters, promptRequest.Parameters); parametersUnmarshalErr != nil {
		return nil, parametersUnmarshalErr
	}

	messages := make([]datatypes.PromptTemplateMessage, 0)

	if messagesUnmarshalErr := json.Unmarshal(promptMessages, &messages); messagesUnmarshalErr != nil {
		return nil, messagesUnmarshalErr
	}
	for _, message := range messages {
		if err := message.ParseTemplateVariables(templateVariables); err != nil {
			return nil, err
		}

		openaiMessage := &openaiconnector.OpenAIMessage{}
		if unmarshalErr := json.Unmarshal(message.ProviderMessage, openaiMessage); unmarshalErr != nil {
			return nil, unmarshalErr
		}
		if message.Content != "" {
			openaiMessage.Content = &message.Content
		}
		promptRequest.Messages = append(promptRequest.Messages, openaiMessage)
	}

	return promptRequest, nil
}