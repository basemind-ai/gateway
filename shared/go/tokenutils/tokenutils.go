package tokenutils

import (
	"github.com/basemind-ai/monorepo/shared/go/db/models"
	"github.com/basemind-ai/monorepo/shared/go/exc"
	"github.com/tiktoken-go/tokenizer"
)

var modelEncodingMap = map[models.ModelType]tokenizer.Encoding{
	models.ModelTypeGpt35Turbo:    tokenizer.Cl100kBase,
	models.ModelTypeGpt35Turbo16k: tokenizer.Cl100kBase,
	models.ModelTypeGpt4:          tokenizer.Cl100kBase,
	models.ModelTypeGpt432k:       tokenizer.Cl100kBase,
}

var modelPriceMap = map[models.ModelType]float64{
	models.ModelTypeGpt35Turbo:    0.000002,
	models.ModelTypeGpt35Turbo16k: 0.000004,
	models.ModelTypeGpt4:          0.000006,
	models.ModelTypeGpt432k:       0.000012,
}

// GetPromptTokenCount returns the number of tokens in a prompt.
func GetPromptTokenCount(prompt string, modelType models.ModelType) int32 {
	encoding := modelEncodingMap[modelType]
	enc := exc.MustResult(tokenizer.Get(encoding))
	ids, _, _ := enc.Encode(prompt)
	return int32(len(ids))
}

// GetCostByModelType returns the cost of a prompt based on the model type.
func GetCostByModelType(totalToken int64, modelType models.ModelType) float64 {
	return modelPriceMap[modelType] * float64(totalToken)
}
