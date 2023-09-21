package testutils

import (
	"encoding/json"
	openaiconnector "github.com/basemind-ai/monorepo/gen/go/openai/v1"
	"github.com/basemind-ai/monorepo/go-shared/datatypes"
	"github.com/stretchr/testify/assert"
	"testing"
)

func CreatePromptMessages(t *testing.T, systemMessage string, userMessage string) []byte {
	s, createPromptMessageErr := datatypes.CreatePromptTemplateMessage(make([]string, 0), map[string]interface{}{
		"content": systemMessage,
		"role":    openaiconnector.OpenAIMessageRole_OPEN_AI_MESSAGE_ROLE_SYSTEM,
	})
	assert.NoError(t, createPromptMessageErr)
	u, createPromptMessageErr := datatypes.CreatePromptTemplateMessage([]string{"userInput"}, map[string]interface{}{
		"content": userMessage,
		"role":    openaiconnector.OpenAIMessageRole_OPEN_AI_MESSAGE_ROLE_USER,
	})
	assert.NoError(t, createPromptMessageErr)

	promptMessages, marshalErr := json.Marshal([]datatypes.PromptTemplateMessage{
		*s, *u,
	})
	assert.NoError(t, marshalErr)

	return promptMessages
}

func CreateModelParameters(t *testing.T) []byte {
	modelParameters, marshalErr := json.Marshal(map[string]float32{
		"temperature":       1,
		"top_p":             1,
		"max_tokens":        1,
		"presence_penalty":  1,
		"frequency_penalty": 1,
	})
	assert.NoError(t, marshalErr)

	return modelParameters
}
