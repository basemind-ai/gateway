// Code generated by sqlc. DO NOT EDIT.
// versions:
//   sqlc v1.22.0

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
	AccessPermissionType AccessPermissionType `json:"accessPermissionType"`
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
	ModelType ModelType `json:"modelType"`
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
	ModelVendor ModelVendor `json:"modelVendor"`
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
	CreatedAt   pgtype.Timestamptz `json:"createdAt"`
	UpdatedAt   pgtype.Timestamptz `json:"updatedAt"`
	DeletedAt   pgtype.Timestamptz `json:"deletedAt"`
	ProjectID   pgtype.UUID        `json:"projectId"`
}

type Project struct {
	ID          pgtype.UUID        `json:"id"`
	Name        string             `json:"name"`
	Description string             `json:"description"`
	CreatedAt   pgtype.Timestamptz `json:"createdAt"`
	UpdatedAt   pgtype.Timestamptz `json:"updatedAt"`
	DeletedAt   pgtype.Timestamptz `json:"deletedAt"`
}

type PromptConfig struct {
	ID                        pgtype.UUID        `json:"id"`
	Name                      string             `json:"name"`
	ModelParameters           []byte             `json:"modelParameters"`
	ModelType                 ModelType          `json:"modelType"`
	ModelVendor               ModelVendor        `json:"modelVendor"`
	ProviderPromptMessages    []byte             `json:"providerPromptMessages"`
	ExpectedTemplateVariables []string           `json:"expectedTemplateVariables"`
	IsDefault                 bool               `json:"isDefault"`
	CreatedAt                 pgtype.Timestamptz `json:"createdAt"`
	UpdatedAt                 pgtype.Timestamptz `json:"updatedAt"`
	DeletedAt                 pgtype.Timestamptz `json:"deletedAt"`
	ApplicationID             pgtype.UUID        `json:"applicationId"`
}

type PromptRequestRecord struct {
	ID                    pgtype.UUID        `json:"id"`
	IsStreamResponse      bool               `json:"isStreamResponse"`
	RequestTokens         int32              `json:"requestTokens"`
	ResponseTokens        int32              `json:"responseTokens"`
	StartTime             pgtype.Timestamptz `json:"startTime"`
	FinishTime            pgtype.Timestamptz `json:"finishTime"`
	StreamResponseLatency pgtype.Int8        `json:"streamResponseLatency"`
	PromptConfigID        pgtype.UUID        `json:"promptConfigId"`
	ErrorLog              pgtype.Text        `json:"errorLog"`
	CreatedAt             pgtype.Timestamptz `json:"createdAt"`
	DeletedAt             pgtype.Timestamptz `json:"deletedAt"`
}

type PromptTest struct {
	ID                    pgtype.UUID        `json:"id"`
	Name                  string             `json:"name"`
	VariableValues        []byte             `json:"variableValues"`
	Response              string             `json:"response"`
	CreatedAt             pgtype.Timestamptz `json:"createdAt"`
	PromptRequestRecordID pgtype.UUID        `json:"promptRequestRecordId"`
}

type Token struct {
	ID            pgtype.UUID        `json:"id"`
	CreatedAt     pgtype.Timestamptz `json:"createdAt"`
	DeletedAt     pgtype.Timestamptz `json:"deletedAt"`
	ApplicationID pgtype.UUID        `json:"applicationId"`
}

type UserAccount struct {
	ID         pgtype.UUID        `json:"id"`
	FirebaseID string             `json:"firebaseId"`
	CreatedAt  pgtype.Timestamptz `json:"createdAt"`
}

type UserProject struct {
	UserID               pgtype.UUID          `json:"userId"`
	ProjectID            pgtype.UUID          `json:"projectId"`
	Permission           AccessPermissionType `json:"permission"`
	IsUserDefaultProject bool                 `json:"isUserDefaultProject"`
	CreatedAt            pgtype.Timestamptz   `json:"createdAt"`
	UpdatedAt            pgtype.Timestamptz   `json:"updatedAt"`
}
