package datatypes

import (
	"encoding/json"
	"github.com/basemind-ai/monorepo/shared/go/db"
	"github.com/rs/zerolog/log"
	"time"
)

type DTO struct{}

func (d *DTO) Render() []byte {
	result, err := json.Marshal(d)
	if err != nil {
		log.Error().Err(err).Msg("failed to marshal dto")
	}
	return result
}

type OpenAIPromptMessageDTO struct {
	DTO
	Role              string    `json:"role"                        validate:"oneof=system user function assistant"`
	Content           *string   `json:"content,omitempty"           validate:"omitempty,required"`
	Name              *string   `json:"name,omitempty"`
	FunctionArguments *[]string `json:"functionArguments,omitempty"`
	TemplateVariables *[]string `json:"templateVariables,omitempty"`
}

type PromptConfigDTO struct {
	DTO
	ID                        string          `json:"id"`
	Name                      string          `json:"name"                      validate:"required"`
	ModelParameters           json.RawMessage `json:"modelParameters"           validate:"required"`
	ModelType                 db.ModelType    `json:"modelType"                 validate:"oneof=gpt-3.5-turbo gpt-3.5-turbo-16k gpt-4 gpt-4-32k"`
	ModelVendor               db.ModelVendor  `json:"modelVendor"               validate:"oneof=OPEN_AI"`
	ProviderPromptMessages    json.RawMessage `json:"providerPromptMessages"    validate:"required"`
	ExpectedTemplateVariables []string        `json:"expectedTemplateVariables"`
	IsDefault                 bool            `json:"isDefault,omitempty"`
	CreatedAt                 time.Time       `json:"createdAt,omitempty"`
	UpdatedAt                 time.Time       `json:"updatedAt,omitempty"`
}
