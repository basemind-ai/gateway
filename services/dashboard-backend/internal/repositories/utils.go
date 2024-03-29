package repositories

import (
	"encoding/json"
	"fmt"
	"github.com/basemind-ai/monorepo/shared/go/datatypes"
	"github.com/basemind-ai/monorepo/shared/go/db/models"
	"github.com/basemind-ai/monorepo/shared/go/ptr"
	"github.com/basemind-ai/monorepo/shared/go/serialization"
	"github.com/go-playground/validator/v10"
	"regexp"
)

var (
	curlyBracesRegex = regexp.MustCompile(`\{([^}]+)\}`)
	vendorParsers    = map[models.ModelVendor]func(message *json.RawMessage) ([]string, *json.RawMessage, error){
		models.ModelVendorOPENAI: parseOpenAIMessages,
		models.ModelVendorCOHERE: parseCohereMessage,
	}
	validate = validator.New(validator.WithRequiredStructEnabled())
)

func parseOpenAIMessages( //nolint: revive
	promptMessages *json.RawMessage,
) ([]string, *json.RawMessage, error) {
	var openAIPromptMessages []*datatypes.OpenAIPromptMessageDTO

	if promptMessages == nil {
		return nil, nil, fmt.Errorf("prompt messages are nil")
	}

	if jsonErr := json.Unmarshal(*promptMessages, &openAIPromptMessages); jsonErr != nil {
		return nil, nil, fmt.Errorf("failed to unmarshal prompt messages - %w", jsonErr)
	}

	if len(openAIPromptMessages) == 0 {
		return nil, nil, fmt.Errorf("prompt messages are empty")
	}

	expectedVariables := make([]string, 0)
	expectedVariablesMap := make(map[string]struct{})

	for _, openAIPromptMessage := range openAIPromptMessages {
		if validationErr := validate.Struct(openAIPromptMessage); validationErr != nil {
			return nil, nil, fmt.Errorf("prompt meesage failed validation - %w", validationErr)
		}

		if openAIPromptMessage.Content != nil {
			templateVariables := make([]string, 0)
			for _, match := range curlyBracesRegex.FindAllStringSubmatch(*openAIPromptMessage.Content, -1) {
				if _, exists := expectedVariablesMap[match[1]]; !exists {
					expectedVariablesMap[match[1]] = struct{}{}
					expectedVariables = append(expectedVariables, match[1])
				}
				templateVariables = append(templateVariables, match[1])
			}
			if len(templateVariables) > 0 {
				openAIPromptMessage.TemplateVariables = &templateVariables
			}
		}
	}

	marshalledMessages := ptr.To(json.RawMessage(serialization.SerializeJSON(openAIPromptMessages)))

	return expectedVariables, marshalledMessages, nil
}

func parseCohereMessage( //nolint: revive
	promptMessages *json.RawMessage,
) ([]string, *json.RawMessage, error) {
	var coherePromptMessages []*datatypes.CoherePromptMessageDTO

	if promptMessages == nil {
		return nil, nil, fmt.Errorf("prompt messages are nil")
	}

	if jsonErr := json.Unmarshal(*promptMessages, &coherePromptMessages); jsonErr != nil {
		return nil, nil, fmt.Errorf("failed to unmarshal prompt messages - %w", jsonErr)
	}

	if len(coherePromptMessages) == 0 {
		return nil, nil, fmt.Errorf("prompt messages are empty")
	}

	expectedVariables := make([]string, 0)
	expectedVariablesMap := make(map[string]struct{})

	promptMessage := coherePromptMessages[0]
	if validationErr := validate.Struct(promptMessage); validationErr != nil {
		return nil, nil, fmt.Errorf("prompt meesage failed validation - %w", validationErr)
	}

	templateVariables := make([]string, 0)
	for _, match := range curlyBracesRegex.FindAllStringSubmatch(promptMessage.Message, -1) {
		if _, exists := expectedVariablesMap[match[1]]; !exists {
			expectedVariablesMap[match[1]] = struct{}{}
			expectedVariables = append(expectedVariables, match[1])
		}
		templateVariables = append(templateVariables, match[1])
	}
	if len(templateVariables) > 0 {
		promptMessage.TemplateVariables = &templateVariables
	}

	marshalledMessage := ptr.To(
		json.RawMessage(
			serialization.SerializeJSON([]*datatypes.CoherePromptMessageDTO{promptMessage}),
		),
	)

	return expectedVariables, marshalledMessage, nil
}

func ParsePromptMessages( //nolint: revive
	promptMessages *json.RawMessage,
	vendor models.ModelVendor,
) ([]string, *json.RawMessage, error) {
	parser, exists := vendorParsers[vendor]
	if !exists {
		return nil, nil, fmt.Errorf("unknown model vendor '%s'", vendor)
	}

	return parser(promptMessages)
}
