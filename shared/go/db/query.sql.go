// Code generated by sqlc. DO NOT EDIT.
// versions:
//   sqlc v1.22.0
// source: query.sql

package db

import (
	"context"

	"github.com/jackc/pgx/v5/pgtype"
)

const checkDefaultPromptConfigExistsForApplication = `-- name: CheckDefaultPromptConfigExistsForApplication :one
SELECT EXISTS(
    SELECT 1
    FROM prompt_config
    WHERE
        application_id = $1
        AND deleted_at IS NULL
        AND is_default = TRUE
)
`

func (q *Queries) CheckDefaultPromptConfigExistsForApplication(ctx context.Context, applicationID pgtype.UUID) (bool, error) {
	row := q.db.QueryRow(ctx, checkDefaultPromptConfigExistsForApplication, applicationID)
	var exists bool
	err := row.Scan(&exists)
	return exists, err
}

const checkUserAccountExists = `-- name: CheckUserAccountExists :one

SELECT EXISTS(SELECT 1 FROM user_account WHERE firebase_id = $1)
`

// -- user_account
func (q *Queries) CheckUserAccountExists(ctx context.Context, firebaseID string) (bool, error) {
	row := q.db.QueryRow(ctx, checkUserAccountExists, firebaseID)
	var exists bool
	err := row.Scan(&exists)
	return exists, err
}

const createApplication = `-- name: CreateApplication :one

INSERT INTO application (
    project_id,
    name,
    description
)
VALUES ($1, $2, $3)
RETURNING id, description, name, created_at, updated_at, deleted_at, project_id
`

type CreateApplicationParams struct {
	ProjectID   pgtype.UUID `json:"projectId"`
	Name        string      `json:"name"`
	Description string      `json:"description"`
}

// -- application
func (q *Queries) CreateApplication(ctx context.Context, arg CreateApplicationParams) (Application, error) {
	row := q.db.QueryRow(ctx, createApplication, arg.ProjectID, arg.Name, arg.Description)
	var i Application
	err := row.Scan(
		&i.ID,
		&i.Description,
		&i.Name,
		&i.CreatedAt,
		&i.UpdatedAt,
		&i.DeletedAt,
		&i.ProjectID,
	)
	return i, err
}

const createProject = `-- name: CreateProject :one

INSERT INTO project (name, description)
VALUES ($1, $2)
RETURNING id, name, description, created_at, updated_at, deleted_at
`

type CreateProjectParams struct {
	Name        string `json:"name"`
	Description string `json:"description"`
}

// -- project
func (q *Queries) CreateProject(ctx context.Context, arg CreateProjectParams) (Project, error) {
	row := q.db.QueryRow(ctx, createProject, arg.Name, arg.Description)
	var i Project
	err := row.Scan(
		&i.ID,
		&i.Name,
		&i.Description,
		&i.CreatedAt,
		&i.UpdatedAt,
		&i.DeletedAt,
	)
	return i, err
}

const createPromptConfig = `-- name: CreatePromptConfig :one

INSERT INTO prompt_config (
    name,
    model_parameters,
    model_type,
    model_vendor,
    provider_prompt_messages,
    expected_template_variables,
    is_default,
    application_id
)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
RETURNING id, name, model_parameters, model_type, model_vendor, provider_prompt_messages, expected_template_variables, is_default, created_at, updated_at, deleted_at, application_id
`

type CreatePromptConfigParams struct {
	Name                      string      `json:"name"`
	ModelParameters           []byte      `json:"modelParameters"`
	ModelType                 ModelType   `json:"modelType"`
	ModelVendor               ModelVendor `json:"modelVendor"`
	ProviderPromptMessages    []byte      `json:"providerPromptMessages"`
	ExpectedTemplateVariables []string    `json:"expectedTemplateVariables"`
	IsDefault                 bool        `json:"isDefault"`
	ApplicationID             pgtype.UUID `json:"applicationId"`
}

