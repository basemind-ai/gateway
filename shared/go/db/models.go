// Code generated by sqlc. DO NOT EDIT.
// versions:
//   sqlc v1.20.0

package db

import (
	"database/sql/driver"
	"fmt"

	"github.com/jackc/pgx/v5/pgtype"
)

type AccessPermissionType string

const (
	AccessPermissionTypeADMIN  AccessPermissionType = "ADMIN"
	AccessPermissionTypeMEMBER AccessPermissionType = "MEMBER"
)

func (e *AccessPermissionType) Scan(src interface{}) error {
	switch s := src.(type) {
	case []byte:
		*e = AccessPermissionType(s)
	case string:
		*e = AccessPermissionType(s)
	default:
		return fmt.Errorf("unsupported scan type for AccessPermissionType: %T", src)
	}
	return nil
}

type NullAccessPermissionType struct {
	AccessPermissionType AccessPermissionType `json:"access_permission_type"`
	Valid                bool                 `json:"valid"` // Valid is true if AccessPermissionType is not NULL
}

// Scan implements the Scanner interface.
func (ns *NullAccessPermissionType) Scan(value interface{}) error {
	if value == nil {
		ns.AccessPermissionType, ns.Valid = "", false
		return nil
	}
	ns.Valid = true
	return ns.AccessPermissionType.Scan(value)
}

// Value implements the driver Valuer interface.
func (ns NullAccessPermissionType) Value() (driver.Value, error) {
	if !ns.Valid {
		return nil, nil
	}
	return string(ns.AccessPermissionType), nil
}

type ModelType string

const (
	ModelTypeGpt35Turbo    ModelType = "gpt-3.5-turbo"
	ModelTypeGpt35Turbo16k ModelType = "gpt-3.5-turbo-16k"
	ModelTypeGpt4          ModelType = "gpt-4"
	ModelTypeGpt432k       ModelType = "gpt-4-32k"
)

func (e *ModelType) Scan(src interface{}) error {
	switch s := src.(type) {
	case []byte:
		*e = ModelType(s)
	case string:
		*e = ModelType(s)
	default:
		return fmt.Errorf("unsupported scan type for ModelType: %T", src)
	}
	return nil
}

type NullModelType struct {
	ModelType ModelType `json:"model_type"`
	Valid     bool      `json:"valid"` // Valid is true if ModelType is not NULL
}

// Scan implements the Scanner interface.
func (ns *NullModelType) Scan(value interface{}) error {
	if value == nil {
		ns.ModelType, ns.Valid = "", false
		return nil
	}
	ns.Valid = true
	return ns.ModelType.Scan(value)
}

// Value implements the driver Valuer interface.
func (ns NullModelType) Value() (driver.Value, error) {
	if !ns.Valid {
		return nil, nil
	}
	return string(ns.ModelType), nil
}

type ModelVendor string

const (
	ModelVendorOPENAI ModelVendor = "OPEN_AI"
)

func (e *ModelVendor) Scan(src interface{}) error {
	switch s := src.(type) {
	case []byte:
		*e = ModelVendor(s)
	case string:
		*e = ModelVendor(s)
	default:
		return fmt.Errorf("unsupported scan type for ModelVendor: %T", src)
	}
	return nil
}

type NullModelVendor struct {
	ModelVendor ModelVendor `json:"model_vendor"`
	Valid       bool        `json:"valid"` // Valid is true if ModelVendor is not NULL
}

// Scan implements the Scanner interface.
func (ns *NullModelVendor) Scan(value interface{}) error {
	if value == nil {
		ns.ModelVendor, ns.Valid = "", false
		return nil
	}
	ns.Valid = true
	return ns.ModelVendor.Scan(value)
}

// Value implements the driver Valuer interface.
func (ns NullModelVendor) Value() (driver.Value, error) {
	if !ns.Valid {
		return nil, nil
	}
	return string(ns.ModelVendor), nil
}

type Application struct {
	ID          pgtype.UUID        `json:"id"`
	Description string             `json:"description"`
	Name        string             `json:"name"`
	CreatedAt   pgtype.Timestamptz `json:"created_at"`
	UpdatedAt   pgtype.Timestamptz `json:"updated_at"`
	ProjectID   pgtype.UUID        `json:"project_id"`
}

type Project struct {
	ID          pgtype.UUID        `json:"id"`
	Name        string             `json:"name"`
	Description string             `json:"description"`
	CreatedAt   pgtype.Timestamptz `json:"created_at"`
}

type PromptConfig struct {
	ID                pgtype.UUID        `json:"id"`
	Name              string             `json:"name"`
	ModelParameters   []byte             `json:"model_parameters"`
	ModelType         ModelType          `json:"model_type"`
	ModelVendor       ModelVendor        `json:"model_vendor"`
	PromptMessages    []byte             `json:"prompt_messages"`
	TemplateVariables []string           `json:"template_variables"`
	IsActive          bool               `json:"is_active"`
	CreatedAt         pgtype.Timestamptz `json:"created_at"`
	UpdatedAt         pgtype.Timestamptz `json:"updated_at"`
	ApplicationID     pgtype.UUID        `json:"application_id"`
}

type PromptRequestRecord struct {
	ID               pgtype.UUID        `json:"id"`
	IsStreamResponse bool               `json:"is_stream_response"`
	RequestTokens    int32              `json:"request_tokens"`
	StartTime        pgtype.Timestamptz `json:"start_time"`
	FinishTime       pgtype.Timestamptz `json:"finish_time"`
	PromptConfigID   pgtype.UUID        `json:"prompt_config_id"`
}

type PromptTest struct {
	ID                    pgtype.UUID        `json:"id"`
	Name                  string             `json:"name"`
	VariableValues        []byte             `json:"variable_values"`
	Response              string             `json:"response"`
	CreatedAt             pgtype.Timestamptz `json:"created_at"`
	PromptRequestRecordID pgtype.UUID        `json:"prompt_request_record_id"`
}

type User struct {
	ID         pgtype.UUID        `json:"id"`
	FirebaseID string             `json:"firebase_id"`
	CreatedAt  pgtype.Timestamptz `json:"created_at"`
}

type UserProject struct {
	UserID               pgtype.UUID          `json:"user_id"`
	ProjectID            pgtype.UUID          `json:"project_id"`
	Permission           AccessPermissionType `json:"permission"`
	IsUserDefaultProject bool                 `json:"is_user_default_project"`
}
