-- name: CheckUserExists :one
SELECT EXISTS(SELECT 1 FROM "user" WHERE firebase_id = $1);

-- name: CreateUser :one
INSERT INTO "user" (firebase_id)
VALUES ($1)
RETURNING *;

-- name: FindUserByFirebaseId :one
SELECT
    id,
    firebase_id,
    created_at
FROM "user"
WHERE firebase_id = $1;

-- name: FindProjectsByUserId :many
SELECT
    p.created_at,
    p.description,
    p.id,
    p.name,
    up.is_user_default_project,
    up.permission
FROM project AS p
INNER JOIN user_project AS up ON p.id = up.project_id
WHERE up.user_id = $1;

-- name: CreateProject :one
INSERT INTO project (name, description)
VALUES ($1, $2)
RETURNING *;

-- name: CreateUserProject :one
INSERT INTO user_project (
    user_id, project_id, permission, is_user_default_project
)
VALUES ($1, $2, $3, $4)
RETURNING *;

-- name: DeleteUser :exec
DELETE
FROM "user"
WHERE firebase_id = $1;

-- name: DeleteUserProject :exec
DELETE
FROM "user_project"
WHERE project_id = $1;

-- name: DeleteProject :exec
DELETE
FROM "project"
WHERE id = $1;

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
WHERE id = $1
RETURNING *;

-- name: DeleteApplication :exec
DELETE
FROM application
WHERE id = $1;

-- name: FindApplicationById :one
SELECT * -- noqa: L044
FROM application
WHERE id = $1;

-- name: CreatePromptConfig :one
INSERT INTO prompt_config (
    name,
    model_parameters,
    model_type,
    model_vendor,
    prompt_messages,
    template_variables,
    is_default,
    application_id
)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
RETURNING *;

-- name: UpdatePromptConfigIsDefault :exec
UPDATE prompt_config
SET
    is_default = $2,
    updated_at = NOW()
WHERE id = $1;

-- name: UpdatePromptConfig :one
UPDATE prompt_config
SET
    name = $2,
    model_parameters = $3,
    model_type = $4,
    model_vendor = $5,
    prompt_messages = $6,
    template_variables = $7,
    is_default = $8,
    updated_at = NOW()
WHERE id = $1
RETURNING *;

-- name: DeletePromptConfig :exec
DELETE
FROM prompt_config
WHERE id = $1;

-- name: FindPromptConfigById :one
SELECT
    id,
    name,
    model_parameters,
    model_type,
    model_vendor,
    prompt_messages,
    template_variables,
    is_default,
    created_at,
    updated_at,
    application_id
FROM prompt_config
WHERE id = $1;

-- name: RetrieveApplicationPromptConfigs :many
SELECT
    id,
    name,
    model_parameters,
    model_type,
    model_vendor,
    prompt_messages,
    template_variables,
    is_default,
    created_at,
    updated_at,
    application_id
FROM prompt_config
WHERE application_id = $1;

-- name: FindDefaultPromptConfigByApplicationId :one
SELECT
    id,
    name,
    model_parameters,
    model_type,
    model_vendor,
    prompt_messages,
    template_variables,
    is_default,
    created_at,
    updated_at,
    application_id
FROM prompt_config
WHERE application_id = $1 AND is_default = TRUE;

-- name: CreatePromptRequestRecord :one
INSERT INTO prompt_request_record (
    is_stream_response,
    request_tokens,
    start_time,
    finish_time,
    prompt_config_id
)
VALUES ($1, $2, $3, $4, $5)
RETURNING *;

-- name: FindPromptRequestRecords :many
SELECT
    id,
    is_stream_response,
    request_tokens,
    start_time,
    finish_time,
    prompt_config_id
FROM prompt_request_record
WHERE prompt_config_id = $1
ORDER BY start_time DESC;

-- name: CreatePromptTest :one
INSERT INTO prompt_test (
    name,
    variable_values,
    response,
    created_at,
    prompt_request_record_id
)
VALUES ($1, $2, $3, $4, $5)
RETURNING *;

-- name: FindPromptTests :many
SELECT
    prc.finish_time,
    prc.request_tokens,
    prc.start_time,
    prc.is_stream_response,
    pt.created_at,
    pt.id,
    pt.name,
    pt.response,
    pt.variable_values
FROM prompt_test AS pt
LEFT JOIN prompt_request_record AS prc
    ON pt.prompt_request_record_id = prc.id
WHERE prc.prompt_config_id = $1
ORDER BY pt.created_at;
