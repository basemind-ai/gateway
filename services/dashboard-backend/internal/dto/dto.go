package dto

import (
	"encoding/json"
	"time"

	"github.com/basemind-ai/monorepo/shared/go/db"
)

type ApplicationDTO struct {
	ID          string    `json:"id"`
	Name        string    `json:"name"`
	Description string    `json:"description"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`
}

type ProjectDTO struct {
	ID           string           `json:"id,omitempty"`
	Name         string           `json:"name"                   validate:"required"`
	Description  string           `json:"description,omitempty"`
	CreatedAt    time.Time        `json:"createdAt,omitempty"`
	UpdatedAt    time.Time        `json:"updatedAt,omitempty"`
	Permission   string           `json:"permission,omitempty"`
	Applications []ApplicationDTO `json:"applications,omitempty"`
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
	Name      string    `json:"name"           validate:"required"`
	Hash      *string   `json:"hash,omitempty"`
}

type AddUserAccountToProjectDTO struct {
	UserID     string                  `json:"userId,omitempty" validate:"omitempty,required"`
	Email      string                  `json:"email,omitempty"  validate:"omitempty,required"`
	Permission db.AccessPermissionType `json:"permission"       validate:"required,oneof=ADMIN MEMBER"`
}

type UpdateUserAccountProjectPermissionDTO struct {
	UserID     string                  `json:"userId"     validate:"required"`
	Permission db.AccessPermissionType `json:"permission" validate:"required,oneof=ADMIN MEMBER"`
}

type ProjectUserAccountDTO struct {
	ID          string    `json:"id"`
	DisplayName string    `json:"displayName"`
	Email       string    `json:"email"`
	FirebaseID  string    `json:"firebaseId"`
	PhoneNumber string    `json:"phoneNumber"`
	PhotoURL    string    `json:"photoUrl"`
	CreatedAt   time.Time `json:"createdAt"`
	Permission  string    `json:"permission"`
}

type ApplicationAnalyticsDTO struct {
	TotalRequests int64   `json:"totalRequests"`
	ProjectedCost float64 `json:"projectedCost"`
}

type ProjectAnalyticsDTO struct {
	TotalAPICalls int64   `json:"totalAPICalls"`
	ModelsCost    float64 `json:"modelsCost"`
}

type PromptConfigAnalyticsDTO struct {
	TotalPromptRequests int64   `json:"totalPromptRequests"`
	ModelsCost          float64 `json:"modelsCost"`
}

type PromptConfigTestDTO struct {
	ModelParameters        json.RawMessage `json:"modelParameters" validate:"required"`
	ModelType              db.ModelType    `json:"modelType"       validate:"oneof=gpt-3.5-turbo gpt-3.5-turbo-16k gpt-4 gpt-4-32k"`
	ModelVendor            db.ModelVendor  `json:"modelVendor"     validate:"oneof=OPEN_AI"`
	ProviderPromptMessages json.RawMessage `json:"promptMessages"  validate:"required"`
}
