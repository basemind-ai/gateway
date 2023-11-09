package datatypes

import (
	"github.com/basemind-ai/monorepo/shared/go/db/models"
	"github.com/shopspring/decimal"
	"time"
)

// OpenAIPromptMessageDTO - DTO for serializing and storing an OpenAI prompt message.
// Note- this struct represents what we store in the DB as part of a JSON array.
type OpenAIPromptMessageDTO struct { // skipcq: TCV-001
	Role              string    `json:"role"                        validate:"oneof=system user function assistant"`
	Content           *string   `json:"content,omitempty"           validate:"omitempty,required"`
	Name              *string   `json:"name,omitempty"`
	FunctionArguments *[]string `json:"functionArguments,omitempty"`
	TemplateVariables *[]string `json:"templateVariables,omitempty"`
}

// PromptConfigDTO - DTO for serializing a prompt config.
type PromptConfigDTO struct { // skipcq: TCV-001
	ID                        string             `json:"id"`
	Name                      string             `json:"name"                      validate:"required"`
	ModelParameters           []byte             `json:"modelParameters"           validate:"required"`
	ModelType                 models.ModelType   `json:"modelType"                 validate:"oneof=gpt-3.5-turbo gpt-3.5-turbo-16k gpt-4 gpt-4-32k"`
	ModelVendor               models.ModelVendor `json:"modelVendor"               validate:"oneof=OPEN_AI"`
	ProviderPromptMessages    []byte             `json:"providerPromptMessages"    validate:"required"`
	ExpectedTemplateVariables []string           `json:"expectedTemplateVariables"`
	IsDefault                 bool               `json:"isDefault,omitempty"`
	CreatedAt                 time.Time          `json:"createdAt,omitempty"`
	UpdatedAt                 time.Time          `json:"updatedAt,omitempty"`
}

// ProviderModelPricingDTO is a data type used to encapsulate the pricing information for a model / type.
type ProviderModelPricingDTO struct { // skipcq: TCV-001
	ID               string          `json:"id"`
	InputTokenPrice  decimal.Decimal `json:"inputTokenPrice"`
	OutputTokenPrice decimal.Decimal `json:"outputTokenPrice"`
	TokenUnitSize    int32           `json:"tokenUnitSize"`
	ActiveFromDate   time.Time       `json:"activeFromDate"`
}