// -- prompt config
func (q *Queries) CreatePromptConfig(ctx context.Context, arg CreatePromptConfigParams) (PromptConfig, error) {
	row := q.db.QueryRow(ctx, createPromptConfig,
		arg.Name,
		arg.ModelParameters,
		arg.ModelType,
		arg.ModelVendor,
		arg.ProviderPromptMessages,
		arg.ExpectedTemplateVariables,
		arg.IsDefault,
		arg.ApplicationID,
	)
	var i PromptConfig
	err := row.Scan(
		&i.ID,
		&i.Name,
		&i.ModelParameters,
		&i.ModelType,
		&i.ModelVendor,
		&i.ProviderPromptMessages,
		&i.ExpectedTemplateVariables,
		&i.IsDefault,
		&i.CreatedAt,
		&i.UpdatedAt,
		&i.DeletedAt,
		&i.ApplicationID,
	)
	return i, err
}

const createPromptRequestRecord = `-- name: CreatePromptRequestRecord :one

INSERT INTO prompt_request_record (
    is_stream_response,
    request_tokens,
    response_tokens,
    start_time,
    finish_time,
    stream_response_latency,
    prompt_config_id,
    error_log
)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
RETURNING id, is_stream_response, request_tokens, response_tokens, start_time, finish_time, stream_response_latency, prompt_config_id, error_log, created_at, deleted_at
`

type CreatePromptRequestRecordParams struct {
	IsStreamResponse      bool               `json:"isStreamResponse"`
	RequestTokens         int32              `json:"requestTokens"`
	ResponseTokens        int32              `json:"responseTokens"`
	StartTime             pgtype.Timestamptz `json:"startTime"`
	FinishTime            pgtype.Timestamptz `json:"finishTime"`
	StreamResponseLatency pgtype.Int8        `json:"streamResponseLatency"`
	PromptConfigID        pgtype.UUID        `json:"promptConfigId"`
	ErrorLog              pgtype.Text        `json:"errorLog"`
}

// -- prompt request record
func (q *Queries) CreatePromptRequestRecord(ctx context.Context, arg CreatePromptRequestRecordParams) (PromptRequestRecord, error) {
	row := q.db.QueryRow(ctx, createPromptRequestRecord,
		arg.IsStreamResponse,
		arg.RequestTokens,
		arg.ResponseTokens,
		arg.StartTime,
		arg.FinishTime,
		arg.StreamResponseLatency,
		arg.PromptConfigID,
		arg.ErrorLog,
	)
	var i PromptRequestRecord
	err := row.Scan(
		&i.ID,
		&i.IsStreamResponse,
		&i.RequestTokens,
		&i.ResponseTokens,
		&i.StartTime,
		&i.FinishTime,
		&i.StreamResponseLatency,
		&i.PromptConfigID,
		&i.ErrorLog,
		&i.CreatedAt,
		&i.DeletedAt,
	)
	return i, err
}

const createToken = `-- name: CreateToken :one

INSERT INTO token (application_id, name)
VALUES ($1, $2)
RETURNING id, name, created_at, deleted_at, application_id
`

type CreateTokenParams struct {
	ApplicationID pgtype.UUID `json:"applicationId"`
	Name          string      `json:"name"`
}

// -- token
func (q *Queries) CreateToken(ctx context.Context, arg CreateTokenParams) (Token, error) {
	row := q.db.QueryRow(ctx, createToken, arg.ApplicationID, arg.Name)
	var i Token
	err := row.Scan(
		&i.ID,
		&i.Name,
		&i.CreatedAt,
		&i.DeletedAt,
		&i.ApplicationID,
	)
	return i, err
}

const createUserAccount = `-- name: CreateUserAccount :one
INSERT INTO user_account (firebase_id)
VALUES ($1)
RETURNING id, firebase_id, created_at
`

func (q *Queries) CreateUserAccount(ctx context.Context, firebaseID string) (UserAccount, error) {
	row := q.db.QueryRow(ctx, createUserAccount, firebaseID)
	var i UserAccount
	err := row.Scan(&i.ID, &i.FirebaseID, &i.CreatedAt)
	return i, err
}

const createUserProject = `-- name: CreateUserProject :one

INSERT INTO user_project (user_id, project_id, permission, is_user_default_project)
VALUES ($1, $2, $3, $4)
RETURNING user_id, project_id, permission, is_user_default_project, created_at, updated_at
`

type CreateUserProjectParams struct {
	UserID               pgtype.UUID          `json:"userId"`
	ProjectID            pgtype.UUID          `json:"projectId"`
	Permission           AccessPermissionType `json:"permission"`
	IsUserDefaultProject bool                 `json:"isUserDefaultProject"`
}

