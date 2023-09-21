package datatypes

import (
	"encoding/json"
)

// PromptTemplateMessage is a data type used to represent a generic prompt message template.
type PromptTemplateMessage struct {
	// Expected template variables, if any.
	ExpectedTemplateVariables []string `json:"expectedTemplateVariables"`
	// Provider message - a json object representing the provider specific message object.
	ProviderMessage json.RawMessage `json:"providerMessage"`
}

func CreatePromptTemplateMessage(expectedTemplateVariables []string, providerMessage map[string]interface{}) (*PromptTemplateMessage, error) {
	unmarshalledProviderMessage, unmarshalErr := json.Marshal(providerMessage)
	if unmarshalErr != nil {
		return nil, unmarshalErr
	}
	return &PromptTemplateMessage{
		ExpectedTemplateVariables: expectedTemplateVariables,
		ProviderMessage:           unmarshalledProviderMessage,
	}, nil
}
