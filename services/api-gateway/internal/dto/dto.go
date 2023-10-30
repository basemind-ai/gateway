package dto

import (
	"github.com/basemind-ai/monorepo/shared/go/datatypes"
	"github.com/basemind-ai/monorepo/shared/go/db"
	"github.com/jackc/pgx/v5/pgtype"
)

type PromptResultDTO struct {
	Content       *string
	RequestRecord *db.PromptRequestRecord
	Error         error
}

// RequestConfigurationDTO is a data type used encapsulate the current application prompt configuration.
type RequestConfigurationDTO struct {
	// ApplicationID is the application DB ID
	ApplicationID pgtype.UUID `json:"applicationUUID"`
	// PromptConfigID is the promptConfig DB ID
	PromptConfigID pgtype.UUID `json:"promptConfigId,omitempty"`
	// PromptConfigData the prompt config DB record
	PromptConfigData datatypes.PromptConfigDTO `json:"promptConfigDTO"`
	// ProviderModelPricing is the pricing information for the model vendor
	ProviderModelPricing datatypes.ProviderModelPricingDTO `json:"providerModelPricing"`
}
