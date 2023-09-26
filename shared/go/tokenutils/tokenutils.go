package tokenutils

import (
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
