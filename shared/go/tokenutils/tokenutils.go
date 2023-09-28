package tokenutils

import (
	"strings"

	openaiconnector "github.com/basemind-ai/monorepo/gen/go/openai/v1"
	"github.com/tiktoken-go/tokenizer"
)

func GetPromptTokenCount(prompt string, encoding tokenizer.Encoding) (int, error) {
	enc, err := tokenizer.Get(encoding)
	if err != nil {
		return -1, err
	}

	ids, _, _ := enc.Encode(prompt)
	return len(ids), nil
}

func GetRequestPromptTokenCount(messages []*openaiconnector.OpenAIMessage, encoding tokenizer.Encoding) (int, error) {
	var promptMessages string
	for _, message := range messages {
		promptMessages += *message.Content
		promptMessages += "\n"
	}
	promptMessages = strings.TrimRight(promptMessages, "\n")

	promptReqTokenCount, tokenizationErr := GetPromptTokenCount(promptMessages, encoding)
	if tokenizationErr != nil {
		return -1, tokenizationErr
	}

	return promptReqTokenCount, nil
}
