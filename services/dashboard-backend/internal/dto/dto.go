package dto

import (
	"encoding/json"
	"github.com/basemind-ai/monorepo/shared/go/db"
	"time"
)

type ApplicationDTO struct {
	ID          string    `json:"id"`
	Name        string    `json:"name"`
	Description string    `json:"description"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`
}

type ProjectDTO struct {
	ID                   string           `json:"id"`
	Name                 string           `json:"name"`
	Description          string           `json:"description"`
	CreatedAt            time.Time        `json:"createdAt"`
	IsUserDefaultProject bool             `json:"isUserDefaultProject"`
	Permission           string           `json:"permission"`
	Applications         []ApplicationDTO `json:"applications"`
}

type UserAccountDTO struct {
	ID         string       `json:"id"`
	FirebaseID string       `json:"firebaseId"`
	Projects   []ProjectDTO `json:"projects"`
}

type PromptConfigCreateDTO struct {
	Name                   string          `json:"name"            validate:"required"`
	ModelParameters        json.RawMessage `json:"modelParameters" validate:"required"`
	ModelType              db.ModelType    `json:"modelType"       validate:"oneof=gpt-3.5-turbo gpt-3.5-turbo-16k gpt-4 gpt-4-32k"`
	ModelVendor            db.ModelVendor  `json:"modelVendor"     validate:"oneof=OPEN_AI"`
	ProviderPromptMessages json.RawMessage `json:"promptMessages"  validate:"required"`
}

type PromptConfigUpdateDTO struct {
	Name                   *string          `json:"name,omitempty"            validate:"omitempty,required"`
	ModelParameters        *json.RawMessage `json:"modelParameters,omitempty" validate:"omitempty,required"`
	ModelType              *db.ModelType    `json:"modelType,omitempty"       validate:"omitempty,oneof=gpt-3.5-turbo gpt-3.5-turbo-16k gpt-4 gpt-4-32k"`
	ModelVendor            *db.ModelVendor  `json:"modelVendor,omitempty"     validate:"omitempty,oneof=OPEN_AI"`
	ProviderPromptMessages *json.RawMessage `json:"promptMessages,omitempty"  validate:"omitempty,required"`
}

type ApplicationTokenDTO struct {
	ID        string    `json:"id"`
	CreatedAt time.Time `json:"createdAt"`
	Name      string    `json:"name"`
	Hash      *string   `json:"hash,omitempty"`
}
