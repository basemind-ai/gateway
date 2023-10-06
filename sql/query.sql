---- user_account

-- name: CheckUserAccountExists :one
SELECT EXISTS(SELECT 1 FROM user_account WHERE firebase_id = $1);

-- name: CreateUserAccount :one
INSERT INTO user_account (firebase_id)
VALUES ($1)
RETURNING *;

-- name: FindUserAccountData :many
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
    AND p.deleted_at IS NULL;


---- project

-- name: CreateProject :one
INSERT INTO project (name, description)
VALUES ($1, $2)
RETURNING *;

-- name: UpdateProject :one
UPDATE project
SET
    name = $2,
    description = $3,
    updated_at = NOW()
WHERE
    id = $1
    AND deleted_at IS NULL
RETURNING *;

-- name: DeleteProject :exec
UPDATE project
SET deleted_at = NOW()
WHERE id = $1;

---- user_project

-- name: CreateUserProject :one
INSERT INTO user_project (user_id, project_id, permission, is_user_default_project)
VALUES ($1, $2, $3, $4)
RETURNING *;

-- name: UpdateUserProjectPermission :one
UPDATE user_project
SET
    permission = $3,
    updated_at = NOW()
WHERE
    user_id = $1
    AND project_id = $2
RETURNING *;

-- name: UpdateUserDefaultProject :one
UPDATE user_project
SET
    is_user_default_project = $3,
    updated_at = NOW()
WHERE
    user_id = $1
    AND project_id = $2
RETURNING *;

---- application

-- name: CreateApplication :one
INSERT INTO application (
    project_id,
    name,
    description
)
VALUES ($1, $2, $3)
RETURNING *;

-- name: UpdateApplication :one
UPDATE application
SET
    name = $2,
    description = $3,
    updated_at = NOW()
WHERE
    id = $1
    AND deleted_at IS NULL
RETURNING *;

-- name: DeleteApplication :exec
UPDATE application
SET deleted_at = NOW()
WHERE id = $1;

-- name: FindApplicationById :one
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
    AND deleted_at IS NULL;

---- prompt config

-- name: CreatePromptConfig :one
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
RETURNING *;

-- name: CheckDefaultPromptConfigExistsForApplication :one
SELECT EXISTS(
    SELECT 1
    FROM prompt_config
    WHERE
        application_id = $1
        AND deleted_at IS NULL
        AND is_default = TRUE
);

-- name: UpdatePromptConfigIsDefault :exec
UPDATE prompt_config
SET
    is_default = $2,
    updated_at = NOW()
WHERE
    id = $1
    AND deleted_at IS NULL;

-- name: UpdatePromptConfig :one
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
RETURNING *;

-- name: DeletePromptConfig :exec
UPDATE prompt_config
SET deleted_at = NOW()
WHERE id = $1;

-- name: FindPromptConfigById :one
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
    AND deleted_at IS NULL;

-- name: FindApplicationPromptConfigs :many
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
    AND deleted_at IS NULL;

-- name: FindDefaultPromptConfigByApplicationId :one
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
    AND is_default = TRUE;

---- prompt request record

-- name: CreatePromptRequestRecord :one
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
RETURNING *;

---- token

-- name: CreateToken :one
INSERT INTO token (application_id, name)
VALUES ($1, $2)
RETURNING *;

-- name: RetrieveApplicationTokens :many
SELECT
    id,
    name,
    created_at
FROM token
WHERE
    application_id = $1
    AND deleted_at IS NULL
ORDER BY created_at;

-- name: DeleteToken :exec
UPDATE token
SET deleted_at = NOW()
WHERE id = $1;