// -- user_project
func (q *Queries) CreateUserProject(ctx context.Context, arg CreateUserProjectParams) (UserProject, error) {
	row := q.db.QueryRow(ctx, createUserProject,
		arg.UserID,
		arg.ProjectID,
		arg.Permission,
		arg.IsUserDefaultProject,
	)
	var i UserProject
	err := row.Scan(
		&i.UserID,
		&i.ProjectID,
		&i.Permission,
		&i.IsUserDefaultProject,
		&i.CreatedAt,
		&i.UpdatedAt,
	)
	return i, err
}

const deleteApplication = `-- name: DeleteApplication :exec
UPDATE application
SET deleted_at = NOW()
WHERE id = $1
`

func (q *Queries) DeleteApplication(ctx context.Context, id pgtype.UUID) error {
	_, err := q.db.Exec(ctx, deleteApplication, id)
	return err
}

const deleteProject = `-- name: DeleteProject :exec
UPDATE project
SET deleted_at = NOW()
WHERE id = $1
`

func (q *Queries) DeleteProject(ctx context.Context, id pgtype.UUID) error {
	_, err := q.db.Exec(ctx, deleteProject, id)
	return err
}

const deletePromptConfig = `-- name: DeletePromptConfig :exec
UPDATE prompt_config
SET deleted_at = NOW()
WHERE id = $1
`

func (q *Queries) DeletePromptConfig(ctx context.Context, id pgtype.UUID) error {
	_, err := q.db.Exec(ctx, deletePromptConfig, id)
	return err
}

const deleteToken = `-- name: DeleteToken :exec
UPDATE token
SET deleted_at = NOW()
WHERE id = $1
`

func (q *Queries) DeleteToken(ctx context.Context, id pgtype.UUID) error {
	_, err := q.db.Exec(ctx, deleteToken, id)
	return err
}

const findApplicationById = `-- name: FindApplicationById :one
SELECT
    id,
    description,
    name,
    created_at,
    updated_at,
    project_id
FROM application
WHERE
    id = $1
    AND deleted_at IS NULL
`

type FindApplicationByIdRow struct {
	ID          pgtype.UUID        `json:"id"`
	Description string             `json:"description"`
	Name        string             `json:"name"`
	CreatedAt   pgtype.Timestamptz `json:"createdAt"`
	UpdatedAt   pgtype.Timestamptz `json:"updatedAt"`
	ProjectID   pgtype.UUID        `json:"projectId"`
}

func (q *Queries) FindApplicationById(ctx context.Context, id pgtype.UUID) (FindApplicationByIdRow, error) {
	row := q.db.QueryRow(ctx, findApplicationById, id)
	var i FindApplicationByIdRow
	err := row.Scan(
		&i.ID,
		&i.Description,
		&i.Name,
		&i.CreatedAt,
		&i.UpdatedAt,
		&i.ProjectID,
	)
	return i, err
}

const findApplicationPromptConfigs = `-- name: FindApplicationPromptConfigs :many
SELECT
    id,
    name,
    model_parameters,
    model_type,
    model_vendor,
    provider_prompt_messages,
    expected_template_variables,
    is_default,
    created_at,
    updated_at,
    application_id
FROM prompt_config
WHERE
    application_id = $1
    AND deleted_at IS NULL
`

type FindApplicationPromptConfigsRow struct {
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
	ApplicationID             pgtype.UUID        `json:"applicationId"`
}

