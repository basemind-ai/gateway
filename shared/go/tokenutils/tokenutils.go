package tokenutils

import (
	"github.com/basemind-ai/monorepo/shared/go/db"
	"github.com/basemind-ai/monorepo/shared/go/exc"
	"github.com/tiktoken-go/tokenizer"
)

var modelEncodingMap = map[db.ModelType]tokenizer.Encoding{
	db.ModelTypeGpt35Turbo:    tokenizer.Cl100kBase,
	db.ModelTypeGpt35Turbo16k: tokenizer.Cl100kBase,
	db.ModelTypeGpt4:          tokenizer.Cl100kBase,
	db.ModelTypeGpt432k:       tokenizer.Cl100kBase,
}

var modelPriceMap = map[db.ModelType]float64{
	db.ModelTypeGpt35Turbo:    0.000002,
	db.ModelTypeGpt35Turbo16k: 0.000004,
	db.ModelTypeGpt4:          0.000006,
	db.ModelTypeGpt432k:       0.000012,
}

func GetPromptTokenCount(prompt string, modelType db.ModelType) int32 {
	encoding := modelEncodingMap[modelType]
	enc := exc.MustResult(tokenizer.Get(encoding))
	ids, _, _ := enc.Encode(prompt)
	return int32(len(ids))
}

func GetCostByModelType(totalToken int64, modelType db.ModelType) float64 {
	return modelPriceMap[modelType] * float64(totalToken)
}
