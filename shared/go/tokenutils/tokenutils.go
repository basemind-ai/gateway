package tokenutils

import (
	"github.com/tiktoken-go/tokenizer"
)

type Encoding = tokenizer.Encoding

const (
	GPT2Enc    Encoding = tokenizer.GPT2Enc
	R50kBase   Encoding = tokenizer.R50kBase
	P50kBase   Encoding = tokenizer.P50kBase
	P50kEdit   Encoding = tokenizer.P50kEdit
	Cl100kBase Encoding = tokenizer.Cl100kBase
)

func GetPromptTokenCount(prompt string, encoding tokenizer.Encoding) (int, error) {
	enc, err := tokenizer.Get(encoding)
	if err != nil {
		return -1, err
	}

	ids, _, _ := enc.Encode(prompt)
	return len(ids), nil
}
