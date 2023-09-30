package tokenutils

import (
	"github.com/basemind-ai/monorepo/shared/go/db"
	"github.com/tiktoken-go/tokenizer"
)

var modelEncodingMap map[db.ModelType]tokenizer.Encoding = map[db.ModelType]tokenizer.Encoding{
	db.ModelTypeGpt35Turbo:    tokenizer.Cl100kBase,
	db.ModelTypeGpt35Turbo16k: tokenizer.Cl100kBase,
	db.ModelTypeGpt4:          tokenizer.Cl100kBase,
	db.ModelTypeGpt432k:       tokenizer.Cl100kBase,
}

func GetPromptTokenCount(prompt string, modelType db.ModelType) (int, error) {
	encoding := modelEncodingMap[modelType]
	enc, err := tokenizer.Get(encoding)
	if err != nil {
		return -1, err
	}

	ids, _, _ := enc.Encode(prompt)
	return len(ids), nil
}
