package dto

import (
	"github.com/basemind-ai/monorepo/shared/go/datatypes"
	"github.com/basemind-ai/monorepo/shared/go/db"
	"github.com/jackc/pgx/v5/pgtype"
)

type PromptResultDTO struct {
	datatypes.DTO
	Content       *string
	RequestRecord *db.PromptRequestRecord
	Error         error
}

// RequestConfigurationDTO is a data type used encapsulate the current application prompt configuration.
type RequestConfigurationDTO struct {
	datatypes.DTO
	// The application ApplicationIDString as a string
	ApplicationIDString string `json:"applicationId"`
	// ApplicationID is the application DB ID
	ApplicationID pgtype.UUID `json:"applicationUUID"`
	// ProjectID is the project DB ID
	ProjectID pgtype.UUID `json:"projectId"`
	// PromptConfigID is the promptConfig DB ID
	PromptConfigID pgtype.UUID `json:"promptConfigId"`
	// PromptConfigData the prompt config DB record
	PromptConfigData datatypes.PromptConfigDTO `json:"promptConfigDTO"`
}
