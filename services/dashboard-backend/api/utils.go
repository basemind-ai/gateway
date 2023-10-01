package api

import (
	"encoding/json"
	"fmt"

	"github.com/basemind-ai/monorepo/shared/go/datatypes"
	"github.com/basemind-ai/monorepo/shared/go/db"
)

var vendorParsers = map[db.ModelVendor]func(json.RawMessage) ([]string, error){
	db.ModelVendorOPENAI: parseOpenAIMessages,
}

func parseOpenAIMessages(promptMessages json.RawMessage) ([]string, error) {
	var openAIPromptMessages []*datatypes.OpenAIPromptMessageDTO
	if jsonErr := json.Unmarshal(promptMessages, &openAIPromptMessages); jsonErr != nil {
		return nil, jsonErr
	}

	expectedVariables := make([]string, 0)
	expectedVariablesMap := make(map[string]struct{})

	for _, openAIPromptMessage := range openAIPromptMessages {
		if openAIPromptMessage.Content != nil {
			for _, match := range curlyBracesRegex.FindAllStringSubmatch(*openAIPromptMessage.Content, -1) {
				if _, exists := expectedVariablesMap[match[1]]; !exists {
					expectedVariablesMap[match[1]] = struct{}{}
					expectedVariables = append(expectedVariables, match[1])
				}
			}
		}
	}

	return expectedVariables, nil
}

func ParsePromptMessages(promptMessages json.RawMessage, vendor db.ModelVendor) ([]string, error) {
	parser, exists := vendorParsers[vendor]
	if !exists {
		return nil, fmt.Errorf("unknown model vendor '%s'", vendor)
	}

	return parser(promptMessages)
}
