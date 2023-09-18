package datatypes

import (
	"encoding/json"
	"fmt"
	"regexp"
	"strings"
)

var curlyBracesRegex = regexp.MustCompile(`\{([^}]+)\}`)

type PromptTemplateMessage struct {
	// The prompt template content
	Content string `json:"content"`
	// Expected template variables, if any
	ExpectedTemplateVariables []string `json:"expectedTemplateVariables"`
	// Provider message
	ProviderMessage json.RawMessage `json:"providerMessage"`
}

func NewPromptTemplateMessage(content string, providerMessage []byte) *PromptTemplateMessage {
	ExpectedTemplateVariables := curlyBracesRegex.FindAllString(content, -1)
	return &PromptTemplateMessage{
		Content:                   content,
		ExpectedTemplateVariables: ExpectedTemplateVariables,
		ProviderMessage:           providerMessage,
	}
}

func (p *PromptTemplateMessage) ParseTemplateVariables(templateVariables map[string]string) error {
	for _, expectedTemplateVariable := range p.ExpectedTemplateVariables {
		value, ok := templateVariables[expectedTemplateVariable]

		if !ok {
			return fmt.Errorf("missing template variable %s", expectedTemplateVariable)
		}

		p.Content = strings.ReplaceAll(p.Content, expectedTemplateVariable, value)
	}

	return nil
}