func (q *Queries) FindApplicationPromptConfigs(ctx context.Context, applicationID pgtype.UUID) ([]FindApplicationPromptConfigsRow, error) {
	rows, err := q.db.Query(ctx, findApplicationPromptConfigs, applicationID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var items []FindApplicationPromptConfigsRow
	for rows.Next() {
		var i FindApplicationPromptConfigsRow
		if err := rows.Scan(
			&i.ID,
			&i.Name,
			&i.ModelParameters,
			&i.ModelType,
			&i.ModelVendor,
			&i.ProviderPromptMessages,
			&i.ExpectedTemplateVariables,
			&i.IsDefault,
			&i.CreatedAt,
			&i.UpdatedAt,
			&i.ApplicationID,
		); err != nil {
			return nil, err
		}
		items = append(items, i)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return items, nil
}

const findDefaultPromptConfigByApplicationId = `-- name: FindDefaultPromptConfigByApplicationId :one
SELECT
    id,
    name,
    model_parameters,
    model_type,
    model_vendor,
    provider_prompt_messages,
    expected_template_variables,
    is_default,
    created_at,
    updated_at,
    application_id
FROM prompt_config
WHERE
    application_id = $1
    AND deleted_at IS NULL
    AND is_default = TRUE
`

type FindDefaultPromptConfigByApplicationIdRow struct {
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
	ApplicationID             pgtype.UUID        `json:"applicationId"`
}

func (q *Queries) FindDefaultPromptConfigByApplicationId(ctx context.Context, applicationID pgtype.UUID) (FindDefaultPromptConfigByApplicationIdRow, error) {
	row := q.db.QueryRow(ctx, findDefaultPromptConfigByApplicationId, applicationID)
	var i FindDefaultPromptConfigByApplicationIdRow
	err := row.Scan(
		&i.ID,
		&i.Name,
		&i.ModelParameters,
		&i.ModelType,
		&i.ModelVendor,
		&i.ProviderPromptMessages,
		&i.ExpectedTemplateVariables,
		&i.IsDefault,
		&i.CreatedAt,
		&i.UpdatedAt,
		&i.ApplicationID,
	)
	return i, err
}

const findPromptConfigById = `-- name: FindPromptConfigById :one
SELECT
    id,
    name,
    model_parameters,
    model_type,
    model_vendor,
    provider_prompt_messages,
    expected_template_variables,
    is_default,
    created_at,
    updated_at,
    application_id
FROM prompt_config
WHERE
    id = $1
    AND deleted_at IS NULL
`

type FindPromptConfigByIdRow struct {
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
	ApplicationID             pgtype.UUID        `json:"applicationId"`
}

func (q *Queries) FindPromptConfigById(ctx context.Context, id pgtype.UUID) (FindPromptConfigByIdRow, error) {
	row := q.db.QueryRow(ctx, findPromptConfigById, id)
	var i FindPromptConfigByIdRow
	err := row.Scan(
		&i.ID,
		&i.Name,
		&i.ModelParameters,
		&i.ModelType,
		&i.ModelVendor,
		&i.ProviderPromptMessages,
		&i.ExpectedTemplateVariables,
		&i.IsDefault,
		&i.CreatedAt,
		&i.UpdatedAt,
		&i.ApplicationID,
	)
	return i, err
}

const findUserAccountData = `-- name: FindUserAccountData :many
SELECT
    u.id AS user_id,
    u.firebase_id,
    u.created_at AS user_created_at,
    up.is_user_default_project,
    up.permission,
    p.id AS project_id,
    p.created_at AS project_created_at,
    p.name AS project_name,
    p.description AS project_description,
    a.id AS application_id,
    a.name AS application_name,
    a.description AS application_description,
    a.created_at AS application_created_at,
    a.updated_at AS application_updated_at
FROM user_account AS u
LEFT JOIN user_project AS up ON u.id = up.user_id
LEFT JOIN project AS p ON up.project_id = p.id
LEFT JOIN application AS a ON p.id = a.project_id
WHERE
    u.firebase_id = $1
    AND p.deleted_at IS NULL
`

type FindUserAccountDataRow struct {
	UserID                 pgtype.UUID              `json:"userId"`
	FirebaseID             string                   `json:"firebaseId"`
	UserCreatedAt          pgtype.Timestamptz       `json:"userCreatedAt"`
	IsUserDefaultProject   pgtype.Bool              `json:"isUserDefaultProject"`
	Permission             NullAccessPermissionType `json:"permission"`
	ProjectID              pgtype.UUID              `json:"projectId"`
	ProjectCreatedAt       pgtype.Timestamptz       `json:"projectCreatedAt"`
	ProjectName            pgtype.Text              `json:"projectName"`
	ProjectDescription     pgtype.Text              `json:"projectDescription"`
	ApplicationID          pgtype.UUID              `json:"applicationId"`
	ApplicationName        pgtype.Text              `json:"applicationName"`
	ApplicationDescription pgtype.Text              `json:"applicationDescription"`
	ApplicationCreatedAt   pgtype.Timestamptz       `json:"applicationCreatedAt"`
	ApplicationUpdatedAt   pgtype.Timestamptz       `json:"applicationUpdatedAt"`
}

func (q *Queries) FindUserAccountData(ctx context.Context, firebaseID string) ([]FindUserAccountDataRow, error) {
	rows, err := q.db.Query(ctx, findUserAccountData, firebaseID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var items []FindUserAccountDataRow
	for rows.Next() {
		var i FindUserAccountDataRow
		if err := rows.Scan(
			&i.UserID,
			&i.FirebaseID,
			&i.UserCreatedAt,
			&i.IsUserDefaultProject,
			&i.Permission,
			&i.ProjectID,
			&i.ProjectCreatedAt,
			&i.ProjectName,
			&i.ProjectDescription,
			&i.ApplicationID,
			&i.ApplicationName,
			&i.ApplicationDescription,
			&i.ApplicationCreatedAt,
			&i.ApplicationUpdatedAt,
		); err != nil {
			return nil, err
		}
		items = append(items, i)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return items, nil
}

const retrieveApplicationTokens = `-- name: RetrieveApplicationTokens :many
SELECT
    id,
    name,
    created_at
FROM token
WHERE
    application_id = $1
    AND deleted_at IS NULL
ORDER BY created_at
`

type RetrieveApplicationTokensRow struct {
	ID        pgtype.UUID        `json:"id"`
	Name      string             `json:"name"`
	CreatedAt pgtype.Timestamptz `json:"createdAt"`
}

func (q *Queries) RetrieveApplicationTokens(ctx context.Context, applicationID pgtype.UUID) ([]RetrieveApplicationTokensRow, error) {
	rows, err := q.db.Query(ctx, retrieveApplicationTokens, applicationID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var items []RetrieveApplicationTokensRow
	for rows.Next() {
		var i RetrieveApplicationTokensRow
		if err := rows.Scan(&i.ID, &i.Name, &i.CreatedAt); err != nil {
			return nil, err
		}
		items = append(items, i)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return items, nil
}

const updateApplication = `-- name: UpdateApplication :one
UPDATE application
SET
    name = $2,
    description = $3,
    updated_at = NOW()
WHERE
    id = $1
    AND deleted_at IS NULL
RETURNING id, description, name, created_at, updated_at, deleted_at, project_id
`

type UpdateApplicationParams struct {
	ID          pgtype.UUID `json:"id"`
	Name        string      `json:"name"`
	Description string      `json:"description"`
}

func (q *Queries) UpdateApplication(ctx context.Context, arg UpdateApplicationParams) (Application, error) {
	row := q.db.QueryRow(ctx, updateApplication, arg.ID, arg.Name, arg.Description)
	var i Application
	err := row.Scan(
		&i.ID,
		&i.Description,
		&i.Name,
		&i.CreatedAt,
		&i.UpdatedAt,
		&i.DeletedAt,
		&i.ProjectID,
	)
	return i, err
}

const updateProject = `-- name: UpdateProject :one
UPDATE project
SET
    name = $2,
    description = $3,
    updated_at = NOW()
WHERE
    id = $1
    AND deleted_at IS NULL
RETURNING id, name, description, created_at, updated_at, deleted_at
`

type UpdateProjectParams struct {
	ID          pgtype.UUID `json:"id"`
	Name        string      `json:"name"`
	Description string      `json:"description"`
}

func (q *Queries) UpdateProject(ctx context.Context, arg UpdateProjectParams) (Project, error) {
	row := q.db.QueryRow(ctx, updateProject, arg.ID, arg.Name, arg.Description)
	var i Project
	err := row.Scan(
		&i.ID,
		&i.Name,
		&i.Description,
		&i.CreatedAt,
		&i.UpdatedAt,
		&i.DeletedAt,
	)
	return i, err
}

const updatePromptConfig = `-- name: UpdatePromptConfig :one
UPDATE prompt_config
SET
    name = $2,
    model_parameters = $3,
    model_type = $4,
    model_vendor = $5,
    provider_prompt_messages = $6,
    expected_template_variables = $7,
    updated_at = NOW()
WHERE
    id = $1
    AND deleted_at IS NULL
RETURNING id, name, model_parameters, model_type, model_vendor, provider_prompt_messages, expected_template_variables, is_default, created_at, updated_at, deleted_at, application_id
`

type UpdatePromptConfigParams struct {
	ID                        pgtype.UUID `json:"id"`
	Name                      string      `json:"name"`
	ModelParameters           []byte      `json:"modelParameters"`
	ModelType                 ModelType   `json:"modelType"`
	ModelVendor               ModelVendor `json:"modelVendor"`
	ProviderPromptMessages    []byte      `json:"providerPromptMessages"`
	ExpectedTemplateVariables []string    `json:"expectedTemplateVariables"`
}

func (q *Queries) UpdatePromptConfig(ctx context.Context, arg UpdatePromptConfigParams) (PromptConfig, error) {
	row := q.db.QueryRow(ctx, updatePromptConfig,
		arg.ID,
		arg.Name,
		arg.ModelParameters,
		arg.ModelType,
		arg.ModelVendor,
		arg.ProviderPromptMessages,
		arg.ExpectedTemplateVariables,
	)
	var i PromptConfig
	err := row.Scan(
		&i.ID,
		&i.Name,
		&i.ModelParameters,
		&i.ModelType,
		&i.ModelVendor,
		&i.ProviderPromptMessages,
		&i.ExpectedTemplateVariables,
		&i.IsDefault,
		&i.CreatedAt,
		&i.UpdatedAt,
		&i.DeletedAt,
		&i.ApplicationID,
	)
	return i, err
}

const updatePromptConfigIsDefault = `-- name: UpdatePromptConfigIsDefault :exec
UPDATE prompt_config
SET
    is_default = $2,
    updated_at = NOW()
WHERE
    id = $1
    AND deleted_at IS NULL
`

type UpdatePromptConfigIsDefaultParams struct {
	ID        pgtype.UUID `json:"id"`
	IsDefault bool        `json:"isDefault"`
}

func (q *Queries) UpdatePromptConfigIsDefault(ctx context.Context, arg UpdatePromptConfigIsDefaultParams) error {
	_, err := q.db.Exec(ctx, updatePromptConfigIsDefault, arg.ID, arg.IsDefault)
	return err
}

const updateUserDefaultProject = `-- name: UpdateUserDefaultProject :one
UPDATE user_project
SET
    is_user_default_project = $3,
    updated_at = NOW()
WHERE
    user_id = $1
    AND project_id = $2
RETURNING user_id, project_id, permission, is_user_default_project, created_at, updated_at
`

type UpdateUserDefaultProjectParams struct {
	UserID               pgtype.UUID `json:"userId"`
	ProjectID            pgtype.UUID `json:"projectId"`
	IsUserDefaultProject bool        `json:"isUserDefaultProject"`
}

func (q *Queries) UpdateUserDefaultProject(ctx context.Context, arg UpdateUserDefaultProjectParams) (UserProject, error) {
	row := q.db.QueryRow(ctx, updateUserDefaultProject, arg.UserID, arg.ProjectID, arg.IsUserDefaultProject)
	var i UserProject
	err := row.Scan(
		&i.UserID,
		&i.ProjectID,
		&i.Permission,
		&i.IsUserDefaultProject,
		&i.CreatedAt,
		&i.UpdatedAt,
	)
	return i, err
}

const updateUserProjectPermission = `-- name: UpdateUserProjectPermission :one
UPDATE user_project
SET
    permission = $3,
    updated_at = NOW()
WHERE
    user_id = $1
    AND project_id = $2
RETURNING user_id, project_id, permission, is_user_default_project, created_at, updated_at
`

type UpdateUserProjectPermissionParams struct {
	UserID     pgtype.UUID          `json:"userId"`
	ProjectID  pgtype.UUID          `json:"projectId"`
	Permission AccessPermissionType `json:"permission"`
}

func (q *Queries) UpdateUserProjectPermission(ctx context.Context, arg UpdateUserProjectPermissionParams) (UserProject, error) {
	row := q.db.QueryRow(ctx, updateUserProjectPermission, arg.UserID, arg.ProjectID, arg.Permission)
	var i UserProject
	err := row.Scan(
		&i.UserID,
		&i.ProjectID,
		&i.Permission,
		&i.IsUserDefaultProject,
		&i.CreatedAt,
		&i.UpdatedAt,
	)
	return i, err
}
