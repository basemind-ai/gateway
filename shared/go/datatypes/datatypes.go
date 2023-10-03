package datatypes

import (
	"encoding/json"
	"github.com/basemind-ai/monorepo/shared/go/db"
)

// PromptTemplateMessage is a data type used to represent a generic prompt message template.
type PromptTemplateMessage struct {
	// Expected template variables, if any.
	ExpectedTemplateVariables []string `json:"expectedTemplateVariables"`
	// Provider message - a json object representing the provider specific message object.
	ProviderMessage json.RawMessage `json:"providerMessage"`
}

func CreatePromptTemplateMessage(
	expectedTemplateVariables []string,
	providerMessage map[string]interface{},
) (*PromptTemplateMessage, error) {
	unmarshalledProviderMessage, unmarshalErr := json.Marshal(providerMessage)
	if unmarshalErr != nil {
		return nil, unmarshalErr
	}

	return &PromptTemplateMessage{
		ExpectedTemplateVariables: expectedTemplateVariables,
		ProviderMessage:           unmarshalledProviderMessage,
	}, nil
}

// RequestConfiguration is a data type used encapsulate the current application prompt configuration.
type RequestConfiguration struct {
	// The application ID as a string
	ApplicationID string `json:"applicationId"`
	// The application DB record
	ApplicationData db.Application `json:"applicationObject"`
	// The prompt config DB record
	PromptConfigData db.PromptConfig `json:"promptConfigObject"`
}

type OpenAIPromptMessageDTO struct {
	Role              string    `json:"role"                        validate:"oneof=system user function assistant"`
	Content           *string   `json:"content,omitempty"`
	Name              *string   `json:"name,omitempty"`
	FunctionArguments *[]string `json:"functionArguments,omitempty"`
}

type PromptResult struct {
	Content       *string
	RequestRecord *db.PromptRequestRecord
	Error         error
}
